const mongoose = require("mongoose");

const ConversationSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    isGroup: { type: Boolean, default: false },
    members: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", ConversationSchema);
