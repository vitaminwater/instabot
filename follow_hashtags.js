const { USERNAME } = require('./config');

const _ = require('lodash');
const Client = require('instagram-private-api').V1;

const { wait } = require('./utils');
const { getSession, followAccount, processFeed } = require('./ig');
const { getSQL, runSQL } = require('./db');

const stat = require('./stat');

let session;

const hashtagRegex = /#\w+/g;

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

  const mediaFeed = new Client.Feed.TaggedMedia(session, hashtag, 1000);
  processFeed(mediaFeed, async ({params: { user }}) => {
    const { following } = await getSQL('select exists(select 1 from following where id=? limit 1) as following', user.pk);
    const { follower } = await getSQL('select exists(select 1 from follower where id=? limit 1) as follower', user.pk);
    const { unfollowed } = await getSQL('select exists(select 1 from unfollowed where id=? limit 1) as unfollowed', user.pk);
    if (following || follower || unfollowed) {
      console.log('skip', user.username);
      return;
    }
    await wait();
    await followAccount(user);
    await runSQL('insert into following (id, params, source) values (?, ?, ?)', [user.pk, JSON.stringify(user), `hashtag:${hashtag}`]);
    stat.follow(user);
  });
}

const run = async () => {
  try {
    session = getSession();
    await findHashtag();
  } catch(e) {
    console.log(e);
    stat.error(e);
  }
}

module.exports = run;
