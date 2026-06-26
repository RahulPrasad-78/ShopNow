const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });
};

//Register User
const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    //HashPassword, JWT token, OTP sending and welcome mail
    const encrypt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, encrypt);

    const user = await User.create({ name, email, password: hashedPassword });
    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      // Send OTP and welcome email
      const message = `Welcome to ShopNow ${name}! Your OTP is: ${otp}`;

      await sendEmail(email, "Welcome to ShopNow", message);
      res.status(201).json({
        ID: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
    });
  }
};

//Login User
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).json({
        ID: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error logging in user" });
  }
};

//get user profile
const getUser = async (req, res) => {
  try {
    const user = await User.find({}).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
};
