const { USERNAME, DATA_DIR } = require('./config');
const fs = require('fs');
const async = require('async');
const sqlite3 = require('sqlite3').verbose();

const { eachSeries } = require('./utils');

let db;

const openDb = async () => await new Promise((resolve) => {db = new sqlite3.Database(`${DATA_DIR}/db.sqlite3`, resolve); });

const runSQL = async (query, params=[]) => await new Promise((resolve, reject) => {
  db.run(query, params, (err) => {
    if (err) return reject(err);
    resolve();
  });
});

const runSQLFile = async (content) => await eachSeries(content.replace(/\r|\n/g, '').replace(/;$/, '').split(';'), runSQL);

const getSQL = async (query, params=[]) => await new Promise((resolve, reject) => {
  db.get(query, params, (err, row) => {
    if (err) return reject(err);
    resolve(row);
  });
});

const allSQL = async (query, params=[]) => await new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => {
    if (err) return reject(err);
    const arr = [];
    rows.forEach((row) => {
      arr.push(row);
    });
    resolve(arr);
  });
});

const createMigrationTable = async () => await runSQLFile("create table if not exists migration (name text); create unique index if not exists index_migration_name on migration (name);");

const applyMigrationIdNeeded = async () => {
  const migrationFileDone = async (migrationFile) => {
    try {
      const { name } = await getSQL('select name from migration where name=?', migrationFile);
      return true;
    } catch(e) {
      return false;
    }
  }
  const setMigrationFileDone = async (migrationFile) => runSQL('insert into migration values(?)', migrationFile);
  const migrationFiles = fs.readdirSync('./migrations').sort();
  await eachSeries(migrationFiles, async (migrationFile) => {
    if (!await migrationFileDone(migrationFile)) {
      console.log('running migration file', migrationFile);
      const migrationQuery = fs.readFileSync(`./migrations/${migrationFile}`).toString();
      await runSQLFile(migrationQuery);
      await setMigrationFileDone(migrationFile);
    }
  });
}

const init = async () => {
  if (db) return;
  await openDb();

  try {
    await createMigrationTable();
    await applyMigrationIdNeeded();
  } catch(e) {
    console.log(e);
    process.exit();
  }
};

module.exports = {
  init,
  runSQL,
  getSQL,
  allSQL,
};
