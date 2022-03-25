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
      const user = makeValidUserDetails();

      const res = await request.post('/auth/signup', user);

      expect(res.status).toBe(201);
      expect(res.data.token.length).toBeGreaterThan(0);
    });

    it('returns 409 when username has already been taken', async () => {
      const user = makeValidUserDetails();
      const firstSignup = await request.post('/auth/signup', user);
      expect(firstSignup.status).toBe(201);

      const res = await request.post('/auth/signup', user);

      expect(res.status).toBe(409);
      expect(res.data.message).toBe(`${user.username} already exists`);
    });

    test.each([
      { missingFieldName: 'name', expectedMessage: 'name is missing' },
      {
        missingFieldName: 'username',
        expectedMessage: 'username should be at least 5 characters',
      },
      {
        missingFieldName: 'password',
        expectedMessage: 'password should be at least 5 characters',
      },
      { missingFieldName: 'email', expectedMessage: 'invalid email' },
    ])(
      `returns 400 when $missingFieldName filed is missing`,
      async ({ missingFieldName, expectedMessage }) => {
        const user = makeValidUserDetails();
        delete user[missingFieldName];
        const res = await request.post('/auth/signup', user);

        expect(res.status).toBe(400);
        expect(res.data.message).toBe(expectedMessage);
      }
    );

    it('returns 400 when password is too short', async () => {
      const user = {
        ...makeValidUserDetails(),
        password: '123',
      };

      const res = await request.post('/auth/signup', user);

      expect(res.status).toBe(400);
      expect(res.data.message).toBe('password should be at least 5 characters');
    });
  });
});

function makeValidUserDetails() {
  const fakeUser = faker.helpers.userCard();
  return {
    name: fakeUser.name,
    username: fakeUser.username,
    email: fakeUser.email,
    password: faker.internet.password(10, true),
  };
}
