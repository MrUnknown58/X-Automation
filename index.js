const express = require("express");
const app = express();
const dotenv = require("dotenv");
const { GoogleGenAI } = require("@google/genai");
const path = require("path");

dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getTweet = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro-exp-03-25",
      contents: `Generate an engaging, conversational tweet about current trends in either technology or India.
          
          Make it:
          - Personal and human-like (use "I", ask questions, share opinions)
          - Conversational, as if talking to followers directly 
          - Include at least 2-3 relevant hashtags strategically placed
          - Within 280 characters, but use most of the available space
          - Mention current events or recent developments
          - End with a call-to-action inviting people to follow, share thoughts, or connect via hashtags
          - Sound like a real person, not AI-generated
          
          Only output the tweet text, no additional context.`,
    });

    return response.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error generating tweet:", error);
    return "Error generating tweet. Please try again.";
  }
};

const getTrendingTweet = async (topic) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro-exp-03-25",
      contents: `Generate an engaging, conversational tweet about ${topic}, incorporating current trends in either technology or India if relevant.
        
        Make it:
        - Personal and human-like (use "I", ask questions, share opinions)
        - Conversational, as if talking to followers directly
        - Include at least 2-3 relevant hashtags strategically placed
        - Within 280 characters, but use most of the available space
        - Mention current events or recent developments
        - End with a call-to-action inviting people to follow, share thoughts, or connect via hashtags
        - Sound like a real person, not AI-generated
        
        Only output the tweet text, no additional context.`,
    });

    return response.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error("Error generating trending tweet:", error);
    return "Error generating tweet. Please try again.";
  }
};

// API endpoint to generate a tweet
app.get("/api/generate-tweet", async (req, res) => {
  const tweet = await getTweet();
  res.json({ tweet });
});

// API endpoint to generate a tweet about a specific topic
app.post("/api/generate-topic-tweet", async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }
  const tweet = await getTrendingTweet(topic);
  res.json({ tweet });
});

// Serve the main HTML page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(
    `Open http://localhost:${port} in your browser to use the tweet generator`
  );
});
