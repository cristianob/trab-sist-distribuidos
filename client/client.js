const BROKER_HOST = "127.0.0.1";
const BROKER_PORT = 1337;

const net = require("net");
const readline = require("readline");

const client = new net.Socket();
client.connect(BROKER_PORT, BROKER_HOST, () => {
  client.write(JSON.stringify({ cmd: "subscribe", topic: "responses" }));
});

function sendOperation(operation, args) {
  const message = {
    cmd: "publish",
    topic: "queries",
    data: JSON.stringify({ opr: operation, args: args }),
  };

  client.write(JSON.stringify(message));
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

function processMessage(message) {
  if (message.type === "error") {
    console.log(`Broker error: ${message.error}`);
    return;
  }

  if (message.type === "result") {
    return;
  }

  if (message.type === "message") {
    const data = JSON.parse(message.data);
    console.log(
      `Resultado do ${data.opr} com os argumentos ${data.args.join(", ")} é ${
        data.result
      }`
    );
  }
}

client.on("data", (data) => {
  const messages = parseMessages(data);
  messages.forEach(processMessage);
});

client.on("close", () => {
  client.write(JSON.stringify({ cmd: "unsubscribe", topic: "responses" }));
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const readCmds = function () {
  rl.question("Comando [add|sub|mul|div|exit]: ", function (cmd) {
    if (cmd === "exit") {
      client.write(JSON.stringify({ cmd: "unsubscribe", topic: "responses" }));
      client.destroy();
      rl.close();
    }

    rl.question("Argumentos (separado por vírgula): ", function (args) {
      sendOperation(cmd, args.split(",").map((a) => parseInt(a)));
      readCmds();
    });
  });
};

readCmds();
