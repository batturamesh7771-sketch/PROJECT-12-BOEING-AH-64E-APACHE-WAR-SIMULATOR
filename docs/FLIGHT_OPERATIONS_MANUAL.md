# Project 12: Flight Operations & Tactical Combat Manual

**Author:** Mr ELONIKHIL (`mr elonikhil`)  
**Aircraft Designation:** AH-64E Apache Guardian (AH-733 Anti-Gravity Variant)  
**Theater:** Kashmir Border Defense Operational Zone (LOC)  

---

## 1. Primary Pilot Flight Controls

| Control Function | Keyboard / Mouse Input | Description |
| :--- | :--- | :--- |
| **Cyclic Pitch (Forward / Aft)** | `W` / `S` or Mouse Drag Stick | Tilts vehicle nose down (accelerate) / up (flare/climb) |
| **Cyclic Roll (Bank Left / Right)**| `A` / `D` or Mouse Drag Stick | Banks airframe left and right |
| **Anti-Torque Rudder (Yaw)** | `Q` / `E` | Rotates tail rotor heading left / right |
| **Collective Throttle** | `Shift` (Climb) / `Ctrl` (Descend) | Modulates vertical repulsor thrust output |
| **Quick Auto-Liftoff** | `[Z]` | Auto-spools turbines to 100% and climbs to 15m hover |
| **SAS Auto-Hover Hold** | `[H]` | Engages 3D PID spatial and altitude lock |
| **Mouse Aim Steering** | `[L]` | Toggles direct mouse cursor flight steering |
| **Respawn at FOB Uri** | `Respawn FOB` Button | Instantly re-anchors aircraft at helipad coordinates |

---

## 2. Weaponry & Defensive Countermeasures

| Weapon System | Key Binding | Operational Behavior |
| :--- | :--- | :--- |
| **30mm M230 Chain Gun** | Hold `[SPACE]` or Left Mouse Click | Fires illuminated dual-layer tracers ($640\text{ m/s}$) with dynamic muzzle flash & brass ejection |
| **AGM-114L Longbow Hellfire** | `[G]` | Top-attack loft trajectory climbs $+52\text{ m}$ before diving into target armor |
| **Hydra 70 High-Explosive Salvo**| `[F]` | Twin rocket pods fire high-velocity unguided rockets |
| **💥 1-Shot Super Smash** | `[X]` | Hypersonic cluster salvo launches from all pylons, targeting and wiping out all 12 bots |
| **TADS Target Scan / Lock** | `[T]` or Viewport Target Click | Locks onto nearest adversary, computes lead pipper, slews chin turret |
| **AN/ALE-47 Flares & Chaff** | `[C]` | Dispenses magnesium thermal flares & aluminum chaff (also auto-fired by Athena AI) |
| **Athena Tactical AI SITREP** | `[J]` | Calls Groq `qwen/qwen3.8-27b` for real-time tactical advice & radio voice comms |

---

## 3. Cinematic & Tactical Camera Perspectives

| Mode Number | Key | View Name | Description |
| :---: | :---: | :--- | :--- |
| **1** | `1` | **Pilot Cockpit HUD** | High-fidelity heads-up display with horizon ladder and pitch bars |
| **2** | `2` | **Chase Cam** | Smooth third-person chase camera trailing behind the tail |
| **3** | `3` | **TADS FLIR Green** | Thermal infrared view with target crosshair overlay |
| **4** | `4` | **Cinema Far Action** | Wide panoramic battle overview |
| **5** | `5` | **Fly-By Flyover** | Dynamic cinematic stationary flyby camera |
| **6** | `6` | **Chin Gun / Turret Cam** | Mounted directly on the M230 30mm chain gun barrel |
| **7** | `7` | **Belly Sensor View** | Downward look for landing and terrain inspection |
| **8** | `8` | **Tail Boom Observer** | Looking forward down the tail boom over the main rotor |
| **9** | `9` | **Top-Down Satellite / FCR** | Tactical top-down battlefield grid map |
| **10** | `0` | **Front Intercept View** | Dramatic head-on angle facing the incoming nose |
| **Cycle** | `[V]` | **Next Camera** | Cycles seamlessly through all 10 views |

---

## 4. Multi-Function Display (MFD) Page Navigation

Use on-screen buttons or keys `[F1]` - `[F4]` to toggle the MFD pages:
1. **MENU (`[F1]`):** High-level airframe diagnostics, Master Caution, gross takeoff weight, and subsystem status.
2. **GNC_TFR (`[F2]`):** Real-time Terrain Following Radar altitude contours, Hermite spline profile, and PID force vectors.
3. **EW_RWR (`[F3]`):** 360-degree radar emitter threat grid, clock bearings, SEARCH/TRACK/LOCK warning tones.
4. **TAC_LINK (`[F4]`):** Link 16 network tracks, FCR 90° conical sweep results, closure rates, and primary lock.
5. **SMS_STORES:** Real-time ammunition inventory, dynamic mass, and Center of Mass (CoM) lateral offset balancing.
