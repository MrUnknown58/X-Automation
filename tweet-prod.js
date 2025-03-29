// Set production environment before loading the main script
process.env.NODE_ENV = "production";
console.log("Running in PRODUCTION mode - Make.com webhook calls WILL be sent");

// Run the main generator script
require("./tweet-generator.js");
