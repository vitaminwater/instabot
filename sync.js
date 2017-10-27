const _ = require('lodash');
const Client = require('instagram-private-api').V1;

const { getSession, processFeed } = require('./ig');
const { getSQL, allSQL, runSQL } = require('./db');

let session;

const saveFollowingIfNotExists = async (user) => {
  const { id } = user.params;
  try {
    const { i } = await getSQL('select id as i from following where id=?', id);
    await runSQL('update following set seen=1 where id=?', id);
  } catch (e) {
    runSQL('insert into following (id, params) values (?, ?)', [id, JSON.stringify(user.params)]);
  }
  return true;
}

const syncFollowing = async () => {
  const accountId = await session.getAccountId();
  const followingFeed = new Client.Feed.AccountFollowing(session, accountId, 1000);

  await runSQL('update following set seen=0');
  await processFeed(followingFeed, saveFollowingIfNotExists);
  const toDelete = await allSQL('select id from following where seen=0');
  console.log(toDelete);
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
