/**
 * =========================================================================================
 * ElectronicWarfareSuite.js - Electronic Warfare & Radar Suite (RWR & CMDS)
 * -----------------------------------------------------------------------------------------
 * Implements:
 * 1. Radar Warning Receiver (RWR) Electromagnetic Simulation:
 *    - 360-degree emitter polling & azimuth tracking mapped to -180° to +180°
 *    - Status classification state machine: SEARCH (> 500m), TRACK (<= 500m), LOCK (missile guidance)
 *    - Line-of-sight raycast terrain masking verification
 *    - Procedural audio frequency blueprint:
 *      * SEARCH: Slow alternating beep pattern (1Hz pulse rate)
 *      * TRACK: Rapid aggressive beep pattern (5Hz pulse rate)
 *      * LOCK: Continuous high-pitched warning tone (constant execution)
 *      * Full Web Audio API procedural oscillator synthesis implementation
 * 2. Automated Countermeasures Dispensing System (CMDS):
 *    - Instantaneous LOCK intercept state monitor
 *    - Time-locked 0.25-second dispense interval thread
 *    - Programmatic physical object instantiation behind vehicle exhaust nodes:
 *      * Flare: Randomized lateral ejection velocity, 3.0s thermal decoy radius decay curve
 *      * Chaff: Zero initial velocity, expanding reflective dipole cloud & localized EM noise field
 *    - Missile Tracking Decoy Logic:
 *      * Probabilistic trajectory intercept algorithm overriding missile target transforms
 *
 * Engine Target: PlayCanvas Engine & Standalone Simulation Architecture
 * Zero-Dependency Architecture: Self-contained vector math and procedural audio synthesis.
 * =========================================================================================
 */

'use strict';

/**
 * RWR Operational Threat Alert Levels
 */
const RWR_STATUS = {
    NONE: 'NONE',
    SEARCH: 'SEARCH',
    TRACK: 'TRACK',
    LOCK: 'LOCK'
};

/**
 * Radar Emitter Classification Types
 */
const EMITTER_TYPE = {
    SURFACE_SEARCH_RADAR: 'SURFACE_SEARCH_RADAR',
    TRACKING_RADAR: 'TRACKING_RADAR',
    FIRE_CONTROL_RADAR: 'FIRE_CONTROL_RADAR',
    MISSILE_SEEKER_RADAR: 'MISSILE_SEEKER_RADAR',
    MISSILE_SEEKER_IR: 'MISSILE_SEEKER_IR'
};

/**
 * Generic 3D Vector for EW Suite
 */
class EWVector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = Number(x) || 0;
        this.y = Number(y) || 0;
        this.z = Number(z) || 0;
    }

    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    clone() { return new EWVector3(this.x, this.y, this.z); }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    scale(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
    normalize() {
        const l = this.length();
        if (l > 1e-6) { this.x /= l; this.y /= l; this.z /= l; }
        return this;
    }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
}

/**
 * Radar Emitter Entity Interface definition
 */
class EnemyRadarEmitter {
    constructor(id, type, position, forwardDirection, isEmitting = true, sweepAngleDeg = 60.0) {
        this.id = id;
        this.type = type; // EMITTER_TYPE
        this.position = position.clone();
        this.forward = forwardDirection.clone().normalize();
        this.isEmitting = isEmitting;
        this.sweepAngleDeg = sweepAngleDeg;
        this.isLockedOnPlayer = false;
        this.carrierFrequencyGHz = 10.5; // X-Band fire control
        this.pulseRepetitionFreqHz = 3500;
    }
}

/**
 * Telemetry record for a tracked threat inside the RWR grid
 */
class RWRThreatContact {
    constructor(emitterId, type) {
        this.emitterId = emitterId;
        this.type = type;
        this.azimuthDeg = 0.0;           // -180.0 to +180.0 degrees relative to vehicle nose
        this.clockBearing = 12;          // 1 to 12 clock notation
        this.distanceMeters = 0.0;
        this.status = RWR_STATUS.NONE;
        this.signalStrength = 0.0;       // 0.0 to 1.0
        this.hasLineOfSight = true;
        this.lastSeenTime = 0.0;
    }
}

