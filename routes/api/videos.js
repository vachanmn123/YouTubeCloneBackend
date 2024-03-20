const router = require("express").Router();
const verifyToken = require("../../middleware/auth");
const videoSchema = require("../../models/video");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const multer = require("multer");
const multerS3 = require("multer-s3");
const generateHLS = require("../../lib/generateHLS");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: process.env.AWS_ENDPOINT,
  forcePathStyle: true,
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME,
    key: function (req, file, cb) {
      cb(
        null,
        `videos/${req.userId}/${Date.now().toString()}/video.${file.originalname
          .split(".")
          .pop()}`
      );
    },
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
  }),
});

// Get all videos
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const results = {};
  const videos = await videoSchema.find();
  results.videos = videos.slice(startIndex, endIndex);
  if (endIndex < videos.length) {
    results.next = {
      page: page + 1,
      limit: limit,
    };
  }
  if (startIndex > 0) {
    results.previous = {
      page: page - 1,
      limit: limit,
    };
  }
  res.json(results);
});

// Create a new video
router.post(
  "/",
  verifyToken,
  upload.single("video"),
  async (req, res, next) => {
    try {
      const video = new videoSchema({
        title: req.body.title,
        description: req.body.description,
        location: req.file.key,
        uploader: req.userId,
        privacy: req.body.privacy || "private",
        thumbnail: req.body.thumbnail || "",
      });
      generateHLS(req.file.key);
      // TODO: Calculate the video's duration and save it to the database
      // TODO: Create a Thumbnail (either user provided or generated) and save it to the database
      try {
        const savedVideo = await video.save();
        res.json(savedVideo);
      } catch (err) {
        res.status(400).json({ message: err });
      }
    } catch (e) {
      next(e);
    }
  }
);

// Get a specific video
router.get("/:id", async (req, res, next) => {
  try {
    const video = await videoSchema.findById(req.params.id);
    if (!video) {
      res.status(404).json({ message: "Video not found" });
    }
    // TODO: Handle the case where the video is private or unlisted

    res.json(video);
  } catch (e) {
    next(e);
  }
});

// Get the video file
router.get("/:id/video", async (req, res, next) => {
  try {
    const video = await videoSchema.findById(req.params.id);
    if (!video) {
      res.status(404).json({ message: "Video not found" });
    }

    // Get S3 signed URL for the video file and return it
    // TODO: Handle the case where the video is private or unlisted

    const cmd = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: video.location,
    });
    const signedUrl = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
    res.json({ url: signedUrl });
  } catch (e) {
    next(e);
  }
});

// TODO: Implement DELETE /videos/:id

// Update a video
router.put("/:id", verifyToken, async (req, res, next) => {
  try {
    const video = await videoSchema.findById(req.params.id);
    if (!video) {
      res.status(404).json({ message: "Video not found" });
    }
    if (video.uploader.toString() !== req.userId) {
      res.status(403).json({ message: "You can't edit this video" });
    }

    video.title = req.body.title || video.title;
    video.description = req.body.description || video.description;
    video.privacy = req.body.privacy || video.privacy;
    video.thumbnail = req.body.thumbnail || video.thumbnail;
    try {
      const updatedVideo = await video.save();
      res.json(updatedVideo);
    } catch (err) {
      res.status(400).json({ message: err });
    }
  } catch (e) {
    next(e);
  }
});

// Like a video
router.post("/:id/like", verifyToken, async (req, res, next) => {
  try {
    const video = await videoSchema.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    if (video.likes.map((objId) => objId.toString()).includes(req.userId)) {
      return res.status(400).json({ message: "You already liked this video" });
    }
    if (video.dislikes.map((objId) => objId.toString()).includes(req.userId)) {
      video.dislikes = video.dislikes.filter(
        (like) => like.toString() !== req.userId
      );
    }
    video.likes.push(req.userId);
    video.likeCount += 1;
    try {
      const updatedVideo = await video.save();
      res.json({ message: "Video liked" });
    } catch (err) {
      res.status(400).json({ message: err });
    }
  } catch (e) {
    next(e);
  }
});

// Unlike a video (remove like)
router.post("/:id/unlike", verifyToken, async (req, res, next) => {
  try {
    const video = await videoSchema.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    if (!video.likes.map((objId) => objId.toString()).includes(req.userId)) {
      return res
        .status(400)
        .json({ message: "You have not liked this video." });
    }
    video.likes = video.likes.filter((like) => like.toString() !== req.userId);
    video.likeCount -= 1;
    try {
      const updatedVideo = await video.save();
      res.json({ message: "Video unliked" });
    } catch (err) {
      res.status(400).json({ message: err });
    }
  } catch (e) {
    next(e);
  }
});

// Dislike a video
router.post("/:id/dislike", verifyToken, async (req, res, next) => {
  try {
    const video = await videoSchema.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    if (video.dislikes.map((objId) => objId.toString()).includes(req.userId)) {
      return res
        .status(400)
        .json({ message: "You already disliked this video" });
    }
    if (video.likes.map((objId) => objId.toString()).includes(req.userId)) {
      video.likes = video.likes.filter(
        (like) => like.toString() !== req.userId
      );
    }
    video.dislikes.push(req.userId);
    video.dislikeCount += 1;
    try {
      const updatedVideo = await video.save();
      res.json({ message: "Video disliked" });
    } catch (err) {
      res.status(400).json({ message: err });
    }
  } catch (e) {
    next(e);
  }
});

// Undislike a video (remove dislike)
router.post("/:id/undislike", verifyToken, async (req, res, next) => {
  try {
    const video = await videoSchema.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }
    console.log(video.dislikes.map((objId) => objId.toString()));
    if (!video.dislikes.map((objId) => objId.toString()).includes(req.userId)) {
      return res
        .status(400)
        .json({ message: "You have not liked this video." });
    }
    video.dislikes = video.dislikes.filter(
      (like) => like.toString() !== req.userId
    );
    video.dislikeCount -= 1;
    try {
      const updatedVideo = await video.save();
      res.json({ message: "Video undisliked" });
    } catch (err) {
      res.status(400).json({ message: err });
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
