const router = require("express").Router();
const User = require("../../models/user");
const bcrypt = require("bcrypt");

router.post("/", async (req, res, next) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      userName: username,
      password: hashedPassword,
      email,
      firstName,
      lastName,
    });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    // if (error.code === 11000) {
    //   return res.status(400).json({ error: "User already exists" });
    // }
    next(error);
  }
});

module.exports = router;
