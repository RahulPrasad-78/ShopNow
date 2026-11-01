import { createSlice } from "@reduxjs/toolkit";

/** Read cart from localStorage, guarding against malformed or truncated entries. */
const readCart = () => {
  try {
    const raw = localStorage.getItem("cartItems");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem("cartItems");
    return [];
  }
};

/** Persist the current cart state to localStorage. */
const persist = (cartItems) => {
  localStorage.setItem("cartItems", JSON.stringify(cartItems));
};

const cartSlice = createSlice({
  name: "cart",
  initialState: { cartItems: readCart() },
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existItem = state.cartItems.find((x) => x.productId === item.productId);
      if (existItem) {
        state.cartItems = state.cartItems.map((x) =>
          x.productId === existItem.productId ? item : x,
        );
      } else {
        state.cartItems.push(item);
      }
      persist(state.cartItems);
    },
    removeFromCart: (state, action) => {
      state.cartItems = state.cartItems.filter((x) => x.productId !== action.payload);
      persist(state.cartItems);
    },
    clearCart: (state) => {
      state.cartItems = [];
      localStorage.removeItem("cartItems");
    },
  },
});

// ── Selectors ─────────────────────────────────────────────────────────────────
/** Returns all items in the cart. */
export const selectCartItems = (state) => state.cart.cartItems;

/** Returns the total price of all cart items. */
export const selectCartTotal = (state) =>
  state.cart.cartItems.reduce((total, item) => total + item.price * item.qty, 0);

/** Returns the total number of individual items (sum of all quantities). */
export const selectCartCount = (state) =>
  state.cart.cartItems.reduce((count, item) => count + item.qty, 0);

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
