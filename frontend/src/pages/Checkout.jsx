import React, { useState, useContext } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { clearCart } from "../redux/cartSlice";
import { useNotify } from "../context/NotificationContext";

const Checkout = () => {
  const { user } = useContext(AuthContext);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useNotify();

  const [address, setAddress] = useState({
    fullName: "",
    street: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [busy, setBusy] = useState(false);

  // Display only. The figure that is actually charged is re-computed from
  // database prices by the server, so editing this in devtools changes nothing.
  const estimatedTotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0,
  );

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token}`,
  });

  const readError = async (res, fallback) => {
    const data = await res.json().catch(() => ({}));
    return data.message || fallback;
  };

  /**
   * Two calls, not three.
   *
   * POST /api/payment/order creates the Razorpay order *and* the local Pending
   * order together, priced server-side from the catalogue. POST
   * /api/payment/verify checks the gateway signature and flips that same order
   * to Paid. The page no longer POSTs to /api/orders afterwards - doing so
   * created a second, duplicate order from client-supplied totals.
   */
  const handlePayment = async () => {
    if (!window.Razorpay) {
      toast.error(
        "Could not load the payment library. Check your connection and retry.",
      );
      return;
    }

    setBusy(true);
    // Once the Razorpay sheet is open, `busy` is owned by its callbacks
    // (handler / ondismiss / payment.failed) rather than by this function.
    let sheetOpen = false;
    try {
      const orderRes = await fetch("/api/payment/order", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          // Only intent travels over the wire - the server prices it.
          items: cartItems.map((item) => ({
            productId: item.productId,
            qty: item.qty,
          })),
          address,
        }),
      });

      if (!orderRes.ok) {
        if (orderRes.status === 401) {
          toast.warning("Your session has expired. Please log in again.");
          navigate("/login");
          return;
        }
        toast.error(await readError(orderRes, "Could not start the payment"));
        return;
      }

      const orderData = await orderRes.json();

      const rzp = new window.Razorpay({
        // Supplied by the backend so the checkout is always opened with the
        // same key that signed the order. A hardcoded key here meant every
        // payment failed with a signature mismatch.
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ShopNow",
        description: `Order ${orderData.orderId}`,
        order_id: orderData.id,
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyRes.ok) {
              dispatch(clearCart());
              navigate("/ordersuccess");
            } else {
              toast.error(
                await readError(
                  verifyRes,
                  "We could not confirm that payment. If you were charged, contact support with your payment id.",
                ),
              );
            }
          } finally {
            setBusy(false);
          }
        },
        prefill: {
          name: address.fullName,
          email: user?.email,
        },
        modal: {
          // Without this the button stays disabled forever if the shopper
          // closes the Razorpay sheet instead of paying.
          ondismiss: () => setBusy(false),
        },
        theme: { color: "#f97316" },
      });

      rzp.on("payment.failed", (response) => {
        toast.error(response?.error?.description || "The payment was declined.");
        setBusy(false);
      });

      sheetOpen = true;
      rzp.open();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong starting the payment.");
    } finally {
      if (!sheetOpen) setBusy(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      toast.warning("Please log in first");
      navigate("/login");
      return;
    }
    if (cartItems.length === 0) {
      toast.info("Your cart is empty");
      navigate("/shop");
      return;
    }
    handlePayment();
  };

  return (
    <div className="main-content checkout-container">
      <h2>Checkout</h2>
      <div className="checkout-content">
        <form onSubmit={handleSubmit} className="shipping-form">
          <h3>Shipping Address</h3>
          <input
            type="text"
            placeholder="Full Name"
            required
            value={address.fullName}
            onChange={(e) =>
              setAddress({ ...address, fullName: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Street"
            required
            value={address.street}
            onChange={(e) => setAddress({ ...address, street: e.target.value })}
          />
          <input
            type="text"
            placeholder="City"
            required
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
          />
          <input
            type="text"
            placeholder="Postal Code"
            required
            value={address.postalCode}
            onChange={(e) =>
              setAddress({ ...address, postalCode: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Country"
            required
            value={address.country}
            onChange={(e) =>
              setAddress({ ...address, country: e.target.value })
            }
          />
          <div className="checkout-summary">
            <h4>Total to Pay: ₹{estimatedTotal.toFixed(2)}</h4>
            <button type="submit" className="btn" disabled={busy}>
              {busy ? "Processing..." : "Pay Now"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
