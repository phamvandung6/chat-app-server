const express = require('express');
const { registerUser, loginUser, getUserProfile, logoutUser, refreshToken } = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', auth, getUserProfile);
router.post('/logout', auth, logoutUser);
router.post('/refresh-token', refreshToken);

module.exports = router;