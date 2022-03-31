import faker from 'faker';

export async function createNewUserAccount(request) {
  const userDetails = makeValidUserDetails();
  const preapreUserResponse = await request.post('/auth/signup', userDetails);
  return {
    ...userDetails,
    jwt: preapreUserResponse.data.token,
  };
}

export function makeValidUserDetails() {
  const fakeUser = faker.helpers.userCard();
  return {
    name: fakeUser.name,
    username: fakeUser.username,
    email: fakeUser.email,
    password: faker.internet.password(10, true),
  };
}
