require('dotenv').config();
const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey:       process.env.X_CONSUMER_KEY,
  appSecret:    process.env.X_CONSUMER_SECRET,
  accessToken:  process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

(async () => {
  try {
    const user = await client.v2.userByUsername('CriticalCareNow');
    console.log('User:', JSON.stringify(user.data));

    const res = await client.v2.userTimeline(user.data.id, { max_results: 5 });
    const tweets = res.data?.data || [];
    tweets.slice(0, 3).forEach(t => console.log(JSON.stringify({ id: t.id, text: t.text })));
  } catch(e) {
    console.log('Error:', e.data || e.message);
  }
})();
