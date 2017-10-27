
const CONFIG_FILE = process.env['CONFIG_FILE'];

const config = {
  USERNAME: process.env['USERNAME'] || '',
  PASSWORD: process.env['PASSWORD'] ||  '',
}

try {
  console.log('loading: ', CONFIG_FILE);
  const configFile = require(CONFIG_FILE);
  Object.assign(config, configFile);
} catch(e) {console.log(e)}

module.exports = config;
