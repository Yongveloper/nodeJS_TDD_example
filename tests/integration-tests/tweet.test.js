import axios from 'axios';
import faker from 'faker';
import { startServer, stopServer } from '../../app.js';
import { sequelize } from '../../db/database.js';
import { createNewUserAccount } from './auth_utill.js';

describe('Tweets APIs', () => {
  let server;
  let request;
  beforeAll(async () => {
    server = await startServer();
    request = axios.create({
      baseURL: `http://localhost:${server.address().port}`,
      validateStatus: null,
    });
  });

  afterAll(async () => {
    await stopServer(server);
  });

  describe('POST /tweets', () => {
    it('returns 201 and the created tweet when a tweet text is 3 characters or more', async () => {
      const text = faker.random.words(3);
      const user = await createNewUserAccount(request);

      const res = await request.post(
        '/tweets',
        { text },
        { headers: { Authorization: `Bearer ${user.jwt}` } }
      );

      expect(res.status).toBe(201);
      expect(res.data).toMatchObject({
        name: user.name,
        username: user.username,
        text,
      });
    });

    it('returns 400 when a tweet text is less than 3 characters', async () => {
      const text = faker.random.alpha({ count: 2 });
      const user = await createNewUserAccount(request);

      const res = await request.post(
        '/tweets',
        { text },
        { headers: { Authorization: `Bearer ${user.jwt}` } }
      );

      expect(res.status).toBe(400);
      expect(res.data.message).toMatch('text should be at least 3 characters');
    });
  });

  describe('GET /tweets', () => {
    it('returns all tweets when username is not specified in the query', async () => {
      const text = faker.random.words(3);
      const user1 = await createNewUserAccount(request);
      const user2 = await createNewUserAccount(request);
      const user1Headers = { Authorization: `Bearer ${user1.jwt}` };
      const user2Headers = { Authorization: `Bearer ${user2.jwt}` };

      await request.post('/tweets', { text }, { headers: user1Headers });
      await request.post('/tweets', { text }, { headers: user2Headers });

      const res = await request.get('/tweets', {
        headers: { Authorization: `Bearer ${user1.jwt}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.length).toBeGreaterThanOrEqual(2);
    });

    it('returns only tweets of the given user when username is specified in the query', async () => {
      const text = faker.random.words(3);
      const user1 = await createNewUserAccount(request);
      const user2 = await createNewUserAccount(request);
      const user1Headers = { Authorization: `Bearer ${user1.jwt}` };
      const user2Headers = { Authorization: `Bearer ${user2.jwt}` };

      await request.post('/tweets', { text }, { headers: user1Headers });
      await request.post('/tweets', { text }, { headers: user2Headers });

      const res = await request.get('/tweets', {
        headers: { Authorization: `Bearer ${user1.jwt}` },
        params: { username: user1.username },
      });

      expect(res.status).toBe(200);
      expect(res.data.length).toEqual(1);
      expect(res.data[0].username).toMatch(user1.username);
    });
  });

  describe('GET /tweets/:id', () => {
    it('returns 404 when tweet id does not exist', async () => {
      const user = await createNewUserAccount(request);

      const res = await request.get('/tweets/nonexistentId', {
        headers: { Authorization: `Bearer ${user.jwt}` },
      });

      expect(res.status).toBe(404);
    });

    it('returns 200 and the tweet object when tweet id exists', async () => {
      const text = faker.random.words(3);
      const user = await createNewUserAccount(request);
      const createdTweet = await request.post(
        '/tweets',
        { text },
        { headers: { Authorization: `Bearer ${user.jwt}` } }
      );

      const res = await request.get(`/tweets/${createdTweet.data.id}`, {
        headers: { Authorization: `Bearer ${user.jwt}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.text).toMatch(text);
    });
  });

  describe('PUT /tweets/:id', () => {
    it('returns 404 when tweet id does not exist', async () => {
      const text = faker.random.words(3);
      const user = await createNewUserAccount(request);

      const res = await request.put(
        `/tweets/nonexistentId`,
        { text },
        { headers: { Authorization: `Bearer ${user.jwt}` } }
      );

      expect(res.status).toBe(404);
      expect(res.data.message).toMatch('Tweet not found: nonexistent');
    });

    it('returns 200 and updated tweet when tweet id exists and the tweet belongs to the user', async () => {
      const text = faker.random.words(3);
      const updatedText = faker.random.words(3);
      const user = await createNewUserAccount(request);

      const createTweet = await request.post(
        '/tweets',
        { text },
        { headers: { Authorization: `Bearer ${user.jwt}` } }
      );

      const res = await request.put(
        `/tweets/${createTweet.data.id}`,
        { text: updatedText },
        { headers: { Authorization: `Bearer ${user.jwt}` } }
      );

      expect(res.status).toBe(200);
      expect(res.data.text).toMatch(updatedText);
    });

    it('returns 403 when tweet id exists but the tweet does not belong to the user', async () => {
      const text = faker.random.words(3);
      const updatedText = faker.random.words(3);
      const tweetAuthor = await createNewUserAccount(request);
      const anotherUser = await createNewUserAccount(request);

      const createTweet = await request.post(
        '/tweets',
        { text },
        { headers: { Authorization: `Bearer ${tweetAuthor.jwt}` } }
      );

      const res = await request.put(
        `/tweets/${createTweet.data.id}`,
        { text: updatedText },
        { headers: { Authorization: `Bearer ${anotherUser.jwt}` } }
      );

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /tweets/:id', () => {
    it('returns 404 when tweet id does not exist', async () => {
      const user = await createNewUserAccount(request);

      const res = await request.delete(`/tweets/nonexistentId`, {
        headers: { Authorization: `Bearer ${user.jwt}` },
      });

      expect(res.status).toBe(404);
      expect(res.data.message).toMatch('Tweet not found: nonexistent');
    });

    it('returns 403 and the tweet should still be there when tweet id exists but the tweet does not belong to the user', async () => {
      const text = faker.random.words(3);
      const tweetAuthor = await createNewUserAccount(request);
      const anotherUser = await createNewUserAccount(request);

      const createTweet = await request.post(
        '/tweets',
        { text },
        { headers: { Authorization: `Bearer ${tweetAuthor.jwt}` } }
      );

      const deleteResult = await request.delete(
        `/tweets/${createTweet.data.id}`,
        {
          headers: { Authorization: `Bearer ${anotherUser.jwt}` },
        }
      );

      const checkTweetResult = await request.get(
        `/tweets/${createTweet.data.id}`,
        {
          headers: { Authorization: `Bearer ${anotherUser.jwt}` },
        }
      );

      expect(deleteResult.status).toBe(403);
      expect(checkTweetResult.status).toBe(200);
      expect(checkTweetResult.data).toMatchObject({ text });
    });

    it('returns 204 when tweet id exists and the tweet belongs to the user', async () => {
      const text = faker.random.words(3);
      const tweetAuthor = await createNewUserAccount(request);

      const createTweet = await request.post(
        '/tweets',
        { text },
        { headers: { Authorization: `Bearer ${tweetAuthor.jwt}` } }
      );

      const deleteResult = await request.delete(
        `/tweets/${createTweet.data.id}`,
        {
          headers: { Authorization: `Bearer ${tweetAuthor.jwt}` },
        }
      );

      const checkTweetResult = await request.get(
        `/tweets/${createTweet.data.id}`,
        {
          headers: { Authorization: `Bearer ${tweetAuthor.jwt}` },
        }
      );

      expect(deleteResult.status).toBe(204);
      expect(checkTweetResult.status).toBe(404);
    });
  });
});
