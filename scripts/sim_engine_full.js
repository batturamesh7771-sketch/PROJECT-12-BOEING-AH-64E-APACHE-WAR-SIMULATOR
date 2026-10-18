// =========================================================================
// BOEING AH-64E APACHE GUARDIAN & GUNSHIP BATTLE ENGINE (ES6+)
// Athena Autonomous AI, 100% Reliable Weapons, 1-Shot Super Smash,
// 6-DOF GNC Physics, Maritime Island Warships & Bot Swarm Theater
// =========================================================================

if (typeof groupMap !== 'undefined' && groupMap.fuselage) {
  groupMap.fuselage.name = 'Body';
  if (typeof mainRotorSpinnerGroup !== 'undefined') mainRotorSpinnerGroup.name = 'MainRotor';
  if (typeof tailRotorSpinnerGroup !== 'undefined') tailRotorSpinnerGroup.name = 'TailRotor';
}

const AvionicsEnums = Object.freeze({
  SimMode: {
    FLIGHT_SIM: 'FLIGHT_SIM',
    CAD_STUDIO: 'CAD_STUDIO',
    HANGAR_UPGRADE: 'HANGAR_UPGRADE'
  },
  CameraView: {
    PILOT_HUD: 'PILOT_HUD',
    TADS_FLIR: 'TADS_FLIR',
    CHASE_CAM: 'CHASE_CAM',
    CHASE_FAR: 'CHASE_FAR',
    FLY_BY: 'FLY_BY',
    BELLY_CAM: 'BELLY_CAM',
    TAIL_CAM: 'TAIL_CAM',
    ORBIT_CAM: 'ORBIT_CAM',
    TOP_DOWN: 'TOP_DOWN',
    HANGAR_TURNTABLE: 'HANGAR_TURNTABLE'
  },
  AutopilotMode: {
    MANUAL: 'MANUAL',
    AUTO_HOVER: 'AUTO_HOVER',
    ORBIT_STRIKE: 'ORBIT_STRIKE',
    DOGFIGHT_ENGAGE: 'DOGFIGHT_ENGAGE',
    RTB_LANDING: 'RTB_LANDING'
  }
});

const PhysicsConstants = Object.freeze({
  g: 9.80665,
  rho: 1.225,
  emptyMass: 5165.0,
  maxFuelMass: 1420.0,
  mainRotorRadius: 7.315,
  tailRotorRadius: 1.395,
  mainRotorMaxThrust: 155000.0,
  tailRotorMomentArm: 8.95,
  maxCyclicPitchTorque: 76000.0,
  maxCyclicRollTorque: 62000.0,
  maxRudderYawTorque: 72000.0,
  dragCoeff: { x: 0.65, y: 1.15, z: 0.30 },
  frontalArea: { x: 24.5, y: 30.0, z: 6.4 },
  inertiaTensor: { Ixx: 36500.0, Iyy: 48200.0, Izz: 14800.0 },
  angularDamping: { x: 92000.0, y: 88000.0, z: 54000.0 },
  scalars: {
    MPS_TO_KNOTS: 1.94384,
    KNOTS_TO_MPS: 0.514444,
    METERS_TO_FEET: 3.28084,
    FEET_TO_METERS: 0.3048,
    RAD_TO_DEG: 180.0 / Math.PI,
    DEG_TO_RAD: Math.PI / 180.0
  }
});

const HangarEconomy = {
  goldCoins: 1609,
  diamonds: 45,
  selectedHelicopter: 'AH64E',
  upgrades: {
    hp: { level: 1, base: 3000, step: 250, cost: 200 },
    speed: { level: 1, base: 200, step: 15, cost: 180 },
    agility: { level: 1, base: 40, step: 5, cost: 150 },
    autoAim: { level: 1, base: 500, step: 50, cost: 250 }
  },
  oneShotSuperSmashEnabled: true,
  infiniteAmmo: true,
  aiVoiceEnabled: true,
  athenaAiAutonomous: true
};

class AthenaTacticalAI {
  constructor() {
    this.enabled = true;
    this.voiceEnabled = true;
    this.speechSynth = window.speechSynthesis || null;
    this.lastSpokenTime = 0;
    this.lastSpokenPhrase = '';
    this.flareCooldown = 0;
    this.autopilotMode = AvionicsEnums.AutopilotMode.MANUAL;
    this.threatCount = 0;
  }

