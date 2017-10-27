const { USERNAME, PASSWORD } = require('./config');

const Client = require('instagram-private-api').V1;
const device = new Client.Device(USERNAME);
const storage = new Client.CookieFileStorage(__dirname + `/data/${USERNAME}/cookies.json`);

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

const getSession = () => session;

module.exports = {
  init,
  getSession,
  processFeed,
}
