import type { Context } from "hono";
import type { BlankInput } from "hono/types";
import type { Variables } from "./server.js";

const handle_hello_request = safelyRun(
  async (c: Context<{ Variables: Variables }, "/api/hello", BlankInput>) => {
    const client_ip = c.get("client_ip");
    const mock_ip = client_ip.address === "::1" ? "24.48.0.1" : client_ip.address;
    const visitor_name = c.req.query("visitor_name");

    if (!visitor_name) {
      return c.json({ error: "visitor_name is required", status: false }, 400);
    }

    const ip_api_response = await fetch("http://ip-api.com/json/" + mock_ip);
    const ip_api_data = await ip_api_response.json();

    const weather_api_response = await fetch(
      "https://api.weatherapi.com/v1/current.json?q=" +
        ip_api_data.city +
        "&key=" +
        process.env.W_KEY
    );
    const weather_api_data = await weather_api_response.json();

    if (weather_api_data.error) {
      return c.json({ error: weather_api_data.error.message, status: false }, 400);
    }

    const greeting = `Hello, ${visitor_name}!, the temperature is ${
      weather_api_data.current.temp_c
    } degrees Celsius in ${ip_api_data.city}`;

    const location = client_ip.address === "::1" ? "localhost" : ip_api_data.city;

    return c.json({
      client_ip: client_ip.address,
      greeting,
      location,
    });
  }
);

function safelyRun<T extends (...args: any[]) => any>(fn: T) {
  return async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (e) {
      console.error(e, (e as Error).cause);
      return new Response("Internal Server Error", { status: 500 });
    }
  };
}

export { handle_hello_request };
