import type { SocketAddress } from "bun";
import { Hono } from "hono";

type Variables = {
  client_ip: SocketAddress;
};

const server = new Hono<{ Variables: Variables }>().basePath("/api");


export {
  server,
  Variables
};
