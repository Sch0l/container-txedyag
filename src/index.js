import { createBareServer } from "@tomphttp/bare-server-node";
import { createServer } from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";



const express = require("express")
const app = express()
const port = 5000

const mysql = require('mysql2')

DB_USER = process.env.DB_USER;
DB_PASSWORD = process.env.DB_PASSWORD;
DB_HOST = process.env.DB_HOST;
DB_PORT = process.env.DB_PORT;
DB_NAME = process.env.DB_NAME;

const __dirname = join(fileURLToPath(import.meta.url), "..");
const bare = createBareServer("/bare/");
const publicPath = "public";

app.use(express.static(publicPath));

app.use((req, res) => {
  res.status(404);
  res.sendFile(join(__dirname, publicPath, "404.html"));
});

const server = createServer();

server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) {
      bare.routeRequest(req, res);
  } else {
      app(req, res);
  }
});

server.on("upgrade", (req, socket, head) => {
  if (bare.shouldRoute(req)) {
      bare.routeUpgrade(req, socket, head);
  } else {
      socket.end();
  }
});

let Port = parseInt(process.env.PORT || "");

if (isNaN(Port)) Port = 5000;

server.on("listening", () => {
  const address = server.address();
  console.log("Listening on:");
  console.log(`\thttp://localhost:${address.port}`);
  console.log(
      `\thttp://${
          address.family === "IPv6" ? `[${address.address}]` : address.address
      }:${address.port}`
  );
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close();
  bare.close();
  process.exit(0);
}

server.listen({
  Port,
});

app.get("/health", (req, res) => {
  // Create connection to database
  // Get database settings from environment
  let health = "BAD"
  const connection = mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    database: DB_NAME,
    password: DB_PASSWORD,
  });

	connection.query(
		'SELECT NOW() AS now',
		function (err, results, fields) {
			if (err) {
        console.error(err)
				res.send(health)
			} else {
				console.log(results) // results contains rows returned by server
				console.log(fields) // fields contains extra meta data about results, if available
				health = "OK"
				res.send(health)	
			}
		}
	);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
