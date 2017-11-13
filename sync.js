const _ = require('lodash');
const Client = require('instagram-private-api').V1;

const { each, eachSeries } = require('./utils');
const { getSession, processFeed } = require('./ig');
const { getSQL, allSQL, runSQL } = require('./db');

const stat = require('./stat');

let session;

const saveIfNotExists = (table, onInsert) => async (user) => {
  const { id } = user.params;
  try {
    const { i } = await getSQL(`select id as i from ${table} where id=?`, id);
    await runSQL(`update ${table} set seen=1 where id=?`, id);
  } catch (e) {
    await runSQL(`insert into ${table} (id, params) values (?, ?)`, [id, JSON.stringify(user.params)]);
    await onInsert(user.params);
  }
  return false;
}

const syncUserFeed = async (feed, table, onInsert, beforeDelete) => {
  await runSQL(`update ${table} set seen=0`);
  let inserted = 0;
  await processFeed(feed, saveIfNotExists(table, async () => {
    inserted++;
    await onInsert()
  }), true);
  console.log(`Inserted ${inserted}`);
  const { toDelete } = await getSQL(`select count(*) as toDelete from ${table} where seen=0`);
  console.log(`Delete ${toDelete} entries`);
  if (beforeDelete) await beforeDelete();
  await runSQL(`delete from ${table} where seen=0`);
  stat.del(table, toDelete);
}

const syncFollowing = async (accountId) => {
  const followingFeed = new Client.Feed.AccountFollowing(session, accountId, 1000);

  await syncUserFeed(followingFeed, 'following', async () => {});
}

// TODO get source from following
const syncFollowers = async (accountId) => {
  const followersFeed = new Client.Feed.AccountFollowers(session, accountId, 1000);

  await syncUserFeed(followersFeed, 'follower', async (user) => {
    try {
      const { source } = await getSQL('select source from following where id=?', user.id);
      await runSQL('update follower set source=? where id=?', [source, user.id]);
    } catch (e) {}
  }, async () => {
    const unfollowers = await allSQL('select * from follower where seen=0');
    await each(unfollowers, async (unfollower) => {
      await runSQL(`insert into unfollower (id, params, source) values (?, ?, ?)`, [unfollower.id, unfollower.params, unfollower.source]);
      await stat.unfollower(_.merge({source: unfollower.source}, JSON.parse(unfollower.params)));
    });
  });
}

const run = async () => {
  try {
    session = getSession();
    const accountId = await session.getAccountId();
    const { params: {followerCount, followingCount} } = await Client.Account.getById(session, accountId);
    const { count: localFollowerCount } = await getSQL('select count(*) as count from follower');
    const { count: localFollowingCount } = await getSQL('select count(*) as count from following');
    if (followerCount != localFollowerCount) {
      console.log('Syncing followers');
      await syncFollowers(accountId);
    }
    if (followingCount != localFollowingCount) {
      console.log('Syncing followings');
      await syncFollowing(accountId);
    }
    console.log('Syncing done');
  } catch(e) {
    console.log(e);
    stat.error(e);
  }
}

module.exports = run;
