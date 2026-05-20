const express = require("express");

const app = express();

app.get("/", (req, res) => {
  res.send("Split-Flap Server läuft.");
});

app.get("/api/set", (req, res) => {
  const char = req.query.char || "";
  res.json({
    ok: true,
    message: "API SET funktioniert",
    char: char
  });
});
app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    status: "online"
  });
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server läuft auf Port " + PORT);
});