import { handleAddUserToOrganisation, handleCreateOrganisation, handleGetAllOrganisations, handleGetAllUsersInAOrganisation, handleGetSingleOrganisation, handleGetSingleUser, handleLogin, handleRegistration } from "./handlers";
import { apiServer, server } from "./server";

// Auth routes
server.post("/auth/register", handleRegistration);
server.post("/auth/login", handleLogin);

// protected routes
apiServer.get("/users/:id", handleGetSingleUser);
apiServer.get("/organisations", handleGetAllOrganisations);
apiServer.get("/organisations/:orgId", handleGetSingleOrganisation);
apiServer.post("/organisations", handleCreateOrganisation);

// unprotected routes
server.get("/api/organisations/:orgId/users", handleGetAllUsersInAOrganisation)
server.post("/api/organisations/:orgId/users", handleAddUserToOrganisation)


server.route("/api", apiServer);

export {
  server
};
