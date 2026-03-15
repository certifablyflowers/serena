// uploadpost.test.js
process.env.UPLOAD_POST_API_KEY = 'test-upload-key';

jest.mock('axios');
jest.mock('form-data');
jest.mock('fs');

const axios  = require('axios');
const FormData = require('form-data');
const fs     = require('fs');
const { postVideo, checkStatus } = require('./uploadpost');

const MOCK_REQUEST_ID = 'req_abc123';

beforeEach(() => {
  jest.clearAllMocks();

  fs.existsSync.mockReturnValue(true);
  fs.createReadStream.mockReturnValue('mock-stream');

  FormData.mockImplementation(() => ({
    append: jest.fn(),
    getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' })
  }));
});

// ─── postVideo ─────────────────────────────────────────────────────────────────

describe('postVideo', () => {
  it('returns success with requestId on a valid post', async () => {
    axios.post.mockResolvedValueOnce({ data: { request_id: MOCK_REQUEST_ID } });

    const result = await postVideo({
      videoPath: '/tmp/brookey.mp4',
      caption: 'Three balloon pumps, one attending, zero parking spots. Tuesday.',
      platforms: ['tiktok', 'instagram']
    });

    expect(result).toEqual({ success: true, requestId: MOCK_REQUEST_ID });
  });

  it('posts to the correct endpoint with auth header', async () => {
    axios.post.mockResolvedValueOnce({ data: { request_id: MOCK_REQUEST_ID } });

    await postVideo({ videoPath: '/tmp/test.mp4', caption: 'test', platforms: ['tiktok'] });

    const [url, , config] = axios.post.mock.calls[0];
    expect(url).toBe('https://api.upload-post.com/api/upload');
    expect(config.headers['Authorization']).toBe('Apikey test-upload-key');
  });

  it('defaults to tiktok and instagram when no platforms specified', async () => {
    axios.post.mockResolvedValueOnce({ data: { request_id: MOCK_REQUEST_ID } });

    const mockForm = { append: jest.fn(), getHeaders: jest.fn().mockReturnValue({}) };
    FormData.mockImplementationOnce(() => mockForm);

    await postVideo({ videoPath: '/tmp/test.mp4', caption: 'test' });

    const platformCalls = mockForm.append.mock.calls.filter(([key]) => key === 'platform[]');
    expect(platformCalls.map(([, val]) => val)).toEqual(['tiktok', 'instagram']);
  });

  it('returns failure for invalid platform', async () => {
    const result = await postVideo({
      videoPath: '/tmp/test.mp4',
      caption: 'test',
      platforms: ['snapchat']
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Invalid platforms/);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('returns failure when video file does not exist', async () => {
    fs.existsSync.mockReturnValue(false);

    const result = await postVideo({ videoPath: '/tmp/missing.mp4', caption: 'test' });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('returns failure when API throws', async () => {
    axios.post.mockRejectedValueOnce({ message: 'Network Error', response: null });

    const result = await postVideo({ videoPath: '/tmp/test.mp4', caption: 'test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Network Error');
  });

  it('surfaces the API error message when available', async () => {
    axios.post.mockRejectedValueOnce({
      message: 'Request failed',
      response: { data: { message: 'Video too large' } }
    });

    const result = await postVideo({ videoPath: '/tmp/test.mp4', caption: 'test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Video too large');
  });
});

// ─── checkStatus ───────────────────────────────────────────────────────────────

describe('checkStatus', () => {
  it('returns success with status data', async () => {
    const mockStatus = { state: 'published', platforms: { tiktok: 'success' } };
    axios.get.mockResolvedValueOnce({ data: mockStatus });

    const result = await checkStatus(MOCK_REQUEST_ID);

    expect(result).toEqual({ success: true, status: mockStatus });
  });

  it('calls the correct endpoint with the request ID', async () => {
    axios.get.mockResolvedValueOnce({ data: {} });

    await checkStatus(MOCK_REQUEST_ID);

    const [url, config] = axios.get.mock.calls[0];
    expect(url).toContain(MOCK_REQUEST_ID);
    expect(config.headers['Authorization']).toBe('Apikey test-upload-key');
  });

  it('returns failure when API throws', async () => {
    axios.get.mockRejectedValueOnce({ message: 'Not Found', response: null });

    const result = await checkStatus('bad-id');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not Found');
  });
});
