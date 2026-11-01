# 🛍️ ShopNow — Full-Stack E-Commerce Platform

A complete online store built with the **MERN stack** (MongoDB, Express, React, Node.js). Customers can browse products, verify their email with a one-time code, fill a cart, and pay securely with Razorpay. Admins get a dashboard to manage products, orders and users.

**🔗 Live demo:** https://shopnow-mmrd.onrender.com/

> 📖 **New to the project?** Open [`ProjectGuide.html`](./ProjectGuide.html) in your browser. It explains how everything works with flow diagrams, written for beginners.

---

## ✨ Features

**Shopping**
- Product catalogue with search, categories and pagination
- Product detail pages with stock information
- Cart that survives page refreshes (saved in `localStorage`)
- Secure checkout with **Razorpay** and an order-confirmation email

**Accounts**
- Register with **email OTP verification** (6-digit code, 10-minute expiry, resend with 60 s cooldown)
- **Test user** sign-up that skips the OTP, handy for demos
- Login with JWT; unverified accounts are blocked until they verify
- Show/hide password button, and role-based access (`user` / `admin`)

**Admin panel** (`/admin`)
- Dashboard: total orders, products, users and revenue
- Add / edit / delete products, with image upload to **Cloudinary**
- View every order and update its status (Pending → Shipped → Delivered / Cancelled)
- View all registered users

**Security and reliability**
- Passwords hashed with bcrypt; OTPs stored only as hashes
- Prices are **always recomputed on the server**, so a tampered cart can't change what is charged
- Razorpay payment signatures verified with HMAC-SHA256 (constant-time comparison)
- Atomic stock updates (no overselling) and idempotent payment confirmation
- Helmet headers, CORS allow-list, request validation, NoSQL-injection scrubbing, rate limiting
- Friendly in-app toasts and confirm dialogs instead of browser `alert()` boxes

---

## 🧰 Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, React Router 7, Redux Toolkit (cart), Context API (auth + notifications), plain CSS |
| Backend | Node.js, Express 5, Mongoose 9 |
| Database | MongoDB Atlas |
| Auth | JWT, bcryptjs |
| Payments | Razorpay |
| Images | Multer (temp upload) → Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| Validation / security | express-validator, helmet, express-rate-limit, cors |

---

## 🗂️ Project Structure

