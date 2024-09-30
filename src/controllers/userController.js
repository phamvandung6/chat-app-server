const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redis = require("../config/redis");
const blacklistService = require("../services/blackListService");
const { sendOtpEmail } = require("../services/emailService");
const { generateSessionId } = require("../utils/sessionUtils");
const logger = require("../config/logger");

exports.registerUser = async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ email, password: hashedPassword, isVerified: false });

  try {
    await user.save();

    // Generate OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // Store OTP in Redis with a TTL (e.g., 10 minutes)
    await redis.set(`otp:${email}`, otp, "EX", 600);

    // Send OTP via email
    await sendOtpEmail(email, otp);

    res
      .status(201)
      .json({
        message:
          "User registered successfully. Please check your email for the OTP.",
      });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Error registering user" });
  }
};

exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  // Retrieve OTP from Redis
  const storedOtp = await redis.get(`otp:${email}`);

  if (!storedOtp) {
    return res.status(400).json({ message: "OTP expired or invalid" });
  }

  if (storedOtp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // Update user verification status
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  user.isVerified = true;
  await user.save();

  // Delete OTP from Redis after verification
  await redis.del(`otp:${email}`);

  res.status(200).json({ message: "Email verified successfully" });
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({ message: "Invalid credentials" });
  }
  if (!user.isVerified) {
    return res.status(400).json({ message: "User not verified" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const accessToken = jwt.sign(
    { id: user._id, token_type: "access_token" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  const refreshToken = jwt.sign(
    { id: user._id, token_type: "refresh_token" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Generate a unique session ID (could be a UUID or similar)
  const sessionId = generateSessionId();

  // Store refresh token in Redis
  await redis.set(
    `refresh_token:${user._id}:${sessionId}`,
    refreshToken,
    "EX",
    60 * 60 * 24 * 7
  ); // expires in 7 days

  res.status(200).json({
    user_id: user._id,
    access_token: accessToken,
    refresh_token: refreshToken,
    session_id: sessionId,
    token_type: "bearer",
  });
};

exports.getUserProfile = async (req, res) => {
  const userId = req.user.id;

  // Check if user data is in cache
  const cachedUser = await redis.get(`user:${userId}:profile`);
  if (cachedUser) {
    return res.status(200).json(JSON.parse(cachedUser));
  }

  // If not in cache, query the database
  const user = await User.findById(userId).select("-password -isVerified");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Cache the user data with a TTL (e.g., 1 hour)
  await redis.set(`user:${userId}:profile`, JSON.stringify(user), "EX", 3600);

  res.status(200).json(user);
};

exports.getUser = async (req, res) => {
  const userId = req.params.userId;

  // Check if user data is in cache
  const cachedUser = await redis.get(`user:${userId}:profile`);
  if (cachedUser) {
    return res.status(200).json(JSON.parse(cachedUser));
  }

  // If not in cache, query the database
  const user = await User.findById(userId).select("-password -isVerified");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Cache the user data with a TTL (e.g., 1 hour)
  await redis.set(`user:${userId}:profile`, JSON.stringify(user), "EX", 3600);

  res.status(200).json(user);
};

exports.updateUser = async (req, res) => {
  const userId = req.params.userId;
  const updates = req.body;

  try {
    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select("-password -isVerified");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Invalidate cache
    await redis.del(`user:${userId}:profile`);

    res.status(200).json(user);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Error updating user" });
  }
};

exports.logoutUser = async (req, res) => {
  const userId = req.user.id;
  const accessToken = req.header("Authorization")?.split(" ")[1];
  const sessionId = req.body.session_id;

  const refreshToken = await redis.get(`refresh_token:${userId}:${sessionId}`);

  if (!refreshToken) {
    return res.status(400).json({ message: "No refresh token found" });
  }

  await blacklistService.addToBlacklist(accessToken, 60 * 60 * 24 * 7);
  await blacklistService.addToBlacklist(refreshToken, 60 * 60 * 24 * 7);

  await redis.del(`refresh_token:${userId}:${sessionId}`); // Delete the specific session refresh token

  res.status(200).json({ message: "Logged out successfully" });
};

exports.refreshToken = async (req, res) => {
  const { session_id } = req.body;
  const oldRefreshToken = req.header("Authorization")?.split(" ")[1];
  if (!oldRefreshToken)
    return res.status(400).json({ message: "Refresh token required" });

  // Check token in blacklist
  const isBlacklisted = await blacklistService.isBlacklisted(oldRefreshToken);
  if (isBlacklisted) {
    return res.status(403).json({ message: "Token is blacklisted" });
  }

  let userId;
  let expiresIn;
  try {
    const decoded = jwt.verify(oldRefreshToken, process.env.JWT_SECRET);
    if (decoded.token_type !== "refresh_token") {
      return res.status(403).json({ message: "Invalid token type" });
    }
    userId = decoded.id;
    expiresIn = decoded.exp - Math.floor(Date.now() / 1000); // Calculate remaining time
  } catch (error) {
    logger.error(error);
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  await redis.del(`refresh_token:${userId}:${session_id}`);
  await blacklistService.addToBlacklist(oldRefreshToken, expiresIn);

  const newAccessToken = jwt.sign(
    { id: userId, token_type: "access_token" },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  const newRefreshToken = jwt.sign(
    { id: userId, token_type: "refresh_token" },
    process.env.JWT_SECRET,
    { expiresIn: expiresIn }
  );

  await redis.set(
    `refresh_token:${userId}:${session_id}`,
    newRefreshToken,
    "EX",
    expiresIn
  );

  res.status(200).json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
};
