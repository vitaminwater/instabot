const _ = require('lodash');
const Client = require('instagram-private-api').V1;

const { wait } = require('./utils');
const { getSession, processFeed } = require('./ig');
const { getSQL, runSQL } = require('./db');

const stat = require('./stat');

let session;

const unfollow = (n) => async (user) => {
  const { id } = user.params;
  await Client.Relationship.destroy(session, id);
  const { source } = await getSQL('select source from following where id=?', user.id);
  await Promise.all([
    runSQL('delete from following where id=?', id), 
    runSQL(`insert into unfollowed (id, params, source) values (?, ?, ?)`, [id, JSON.stringify(user.params), source])
  ]);
  console.log(`Unfollowed ${user.params.username}`);
  stat.unfollow(user.params);
  const cancel = !--n;
  if (!cancel) await wait();
  return cancel;
}

const run = async () => {
  try {
    session = getSession();
    const { nFollowing } = await getSQL('select count(*) as nFollowing from following');
    const { nFollower } = await getSQL('select count(*) as nFollower from follower');

    const aimFollower = Math.min(1000, Math.max(300, nFollower / 10));
    const nUnfollow = Math.ceil(nFollowing - aimFollower);

    if (nUnfollow <= 0) return;
    console.log(`Unfollow ${nUnfollow} accounts.`);

    const accountId = await session.getAccountId();
    const followingFeed = new Client.Feed.AccountFollowing(session, accountId, 1000);

    await processFeed(followingFeed, unfollow(nUnfollow));
  } catch(e) {
    console.log(e);
    stat.error(e);
  }
}

module.exports = run;
