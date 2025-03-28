# AI Tweet Generator - No API Keys Required

This project helps you generate Twitter/X content without requiring the paid Twitter API. It uses Google's Gemini AI to generate engaging tweet content and offers multiple posting methods - all using free tools.

## Features

- 🚫 No paid Twitter API needed
- 🤖 AI-powered tweets using Google's Gemini
- 📱 Multiple posting options:
  - Web interface for manual posting
  - GitHub Actions for automatic content + clickable links
  - Make.com integration for automated posting (free: 1,000 ops/month)
  - Buffer integration for scheduled posting (free: 10 scheduled posts)
  - ~~IFTTT integration for automated posting (free: 25 posts/day)~~
- 🔒 No automation that gets accounts locked

## Prerequisites

- Node.js (v14 or newer)
- Google Gemini API key (free tier available)
- GitHub account (for scheduled generation)
- Optional: Make.com or Buffer account for automated posting

## Quick Start Guide

### 1. Local Development Setup

```bash
# Clone repository & install dependencies
git clone https://github.com/yourusername/tweeter-automation.git
cd tweeter-automation
npm install

# Create environment file
cp .env.example .env

# Add your Gemini API key to .env
# GEMINI_API_KEY=your_key_here
```

### 2. Generate and Post Tweets

#### Method A: Web Interface

```bash
# Start the server
npm start

# Open http://localhost:3000 in your browser
# Generate tweets and post manually via browser
```

#### Method B: GitHub Auto-Generation

```bash
# Run locally first to test
node tweet-generator.js

# Check generated-tweets.md for clickable tweet links
# Check buffer-tweets.csv for Buffer import data
```

## Testing in Development Environment

Follow these step-by-step instructions to test all features of this project locally:

### 1. Initial Setup Verification

```bash
# Clone and install dependencies
git clone https://github.com/yourusername/tweeter-automation.git
cd tweeter-automation
npm install

# Set up your environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 2. Test Tweet Generation Script

```bash
# Run the tweet generator script
node tweet-generator.js

# Expected results:
# - Console should show generated tweet content
# - A new tweet should appear in generated-tweets.md
# - A new entry should be added to buffer-tweets.csv
```

### 3. Test Make.com Integration

1. Create a free Make.com account
2. Create a new scenario:
   - Add a "Webhook" trigger (copy the webhook URL)
   - Add "Tools > Set variable" module to store incoming data
   - Add "Twitter > Create a Tweet" module (authenticate your Twitter account)
   - Connect modules so webhook data flows to Twitter
3. Update your `.env` file:
   ```
   MAKE_WEBHOOK_URL=your_webhook_url_from_make
   ```
4. Test the integration:
   ```bash
   node tweet-generator.js
   ```
5. Check Make.com to verify:
   - Webhook received the data
   - Tweet was published (or queued)

### 4. Test Web Interface

```bash
# Start the web server
npm start

# Open http://localhost:3000 in your browser
```

1. Test random tweet generation:

   - Click "Generate Random Tweet" button
   - Verify tweet appears in the text area
   - Verify character count updates correctly
   - Click "Copy to Clipboard" and verify it works
   - Click "Open Twitter to Post" and verify it opens a pre-populated tweet

2. Test topic-based generation:
   - Enter a topic (e.g., "Cloud Computing")
   - Click "Generate Tweet on Topic"
   - Verify tweet about the topic appears

### 5. Test Buffer CSV Export

1. Generate tweets with:

   ```bash
   node tweet-generator.js
   ```

2. Find and open `buffer-tweets.csv`
3. Log into Buffer and test import:
   - Go to Publishing → Settings → Data Export & Import
   - Select "Import" and upload the CSV file
   - Verify Buffer correctly schedules the tweets

### 6. Verify GitHub Action (Local Testing)

1. Install [act](https://github.com/nektos/act) to test GitHub Actions locally
2. Create a `.secrets` file with:
   ```
   GEMINI_API_KEY=your_api_key
   MAKE_WEBHOOK_URL=your_make_webhook_url
   ```
3. Run the GitHub Action locally:
   ```bash
   act -s GEMINI_API_KEY -s MAKE_WEBHOOK_URL
   ```
4. Verify:
   - Tweet gets generated
   - Markdown and CSV files are updated
   - Make.com webhook receives data (optional)

## Common Testing Issues

- **"GEMINI_API_KEY not found" error**: Make sure you've added your API key to the `.env` file
- **Tweets not generating**: Check Gemini API key validity or try adding console logs
- **Make.com webhook failing**: Verify your webhook URL and check Make.com execution history
- **Buffer CSV format issues**: Compare with example CSV or check documentation
- **Web interface not showing**: Verify port 3000 is available or change port in `.env`

## Deployment Options

### GitHub Actions (Recommended)

1. Push your code to GitHub:

```bash
git init
git add .
git commit -m "Initial setup"
git branch -M main
git remote add origin https://github.com/yourusername/tweeter-automation.git
git push -u origin main
```

2. Add your Gemini API key as a GitHub Secret:

   - Go to repository Settings → Secrets and variables → Actions
   - Add `GEMINI_API_KEY` secret with your API key
   - Optional: Add `MAKE_WEBHOOK_URL` for Make.com integration

3. The included GitHub Action will:
   - Run every 8 hours (configurable in `.github/workflows/schedule-tweet.yml`)
   - Generate tweets and add them to your repository
   - Create clickable tweet links

### Vercel Deployment (Web Interface)

1. Connect your GitHub repo to Vercel
2. Add your `GEMINI_API_KEY` as an environment variable
3. Deploy to get a live web interface for tweet generation

## Posting Methods Compared

| Method    | Free Limit   | Setup Difficulty | Safety Level |
| --------- | ------------ | ---------------- | ------------ |
| Web UI    | Unlimited    | Easiest          | Safest       |
| GitHub    | Unlimited    | Easy             | Very Safe    |
| Make.com  | 1,000 ops/mo | Medium           | Safe         |
| Buffer    | 10 posts     | Medium           | Safe         |
| ~~IFTTT~~ | ~~25/day~~   | ~~Medium-Hard~~  | ~~Medium~~   |

### Note About Automation Services:

- **Make.com**: Offers Twitter/X integration in free tier with 1,000 operations/month
- **Buffer**: Still offers Twitter posting with 10 scheduled posts on free tier
- **IFTTT**: Twitter/X integration is no longer available on the free tier

## Setting Up Make.com for Twitter Automation

1. Create a Make.com account at [make.com](https://www.make.com/)
2. Create a new scenario and add a "Webhook" trigger
   - Copy the generated webhook URL
   - Add this URL to your .env file as `MAKE_WEBHOOK_URL`
3. Add a "Twitter > Create a Tweet" module after the webhook
   - Connect your Twitter account when prompted
   - In the "Text" field, map the tweet content directly:
     - Click in the field to open the mapping panel
     - Select `1. Webhooks › tweet_text` from the list of available data
4. That's it! Save and activate your scenario

The tweet data sent from your application already contains all the information needed, so no additional variable storage module is required for basic functionality.

## Customizing Content

Edit prompts in `tweet-generator.js` or `index.js`:

```javascript
const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: `Generate an insightful tweet about... 
    // Modify this prompt to change style/topics
  `,
});
```

## Troubleshooting

- **No tweets generated**: Verify Gemini API key is correct
- **GitHub Actions not running**: Check if Actions are enabled in repository settings
- **Buffer not accepting CSV**: Make sure the CSV format matches exactly (Text,Schedule)

## Security Notes

- Never commit API keys to the repository
- Use GitHub Secrets for sensitive information
- The generated tweets will be visible in your public repository
