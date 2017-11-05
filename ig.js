const { USERNAME, PASSWORD, DATA_DIR } = require('./config');

const Client = require('instagram-private-api').V1;
const device = new Client.Device(USERNAME);
const storage = new Client.CookieFileStorage(`${DATA_DIR}/cookies.json`);

const { find, findSeries, wait } = require('./utils');

let session;

const init = async () => {
  session = await Client.Session.create(device, storage, USERNAME, PASSWORD);
}

const processFeed = async (feed, fn, parallel=false) => {
  while (true) {
    const items = await feed.get();
    const i = parallel == false ? await find(items, fn) : await findSeries(items, fn);
    await wait();
    if (typeof i !== 'undefined') {
      console.log('🛑  processFeed cancelled')
      break;
    }
    if (!feed.isMoreAvailable()) break;
  }
}

const followAccount = async (account) => {
  console.log(`🙏  follow account ${account.username}`);
  await Client.Relationship.create(session, account.pk);
}

const likePic = (session, media) => () => {
  if (!media.hasLiked) {
    console.log('❤️  liking media', media.params.id);
    return Client.Like.create(session, media.params.id)
      .then(wait(2000 + Math.random() * 2000))
      .then(() => false);
  }
  return false;
}

const likeFirstUnlikedPic = (session, account, n=-1) => () => {
  const userMediaFeed = new Client.Feed.UserMedia(session, account.params.id);
  return processFeed(session, userMediaFeed, (session, media) => (cancel) => {
    if (cancel) return cancel;
    if (!media.params.hasLiked) {
      return Promise.resolve()
        .then(likePic(session, media))
        .then(() => n > 0 && --n == 0);
    }
    return false;
  });
}

const getSession = () => session;

module.exports = {
  init,
  getSession,
  followAccount,
  processFeed,
}
