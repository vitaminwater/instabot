
const async = require('async');

const find = async (arr, fn) => new Promise((resolve, reject) => async.findSeries(arr, fn, (err, result) => err ? reject(err) : resolve(result)));
const findSeries = async (arr, fn) => new Promise((resolve, reject) => async.findSeries(arr, fn, (err, result) => err ? reject(err) : resolve(result)));
const each = async (arr, fn) => new Promise((resolve, reject) => async.eachSeries(arr, fn, err => err ? reject(err) : resolve()));
const eachSeries = async (arr, fn) => new Promise((resolve, reject) => async.eachSeries(arr, fn, err => err ? reject(err) : resolve()));

const wait = async (millis=-1) => {
  millis = millis < 0 ? Math.random() * 3000 + 3000 : millis;
  return new Promise((resolve) => setTimeout(resolve, millis));
}

module.exports = {
  find,
  findSeries,
  each,
  eachSeries,
  wait,
}
