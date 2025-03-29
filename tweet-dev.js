// Set development environment before loading the main script
process.env.NODE_ENV = "development";
console.log(
  "Running in DEVELOPMENT mode - Make.com webhook calls will be skipped"
);

// Run the main generator script
require("./tweet-generator.js");
