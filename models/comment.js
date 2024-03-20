const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: { type: Date, default: Date.now, required: true },
  likes: {
    type: Array(mongoose.Schema.Types.ObjectId),
    ref: "User",
    default: [],
  },
  likeCount: { type: Number, default: 0 },
  replies: {
    type: Array(mongoose.Schema.Types.ObjectId),
    ref: "Comment",
    default: [],
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
  },
  video: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Video",
    required: true,
  },
});

module.exports = mongoose.model("Comment", commentSchema);
