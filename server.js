const express = require("express");
const path = require("path");

const app = express();

let currentCommand = {
  id: 0,
  type: "",
  module: -1,
  value: ""
};

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/set", (req, res) => {
  const module = Number(req.query.module ?? 0);
  const char = req.query.char;

  if (!char) {
    return res.status(400).json({ ok: false, error: "char fehlt" });
  }

  currentCommand.id++;
  currentCommand.type = "set";
  currentCommand.module = module;
  currentCommand.value = char;

  console.log("SET:", currentCommand);

  res.json({ ok: true, command: currentCommand });
});

app.get("/api/grid", (req, res) => {
  const text = (req.query.text || "____").toString().slice(0, 4).padEnd(4, "_");

  currentCommand.id++;
  currentCommand.type = "grid";
  currentCommand.module = -1;
  currentCommand.value = text;

  console.log("GRID:", currentCommand);

  res.json({ ok: true, command: currentCommand });
});

app.get("/api/calibrate", (req, res) => {
  const module = Number(req.query.module ?? 0);

  currentCommand.id++;
  currentCommand.type = "cal";
  currentCommand.module = module;
  currentCommand.value = "";

  console.log("CAL PEAK:", currentCommand);

  res.json({ ok: true, command: currentCommand });
});

app.get("/api/magnet", (req, res) => {
  const module = Number(req.query.module ?? 0);
  const char = req.query.char || "_";

  currentCommand.id++;
  currentCommand.type = "magnet";
  currentCommand.module = module;
  currentCommand.value = char;

  console.log("MAGNET:", currentCommand);

  res.json({ ok: true, command: currentCommand });
});

app.get("/api/clock", (req, res) => {
  currentCommand.id++;
  currentCommand.type = "clock";
  currentCommand.module = -1;
  currentCommand.value = "";

  console.log("CLOCK:", currentCommand);

  res.json({ ok: true, command: currentCommand });
});

app.get("/api/manual", (req, res) => {
  currentCommand.id++;
  currentCommand.type = "manual";
  currentCommand.module = -1;
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