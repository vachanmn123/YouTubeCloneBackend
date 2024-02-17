const router = require("express").Router();

router.get("/", (req, res) => {
  res.json({ message: "API Test Index" });
});

module.exports = router;
