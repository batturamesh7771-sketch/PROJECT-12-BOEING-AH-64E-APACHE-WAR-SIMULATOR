# ui_components.py: Clean, modular UI structure with zero overlaps and beautifully formatted buttons

def get_html_head():
    return '''<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Boeing AH-64E Apache Guardian — Cloud 3D CAD Studio & Gunship Battle Simulator</title>
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/3d-tiles-renderer@0.3.26/build/index.umd.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #0b0f17;
      color: #e2e8f0;
      overflow: hidden;
      user-select: none;
      touch-action: none;
    }
    .mono { font-family: 'JetBrains Mono', monospace; }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #0c131d; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
    input[type="range"] { accent-color: #f59e0b; }
    .panel-smooth { transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1); }
    .glass-panel {
      background: rgba(11, 18, 29, 0.90);
      backdrop-filter: blur(14px);
      border: 1px solid rgba(16, 185, 129, 0.30);
      border-radius: 14px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.55);
    }
    .glass-card {
      background: rgba(15, 23, 38, 0.88);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(56, 189, 248, 0.25);
      border-radius: 10px;
    }
    .btn-tactile {
      transition: transform 0.12s ease, box-shadow 0.12s ease, background-color 0.15s ease;
      user-select: none;
      cursor: pointer;
    }
    .btn-tactile:active { transform: scale(0.94); }
    @keyframes rwrPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      50% { box-shadow: 0 0 18px 4px rgba(239, 68, 68, 0.95); }
    }
    .rwr-alert-glow { animation: rwrPulse 0.7s infinite; }
    @keyframes superSmashPulse {
      0%, 100% { box-shadow: 0 0 8px 1px rgba(168, 85, 247, 0.6); }
      50% { box-shadow: 0 0 24px 6px rgba(234, 179, 8, 0.9); }
    }
    .super-smash-glow { animation: superSmashPulse 1.2s infinite; }
    .radar-sweep-line {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 50%;
      height: 2px;
      background: linear-gradient(90deg, rgba(16, 185, 129, 0.1), #10b981);
      transform-origin: 0% 0%;
    }
    .armor-seg {
      height: 8px;
      width: 22px;
      border-radius: 2px;
      background: #10b981;
      box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
      transition: background 0.2s ease;
    }
    .armor-seg.damaged {
      background: #334155;
      box-shadow: none;
    }
  </style>
</head>
<body class="h-screen w-screen flex flex-col bg-[#0b0f17] text-slate-200 overflow-hidden">
'''

