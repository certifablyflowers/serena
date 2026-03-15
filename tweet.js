// tweet.js
// Posts tweets as Brookey via the X API
// Usage: const { postTweet } = require('./tweet')

const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey:       process.env.X_CONSUMER_KEY,
  appSecret:    process.env.X_CONSUMER_SECRET,
  accessToken:  process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

async function postTweet(text) {
  try {
    console.log('[Tweet] Posting to X...');
    const response = await client.v2.tweet(text);
    const id = response.data.id;
    console.log('[Tweet] ✅ Posted:', id);
    return { success: true, id, url: `https://x.com/i/web/status/${id}` };
  } catch (err) {
    console.error('[Tweet] ❌ Error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { postTweet };
