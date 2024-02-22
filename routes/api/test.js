const router = require("express").Router();
const verifyToken = require("../../middleware/auth");

router.get("/", verifyToken, (req, res) => {
  res.json({ message: "API Test Index" });
});

module.exports = router;
