const { init: initDb } = require('./db');
const { init: initIg } = require('./ig');

const sync = require('./sync');
const unfollow = require('./unfollow');
const followUserFollowers = require('./follow_user_followers');
const followHashTags = require('./follow_hashtags');

const stat = require('./stat');

const run = async () => {
  stat.start();
  try {
    await initDb();
    await initIg();

    /*await sync();
    await unfollow();
    await followUserFollowers();*/
    await followHashTags();
  } catch(e) {
    console.log(e);
    stat.error(e);
  }
}

run();
