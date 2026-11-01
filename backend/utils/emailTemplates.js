const money = (amount, currency = "INR") =>
  `${currency === "INR" ? "Rs." : currency} ${Number(amount || 0).toFixed(2)}`;

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);

const welcomeEmail = (name, otp) => ({
  text:
    `Welcome to ShopNow, ${name}!\n\n` +
    `Your verification code is: ${otp}\n` +
    `It expires in 10 minutes.\n\n` +
    `If you did not create this account you can ignore this email.`,
  html:
    `<h2>Welcome to ShopNow, ${escapeHtml(name)}!</h2>` +
    `<p>Your verification code is:</p>` +
    `<p style="font-size:24px;letter-spacing:4px;font-weight:bold">${escapeHtml(otp)}</p>` +
    `<p>It expires in 10 minutes.</p>` +
    `<p style="color:#71717a;font-size:12px">If you did not create this account you can ignore this email.</p>`,
});

const orderConfirmationEmail = (order, userName) => {
  const lines = order.items
    .map((i) => `  - ${i.name || i.productId} x${i.qty} @ ${money(i.price, order.currency)}`)
    .join("\n");

  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 12px 6px 0">${escapeHtml(i.name || i.productId)}</td>` +
        `<td style="padding:6px 12px 6px 0">x${i.qty}</td>` +
        `<td style="padding:6px 0">${money(i.price, order.currency)}</td></tr>`,
    )
    .join("");

  return {
    text:
      `Order Confirmation\n\n` +
      `Hello ${userName},\n\n` +
      `Your order has been placed. Order ID: ${order._id}\n\n` +
      `Items:\n${lines}\n\n` +
      `Total paid: ${money(order.totalAmount, order.currency)}\n\n` +
      `Shipping to: ${order.address.street}, ${order.address.city} ` +
      `${order.address.postalCode}, ${order.address.country}\n\n` +
      `Thank you for shopping with ShopNow!`,
    html:
      `<h2>Order Confirmation</h2>` +
      `<p>Hello ${escapeHtml(userName)},</p>` +
      `<p>Your order has been successfully placed! Order ID: <strong>${order._id}</strong></p>` +
      `<table style="border-collapse:collapse">${rows}</table>` +
      `<p><strong>Total paid: ${money(order.totalAmount, order.currency)}</strong></p>` +
      `<p>It will be shipped to: ${escapeHtml(order.address.street)}, ` +
      `${escapeHtml(order.address.city)} ${escapeHtml(order.address.postalCode)}, ` +
      `${escapeHtml(order.address.country)}</p>` +
      `<p>Thank you for shopping with ShopNow!</p>`,
  };
};

module.exports = { welcomeEmail, orderConfirmationEmail };
