const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, sparse: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: "" },
  bio: { type: String, default: "" },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  conversations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Conversation" }],
  isVerified: { type: Boolean, default: false },
});

module.exports = mongoose.model("User", UserSchema);
