<<<<<<< HEAD
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

  const protocol =
    location.protocol === "https:"
      ? "wss://"
      : "ws://";

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
        console.log("ESP Status:", data);

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

const calibrate0Btn = document.getElementById("calibrate0Btn");
const calibrate1Btn = document.getElementById("calibrate1Btn");
const stopBtn = document.getElementById("stopBtn");

if(calibrate0Btn){
  calibrate0Btn.addEventListener("click", () => {
    sendCommand({
      type: "calibrate",
      module: 0,
      char: "A"
    });
  });
}

if(calibrate1Btn){
  calibrate1Btn.addEventListener("click", () => {
    sendCommand({
      type: "calibrate",
      module: 1,
      char: "A"
    });
  });
}

if(stopBtn){
  stopBtn.addEventListener("click", () => {
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

createGrid();
renderGrid();
connectWebSocket();
=======
<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#05070a">
<title>Split-Flap Web-App</title>

<style>
:root{
  color-scheme:dark;
  --bg:#05070a;
  --text:#f2eee6;
  --muted:#8d98a6;
  --red:#ff4545;
  --green:#8dff9e;
  --yellow:#ffe18a;
}

*{
  box-sizing:border-box;
  -webkit-tap-highlight-color:transparent;
}

html,body{
  margin:0;
  padding:0;
  min-height:100%;
  background:#05070a;
}

body{
  min-height:100dvh;
  padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
  font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  color:var(--text);
  overflow:hidden;
  background:linear-gradient(180deg,#070a0f 0%,#05070a 45%,#020304 100%);
}

.header{
  position:fixed;
  top:env(safe-area-inset-top);
  left:0;
  right:0;
  z-index:50;
  min-height:76px;
  padding:16px 20px 10px;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
  background:linear-gradient(180deg,rgba(5,7,10,.94),rgba(5,7,10,.62),transparent);
  backdrop-filter:blur(14px);
}

.status{
  display:flex;
  align-items:center;
  gap:10px;
  font-size:22px;
  color:#bec7d2;
}

.statusDot{
  width:12px;
  height:12px;
  border-radius:999px;
  background:var(--red);
  box-shadow:0 0 18px rgba(255,69,69,.55);
}

.statusDot.connected{
  background:var(--green);
  box-shadow:0 0 18px rgba(141,255,158,.55);
}

.headerActions{
  display:flex;
  align-items:center;
  gap:12px;
}

.sendBtn{
  height:52px;
  padding:0 26px;
  border-radius:999px;
  border:1px solid rgba(255,255,255,.18);
  background:linear-gradient(180deg,#fffaf0,#ded8cf);
  color:#111;
  font-size:21px;
  font-weight:850;
  cursor:pointer;
}

.iconBtn{
  width:52px;
  height:52px;
  border-radius:999px;
  border:1px solid #263343;
  background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02));
  color:#d8dee7;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:25px;
  cursor:pointer;
}


.main{
  min-height:100dvh;
  padding:118px 18px 26px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:28px;
}

.displayFrame{
  width:min(1040px,96vw);
  border-radius:28px;
  padding:18px;
  background:linear-gradient(180deg,#0b0f15,#05070a);
  border:1px solid #17202b;
  box-shadow:0 24px 75px rgba(0,0,0,.70),inset 0 1px 0 rgba(255,255,255,.04);
}

.grid{
  display:grid;
  grid-template-columns:repeat(20,1fr);
  gap:8px;
}

.tile{
  position:relative;
  aspect-ratio:1.35 / 1;
  border-radius:7px;
  background:
    linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,0) 38%),
    linear-gradient(180deg,#171d25 0%,#0e131a 48%,#070a0f 100%);
  border:1px solid #263241;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  box-shadow:inset 0 1px 0 rgba(255,255,255,.07),inset 0 -15px 28px rgba(0,0,0,.55),0 3px 8px rgba(0,0,0,.35);
}

.tile::before{
  content:"";
  position:absolute;
  left:7%;
  right:7%;
  top:50%;
  height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);
  z-index:3;
}

.tile span{
  position:relative;
  z-index:5;
  font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
  font-size:clamp(8px,1.9vw,22px);
  color:var(--text);
  letter-spacing:.04em;
  text-shadow:0 1px 0 rgba(0,0,0,.8);
  pointer-events:none;
}

.tile.active{
  outline:2px solid rgba(255,225,138,.65);
  outline-offset:2px;
}

@keyframes flipText{
  0%{opacity:.25;transform:translateY(-4px) scaleY(.7)}
  50%{opacity:.95;transform:translateY(1px) scaleY(1.12)}
  100%{opacity:.22;transform:translateY(4px) scaleY(.75)}
}

.inputCard{
  width:min(900px,92vw);
  min-height:138px;
  border-radius:30px;
  padding:24px 30px;
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:20px;
  background:linear-gradient(180deg,#151b23,#0f141a);
  border:1px solid #24303d;
  box-shadow:0 18px 55px rgba(0,0,0,.50),inset 0 1px 0 rgba(255,255,255,.055);
  touch-action:none;
  user-select:none;
}

.inputArea{
  flex:1;
  min-width:0;
}

.inputText{
  width:100%;
  min-height:84px;
  border:0;
  outline:0;
  resize:none;
  overflow:hidden;
  background:transparent;
  color:#f5f0e9;
  font-size:28px;
  line-height:1.25;
  font-family:inherit;
}

.inputText::placeholder{
  color:#7f8996;
}

.dragHandle{
  flex:0 0 auto;
  width:66px;
  height:66px;
  border-radius:50%;
  border:1px solid #2c3948;
  background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.02));
  display:grid;
  place-items:center;
  margin-top:18px;
  cursor:grab;
}

.dots{
  display:grid;
  grid-template-columns:repeat(2,5px);
  gap:6px;
}

.dots i{
  width:5px;
  height:5px;
  border-radius:999px;
  background:#d4d9df;
  opacity:.82;
}

.drawer{
  position:fixed;
  right:16px;
  top:112px;
  width:min(370px,88vw);
  max-height:calc(100dvh - 130px);
  overflow:auto;
  border-radius:28px;
  background:rgba(13,18,25,.96);
  border:1px solid #263241;
  box-shadow:0 24px 80px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.05);
  backdrop-filter:blur(18px);
  padding:18px;
  display:none;
  z-index:100;
}

