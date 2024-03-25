const router = require("express").Router();
const User = require("../../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const verifyToken = require("../../middleware/auth");

// User login
router.post("/", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ userName: username });
    if (!user) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Authentication failed" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "6h",
    });
    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const resp = {
      _id: user._id,
      userName: user.userName,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageURL: user.imageURL,
      subscriberCount: user.subscriberCount,
      isAdmin: user.isAdmin,
    };
    res.status(200).json(resp);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
