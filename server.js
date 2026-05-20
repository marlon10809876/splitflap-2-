const express = require("express");
const path = require("path");

const app = express();

let currentCommand = {
  id: 0,
  type: "",
  value: ""
};

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/set", (req, res) => {
  const char = req.query.char;

  if (!char) {
    return res.status(400).json({ ok: false, error: "char fehlt" });
  }

  currentCommand.id++;
  currentCommand.type = "set";
  currentCommand.value = char;

  console.log("SET:", currentCommand);

  res.json({ ok: true, command: currentCommand });
});

app.get("/api/calibrate", (req, res) => {
  const char = req.query.char || "_";

  currentCommand.id++;
  currentCommand.type = "cal";
  currentCommand.value = char;

  console.log("CAL:", currentCommand);

  res.json({ ok: true, command: currentCommand });
});
async function enableClockMode(){
  const res = await fetch("/api/clock");
  const data = await res.json();
  console.log("Uhrmodus aktiviert:", data);

  safeText(displayBadge, "Clock mode");
  safeClass(displayBadge, "badge green");
}

async function enableManualMode(){
  const res = await fetch("/api/manual");
  const data = await res.json();
  console.log("Manuell aktiviert:", data);
}

app.get("/api/command", (req, res) => {
  res.json(currentCommand);
});

app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    currentCommand
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Split-Flap Server läuft auf Port ${PORT}`);
});