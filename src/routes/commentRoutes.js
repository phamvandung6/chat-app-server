const express = require("express");
const auth = require("../middleware/auth");
const commentController = require("../controllers/commentController");

const router = express.Router();

router.post("/:postId/comments", auth, commentController.createComment);
router.get("/:postId/comments", auth, commentController.getCommentsByPost);
router.put("/:id", auth, commentController.updateComment);
router.delete("/:id", auth, commentController.deleteComment);

module.exports = router;
