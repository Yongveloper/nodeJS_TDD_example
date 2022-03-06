import { TweetController } from '../tweet';
import httpMocks from 'node-mocks-http';
import faker from 'faker';

describe('TweetController', () => {
  let tweetController = null;
  let tweetsRepository = null;
  let mockedSocket = null;
  beforeEach(() => {
    tweetsRepository = {};
    mockedSocket = { emit: jest.fn() };
    tweetController = new TweetController(tweetsRepository, () => mockedSocket);
  });

  describe('getTweets', () => {
    it('returns all tweets when username is not provided', async () => {
      const request = httpMocks.createRequest();
      const response = httpMocks.createResponse();
      const allTweets = [
        { text: faker.random.words(3) },
        { text: faker.random.words(3) },
      ];
      tweetsRepository.getAll = () => allTweets;

      await tweetController.getTweets(request, response);

      expect(response.statusCode).toBe(200);
      expect(response._getJSONData()).toEqual(allTweets);
    });

    it('returns tweets for the given user when username is provided', async () => {
      const username = faker.internet.userName();
      const request = httpMocks.createRequest({
        query: { username },
      });
      const response = httpMocks.createResponse();
      const userTweets = [{ text: faker.random.words(3) }];
      tweetsRepository.getAllByUsername = () => userTweets;

      await tweetController.getTweets(request, response);

      expect(response.statusCode).toBe(200);
      expect(response._getJSONData()).toEqual(userTweets);
    });
  });
});
