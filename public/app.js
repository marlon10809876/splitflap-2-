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
