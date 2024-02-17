const router = require("express").Router();
const fs = require("fs");

subRoutes = [];

fs.readdirSync(__dirname).forEach((file) => {
  if (file.indexOf(".") === -1) {
    router.use(`/${file}`, require(`./${file}`));
  }
});

module.exports = router;
