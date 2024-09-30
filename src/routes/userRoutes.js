const express = require("express");
const {
  registerUser,
  loginUser,
  getUserProfile,
  getUser,
  logoutUser,
  refreshToken,
  verifyOtp,
  updateUser,
} = require("../controllers/userController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", auth, getUserProfile);
router.get("/:userId", auth, getUser);
router.post("/logout", auth, logoutUser);
router.post("/refresh-token", refreshToken);
router.post("/verify-otp", verifyOtp);
router.put("/:userId", auth, updateUser);

module.exports = router;
