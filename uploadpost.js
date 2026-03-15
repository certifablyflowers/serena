// uploadpost.js
// Posts videos to TikTok, Instagram, and YouTube via upload-post.com
// Usage: const { postVideo, checkStatus } = require('./uploadpost')

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const UPLOAD_POST_API_KEY = process.env.UPLOAD_POST_API_KEY;
const UPLOAD_POST_USER    = 'NerdGGTeam';

const VALID_PLATFORMS = ['tiktok', 'instagram', 'youtube'];

// ─── Post a video file ─────────────────────────────────────────────────────────
async function postVideo({ videoPath, caption, platforms = ['tiktok', 'instagram'] }) {
  const invalid = platforms.filter(p => !VALID_PLATFORMS.includes(p));
  if (invalid.length) {
    return { success: false, error: `Invalid platforms: ${invalid.join(', ')}. Use: ${VALID_PLATFORMS.join(', ')}` };
  }

  if (!fs.existsSync(videoPath)) {
    return { success: false, error: `Video file not found: ${videoPath}` };
  }

  console.log(`[UploadPost] 📤 Posting to ${platforms.join(', ')}...`);

  try {
    const form = new FormData();
    form.append('video', fs.createReadStream(videoPath));
    form.append('title', caption);
    form.append('user', UPLOAD_POST_USER);
    platforms.forEach(p => form.append('platform[]', p));

    const response = await axios.post(
      'https://api.upload-post.com/api/upload',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Apikey ${UPLOAD_POST_API_KEY}`
        }
      }
    );

    const requestId = response.data.request_id;
    console.log(`[UploadPost] ✅ Queued. Request ID: ${requestId}`);
    return { success: true, requestId };

  } catch (err) {
    const message = err.response?.data?.message || err.message;
    console.error('[UploadPost] ❌ Error:', message);
    return { success: false, error: message };
  }
}

// ─── Check post status ─────────────────────────────────────────────────────────
async function checkStatus(requestId) {
  console.log(`[UploadPost] 🔍 Checking status for ${requestId}...`);

  try {
    const response = await axios.get(
      `https://api.upload-post.com/api/uploadposts/status?request_id=${requestId}`,
      {
        headers: { 'Authorization': `Apikey ${UPLOAD_POST_API_KEY}` }
      }
    );

    const status = response.data;
    console.log('[UploadPost] Status:', JSON.stringify(status));
    return { success: true, status };

  } catch (err) {
    const message = err.response?.data?.message || err.message;
    console.error('[UploadPost] ❌ Error:', message);
    return { success: false, error: message };
  }
}

module.exports = { postVideo, checkStatus };