/**
 * Procedural Audio Threat Tone Generator using Web Audio API
 */
class RWRToneSynthesizer {
    constructor() {
        this.audioCtx = null;
        this.oscillator = null;
        this.gainNode = null;
        this.initialized = false;
        this.currentStatus = RWR_STATUS.NONE;
        this.pulseTimer = 0.0;
        this.pulseState = false;

        // Frequencies according to military RWR specifications
        this.freqSearchLow = 600;   // 600 Hz
        this.freqSearchHigh = 800;  // 800 Hz
        this.freqTrackLow = 950;    // 950 Hz
        this.freqTrackHigh = 1250;  // 1250 Hz
        this.freqLock = 2400;       // 2400 Hz continuous warble
    }

    init() {
        try {
            const AudioContextClass = (typeof window !== 'undefined') &&
                (window.AudioContext || window.webkitAudioContext);
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();
                this.gainNode = this.audioCtx.createGain();
                this.gainNode.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
                this.gainNode.connect(this.audioCtx.destination);
                this.initialized = true;
            }
        } catch (e) {
            this.initialized = false;
        }
    }

    startTone(freq) {
        if (!this.initialized || !this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        if (!this.oscillator) {
            this.oscillator = this.audioCtx.createOscillator();
            this.oscillator.type = 'sawtooth';
            this.oscillator.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
            this.oscillator.connect(this.gainNode);
            this.oscillator.start();
        } else {
            this.oscillator.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        }
        this.gainNode.gain.setValueAtTime(0.15, this.audioCtx.currentTime);
    }

    stopTone() {
        if (!this.initialized || !this.audioCtx || !this.gainNode) return;
        this.gainNode.gain.setValueAtTime(0.0, this.audioCtx.currentTime);
    }

    /**
     * Update tone modulation based on highest active RWR status
     * @param {string} status Highest threat level
     * @param {number} dt Delta time
     */
    update(status, dt) {
        this.currentStatus = status;
        this.pulseTimer += dt;

        switch (status) {
            case RWR_STATUS.SEARCH: {
                // 1 Hz alternating pulse rate (0.5s ON, 0.5s OFF)
                const cycle = this.pulseTimer % 1.0;
                if (cycle < 0.25) {
                    this.startTone(this.freqSearchLow);
                } else if (cycle < 0.50) {
                    this.startTone(this.freqSearchHigh);
                } else {
                    this.stopTone();
                }
                break;
            }
            case RWR_STATUS.TRACK: {
                // 5 Hz rapid aggressive pulse rate (0.1s ON, 0.1s OFF)
                const cycle = this.pulseTimer % 0.2;
                if (cycle < 0.10) {
                    this.startTone((this.pulseTimer % 0.4 < 0.2) ? this.freqTrackLow : this.freqTrackHigh);
                } else {
                    this.stopTone();
                }
                break;
            }
            case RWR_STATUS.LOCK: {
                // Constant continuous high-pitched warning tone
                this.startTone(this.freqLock);
                break;
            }
            case RWR_STATUS.NONE:
            default:
                this.stopTone();
                break;
        }
    }
}

/**
 * Physical Flare Object Entity
 * Deployed behind exhaust nodes for heat-seeking missile diversion
 */
class ActiveFlare {
    constructor(id, originPosition, ejectionVelocity, forwardVector) {
        this.id = id;
        this.position = originPosition.clone();
        this.velocity = ejectionVelocity.clone();
        this.forward = forwardVector.clone();
        this.burnLifeSeconds = 3.0; // 3.0-second burn life
        this.initialDecoyRadius = 150.0; // 150 meters thermal spoofing radius
        this.currentDecoyRadius = 150.0;
        this.elapsed = 0.0;
        this.isDepleted = false;
        this.temperatureKelvin = 2200.0; // Magnesium flare combustion
    }

