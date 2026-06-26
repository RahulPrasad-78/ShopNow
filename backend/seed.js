const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");
const User = require("./model/User");
const Product = require("./model/Product");

dotenv.config();

const seedData = async () => {
  try {
    await connectDB();

    await Promise.all([User.deleteMany({}), Product.deleteMany({})]);

    const adminPassword = await bcrypt.hash("Admin@2026!", 10);
    const userPassword = await bcrypt.hash("Aarav@2026!", 10);
    const guestPassword = await bcrypt.hash("Meera@2026!", 10);

    const users = await User.insertMany([
      {
        name: "Rahul Prasad",
        email: "admin@shopnow.com",
        password: "Rahul@123",
        role: "admin",
        verified: true,
      },
      {
        name: "Aarav Verma",
        email: "aarav@shopnow.com",
        password: "Aarav@123",
        role: "user",
        verified: false,
      },
      {
        name: "Yash Mehra",
        email: "yash@shopnow.com",
        password: "Yash@123",
        role: "user",
        verified: true,
      },
    ]);

    const products = await Product.insertMany([
      {
        name: "Urban Runner Sneakers",
        description:
          "Lightweight daily sneakers with cushioned soles and breathable mesh for all-day comfort.",
        price: 2499,
        category: "Footwear",
        stock: 25,
        imageUrl:
          "https://res.cloudinary.com/dvmm60i3d/image/upload/v1782441536/fdqlxufk7ieovxlfa9x9.png",
        rating: 4.5,
        numReviews: 18,
      },
      {
        name: "Noise Canceling Headphones",
        description:
          "Over-ear wireless headphones with active noise canceling, rich bass, and long battery life.",
        price: 5499,
        category: "Electronics",
        stock: 40,
        imageUrl:
          "https://res.cloudinary.com/dvmm60i3d/image/upload/v1782487403/Gemini_Generated_Image_lo4cy8lo4cy8lo4c_ifkgka.png",
        rating: 4.7,
        numReviews: 32,
      },
      {
        name: "Everyday Laptop Backpack",
        description:
          "Durable backpack with padded laptop sleeve, organized compartments, and water-resistant fabric.",
        price: 1999,
        category: "Accessories",
        stock: 30,
        imageUrl:
          "https://res.cloudinary.com/dvmm60i3d/image/upload/v1782487409/Gemini_Generated_Image_s5jduds5jduds5jd_adkvog.png",
        rating: 4.3,
        numReviews: 12,
      },
      {
        name: "Smart Fitness Watch",
        description:
          "Fitness-focused smartwatch with heart-rate tracking, sleep monitoring, and smart notifications.",
        price: 3999,
        category: "Electronics",
        stock: 18,
        imageUrl:
          "https://res.cloudinary.com/dvmm60i3d/image/upload/v1782487396/Gemini_Generated_Image_6a2bkw6a2bkw6a2b_cjgoac.png",
        rating: 4.6,
        numReviews: 24,
      },
      {
        name: "Cotton Crew T-Shirt",
        description:
          "Soft everyday cotton t-shirt with a relaxed fit and durable stitching.",
        price: 699,
        category: "Clothing",
        stock: 60,
        imageUrl:
          "https://res.cloudinary.com/dvmm60i3d/image/upload/v1782487556/Gemini_Generated_Image_sfxasqsfxasqsfxa_zgrysw.png",
        rating: 4.2,
        numReviews: 15,
      },
      {
        name: "Stainless Steel Water Bottle",
        description:
          "Double-walled insulated bottle that keeps drinks cold or hot for hours.",
        price: 899,
        category: "Home & Kitchen",
        stock: 45,
        imageUrl:
          "https://res.cloudinary.com/dvmm60i3d/image/upload/v1782487554/Gemini_Generated_Image_4qjs7s4qjs7s4qjs_ctjzso.png",
        rating: 4.4,
        numReviews: 21,
      },
      {
        name: "Bluetooth Speaker",
        description:
          "Portable speaker with clear sound, deep bass, and up to 12 hours of playback.",
        price: 1799,
        category: "Electronics",
        stock: 35,
        imageUrl:
          "https://res.cloudinary.com/dvmm60i3d/image/upload/v1782487553/Gemini_Generated_Image_mrbm59mrbm59mrbm_jgog9t.png",
        rating: 4.5,
        numReviews: 29,
      },
      {
        name: "Desk Lamp",
        description:
          "Minimal LED desk lamp with adjustable brightness and a clean modern design.",
        price: 1199,
        category: "Home Decor",
        stock: 28,
        imageUrl:
          "https://res.cloudinary.com/dvmm60i3d/image/upload/v1782487708/Gemini_Generated_Image_l6iiebl6iiebl6ii_mmajcm.png",
        rating: 4.3,
        numReviews: 16,
      },
      {
        name: "Analog Watch",
        description:
          "Classic stainless steel watch with a refined dial and everyday wear durability.",
        price: 3299,
        category: "Accessories",
        stock: 22,
        imageUrl:
          "https://res.cloudinary.com/dvmm60i3d/image/upload/v1782487695/Gemini_Generated_Image_asud69asud69asud_xfyxt5.png",
        rating: 4.6,
        numReviews: 14,
      },
      {
        name: "Casual Hoodie",
        description:
          "Comfortable fleece hoodie with a relaxed fit, soft lining, and daily wear style.",
        price: 1499,
        category: "Clothing",
        stock: 50,
        imageUrl:
          "https://res.cloudinary.com/dvmm60i3d/image/upload/v1782487700/Gemini_Generated_Image_2jqsg02jqsg02jqs_aksjs4.png",
        rating: 4.4,
        numReviews: 19,
      },
    ]);

    console.log(
      `Seed complete: ${users.length} users and ${products.length} products inserted.`,
    );
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

seedData();
