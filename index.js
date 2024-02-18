const express = require("express");
const connectMongo = require("./lib/mongo");

// Create an Express application
const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB on startup
// This initializes mongoose and connects to the MongoDB database
connectMongo();

// Middleware to parse the request body as JSON and URL encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use the routes/index.js file to handle all routes
const routes = require("./routes");
app.use("/", routes);

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}\nhttp://localhost:${port}`);
});
