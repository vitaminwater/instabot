const { USERNAME, PASSWORD, DATA_DIR } = require('./config');

const rw = require('random-word');

const Client = require('instagram-private-api').V1;

const { find, findSeries, wait } = require('./utils');
const { getSQL, runSQL } = require('./db');

let session;
let dummySession;

const loginDummyAccount = async () => {
  let session;
  const last_created = await getSQL('select * from dummy_account where created_at > datetime(\'now\',\'localtime\',\'-5 days\') order by created_at desc limit 1');
  if (!last_created) {
    const account = {
      email: `${rw()}.${rw()}@gmail.com`,
      username: `${rw()}${(''+Math.ceil(Math.random()*1000)).padStart(4, '0')}`,
      password: `${rw()}!${rw()}`,
      name: `${rw()} ${rw()}`,
    };
    console.log(`registering dummy account ${account.username}`);

    const device = new Client.Device(account.username);
    const storage = new Client.CookieFileStorage(`${DATA_DIR}/cookies-${account.username}.json`);
    dummySession = new Client.Session(device, storage);
    await new Client.AccountEmailCreator(dummySession)
      .setEmail(account.email)
      .setUsername(account.username)
      .setPassword(account.password)
      .setName(account.name)
      .register();
    await runSQL('insert into dummy_account (email, username, password, name) values (?, ?, ?, ?)', [account.email, account.username, account.password, account.name]);
  } else {
    const account = await getSQL('select * from dummy_account order by random() limit 1'); 
    console.log(`logging dummy account ${account.username}`);
    const device = new Client.Device(account.username);
    const storage = new Client.CookieFileStorage(`${DATA_DIR}/cookies-${account.username}.json`);
    dummySession = await Client.Session.create(device, storage, USERNAME, PASSWORD);
  }

  return session;
}

const loginAccount = async () => {
  const device = new Client.Device(USERNAME);
  const storage = new Client.CookieFileStorage(`${DATA_DIR}/cookies.json`);
  session = await Client.Session.create(device, storage, USERNAME, PASSWORD);
}

const init = async () => {
  try {
    await loginDummyAccount();
    await loginAccount(); 
  } catch(e) {
    console.log(e);
    process.exit();
  }
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
const getDummySession = () => dummySession;

module.exports = {
  init,
  getSession,
  getDummySession,
  processFeed,
}
