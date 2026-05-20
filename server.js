const express = require("express");
const path = require("path");

const app = express();

// =====================================================
// AKTUELLER BEFEHL FÜR ESP32
// =====================================================

let currentCommand = {
  id: 0,
  type: "",
  value: ""
};

// =====================================================
// WEBAPP AUS public ORDNER LADEN
// =====================================================

app.use(express.static(path.join(__dirname, "public")));

// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
  res.send("Split-Flap Server läuft.");
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
// Beispiel:
// /api/command
// =====================================================

app.get("/api/command", (req, res) => {
  res.json(currentCommand);
});

// =====================================================
// STATUS TEST
// =====================================================

app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    currentCommand
  });
});

// =====================================================
// SERVER STARTEN
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Split-Flap Server läuft auf Port ${PORT}`);
});