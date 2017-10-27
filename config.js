
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

if (!config.DATA_DIR) {
  config.DATA_DIR = `${__dirname}/data/${config.USERNAME}`;
}

const fs = require('fs');
if (!fs.existsSync(config.DATA_DIR)){
    fs.mkdirSync(config.DATA_DIR);
}

module.exports = config;
