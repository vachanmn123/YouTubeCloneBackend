const router = require("express").Router();
const verifyToken = require("../../middleware/auth");
const commentSchema = require("../../models/comment");
const videoSchema = require("../../models/video");

// Get all comments for a video
router.get("/:videoId", async (req, res, next) => {
  try {
    const video = await videoSchema.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const comments = await commentSchema.find({ video: req.params.videoId });
    res.json(comments.slice(startIndex, endIndex));
  } catch (e) {
    next(e);
  }
});

// Create a new comment
router.post("/:videoId", verifyToken, async (req, res, next) => {
  try {
    const video = await videoSchema.findById(req.params.videoId);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    if (req.body.parent) {
      const parentComment = await commentSchema.findById(req.body.parent);
      if (!parentComment) {
        return res.status(404).json({ message: "Parent comment not found" });
      }

      if (parentComment.video.toString() !== req.params.videoId) {
        return res
          .status(400)
          .json({ message: "Parent comment does not belong to this video" });
      }
    }

    const comment = new commentSchema({
      text: req.body.text,
      user: req.userId,
      video: req.params.videoId,
      parent: req.body.parent || null,
    });

    try {
      const savedComment = await comment.save();
      if (req.body.parent) {
        const parentComment = await commentSchema.findById(req.body.parent);
        parentComment.replies.push(savedComment._id);
      }
      res.json({ message: "Comment created", comment: savedComment });
    } catch (err) {
      res.status(400).json({ message: err });
    }
  } catch (e) {
    next(e);
  }
});

// Get a specific comment
router.get("/get/:commentId", async (req, res, next) => {
  try {
    const comment = await commentSchema.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    res.json(comment);
  } catch (e) {
    next(e);
  }
});

// Like a comment
router.post("/:commentId/like", verifyToken, async (req, res, next) => {
  try {
    const comment = await commentSchema.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.likes.map((objId) => objId.toString()).includes(req.userId)) {
      return res
        .status(400)
        .json({ message: "You already liked this comment" });
    }

    if (
      comment.dislikes.map((objId) => objId.toString()).includes(req.userId)
    ) {
      comment.dislikes = comment.dislikes.filter(
        (dislike) => dislike.toString() != req.userId
      );
    }

    comment.likes.push(req.userId);
    await comment.save();
    res.json({ message: "Comment liked" });
  } catch (e) {
    next(e);
  }
});

// Unlike a comment (remove like)
router.post("/:commentId/unlike", verifyToken, async (req, res, next) => {
  try {
    const comment = await commentSchema.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (!comment.likes.map((objId) => objId.toString()).includes(req.userId)) {
      return res
        .status(400)
        .json({ message: "You have not liked this comment." });
    }

    comment.likes = comment.likes.filter(
      (like) => like.toString() != req.userId
    );
    await comment.save();
    res.json({ message: "Comment unliked" });
  } catch (e) {
    next(e);
  }
});

// Dislike a comment
router.post("/:commentId/dislike", verifyToken, async (req, res, next) => {
  try {
    const comment = await commentSchema.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (
      comment.dislikes.map((objId) => objId.toString()).includes(req.userId)
    ) {
      return res
        .status(400)
        .json({ message: "You already disliked this comment" });
    }

    if (comment.likes.map((objId) => objId.toString()).includes(req.userId)) {
      comment.likes = comment.likes.filter(
        (like) => like.toString() != req.userId
      );
    }

    comment.dislikes.push(req.userId);
    try {
      await comment.save();
      res.json({ message: "Comment disliked" });
    } catch (e) {
      res.status(400).json({ message: e });
    }
  } catch (e) {
    next(e);
  }
});

// Undislike a comment (remove dislike)
router.post("/:commentId/undislike", verifyToken, async (req, res, next) => {
  try {
    const comment = await commentSchema.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (
      !comment.dislikes.map((objId) => objId.toString()).includes(req.userId)
    ) {
      return res
        .status(400)
        .json({ message: "You have not disliked this comment." });
    }

    comment.dislikes = comment.dislikes.filter(
      (dislike) => dislike.toString() != req.userId
    );
    await comment.save();
    res.json({ message: "Comment undisliked" });
  } catch (e) {
    next(e);
  }
});

// Delete a comment
router.delete("/:commentId", verifyToken, async (req, res, next) => {
  try {
    const comment = await commentSchema.findById(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.user.toString() !== req.userId) {
      return res
        .status(401)
        .json({ message: "You are not authorized to delete this comment" });
    }

    try {
      await comment.deleteOne();
      res.json({ message: "Comment deleted" });
    } catch (e) {
      res.status(400).json({ message: e.toString() });
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