  speak(text, priority = false) {
    if (!this.voiceEnabled || !this.speechSynth) return;
    const now = performance.now();
    if (!priority && (now - this.lastSpokenTime < 2600 || this.lastSpokenPhrase === text)) return;
    this.lastSpokenTime = now;
    this.lastSpokenPhrase = text;

    try {
      if (priority) this.speechSynth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.95;
      utterance.volume = 0.9;
      const voices = this.speechSynth.getVoices();
      const milVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('David') || v.name.includes('Male') || v.name.includes('Natural') || v.name.includes('Google')));
      if (milVoice) utterance.voice = milVoice;
      this.speechSynth.speak(utterance);
    } catch (e) {}
  }

  evaluateThreats(physics, simRenderer, app) {
    if (!this.enabled) return;
    const heliPos = physics.position;
    this.threatCount = simRenderer.hostileTargets.filter(t => !t.destroyed).length;

    let incomingSam = null;
    let minSamDist = 9999;
    for (const ep of simRenderer.enemyProjectiles) {
      if (ep.isSam && !ep.spoofedByFlare) {
        const d = ep.position.distanceTo(heliPos);
        if (d < minSamDist) {
          minSamDist = d;
          incomingSam = ep;
        }
      }
    }

    if (incomingSam && minSamDist < 650.0 && this.flareCooldown <= 0) {
      app.fireWeapon('FLARE');
      this.flareCooldown = 3.2;
      this.speak("Missile launch detected! Deploying countermeasures!", true);
      showToast("ATHENA AI: Autonomous IR Countermeasures Deployed!");
    }
    if (this.flareCooldown > 0) this.flareCooldown -= 0.016;

    const groundY = app.geodetic.getTerrainHeight(heliPos.x, heliPos.z);
    const agl = heliPos.y - groundY;
    if (agl < 12.0 && physics.velocity.y < -5.0 && !physics.isGrounded) {
      this.speak("Warning: Low altitude pull up!", true);
    }
  }

  computePredictiveLead(target, gunPos, muzzleSpeed) {
    if (!target) return null;
    const dist = target.position.distanceTo(gunPos);
    const timeToTarget = dist / Math.max(100.0, muzzleSpeed);
    const targetVel = target.velocity || new THREE.Vector3(0, 0, 0);
    return target.position.clone().addScaledVector(targetVel, timeToTarget);
  }

  updateAutopilot(dt, physics, simRenderer, app) {
    if (this.autopilotMode === AvionicsEnums.AutopilotMode.MANUAL) return;

    const heliPos = physics.position;
    const target = simRenderer.hostileTargets[simRenderer.selectedTargetIndex];

    if (this.autopilotMode === AvionicsEnums.AutopilotMode.AUTO_HOVER) {
      const targetAlt = Math.max(25.0, app.lockedHoverAltitude || 35.0);
      const groundY = app.geodetic.getTerrainHeight(heliPos.x, heliPos.z);
      const curAgl = heliPos.y - groundY;
      const altErr = targetAlt - curAgl;

      physics.inputs.collective = THREE.MathUtils.clamp(0.43 + altErr * 0.02 - physics.velocity.y * 0.04, 0.25, 0.70);
      physics.inputs.cyclicPitch = THREE.MathUtils.clamp(-physics.velocity.z * 0.05, -0.4, 0.4);
      physics.inputs.cyclicRoll = THREE.MathUtils.clamp(-physics.velocity.x * 0.05, -0.4, 0.4);
      physics.inputs.rudder *= 0.85;

    } else if (this.autopilotMode === AvionicsEnums.AutopilotMode.ORBIT_STRIKE && target && !target.destroyed) {
      const toTgt = target.position.clone().sub(heliPos);
      const dist = Math.hypot(toTgt.x, toTgt.z);
      const desiredDist = 450.0;
      const distErr = dist - desiredDist;

      const tgtAngle = Math.atan2(toTgt.x, toTgt.z);
      const orbitHeading = tgtAngle + Math.PI / 2 + THREE.MathUtils.clamp(distErr * 0.003, -0.5, 0.5);

      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(physics.quaternion);
      const curHeading = Math.atan2(fwd.x, fwd.z);
      let headingDiff = orbitHeading - curHeading;
      while (headingDiff > Math.PI) headingDiff -= Math.PI * 2;
      while (headingDiff < -Math.PI) headingDiff += Math.PI * 2;

      physics.inputs.collective = THREE.MathUtils.clamp(0.46, 0.35, 0.65);
      physics.inputs.cyclicPitch = 0.28;
      physics.inputs.cyclicRoll = THREE.MathUtils.clamp(headingDiff * 0.85, -0.45, 0.45);
      physics.inputs.rudder = THREE.MathUtils.clamp(headingDiff * 0.4, -0.6, 0.6);

    } else if (this.autopilotMode === AvionicsEnums.AutopilotMode.DOGFIGHT_ENGAGE && target && !target.destroyed) {
      const toTgt = target.position.clone().sub(heliPos);
      const dist = toTgt.length();
      const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(physics.quaternion);
      const tgtHeading = Math.atan2(toTgt.x, toTgt.z);
      const curHeading = Math.atan2(fwd.x, fwd.z);
      let diff = tgtHeading - curHeading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      physics.inputs.rudder = THREE.MathUtils.clamp(diff * 1.2, -1.0, 1.0);
      physics.inputs.cyclicRoll = THREE.MathUtils.clamp(diff * 0.6, -0.5, 0.5);

      if (dist > 350.0) {
        physics.inputs.cyclicPitch = 0.45;
        physics.inputs.collective = 0.48;
      } else {
        physics.inputs.cyclicPitch = 0.05;
        physics.inputs.collective = 0.43;
        if (Math.abs(diff) < 0.15) {
          app.fireWeapon('30MM');
        }
      }

    } else if (this.autopilotMode === AvionicsEnums.AutopilotMode.RTB_LANDING) {
      const distToFob = Math.hypot(heliPos.x, heliPos.z);
      if (distToFob > 30.0) {
        const toFob = new THREE.Vector3(-heliPos.x, 0, -heliPos.z).normalize();
        const fwd = new THREE.Vector3(0, 0, 1).applyQuaternion(physics.quaternion);
        const desiredH = Math.atan2(toFob.x, toFob.z);
        const curH = Math.atan2(fwd.x, fwd.z);
        let diff = desiredH - curH;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        physics.inputs.rudder = THREE.MathUtils.clamp(diff * 0.8, -0.8, 0.8);
        physics.inputs.cyclicPitch = 0.25;
        physics.inputs.collective = 0.45;
      } else {
        physics.inputs.cyclicPitch = -physics.velocity.z * 0.1;
        physics.inputs.cyclicRoll = -physics.velocity.x * 0.1;
        physics.inputs.collective = 0.38;
        if (heliPos.y < 3.0) {
          physics.inputs.collective = 0.25;
          this.autopilotMode = AvionicsEnums.AutopilotMode.MANUAL;
          this.speak("Safely landed on helipad. Rearming ready.");
        }
      }
    }
  }
}

class GeodeticCoordinateSystem {
  constructor() {
    this.currentTheaterKey = 'MARITIME_ISLAND';
    this.theaters = {
      MARITIME_ISLAND: {
        name: 'Archipelago Warfare (Island & Warships)',
        lat0: 12.8340,
        lon0: 92.7420,
        alt0: 0.0,
        theme: 'MARITIME'
      },
      KASHMIR_VALLEY: {
        name: 'Kashmir Valley (Srinagar Airbase)',
        lat0: 34.0837,
        lon0: 74.7973,
        alt0: 1600.0,
        theme: 'MOUNTAIN'
      }
    };
  }

  enuToGeodetic(e, u, n) {
    const th = this.theaters[this.currentTheaterKey];
    const lat = th.lat0 + (n / 111319.5);
    const lon = th.lon0 + (e / (111319.5 * Math.cos(th.lat0 * PhysicsConstants.scalars.DEG_TO_RAD)));
    const altMSL = th.alt0 + u;
    return { lat, lon, altMSL };
  }

  getTerrainHeight(x, z) {
    if (this.currentTheaterKey === 'MARITIME_ISLAND') {
      const distFromIsland = Math.hypot(x, z);
      if (distFromIsland < 65.0) return 2.15;

      const lighthouseDist = Math.hypot(x - 140.0, z + 180.0);
      const lighthouseHill = Math.exp(-(lighthouseDist * lighthouseDist) / (120.0 * 120.0)) * 48.0;
      const mainIslandProfile = Math.exp(-(distFromIsland * distFromIsland) / (380.0 * 380.0)) * 32.0;
      const rockyRidges = (Math.sin(x * 0.012) * Math.cos(z * 0.012) + 0.5) * 8.0;

      const islandHeight = mainIslandProfile + lighthouseHill + rockyRidges;
      if (distFromIsland > 440.0) return 0.0;
      return Math.max(0.0, islandHeight);
    } else {
      const distFromFob = Math.hypot(x, z);
      if (distFromFob < 78.0) return 0.0;
      const blend = Math.min(1.0, (distFromFob - 78.0) / 160.0);
      const n1 = Math.sin(x * 0.0018) * Math.cos(z * 0.0016) * 210.0;
      const n2 = Math.sin(x * 0.0042 + 1.3) * Math.sin(z * 0.0038 + 0.7) * 95.0;
      const ridge = Math.abs(Math.sin(x * 0.0022 + z * 0.0019)) * 165.0;
      return Math.max(-5.0, (n1 + n2 + ridge + 35.0) * blend);
    }
  }
}

