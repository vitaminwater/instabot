const { USERNAME } = require('./config');
const fs = require('fs');
const async = require('async');
const sqlite3 = require('sqlite3').verbose();

let db;

const DATA_DIR = `./data/${USERNAME}`;

const isFirstRun = () => !fs.existsSync(DATA_DIR);

const createDataDirectory = () => fs.mkdirSync(DATA_DIR);

const openDb = () => { db = new sqlite3.Database(`./${DATA_DIR}/db.sqlite3`); }

const runSQL = async (query, params=[]) => new Promise((resolve, reject) => {
  db.run(query, params, (e) => {
    if (e) return reject(e);
    resolve();
  });
})

const getSQL = async (query, params=[]) => new Promise((resolve, reject) => {
  db.get(query, params, (err, row) => {
    if (err) return reject(err);
    resolve(row);
  });
});

const createMigrationTable = async () => runSQL("create table if not exists migration (name text); create unique index if not exists index_migration_name on migration (name);");

const applyMigrationIdNeeded = async () => {
  const migrationFileDone = async (migrationFile) => {
    const { name } = await getSQL('select name from migration where name=?', migrationFile);
    console.log(name);
    return !!name;
  }
  const setMigrationFileDone = async (migrationFile) => runSQL('insert into migration values(?)', migrationFile);
  const migrationFiles = fs.readdirSync('./migrations').sort();
  async.eachSeries(migrationFiles, async (migrationFile) => {
    if (!await migrationFileDone(migrationFile)) {
      try {
        console.log('running migration file', migrationFile);
        const migrationQuery = fs.readFileSync(`./migrations/${migrationFile}`).toString();
        await runSQL(migrationQuery);
        await setMigrationFileDone(migrationFile);
      } catch (e) {
        console.log(e);
        process.exit();
      }
    }
  });
}

const init = async () => {
  if (db) return Promise.resolve();
  if (isFirstRun()) {
    createDataDirectory();
    openDb();
    await createMigrationTable();
  } else {
    openDb();
  }
  await applyMigrationIdNeeded();
};

module.exports = {
  init,
  runSQL,
  getSQL,
};
