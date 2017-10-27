const _ = require('lodash');
const Client = require('instagram-private-api').V1;

const { getSession, processFeed } = require('./ig');
const { getSQL, runSQL } = require('./db');

let session;

const saveFollowingIfNotExists = async (user) => {
  const { id } = user.params;
  console.log(id);
  if (await getSQL('select id from following where id=?', id)) {
    runSQL('insert into following (id, params) values (?, ?)', id, JSON.stringify(user.params));
  }
  return true;
}

const syncFollowing = async () => {
  const accountId = await session.getAccountId();
  const followingFeed = new Client.Feed.AccountFollowing(session, accountId, 1000);

  await processFeed(followingFeed, saveFollowingIfNotExists);
}

const run = async () => {
  try {
    session = getSession();
    await syncFollowing();
  } catch(e) {
    console.log(e);
  }
}

module.exports = run;
