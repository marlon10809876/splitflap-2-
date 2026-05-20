const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

const wss = new WebSocket.Server({ server });

let espSocket = null;
let webClients = new Set();

function sendJson(socket, data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
    return true;
  }
  return false;
}

function broadcastToWebClients(data) {
  for (const client of webClients) {
    sendJson(client, data);
  }
}

wss.on("connection", (socket) => {
  console.log("Neuer WebSocket verbunden");

  socket.role = "unknown";

  socket.on("message", (message) => {
    let data;

    try {
      data = JSON.parse(message.toString());
    } catch (error) {
      console.log("Ungültige Nachricht:", message.toString());
      return;
    }

    console.log("Empfangen:", data);

    if (data.type === "client" && data.role === "webapp") {
      socket.role = "webapp";
      webClients.add(socket);

      sendJson(socket, {
        type: "server_status",
        value: "webapp_connected"
      });

      sendJson(socket, {
        type: "esp_status",
        value: espSocket ? "ESP online" : "ESP offline"
      });

      return;
    }

    if (data.type === "client" && data.role === "esp") {
      socket.role = "esp";
      espSocket = socket;

      console.log("ESP verbunden");

      broadcastToWebClients({
        type: "esp_status",
        value: "ESP online"
      });

      sendJson(socket, {
        type: "server_status",
        value: "esp_registered"
      });

      return;
    }

    if (
      socket.role === "webapp" &&
      ["display_text", "calibrate", "widget", "stop"].includes(data.type)
    ) {
      console.log("Befehl von Web-App an ESP:", data.type);

      if (!espSocket || espSocket.readyState !== WebSocket.OPEN) {
        console.log("ESP ist offline");

        sendJson(socket, {
          type: "error",
          value: "ESP offline"
        });

        broadcastToWebClients({
          type: "esp_status",
          value: "ESP offline"
        });

        return;
      }

      console.log("Sende an ESP:", data);

      sendJson(espSocket, data);

      sendJson(socket, {
        type: "ack",
        value: "sent_to_esp",
        command: data.type
      });

      return;
    }

    if (socket.role === "esp") {
      broadcastToWebClients(data);
      return;
    }
  });

  socket.on("close", () => {
    console.log("WebSocket getrennt:", socket.role);

    if (socket.role === "webapp") {
      webClients.delete(socket);
    }

    if (socket.role === "esp") {
      espSocket = null;

      broadcastToWebClients({
        type: "esp_status",
        value: "ESP offline"
      });
    }
  });

  socket.on("error", (error) => {
    console.log("WebSocket Fehler:", error.message);
  });
});

server.listen(PORT, () => {
  console.log(`Split-Flap Server läuft auf Port ${PORT}`);
});