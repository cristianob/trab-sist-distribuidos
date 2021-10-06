const topics = {};

function createTopic(name) {
  topics[name] = {
    name,
    subscribers: {},
  };
}

function removeTopic(name) {
  delete topics[name];
}

function subscribe(topic, ip, port, socket) {
  topics[topic].subscribers[`${ip}:${port}`] = socket;
}

function unsubscribe(topic, ip, port) {
  delete topics[topic].subscribers[`${ip}:${port}`];
}

function publish(topic, data) {
  Object.keys(topics[topic].subscribers).forEach((ip) => {
    try {
      topics[topic].subscribers[ip].write(
        JSON.stringify({ type: "message", topic: topic, data: data })
      );
    } catch (e) {
      console.log(`Unable to send message to ${ip}, unsubscribing`);
      delete topics[topic].subscribers[ip];
    }
  });
}

function getDebugData() {
  return topics;
}

module.exports = {
  createTopic,
  removeTopic,
  subscribe,
  unsubscribe,
  publish,
  getDebugData,
};
