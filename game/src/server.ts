import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { randomUUID } from "node:crypto";
import { Incoming as IncomingSchema } from "./protocol.js";
import type { Incoming, Pong, Welcome } from "./protocol.js";

const packageVersion = process.env.npm_package_version;
const COMMIT_SHA = process.env.COMMIT_SHA || packageVersion || "dev";
const PORT = Number.parseInt(process.env.PORT ?? "8080", 10);
const NODE_ENV = process.env.NODE_ENV === "production" ? "production" : "development";

type SocketConnection = {
  socket: {
    send(data: string): void;
    on(event: "message", listener: (raw: unknown) => void): void;
    on(event: "close", listener: () => void): void;
  };
};

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || "info",
  },
  genReqId: () => randomUUID(),
  requestIdLogLabel: "requestId",
});

const allowedOrigins = new Set([
  "https://impious.io",
  "https://wiki.impious.io",
  "https://game.impious.io",
]);

await app.register(cors, {
  origin(origin, cb) {
    if (!origin) {
      cb(null, true);
      return;
    }

    if (allowedOrigins.has(origin) || /^https:\/\/[a-z0-9-]+\.impious\.io$/.test(origin)) {
      cb(null, true);
      return;
    }

    cb(null, false);
  },
  credentials: true,
});

await app.register(websocket);

app.addHook("onRequest", async (request) => {
  request.log.debug({ url: request.url, method: request.method }, "incoming request");
});

app.get("/health", async () => ({
  ok: true,
  version: COMMIT_SHA,
  time: new Date().toISOString(),
}));

app.get("/healthz", async () => ({
  ok: true,
  version: COMMIT_SHA,
  time: new Date().toISOString(),
}));

app.get("/version", async () => ({
  version: COMMIT_SHA,
}));

app.get("/time", async () => ({
  now: new Date().toISOString(),
}));

app.get("/info", async () => ({
  name: "impious-game",
  port: PORT,
  env: NODE_ENV,
}));

function handleMessage(connection: SocketConnection, msg: Incoming) {
  if (msg.type === "ping") {
    const payload: Pong = { type: "pong", at: new Date().toISOString() };
    connection.socket.send(JSON.stringify(payload));
    return;
  }

  if (msg.type === "hello") {
    const payload: Welcome = {
      type: "welcome",
      you: { name: msg.name },
      at: new Date().toISOString(),
    };
    connection.socket.send(JSON.stringify(payload));
    return;
  }

  connection.socket.send(JSON.stringify({ type: "error", code: "BAD_EVENT" }));
}

app.get("/ws", { websocket: true }, (connection: SocketConnection, req) => {
  req.log.info("client connected");

  connection.socket.on("message", (raw: unknown) => {
    const rawString =
      typeof raw === "string"
        ? raw
        : Buffer.isBuffer(raw)
        ? raw.toString("utf8")
        : String(raw);
    req.log.debug({ raw: rawString }, "ws message received");
    try {
      const parsedJSON = JSON.parse(rawString);
      const parsed = IncomingSchema.safeParse(parsedJSON);
      if (!parsed.success) {
        connection.socket.send(JSON.stringify({ type: "error", code: "BAD_EVENT" }));
        return;
      }

      handleMessage(connection, parsed.data);
    } catch {
      connection.socket.send(JSON.stringify({ type: "error", code: "BAD_JSON" }));
    }
  });

  connection.socket.on("close", () => {
    req.log.info("client disconnected");
  });
});

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  app.log.info({ commit: COMMIT_SHA, port: PORT }, "impious-game v0.1 booted");
} catch (err) {
  app.log.error({ err }, "failed to start server");
  process.exit(1);
}
