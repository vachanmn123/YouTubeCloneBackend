const router = require("express").Router();
const fs = require("fs");

// Require all routes in the routes directory
fs.readdirSync(__dirname).forEach((file) => {
  if (file.indexOf(".") === -1) {
    // Set the route for each file in the directory
    // For example, if the file is called "test.js", the route will be "/test"
    router.use(`/${file}`, require(`./${file}`));
  }
});

module.exports = router;
