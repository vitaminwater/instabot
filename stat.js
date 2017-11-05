const { SEGMENT_TOKEN } = require('./config');

const Analytics = require('analytics-node');
const analytics = new Analytics(SEGMENT_TOKEN);

const start = () => {
  analytics.track({anonymousId: '42', event: 'START'});
}

const error = (e) => {
  analytics.track({anonymousId: '42', event: 'ERROR', properties: e});
}

const unfollow = (account) => {
  analytics.track({
    anonymousId: '42', 
    event: 'UNFOLLOW',
    properties: account,
  });
}

const follow = (account) => {
  analytics.track({
    anonymousId: '42', 
    event: 'FOLLOW',
    properties: account,
  });
}

const del = (table, n) => {
  analytics.track({
    anonymousId: '42', 
    event: `DELETE_${table.toUpperCase()}`,
    properties: {n},
  });
}

module.exports = {
  start,
  error,
  unfollow,
  follow,
  del,
};
