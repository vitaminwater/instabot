const { init: initDb } = require('./db');
const { init: initIg } = require('./ig');

const sync = require('./sync');
const unfollow = require('./unfollow');

const run = async () => {
  try {
    await initDb();
    await initIg();

    await sync();
  } catch(e) {
    console.log(e);
  }
}

run();
