const { init: initDb } = require('./db');
const { init: initIg } = require('./ig');

const sync = require('./sync');
const unfollow = require('./unfollow');
const followUserFollowers = require('./follow_user_followers');

const run = async () => {
  try {
    await initDb();
    await initIg();

    await sync();
    await unfollow();
    await followUserFollowers();
  } catch(e) {
    console.log(e);
  }
}

run();
