const { USERNAME } = require('./config');

const _ = require('lodash');
const Client = require('instagram-private-api').V1;

const { wait } = require('./utils');
const { getSession, followAccount, processFeed, likeFirstUnlikedPic } = require('./ig');
const { getSQL, runSQL } = require('./db');

const stat = require('./stat');

let session;

const hashtagRegex = /#\w+/g;

const followAccountFollowers = async (account, source) => {
  console.log(`😘 follow followers of ${account.username}`);
  const feed = new Client.Feed.AccountFollowers(session, account.pk);
  await processFeed(feed, async ({ params: follower }) => processAccount(follower, `${source},followers:${account.pk}`));
}

const processAccount = async (account, source, followFollowers=false) => {
  const { following } = await getSQL('select exists(select 1 from following where id=? limit 1) as following', account.pk);
  const { follower } = await getSQL('select exists(select 1 from follower where id=? limit 1) as follower', account.pk);
  const { unfollowed } = await getSQL('select exists(select 1 from unfollowed where id=? limit 1) as unfollowed', account.pk);
  if (!(following || follower || unfollowed)) {
    await likeFirstUnlikedPic(account, Math.ceil(Math.random()*2)+1);
    await followAccount(account);
    await runSQL('insert into following (id, params, source) values (?, ?, ?)', [account.pk, JSON.stringify(account), source]);
    stat.follow(account);
  }
  await wait();
  if (followFollowers) {
    await followAccountFollowers(account, source);
  }
  await wait();
}

const findHashtag = async () => {
  const accountId = await session.getAccountId();
  const feed = new Client.Feed.UserMedia(session, accountId, 1000);
  let hashtags = [];
  await processFeed(feed, async (media) => {
    hashtags = hashtags.concat(media.params.caption.match(hashtagRegex));
    _.forEach(media.params.comments.filter(({account: { username }}) => USERNAME == username), (comment) => hashtags = hashtags.concat(comment.text.match(hashtagRegex)));
  });
  hashtags = hashtags.filter((hashtag) => !!hashtag);
  const hashtag = hashtags[Math.floor(Math.random() * hashtags.length)].slice(1);
  return hashtag;
}

const run = async () => {
  try {
    session = getSession();
    const hashtag = await findHashtag();

    const mediaFeed = new Client.Feed.TaggedMedia(session, hashtag, 1000);
    await processFeed(mediaFeed, async ({params: { user }}) => processAccount(user, `hashtag:${hashtag}`, true));

  } catch(e) {
    console.log(e);
    stat.error(e);
  }
}

module.exports = run;
