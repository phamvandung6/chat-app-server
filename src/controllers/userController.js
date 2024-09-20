const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('../config/redis');
const blacklistService = require('../services/blackListService');
const { generateSessionId } = require('../utils/sessionUtils');

exports.registerUser = async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });

    try {
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user' });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Generate a unique session ID (could be a UUID or similar)
    const sessionId = generateSessionId();

    // Store refresh token in Redis
    await redis.set(`refresh_token:${user._id}:${sessionId}`, refreshToken, 'EX', 60 * 60 * 24 * 7); // expires in 7 days

    res.status(200).json({
        user_id: user._id,
        access_token: accessToken,
        refresh_token: refreshToken,
        session_id: sessionId,
        token_type: 'bearer',
    });
};

exports.getUserProfile = async (req, res) => {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
};

exports.logoutUser = async (req, res) => {
    const userId = req.user.id;
    const accessToken = req.header('Authorization')?.split(' ')[1];
    const sessionId = req.body.session_id;

    const refreshToken = await redis.get(`refresh_token:${userId}:${sessionId}`);

    if (!refreshToken) {
        return res.status(400).json({ message: 'No refresh token found' });
    }

    await blacklistService.addToBlacklist(accessToken, 60 * 60 * 24 * 7);
    await blacklistService.addToBlacklist(refreshToken, 60 * 60 * 24 * 7);

    await redis.del(`refresh_token:${userId}:${sessionId}`); // Delete the specific session refresh token

    res.status(200).json({ message: 'Logged out successfully' });
};

exports.refreshToken = async (req, res) => {
    const { session_id } = req.body;
    const oldRefreshToken = req.header('Authorization')?.split(' ')[1];
    if (!oldRefreshToken) return res.status(401).json({ message: 'Refresh token required' });

    // Decode the old refresh token to get the user ID
    let userId;
    try {
        const decoded = jwt.verify(oldRefreshToken, process.env.JWT_SECRET);
        userId = decoded.id; // Extract user ID from the decoded token
    } catch (error) {
        return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Delete the old refresh token from Redis
    await redis.del(`refresh_token:${userId}:${session_id}`);

    // Blacklist the old refresh token
    await blacklistService.addToBlacklist(oldRefreshToken, 60 * 60 * 24 * 7); // 7 days

    // Generate new tokens
    const newAccessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Store token in Redis
    await redis.set(`refresh_token:${userId}:${session_id}`, newRefreshToken, 'EX', 60 * 60 * 24 * 7); // 7 days

    res.status(200).json({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
    });
};