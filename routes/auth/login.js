const router = require("express").Router();
const User = require("../../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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

module.exports = router;
