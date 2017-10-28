const _ = require('lodash');
const Client = require('instagram-private-api').V1;

const { wait } = require('./utils');
const { getSession, processFeed } = require('./ig');
const { getSQL, runSQL } = require('./db');

let session;

const findHashtag = async () => {
  const accountId = await session.getAccountId();
  const feed = new Client.Feed.UserMedia(session, accountId, 1000);
  const hashtags = [];
  processFeed(feed, async (media) => console.log(media));
}

const run = async () => {
  try {
    session = getSession();
    await findHashtag();
  } catch(e) {
    console.log(e);
  }
}

module.exports = run;
