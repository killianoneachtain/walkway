'use strict';

const assert = require('chai').assert;
const DonationService = require('./walkway-service');
const fixtures = require('./fixtures.json');
const utils = require('../app/api/utils.js');

suite('Authentication API tests', function () {

  let users = fixtures.users;
  let newUser = fixtures.newUser;

  const donationService = new DonationService(fixtures.walkwayService);

  setup(async function () {
    await donationService.deleteAllUsers();
  });

  test('verify Token', async function () {
    const returnedUser = await donationService.createUser(newUser);
    const response = await donationService.authenticate(newUser);

    const userInfo = utils.decodeToken(response.token);
    assert.equal(userInfo.email, returnedUser.email);
    assert.equal(userInfo.userId, returnedUser._id);
  });

});