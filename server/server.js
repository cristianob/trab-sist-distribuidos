const net = require("net");

var client = new net.Socket();
client.connect(1337, "127.0.0.1", () => {
  console.log("Creating topics on broker");
  client.write(JSON.stringify({ cmd: "create", topic: "queries" }));
  client.write(JSON.stringify({ cmd: "create", topic: "responses" }));

  console.log("Subscribing to 'queries' topic");
  client.write(JSON.stringify({ cmd: "subscribe", topic: "queries" }));
});

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

function sendResponse(opr, args, result) {
  client.write(
    JSON.stringify({
      cmd: "publish",
      topic: "responses",
      data: JSON.stringify({ type: "result", opr, args, result }),
    })
  );
}

function processOpr(opr, args) {
  switch (opr) {
    case "add":
      const result = args.reduce((a, b) => a + b, 0);
      sendResponse(opr, args, result);
      break;
    case "sub":
      const result2 = args.reduce((a, b) => a - b, 0);
      sendResponse(opr, args, result2);
      break;
    case "mul":
      const result3 = args.reduce((a, b) => a * b, 1);
      sendResponse(opr, args, result3);
      break;
    case "div":
      const result4 = args.reduce((a, b) => a / b, 1);
      sendResponse(opr, args, result4);
      break;
    default:
      console.log(`Unknown operation: ${opr}`);
  }
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
    processOpr(data.opr, data.args);
  }
}

client.on("data", (data) => {
  const messages = parseMessages(data);
  messages.forEach(processMessage);
});

client.on("close", () => {
  client.write(JSON.stringify({ cmd: "unsubscribe", topic: "queries" }));
});
