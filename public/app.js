const ROWS = 1;
const COLS = 4;

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

cells[0][0] = "A";
cells[0][1] = "A";
cells[0][2] = "";
cells[0][3] = "";

function safeChar(ch){
  if(!ch || ch === " ") return "_";
  return ch.toUpperCase().slice(0, 1);
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

async function checkConnection(){
  try {
    const res = await fetch("/api/status");
    if(!res.ok) throw new Error("Server nicht erreichbar");

    const data = await res.json();
    setConnectionState(!!data.ok);
  } catch(error) {
    setConnectionState(false);
  }
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

  return { tileW: rect.width, tileH: rect.height, gap, gridRect };
}

function textToLines(text){
  const clean = text.toUpperCase().replace(/\s/g, "");
  return [clean.slice(0, 4).split("")];
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

  drag = { text, ghost, snap };
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
  beginDrag(inputText.value || "AAAA", event.clientX, event.clientY);
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

  widget.addEventListener("dblclick", async () => {
    if(widget.dataset.widget === "clock"){
      try {
        const res = await fetch("/api/clock");
        const data = await res.json();
        console.log("Clock Mode:", data);

        safeText(statusText, "Live");
        safeText(displayBadge, "Clock mode");
        safeClass(displayBadge, "badge green");
      } catch(error){
        safeText(statusText, "Error");
        safeText(displayBadge, "Clock error");
        safeClass(displayBadge, "badge red");
      }
    }else{
      inputText.value = widget.dataset.text || "";
    }
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

function getGridText4(){
  return [
    safeChar(cells[0][0]),
    safeChar(cells[0][1]),
    safeChar(cells[0][2]),
    safeChar(cells[0][3])
  ].join("");
}

async function sendCurrentDisplay(){
  startFlip();

  const text = getGridText4();

  try {
    const res = await fetch("/api/grid?text=" + encodeURIComponent(text));
    const data = await res.json();

    console.log("Grid an ESP gesendet:", data);

    stopFlip();
    renderGrid();

    safeText(statusText, "Live");
    safeText(displayBadge, "Sent " + text.replaceAll("_", " "));
    safeClass(displayBadge, "badge green");
  } catch(error) {
    console.error("Sendefehler:", error);

    stopFlip();
    renderGrid();

    safeText(statusText, "Error");
    safeText(displayBadge, "Not sent");
    safeClass(displayBadge, "badge red");
  }
}

sendBtn.addEventListener("click", sendCurrentDisplay);

document.querySelectorAll(".calPeakBtn").forEach(button => {
  button.addEventListener("click", async () => {
    const module = Number(button.dataset.module);

    safeText(statusText, "Calibrating");
    safeText(displayBadge, "Peak M" + module);
    safeClass(displayBadge, "badge yellow");

    try {
      const res = await fetch("/api/calibrate?module=" + encodeURIComponent(module));
      const data = await res.json();

      console.log("Peak-Kalibrierung gestartet:", data);

      safeText(statusText, "Live");
      safeText(displayBadge, "Peak M" + module);
      safeClass(displayBadge, "badge yellow");
    } catch(error) {
      console.error("Peak-Kalibrierungsfehler:", error);

      safeText(statusText, "Error");
      safeText(displayBadge, "Cal error");
      safeClass(displayBadge, "badge red");
    }
  });
});

document.querySelectorAll(".calSaveBtn").forEach(button => {
  button.addEventListener("click", async () => {
    const module = Number(button.dataset.module);
    const input = document.getElementById("calChar" + module);

    const char = (input?.value || "_").trim().toUpperCase().slice(0, 1) || "_";

    safeText(statusText, "Saving");
    safeText(displayBadge, "Save M" + module);
    safeClass(displayBadge, "badge yellow");

    try {
      const res = await fetch("/api/magnet?module=" + encodeURIComponent(module) + "&char=" + encodeURIComponent(char));
      const data = await res.json();

      console.log("Magnet-Zeichen gespeichert:", data);

      safeText(statusText, "Live");
      safeText(displayBadge, "Saved M" + module);
      safeClass(displayBadge, "badge green");
    } catch(error) {
      console.error("Magnet-Speicherfehler:", error);

      safeText(statusText, "Error");
      safeText(displayBadge, "Save error");
      safeClass(displayBadge, "badge red");
    }
  });
});

const stopBtn = document.getElementById("stopBtn");

if(stopBtn){
  stopBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/manual");
      const data = await res.json();
      console.log("Manual Mode:", data);

      safeText(displayBadge, "Manual");
      safeClass(displayBadge, "badge yellow");
    }catch(error){
      console.error(error);
    }
  });
}

function updateClockWidgetPreview(){
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const text = hh + mm;

  document.querySelectorAll('[data-widget="clock"]').forEach(widget => {
    widget.dataset.text = text;
    const mini = widget.querySelector(".mini");
    if(mini) mini.textContent = text;
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
    updateClockWidgetPreview();
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
checkConnection();
updateClockWidgetPreview();

setInterval(checkConnection, 5000);
setInterval(updateClockWidgetPreview, 1000);