    update(dt) {
        if (this.isDepleted) return;

        this.elapsed += dt;
        if (this.elapsed >= this.burnLifeSeconds) {
            this.isDepleted = true;
            this.currentDecoyRadius = 0.0;
            return;
        }

        // Apply ballistic gravity & aerodynamic drag
        this.velocity.y -= 9.80665 * dt;
        this.velocity.scale(1.0 - 0.45 * dt);
        this.position.add(this.velocity.clone().scale(dt));

        // Linear decay of thermal decoy radius over 3.0 seconds
        const lifeRatio = 1.0 - (this.elapsed / this.burnLifeSeconds);
        this.currentDecoyRadius = this.initialDecoyRadius * lifeRatio;
        this.temperatureKelvin = 300.0 + (1900.0 * lifeRatio);
    }
}

/**
 * Physical Chaff Cloud Object Entity
 * Expands reflective aluminum dipole strips creating EM noise field
 */
class ActiveChaffCloud {
    constructor(id, originPosition) {
        this.id = id;
        this.position = originPosition.clone();
        this.velocity = new EWVector3(0, 0, 0); // Zero initial velocity (blooms in slipstream)
        this.expansionVelocity = 25.0; // Expands outward at 25 m/s
        this.initialRadius = 5.0;
        this.currentRadius = 5.0;
        this.maxRadius = 75.0;
        this.burnLifeSeconds = 6.0;
        this.elapsed = 0.0;
        this.isDepleted = false;
        this.radarCrossSectionSqM = 1500.0; // Massive false radar return
    }

    update(dt) {
        if (this.isDepleted) return;

        this.elapsed += dt;
        if (this.elapsed >= this.burnLifeSeconds) {
            this.isDepleted = true;
            this.currentRadius = 0.0;
            this.radarCrossSectionSqM = 0.0;
            return;
        }

        // Chaff drifts slowly with wind/gravity
        this.position.y -= 1.2 * dt;

        // Cloud expands rapidly then disperses
        if (this.currentRadius < this.maxRadius) {
            this.currentRadius += this.expansionVelocity * dt;
            if (this.currentRadius > this.maxRadius) this.currentRadius = this.maxRadius;
        }

        // Radar reflection degrades as strips disperse
        const dissipation = 1.0 - (this.elapsed / this.burnLifeSeconds);
        this.radarCrossSectionSqM = 1500.0 * Math.max(0.0, dissipation);
    }
}

/**
 * Mock/Interface definition for incoming hostile missile tracker
 */
class HostileMissile {
    constructor(id, seekerType, position, velocity, targetTransform) {
        this.id = id;
        this.seekerType = seekerType; // 'HEAT_SEEKING' or 'RADAR_GUIDED'
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.targetTransform = targetTransform; // Pointer to helicopter or decoy
        this.isDecoyed = false;
        this.decoyTarget = null;
    }
}

/**
 * Main Electronic Warfare Suite Component
 */
class ElectronicWarfareSuite {
    constructor(app, helicopterEntity) {
        this.app = app;
        this.entity = helicopterEntity;

        // Helicopter spatial state
        this.helicopterPosition = new EWVector3(0, 15, 0);
        this.helicopterForward = new EWVector3(0, 0, 1);
        this.helicopterUp = new EWVector3(0, 1, 0);
        this.helicopterRight = new EWVector3(1, 0, 0);

        // Active threat database
        this.trackedThreats = new Map(); // id -> RWRThreatContact
        this.highestThreatStatus = RWR_STATUS.NONE;

        // Procedural Audio Synthesizer
        this.audioSynthesizer = new RWRToneSynthesizer();

        // CMDS Hardware Inventory
        this.flareCount = 60;
        this.chaffCount = 60;
        this.isCMDSAutoArmed = true;

        // Dispense interval timer (time-locked 0.25-second execution loop)
        this.dispenseIntervalSeconds = 0.25;
        this.dispenseTimer = 0.0;

        // Active deployed countermeasure pools
        this.activeFlares = [];
        this.activeChaffs = [];
        this.nextCountermeasureId = 1;

        // Telemetry counters
        this.totalFlaresDispensed = 0;
        this.totalChaffDispensed = 0;
        this.activeMissileLocksCount = 0;
    }

    init() {
        this.audioSynthesizer.init();
    }

