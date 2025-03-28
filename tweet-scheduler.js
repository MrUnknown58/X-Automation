const puppeteer = require("puppeteer");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Get trending topics from Twitter
async function getTrendingTopics(page) {
  try {
    await page.goto("https://twitter.com/explore/tabs/trending", {
      waitUntil: "networkidle2",
    });

    // Wait for trends to load
    await page.waitForSelector('[data-testid="trend"]', { timeout: 30000 });

    // Extract trending topics
    const trends = await page.evaluate(() => {
      const trendElements = document.querySelectorAll('[data-testid="trend"]');
      return Array.from(trendElements)
        .slice(0, 5)
        .map((el) => {
          const textContent = el.textContent;
          // Extract the trend name (this selector might need updating based on Twitter's DOM)
          return textContent.split("·")[0].trim();
        });
    });

    return trends.filter((trend) => trend && !trend.includes("promoted"));
  } catch (err) {
    console.error("Error getting trends:", err);
    return [];
  }
}

// Generate tweet based on trends
async function generateTrendingTweet(trends) {
  const trendsList = trends.join(", ");

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Generate an insightful tweet about one of these trending topics: ${trendsList}.
      
      - Within 280 characters
      - Informative and engaging
      - Include 1-2 relevant hashtags
      - Relate to current events or technology
      - Only output the tweet text, no additional context`,
  });

  return response.candidates[0].content.parts[0].text.trim();
}

// Improved Twitter login function
async function twitterLogin(page) {
  console.log("Starting Twitter login process...");

  try {
    // Navigate to Twitter login page
    await page.goto("https://twitter.com/i/flow/login", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    console.log("Loaded login page");

    // Wait for the username field and enter username
    await page.waitForSelector('input[autocomplete="username"]', {
      timeout: 30000,
    });
    console.log("Found username field");

    // Type username slowly to appear more human-like
    await page.type(
      'input[autocomplete="username"]',
      process.env.TWITTER_USERNAME,
      { delay: 100 }
    );
    console.log("Entered username");

    // Take a debug screenshot
    await page.screenshot({ path: "debug-username.png" });

    // Look for the Next button and click it
    const nextButtonSelector = 'div[data-testid="Button"]';
    await page.waitForSelector(nextButtonSelector, { timeout: 10000 });

    const foundNextButton = await page.evaluate(() => {
      const buttons = Array.from(
        document.querySelectorAll('div[role="button"]')
      );
      const nextBtn = buttons.find(
        (btn) => btn.textContent && btn.textContent.includes("Next")
      );
      if (nextBtn) {
        nextBtn.setAttribute("data-found-next", "true");
        return true;
      }
      return false;
    });

    if (foundNextButton) {
      await page.click('[data-found-next="true"]');
      console.log("Clicked Next button");
    } else {
      console.log("Next button not found by text. Trying fallback...");
      await page.click('div[data-testid="Button"]');
    }

    // Wait a moment for the transition
    await page.waitForTimeout(2000);

    // Handle possible "unusual activity" verification screen
    const unusualActivityText = await page.$(
      'span:has-text("Verify your identity")'
    );
    if (unusualActivityText) {
      console.log("Detected verification screen, entering email/phone...");
      // Handle verification if needed - this would need implementation specific to your account
    }

    // Wait for password field
    await page.waitForSelector('input[name="password"]', { timeout: 20000 });
    console.log("Found password field");

    // Type password slowly
    await page.type('input[name="password"]', process.env.TWITTER_PASSWORD, {
      delay: 100,
    });
    console.log("Entered password");

    // Take a debug screenshot before clicking login
    await page.screenshot({ path: "debug-password.png" });

    // Find and click the login button
    const loginButton = await page.evaluate(() => {
      const buttons = Array.from(
        document.querySelectorAll('div[role="button"]')
      );
      const loginBtn = buttons.find(
        (btn) => btn.textContent && btn.textContent.includes("Log in")
      );
      if (loginBtn) {
        loginBtn.setAttribute("data-login-button", "true");
        return true;
      }
      return false;
    });

    if (loginButton) {
      await page.click('[data-login-button="true"]');
      console.log("Clicked Login button");
    } else {
      console.log("Login button not found by text. Trying fallback...");
      await page.click('div[data-testid="Button"]');
    }

    // Wait for navigation after login
    await page.waitForNavigation({ timeout: 60000 });
    console.log("Navigation complete after login attempt");

    // Take a final debug screenshot
    await page.screenshot({ path: "debug-after-login.png" });

    // Check for error messages
    const errorMessage = await page.$('span:has-text("Wrong password")');
    if (errorMessage) {
      console.error("Login error: Wrong password detected");
      return false;
    }

    // Check if login was successful by looking for home timeline
    await page.waitForTimeout(5000); // Allow time for redirection
    const currentUrl = page.url();
    const isLoggedIn =
      currentUrl.includes("twitter.com/home") ||
      (await page.$('a[aria-label="Home"]')) !== null ||
      (await page.$('div[aria-label="Timeline: Home"]')) !== null;

    console.log(`Login check - Current URL: ${currentUrl}`);
    console.log(`Login successful: ${isLoggedIn}`);

    return isLoggedIn;
  } catch (error) {
    console.error(`Login error: ${error.message}`);
    await page.screenshot({ path: "login-error.png" });
    return false;
  }
}

// Post tweet
async function postTweet(tweetText) {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--window-size=1280,960",
    ],
  });

  let page;
  try {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 960 });

    // For debugging, enable console logs from the browser
    page.on("console", (msg) => console.log("BROWSER CONSOLE:", msg.text()));

    // Login
    console.log("Attempting to log in to Twitter...");
    const loginSuccess = await twitterLogin(page);
    if (!loginSuccess) {
      console.error(
        "Login failed. Check credentials or if there are additional verification steps."
      );
      throw new Error("Twitter login failed - check screenshots for details");
    }

    // Get trending topics
    const trends = await getTrendingTopics(page);

    // Generate tweet based on trends
    const finalTweetText =
      trends.length > 0 ? await generateTrendingTweet(trends) : tweetText;

    console.log("Posting tweet:", finalTweetText);

    // Navigate to home page
    await page.goto("https://twitter.com/home", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    console.log("Loaded home page");
    await page.screenshot({ path: "home-page.png" });

    // Wait for the page to be fully loaded
    await page.waitForTimeout(3000);

    // First find and click the "Post" button in the left sidebar to open the composer
    try {
      const postButtonSelector = '[data-testid="SideNav_NewTweet_Button"]';
      await page.waitForSelector(postButtonSelector, { timeout: 10000 });
      console.log("Found New Tweet button in sidebar");
      await page.click(postButtonSelector);
      console.log("Clicked New Tweet button");
      await page.waitForTimeout(1000);
    } catch (err) {
      console.log(
        "Could not find sidebar New Tweet button, trying direct input method..."
      );
    }

    // Now find the input field with "What's happening?" placeholder
    const tweetInputSelector = 'div[aria-label="Text editor"]';
    const placeholderSelector = 'div[data-placeholder="What\'s happening?"]';

    // Try multiple selectors to find the input area
    let inputElement = null;
    if (await page.$(tweetInputSelector)) {
      inputElement = tweetInputSelector;
    } else if (await page.$(placeholderSelector)) {
      inputElement = placeholderSelector;
    } else {
      console.log("Looking for other possible selectors...");
      const contentEditableSelector =
        'div[role="textbox"][contenteditable="true"]';
      if (await page.$(contentEditableSelector)) {
        inputElement = contentEditableSelector;
      }
    }

    if (!inputElement) {
      throw new Error("Could not find tweet input area");
    }

    console.log(`Found tweet input with selector: ${inputElement}`);
    await page.waitForSelector(inputElement, { timeout: 10000 });

    // Click on it to focus
    await page.click(inputElement);
    console.log("Clicked on input area");

    // Type the tweet
    await page.keyboard.type(finalTweetText);
    console.log("Typed tweet content");
    await page.screenshot({ path: "after-typing.png" });

    // Wait a moment before posting
    await page.waitForTimeout(1000);

    // Look for the Post button
    console.log("Looking for Post button...");
    const postButtonSelectors = [
      '[data-testid="tweetButton"]',
      '[data-testid="tweetButtonInline"]',
      'button[type="submit"]',
      '[aria-label="Post"]',
    ];

    let buttonFound = false;
    for (const selector of postButtonSelectors) {
      try {
        const buttonExists = await page.$(selector);
        if (buttonExists) {
          console.log(`Found Post button with selector: ${selector}`);
          await page.click(selector);
          buttonFound = true;
          console.log("Clicked Post button");
          break;
        }
      } catch (err) {
        console.log(`Selector ${selector} not found, trying next...`);
      }
    }

    // If standard selectors don't work, try finding by text content
    if (!buttonFound) {
      try {
        const postButton = await page.evaluate(() => {
          const buttons = Array.from(
            document.querySelectorAll('div[role="button"], button')
          );
          const postBtn = buttons.find(
            (btn) =>
              btn.textContent &&
              (btn.textContent.includes("Post") ||
                btn.textContent.includes("Tweet"))
          );
          if (postBtn) {
            postBtn.setAttribute("data-found-button", "true");
            return true;
          }
          return false;
        });

        if (postButton) {
          await page.click('[data-found-button="true"]');
          buttonFound = true;
          console.log("Clicked Post button using text content search");
        }
      } catch (evalErr) {
        console.error("Error finding button by text content:", evalErr);
      }
    }

    if (!buttonFound) {
      throw new Error("Could not find Post button");
    }

    // Wait for tweet to be posted
    await page.waitForTimeout(5000);
    await page.screenshot({ path: "after-posting.png" });

    // Log out after posting
    console.log("Attempting to log out...");
    try {
      const accountMenuSelector = '[data-testid="Account"]';
      const accountMenuSelectorAlt = '[data-testid="accountSwitcher"]';

      if (await page.$(accountMenuSelector)) {
        await page.click(accountMenuSelector);
      } else if (await page.$(accountMenuSelectorAlt)) {
        await page.click(accountMenuSelectorAlt);
      } else {
        const menuButton = await page.evaluate(() => {
          const buttons = Array.from(
            document.querySelectorAll(
              '[aria-label*="account"], [aria-label*="Account"]'
            )
          );
          if (buttons.length > 0) {
            buttons[0].setAttribute("data-found-account", "true");
            return true;
          }
          return false;
        });

        if (menuButton) {
          await page.click('[data-found-account="true"]');
        }
      }

      await page.waitForTimeout(1000);

      const logoutSelector = '[data-testid="logout"]';

      if (await page.$(logoutSelector)) {
        await page.click(logoutSelector);
      } else {
        await page.evaluate(() => {
          const menuItems = Array.from(
            document.querySelectorAll('div[role="menuitem"]')
          );
          const logoutItem = menuItems.find(
            (item) => item.textContent && item.textContent.includes("Log out")
          );
          if (logoutItem) {
            logoutItem.setAttribute("data-logout", "true");
            return true;
          }
          return false;
        });

        if (await page.$('[data-logout="true"]')) {
          await page.click('[data-logout="true"]');
        }
      }

      await page.waitForTimeout(1000);
      const confirmLogoutSelector = '[data-testid="confirmationSheetConfirm"]';
      if (await page.$(confirmLogoutSelector)) {
        await page.click(confirmLogoutSelector);
        console.log("Successfully logged out");
      }
    } catch (logoutErr) {
      console.error("Error during logout:", logoutErr);
      console.log("Continuing despite logout failure");
    }

    console.log("Tweet posted successfully!");
    return true;
  } catch (err) {
    console.error("Error posting tweet:", err);
    if (page) {
      try {
        await page.screenshot({ path: "error-posting-tweet.png" });
      } catch (screenshotError) {
        console.error("Could not take error screenshot:", screenshotError);
      }
    }
    return false;
  } finally {
    await browser.close();
  }
}

// Main function
async function main() {
  // Default tweet if no trends are found
  const defaultTweet = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Generate a concise, engaging, and insightful tweet about current technologies (e.g., React, Node.js, Golang, AI, DevOps, etc.).
      
      - Within 280 characters.
      - Informative or engaging.
      - Include 1-3 relevant hashtags.
      - No extra text, only the tweet content.`,
  });

  const defaultTweetText =
    defaultTweet.candidates[0].content.parts[0].text.trim();

  await postTweet(defaultTweetText);
  process.exit(0);
}

main();
