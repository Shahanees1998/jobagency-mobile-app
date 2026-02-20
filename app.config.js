// Optional: pass Pusher key/cluster from env into app extra (same as admin: NEXT_PUBLIC_PUSHER_KEY / PUSHER_CLUSTER)
const appJson = require('./app.json');
module.exports = {
  ...appJson.expo,
  extra: {
    ...appJson.expo.extra,
    pusherKey: process.env.EXPO_PUBLIC_PUSHER_KEY || '',
    pusherCluster: process.env.EXPO_PUBLIC_PUSHER_CLUSTER || 'mt1',
  },
};
