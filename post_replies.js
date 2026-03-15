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
    handle: 'CriticalCareNow',
    tweetId: '2033257108699775152',
    text: "The membrane has its own agenda. We've drained the same head twice and asked the same questions both times."
  },
  {
    handle: 'CriticalCareNow',
    tweetId: '2033226971287576781',
    text: "\"Drowning on dry land\" is exactly what it looks like in the room. The family never believes you until they do."
  },
  {
    handle: 'CriticalCareNow',
    tweetId: '2033166623457091986',
    text: "The first time you use a VL after learning on DL feels like cheating. It is not cheating."
  },
];

(async () => {
  for (const quote of quotes) {
    try {
      const tweetUrl = `https://x.com/${quote.handle}/status/${quote.tweetId}`;
      const res = await client.v2.tweet(`${quote.text}\n\n${tweetUrl}`);
      console.log(`✅ Quote-tweeted ${quote.tweetId}: ${res.data.id}`);
    } catch(e) {
      console.error(`❌ Failed on ${quote.tweetId}:`, e.data || e.message);
    }
  }
})();