class HelicopterPhysicsEngine {
  constructor(geodeticSystem) {
    this.geodetic = geodeticSystem;
    this.position = new THREE.Vector3(0, 2.15, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.quaternion = new THREE.Quaternion();
    this.angularVelocity = new THREE.Vector3(0, 0, 0);

    this.inputs = {
      collective: 0.35,
      cyclicPitch: 0.0,
      cyclicRoll: 0.0,
      rudder: 0.0
    };

    this.fuelMass = PhysicsConstants.maxFuelMass;
    this.rotorRPM = 289.0;
    this.sasTier = 2;
    this.sasEnabled = true;
    this.isGrounded = true;

    // Upgradable base stats from HangarEconomy
    this.maxHealth = HangarEconomy.upgrades.hp.base + (HangarEconomy.upgrades.hp.level - 1) * HangarEconomy.upgrades.hp.step;
    this.health = this.maxHealth;

    this.subsystems = {
      engines: 100.0,
      tailRotor: 100.0,
      mainRotor: 100.0,
      avionics: 100.0
    };
  }

  update(dt) {
    const groundY = this.geodetic.getTerrainHeight(this.position.x, this.position.z);
    const agl = this.position.y - groundY;

    // Upgrade stat bonuses
    const speedMult = 1.0 + (HangarEconomy.upgrades.speed.level - 1) * 0.10;
    const agilityMult = 1.0 + (HangarEconomy.upgrades.agility.level - 1) * 0.12;

    // Collective thrust computation (Hover at ~43% collective)
    const totalMass = PhysicsConstants.emptyMass + this.fuelMass;
    const hoverThrust = totalMass * PhysicsConstants.g;
    const currentThrust = (this.inputs.collective / 0.43) * hoverThrust * speedMult;

    // Lift vector in world coordinates
    const localUp = new THREE.Vector3(0, 1, 0).applyQuaternion(this.quaternion);
    const liftForce = localUp.clone().multiplyScalar(currentThrust);

    // Gravity
    const gravityForce = new THREE.Vector3(0, -totalMass * PhysicsConstants.g, 0);

    // Aerodynamic drag
    const airDrag = this.velocity.clone().multiplyScalar(-0.5 * PhysicsConstants.rho * 6.5 * this.velocity.length());

    // Total translational force & acceleration
    const totalForce = liftForce.add(gravityForce).add(airDrag);
    this.acceleration.copy(totalForce.divideScalar(totalMass));

    this.velocity.addScaledVector(this.acceleration, dt);
    this.position.addScaledVector(this.velocity, dt);

    // Ground collision & oleo gear support
    if (this.position.y <= groundY + 2.15) {
      this.position.y = groundY + 2.15;
      if (this.velocity.y < 0) this.velocity.y = 0;
      this.velocity.x *= 0.90;
      this.velocity.z *= 0.90;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Cyclic rotational torques (Pitch, Roll, Yaw)
    const pitchTorque = this.inputs.cyclicPitch * 2.2 * agilityMult;
    const rollTorque = this.inputs.cyclicRoll * 2.4 * agilityMult;
    const yawTorque = -this.inputs.rudder * 1.8 * agilityMult;

    // Angular damping
    this.angularVelocity.x = (this.angularVelocity.x + pitchTorque * dt) * Math.pow(0.04, dt);
    this.angularVelocity.y = (this.angularVelocity.y + yawTorque * dt) * Math.pow(0.06, dt);
    this.angularVelocity.z = (this.angularVelocity.z + rollTorque * dt) * Math.pow(0.04, dt);

    // Integrate orientation using quaternion deltas
    const rotDelta = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        this.angularVelocity.x * dt,
        this.angularVelocity.y * dt,
        this.angularVelocity.z * dt,
        'YXZ'
      )
    );
    this.quaternion.multiply(rotDelta).normalize();
  }

  applyDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    const pct = this.health / this.maxHealth;
    this.subsystems.engines = Math.max(10, pct * 100);
    this.subsystems.tailRotor = Math.max(15, pct * 100);
    return this.health;
  }
}

class SimulatorRenderer {
  constructor(scene, camera, renderer, helicopterGroup, geodetic) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.helicopterGroup = helicopterGroup;
    this.geodetic = geodetic;

    this.combatWorldGroup = new THREE.Group();
    this.combatWorldGroup.name = 'MaritimeWarfareCombatWorld';
    this.scene.add(this.combatWorldGroup);

    this.projectiles = [];
    this.enemyProjectiles = [];
    this.countermeasureFlares = [];
    this.explosions = [];
    this.hostileTargets = [];
    this.selectedTargetIndex = 0;
    this.combatWave = 1;
    this.combatScore = 0;
    this.waveKills = 0;
    this.targetWarshipCount = 8;

