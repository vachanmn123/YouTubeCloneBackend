const mongoose = require("mongoose");
const user = require("./user");

const PrivacyEnum = Object.freeze({
  PUBLIC: "public",
  PRIVATE: "private",
  UNLISTED: "unlisted",
});

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  thumbnail: { type: String, required: true, default: "" },
  location: { type: String, required: true },
  duration: { type: Number, required: true, default: -1 },
  uploader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  privacy: {
    type: String,
    enum: Object.values(PrivacyEnum),
    required: true,
    default: PrivacyEnum.PUBLIC,
  },
  uploadDate: { type: Date, default: Date.now, required: true },
  likes: {
    type: Array(mongoose.Schema.Types.ObjectId),
    ref: "User",
    default: [],
  },
  dislikes: {
    type: Array(mongoose.Schema.Types.ObjectId),
    ref: "User",
    default: [],
  },
  views: { type: Number, default: 0 },
  comments: {
    type: Array(mongoose.Schema.Types.ObjectId),
    ref: "Comment",
    default: [],
  },
});

module.exports = mongoose.model("Video", videoSchema);
