'use strict';

const assert = require('chai').assert;
const WalkwayService = require('./walkway-service');
const fixtures = require('./fixtures.json');
const _ = require('lodash');

suite('Trail API tests', function () {

  let trails = fixtures.trails;
  let newTrail = fixtures.newTrail;

  const walkwayService = new WalkwayService(fixtures.walkwayService);

  // Before each individual test
  setup(async function () {
    await walkwayService.deleteAllTrails();
  });

  // After each individual test
  teardown(async function () {
    await walkwayService.deleteAllTrails();
  });

  test('create a trail', async function () {
    const returnedTrail = await walkwayService.createTrail(newTrail);
    assert(_.some([returnedTrail], newTrail), 'returnedTrail must be a superset of newTrail');
    assert.isDefined(returnedTrail._id);
  });

  test('get trail', async function () {
    const c1 = await walkwayService.createTrail(newTrail);
    const c2 = await walkwayService.getTrail(c1._id);
    assert.deepEqual(c1, c2, 'This has gotten a trail');
  });

  test('get invalid trail', async function () {
    const c1 = await walkwayService.getTrail('1234');
    assert.isNull(c1);
    const c2 = await walkwayService.getTrail('012345678901234567890123');
    assert.isNull(c2);
  });


  test('delete a trail', async function () {
    let c = await walkwayService.createTrail(newTrail);
    assert(c._id != null);
    await walkwayService.deleteOneTrail(c._id);
    c = await walkwayService.getTrail(c._id);
    assert(c == null);
  });

  test('get all trails', async function () {
    for (let c of trails) {
      await walkwayService.createTrail(c);
    }

    const allTrails = await walkwayService.getTrails();
    assert.equal(allTrails.length, trails.length);
  });

  test('get trails detail', async function () {
    for (let c of trails) {
      await walkwayService.createTrail(c);
    }

    const allTrails = await walkwayService.getTrails();
    for (let i = 0; i < trails.length; i++) {
      assert(_.some([allTrails[i]], trails[i]), 'returnedTrail must be a superset of newTrail');
    }
  });

  test('get all trails empty', async function () {
    const allTrails = await walkwayService.getTrails();
    assert.deepEqual(allTrails.length, 0, 'All the trails are empty.');
  });

});