import dotenv from "dotenv";

dotenv.config();

const handleHelloRequest = safelyRun(
  /**
   * 
   * @param {import("express").Request} req 
   * @param {import("express").Response} res 
   * @returns 
   */
  async (req, res) => {
  const clientIp = req.ips;
  console.log(clientIp)
  const mockIp = clientIp === "::1" ? "24.48.0.1" : clientIp;
  const visitorName = req.query.visitor_name;

  if (!visitorName) {
    return res.status(400).json({ error: "visitor_name is required", status: false });
  }

  const ipApiResponse = await fetch("http://ip-api.com/json/" + mockIp);
  const ipApiData = await ipApiResponse.json();

  const weatherApiResponse = await fetch(
    "https://api.weatherapi.com/v1/current.json?q=" + ipApiData.city + "&key=" + process.env.W_KEY
  );
  const weatherApiData = await weatherApiResponse.json();

  if (weatherApiData.error) {
    return res.status(400).json({ error: weatherApiData.error.message, status: false });
  }

  const greeting = `Hello, ${visitorName}!, the temperature is ${weatherApiData.current.temp_c} degrees Celsius in ${ipApiData.city}`;

  const location = clientIp === "::1" ? "localhost" : ipApiData.city;

    console.log("Client IP:", clientIp);
  return res.json({
    client_ip: clientIp[0] || ipApiData.query
    ,
    greeting,
    location,
  });
});

function safelyRun(fn) {
  return async (req, res) => {
    try {
      return await fn(req, res);
    } catch (e) {
      console.error(e, e.cause);
      res.status(500).send("Internal Server Error");
    }
  };
}

export { handleHelloRequest };
