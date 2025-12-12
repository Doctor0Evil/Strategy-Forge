/* StrategyForge ZeroMQ → Socket.IO gateway */

const zmq = require("zeromq");
const { Server } = require("socket.io");

const ZMQ_ENDPOINT = process.env.ZMQ_ENDPOINT || "tcp://php-api:5557";
const PORT = parseInt(process.env.SOCKET_PORT || "8081", 10);

async function main() {
  const io = new Server(PORT, {
    cors: {
      origin: process.env.GAME_CORS_ORIGIN || "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", socket => {
    // Basic connection-level tagging can be added later (e.g. rooms per user/faction).
    socket.emit("connected", { message: "StrategyForge socket gateway ready" });
  });

  const sub = new zmq.Subscriber();
  sub.connect(ZMQ_ENDPOINT);
  sub.subscribe(); // all topics

  for await (const [msg] of sub) {
    let parsed;
    try {
      parsed = JSON.parse(msg.toString());
    } catch (e) {
      // malformed payload; ignore
      continue;
    }
    const action = parsed.action;
    const payload = parsed.payload || {};
    switch (action) {
      case "deploy":
      case "join_faction":
        io.emit("resource_update", payload);
        break;
      case "trade":
        io.emit("resource_update", payload);
        break;
      case "auction":
        io.emit("auction_update", payload);
        break;
      case "leaderboard":
        io.emit("leaderboard_update", payload);
        break;
      case "embed":
        io.emit("alliance_update", payload);
        break;
      default:
        // generic fallback
        io.emit("event", parsed);
    }
  }
}

main().catch(err => {
  // eslint-disable-next-line no-console
  console.error("Gateway error:", err);
  process.exit(1);
});
