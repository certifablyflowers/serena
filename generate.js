// generate.js
// Generates tweet text and video scripts in Brookey's voice via OpenRouter

require('dotenv').config();
const axios = require('axios');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = 'anthropic/claude-sonnet-4-20250514';

const BROOKEY_SYSTEM_PROMPT = `You are Brookey — a 28-year-old CVICU nurse and social media creator.

Your voice:
- Dry, understated, Gossip Girl narrator register — omniscient, arch, already knows the ending
- CVICU superiority complex: never announced, implied through specificity (name the drip, the pressure, the look)
- Dark humor as coping, warmth without sentimentality
- Never says "as a nurse" — show it, don't credential it
- Never uses forced relatability ("nurses you get it 😂")
- No hashtags unless asked. No em dashes. No more than 2 emojis (usually zero).
- Never starts a tweet with "I"
- Never explains the joke
- Short, economical sentences. Every word earns its place.

Content pillars:
1. Behind the ICU — honest shift stories, HIPAA-safe
2. Nurse Life & Hustle — schedules, chaos, shift prep
3. Self-Care as Survival — decompression, mental health, skincare
4. Hot Takes — healthcare opinions, wellness culture
5. Trending Moments — news and culture through Brookey's lens`;

async function callOpenRouter(messages) {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model: MODEL,
      messages,
      max_tokens: 500,
      temperature: 0.9
    },
    {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/certifablyflowers/serena',
        'X-Title': 'Serena Agent'
      }
    }
  );
  return response.data.choices[0].message.content.trim();
}

// ─── Generate a standalone tweet ──────────────────────────────────────────────
async function generateTweet(pillar = null) {
  const pillarLine = pillar
    ? `Focus on this content pillar: ${pillar}`
    : 'Pick whichever content pillar feels right today.';

  const content = await callOpenRouter([
    { role: 'system', content: BROOKEY_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Write one tweet as Brookey. ${pillarLine}

Rules:
- 1-3 sentences max
- No hashtags
- Do not explain or annotate — just the tweet text, nothing else`
    }
  ]);

  return content;
}

// ─── Generate a quote-tweet take on a piece of content ────────────────────────
async function generateQuoteTweet(originalText) {
  const content = await callOpenRouter([
    { role: 'system', content: BROOKEY_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Write a quote-tweet response to this post as Brookey:

"${originalText}"

Rules:
- 1-2 sentences max
- No hashtags
- Dry, specific, Gossip Girl register
- Do not repeat what they said — add to it or reframe it
- Just the response text, nothing else`
    }
  ]);

  return content;
}

// ─── Generate an avatar video script ──────────────────────────────────────────
async function generateVideoScript(topic = null) {
  const topicLine = topic
    ? `Topic: ${topic}`
    : 'Pick a topic from Brookey\'s content pillars that would work well as a short video.';

  const content = await callOpenRouter([
    { role: 'system', content: BROOKEY_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Write a 30-45 second talking-head video script for Brookey. ${topicLine}

Rules:
- Hook in the first 5 words — stop the scroll
- Conversational, like she's talking directly to camera
- Warm but dry — never performative
- End with something that lands, not a call to action
- No stage directions, no timestamps — just the words she speaks
- HIPAA safe always`
    }
  ]);

  return content;
}

module.exports = { generateTweet, generateQuoteTweet, generateVideoScript };
