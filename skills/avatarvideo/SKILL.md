# Avatar Video Skill

When asked to create an avatar video, your job is to **write a shell script file** that does all the work. You do NOT run the commands yourself — you write them to a file and tell the user to run it.

## Your Job

1. Take the video script text from the user
2. Write a ready-to-run shell script to: `~/make-brookey-video.sh`
3. Tell the user to run it in Terminal

## The Script You Should Write

Replace SCRIPT_TEXT_HERE with the actual script content the user gave you.

```bash
#!/bin/bash
set -e
source ~/.openclaw/workspace-serena/.env

echo "Step 1: Generating voice with ElevenLabs..."
curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$ELEVENLABS_VOICE_ID" \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "SCRIPT_TEXT_HERE",
    "model_id": "eleven_monolingual_v1",
    "voice_settings": { "stability": 0.5, "similarity_boost": 0.75 }
  }' \
  --output /tmp/brookey-voice.mp3
echo "Voice saved."

echo "Step 2: Uploading audio to HeyGen..."
AUDIO_URL=$(curl -s -X POST "https://upload.heygen.com/v1/asset" \
  -H "X-Api-Key: $HEYGEN_API_KEY" \
  -F "file=@/tmp/brookey-voice.mp3" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['url'])")
echo "Audio URL: $AUDIO_URL"

echo "Step 3: Submitting video job to HeyGen..."
VIDEO_ID=$(curl -s -X POST "https://api.heygen.com/v2/video/generate" \
  -H "X-Api-Key: $HEYGEN_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"video_inputs\": [{
      \"character\": {
        \"type\": \"avatar\",
        \"avatar_id\": \"$HEYGEN_AVATAR_ID\",
        \"avatar_style\": \"normal\"
      },
      \"voice\": {
        \"type\": \"audio\",
        \"audio_url\": \"$AUDIO_URL\"
      }
    }],
    \"dimension\": { \"width\": 1080, \"height\": 1920 }
  }" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['video_id'])")
echo "Video ID: $VIDEO_ID"

echo "Step 4: Waiting for HeyGen to render (1-5 mins)..."
while true; do
  RESPONSE=$(curl -s "https://api.heygen.com/v1/video_status.get?video_id=$VIDEO_ID" \
    -H "X-Api-Key: $HEYGEN_API_KEY")
  STATUS=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['status'])")
  echo "Status: $STATUS"
  if [ "$STATUS" = "completed" ]; then
    VIDEO_URL=$(echo $RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['video_url'])")
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "HeyGen render failed."
    exit 1
  fi
  sleep 15
done

echo "Step 5: Downloading video..."
curl -L "$VIDEO_URL" --output /tmp/brookey-avatar-final.mp4
echo "Video saved to /tmp/brookey-avatar-final.mp4"

echo "Step 6: Posting to TikTok and Instagram..."
curl -s -X POST https://api.upload-post.com/api/upload \
  -H "Authorization: Apikey $UPLOAD_POST_API_KEY" \
  -F "video=@/tmp/brookey-avatar-final.mp4" \
  -F "title=SCRIPT_TEXT_HERE" \
  -F "user=NerdGGTeam" \
  -F "platform[]=tiktok" \
  -F "platform[]=instagram"

echo "All done! Video posted."
```

## How to Deliver It

Write the above script to `~/make-brookey-video.sh` with the user's script text filled in, then say:

> "I've written your video script to `~/make-brookey-video.sh`. Run these two commands in Terminal:"
>
> ```
> chmod +x ~/make-brookey-video.sh
> ~/make-brookey-video.sh
> ```

## Notes
- Replace SCRIPT_TEXT_HERE in TWO places: the ElevenLabs voice text AND the upload-post caption
- The caption should be punchy Gossip Girl / CVICU superiority tone
- Video is 1080x1920 vertical — TikTok/Reels ready
- Script handles all waiting and polling automatically — user just runs it once
