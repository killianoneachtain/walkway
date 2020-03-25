'use strict';

const assert = require('chai').assert;
const WalkwayService = require('./walkway-service');
const fixtures = require('./fixtures.json');
const _ = require('lodash');

suite('User API tests', function () {

  let users = fixtures.users;
  let newUser = fixtures.newUser;

  const walkwayService = new WalkwayService(fixtures.walkwayService);

  // Before each individual test
  setup(async function () {
    await walkwayService.deleteAllUsers();
  });

  // After each individual test
  teardown(async function () {
    await walkwayService.deleteAllUsers();
  });

  test('create a user', async function () {
    const returnedUser = await walkwayService.createUser(newUser);
    assert(_.some([returnedUser], newUser), 'returnedUser must be a superset of newUser');
    assert.isDefined(returnedUser._id);
  });

  test('get user', async function () {
    const c1 = await walkwayService.createUser(newUser);
    const c2 = await walkwayService.getUser(c1._id);
    assert.deepEqual(c1, c2, 'This has gotten a User');
  });

  test('get invalid user', async function () {
    const c1 = await walkwayService.getUser('1234');
    assert.isNull(c1);
    const c2 = await walkwayService.getUser('012345678901234567890123');
    assert.isNull(c2);
  });


  test('delete a User', async function () {
    let c = await walkwayService.createUser(newUser);
    assert(c._id != null);
    await walkwayService.deleteOneUser(c._id);
    c = await walkwayService.getUser(c._id);
    assert(c == null);
  });

  test('get all users', async function () {
    for (let c of users) {
      await walkwayService.createUser(c);
    }

    const allUsers = await walkwayService.getUsers();
    assert.equal(allUsers.length, users.length);
  });

  test('get users detail', async function () {
    for (let c of users) {
      await walkwayService.createUser(c);
    }

    const allUsers = await walkwayService.getUsers();
    for (let i = 0; i < users.length; i++) {
      assert(_.some([allUsers[i]], users[i]), 'returnedUser must be a superset of newUser');
    }
  });

  test('get all users empty', async function () {
    const allusers = await walkwayService.getUsers();
    assert.deepEqual(allusers.length, 0, 'All the users are empty.');
  });

});