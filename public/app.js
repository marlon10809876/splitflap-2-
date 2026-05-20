const ROWS = 6;
const COLS = 20;

const grid = document.getElementById("grid");
const inputText = document.getElementById("inputText");
const dragHandle = document.getElementById("dragHandle");
const statusText = document.getElementById("statusText");
const statusDot = document.getElementById("statusDot");
const sendBtn = document.getElementById("sendBtn");
const serverBadge = document.getElementById("serverBadge");
const displayBadge = document.getElementById("displayBadge");

function safeText(el, text){
  if(el) el.textContent = text;
}

function safeClass(el, className){
  if(el) el.className = className;
}

const flipOrder = [
  "A","B","C","D","E","F","G","H",
  "J","K","L","M","N","P","Q","R","S","T",
  "U","V","W","X","Y","Z","O","I",
  "2","3","4","5","6","7","8","9",
  "-",":",".","€","&"," "
];

let cells = Array.from({ length: ROWS }, () =>
  Array.from({ length: COLS }, () => "")
);

let drag = null;
let flipTimer = null;
let flipIndex = 0;
let socket = null;
let socketConnected = false;

cells[0][0] = "A";
cells[0][1] = "A";

function getWebSocketUrl(){
  const protocol = location.protocol === "https:" ? "wss://" : "ws://";
  return protocol + location.host;
}

function connectWebSocket(){
  const url = getWebSocketUrl();

  socket = new WebSocket(url);

  socket.addEventListener("open", () => {
    socketConnected = true;
    setConnectionState(true);
    console.log("WebSocket verbunden:", url);

    sendToServer({
      type: "client",
      role: "webapp"
    });
  });

  socket.addEventListener("message", (event) => {
    console.log("Nachricht vom Server:", event.data);

    try {
      const data = JSON.parse(event.data);

      if(data.type === "ack"){
        safeText(displayBadge, "Sent");
        safeClass(displayBadge, "badge green");
      }

      if(data.type === "esp_status"){
        safeText(displayBadge, data.value || "ESP");
        safeClass(displayBadge, data.value === "ESP online" ? "badge green" : "badge red");
      }

      if(data.type === "status"){
        safeText(displayBadge, data.value || data.status || "ESP");

        if(data.status === "error"){
          safeClass(displayBadge, "badge red");
        }else if(data.status === "done" || data.status === "stopped"){
          safeClass(displayBadge, "badge green");
        }else{
          safeClass(displayBadge, "badge yellow");
        }

        if(data.status === "done" || data.status === "stopped"){
          stopFlip();
          renderGrid();
          safeText(statusText, "Live");
        }
      }

      if(data.type === "error"){
        safeText(displayBadge, data.value || "Error");
        safeClass(displayBadge, "badge red");
      }

    } catch(error) {
      console.warn("Ungültige Server-Nachricht:", event.data);
    }
  });

  socket.addEventListener("close", () => {
    socketConnected = false;
    setConnectionState(false);
    console.warn("WebSocket getrennt. Neuer Versuch in 2 Sekunden.");
    setTimeout(connectWebSocket, 2000);
  });

  socket.addEventListener("error", () => {
    socketConnected = false;
    setConnectionState(false);
  });
}

function setConnectionState(connected){
  if(connected){
    safeText(statusText, "Live");
    if(statusDot) statusDot.classList.add("connected");
    safeText(serverBadge, "Online");
    safeClass(serverBadge, "badge green");
  }else{
    safeText(statusText, "Offline");
    if(statusDot) statusDot.classList.remove("connected");
    safeText(serverBadge, "Offline");
    safeClass(serverBadge, "badge red");
  }
}

function sendToServer(data){
  if(!socket || socket.readyState !== WebSocket.OPEN){
    console.warn("WebSocket ist nicht verbunden.");
    return false;
  }

  socket.send(JSON.stringify(data));
  return true;
}

function createGrid(){
  grid.innerHTML = "";

  for(let r = 0; r < ROWS; r++){
    for(let c = 0; c < COLS; c++){
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.r = r;
      tile.dataset.c = c;

      const span = document.createElement("span");
      span.textContent = cells[r][c] || "";

      tile.appendChild(span);
      grid.appendChild(tile);
    }
  }
}

function renderGrid(){
  document.querySelectorAll(".tile").forEach(tile => {
    const r = Number(tile.dataset.r);
    const c = Number(tile.dataset.c);

    tile.classList.remove("active");
    tile.querySelector("span").textContent = cells[r][c] || "";

    if(cells[r][c]){
      tile.classList.add("active");
    }
  });
}

