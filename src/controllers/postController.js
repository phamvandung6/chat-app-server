const Post = require("../models/postModel");
const User = require("../models/userModel");
const logger = require("../config/logger");

// Tạo bài đăng mới
exports.createPost = async (req, res) => {
  try {
    const { description, image } = req.body;
    const userId = req.user.id;

    const newPost = new Post({
      userId,
      description,
      image,
    });

    await newPost.save();

    res.status(201).json({
      success: true,
      data: newPost,
    });
  } catch (error) {
    logger.error(`Error in createPost: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Unable to create post",
    });
  }
};

// Lấy bài đăng theo ID
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "userId",
      "username profilePicture"
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    logger.error(`Error in getPostById: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Unable to retrieve post",
    });
  }
};

// Cập nhật bài đăng
exports.updatePost = async (req, res) => {
  try {
    const { description, image } = req.body;
    const post = await Post.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { description, image },
      { new: true, runValidators: true }
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or user not authorized",
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (error) {
    logger.error(`Error in updatePost: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Unable to update post",
    });
  }
};

// Xóa bài đăng
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or user not authorized",
      });
    }

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    logger.error(`Error in deletePost: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Unable to delete post",
    });
  }
};

// Lấy tất cả bài đăng của một user
exports.getUserPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const posts = await Post.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate("userId", "username profilePicture");

    const total = await Post.countDocuments({ userId: req.params.userId });

    res.status(200).json({
      success: true,
      data: posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
      },
    });
  } catch (error) {
    logger.error(`Error in getUserPosts: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Unable to retrieve user posts",
    });
  }
};

// Like bài đăng
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.likes.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: "Post already liked",
      });
    }

    post.likes.push(req.user.id);
    await post.save();

    res.status(200).json({
      success: true,
      message: "Post liked successfully",
    });
  } catch (error) {
    logger.error(`Error in likePost: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Unable to like post",
    });
  }
};

// Unlike bài đăng
exports.unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (!post.likes.includes(req.user.id)) {
      return res.status(400).json({
        success: false,
        message: "Post has not been liked yet",
      });
    }

    post.likes = post.likes.filter((like) => like.toString() !== req.user.id);
    await post.save();

    res.status(200).json({
      success: true,
      message: "Post unliked successfully",
    });
  } catch (error) {
    logger.error(`Error in unlikePost: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Unable to unlike post",
    });
  }
};
