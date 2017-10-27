const _ = require('lodash');
const Client = require('instagram-private-api').V1;

const { wait } = require('./utils');
const { getSession, processFeed } = require('./ig');
const { getSQL, runSQL } = require('./db');

let session;

const unfollow = (n) => async (user) => {
  const { id } = user.params;
  await Client.Relationship.destroy(session, id);
  await Promise.all([
    runSQL('delete from following where id=?', user.params.id), 
    runSQL(`insert into unfollowed (id, params) values (?, ?)`, [id, JSON.stringify(user.params)])
  ]);
  const cancel = !--n;
  if (!cancel) await wait();
  return cancel;
}

const run = async () => {
  try {
    session = getSession();
    const { n } = await getSQL('select count(*) as n from following');
    if (n < 5000) return;

    const accountId = await session.getAccountId();
    const followingFeed = new Client.Feed.AccountFollowing(session, accountId, 1000);

    const nUnfollow = Math.ceil(n - (150 + Math.random() * 150));
    console.log(`Unfollow ${nUnfollow} accounts.`);

    await processFeed(followingFeed, unfollow(n));
  } catch(e) {
    console.log(e);
  }
}

module.exports = run;
