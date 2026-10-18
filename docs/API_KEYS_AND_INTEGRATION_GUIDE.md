# Project 12: API Keys & External Services Integration Guide

**Author:** Mr ELONIKHIL (`mr elonikhil`)  
**Project:** PROJECT-12 — Boeing AH-64E Apache Guardian Border Defense Combat Flight Simulator  

---

## 1. Overview of Cloud & AI Integrations

Project 12 utilizes real-time external cloud APIs to achieve photorealistic 3D geospatial environments and autonomous tactical battle AI:

```mermaid
graph LR
    A["Project 12 Simulation Client"] --> B["Google Photorealistic 3D Tiles API"]
    A --> C["Groq Cloud Tactical AI Engine"]
    A --> D["PlayCanvas & Three.js WebGL Engine"]

    B --> B1["Global High-Res 3D Mesh & Satellite Imagery"]
    C --> C1["Qwen-3.8-27B Ultra-Fast Telemetry LLM"]
    D --> D1["1,480-Part Master CAD & PBR Shading Pipeline"]
```

---

## 2. Google Maps Photorealistic 3D Tiles API

### 2.1 Configuration
The simulation connects to the Google Maps 3D Tiles service via OGC 3D Tiles (Cesium / 3D Tiles format) using the client API key:
* **Pre-configured Key:** `AIzaSyCE1si526202R2J6u5T22Y-vfK2bJxyJ6g`
* **Geospatial Anchor:** Forward Operating Base Uri, Kashmir ($34.0837^\circ\text{ N}, 74.7973^\circ\text{ E}$).

### 2.2 Endpoint Details
* **Base URL:** `https://tile.googleapis.com/v1/3dtiles/root.json?key=YOUR_API_KEY`
* **Features:**
  * Sub-meter elevation accuracy for the Pir Panjal mountain range.
  * Real-time satellite texture streaming.
  * Automatic Level of Detail (LOD) paging for seamless 60 FPS performance on laptops.

---

## 3. Athena Autonomous Tactical AI Engine (Groq)

### 3.1 Configuration
* **API Provider:** Groq Cloud Inference (`https://api.groq.com/openai/v1/chat/completions`)
* **Model ID:** `qwen/qwen3.8-27b`
* **API Key:** `gsk_aa2WN9NrgLGf...[PRE_CONFIGURED_KEY]`
* **Sampling Settings:**
  * Temperature: `0.6`
  * Max Completion Tokens: `2048`
  * Top-P: `0.95`
  * Reasoning Effort: `default`
  * Stream: `true`

### 3.2 Operating Logic
* **Autonomous Decision Loop:** Evaluates real-time telemetry JSON (altitude, airspeed, heading, SAM proximity, and RWR threat state).
* **Automatic Countermeasures:** Instantly deploys flares when an incoming missile closes within $650\text{ m}$.
* **Radio Voice Comms:** Synthesizes tactical military voice callouts ("Bandit 2 o'clock low", "SAM launch warning - break break break").
* **Pilot Intercom:** Press `[J]` or click `🤖 ATHENA AI [J]` to request an instant tactical situation assessment.

---

## 4. Blender 5.2.1 LTS Headless PBR Pipeline

The repository includes `scripts/process_apache_cad_blender.py` which automates:
1. Headless importing of the complete 1,480-part CAD master assembly OBJ.
2. PBR Principled BSDF shader construction (CARC Olive Drab, matte dark gunmetal, optical sapphire glass).
3. Hierarchical bone and pivot parenting for the 4-blade articulating rotor hub and tail rotor.
4. Exporting the optimized 3.12 MB binary GLB (`Boeing_AH64E_Apache_Master_Blender.glb`).
