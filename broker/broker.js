const net = require("net");
const topics = require("./topics");

/*
 * Formato da mensagem:
 *
 * {
 *   cmd: 'create' | 'remove' | 'subscribe' | 'unsubscribe' | 'publish'
 *   topic: string
 *   data?: string
 * }
 *
 *
 * Exemplos de mensagem:
 *
 * { "cmd": "create", "topic": "test" }
 * { "cmd": "remove", "topic": "test" }
 * { "cmd": "subscribe", "topic": "test" }
 * { "cmd": "unsubscribe", "topic": "test" }
 * { "cmd": "publish", "topic": "test", "data": "hello world" }
 * { "cmd": "debug" }
 */

function sendOk(socket) {
  socket.write(JSON.stringify({ type: "result", result: "ok" }));
}

function sendDebugData(socket) {
  socket.write(JSON.stringify({ type: "debug", data: topics.getDebugData() }));
}

function sendError(socket, error) {
  socket.write(JSON.stringify({ type: "error", error: error }));
}

function processCommand(socket, message) {
  try {
    switch (message.cmd) {
      case "create":
        console.log(`Creating topic ${message.topic}`);
        topics.createTopic(message.topic);
        sendOk(socket);
        break;
      case "remove":
        console.log(`Removing topic ${message.topic}`);
        topics.removeTopic(message.topic);
        sendOk(socket);
        break;
      case "subscribe":
        console.log(
          `Client ${socket.remoteAddress}:${socket.remotePort} subscribed to topic ${message.topic}`
        );
        topics.subscribe(
          message.topic,
          socket.remoteAddress,
          socket.remotePort,
          socket
        );
        sendOk(socket);
        break;
      case "unsubscribe":
        console.log(
          `Client ${socket.remoteAddress}:${socket.remotePort} unsubscribed from topic ${message.topic}`
        );
        topics.unsubscribe(
          message.topic,
          socket.remoteAddress,
          socket.remotePort
        );
        sendOk(socket);
        break;
      case "publish":
        console.log(
          `Client ${socket.remoteAddress}:${socket.remotePort} published message to topic ${message.topic}: ${message.data}`
        );
        topics.publish(message.topic, message.data);
        sendOk(socket);
        break;
      case "debug":
        sendDebugData(socket);
    }
  } catch (e) {
    sendError(socket, e.message);
  }
}

function parseMessages(data) {
  let messages = [];

  if (data.indexOf("}{") > -1) {
    const processData = data.toString().replace(/}{/g, "}|{");
    messages = processData.split("|").map((m) => JSON.parse(m));
  } else {
    messages.push(JSON.parse(data));
  }

  return messages;
}

const server = net.createServer((socket) => {
  socket.on("data", (data) => {
    const messages = parseMessages(data);

    messages.forEach((message) => {
      processCommand(socket, message);
    });
  });
});

server.listen(1337, "127.0.0.1");
