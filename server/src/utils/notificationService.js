const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

async function sendExpoPush(expoPushToken, title, body, data = {}) {
  const payload = {
    to: expoPushToken,
    sound: 'default',
    title,
    body,
    data,
  };
  const response = await fetch(EXPO_PUSH_API, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return response.json();
}

module.exports = {
  sendExpoPush,
};
