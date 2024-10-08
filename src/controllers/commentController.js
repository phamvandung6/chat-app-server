const Comment = require("../models/commenModel");
const Post = require("../models/postModel");
const logger = require("../config/logger");

exports.createComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const { text } = req.body;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const newComment = new Comment({
      postId,
      userId,
      text,
    });

    await newComment.save();

    res.status(201).json({
      success: true,
      data: newComment,
    });
  } catch (error) {
    logger.error(`Error in createComment: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Unable to create comment",
    });
  }
};

exports.getCommentsByPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const comments = await Comment.find({ postId })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate("userId", "username profilePicture");

    const total = await Comment.countDocuments({ postId });

    res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalComments: total,
      },
    });
  } catch (error) {
    logger.error(`Error in getCommentsByPost: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Unable to retrieve comments",
    });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { text } = req.body;
    const comment = await Comment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { text },
      { new: true, runValidators: true }
    );

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found or user not authorized",
      });
    }

    res.status(200).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    logger.error(`Error in updateComment: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Unable to update comment",
    });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found or user not authorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    logger.error(`Error in deleteComment: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Unable to delete comment",
    });
  }
};
