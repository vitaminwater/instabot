const _ = require('lodash');
const Client = require('instagram-private-api').V1;

const { each } = require('./utils');
const { getSession, processFeed } = require('./ig');
const { getSQL, allSQL, runSQL } = require('./db');

let session;

const saveIfNotExists = (table) => async (user) => {
  const { id } = user.params;
  try {
    const { i } = await getSQL(`select id as i from ${table} where id=?`, id);
    await runSQL(`update ${table} set seen=1 where id=?`, id);
  } catch (e) {
    runSQL(`insert into ${table} (id, params) values (?, ?)`, [id, JSON.stringify(user.params)]);
  }
  return false;
}

const syncUserFeed = async (feed, table) => {
  await runSQL(`update ${table} set seen=0`);
  await processFeed(feed, saveIfNotExists(table));
  const toDelete = await allSQL(`select id from ${table} where seen=0`);
  console.log(toDelete);
  await each(toDelete, async ({ id }) => await runSQL(`delete from ${table} where id=?`, id));
}

const syncFollowing = async (accountId) => {
  const followingFeed = new Client.Feed.AccountFollowing(session, accountId, 1000);

  await syncUserFeed(followingFeed, 'following', true);
}

const syncFollowers = async (accountId) => {
  const followersFeed = new Client.Feed.AccountFollowers(session, accountId, 1000);

  await syncUserFeed(followersFeed, 'follower', true);
}

const run = async () => {
  try {
    session = getSession();
    const accountId = await session.getAccountId();
    const { params: {followerCount, followingCount} } = await Client.Account.getById(session, accountId);
    const { count: localFollowerCount } = await getSQL('select count(*) from follower');
    const { count: localFollowingCount } = await getSQL('select count(*) from following');
    if (followingCount != localFollowingCount) {
      console.log('Syncing followings');
      await syncFollowing(accountId);
    }
    if (followerCount != localFollowerCount) {
      console.log('Syncing followers');
      await syncFollowers(accountId);
    }
    console.log('Syncing done');
  } catch(e) {
    console.log(e);
  }
}

module.exports = run;
