'use strict';

require('dotenv').config();

const Mongoose = require('mongoose');

Mongoose.set('useNewUrlParser', true);
Mongoose.set('useUnifiedTopology', true);

Mongoose.connect(process.env.db);
const db = Mongoose.connection;

db.on('error', function(err) {
  console.log(`database connection error: ${err}`);
});

db.on('disconnected', function() {
  console.log('database disconnected');
});

db.once('open', function() {
  console.log(`database connected to ${this.name} on ${this.host}`);
  seed();
});

// Removal of seed function as app is live on Heroku and Glitch

async function seed() {
  let seeder = require('mais-mongoose-seeder')(Mongoose);
  const data = require('./seed-data.json');
  const Trail = require('./trail');
  const User = require('./user');
  const Category = require('./category');
  const Comment = require('./comment');
  const Events = require('./events');
  const Admin = require('./admin');
  const dbData = await seeder.seed(data, { dropDatabase: false, dropCollections: true });
  //console.log(dbData);
}