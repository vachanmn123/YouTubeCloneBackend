const router = require("express").Router();

const fs = require("fs");

fs.readdirSync(__dirname).forEach((file) => {
  if (file.endsWith(".js") && file !== "index.js") {
    const route = file.split(".")[0];
    router.use(`/${route}`, require(`./${route}`));
  }
});

module.exports = router;
