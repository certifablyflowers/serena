# Upload-Post Skill

Use this skill to post content to TikTok, Instagram, YouTube, and X for the Brookey persona.

## Authentication
- Header: Authorization: Apikey $UPLOAD_POST_API_KEY
- Profile/User: NerdGGTeam
- Key stored in: ~/.openclaw/workspace-serena/.env

## Post a Video
curl -X POST https://api.upload-post.com/api/upload \
  -H "Authorization: Apikey $UPLOAD_POST_API_KEY" \
  -F "video=@/path/to/video.mp4" \
  -F "title=Your caption here" \
  -F "user=NerdGGTeam" \
  -F "platform[]=tiktok" \
  -F "platform[]=instagram" \
  -F "platform[]=youtube"

## Check Post Status
curl "https://api.upload-post.com/api/uploadposts/status?request_id={id}" \
  -H "Authorization: Apikey $UPLOAD_POST_API_KEY"

## Notes
- Always source ~/.openclaw/workspace-serena/.env before posting
- Always check status after posting using request_id
- Caption should match Brookey's voice — real, warm, funny
- Profile username is NerdGGTeam
