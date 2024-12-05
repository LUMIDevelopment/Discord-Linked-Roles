import express from 'express';
import cookieParser from 'cookie-parser';

import config from './config.js';
import * as discord from './discord.js';
import * as storage from './storage.js';

/**
 * Main HTTP server used for the bot.
 */

const app = express();
app.use(cookieParser(config.COOKIE_SECRET));

/**
 * Just a happy little route to show our server is up.
 */
app.get('/', (req, res) => {
  res.send('👋');
});

/**
 * Route configured in the Discord developer console which facilitates the
 * connection between Discord and any additional services you may use. 
 * To start the flow, generate the OAuth2 consent dialog url for Discord, 
 * and redirect the user there.
 */
app.get('/linked-role', async (req, res) => {
  const { url, state } = discord.getOAuthUrl();

  // Store the signed state param in the user's cookies so we can verify
  // the value later. See:
  // https://discord.com/developers/docs/topics/oauth2#state-and-security
  res.cookie('clientState', state, { maxAge: 1000 * 60 * 5, signed: true });

  // Send the user to the Discord owned OAuth2 authorization endpoint
  res.redirect(url);
});

/**
 * Route configured in the Discord developer console, the redirect Url to which
 * the user is sent after approving the bot for their Discord account. This
 * completes a few steps:
 * 1. Uses the code to acquire Discord OAuth2 tokens
 * 2. Uses the Discord Access Token to fetch the user profile
 * 3. Verifies the user ID against the allowed list
 * 4. Checks if the user has LUMI Premium
 */
const lumipremiumUserIds = ['563697359423406082', '811314363830501427'];
const serverownerUserIds = ['811314363830501427'];
const bughunterUserIds = ['1167048853451706439'];

app.get('/discord-oauth-callback', async (req, res) => {
  try {
    // 1. Uses the code to acquire Discord OAuth2 tokens
    const code = req.query['code'];
    const discordState = req.query['state'];

    // make sure the state parameter exists
    const { clientState } = req.signedCookies;
    if (clientState !== discordState) {
      console.error('State verification failed.');
      return res.sendStatus(403);
    }

    const tokens = await discord.getOAuthTokens(code);

    // 2. Uses the Discord Access Token to fetch the user profile
    const meData = await discord.getUserData(tokens);
    const userId = meData.user.id;

    // Check if the user ID is in the allowed list
    if (!lumipremiumUserIds.includes(userId) && !serverownerUserIds.includes(userId)) {
      return res.status(403).send('Access denied: User ID not in the allowed list.');
    }

    // Determine the metadata to push based on the user ID
    let metadata = {};
    if (lumipremiumUserIds.includes(userId)) {
      metadata = { lumipremium: true };
    } else if (serverownerUserIds.includes(userId)) {
      metadata = { serverowner: true };
    }

    // Push the metadata to Discord
    await discord.pushMetadata(userId, tokens, metadata);

    res.send('You did it! Now go back to Discord.');
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});