def get_top_header():
    return '''
  <!-- TOP UNIFIED COMMAND HEADER (Zero Overlap, Clean 48px Bar) -->
  <header id="topCommandHeader" class="panel-smooth h-12 bg-[#09111c] border-b border-emerald-500/30 px-3 flex items-center justify-between shrink-0 z-40 gap-2">
    <!-- Left: App Brand & Master Part Badge -->
    <div class="flex items-center gap-2.5 min-w-0">
      <div class="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/40 text-amber-400 px-2.5 py-1 rounded-lg text-xs font-bold tracking-wide shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"/></svg>
        <span>GUNSHIP 3D</span>
      </div>
      <div class="truncate hidden md:block">
        <h1 class="text-xs font-bold text-white leading-tight flex items-center gap-2 truncate">
          <span>Boeing AH-64E Apache Guardian</span>
          <span id="totalPartsBadge" class="text-[10px] font-semibold mono bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">1,480+ CAD Parts</span>
        </h1>
      </div>
    </div>

    <!-- Center: Main Mode Switcher Tabs (Combat Warfare / 3D CAD Studio / Upgrade Hangar) -->
    <div class="flex items-center gap-1 bg-[#0c1624] p-1 rounded-xl border border-slate-800 shadow-inner">
      <button id="btnModeCombat" class="btn-tactile px-3 py-1 text-xs font-bold rounded-lg bg-emerald-500 text-slate-950 shadow transition flex items-center gap-1.5">
        <span>⚔ WAR COMBAT</span>
      </button>
      <button id="btnModeCad" class="btn-tactile px-3 py-1 text-xs font-bold rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center gap-1.5">
        <span>⚙ CAD STUDIO</span>
      </button>
      <button id="btnModeHangar" class="btn-tactile px-3 py-1 text-xs font-bold rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition flex items-center gap-1.5">
        <span>🛠 UPGRADE HANGAR</span>
      </button>
    </div>

    <!-- Right: Autonomous AI Controls & Viewport Tools -->
    <div class="flex items-center gap-1.5">
      <!-- AI Autonomous Copilot Toggle -->
      <button id="btnToggleAthenaAi" class="btn-tactile px-2.5 py-1 text-xs font-bold rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 hover:bg-cyan-500/30 transition flex items-center gap-1" title="Toggle Athena Autonomous AI Copilot">
        <span>🤖 ATHENA AI:</span>
        <span id="athenaAiStatusLabel" class="text-white">ON</span>
      </button>

      <!-- 1-Shot Super Smash Quick Toggle -->
      <button id="btnToggleOneShot" class="btn-tactile px-2.5 py-1 text-xs font-bold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/50 hover:bg-purple-500/30 transition flex items-center gap-1 super-smash-glow" title="Toggle 1-Shot Smash Overpower">
        <span>💥 1-SHOT:</span>
        <span id="oneShotStatusLabel" class="text-amber-300">ACTIVE</span>
      </button>

      <!-- Tactical Voice Synthesizer Toggle -->
      <button id="btnToggleVoice" class="btn-tactile px-2 py-1 text-xs font-semibold rounded-lg bg-slate-800 text-emerald-300 border border-emerald-500/30 hover:bg-slate-700 transition" title="Toggle Tactical Voice Copilot">
        <span id="voiceStatusLabel">🔊 VOICE: ON</span>
      </button>

      <!-- Theater Selector Dropdown -->
      <select id="theaterSelectDropdown" class="bg-[#0f172a] border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 font-semibold outline-none cursor-pointer hidden lg:block">
        <option value="MARITIME_ISLAND" selected>Archipelago Naval War (Island &amp; Warships)</option>
        <option value="KASHMIR_VALLEY">Kashmir Valley (Mountain Fortress)</option>
      </select>

      <!-- Camera Presets Dropdown for CAD -->
      <div id="cadCameraPresetsBar" class="hidden items-center gap-1 bg-[#0f141c] p-0.5 rounded-lg border border-slate-800 text-[10px]">
        <button id="camIsoBtn" class="px-2 py-1 rounded bg-amber-500 text-slate-950 font-bold">Iso</button>
        <button id="camCockpitBtn" class="px-2 py-1 rounded text-slate-300 hover:bg-slate-800">Cockpit</button>
        <button id="camTopBtn" class="px-2 py-1 rounded text-slate-300 hover:bg-slate-800">Top</button>
        <button id="camSideBtn" class="px-2 py-1 rounded text-slate-300 hover:bg-slate-800">Right</button>
      </div>

      <!-- Fullscreen Button -->
      <button id="btnFullscreenToggle" class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition" title="Toggle Fullscreen">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>
      </button>
    </div>
  </header>
'''

