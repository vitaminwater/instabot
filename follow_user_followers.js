const _ = require('lodash');
const Client = require('instagram-private-api').V1;

const { wait } = require('./utils');
const { getSession, processFeed } = require('./ig');
const { getSQL, runSQL } = require('./db');

let session;

const run = async () => {
  try {
    session = getSession();
  } catch(e) {
    console.log(e);
  }
}

module.exports = run;
