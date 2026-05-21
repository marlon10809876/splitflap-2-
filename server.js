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
  currentCommand.id++;
  currentCommand.type = "cal";
  currentCommand.value = "";

  console.log("CAL PEAK:", currentCommand);

  res.json({ ok: true, command: currentCommand });
});

app.get("/api/magnet", (req, res) => {
  const char = req.query.char || "_";

  currentCommand.id++;
  currentCommand.type = "magnet";
  currentCommand.value = char;

  console.log("MAGNET:", currentCommand);

  res.json({ ok: true, command: currentCommand });
});

app.get("/api/clock", (req, res) => {
  currentCommand.id++;
  currentCommand.type = "clock";
  currentCommand.value = "";

  console.log("CLOCK:", currentCommand);

  res.json({ ok: true, command: currentCommand });
});

app.get("/api/manual", (req, res) => {
  currentCommand.id++;
  currentCommand.type = "manual";
  currentCommand.value = "";

  console.log("MANUAL:", currentCommand);

  res.json({ ok: true, command: currentCommand });
});

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