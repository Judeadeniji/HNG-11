import { handleHelloRequest } from "./handlers.js";
import { server } from "./server.js";
import dotenv from "dotenv";
import http from "http";

dotenv.config();

// Middleware to set client IP
server.use((req, res, next) => {
  const ip = req.ip || "0.0.0.0";
  
  if (!ip) {
    req.clientIp = {
      port: 3000,
      family: "IPv4",
      address: "0.0.0.0",
    };
  } else {
    req.clientIp = ip;
  }
  next();
});

// Define route
server.get("/api/hello", handleHelloRequest);

// Create and start server
const server2 = http.createServer(server);

const port = 3000;
server2.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