    this.buildMaritimeEnvironment();
    this.spawnCombatWave(1);
  }

  buildMaritimeEnvironment() {
    // 1. Dynamic Ocean Water Plane with deep naval blue color
    const oceanGeo = new THREE.PlaneGeometry(12000, 12000, 64, 64);
    oceanGeo.rotateX(-Math.PI / 2);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x082f49,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.94
    });
    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.position.y = 0.0;
    this.combatWorldGroup.add(this.oceanMesh);

    // 2. Island Mesh (Green terrain & cliffs)
    const islandGeo = new THREE.CylinderGeometry(420, 480, 28, 48);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x22361d,
      roughness: 0.75,
      metalness: 0.2
    });
    const islandMesh = new THREE.Mesh(islandGeo, islandMat);
    islandMesh.position.set(0, 12, 0);
    this.combatWorldGroup.add(islandMesh);

    // Helipad Landing Decal on Island Center
    const padGeo = new THREE.RingGeometry(0, 24, 32);
    padGeo.rotateX(-Math.PI / 2);
    const padMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.set(0, 26.1, 0);
    this.combatWorldGroup.add(padMesh);

    // 3. 3D Stone Lighthouse with Rotating Searchlight Beam (from Screenshot 4)
    const lhGroup = new THREE.Group();
    lhGroup.position.set(140, 26, -180);

    const towerGeo = new THREE.CylinderGeometry(4.5, 7.5, 38, 16);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
    const towerMesh = new THREE.Mesh(towerGeo, towerMat);
    towerMesh.position.y = 19;
    lhGroup.add(towerMesh);

    // Lantern room & dome
    const lanternGeo = new THREE.CylinderGeometry(5.2, 5.2, 7, 16);
    const lanternMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfacc15, roughness: 0.2 });
    const lanternMesh = new THREE.Mesh(lanternGeo, lanternMat);
    lanternMesh.position.y = 41;
    lhGroup.add(lanternMesh);

    // Rotating Spotlight Beam
    const beamGeo = new THREE.ConeGeometry(24, 280, 16);
    beamGeo.rotateX(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfffbeb,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    this.lighthouseBeam = new THREE.Mesh(beamGeo, beamMat);
    this.lighthouseBeam.position.set(0, 42, 140);
    lhGroup.add(this.lighthouseBeam);

    this.combatWorldGroup.add(lhGroup);
  }

  spawnCombatWave(waveNum = 1) {
    this.hostileTargets.forEach(t => {
      if (t.group) this.combatWorldGroup.remove(t.group);
    });
    this.hostileTargets = [];
    this.combatWave = waveNum;
    this.waveKills = 0;

    // 8 Armed Enemy Warships sailing in ocean + Hostile Attack Gunboats/Bots
    const warshipSpecs = [
      { id: 'WARSHIP-01', type: 'GUIDED MISSILE DESTROYER', role: 'WARSHIP', dist: 780, angle: 0.4, speed: 8.5 },
      { id: 'WARSHIP-02', type: 'AEGIS MISSILE CRUISER', role: 'WARSHIP', dist: 1100, angle: 1.1, speed: 7.0 },
      { id: 'WARSHIP-03', type: 'STEALTH CORVETTE', role: 'WARSHIP', dist: 650, angle: 2.0, speed: 12.0 },
      { id: 'WARSHIP-04', type: 'FAST ATTACK MISSILE BOAT', role: 'BOAT', dist: 520, angle: 2.8, speed: 16.0 },
      { id: 'WARSHIP-05', type: 'HEAVY FRIGATE', role: 'WARSHIP', dist: 940, angle: 3.6, speed: 8.0 },
      { id: 'WARSHIP-06', type: 'TORPEDO PATROL CRAFT', role: 'BOAT', dist: 590, angle: 4.4, speed: 15.0 },
      { id: 'WARSHIP-07', type: 'ANTI-AIR CORVETTE', role: 'WARSHIP', dist: 1250, angle: 5.1, speed: 7.5 },
      { id: 'WARSHIP-08', type: 'COMMAND DESTROYER', role: 'WARSHIP', dist: 1400, angle: 5.8, speed: 6.5 },
      // Hostile Insurgent Combatant Bots
      { id: 'BOT-01', type: 'INSURGENT FAST GUNBOAT', role: 'BOT', dist: 420, angle: 1.6, speed: 18.0 },
      { id: 'BOT-02', type: 'ROGUE ARMED TECHNICAL', role: 'BOT', dist: 380, angle: 3.2, speed: 19.0 },
      { id: 'BOT-03', type: 'HOSTILE ATTACK HELO', role: 'AIR_BOT', dist: 680, angle: 4.8, speed: 35.0, alt: 95 }
    ];

    warshipSpecs.forEach((spec, idx) => {
      const px = Math.cos(spec.angle) * spec.dist;
      const pz = Math.sin(spec.angle) * spec.dist;
      const py = spec.alt || 0.0;

      const tGroup = new THREE.Group();
      tGroup.position.set(px, py, pz);

      if (spec.role === 'AIR_BOT') {
        // Attack Chopper Bot
        const bodyGeo = new THREE.BoxGeometry(3.5, 2.5, 12);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
        tGroup.add(new THREE.Mesh(bodyGeo, bodyMat));
        const rotorGeo = new THREE.BoxGeometry(13, 0.15, 0.8);
        const rotor = new THREE.Mesh(rotorGeo, new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
        rotor.position.y = 1.8;
        tGroup.add(rotor);
        tGroup.userData.dishMesh = rotor;
      } else {
        // 3D Warship Hull
        const hullLen = spec.role === 'WARSHIP' ? 48.0 : 22.0;
        const hullWidth = spec.role === 'WARSHIP' ? 8.5 : 4.5;
        const hullGeo = new THREE.BoxGeometry(hullWidth, 5.0, hullLen);
        const hullMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.4 });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        hull.position.y = 2.0;
        tGroup.add(hull);

        // Deck Superstructure & Bridge
        const bridgeGeo = new THREE.BoxGeometry(hullWidth * 0.7, 5.5, hullLen * 0.35);
        const bridge = new THREE.Mesh(bridgeGeo, hullMat);
        bridge.position.set(0, 6.5, -2.0);
        tGroup.add(bridge);

        // Rotating Twin Deck Turret
        const turGeo = new THREE.CylinderGeometry(2.2, 2.6, 2.0, 12);
        const tur = new THREE.Mesh(turGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.6 }));
        tur.position.set(0, 5.5, hullLen * 0.28);
        tGroup.add(tur);
        tGroup.userData.turretMesh = tur;

        // Gun Barrels
        const gunGeo = new THREE.CylinderGeometry(0.25, 0.25, 6.0, 8);
        gunGeo.rotateX(Math.PI / 2);
        const gun = new THREE.Mesh(gunGeo, new THREE.MeshBasicMaterial({ color: 0x0f172a }));
        gun.position.set(0, 0.5, 3.5);
        tur.add(gun);
      }

      this.combatWorldGroup.add(tGroup);

      this.hostileTargets.push({
        ...spec,
        index: idx,
        group: tGroup,
        turretMesh: tGroup.userData.turretMesh,
        dishMesh: tGroup.userData.dishMesh,
        position: new THREE.Vector3(px, py, pz),
        velocity: new THREE.Vector3(-Math.sin(spec.angle) * spec.speed, 0, Math.cos(spec.angle) * spec.speed),
        maxHealth: spec.role === 'WARSHIP' ? 300 : 120,
        health: spec.role === 'WARSHIP' ? 300 : 120,
        destroyed: false,
        angle: spec.angle,
        fireCooldown: 2.5 + idx * 0.7
      });
    });

    this.selectedTargetIndex = 0;
  }

  // 100% Reliable Weapon Projectile Spawner
  spawnWeaponProjectile(type, startPos, forwardDir, inheritVel, lockedTarget = null) {
    let speed = 720.0;
    let color = 0xfde047; // Radiant Yellow Tracer
    let radius = 0.28;
    let length = 4.2;
    let damage = 22;
    let guided = false;

    if (type === 'HYDRA') {
      speed = 480.0;
      color = 0x38bdf8;
      radius = 0.42;
      length = 6.2;
      damage = 65;
    } else if (type === 'HELLFIRE') {
      speed = 380.0;
      color = 0xf43f5e;
      radius = 0.58;
      length = 7.8;
      damage = 180;
      guided = true;
    } else if (type === 'SUPER_SMASH') {
      speed = 1100.0;
      color = 0xa855f7;
      radius = 0.75;
      length = 9.0;
      damage = 9999;
      guided = true;
    }

    const geo = new THREE.CylinderGeometry(radius * 0.4, radius, length, 8);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(startPos);

    const velocity = forwardDir.clone().multiplyScalar(speed).add(inheritVel);
    if (type === 'HELLFIRE' || type === 'SUPER_SMASH') velocity.y += 35.0; // Top-attack loft
    mesh.lookAt(startPos.clone().add(velocity));
    this.combatWorldGroup.add(mesh);

    this.projectiles.push({
      type,
      mesh,
      position: startPos.clone(),
      velocity,
      speed,
      damage,
      guided,
      target: lockedTarget,
      age: 0,
      maxAge: type === '30MM' ? 4.5 : 9.0
    });
  }

  spawnExplosion(pos, scale = 1.0, colorHex = 0xf97316) {
    const geo = new THREE.SphereGeometry(3.6 * scale, 16, 12);
    const mat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    this.combatWorldGroup.add(mesh);
    this.explosions.push({ mesh, age: 0, maxAge: 0.85, scale });
  }

  update(dt, physicsEngine, app) {
    // 1. Rotate lighthouse searchlight beam
    if (this.lighthouseBeam) {
      this.lighthouseBeam.rotation.y += dt * 0.85;
    }

    const heliPos = physicsEngine.position;

    // 2. Update Warships & Hostile Bots Patrol Movement & Turret Tracking
    this.hostileTargets.forEach(t => {
      if (t.destroyed) return;

      // Sail along circular patrol path
      t.angle += (t.speed / t.dist) * dt * 0.3;
      t.position.x = Math.cos(t.angle) * t.dist;
      t.position.z = Math.sin(t.angle) * t.dist;
      t.group.position.copy(t.position);
      t.group.lookAt(
        t.position.x - Math.sin(t.angle) * 50,
        t.position.y,
        t.position.z + Math.cos(t.angle) * 50
      );

      // Track turrets directly at Apache helicopter
      if (t.turretMesh) {
        t.turretMesh.lookAt(heliPos.x, t.turretMesh.position.y + 4, heliPos.z);
      }

      // Enemy AI Firing (SAMs & Naval Flak)
      const distToHeli = t.position.distanceTo(heliPos);
      if (distToHeli < 1400.0 && !physicsEngine.isGrounded) {
        t.fireCooldown -= dt;
        if (t.fireCooldown <= 0) {
          const isSam = t.role === 'WARSHIP';
          const epSpeed = isSam ? 195.0 : 380.0;
          const dir = heliPos.clone().sub(t.position).normalize();
          const epGeo = new THREE.CylinderGeometry(0.2, 0.4, 5, 8);
          epGeo.rotateX(Math.PI / 2);
          const epMesh = new THREE.Mesh(epGeo, new THREE.MeshBasicMaterial({ color: isSam ? 0xff2244 : 0xffaa00 }));
          epMesh.position.copy(t.position).add(new THREE.Vector3(0, 4, 0));
          this.combatWorldGroup.add(epMesh);

          this.enemyProjectiles.push({
            isSam,
            mesh: epMesh,
            position: epMesh.position.clone(),
            velocity: dir.multiplyScalar(epSpeed),
            speed: epSpeed,
            damage: isSam ? 24 : 6,
            age: 0,
            maxAge: 7.5,
            spoofedByFlare: null
          });
          t.fireCooldown = isSam ? 7.0 + Math.random() * 3 : 2.5;
        }
      }
    });

    // 3. Update Enemy Projectiles (SAMs & AAA)
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      ep.age += dt;

      if (ep.isSam) {
        const aimPt = (ep.spoofedByFlare && ep.spoofedByFlare.age < 5.0) ? ep.spoofedByFlare.position : heliPos;
        const toAim = aimPt.clone().sub(ep.position).normalize();
        ep.velocity.lerp(toAim.multiplyScalar(ep.speed), Math.min(1.0, dt * 3.5));
      }

      ep.position.addScaledVector(ep.velocity, dt);
      ep.mesh.position.copy(ep.position);
      ep.mesh.lookAt(ep.position.clone().add(ep.velocity));

      let remove = false;
      // Hit on player
      if (ep.position.distanceTo(heliPos) < 6.5) {
        physicsEngine.applyDamage(ep.damage);
        this.spawnExplosion(ep.position, 2.2, 0xef4444);
        showToast(`DIRECT HIT TAKEN! ARMOR: ${Math.round((physicsEngine.health / physicsEngine.maxHealth) * 100)}%`);
        remove = true;
      } else if (ep.age >= ep.maxAge || ep.position.y <= 0) {
        remove = true;
      }

      if (remove) {
        this.combatWorldGroup.remove(ep.mesh);
        ep.mesh.geometry.dispose();
        ep.mesh.material.dispose();
        this.enemyProjectiles.splice(i, 1);
      }
    }

    // 4. Update Countermeasure Flares
    for (let i = this.countermeasureFlares.length - 1; i >= 0; i--) {
      const fl = this.countermeasureFlares[i];
      fl.age += dt;
      fl.position.addScaledVector(fl.velocity, dt);
      fl.mesh.position.copy(fl.position);
      if (fl.age >= 4.5) {
        this.combatWorldGroup.remove(fl.mesh);
        fl.mesh.geometry.dispose();
        fl.mesh.material.dispose();
        this.countermeasureFlares.splice(i, 1);
      }
    }

    // 5. Update Player Weapon Projectiles & Collision Detection
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.age += dt;

      if (p.guided && p.target && !p.target.destroyed) {
        const toTgt = p.target.position.clone().sub(p.position).normalize();
        p.velocity.lerp(toTgt.multiplyScalar(p.speed), Math.min(1.0, dt * 6.0));
      }

      p.position.addScaledVector(p.velocity, dt);
      p.mesh.position.copy(p.position);
      p.mesh.lookAt(p.position.clone().add(p.velocity));

      let hit = false;
      for (const tgt of this.hostileTargets) {
        if (tgt.destroyed) continue;
        const hitRadius = tgt.role === 'WARSHIP' ? 24.0 : 12.0;
        if (p.position.distanceTo(tgt.position) < hitRadius) {
          tgt.health = Math.max(0, tgt.health - p.damage);
          this.spawnExplosion(p.position, p.type === '30MM' ? 1.2 : 3.2);

          if (tgt.health <= 0) {
            tgt.destroyed = true;
            tgt.group.position.y -= 4.0; // Sinking animation
            this.spawnExplosion(tgt.position, 5.5, 0xff5500);
            this.combatScore += 800;
            this.waveKills++;
            HangarEconomy.goldCoins += 250;
            HangarEconomy.diamonds += 5;
            showToast(`★ TARGET DESTROYED: ${tgt.id} (+800 PTS, +250 💰) ★`);
            app.athenaAi.speak("Direct hit! Hostile warship eliminated.");
          }
          hit = true;
          break;
        }
      }

      if (hit || p.age >= p.maxAge || (p.position.y <= 0 && p.age > 0.06)) {
        this.combatWorldGroup.remove(p.mesh);
        p.mesh.geometry.dispose();
        p.mesh.material.dispose();
        this.projectiles.splice(i, 1);
      }
    }

    // 6. Update Explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const ex = this.explosions[i];
      ex.age += dt;
      const progress = ex.age / ex.maxAge;
      ex.mesh.scale.setScalar(1.0 + progress * 3.0);
      ex.mesh.material.opacity = Math.max(0, 1.0 - progress);
      if (ex.age >= ex.maxAge) {
        this.combatWorldGroup.remove(ex.mesh);
        ex.mesh.geometry.dispose();
        ex.mesh.material.dispose();
        this.explosions.splice(i, 1);
      }
    }
  }
}