    /**
     * Synchronize helicopter vectors
     */
    updateHelicopterVectors() {
        if (!this.entity) return;

        if (this.entity.getPosition) {
            const p = this.entity.getPosition();
            this.helicopterPosition.set(p.x, p.y, p.z);
        }
        if (this.entity.forward) {
            this.helicopterForward.set(this.entity.forward.x, this.entity.forward.y, this.entity.forward.z).normalize();
        }
        if (this.entity.up) {
            this.helicopterUp.set(this.entity.up.x, this.entity.up.y, this.entity.up.z).normalize();
        }
        if (this.entity.right) {
            this.helicopterRight.set(this.entity.right.x, this.entity.right.y, this.entity.right.z).normalize();
        }
    }

    /**
     * Map relative azimuth angle to normalized -180 to +180 grid and clock bearing
     * @param {EWVector3} emitterPos Emitter world position
     * @returns {{azimuthDeg: number, clockBearing: number, distance: number}}
     */
    calculateThreatAzimuth(emitterPos) {
        const offset = emitterPos.clone().sub(this.helicopterPosition);
        const distance = offset.length();
        if (distance < 1e-4) {
            return { azimuthDeg: 0, clockBearing: 12, distance: 0 };
        }

        // Project offset onto the helicopter's horizontal plane
        const forwardDot = offset.dot(this.helicopterForward);
        const rightDot = offset.dot(this.helicopterRight);

        // atan2(right, forward) yields angle in radians where 0 is nose, positive is right, negative is left
        let azimuthRad = Math.atan2(rightDot, forwardDot);
        let azimuthDeg = azimuthRad * (180.0 / Math.PI);

        // Map to 1-12 clock bearing: 12 is straight ahead, 3 is right, 6 is behind, 9 is left
        let clock = Math.round(((azimuthDeg + 360.0) % 360.0) / 30.0);
        if (clock === 0) clock = 12;

        return { azimuthDeg, clockBearing: clock, distance };
    }

    /**
     * Radar Warning Receiver Active Polling Loop
     * Evaluates all emitters in the scene, computes azimuths, status levels, and highest threat
     * @param {Array<EnemyRadarEmitter>} enemyEmitters List of active radar sources
     * @param {Function} lineOfSightRaycast Check if terrain blocks emitter beam: (start, end) => boolean
     */
    pollRadarEmitters(enemyEmitters, lineOfSightRaycast = null) {
        this.updateHelicopterVectors();

        let highestLevel = RWR_STATUS.NONE;
        let lockCount = 0;
        const currentActiveIds = new Set();

        for (let i = 0; i < enemyEmitters.length; i++) {
            const emitter = enemyEmitters[i];
            if (!emitter.isEmitting) continue;

            currentActiveIds.add(emitter.id);

            // Compute azimuth, clock bearing, and distance
            const { azimuthDeg, clockBearing, distance } = this.calculateThreatAzimuth(emitter.position);

            // Verify line-of-sight raycast against terrain geometry
            let hasLOS = true;
            if (typeof lineOfSightRaycast === 'function') {
                hasLOS = lineOfSightRaycast(emitter.position, this.helicopterPosition);
            }

            let threatContact = this.trackedThreats.get(emitter.id);
            if (!threatContact) {
                threatContact = new RWRThreatContact(emitter.id, emitter.type);
                this.trackedThreats.set(emitter.id, threatContact);
            }

            threatContact.azimuthDeg = azimuthDeg;
            threatContact.clockBearing = clockBearing;
            threatContact.distanceMeters = distance;
            threatContact.hasLineOfSight = hasLOS;

            if (!hasLOS) {
                threatContact.status = RWR_STATUS.NONE;
                continue;
            }

            // Determine operational status based on specifications:
            // LOCK: Active missile guidance radar beam tracking player
            // TRACK: Line of sight established, distance <= 500 meters, sweep focused on player
            // SEARCH: Line of sight established, distance > 500 meters
            if (emitter.isLockedOnPlayer) {
                threatContact.status = RWR_STATUS.LOCK;
                lockCount++;
            } else if (distance <= 500.0) {
                // Check if emitter's forward vector sweeps towards helicopter
                const dirToHeli = this.helicopterPosition.clone().sub(emitter.position).normalize();
                const beamCos = emitter.forward.dot(dirToHeli);
                const thresholdCos = Math.cos((emitter.sweepAngleDeg * 0.5) * (Math.PI / 180.0));

                if (beamCos >= thresholdCos) {
                    threatContact.status = RWR_STATUS.TRACK;
                } else {
                    threatContact.status = RWR_STATUS.SEARCH;
                }
            } else {
                threatContact.status = RWR_STATUS.SEARCH;
            }

            // Evaluate highest priority threat level
            if (threatContact.status === RWR_STATUS.LOCK) {
                highestLevel = RWR_STATUS.LOCK;
            } else if (threatContact.status === RWR_STATUS.TRACK && highestLevel !== RWR_STATUS.LOCK) {
                highestLevel = RWR_STATUS.TRACK;
            } else if (threatContact.status === RWR_STATUS.SEARCH && highestLevel === RWR_STATUS.NONE) {
                highestLevel = RWR_STATUS.SEARCH;
            }
        }

        // Clean up stale emitters
        for (const [id] of this.trackedThreats) {
            if (!currentActiveIds.has(id)) {
                this.trackedThreats.delete(id);
            }
        }

        this.highestThreatStatus = highestLevel;
        this.activeMissileLocksCount = lockCount;
    }

