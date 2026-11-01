const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userShema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    // Created via "Register as Test User": skips email OTP, never emailed.
    isTestUser: { type: Boolean, default: false },
    otpSentAt: { type: Date, select: false },
    // OTP is stored hashed - it is a credential, never keep the plaintext.
    otpHash: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
  },
  { timestamps: true },
);

// Hashing lives on the model, not in a controller, so every write path is
// covered - including seed.js. Note that insertMany() bypasses save hooks;
// use create() if you need this to run.
// An async hook signals completion by resolving; Mongoose does not pass it a
// `next` callback, so calling one threw "next is not a function" on every
// registration and on seed.js.
userShema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userShema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userShema.index({ role: 1 });

module.exports = mongoose.model("User", userShema);
