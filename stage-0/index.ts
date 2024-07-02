import { handle_hello_request } from "./handlers.js";
import { server as app } from "./server.js";

const server = Bun.serve({
  fetch: app.fetch,
  port: 3000,
});

app.use(async (c, next) => {
  const ip = server.requestIP(c.req.raw);

  if (!ip) {
    c.set("client_ip", {
      port: 3000,
      family: "IPv4",
      address: "0.0.0.0",
    });
    await next();
  } else {
    console.log("Client IP:", ip);

    c.set("client_ip", ip);
    await next();
  }
});

app.get("/hello", handle_hello_request);


console.log(`Server running at http://${server.hostname}:${server.port} 🚀`);
