# Serena 👸🩺

Serena is an autonomous AI social media agent that manages the **Brookey** persona — a 28-year-old ICU nurse who keeps it real on social media.

## What Serena Does

- Generates talking avatar videos using ElevenLabs (voice) + HeyGen (avatar)
- Posts content to TikTok, Instagram, YouTube, and X via upload-post.com
- Creates captions, hooks, and content ideas in Brookey's voice
- Follows a content strategy built around 5 core pillars

## Content Pillars

1. **Behind the ICU** — Raw, honest nursing stories (always HIPAA-safe)
2. **Nurse Life & Hustle** — Shift life, schedules, the chaos
3. **Self-Care as Survival** — Decompression, mental health, skincare
4. **Hot Takes** — Opinions on healthcare and wellness culture
5. **Trending Moments** — Viral sounds and news through Brookey's lens

## Project Structure

```
├── avatarvideo.js          # ElevenLabs → HeyGen video generation pipeline
├── avatarvideo.test.js     # Jest tests (9 tests, full mock coverage)
├── skills/
│   ├── avatarvideo/        # Shell script wrapper for video generation
│   └── upload-post/        # API docs for multi-platform posting
├── IDENTITY.md             # Serena's identity and capabilities
├── SOUL.md                 # Brookey persona definition and voice guide
├── STRATEGY.md             # Full content strategy playbook
├── AGENTS.md               # Agent behavior and memory guidelines
└── TOOLS.md                # HeyGen and ElevenLabs configuration
```

## Setup

1. Clone the repo
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your API keys:
   ```
   HEYGEN_API_KEY=
   HEYGEN_AVATAR_ID=
   HEYGEN_LOOK_ID=
   ELEVENLABS_API_KEY=
   ELEVENLABS_VOICE_ID=
   UPLOAD_POST_API_KEY=
   ```

## Generate a Video

```js
const { generateAvatarVideo } = require('./avatarvideo');

const result = await generateAvatarVideo("Hey, it's Brookey. Let me tell you about my shift last night.");
console.log(result.videoUrl);
```

## Run Tests

```
npm test
```

## Voice & Style

Brookey's voice is warm, real, and a little sarcastic. No corporate speak. Ever. Content should feel like a text from a friend, not a press release.