function getTileMetrics(){
  const first = document.querySelector(".tile");
  const rect = first.getBoundingClientRect();
  const gridRect = grid.getBoundingClientRect();
  const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;

  return {
    tileW: rect.width,
    tileH: rect.height,
    gap,
    gridRect
  };
}

function textToLines(text){
  return text
    .toUpperCase()
    .split("\n")
    .map(line => line.split(""));
}

function clearPreview(){
  document.querySelectorAll(".tile.preview").forEach(tile => {
    tile.classList.remove("preview");
  });
}

function preview(row, col, text){
  clearPreview();

  const lines = textToLines(text);

  for(let r = 0; r < lines.length; r++){
    for(let c = 0; c < lines[r].length; c++){
      const rr = row + r;
      const cc = col + c;

      if(rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS){
        const tile = document.querySelector(`.tile[data-r="${rr}"][data-c="${cc}"]`);
        if(tile) tile.classList.add("preview");
      }
    }
  }
}

function place(row, col, text){
  const lines = textToLines(text);

  for(let r = 0; r < lines.length; r++){
    for(let c = 0; c < lines[r].length; c++){
      const rr = row + r;
      const cc = col + c;

      if(rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS){
        cells[rr][cc] = lines[r][c] === " " ? "" : lines[r][c];
      }
    }
  }

  renderGrid();
}

function createGhost(text){
  const { tileW, tileH } = getTileMetrics();
  const lines = textToLines(text);
  const cols = Math.max(...lines.map(line => line.length));

  const ghost = document.createElement("div");
  ghost.className = "ghost";
  ghost.style.setProperty("--tw", tileW + "px");
  ghost.style.setProperty("--th", tileH + "px");
  ghost.style.setProperty("--cols", cols);

  lines.forEach(line => {
    line.forEach(ch => {
      const el = document.createElement("div");
      el.className = "ghostChar";
      el.textContent = ch === " " ? "" : ch;
      ghost.appendChild(el);
    });
  });

  document.body.appendChild(ghost);
  return ghost;
}

function getSnap(x, y){
  const { tileW, tileH, gap, gridRect } = getTileMetrics();

  const stepX = tileW + gap;
  const stepY = tileH + gap;

  const col = Math.round((x - gridRect.left - tileW / 2) / stepX);
  const row = Math.round((y - gridRect.top - tileH / 2) / stepY);

  return {
    row,
    col,
    left: gridRect.left + col * stepX,
    top: gridRect.top + row * stepY
  };
}

function beginDrag(text, x, y){
  if(!text.trim()) return;

  const ghost = createGhost(text);
  const snap = getSnap(x, y);

  ghost.style.left = snap.left + "px";
  ghost.style.top = snap.top + "px";

  preview(snap.row, snap.col, text);

  drag = {
    text,
    ghost,
    snap
  };
}

function moveDrag(x, y){
  if(!drag) return;

  const snap = getSnap(x, y);
  drag.snap = snap;

  drag.ghost.style.left = snap.left + "px";
  drag.ghost.style.top = snap.top + "px";

  preview(snap.row, snap.col, drag.text);
}

function endDrag(){
  if(!drag) return;

  place(drag.snap.row, drag.snap.col, drag.text);

  drag.ghost.remove();
  drag = null;

  clearPreview();
}

let pressTimer = null;

dragHandle.addEventListener("pointerdown", event => {
  event.preventDefault();
  beginDrag(inputText.value || "Aa", event.clientX, event.clientY);
  dragHandle.setPointerCapture(event.pointerId);
});

dragHandle.addEventListener("pointermove", event => {
  moveDrag(event.clientX, event.clientY);
});

dragHandle.addEventListener("pointerup", endDrag);
dragHandle.addEventListener("pointercancel", endDrag);

inputText.addEventListener("pointerdown", event => {
  if(!inputText.value.trim()) return;

  pressTimer = setTimeout(() => {
    inputText.blur();
    beginDrag(inputText.value, event.clientX, event.clientY);
  }, 450);
});

inputText.addEventListener("pointermove", event => {
  if(drag){
    event.preventDefault();
    moveDrag(event.clientX, event.clientY);
  }
});

inputText.addEventListener("pointerup", () => {
  clearTimeout(pressTimer);
  endDrag();
});

