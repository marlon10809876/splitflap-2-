const express = require("express");

const app = express();

// =====================================================
// WEBAPP AUS public LADEN
// =====================================================

app.use(express.static("public"));

// =====================================================
// AKTUELLER ESP32 BEFEHL
// =====================================================

let currentCommand = {
  id: 0,
  type: "",
  value: ""
};

// =====================================================
// STATUS
// =====================================================

app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    status: "online"
  });
});

// =====================================================
// ZEICHEN SETZEN
// Beispiel:
// /api/set?char=A
// =====================================================

app.get("/api/set", (req, res) => {
  const char = req.query.char;

  if (!char) {
    return res.status(400).json({
      ok: false,
      error: "char fehlt"
    });
  }

  currentCommand.id++;
  currentCommand.type = "set";
  currentCommand.value = char;

  console.log("SET:", currentCommand);

  res.json({
    ok: true,
    command: currentCommand
  });
});

// =====================================================
// KALIBRIERUNG
// Beispiel:
// /api/calibrate?char=_
// =====================================================

app.get("/api/calibrate", (req, res) => {
  const char = req.query.char || "_";

  currentCommand.id++;
  currentCommand.type = "cal";
  currentCommand.value = char;

  console.log("CAL:", currentCommand);

  res.json({
    ok: true,
    command: currentCommand
  });
});

// =====================================================
// ESP32 HOLT AKTUELLEN BEFEHL
// =====================================================

app.get("/api/command", (req, res) => {
  res.json(currentCommand);
});

// =====================================================
// SERVER START
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});
