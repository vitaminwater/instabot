const { SEGMENT_TOKEN } = require('./config');

const Analytics = require('analytics-node');
let analytics;
if (SEGMENT_TOKEN) {
  analytics = new Analytics(SEGMENT_TOKEN);
}

const start = () => {
  if (!SEGMENT_TOKEN) return;
  analytics.track({anonymousId: '42', event: 'START'});
}

const error = (e) => {
  if (!SEGMENT_TOKEN) return;
  analytics.track({anonymousId: '42', event: 'ERROR', properties: e});
}

const unfollow = (account) => {
  if (!SEGMENT_TOKEN) return;
  analytics.track({
    userId: account.pk, 
    event: 'UNFOLLOW',
    properties: account,
  });
}

const follow = (account) => {
  if (!SEGMENT_TOKEN) return;
  analytics.track({
    userId: account.pk, 
    event: 'FOLLOW',
    properties: account,
  });
}

const mediaLiked = (media) => {
  if (!SEGMENT_TOKEN) return;
  analytics.track({
    userId: media.pk, 
    event: 'MEDIA_LIKED',
    properties: media,
  });
}

const unfollower = (account) => {
  if (!SEGMENT_TOKEN) return;
  analytics.track({
    userId: account.pk, 
    event: 'UNFOLLOWER',
    properties: account,
  });
}

const del = (table, n) => {
  if (!SEGMENT_TOKEN) return;
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
  mediaLiked,
  unfollower,
  del,
};