document.querySelectorAll(".widget").forEach(widget => {
  widget.addEventListener("pointerdown", event => {
    event.preventDefault();

    const drawer = document.getElementById("widgetsDrawer");
    if(drawer) drawer.classList.remove("show");

    beginDrag(widget.dataset.text, event.clientX, event.clientY);
    widget.setPointerCapture(event.pointerId);
  });

  widget.addEventListener("pointermove", event => {
    moveDrag(event.clientX, event.clientY);
  });

  widget.addEventListener("pointerup", endDrag);
  widget.addEventListener("pointercancel", endDrag);

  widget.addEventListener("dblclick", () => {
    sendCommand({
      type: "widget",
      widget: widget.dataset.widget,
      value: widget.dataset.text
    });
  });
});

function startFlip(){
  stopFlip();

  safeText(statusText, "Sending");
  safeText(displayBadge, "Sending");
  safeClass(displayBadge, "badge yellow");

  flipTimer = setInterval(() => {
    flipIndex = (flipIndex + 1) % flipOrder.length;

    document.querySelectorAll(".tile span").forEach((span, i) => {
      span.textContent = flipOrder[(flipIndex + i) % flipOrder.length];
    });
  }, 120);
}

function stopFlip(){
  if(flipTimer){
    clearInterval(flipTimer);
    flipTimer = null;
  }
}

function getGridAsText(){
  return cells
    .map(row => row.map(ch => ch || " ").join(""))
    .join("\n");
}

function sendCurrentDisplay(){
  startFlip();

  const textFromInput = inputText.value.trim();
  const gridText = getGridAsText();

  const payload = {
    type: "display_text",
    value: textFromInput || gridText,
    grid: cells,
    rows: ROWS,
    cols: COLS,
    timestamp: Date.now()
  };

  const sent = sendToServer(payload);

  if(!sent){
    setTimeout(() => {
      stopFlip();
      renderGrid();
      safeText(statusText, "Offline");
      safeText(displayBadge, "Not sent");
      safeClass(displayBadge, "badge red");
    }, 700);
  }

  setTimeout(() => {
    if(flipTimer){
      stopFlip();
      renderGrid();

      if(socketConnected){
        safeText(statusText, "Live");
        safeText(displayBadge, "Sent");
        safeClass(displayBadge, "badge green");
      }
    }
  }, 1800);
}

function sendCommand(payload){
  const sent = sendToServer({
    ...payload,
    timestamp: Date.now()
  });

  if(sent){
    safeText(statusText, "Sending");
    safeText(displayBadge, payload.type);
    safeClass(displayBadge, "badge yellow");
  }else{
    safeText(statusText, "Offline");
    safeText(displayBadge, "Not sent");
    safeClass(displayBadge, "badge red");
  }
}

sendBtn.addEventListener("click", sendCurrentDisplay);

// ==========================
// CALIBRATION MODULES
// ==========================

document.querySelectorAll(".calBtn").forEach(button => {
  button.addEventListener("click", () => {
    const module = Number(button.dataset.module);
    const input = document.getElementById("calChar" + module);

    const char = (input?.value || "A")
      .trim()
      .toUpperCase()
      .slice(0, 1);

    console.log("Kalibriere Modul", module, "mit Zeichen", char);

    sendCommand({
      type: "calibrate",
      module,
      char: char || "A"
    });
  });
});

const stopBtn = document.getElementById("stopBtn");

if(stopBtn){
  stopBtn.addEventListener("click", () => {
    console.log("STOP gedrückt");

    sendCommand({
      type: "stop"
    });
  });
}

function showDrawer(id){
  document.querySelectorAll(".drawer").forEach(drawer => {
    drawer.classList.remove("show");
  });

  const drawer = document.getElementById(id);
  if(drawer) drawer.classList.add("show");
}

const widgetsBtn = document.getElementById("widgetsBtn");
const settingsBtn = document.getElementById("settingsBtn");

if(widgetsBtn){
  widgetsBtn.addEventListener("click", () => {
    showDrawer("widgetsDrawer");
  });
}

if(settingsBtn){
  settingsBtn.addEventListener("click", () => {
    showDrawer("settingsDrawer");
  });
}

document.querySelectorAll(".close").forEach(button => {
  button.addEventListener("click", () => {
    const drawer = document.getElementById(button.dataset.close);
    if(drawer) drawer.classList.remove("show");
  });
});

document.addEventListener("click", event => {
  const inside = event.target.closest(".drawer,.iconBtn,.ghost,.dragHandle,.inputText");

  if(!inside){
    document.querySelectorAll(".drawer").forEach(drawer => {
      drawer.classList.remove("show");
    });
  }
});

async function setChar(char) {
  const res = await fetch("/api/set?char=" + encodeURIComponent(char));
  const data = await res.json();
  console.log(data);
}

createGrid();
renderGrid();
connectWebSocket();