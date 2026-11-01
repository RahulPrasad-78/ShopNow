const Product = require("../model/Product");
const { AppError } = require("./AppError");

/**
 * Re-prices a client-supplied cart against the database.
 *
 * The client is only ever trusted for INTENT ({ productId, qty }). Every
 * price and the order total are computed here from stored product data, so a
 * tampered `price` or `totalAmount` in the request body has no effect.
 */
const priceCart = async (rawItems) => {
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new AppError("No order items", 400);
  }
  if (rawItems.length > 100) {
    throw new AppError("Too many items in one order", 400);
  }

  // Merge duplicate lines for the same product and coerce quantities to
  // positive integers, so "qty": -5 or "qty": 1.7 cannot reach the total.
  const wanted = new Map();
  for (const item of rawItems) {
    const id = String(item?.productId || "");
    if (!id.match(/^[a-f\d]{24}$/i)) {
      throw new AppError(`Invalid productId: ${id || "(missing)"}`, 400);
    }
    const qty = Number.parseInt(item?.qty, 10);
    if (!Number.isInteger(qty) || qty < 1 || qty > 1000) {
      throw new AppError(`Invalid qty for product ${id}`, 400);
    }
    wanted.set(id, (wanted.get(id) || 0) + qty);
  }

  const ids = [...wanted.keys()];
  const products = await Product.find({ _id: { $in: ids } }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const items = [];
  let totalAmount = 0;

  for (const [id, qty] of wanted) {
    const product = byId.get(id);
    if (!product) {
      throw new AppError(`Product no longer available: ${id}`, 400);
    }
    if (product.stock < qty) {
      throw new AppError(
        `Only ${product.stock} left of "${product.name}"`,
        409,
      );
    }
    totalAmount += product.price * qty;
    items.push({
      productId: product._id,
      name: product.name,
      imageUrl: product.imageUrl,
      qty,
      price: product.price,
    });
  }

  // Money is kept to 2dp to avoid float drift leaking into the gateway call.
  totalAmount = Math.round(totalAmount * 100) / 100;

  if (totalAmount <= 0) {
    throw new AppError("Order total must be greater than zero", 400);
  }

  return { items, totalAmount };
};

/**
 * Decrements stock atomically, one conditional update per line.
 *
 * The filter and the update are evaluated together by MongoDB, so two
 * concurrent buyers of the last unit cannot both succeed - unlike a
 * read-check-write in application code. If any line fails, the lines already
 * applied are compensated back so the operation is all-or-nothing.
 *
 * A multi-document transaction would be stricter, but requires a replica set;
 * this works on a standalone mongod too.
 */
const applyStock = async (items) => {
  const applied = [];
  for (const item of items) {
    const result = await Product.updateOne(
      { _id: item.productId, stock: { $gte: item.qty } },
      { $inc: { stock: -item.qty } },
    );
    if (result.modifiedCount === 0) {
      await restoreStock(applied);
      throw new AppError(`"${item.name}" just went out of stock`, 409);
    }
    applied.push(item);
  }
  return applied;
};

const restoreStock = async (items) => {
  if (!items || items.length === 0) return;
  await Promise.all(
    items.map((item) =>
      Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.qty } },
      ),
    ),
  );
};

module.exports = { priceCart, applyStock, restoreStock };
