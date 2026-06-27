# ShopNow — Full Stack E-Commerce Web Application

ShopNow is a full-stack e-commerce web application built with the MERN stack. It supports product browsing, cart management, Razorpay payment integration, order tracking, and a complete admin panel for managing products, orders, and users.

---

## Tech Stack

**Frontend**
- React 19, React Router v7
- Redux Toolkit (cart state management)
- Context API (authentication state)
- CSS (custom styles)

**Backend**
- Node.js, Express 5
- MongoDB Atlas, Mongoose
- JWT (authentication & authorization)
- Bcryptjs (password hashing)
- Multer + Cloudinary (image uploads)
- Razorpay (payment gateway)
- Nodemailer (transactional emails)

---

## Features

- 🛍️ Product listing with search
- 🛒 Cart with persistent state (localStorage)
- 🔐 JWT-based authentication with role-based access (user / admin)
- 💳 Razorpay payment integration with HMAC-SHA256 signature verification
- 📦 Order placement with automated confirmation emails via Nodemailer
- ☁️ Image upload to Cloudinary
- 🛠️ Admin panel — manage products, orders, users, and view analytics dashboard

---

## Project Structure

```
ShopNow/
├── backend/
│   ├── config/          # DB and Cloudinary config
│   ├── controllers/     # Route logic (auth, product, order, payment, analytics)
│   ├── middleware/      # JWT protect, admin role check
│   ├── model/           # Mongoose schemas (User, Product, Order)
│   ├── routes/          # Express route definitions
│   ├── utils/           # Email utility (Nodemailer)
│   ├── seed.js          # Database seeder
│   └── index.js         # App entry point
└── frontend/
    └── src/
        ├── admin/       # Admin panel pages
        ├── components/  # Navbar, Footer, ProductCard
        ├── context/     # AuthContext
        ├── pages/       # User-facing pages
        ├── redux/       # Cart slice and store
        └── styles/      # CSS files
```

---

## Getting Started

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or above)
- [npm](https://www.npmjs.com/)
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account
- A [Cloudinary](https://cloudinary.com/) account
- A [Razorpay](https://razorpay.com/) account (test keys work fine)

---

### 1. Clone the repository

```bash
git clone https://github.com/RahulPrasad-78/ShopNow.git
cd ShopNow
```

---

### 2. Set up environment variables

Create a `.env` file inside the `backend/` folder:

```bash
cd backend
cp .env.example .env
```

Fill in the values:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key

EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

FRONTEND_URL=http://localhost:3000
```

> ⚠️ Never commit your `.env` file. Make sure it is listed in `.gitignore`.

---

### 3. Install dependencies

From the root folder, install all dependencies for both backend and frontend in one command:

```bash
npm run install-all
```

Or install them separately:

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

---

### 4. Seed the database (optional)

To populate your MongoDB database with sample products and an admin user:

```bash
npm run seed
```

---

### 5. Run the application

**Run both frontend and backend together (recommended):**

```bash
npm run dev
```

**Or run them separately in two terminals:**

```bash
# Terminal 1 — backend
npm run dev:server

# Terminal 2 — frontend
npm run dev:client
```

The backend runs on `http://localhost:5000`
The frontend runs on `http://localhost:3000`

---

## Available Scripts

All scripts below are run from the **root** folder unless stated otherwise.

| Script | Location | Description |
|---|---|---|
| `npm run install-all` | root | Installs dependencies for root, backend, and frontend |
| `npm run dev` | root | Runs backend and frontend concurrently |
| `npm run dev:server` | root | Runs only the backend (nodemon) |
| `npm run dev:client` | root | Runs only the frontend (React dev server) |
| `npm run build` | root | Builds the React frontend for production |
| `npm run seed` | root | Seeds the database with sample data |
| `npm start` | backend/ | Starts the backend with node (production) |
| `npm run dev` | backend/ | Starts the backend with nodemon (development) |
| `npm start` | frontend/ | Starts the React development server |
| `npm run build` | frontend/ | Builds the React app for production |
| `npm test` | frontend/ | Runs frontend tests |

---

## API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive JWT |
| GET | `/api/auth/user` | Admin | Get all users |

### Products
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/products` | Public | Get all products |
| GET | `/api/products/:id` | Public | Get single product |
| POST | `/api/products` | Admin | Create a product |
| PUT | `/api/products/:id` | Admin | Update a product |
| DELETE | `/api/products/:id` | Admin | Delete a product |

### Orders
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/orders` | User | Place an order |
| GET | `/api/orders/myorders` | User | Get current user's orders |
| GET | `/api/orders` | Admin | Get all orders |
| PUT | `/api/orders/:id/status` | Admin | Update order status |

### Payment
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/payment/order` | User | Create Razorpay order |
| POST | `/api/payment/verify` | User | Verify payment signature |

### Analytics
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/analytics` | Admin | Get dashboard stats |

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `PORT` | Port the backend runs on (default: 5000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `EMAIL_USER` | Gmail address used for sending emails |
| `EMAIL_PASS` | Gmail app password (not your account password) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `RAZORPAY_KEY_ID` | Razorpay key ID (use test keys in development) |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret |
| `FRONTEND_URL` | Frontend URL for CORS (e.g. http://localhost:3000) |

---

## Admin Access

After seeding the database, an admin account is created. You can log in with the seeded admin credentials and access the admin panel at `/admin`.

> If you create your own admin manually, set `role: "admin"` on the user document in MongoDB Atlas.

---

## License

This project is open source and available under the [ISC License](LICENSE).

---

## Author

**Rahul Prasad**
[GitHub](https://github.com/RahulPrasad-78)
