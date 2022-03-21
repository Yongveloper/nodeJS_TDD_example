import axios from 'axios';
import faker from 'faker';
import { startServer, stopServer } from '../../app.js';
import { sequelize } from '../../db/database.js';

describe('Auth APIs', () => {
  let server;
  let request;
  beforeAll(async () => {
    server = await startServer();
    request = axios.create({
      baseURL: 'http://localhost:8080',
      validateStatus: null,
    });
  });

  afterAll(async () => {
    await sequelize.drop();
    await stopServer(server);
  });

  describe('POST to /auth/signup', () => {
    it('returns 201 and authorozation token when user details are vaild', async () => {
      const fakeUser = faker.helpers.userCard();
      const user = {
        name: fakeUser.name,
        username: fakeUser.username,
        email: fakeUser.email,
        password: faker.internet.password(10, true),
      };

      const res = await request.post('/auth/signup', user);

      expect(res.status).toBe(201);
      expect(res.data.token.length).toBeGreaterThan(0);
    });
  });
});
