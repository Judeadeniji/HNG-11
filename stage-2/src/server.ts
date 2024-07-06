import { Hono } from "hono/quick";
import type { Bindings } from "hono/types";
import type { Client } from "pg";
import type { Variables } from "../app.types";
import { createClient } from "./db/pg";

type AppEnv = { Bindings: Bindings, Variables: Variables }

const server = new Hono<AppEnv>();

server.use(async (ctx, next) => {
  const [error, client] = await createClient(ctx.env as any);
  
  if (error) {
    console.error(error!)
    ctx.set("pg-client", null)
  } else {
    ctx.set("pg-client", client! as Client)
  }

  await next();
});


export { server, type AppEnv };
