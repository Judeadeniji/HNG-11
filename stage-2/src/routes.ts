import { handleLogin, handleRegistration } from "./handlers";
import { server } from "./server";

server.post("/auth/register", handleRegistration);
server.post("/auth/login", handleLogin);

export {
  server
};