    /**
     * Automated Countermeasures Dispensing System (CMDS) Execution Routine
     * Monitors RWR state and fires flares/chaff at 0.25-second time-locked intervals under LOCK
     * @param {number} dt Delta time
     */
    updateCMDS(dt) {
        // Update all active flares and chaff clouds in flight
        for (let i = this.activeFlares.length - 1; i >= 0; i--) {
            const flare = this.activeFlares[i];
            flare.update(dt);
            if (flare.isDepleted) {
                this.activeFlares.splice(i, 1);
            }
        }

        for (let i = this.activeChaffs.length - 1; i >= 0; i--) {
            const chaff = this.activeChaffs[i];
            chaff.update(dt);
            if (chaff.isDepleted) {
                this.activeChaffs.splice(i, 1);
            }
        }

        // Lock Evaluation Intercept: Auto-dispense loop
        if (this.isCMDSAutoArmed && this.highestThreatStatus === RWR_STATUS.LOCK) {
            this.dispenseTimer += dt;
            if (this.dispenseTimer >= this.dispenseIntervalSeconds) {
                this.dispenseTimer = 0.0;
                this.dispenseSalvo();
            }
        } else {
            this.dispenseTimer = 0.0;
        }

        // Update Audio Synthesizer Tone
        this.audioSynthesizer.update(this.highestThreatStatus, dt);
    }

    /**
     * Programmatic generation routine instantiating physical Flare & Chaff objects
     * Deploys behind the vehicle exhaust nodes
     */
    dispenseSalvo() {
        // Locate vehicle exhaust nodes (left and right exhausts at tail-boom junction)
        const exhaustOffsetLeft = this.helicopterPosition.clone()
            .add(this.helicopterForward.clone().scale(-3.5))
            .add(this.helicopterRight.clone().scale(-1.2))
            .add(this.helicopterUp.clone().scale(0.8));

        const exhaustOffsetRight = this.helicopterPosition.clone()
            .add(this.helicopterForward.clone().scale(-3.5))
            .add(this.helicopterRight.clone().scale(1.2))
            .add(this.helicopterUp.clone().scale(0.8));

        // Dispense Flare (for IR threats) if available
        if (this.flareCount > 0) {
            this.flareCount -= 2;
            this.totalFlaresDispensed += 2;

            // Randomized lateral ejection velocity vectors
            const lateralLeft = this.helicopterRight.clone().scale(-18.0 + (Math.random() * -6.0))
                .add(this.helicopterUp.clone().scale(4.0 + Math.random() * 4.0))
                .add(this.helicopterForward.clone().scale(-12.0));

            const lateralRight = this.helicopterRight.clone().scale(18.0 + (Math.random() * 6.0))
                .add(this.helicopterUp.clone().scale(4.0 + Math.random() * 4.0))
                .add(this.helicopterForward.clone().scale(-12.0));

            const flareL = new ActiveFlare(`FLARE_${this.nextCountermeasureId++}`, exhaustOffsetLeft, lateralLeft, this.helicopterForward);
            const flareR = new ActiveFlare(`FLARE_${this.nextCountermeasureId++}`, exhaustOffsetRight, lateralRight, this.helicopterForward);

            this.activeFlares.push(flareL, flareR);
        }

        // Dispense Chaff (for Radar threats) if available
        if (this.chaffCount > 0) {
            this.chaffCount -= 1;
            this.totalChaffDispensed += 1;

            const exhaustCenter = this.helicopterPosition.clone()
                .add(this.helicopterForward.clone().scale(-4.0))
                .add(this.helicopterUp.clone().scale(0.5));

            const chaff = new ActiveChaffCloud(`CHAFF_${this.nextCountermeasureId++}`, exhaustCenter);
            this.activeChaffs.push(chaff);
        }
    }

