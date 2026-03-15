// avatarvideo.test.js

// Set env vars before the module is loaded so the constants are captured correctly
process.env.HEYGEN_API_KEY = 'test-heygen-key';
process.env.HEYGEN_AVATAR_ID = 'test-avatar-id';
process.env.ELEVENLABS_API_KEY = 'test-elevenlabs-key';
process.env.ELEVENLABS_VOICE_ID = 'test-voice-id';

jest.mock('axios');
jest.mock('form-data');

const axios = require('axios');
const FormData = require('form-data');
const { generateAvatarVideo } = require('./avatarvideo');

const MOCK_AUDIO_BUFFER = Buffer.from('fake-audio-data');
const MOCK_AUDIO_URL = 'https://cdn.heygen.com/audio/test.mp3';
const MOCK_VIDEO_ID = 'vid_abc123';
const MOCK_VIDEO_URL = 'https://cdn.heygen.com/video/test.mp4';

beforeEach(() => {
  jest.clearAllMocks();

  // FormData mock
  FormData.mockImplementation(() => ({
    append: jest.fn(),
    getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' })
  }));
});

describe('generateAvatarVideo', () => {
  function setupHappyPath() {
    // Step 1: ElevenLabs TTS
    axios.post.mockResolvedValueOnce({ data: MOCK_AUDIO_BUFFER });
    // Step 2: HeyGen audio upload
    axios.post.mockResolvedValueOnce({ data: { data: { url: MOCK_AUDIO_URL } } });
    // Step 3: HeyGen video create
    axios.post.mockResolvedValueOnce({ data: { data: { video_id: MOCK_VIDEO_ID } } });
    // Step 4: HeyGen poll — completed on first check
    axios.get.mockResolvedValueOnce({ data: { data: { status: 'completed', video_url: MOCK_VIDEO_URL } } });
  }

  it('returns success with videoUrl on the happy path', async () => {
    setupHappyPath();

    const result = await generateAvatarVideo('Hey it is Brookey from the ICU!');

    expect(result).toEqual({ success: true, videoUrl: MOCK_VIDEO_URL });
  });

  it('calls ElevenLabs with the correct script and headers', async () => {
    setupHappyPath();
    const script = 'Shift was wild tonight.';

    await generateAvatarVideo(script);

    const [url, body, config] = axios.post.mock.calls[0];
    expect(url).toContain('elevenlabs.io/v1/text-to-speech/');
    expect(body.text).toBe(script);
    expect(body.model_id).toBe('eleven_monolingual_v1');
    expect(config.headers['xi-api-key']).toBe('test-elevenlabs-key');
  });

  it('uploads audio to HeyGen with the correct API key', async () => {
    setupHappyPath();

    await generateAvatarVideo('test');

    const [url, , config] = axios.post.mock.calls[1];
    expect(url).toBe('https://upload.heygen.com/v1/asset');
    expect(config.headers['X-Api-Key']).toBe('test-heygen-key');
  });

  it('creates a HeyGen video job with vertical 1080x1920 dimensions', async () => {
    setupHappyPath();

    await generateAvatarVideo('test');

    const [url, body] = axios.post.mock.calls[2];
    expect(url).toBe('https://api.heygen.com/v2/video/generate');
    expect(body.dimension).toEqual({ width: 1080, height: 1920 });
    expect(body.video_inputs[0].character.type).toBe('avatar');
    expect(body.video_inputs[0].voice.type).toBe('audio');
    expect(body.video_inputs[0].voice.audio_url).toBe(MOCK_AUDIO_URL);
  });

  it('polls until the video is completed', async () => {
    // ElevenLabs + HeyGen upload + HeyGen create
    axios.post
      .mockResolvedValueOnce({ data: MOCK_AUDIO_BUFFER })
      .mockResolvedValueOnce({ data: { data: { url: MOCK_AUDIO_URL } } })
      .mockResolvedValueOnce({ data: { data: { video_id: MOCK_VIDEO_ID } } });

    // Poll: processing → processing → completed
    axios.get
      .mockResolvedValueOnce({ data: { data: { status: 'processing' } } })
      .mockResolvedValueOnce({ data: { data: { status: 'processing' } } })
      .mockResolvedValueOnce({ data: { data: { status: 'completed', video_url: MOCK_VIDEO_URL } } });

    // Speed up the delay timer
    jest.useFakeTimers();
    const promise = generateAvatarVideo('test');
    // Advance through each 10s delay
    await jest.runAllTimersAsync();
    const result = await promise;
    jest.useRealTimers();

    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(result).toEqual({ success: true, videoUrl: MOCK_VIDEO_URL });
  });

  it('returns failure when HeyGen render fails', async () => {
    axios.post
      .mockResolvedValueOnce({ data: MOCK_AUDIO_BUFFER })
      .mockResolvedValueOnce({ data: { data: { url: MOCK_AUDIO_URL } } })
      .mockResolvedValueOnce({ data: { data: { video_id: MOCK_VIDEO_ID } } });

    axios.get.mockResolvedValueOnce({
      data: { data: { status: 'failed', error: 'render crashed' } }
    });

    const result = await generateAvatarVideo('test');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/render crashed/);
  });

  it('returns failure when ElevenLabs throws a network error', async () => {
    axios.post.mockRejectedValueOnce(new Error('ElevenLabs 503'));

    const result = await generateAvatarVideo('test');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/ElevenLabs 503/);
  });

  it('returns failure when HeyGen upload throws', async () => {
    axios.post
      .mockResolvedValueOnce({ data: MOCK_AUDIO_BUFFER })
      .mockRejectedValueOnce(new Error('HeyGen upload failed'));

    const result = await generateAvatarVideo('test');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/HeyGen upload failed/);
  });

  it('times out after maxAttempts polls', async () => {
    axios.post
      .mockResolvedValueOnce({ data: MOCK_AUDIO_BUFFER })
      .mockResolvedValueOnce({ data: { data: { url: MOCK_AUDIO_URL } } })
      .mockResolvedValueOnce({ data: { data: { video_id: MOCK_VIDEO_ID } } });

    // Always return "processing" — never completes
    axios.get.mockResolvedValue({ data: { data: { status: 'processing' } } });

    jest.useFakeTimers();
    const promise = generateAvatarVideo('test');
    await jest.runAllTimersAsync();
    const result = await promise;
    jest.useRealTimers();

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Timed out/);
  });
});
