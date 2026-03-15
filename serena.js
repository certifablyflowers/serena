// serena.js
// Main pipeline — scheduled content engine for Brookey
// Start with: pm2 start ecosystem.config.js

require('dotenv').config();
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const { generateTweet, generateQuoteTweet, generateVideoScript } = require('./generate');
const { postTweet } = require('./tweet');
const { postVideo, checkStatus } = require('./uploadpost');
const { generateAvatarVideo } = require('./avatarvideo');
const { TwitterApi } = require('twitter-api-v2');

// ─── State: track which tweets we've already engaged with ─────────────────────
const STATE_FILE = path.join(__dirname, 'state.json');

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return { engagedTweetIds: [] };
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function markEngaged(tweetId) {
  const state = loadState();
  if (!state.engagedTweetIds.includes(tweetId)) {
    state.engagedTweetIds.push(tweetId);
    // Keep last 500 to avoid unbounded growth
    if (state.engagedTweetIds.length > 500) {
      state.engagedTweetIds = state.engagedTweetIds.slice(-500);
    }
    saveState(state);
  }
}

function alreadyEngaged(tweetId) {
  return loadState().engagedTweetIds.includes(tweetId);
}

// ─── X client ─────────────────────────────────────────────────────────────────
const xClient = new TwitterApi({
  appKey:       process.env.X_CONSUMER_KEY,
  appSecret:    process.env.X_CONSUMER_SECRET,
  accessToken:  process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

// ─── Nursing accounts to monitor ──────────────────────────────────────────────
const NURSING_ACCOUNTS = [
  { handle: 'Crit_Care',       id: '1617837012' },
  { handle: 'niccjournal',     id: '1202646770737729536' },
  { handle: 'Gyathshammha',    id: '305882906' },
  { handle: 'CriticalCareNow', id: '210653242' },
];

// ─── Jobs ──────────────────────────────────────────────────────────────────────

async function jobMorningTweet() {
  console.log('[Serena] 🌅 Morning tweet...');
  try {
    const pillars = ['Behind the ICU', 'Nurse Life & Hustle', 'Hot Takes'];
    const pillar = pillars[new Date().getDay() % pillars.length];
    const text = await generateTweet(pillar);
    const result = await postTweet(text);
    if (result.success) {
      console.log('[Serena] ✅ Morning tweet posted:', result.url);
    } else {
      console.error('[Serena] ❌ Morning tweet failed:', result.error);
    }
  } catch (err) {
    console.error('[Serena] ❌ Morning tweet error:', err.message);
  }
}

async function jobEveningTweet() {
  console.log('[Serena] 🌙 Evening tweet...');
  try {
    const pillars = ['Self-Care as Survival', 'Trending Moments', 'Hot Takes'];
    const pillar = pillars[new Date().getDay() % pillars.length];
    const text = await generateTweet(pillar);
    const result = await postTweet(text);
    if (result.success) {
      console.log('[Serena] ✅ Evening tweet posted:', result.url);
    } else {
      console.error('[Serena] ❌ Evening tweet failed:', result.error);
    }
  } catch (err) {
    console.error('[Serena] ❌ Evening tweet error:', err.message);
  }
}

async function jobEngageNursingAccounts() {
  console.log('[Serena] 💬 Engaging nursing accounts...');
  let engagedCount = 0;

  for (const account of NURSING_ACCOUNTS) {
    try {
      const res = await xClient.v2.userTimeline(account.id, { max_results: 5 });
      const tweets = res.data?.data || [];

      for (const tweet of tweets.slice(0, 3)) {
        if (alreadyEngaged(tweet.id)) continue;
        if (tweet.text.startsWith('RT ')) continue; // skip retweets

        const take = await generateQuoteTweet(tweet.text);
        const tweetUrl = `https://x.com/${account.handle}/status/${tweet.id}`;
        const result = await postTweet(`${take}\n\n${tweetUrl}`);

        if (result.success) {
          markEngaged(tweet.id);
          engagedCount++;
          console.log(`[Serena] ✅ Quoted @${account.handle}: ${tweet.id}`);
        } else {
          console.error(`[Serena] ❌ Quote failed for ${tweet.id}:`, result.error);
        }

        // Pace it — don't blast 12 tweets at once
        await new Promise(r => setTimeout(r, 8000));
      }
    } catch (err) {
      console.error(`[Serena] ❌ Error fetching @${account.handle}:`, err.message);
    }
  }

  console.log(`[Serena] 💬 Engagement done. ${engagedCount} new quote-tweets posted.`);
}

async function jobAvatarVideo() {
  console.log('[Serena] 🎬 Avatar video pipeline...');
  try {
    const script = await generateVideoScript();
    console.log('[Serena] 📝 Script generated:', script.slice(0, 80) + '...');

    const videoResult = await generateAvatarVideo(script);
    if (!videoResult.success) {
      console.error('[Serena] ❌ Video generation failed:', videoResult.error);
      return;
    }

    console.log('[Serena] 🎞️ Video ready:', videoResult.videoUrl);

    // Download the video to a temp file then upload
    const axios = require('axios');
    const tmpPath = `/tmp/brookey_${Date.now()}.mp4`;
    const writer = require('fs').createWriteStream(tmpPath);
    const response = await axios({ url: videoResult.videoUrl, responseType: 'stream' });
    await new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    const caption = script.split('\n')[0].slice(0, 150); // first line as caption
    const postResult = await postVideo({
      videoPath: tmpPath,
      caption,
      platforms: ['tiktok', 'instagram']
    });

    if (postResult.success) {
      console.log('[Serena] ✅ Video posted. Request ID:', postResult.requestId);
      // Check status after 2 minutes
      setTimeout(async () => {
        const status = await checkStatus(postResult.requestId);
        console.log('[Serena] 📊 Video status:', JSON.stringify(status.status));
        fs.unlinkSync(tmpPath);
      }, 120000);
    } else {
      console.error('[Serena] ❌ Video post failed:', postResult.error);
      fs.unlinkSync(tmpPath);
    }
  } catch (err) {
    console.error('[Serena] ❌ Avatar video error:', err.message);
  }
}

// ─── Schedule ──────────────────────────────────────────────────────────────────
//
//  8:00am  — morning tweet
//  10:00am — engage nursing accounts
//  3:00pm  — avatar video
//  7:00pm  — evening tweet
//
// All times local to the machine running the process.

console.log('[Serena] 🚀 Starting up...');

cron.schedule('0 8 * * *',  jobMorningTweet,           { name: 'morning-tweet' });
cron.schedule('0 10 * * *', jobEngageNursingAccounts,  { name: 'engage' });
cron.schedule('0 15 * * *', jobAvatarVideo,            { name: 'avatar-video' });
cron.schedule('0 19 * * *', jobEveningTweet,           { name: 'evening-tweet' });

console.log('[Serena] ✅ Scheduled:');
console.log('  08:00 — morning tweet');
console.log('  10:00 — engage nursing accounts');
console.log('  15:00 — avatar video → TikTok + Instagram');
console.log('  19:00 — evening tweet');
console.log('[Serena] Waiting...\n');