    /**
     * Intercept function: Evaluates and modifies trajectory of an incoming enemy missile
     * Overrides internal target tracker from helicopter transform to countermeasure transform
     * @param {HostileMissile} missile Incoming missile object
     * @returns {boolean} True if missile was successfully diverted/spoofed
     */
    evaluateMissileDecoy(missile) {
        if (missile.isDecoyed) return true;

        if (missile.seekerType === 'HEAT_SEEKING') {
            // Heat-seeking missile evaluates active flares
            for (let i = 0; i < this.activeFlares.length; i++) {
                const flare = this.activeFlares[i];
                if (flare.isDepleted) continue;

                const distToFlare = missile.position.clone().sub(flare.position).length();
                const distToHeli = missile.position.clone().sub(this.helicopterPosition).length();

                // If flare is within proximity of seeker and thermal radius exceeds threshold
                if (distToFlare < flare.currentDecoyRadius) {
                    // Probability based on flare temperature vs distance ratio
                    const decoyProbability = Math.min(0.95, (flare.temperatureKelvin / 2200.0) * (distToHeli / (distToFlare + 1.0)));
                    if (Math.random() < decoyProbability) {
                        missile.isDecoyed = true;
                        missile.decoyTarget = flare;
                        // Override missile's internal target tracker reference to flare position
                        missile.targetTransform = flare;
                        return true;
                    }
                }
            }
        } else if (missile.seekerType === 'RADAR_GUIDED') {
            // Radar-guided missile evaluates active chaff clouds
            for (let i = 0; i < this.activeChaffs.length; i++) {
                const chaff = this.activeChaffs[i];
                if (chaff.isDepleted) continue;

                const distToChaff = missile.position.clone().sub(chaff.position).length();

                // If missile enters or is adjacent to expanding chaff cloud collider
                if (distToChaff < chaff.currentRadius * 1.5) {
                    // Massive RCS override calculation
                    const heliRCS = 4.5; // Apache frontal RCS in m^2
                    const chaffRCS = chaff.radarCrossSectionSqM;
                    const rcsRatio = chaffRCS / (chaffRCS + heliRCS); // Typically > 0.99

                    if (Math.random() < rcsRatio) {
                        missile.isDecoyed = true;
                        missile.decoyTarget = chaff;
                        // Override missile's target reference to chaff cloud center
                        missile.targetTransform = chaff;
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Full EW Suite Physics/Logic Tick
     */
    update(dt, enemyEmitters = [], lineOfSightRaycast = null) {
        this.pollRadarEmitters(enemyEmitters, lineOfSightRaycast);
        this.updateCMDS(dt);
    }
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        RWR_STATUS,
        EMITTER_TYPE,
        EWVector3,
        EnemyRadarEmitter,
        RWRThreatContact,
        RWRToneSynthesizer,
        ActiveFlare,
        ActiveChaffCloud,
        HostileMissile,
        ElectronicWarfareSuite
    };
}
if (typeof window !== 'undefined') {
    window.ElectronicWarfareSuite = ElectronicWarfareSuite;
    window.RWR_STATUS = RWR_STATUS;
    window.EMITTER_TYPE = EMITTER_TYPE;
}