def get_combat_hud_overlay():
    return '''
  <!-- ========================================================================= -->
  <!-- COMBAT WARFARE HUD OVERLAY (Gunship Battle Style: Clean, Tactile, No Overlap) -->
  <!-- ========================================================================= -->
  <div id="combatHudOverlay" class="panel-smooth absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 select-none">
    
    <!-- TOP ROW: Radar (Left), Mission Banner (Center), Target Lock Card (Right) -->
    <div class="flex items-start justify-between gap-3 w-full">
      
      <!-- Top-Left: Circular Radar & Flight Telemetry -->
      <div class="pointer-events-auto flex flex-col gap-1.5">
        <!-- 140x140px Tactical Circular Sweep Radar -->
        <div class="relative w-36 h-36 rounded-full glass-panel border border-emerald-500/50 overflow-hidden flex items-center justify-center shadow-2xl">
          <canvas id="tacticalRadarMapCanvas" width="144" height="144" class="w-full h-full block"></canvas>
          <div class="absolute inset-0 pointer-events-none border border-emerald-500/30 rounded-full"></div>
          <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div class="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]"></div>
          </div>
          <!-- Radar Sweep Beam -->
          <div id="radarSweepBeam" class="radar-sweep-line"></div>
        </div>

        <!-- Telemetry Numbers Pill -->
        <div class="glass-card px-2.5 py-1.5 text-[10px] mono text-emerald-300 flex items-center justify-between w-36">
          <div><span class="text-slate-400 text-[8px]">SPD:</span> <span id="hudKnotsReadout" class="font-bold text-white">0 KTS</span></div>
          <div><span class="text-slate-400 text-[8px]">ALT:</span> <span id="hudAltReadout" class="font-bold text-cyan-300">0 FT</span></div>
        </div>
      </div>

      <!-- Top-Center: Mission Objective, Timer & Wallet (From Screenshot 4) -->
      <div class="pointer-events-auto flex flex-col items-center gap-1">
        <!-- Main Mission Objective Card -->
        <div class="glass-panel px-4 py-2 flex items-center gap-3.5 border-emerald-500/40 text-center shadow-2xl">
          <!-- Countdown Timer -->
          <div class="flex items-center gap-1.5 bg-[#091824] px-2.5 py-1 rounded-lg border border-slate-800 text-amber-300 font-bold mono text-sm">
            <svg class="w-4 h-4 text-amber-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <span id="missionTimerReadout">03:00</span>
          </div>

          <!-- Mission Objective Text -->
          <div class="flex flex-col text-left">
            <span class="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">CURRENT MISSION OBJECTIVE</span>
            <span id="missionObjectiveReadout" class="text-xs md:text-sm font-extrabold text-white tracking-wide">
              DESTROY WARSHIPS &amp; BOTS: <span class="text-rose-400">0/8</span>
            </span>
          </div>

          <!-- Economy Wallet: Gold & Diamonds -->
          <div class="flex items-center gap-2 bg-[#091824] px-2.5 py-1 rounded-lg border border-slate-800 text-xs font-bold mono">
            <span class="text-amber-400 flex items-center gap-1">
              <span>💰</span><span id="walletCoinsReadout">1,609</span>
            </span>
            <span class="text-cyan-400 flex items-center gap-1">
              <span>💎</span><span id="walletGemsReadout">45</span>
            </span>
          </div>
        </div>

        <!-- Kill / Event Notification Banner -->
        <div id="combatKillFeed" class="text-[10px] font-bold text-amber-300 bg-black/60 px-3 py-0.5 rounded-full border border-amber-500/30">
          MISSION READY — Use Touch / WASD to fly &amp; engage hostile warships!
        </div>
      </div>

      <!-- Top-Right: Target Lock Info & Autopilot Selector -->
      <div class="pointer-events-auto flex flex-col items-end gap-1.5 w-60">
        <!-- Target Lock Card -->
        <div class="glass-panel p-2.5 w-full text-xs mono">
          <div class="flex justify-between items-center text-[10px] text-slate-400 mb-1">
            <span>TADS TARGET LOCK:</span>
            <span id="rwrStatusBadge" class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">RWR: CLEAR</span>
          </div>
          <div class="flex items-center justify-between">
            <span id="lockedTargetLabel" class="font-bold text-white text-xs truncate">TGT-01 WARSHIP DESTROYER</span>
            <span id="lockedTargetDist" class="text-rose-400 font-bold text-xs">1.2 KM</span>
          </div>
          <!-- Target Health Bar -->
          <div class="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <div id="lockedTargetHpBar" class="h-full bg-rose-500 transition-all duration-200" style="width: 100%;"></div>
          </div>
        </div>

        <!-- Autopilot Modes Pill Selector -->
        <div class="glass-card p-1 w-full flex items-center justify-between gap-1 text-[9px] font-bold mono">
          <button id="apManualBtn" class="flex-1 py-1 rounded bg-emerald-500 text-slate-950 text-center">MANUAL</button>
          <button id="apHoverBtn" class="flex-1 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-center">HOVER</button>
          <button id="apOrbitBtn" class="flex-1 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-center">ORBIT</button>
          <button id="apEngageBtn" class="flex-1 py-1 rounded bg-slate-800 text-cyan-300 hover:text-white text-center">ENGAGE</button>
          <button id="apRtbBtn" class="flex-1 py-1 rounded bg-slate-800 text-amber-300 hover:text-white text-center">RTB</button>
        </div>
      </div>

    </div>

    <!-- CENTER 3D VIEWPORT: Floating Segmented Armor Bar (From Screenshot 4) -->
    <div class="self-center flex flex-col items-center gap-1 pointer-events-none mt-auto mb-20">
      <div id="floatingArmorBar" class="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-md border border-emerald-500/30">
        <div class="armor-seg" id="armorSeg1"></div>
        <div class="armor-seg" id="armorSeg2"></div>
        <div class="armor-seg" id="armorSeg3"></div>
        <div class="armor-seg" id="armorSeg4"></div>
        <div class="armor-seg" id="armorSeg5"></div>
        <div class="armor-seg" id="armorSeg6"></div>
      </div>
      <span class="text-[9px] font-bold mono text-emerald-400 drop-shadow">HULL ARMOR INTEGRITY</span>
    </div>

    <!-- BOTTOM ROW: Virtual Remote Controls (Left) & Combat Action Deck (Right) -->
    <div class="flex items-end justify-between w-full pointer-events-none">
      
      <!-- Bottom-Left: Virtual Analog Thumbstick & Throttle Controls -->
      <div class="pointer-events-auto flex items-end gap-3">
        <!-- 360° Omnidirectional Virtual Cyclic Stick (Pitch/Roll) -->
        <div class="flex flex-col items-center">
          <div id="virtualStickPad" class="relative w-32 h-32 md:w-36 md:h-36 rounded-full glass-panel border border-cyan-500/50 flex items-center justify-center shadow-2xl cursor-grab active:cursor-grabbing">
            <!-- Center Axes Guidelines -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-full h-[1px] bg-cyan-500/20"></div>
            </div>
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="h-full w-[1px] bg-cyan-500/20"></div>
            </div>
            <div class="w-20 h-20 rounded-full border border-cyan-500/25 pointer-events-none"></div>
            <!-- Draggable Stick Knob -->
            <div id="virtualStickKnob" class="absolute w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border-2 border-white shadow-[0_0_15px_rgba(6,182,212,0.8)] flex items-center justify-center pointer-events-none transition-transform duration-75">
              <div class="w-3 h-3 rounded-full bg-white"></div>
            </div>
          </div>
          <span class="text-[9px] font-bold mono text-cyan-300 mt-1">CYCLIC STICK [W/A/S/D]</span>
        </div>

        <!-- Vertical Collective Throttle & Pedals -->
        <div class="glass-panel p-2 flex flex-col gap-1.5 w-32 text-xs mono">
          <div class="flex justify-between items-center text-[10px]">
            <span class="text-slate-400">COLLECTIVE:</span>
            <span id="simCollectiveLabel" class="text-emerald-400 font-bold">35%</span>
          </div>
          <input id="simCollectiveInput" type="range" min="0" max="100" value="35" class="h-2 bg-slate-800 rounded cursor-pointer accent-emerald-400 w-full" />
          <div class="flex items-center gap-1">
            <button id="btnQuickLiftoff" class="flex-1 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[9px] transition" title="Auto-Spool &amp; Lift Off [Z]">LIFTOFF [Z]</button>
            <button id="btnQuickHover" class="flex-1 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[9px] hover:bg-emerald-500/30 transition" title="Hold Hover (43%) [H]">HOVER [H]</button>
          </div>
          <!-- Yaw Pedals Q / E -->
          <div class="flex items-center gap-1 pt-0.5">
            <button id="btnPedalLeft" class="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[9px]">◀ YAW [Q]</button>
            <button id="btnPedalRight" class="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[9px]">YAW [E] ▶</button>
          </div>
        </div>
      </div>

      <!-- Bottom-Right: Tactile Combat Action Deck (From Screenshot 4) -->
      <div class="pointer-events-auto flex items-end gap-2">
        <!-- Secondary Actions Cluster (Flares, Target Lock, FOB Repair) -->
        <div class="flex flex-col gap-1.5">
          <button id="lockNextTargetBtn" class="btn-tactile px-3 py-2 rounded-xl glass-card border border-emerald-500/40 text-emerald-300 font-bold text-[10px] mono flex items-center justify-between gap-2 shadow" title="Cycle Next Target [T]">
            <span>🎯 LOCK [T]</span>
          </button>
          <button id="deployFlaresBtn" class="btn-tactile px-3 py-2 rounded-xl glass-card border border-orange-500/50 text-orange-300 font-bold text-[10px] mono flex items-center justify-between gap-2 shadow" title="Deploy Decoy Flares [C]">
            <span>✨ FLARES [C]</span>
            <span id="flareCountLabel" class="text-white text-[9px]">60</span>
          </button>
          <button id="rearmRepairBtn" class="btn-tactile px-3 py-2 rounded-xl glass-card border border-teal-500/40 text-teal-300 font-bold text-[10px] mono flex items-center justify-between gap-2 shadow" title="FOB Rearm &amp; Repair [R]">
            <span>🔧 REPAIR [R]</span>
          </button>
        </div>

        <!-- Primary Weapon Buttons (Hydra Rockets, Hellfire Missiles, 1-Shot Super Smash, 30mm Chain Gun) -->
        <div class="flex items-center gap-2">
          <!-- 1-SHOT SUPER SMASH BUTTON (The User's Feature: One trigger pull smashes all bots!) -->
          <button id="fireSuperSmashBtn" class="btn-tactile px-3.5 py-3 rounded-2xl bg-gradient-to-br from-purple-600 via-amber-600 to-rose-600 border-2 border-amber-300 text-white font-extrabold text-xs mono flex flex-col items-center gap-0.5 shadow-2xl super-smash-glow" title="One-Fire Obliterates All Hostile Bots &amp; Warships!">
            <span class="text-base">💥</span>
            <span>1-SHOT SMASH</span>
            <span class="text-[8px] bg-black/60 px-1.5 py-0.2 rounded text-amber-300">WIPE ALL BOTS</span>
          </button>

          <!-- Hydra 70 Rockets Button [F] -->
          <button id="fireHydraBtn" class="btn-tactile w-20 h-20 rounded-2xl glass-panel border border-sky-500/60 text-sky-300 font-extrabold text-[11px] mono flex flex-col items-center justify-center gap-0.5 shadow-xl hover:bg-sky-500/20 active:scale-95" title="Fire Hydra 70 Rocket Salvo [F]">
            <span class="text-lg">🚀</span>
            <span>HYDRA [F]</span>
            <span id="ammoHydraCount" class="text-[9px] text-white">38 PODS</span>
          </button>

          <!-- AGM-114 Hellfire Missiles Button [G] -->
          <button id="fireHellfireBtn" class="btn-tactile w-20 h-20 rounded-2xl glass-panel border border-rose-500/60 text-rose-300 font-extrabold text-[11px] mono flex flex-col items-center justify-center gap-0.5 shadow-xl hover:bg-rose-500/20 active:scale-95" title="Launch Top-Attack AGM-114 Hellfire [G]">
            <span class="text-lg">⚡</span>
            <span>HELLFIRE [G]</span>
            <span id="ammoHellfireCount" class="text-[9px] text-white">8 MSL</span>
          </button>

          <!-- 30mm M230 Chain Gun (Large Primary Button, hold down for continuous stream) [SPACE] -->
          <button id="fireChainGunBtn" class="btn-tactile w-24 h-24 rounded-2xl bg-amber-500/25 hover:bg-amber-500/40 border-2 border-amber-400 text-amber-300 font-extrabold text-xs mono flex flex-col items-center justify-center gap-0.5 shadow-2xl active:scale-95" title="Hold to Fire 30mm Vulcan Gatling [SPACE]">
            <span class="text-2xl animate-pulse">🔴</span>
            <span class="text-white text-sm">FIRE 30MM</span>
            <span id="ammo30mmCount" class="text-[10px] text-amber-200">1,200 RDS</span>
            <span class="text-[8px] text-slate-300">[HOLD SPACE]</span>
          </button>
        </div>
      </div>

    </div>

  </div>
'''

