const mongoose = require("mongoose");
const fs = require("fs");

// Loop through each file in the models directory and load the models
function loadModels() {
  fs.readdirSync(__dirname).forEach((file) => {
    if (file !== "index.js") {
      // Require each file in the models directory
      // This will call the code in each file, which will define the schema for each model
      require(`./${file}`);
      console.log(`Loaded model: ${file}`);
    }
  });
}

module.exports = loadModels;
