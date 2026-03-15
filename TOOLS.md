## Skills Available

### Avatar Video
- Skill: skills/avatarvideo/SKILL.md
- Generates a talking avatar video of Brookey using ElevenLabs + HeyGen, then posts via upload-post
- Use when asked to create or post an avatar video

### Upload-Post
- Skill: skills/upload-post/SKILL.md
- Posts video content to TikTok, Instagram, YouTube, and X# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

## Brookey Avatar (HeyGen)
- Avatar ID: 64a78fb72ef44e0287f76ea30703ffd8
- Look ID: 4a5dd11ef6844b5cb87b07628a13bb6d
- Voice ID: gE0owC0H9C8SzfDyIUtB (Ivanna - Sassy, Condescending and Clear - ElevenLabs)
- Format: 1080x1920 vertical
- Style: normal + look ID for movement
- SSML breaks: use <break time='500ms'/> for dramatic pauses
