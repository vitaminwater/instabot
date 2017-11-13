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
    const i = parallel == true ? await find(items, fn) : await findSeries(items, fn);
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
  if (account.username == USERNAME) return;
  await Client.Relationship.create(session, account.pk);
}

const likePic = async (media) => {
  if (!media.hasLiked) {
    console.log(`❤️  liking media ${media.pk}`);
    await Client.Like.create(session, media.pk)
  }
}

const likeFirstUnlikedPic = async (account, n=-1, onLike) => {
  n = Math.floor(n);
  if (!n) return;
  const userMediaFeed = new Client.Feed.UserMedia(session, account.pk);
  await processFeed(userMediaFeed, async ({params: media}) => {
    if (!media.hasLiked) {
      await likePic(media)
      onLike && await onLike(media);
      await wait();
      const cancel = n > 0 && --n == 0;
      return cancel;
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
  likePic,
  likeFirstUnlikedPic,
}