def get_hangar_upgrade_overlay():
    return '''
  <!-- ========================================================================= -->
  <!-- UPGRADE HANGAR & SHOWROOM OVERLAY (From Screenshot 5) -->
  <!-- ========================================================================= -->
  <div id="hangarUpgradeOverlay" class="panel-smooth hidden absolute inset-0 bg-[#070d16]/95 backdrop-blur-md z-30 flex flex-col justify-between p-4 select-none">
    
    <!-- Top Header: Back to Combat, Title, Wallet Balance -->
    <div class="flex items-center justify-between border-b border-slate-800 pb-3">
      <div class="flex items-center gap-3">
        <button id="btnHangarBackToCombat" class="btn-tactile px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5">
          <span>◀ BACK</span>
        </button>
        <h2 class="text-lg font-black tracking-wider text-white">MILITARY UPGRADE HANGAR</h2>
      </div>

      <!-- Currency Wallet -->
      <div class="flex items-center gap-3">
        <div class="flex items-center gap-1.5 bg-[#0e1726] border border-amber-500/40 px-3 py-1.5 rounded-xl text-amber-400 font-bold text-sm">
          <span>💰 COINS:</span>
          <span id="hangarGoldCoinsReadout">1,609</span>
        </div>
        <div class="flex items-center gap-1.5 bg-[#0e1726] border border-cyan-500/40 px-3 py-1.5 rounded-xl text-cyan-400 font-bold text-sm">
          <span>💎 GEMS:</span>
          <span id="hangarDiamondsReadout">45</span>
        </div>
      </div>
    </div>

    <!-- Center Section: Left Specs & Upgrade Cards, Right Helicopter Model Turntable -->
    <div class="flex-1 flex flex-col md:flex-row items-center justify-between gap-6 py-4">
      
      <!-- Left: Helicopter Specs & Upgrade Cards (From Screenshot 5) -->
      <div class="w-full md:w-96 glass-panel p-4 flex flex-col gap-3.5">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2">
          <div>
            <span class="text-xs text-slate-400 font-semibold">SELECTED GUNSHIP:</span>
            <h3 id="hangarChopperName" class="text-base font-extrabold text-white">Boeing AH-64E Apache Guardian</h3>
          </div>
          <button id="btnSwitchChopper" class="btn-tactile px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30">
            SWITCH
          </button>
        </div>

        <!-- Upgrade Stat 1: HP (Armor) -->
        <div class="flex items-center justify-between gap-3 bg-[#0a121e] p-2.5 rounded-xl border border-slate-800">
          <div class="flex-1">
            <div class="flex justify-between text-xs font-bold mb-1">
              <span class="text-slate-300">HP (Armor)</span>
              <span id="hangarHpVal" class="text-emerald-400">3000 / 5000</span>
            </div>
            <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div id="hangarHpBar" class="h-full bg-emerald-400 transition-all duration-300" style="width: 60%;"></div>
            </div>
          </div>
          <button id="btnUpgradeHp" class="btn-tactile px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shrink-0 shadow">
            + 200 💰
          </button>
        </div>

        <!-- Upgrade Stat 2: Speed -->
        <div class="flex items-center justify-between gap-3 bg-[#0a121e] p-2.5 rounded-xl border border-slate-800">
          <div class="flex-1">
            <div class="flex justify-between text-xs font-bold mb-1">
              <span class="text-slate-300">Speed (Turboshaft)</span>
              <span id="hangarSpeedVal" class="text-amber-400">200 / 350 KTS</span>
            </div>
            <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div id="hangarSpeedBar" class="h-full bg-amber-400 transition-all duration-300" style="width: 57%;"></div>
            </div>
          </div>
          <button id="btnUpgradeSpeed" class="btn-tactile px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shrink-0 shadow">
            + 180 💰
          </button>
        </div>

        <!-- Upgrade Stat 3: Agility -->
        <div class="flex items-center justify-between gap-3 bg-[#0a121e] p-2.5 rounded-xl border border-slate-800">
          <div class="flex-1">
            <div class="flex justify-between text-xs font-bold mb-1">
              <span class="text-slate-300">Agility (Roll / Pitch)</span>
              <span id="hangarAgilityVal" class="text-cyan-400">40 / 80</span>
            </div>
            <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div id="hangarAgilityBar" class="h-full bg-cyan-400 transition-all duration-300" style="width: 50%;"></div>
            </div>
          </div>
          <button id="btnUpgradeAgility" class="btn-tactile px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shrink-0 shadow">
            + 150 💰
          </button>
        </div>

        <!-- Upgrade Stat 4: Auto-Aim -->
        <div class="flex items-center justify-between gap-3 bg-[#0a121e] p-2.5 rounded-xl border border-slate-800">
          <div class="flex-1">
            <div class="flex justify-between text-xs font-bold mb-1">
              <span class="text-slate-300">Auto Aim (Lock Range)</span>
              <span id="hangarAutoAimVal" class="text-purple-400">500 / 1000 M</span>
            </div>
            <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div id="hangarAutoAimBar" class="h-full bg-purple-400 transition-all duration-300" style="width: 50%;"></div>
            </div>
          </div>
          <button id="btnUpgradeAutoAim" class="btn-tactile px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shrink-0 shadow">
            + 250 💰
          </button>
        </div>
      </div>

      <!-- Center-Right: 3D Turntable Inspection Guide -->
      <div class="flex-1 flex flex-col items-center justify-center text-center">
        <div class="text-sm font-bold text-slate-400 mb-2">3D HANGAR TURNTABLE ACTIVE</div>
        <p class="text-xs text-slate-500 max-w-sm">Drag with mouse or finger to rotate and inspect the 1,480-part Apache model. All upgrades directly enhance flight physics and weapon firepower!</p>
      </div>

    </div>

    <!-- Bottom Footer: Weapon Loadout Slots & Big Golden START MISSION Button -->
    <div class="flex items-center justify-between border-t border-slate-800 pt-3">
      <!-- Weapon Slots -->
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-400 font-bold">WEAPONS LOADOUT:</span>
        <div class="glass-card px-3 py-1.5 text-xs font-bold text-amber-300 border border-amber-500/40">
          30mm M230 (1,200)
        </div>
        <div class="glass-card px-3 py-1.5 text-xs font-bold text-sky-300 border border-sky-500/40">
          Hydra 70 (38)
        </div>
        <div class="glass-card px-3 py-1.5 text-xs font-bold text-rose-300 border border-rose-500/40">
          AGM-114 Hellfire (8)
        </div>
        <div class="glass-card px-3 py-1.5 text-xs font-bold text-purple-300 border border-purple-500/40 super-smash-glow">
          💥 1-Shot Smash (Ready)
        </div>
      </div>

      <!-- Golden START MISSION Button -->
      <button id="btnHangarStartMission" class="btn-tactile px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm tracking-wider shadow-2xl hover:brightness-110">
        START MISSION ▶
      </button>
    </div>

  </div>
'''

