const router = require("express").Router();
const verifyToken = require("../../middleware/auth");
const UserSchema = require("../../models/user");
const VideoSchema = require("../../models/video");

// Get all users
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const results = {};
  const users = await UserSchema.find();
  const retUsers = users.map((user) => {
    return {
      _id: user._id.toString(),
      userName: user.userName,
      subsriberCount: user.subscriberCount,
      firstName: user.firstName,
      lastName: user.lastName,
      imageURL: user.imageURL,
    };
  });
  results.users = retUsers.slice(startIndex, endIndex);
  if (endIndex < users.length) {
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

// Get user by id
router.get("/:id", async (req, res, next) => {
  try {
    const user = await UserSchema.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const retUser = {
      _id: user._id.toString(),
      userName: user.userName,
      subscriberCount: user.subscriberCount,
      firstName: user.firstName,
      lastName: user.lastName,
      imageURL: user.imageURL,
    };
    res.json(retUser);
  } catch (err) {
    next(err);
  }
});

router.post("/:id/subscribe", verifyToken, async (req, res, next) => {
  try {
    const user = await UserSchema.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (
      user.subscribers.map((objId) => objId.toString()).includes(req.userId)
    ) {
      return res
        .status(400)
        .json({ message: "You already subscribed to this user" });
    }
    user.subscribers.push(req.userId);
    user.subscriberCount += 1;
    const updatedUser = await user.save();
    res.json({ message: "Subscribed to user" });
  } catch (e) {
    next(e);
  }
});

router.post("/:id/unsubscribe", verifyToken, async (req, res, next) => {
  try {
    const user = await UserSchema.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (
      !user.subscribers.map((objId) => objId.toString()).includes(req.userId)
    ) {
      return res
        .status(400)
        .json({ message: "You have not subscribed to this user." });
    }
    user.subscribers = user.subscribers.filter(
      (sub) => sub.toString() !== req.userId
    );
    user.subscriberCount -= 1;
    const updatedUser = await user.save();
    res.json({ message: "Unsubscribed from user" });
  } catch (e) {
    next(e);
  }
});

router.get("/:id/videos", async (req, res, next) => {
  try {
    const user = await UserSchema.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const videos = await VideoSchema.find({ uploader: req.params.id });
    res.json(videos);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
