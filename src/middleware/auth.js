const jwt = require("jsonwebtoken");
const blacklistService = require("../services/blackListService");

const auth = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(400).json({ message: "Access denied" });

  // Check if the token is blacklisted
  if (await blacklistService.isBlacklisted(token)) {
    return res.status(403).json({ message: "Token is blacklisted" });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the token type is access_token
    if (verified.token_type !== "access_token") {
      return res.status(401).json({ message: "Invalid token type" });
    }

    req.user = verified;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = auth;