def get_cad_mode_components():
    return '''
  <!-- CAD Studio Bottom Toolbar (Visible only in CAD Studio Mode) -->
  <div id="cadBottomToolbar" class="panel-smooth hidden absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#0c131d]/90 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-4 z-20 shadow-2xl text-xs mono">
    <div class="flex items-center gap-2">
      <span class="text-slate-400">Explode:</span>
      <input id="explodeSlider" type="range" min="0" max="100" value="0" class="w-24 accent-amber-500" />
      <span id="explodeValLabel" class="text-amber-400 font-semibold w-8">0%</span>
      <button id="autoAssembleBtn" class="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300">Animate</button>
    </div>
    <div class="w-[1px] h-5 bg-slate-800"></div>
    <div class="flex items-center gap-2">
      <span class="text-slate-400">Rotor RPM:</span>
      <input id="rpmSlider" type="range" min="0" max="350" value="289" class="w-20 accent-emerald-500" />
      <button id="toggleRotorSpinBtn" class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">SPIN</button>
    </div>
    <div class="w-[1px] h-5 bg-slate-800"></div>
    <!-- Shaders -->
    <div class="flex items-center gap-1">
      <button id="modeShadedEdgesBtn" class="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-bold">PBR</button>
      <button id="modeTacticalBtn" class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700">Tactical</button>
      <button id="modeWireframeBtn" class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700">Wire</button>
      <button id="modeXrayBtn" class="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700">X-Ray</button>
    </div>
    <div class="w-[1px] h-5 bg-slate-800"></div>
    <button id="exportObjBtn" class="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold">Export .OBJ</button>
  </div>
'''