class AvionicsHUD {
  constructor(canvas, physics, geodetic, simRenderer) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.physics = physics;
    this.geodetic = geodetic;
    this.simRenderer = simRenderer;
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
  }

  render(camera) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;

    // 1. Center Flight Reticle & Crosshair
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.moveTo(cx - 32, cy); ctx.lineTo(cx - 18, cy);
    ctx.moveTo(cx + 18, cy); ctx.lineTo(cx + 32, cy);
    ctx.moveTo(cx, cy - 32); ctx.lineTo(cx, cy - 18);
    ctx.moveTo(cx, cy + 18); ctx.lineTo(cx, cy + 32);
    ctx.stroke();

    // 2. Project Locked Target Box & Predictive Lead Pipper
    const tgt = this.simRenderer.hostileTargets[this.simRenderer.selectedTargetIndex];
    if (tgt && !tgt.destroyed) {
      const p3d = tgt.position.clone().project(camera);
      if (p3d.z < 1.0) {
        const tx = (p3d.x * 0.5 + 0.5) * w;
        const ty = (-p3d.y * 0.5 + 0.5) * h;

        // Red Target Diamond Box
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2.0;
        ctx.strokeRect(tx - 20, ty - 20, 40, 40);

        ctx.fillStyle = '#f43f5e';
        ctx.font = 'bold 10px monospace';
        const dist = (this.physics.position.distanceTo(tgt.position) / 1000).toFixed(1);
        ctx.fillText(`${tgt.id} [${dist}KM]`, tx - 28, ty + 32);

        // Predictive Lead Pipper (Aim here to hit moving target!)
        const lead3D = tgt.position.clone().add(tgt.velocity.clone().multiplyScalar(0.7)).project(camera);
        if (lead3D.z < 1.0) {
          const lx = (lead3D.x * 0.5 + 0.5) * w;
          const ly = (-lead3D.y * 0.5 + 0.5) * h;
          ctx.strokeStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(lx, ly, 8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
  }
}

class FlightSimulatorApp {
  constructor() {
    this.geodetic = new GeodeticCoordinateSystem();
    this.physics = new HelicopterPhysicsEngine(this.geodetic);
    this.simRenderer = new SimulatorRenderer(scene, camera, renderer, apacheRoot, this.geodetic);

    const hudCanvas = document.getElementById('milHudCanvas');
    this.hud = new AvionicsHUD(hudCanvas, this.physics, this.geodetic, this.simRenderer);
    this.hud.resize(container.clientWidth, container.clientHeight);

    this.athenaAi = new AthenaTacticalAI();
    this.activeAppMode = AvionicsEnums.SimMode.FLIGHT_SIM;
    this.cameraViewMode = AvionicsEnums.CameraView.CHASE_CAM;

    this.ammo30mm = 1200;
    this.ammoHydra = 38;
    this.ammoHellfire = 8;
    this.flareCount = 60;
    this.superSmashCount = 5;

    this.keys = {
      KeyW: false, KeyS: false, KeyA: false, KeyD: false,
      KeyQ: false, KeyE: false, Space: false
    };

    this.isFiring30mm = false;
    this.lastGunFireTime = 0;
    this.clock = new THREE.Clock();

    this.bindEvents();
    this.initAudio();
    this.athenaAi.speak("Athena Tactical AI online. Ready for combat mission.");
  }

  initAudio() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
    } catch (e) {}
  }

  playWeaponSound(type) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      if (type === '30MM') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      } else if (type === 'SUPER_SMASH') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.8);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.85);
      }
    } catch (e) {}
  }

  // 100% RELIABLE WEAPON FIRING ENGINE
  fireWeapon(type) {
    const fwd = new THREE.Vector3(0, -0.02, 1).applyQuaternion(this.physics.quaternion).normalize();
    // Safe spawn location offset 7.5m ahead of nose so bullets never hit player
    const spawnPos = new THREE.Vector3(0, -0.4, 7.5).applyQuaternion(this.physics.quaternion).add(this.physics.position);
    const lockedTgt = this.simRenderer.hostileTargets[this.simRenderer.selectedTargetIndex];

    if (type === '30MM') {
      if (this.ammo30mm <= 0 && !HangarEconomy.infiniteAmmo) return;
      this.ammo30mm = Math.max(0, this.ammo30mm - 1);
      document.getElementById('ammo30mmCount').textContent = `${this.ammo30mm} RDS`;
      this.simRenderer.spawnWeaponProjectile('30MM', spawnPos, fwd, this.physics.velocity);
      this.playWeaponSound('30MM');

    } else if (type === 'HYDRA') {
      if (this.ammoHydra <= 0 && !HangarEconomy.infiniteAmmo) return;
      this.ammoHydra = Math.max(0, this.ammoHydra - 2);
      document.getElementById('ammoHydraCount').textContent = `${this.ammoHydra} PODS`;
      [-2.2, 2.2].forEach(side => {
        const podPos = spawnPos.clone().add(new THREE.Vector3(side, 0, -2.0).applyQuaternion(this.physics.quaternion));
        this.simRenderer.spawnWeaponProjectile('HYDRA', podPos, fwd, this.physics.velocity);
      });
      this.playWeaponSound('30MM');
      showToast('Hydra 70 Salvo Launched!');

    } else if (type === 'HELLFIRE') {
      if (this.ammoHellfire <= 0 && !HangarEconomy.infiniteAmmo) return;
      this.ammoHellfire = Math.max(0, this.ammoHellfire - 1);
      document.getElementById('ammoHellfireCount').textContent = `${this.ammoHellfire} MSL`;
      this.simRenderer.spawnWeaponProjectile('HELLFIRE', spawnPos, fwd, this.physics.velocity, lockedTgt);
      this.playWeaponSound('SUPER_SMASH');
      showToast(`AGM-114 Hellfire Launched at ${lockedTgt ? lockedTgt.id : 'Target'}!`);
      this.athenaAi.speak("Hellfire missile away.");

    // THE USER'S REQUESTED 1-SHOT SUPER SMASH: OBLITERATES ALL HOSTILE BOTS & WARSHIPS IN ONE SHOT!
    } else if (type === 'SUPER_SMASH') {
      this.playWeaponSound('SUPER_SMASH');
      showToast("💥 1-SHOT SUPER SMASH DETONATED! SMASHING ALL HOSTILE TARGETS!");
      this.athenaAi.speak("Super weapon detonated! All hostiles eradicated!", true);

      // Launch hypersonic cluster seeking every alive hostile target simultaneously!
      this.simRenderer.hostileTargets.forEach(tgt => {
        if (!tgt.destroyed) {
          const dir = tgt.position.clone().sub(spawnPos).normalize();
          this.simRenderer.spawnWeaponProjectile('SUPER_SMASH', spawnPos, dir, this.physics.velocity, tgt);
          // Directly apply catastrophic damage and explode
          setTimeout(() => {
            tgt.health = 0;
            tgt.destroyed = true;
            tgt.group.position.y -= 4.0;
            this.simRenderer.spawnExplosion(tgt.position, 6.0, 0xa855f7);
            this.simRenderer.combatScore += 1200;
            HangarEconomy.goldCoins += 500;
            HangarEconomy.diamonds += 15;
          }, 350);
        }
      });

    } else if (type === 'FLARE') {
      if (this.flareCount <= 0 && !HangarEconomy.infiniteAmmo) return;
      this.flareCount = Math.max(0, this.flareCount - 2);
      document.getElementById('flareCountLabel').textContent = String(this.flareCount);
      [-1, 1].forEach(side => {
        const flPos = this.physics.position.clone().add(new THREE.Vector3(side * 3, 0, -3).applyQuaternion(this.physics.quaternion));
        const flMesh = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffedd5 }));
        flMesh.position.copy(flPos);
        this.simRenderer.combatWorldGroup.add(flMesh);
        const flareObj = { mesh: flMesh, position: flPos, velocity: new THREE.Vector3(side * 12, 6, -10).applyQuaternion(this.physics.quaternion), age: 0 };
        this.simRenderer.countermeasureFlares.push(flareObj);
        // Spoof all active SAMs
        this.simRenderer.enemyProjectiles.forEach(ep => { if (ep.isSam) ep.spoofedByFlare = flareObj; });
      });
      showToast('AN/ALE-47 Flares Deployed!');
    }
  }

  bindEvents() {
    // Mode Switcher Buttons (Zero overlap!)
    document.getElementById('btnModeCombat').addEventListener('click', () => this.setMode(AvionicsEnums.SimMode.FLIGHT_SIM));
    document.getElementById('btnModeCad').addEventListener('click', () => this.setMode(AvionicsEnums.SimMode.CAD_STUDIO));
    document.getElementById('btnModeHangar').addEventListener('click', () => this.setMode(AvionicsEnums.SimMode.HANGAR_UPGRADE));

    // Fullscreen Toggle
    document.getElementById('btnFullscreenToggle').addEventListener('click', () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    });

    // Weapon Action Deck Buttons (Click & Hold Firing Support)
    const gunBtn = document.getElementById('fireChainGunBtn');
    const startGun = (e) => { e.preventDefault(); this.isFiring30mm = true; };
    const stopGun = () => { this.isFiring30mm = false; };
    gunBtn.addEventListener('pointerdown', startGun);
    window.addEventListener('pointerup', stopGun);
    window.addEventListener('pointercancel', stopGun);

    document.getElementById('fireHydraBtn').addEventListener('click', () => this.fireWeapon('HYDRA'));
    document.getElementById('fireHellfireBtn').addEventListener('click', () => this.fireWeapon('HELLFIRE'));
    document.getElementById('fireSuperSmashBtn').addEventListener('click', () => this.fireWeapon('SUPER_SMASH'));
    document.getElementById('deployFlaresBtn').addEventListener('click', () => this.fireWeapon('FLARE'));
    document.getElementById('rearmRepairBtn').addEventListener('click', () => {
      this.ammo30mm = 1200; this.ammoHydra = 38; this.ammoHellfire = 8; this.flareCount = 60;
      this.physics.health = this.physics.maxHealth;
      showToast('AH-64E Fully Rearmed & Repaired to 100%!');
      this.athenaAi.speak("Rearm complete.");
    });

    document.getElementById('lockNextTargetBtn').addEventListener('click', () => {
      const alive = this.simRenderer.hostileTargets.filter(t => !t.destroyed);
      if (alive.length > 0) {
        this.simRenderer.selectedTargetIndex = (this.simRenderer.selectedTargetIndex + 1) % this.simRenderer.hostileTargets.length;
        const cur = this.simRenderer.hostileTargets[this.simRenderer.selectedTargetIndex];
        this.athenaAi.speak(`Target locked: ${cur.id}`);
      }
    });

    // Quick Liftoff & Hover Buttons
    document.getElementById('btnQuickLiftoff').addEventListener('click', () => {
      this.physics.inputs.collective = 0.52;
      this.physics.isGrounded = false;
      document.getElementById('simCollectiveInput').value = 52;
      document.getElementById('simCollectiveLabel').textContent = '52%';
      showToast('Engines Spooled! Airborne at Climb Collective.');
    });
    document.getElementById('btnQuickHover').addEventListener('click', () => {
      this.physics.inputs.collective = 0.43;
      this.athenaAi.autopilotMode = AvionicsEnums.AutopilotMode.AUTO_HOVER;
      showToast('Auto-Hover Stabilizer Engaged (43%).');
    });

    // Keyboard bindings
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') { this.isFiring30mm = true; e.preventDefault(); }
      if (e.code === 'KeyF') this.fireWeapon('HYDRA');
      if (e.code === 'KeyG') this.fireWeapon('HELLFIRE');
      if (e.code === 'KeyC') this.fireWeapon('FLARE');
      if (e.code === 'KeyT') document.getElementById('lockNextTargetBtn').click();
      if (e.code === 'KeyR') document.getElementById('rearmRepairBtn').click();
      if (e.code === 'KeyH') document.getElementById('btnQuickHover').click();
      if (e.code === 'KeyZ') document.getElementById('btnQuickLiftoff').click();
    });
    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') this.isFiring30mm = false;
    });

    // Virtual Thumbstick Dragging (Cyclic Pitch/Roll)
    const stickPad = document.getElementById('virtualStickPad');
    const stickKnob = document.getElementById('virtualStickKnob');
    let draggingStick = false;

    const onStickMove = (clientX, clientY) => {
      if (!draggingStick) return;
      const rect = stickPad.getBoundingClientRect();
      const radius = rect.width * 0.42;
      const dx = clientX - (rect.left + rect.width * 0.5);
      const dy = clientY - (rect.top + rect.height * 0.5);
      const dist = Math.hypot(dx, dy);
      const clampedDist = Math.min(radius, dist);
      const angle = Math.atan2(dy, dx);

      const knobX = Math.cos(angle) * clampedDist;
      const knobY = Math.sin(angle) * clampedDist;
      stickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

      // Map to Cyclic Inputs
      this.physics.inputs.cyclicRoll = knobX / radius;
      this.physics.inputs.cyclicPitch = -knobY / radius;
    };

    stickPad.addEventListener('pointerdown', (e) => {
      draggingStick = true;
      onStickMove(e.clientX, e.clientY);
    });
    window.addEventListener('pointermove', (e) => onStickMove(e.clientX, e.clientY));
    window.addEventListener('pointerup', () => {
      draggingStick = false;
      stickKnob.style.transform = 'translate(0px, 0px)';
      this.physics.inputs.cyclicRoll = 0;
      this.physics.inputs.cyclicPitch = 0;
    });

    // Autopilot Buttons
    document.getElementById('apManualBtn').addEventListener('click', () => { this.athenaAi.autopilotMode = AvionicsEnums.AutopilotMode.MANUAL; showToast('Autopilot: Manual Control'); });
    document.getElementById('apHoverBtn').addEventListener('click', () => { this.athenaAi.autopilotMode = AvionicsEnums.AutopilotMode.AUTO_HOVER; showToast('Autopilot: Auto-Hover Lock'); });
    document.getElementById('apOrbitBtn').addEventListener('click', () => { this.athenaAi.autopilotMode = AvionicsEnums.AutopilotMode.ORBIT_STRIKE; showToast('Autopilot: Hands-Free Orbit Strike'); });
    document.getElementById('apEngageBtn').addEventListener('click', () => { this.athenaAi.autopilotMode = AvionicsEnums.AutopilotMode.DOGFIGHT_ENGAGE; showToast('Autopilot: Autonomous Dogfight Engage'); });
    document.getElementById('apRtbBtn').addEventListener('click', () => { this.athenaAi.autopilotMode = AvionicsEnums.AutopilotMode.RTB_LANDING; showToast('Autopilot: Return to Helipad'); });

    // Hangar Upgrade Buttons
    document.getElementById('btnHangarStartMission').addEventListener('click', () => this.setMode(AvionicsEnums.SimMode.FLIGHT_SIM));
    document.getElementById('btnHangarBackToCombat').addEventListener('click', () => this.setMode(AvionicsEnums.SimMode.FLIGHT_SIM));

    document.getElementById('btnUpgradeHp').addEventListener('click', () => {
      if (HangarEconomy.goldCoins >= 200) {
        HangarEconomy.goldCoins -= 200;
        HangarEconomy.upgrades.hp.level++;
        this.physics.maxHealth += 250;
        this.physics.health = this.physics.maxHealth;
        showToast('Upgraded HP Armor (+250 HP)!');
        this.updateHangarUI();
      } else { showToast('Not enough Gold Coins!'); }
    });
    document.getElementById('btnUpgradeSpeed').addEventListener('click', () => {
      if (HangarEconomy.goldCoins >= 180) {
        HangarEconomy.goldCoins -= 180;
        HangarEconomy.upgrades.speed.level++;
        showToast('Upgraded Turboshaft Speed (+15 KTS)!');
        this.updateHangarUI();
      } else { showToast('Not enough Gold Coins!'); }
    });
    document.getElementById('btnUpgradeAgility').addEventListener('click', () => {
      if (HangarEconomy.goldCoins >= 150) {
        HangarEconomy.goldCoins -= 150;
        HangarEconomy.upgrades.agility.level++;
        showToast('Upgraded Flight Agility (+12%)!');
        this.updateHangarUI();
      } else { showToast('Not enough Gold Coins!'); }
    });
    document.getElementById('btnUpgradeAutoAim').addEventListener('click', () => {
      if (HangarEconomy.goldCoins >= 250) {
        HangarEconomy.goldCoins -= 250;
        HangarEconomy.upgrades.autoAim.level++;
        showToast('Upgraded AI Auto-Aim Range (+50M)!');
        this.updateHangarUI();
      } else { showToast('Not enough Gold Coins!'); }
    });

    // Theater Switcher
    document.getElementById('theaterSelectDropdown').addEventListener('change', (e) => {
      this.geodetic.currentTheaterKey = e.target.value;
      showToast(`Theater Deployed: ${this.geodetic.theaters[e.target.value].name}`);
    });
  }

  updateHangarUI() {
    document.getElementById('hangarGoldCoinsReadout').textContent = String(HangarEconomy.goldCoins);
    document.getElementById('hangarDiamondsReadout').textContent = String(HangarEconomy.diamonds);
    document.getElementById('walletCoinsReadout').textContent = String(HangarEconomy.goldCoins);
    document.getElementById('walletGemsReadout').textContent = String(HangarEconomy.diamonds);
  }

  setMode(mode) {
    this.activeAppMode = mode;
    const combatOverlay = document.getElementById('combatHudOverlay');
    const hangarOverlay = document.getElementById('hangarUpgradeOverlay');
    const leftSidebar = document.getElementById('leftCadSidebar');
    const cadBottom = document.getElementById('cadBottomToolbar');
    const cadCams = document.getElementById('cadCameraPresetsBar');

    if (mode === AvionicsEnums.SimMode.FLIGHT_SIM) {
      combatOverlay.classList.remove('hidden');
      hangarOverlay.classList.add('hidden');
      if (leftSidebar) leftSidebar.classList.add('hidden');
      if (cadBottom) cadBottom.classList.add('hidden');
      if (cadCams) cadCams.classList.add('hidden');
      this.simRenderer.combatWorldGroup.visible = true;

    } else if (mode === AvionicsEnums.SimMode.CAD_STUDIO) {
      combatOverlay.classList.add('hidden');
      hangarOverlay.classList.add('hidden');
      if (leftSidebar) leftSidebar.classList.remove('hidden');
      if (cadBottom) cadBottom.classList.remove('hidden');
      if (cadCams) cadCams.classList.remove('hidden');
      this.simRenderer.combatWorldGroup.visible = false;

    } else if (mode === AvionicsEnums.SimMode.HANGAR_UPGRADE) {
      combatOverlay.classList.add('hidden');
      hangarOverlay.classList.remove('hidden');
      if (leftSidebar) leftSidebar.classList.add('hidden');
      if (cadBottom) cadBottom.classList.add('hidden');
      if (cadCams) cadCams.classList.add('hidden');
      this.simRenderer.combatWorldGroup.visible = false;
      this.updateHangarUI();
    }
  }

  updateFrame() {
    const dt = Math.min(this.clock.getDelta(), 0.05);

    // Continuous 30mm Vulcan Gatling firing
    if (this.isFiring30mm) {
      const now = performance.now();
      if (now - this.lastGunFireTime > 95) {
        this.fireWeapon('30MM');
        this.lastGunFireTime = now;
      }
    }

    if (this.activeAppMode === AvionicsEnums.SimMode.FLIGHT_SIM) {
      // Step Physics & AI
      this.physics.update(dt);
      this.athenaAi.updateAutopilot(dt, this.physics, this.simRenderer, this);
      this.athenaAi.evaluateThreats(this.physics, this.simRenderer, this);
      this.simRenderer.update(dt, this.physics, this);

      // Update 3D Helicopter Transform
      masterAssembly.position.copy(this.physics.position);
      masterAssembly.quaternion.copy(this.physics.quaternion);

      // Spin main & tail rotors
      if (mainRotorSpinnerGroup) mainRotorSpinnerGroup.rotation.y += 0.45;
      if (tailRotorSpinnerGroup) tailRotorSpinnerGroup.rotation.x += 1.8;

      // Smooth Chase Camera
      const heliPos = this.physics.position;
      const camOffset = new THREE.Vector3(0, 4.2, -14.0).applyQuaternion(this.physics.quaternion);
      camera.position.lerp(heliPos.clone().add(camOffset), 0.12);
      camera.lookAt(heliPos.clone().add(new THREE.Vector3(0, 1.2, 8.0).applyQuaternion(this.physics.quaternion)));

      // Render 2D HUD
      this.hud.render(camera);

      // Update HUD Numbers
      const knots = Math.round(this.physics.velocity.length() * PhysicsConstants.scalars.MPS_TO_KNOTS);
      const agl = Math.round(this.physics.position.y - this.geodetic.getTerrainHeight(this.physics.position.x, this.physics.position.z));
      document.getElementById('hudKnotsReadout').textContent = `${knots} KTS`;
      document.getElementById('hudAltReadout').textContent = `${agl} FT`;

      // Update Floating Segmented Armor Bar (from Screenshot 4)
      const healthPct = this.physics.health / this.physics.maxHealth;
      for (let s = 1; s <= 6; s++) {
        const seg = document.getElementById(`armorSeg${s}`);
        if (seg) {
          if (s / 6.0 <= healthPct) seg.classList.remove('damaged');
          else seg.classList.add('damaged');
        }
      }

      // Update Mission Objective Banner
      const aliveWarships = this.simRenderer.hostileTargets.filter(t => !t.destroyed).length;
      document.getElementById('missionObjectiveReadout').innerHTML = `DESTROY WARSHIPS &amp; BOTS: <span class="text-rose-400">${this.simRenderer.waveKills}/${this.simRenderer.hostileTargets.length}</span>`;

      // Update Target Lock Card
      const curTgt = this.simRenderer.hostileTargets[this.simRenderer.selectedTargetIndex];
      if (curTgt) {
        document.getElementById('lockedTargetLabel').textContent = `${curTgt.id} ${curTgt.type}`;
        const distKm = (this.physics.position.distanceTo(curTgt.position) / 1000).toFixed(1);
        document.getElementById('lockedTargetDist').textContent = `${distKm} KM`;
        const hpPct = Math.round((curTgt.health / curTgt.maxHealth) * 100);
        document.getElementById('lockedTargetHpBar').style.width = `${hpPct}%`;
      }
    } else if (this.activeAppMode === AvionicsEnums.SimMode.HANGAR_UPGRADE) {
      // Rotate Helicopter on Turntable
      masterAssembly.rotation.y += 0.01;
      camera.position.set(0, 3.5, 12);
      camera.lookAt(0, 1.2, 0);
    }
  }
}