.drawer.show{
  display:block;
}

.drawerHeader{
  display:flex;
  align-items:center;
  justify-content:space-between;
  margin-bottom:16px;
}

.drawerTitle{
  font-size:20px;
  font-weight:800;
}

.close{
  width:38px;
  height:38px;
  border-radius:999px;
  border:1px solid #2c3948;
  background:rgba(255,255,255,.04);
  color:#fff;
  font-size:24px;
  cursor:pointer;
}

.widgetGrid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px;
}

.widget{
  padding:12px;
  border-radius:18px;
  background:linear-gradient(180deg,#171d25,#10151c);
  border:1px solid #263241;
  cursor:grab;
}

.mini{
  height:54px;
  border-radius:12px;
  background:#070a0f;
  border:1px solid #202a36;
  display:flex;
  align-items:center;
  justify-content:center;
  font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
  letter-spacing:.08em;
  font-size:18px;
}

.widget span{
  display:block;
  margin-top:9px;
  font-size:12px;
  color:#b7c0cc;
}

.settings{
  display:grid;
  gap:12px;
}

.settingGroup{
  padding:14px;
  border-radius:20px;
  background:rgba(255,255,255,.035);
  border:1px solid #263241;
}

.settingGroup h3{
  margin:0 0 10px;
  font-size:12px;
  color:#fff;
  text-transform:uppercase;
  letter-spacing:.12em;
}

.settingLine{
  display:flex;
  align-items:center;
  justify-content:space-between;
  color:#dce3ec;
  font-size:14px;
  padding:8px 0;
  border-bottom:1px solid rgba(255,255,255,.06);
}

.settingLine:last-child{
  border-bottom:none;
}

.badge{
  border-radius:999px;
  padding:6px 10px;
  font-size:12px;
  font-weight:800;
}

.badge.green{background:#203124;color:var(--green)}
.badge.yellow{background:#302b18;color:var(--yellow)}
.badge.red{background:#351f1f;color:var(--red)}

.ghost{
  position:fixed;
  z-index:500;
  pointer-events:none;
  display:grid;
  grid-template-columns:repeat(var(--cols),var(--tw));
  grid-auto-rows:var(--th);
  gap:8px;
  opacity:.82;
}

.ghostChar{
  display:flex;
  align-items:center;
  justify-content:center;
  font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;
  font-size:clamp(8px,1.9vw,22px);
  color:var(--text);
}

@media(max-width:700px){
  .header{padding:16px 16px 8px}
  .status{font-size:19px}
  .sendBtn{height:48px;padding:0 22px;font-size:19px}
  .iconBtn{width:48px;height:48px}
  .main{padding-top:112px;gap:24px}
  .displayFrame{padding:10px;border-radius:22px}
  .grid{gap:4px;grid-template-columns:repeat(20,1fr)}
  .tile{border-radius:4px}
  .tile span{font-size:9px}
  .inputCard{min-height:128px;padding:20px 24px;border-radius:26px}
  .inputText{font-size:24px}
  .dragHandle{width:58px;height:58px}
  .drawer{top:100px;right:12px;left:12px;width:auto}
}
</style>
</head>

<body>
<header class="header">
  <div class="status">
    <div class="statusDot" id="statusDot"></div>
    <span id="statusText">Offline</span>
  </div>

  <div class="headerActions">
    <button class="sendBtn" id="sendBtn">Send</button>
    <button class="iconBtn" id="settingsBtn">⚙</button>
    <button class="iconBtn" id="widgetsBtn">☰</button>
  </div>
</header>

<main class="main">
  <section class="displayFrame">
    <div class="grid" id="grid"></div>
  </section>

  <section class="inputCard" id="inputCard">
    <div class="inputArea">
      <textarea class="inputText" id="inputText" rows="2" placeholder="Aa"></textarea>
    </div>

    <div class="dragHandle" id="dragHandle">
      <div class="dots">
        <i></i><i></i><i></i><i></i><i></i><i></i>
      </div>
    </div>
  </section>
</main>

<section class="drawer" id="widgetsDrawer">
  <div class="drawerHeader">
    <div class="drawerTitle">Widgets</div>
    <button class="close" data-close="widgetsDrawer">×</button>
  </div>

  <div class="widgetGrid">
    <div class="widget" data-widget="clock" data-text="15:51"><div class="mini">15:51</div><span>Clock</span></div>
    <div class="widget" data-widget="seconds" data-text="07"><div class="mini">07</div><span>Seconds</span></div>
    <div class="widget" data-widget="date" data-text="MAY 08"><div class="mini">MAY 08</div><span>Date</span></div>
    <div class="widget" data-widget="weather" data-text="24°"><div class="mini">24°</div><span>Weather</span></div>
    <div class="widget" data-widget="followers" data-text="12.4K"><div class="mini">12.4K</div><span>Followers</span></div>
    <div class="widget" data-widget="todo" data-text="TODO"><div class="mini">TODO</div><span>To-Do</span></div>
  </div>
</section>

<section class="drawer" id="settingsDrawer">
  <div class="drawerHeader">
    <div class="drawerTitle">Settings</div>
    <button class="close" data-close="settingsDrawer">×</button>
  </div>

  <div class="settings">
    <div class="settingGroup">
  <h3>Calibration</h3>
  <button class="testBtn" id="calibrate0Btn">Calibrate Module 0</button>
  <button class="testBtn" id="calibrate1Btn">Calibrate Module 1</button>
  <button class="testBtn danger" id="stopBtn">Stop</button>
</div>
    <div class="settingGroup">
      <h3>WiFi</h3>
      <div class="settingLine"><span>Network</span><span>ESP später</span></div>
      <div class="settingLine"><span>Mode</span><span>WebSocket</span></div>
    </div>

    <div class="settingGroup">
      <h3>Calibration</h3>
      <div class="settingLine"><span>Zero point</span><span class="badge yellow">Later</span></div>
      <div class="settingLine"><span>Hall sensors</span><span>ESP-side</span></div>
    </div>
  </div>
</section>

<script src="app.js"></script>
</body>
</html>
>>>>>>> ac93ea1b6951c31fc2fc2b3f80e69d611932cb26
