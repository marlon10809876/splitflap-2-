const display = document.getElementById("display");
const statusBox = document.getElementById("status");
const charInput = document.getElementById("charInput");
const magnetInput = document.getElementById("magnetInput");

function normalizeDisplayChar(char) {
  if (!char || char === "_" || char === "LEER" || char === "SPACE") {
    return " ";
  }

  return char.toUpperCase();
}

function setStatus(text) {
  statusBox.textContent = text;
}

async function sendChar() {
  const char = charInput.value.trim() || "_";

  setStatus("Sende Zeichen: " + char + " ...");

  const res = await fetch("/api/set?char=" + encodeURIComponent(char));
  const data = await res.json();

  display.textContent = normalizeDisplayChar(char);

  setStatus(
    "Zeichen gesendet.\n\n" +
    JSON.stringify(data, null, 2)
  );
}

async function quickSend(char) {
  charInput.value = char;
  await sendChar();
}

async function calibrate() {
  const char = magnetInput.value.trim() || "_";

  setStatus("Sende Kalibrierung: " + char + " ...");

  const res = await fetch("/api/calibrate?char=" + encodeURIComponent(char));
  const data = await res.json();

  display.textContent = normalizeDisplayChar(char);

  setStatus(
    "Kalibrierung gesendet.\n\n" +
    JSON.stringify(data, null, 2)
  );
}

async function loadStatus() {
  const res = await fetch("/api/status");
  const data = await res.json();

  const command = data.currentCommand;

  if (command && command.value) {
    display.textContent = normalizeDisplayChar(command.value);
  }

  setStatus(JSON.stringify(data, null, 2));
}

charInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    sendChar();
  }
});

magnetInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    calibrate();
  }
});

loadStatus();