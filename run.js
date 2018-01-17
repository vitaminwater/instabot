const { init: initDb } = require('./db');
const { init: initIg } = require('./ig');

const sync = require('./sync');
const unfollow = require('./unfollow');
const follow = require('./follow');

const stat = require('./stat');

const run = async () => {
  stat.start();
  try {
    await initDb();
    await initIg();

    await sync();
    //await unfollow();
    while (true) {
      await follow();
    }
  } catch(e) {
    console.log(e);
    stat.error(e);
  }
}

run();
