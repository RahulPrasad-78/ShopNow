const crypto = require("crypto");
const User = require("../model/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmailSafe } = require("../utils/sendEmail");
const { welcomeEmail } = require("../utils/emailTemplates");
const { AppError } = require("../utils/AppError");

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "3d",
  });
};

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");
const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const publicUser = (user, token) => ({
  ID: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  verified: user.verified,
  ...(token && { token }),
});

// A pre-computed bcrypt hash used to equalise the cost of the "no such user"
// branch in login, so response time does not reveal whether an email exists.
const DUMMY_HASH = bcrypt.hashSync("shopnow-timing-equaliser", 10);

//Register User
const registerUser = async (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(new AppError("Name, email and password are required", 400));
  }
  if (typeof password !== "string" || password.length < 6) {
    return next(new AppError("Password must be at least 6 characters", 400));
  }

  const existingUser = await User.findOne({
    email: String(email).toLowerCase(),
  }).select("+otpSentAt");

  if (existingUser) {
    const isPendingSignup =
      !existingUser.verified &&
      !existingUser.isTestUser &&
      req.body.accountType !== "test";

    if (!isPendingSignup) {
      return next(new AppError("User already exists", 400));
    }

    // Same email registering again before verifying: update that one record
    // (never insert a second) and send a fresh code.
    if (
      existingUser.otpSentAt &&
      Date.now() - existingUser.otpSentAt.getTime() < RESEND_COOLDOWN_MS
    ) {
      // Code was sent seconds ago - send them to the OTP page instead of re-mailing.
      return res.status(200).json({ email: existingUser.email, requiresVerification: true });
    }

    const otp = generateOtp();
    existingUser.name = name;
    existingUser.password = password; // re-hashed by the pre('save') hook
    existingUser.otpHash = hashOtp(otp);
    existingUser.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    existingUser.otpAttempts = 0;
    existingUser.otpSentAt = new Date();
    await existingUser.save();

    await sendEmailSafe(existingUser.email, "Welcome to ShopNow", welcomeEmail(name, otp));
    return res.status(200).json({ email: existingUser.email, requiresVerification: true });
  }

  // Test accounts skip the email OTP: verified straight away and logged in.
  // They are flagged so they can be told apart from real, email-verified users.
  if (req.body.accountType === "test") {
    const user = await User.create({
      name,
      email,
      password,
      verified: true,
      isTestUser: true,
    });
    return res.status(201).json(publicUser(user, generateToken(user._id)));
  }

  const otp = generateOtp();

  // Password is hashed by the userSchema pre('save') hook, not here, so every
  // write path (including seed.js) gets the same treatment.
  const user = await User.create({
    name,
    email,
    password,
    otpHash: hashOtp(otp),
    otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
    otpSentAt: new Date(),
  });

  // Fire-and-forget: an SMTP outage must not 500 a request whose account has
  // already been created; the user can ask for a new code from the OTP page.
  await sendEmailSafe(user.email, "Welcome to ShopNow", welcomeEmail(name, otp));

  // No token until the email is verified.
  res.status(201).json({ email: user.email, requiresVerification: true });
};

//Login User
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string") {
    return next(new AppError("Invalid credentials", 401));
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always run a bcrypt comparison so both branches cost the same.
  const isMatch = user
    ? await user.matchPassword(password)
    : await bcrypt.compare(password, DUMMY_HASH);

  if (!user || !isMatch) {
    return next(new AppError("Invalid credentials", 401));
  }

  // Only reached with the right password, so this does not leak which emails exist.
  if (!user.verified) {
    return next(
      new AppError("Please verify your email first", 403, "EMAIL_NOT_VERIFIED"),
    );
  }

  res.status(200).json(publicUser(user, generateToken(user._id)));
};

//Verify the OTP emailed at registration
const verifyEmail = async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return next(new AppError("Email and OTP are required", 400));
  }

  const user = await User.findOne({ email: String(email).toLowerCase() }).select(
    "+otpHash +otpExpiresAt +otpAttempts",
  );

  if (!user || !user.otpHash) {
    return next(new AppError("No pending verification for this account", 400));
  }
  if (user.verified) {
    return res.json({ message: "Account already verified" });
  }
  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    return next(new AppError("Too many attempts, request a new code", 429));
  }
  if (!user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now()) {
    return next(new AppError("Code expired, request a new one", 400));
  }

  const expected = Buffer.from(user.otpHash, "hex");
  const provided = Buffer.from(hashOtp(String(otp)), "hex");
  const ok =
    expected.length === provided.length &&
    crypto.timingSafeEqual(expected, provided);

  if (!ok) {
    user.otpAttempts += 1;
    await user.save({ validateBeforeSave: false });
    return next(new AppError("Invalid code", 400));
  }

  user.verified = true;
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  user.otpAttempts = 0;
  await user.save({ validateBeforeSave: false });

  // Log the user in straight away - they just proved they own the mailbox.
  res.json(publicUser(user, generateToken(user._id)));
};

//Issue a fresh OTP for an unverified account
const resendOtp = async (req, res) => {
  const generic = { message: "If that account needs verification, a new code has been sent." };

  const user = await User.findOne({
    email: String(req.body.email).toLowerCase(),
  }).select("+otpSentAt");

  if (!user || user.verified || user.isTestUser) {
    return res.json(generic);
  }

  if (user.otpSentAt && Date.now() - user.otpSentAt.getTime() < RESEND_COOLDOWN_MS) {
    const wait = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - user.otpSentAt.getTime())) / 1000,
    );
    throw new AppError(`Please wait ${wait}s before requesting another code`, 429);
  }

  const otp = generateOtp();
  user.otpHash = hashOtp(otp);
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.otpAttempts = 0;
  user.otpSentAt = new Date();
  await user.save({ validateBeforeSave: false });

  await sendEmailSafe(user.email, "Your ShopNow verification code", welcomeEmail(user.name, otp));
  res.json(generic);
};

//Current authenticated user - protect has already loaded it
const getMe = async (req, res) => {
  res.json(publicUser(req.user));
};

//Admin: full user directory
const getAllUsers = async (req, res) => {
  const users = await User.find({}).select("-password").lean();
  res.json(users);
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendOtp,
  getMe,
  getAllUsers,
};