```
ShopNow/
├── ProjectGuide.html        # Beginner-friendly visual guide (open in a browser)
├── package.json             # Root scripts (dev, build, seed, install-all)
├── backend/
│   ├── index.js             # App entry: middleware, routes, error handler
│   ├── seed.js              # Sample users + products
│   ├── config/              # db.js, cloudinary.js, validateEnv.js
│   ├── controllers/         # auth, product, order, payment, analytics logic
│   ├── middleware/          # authMiddleware (JWT), adminMiddleware, validators,
│   │                        # sanitize, errorMiddleware
│   ├── model/               # User, Product, Order (Mongoose schemas)
│   ├── routes/              # URL → controller mapping
│   ├── utils/               # sendEmail, emailTemplates, pricing, AppError
│   └── uploads/             # Temporary image files (emptied after each upload)
└── frontend/
    ├── public/
    └── src/
        ├── App.jsx          # All routes
        ├── admin/           # Dashboard, products, orders, users, add/edit product
        ├── components/      # Navbar, Footer, ProductCard, route guards, PasswordInput
        ├── context/         # AuthContext, NotificationContext (toasts + confirm)
        ├── pages/           # Home, Shop, Cart, Checkout, Login, Register, VerifyEmail…
        ├── redux/           # cartSlice + store
        └── styles/          # CSS files
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18 or newer
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) database
- A [Cloudinary](https://cloudinary.com/) account (product images)
- A [Razorpay](https://razorpay.com/) account (test keys are fine)
- A Gmail account with an **App Password** (for OTP and order emails)

### 1. Clone and install
```bash
git clone https://github.com/RahulPrasad-78/ShopNow.git
cd ShopNow
npm run install-all
```

### 2. Configure environment variables
```bash
cd backend
cp .env.example .env     # on Windows: copy .env.example .env
```
Then fill in `backend/.env` (see the [reference table](#-environment-variables) below).

### 3. (Optional) Seed sample data
```bash
npm run seed
```
Creates an admin account, two sample users and a set of products. Check `backend/seed.js` for the credentials, and change them before deploying anywhere public.

### 4. Run it
```bash
npm run dev
```
| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Health check | http://localhost:5000/health |

During development the React dev server proxies `/api/*` to the backend, so no extra setup is needed.

---

## 🔐 How Sign-Up Works

```
Register ──► account saved (verified: false) ──► 6-digit code emailed
                                                        │
        enter code on /verify-email ◄───────────────────┘
                     │
                     ▼
        verified: true  ──► logged in automatically
```

| Option on the Register page | What happens |
| --- | --- |
| **Register** | Sends an OTP. You can't log in until you verify. Registering again with the same unverified email updates the same record and sends a fresh code, so no duplicates. |
| **Register as Test User** | No email, no OTP. Created as verified and logged in immediately (stored with `isTestUser: true`). |

Trying to log in before verifying redirects you to the verification page and sends a new code.

---

## 💳 How Checkout Works

1. Browser sends only `{ productId, qty }` plus the shipping address to `POST /api/payment/order`.
2. The server looks up real prices, creates a Razorpay order and a `Created` order in the database.
3. The Razorpay pop-up opens; the customer pays.
4. Browser sends the payment IDs and signature to `POST /api/payment/verify`.
5. The server checks the signature, reduces stock atomically, marks the order `Paid` and emails a confirmation.

---

## 📡 API Reference

`Auth` column: **Public** = no login, **User** = logged-in verified user, **Admin** = admin role.

### Auth — `/api/auth`
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/register` | Public | Create account (`accountType`: `user` or `test`) |
| POST | `/verify-email` | Public | Submit email + OTP; returns a JWT on success |
| POST | `/resend-otp` | Public | Send a new OTP (60 s cooldown) |
| POST | `/login` | Public | Login; `403 EMAIL_NOT_VERIFIED` if not verified |
| GET | `/me` | User | Current user profile |
| GET | `/users` (alias `/user`) | Admin | List all users |

### Products — `/api/products`
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/` | Public | List products. Query: `page`, `limit` (max 100, default 12), `category`, `search` |
| GET | `/:id` | Public | Single product |
| POST | `/` | Admin | Create product (multipart form, `image` field) |
| PUT | `/:id` | Admin | Update product |
| DELETE | `/:id` | Admin | Delete product |

The list response looks like `{ products, page, pages, total }`.

### Orders — `/api/orders`
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/myorders` | User | Your own orders |
| GET | `/` | Admin | All orders |
| PUT | `/:id/status` | Admin | Set status: `Pending`, `Shipped`, `Delivered`, `Cancelled` |

Orders are created only through the payment endpoints below.

### Payment — `/api/payment`
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/order` | User | Price the cart server-side and create the Razorpay order |
| POST | `/verify` | User | Verify the signature, finalise the order |

### Other
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/api/analytics` | Admin | Totals for orders, products, users, revenue |
| GET | `/health` | Public | Server status |

---

## ⚙️ Environment Variables

All set in `backend/.env` (template: `backend/.env.example`).

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | Backend port (default `5000`) |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Long random string used to sign tokens |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `3d`) |
| `EMAIL_USER` | Recommended | Gmail address that sends emails |
| `EMAIL_PASS` | Recommended | Gmail **App Password** (not your normal password) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | Recommended | Image hosting |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Recommended | Payments (use test keys in development) |
| `FRONTEND_URL` | No | Allowed CORS origin in production |
| `NODE_ENV` | No | `development` or `production` |

> Without `EMAIL_USER` / `EMAIL_PASS`, no emails are sent, so real sign-ups can't receive their OTP. Use **Register as Test User** until email is configured.

---

## 📜 Scripts

Run from the repository root.

| Command | What it does |
| --- | --- |
| `npm run install-all` | Install root, backend and frontend dependencies |
| `npm run dev` | Run backend (nodemon) and frontend together |
| `npm run dev:server` / `npm run dev:client` | Run just one side |
| `npm run build` | Build the React app into `frontend/build` |
| `npm start` | Start the backend (in production it also serves the built frontend) |
| `npm run seed` | Fill the database with sample data |

---

## ☁️ Deployment

1. Set the environment variables on your host (Render, Railway, etc.) and set `NODE_ENV=production`.
2. Build command: `npm run build`. Start command: `npm start`.
3. In production Express serves `frontend/build` itself, so one service hosts both the API and the site.
4. Set `FRONTEND_URL` to your public site URL.

---

## 🩺 Troubleshooting

| Problem | Likely cause |
| --- | --- |
| Shop/Home show no products | Backend not running, or wrong `MONGO_URI` |
| OTP email never arrives | `EMAIL_USER`/`EMAIL_PASS` missing or not an App Password; check Spam |
| "Payments are not configured" | Razorpay keys missing in `.env` |
| Product image upload fails | Cloudinary keys missing or wrong |
| Can't log in after registering | Account not verified yet: enter the OTP, or register as a test user |
| `Too many requests` | Rate limiter: wait 15 minutes |

---

## 👤 Author

**Rahul Prasad** — [GitHub](https://github.com/RahulPrasad-78)

Licensed under the ISC License.
