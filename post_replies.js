require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey:       process.env.X_CONSUMER_KEY,
  appSecret:    process.env.X_CONSUMER_SECRET,
  accessToken:  process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

const quotes = [
  {
    tweetId: '2032366050894102690',
    text: "Sepsis doesn't care about the data until it's in your room at 2am. Good paper though."
  },
  {
    tweetId: '2031641285443072474',
    text: "Machine learning catching what we've been eyeballing for years. Respect."
  },
  {
    tweetId: '2030916501323366681',
    text: "Early mobility saves people. The hard part is convincing everyone else in the room."
  },
];

(async () => {
  for (const quote of quotes) {
    try {
      const tweetUrl = `https://x.com/Crit_Care/status/${quote.tweetId}`;
      const res = await client.v2.tweet(`${quote.text}\n\n${tweetUrl}`);
      console.log(`✅ Quote-tweeted ${quote.tweetId}: ${res.data.id}`);
    } catch(e) {
      console.error(`❌ Failed on ${quote.tweetId}:`, e.data || e.message);
    }
  }
})();
