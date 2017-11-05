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
    const { n } = await getSQL('select count(*) as n from following');

    const accountId = await session.getAccountId();
    const followingFeed = new Client.Feed.AccountFollowing(session, accountId, 1000);

    const nUnfollow = Math.ceil(n - (2500 + Math.random() * 500));

    if (nUnfollow <= 0) return;
    console.log(`Unfollow ${nUnfollow} accounts.`);

    await processFeed(followingFeed, unfollow(n));
  } catch(e) {
    console.log(e);
    stat.error(e);
  }
}

module.exports = run;
