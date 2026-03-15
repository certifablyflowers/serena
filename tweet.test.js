// tweet.test.js
process.env.X_CONSUMER_KEY = 'test-consumer-key';
process.env.X_CONSUMER_SECRET = 'test-consumer-secret';
process.env.X_ACCESS_TOKEN = 'test-access-token';
process.env.X_ACCESS_TOKEN_SECRET = 'test-access-token-secret';

jest.mock('twitter-api-v2');

const { TwitterApi } = require('twitter-api-v2');

const mockTweet = jest.fn();
TwitterApi.mockImplementation(() => ({
  v2: { tweet: mockTweet }
}));

// Require after mock is configured so the client picks up the mock
const { postTweet } = require('./tweet');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('postTweet', () => {
  it('returns success with id and url on a good post', async () => {
    mockTweet.mockResolvedValueOnce({ data: { id: '123456789' } });

    const result = await postTweet('The dopamine was titrating itself at this point, honestly.');

    expect(result).toEqual({
      success: true,
      id: '123456789',
      url: 'https://x.com/i/web/status/123456789'
    });
  });

  it('calls the X API with the exact tweet text', async () => {
    mockTweet.mockResolvedValueOnce({ data: { id: '111' } });
    const text = 'Three balloon pumps, one attending, zero parking spots. Tuesday.';

    await postTweet(text);

    expect(mockTweet).toHaveBeenCalledWith(text);
  });

  it('returns failure when the API throws', async () => {
    mockTweet.mockRejectedValueOnce(new Error('401 Unauthorized'));

    const result = await postTweet('test');

    expect(result).toEqual({ success: false, error: '401 Unauthorized' });
  });

  it('returns failure on rate limit error', async () => {
    mockTweet.mockRejectedValueOnce(new Error('429 Too Many Requests'));

    const result = await postTweet('test');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/429/);
  });
});
