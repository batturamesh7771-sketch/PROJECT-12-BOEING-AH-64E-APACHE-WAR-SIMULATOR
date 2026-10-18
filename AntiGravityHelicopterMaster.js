/**
 * =========================================================================================
 * AntiGravityHelicopterMaster.js - Master Combat Vehicle Avionics & Physics Controller
 * -----------------------------------------------------------------------------------------
 * Implements:
 * 1. Central Rigidbody Flight Dynamics Architecture:
 *    - Continuous anti-gravity vertical thrust counteracting world gravity
 *    - Aerodynamic drag calculations: F_drag = -0.5 * rho * Cd * A * |v| * v
 *    - 3-axis angular damping: tau_damp = -I_damp * omega
 *    - Center-of-mass balancing & automatic counter-torque against asymmetrical weapon loads
 * 2. Complete Integration of all 4 Subsystems:
 *    - System 1: GNCSystem (PID 3D Hover & Predictive TFR Kinematics)
 *    - System 2: ElectronicWarfareSuite (RWR Azimuth Polling, Procedural Audio & CMDS Flares/Chaff)
 *    - System 3: TacticalDataLink (Link 16 Data Bus & FCR 90° Threat Index Weight Sorting)
 *    - System 4: StoresManagementSystem (Dynamic Mass/CoM Recalculation & 5-Page MFD Stream)
 * 3. Pilot Flight Control Translators:
 *    - Cyclic pitch / roll, anti-torque pedals (yaw), and collective altitude command
 *    - Seamless blending between Pilot Manual Stick and GNC Auto-Hover / Terrain Following
 *
 * Engine Target: PlayCanvas Engine & Standalone Simulation Architecture
 * Zero-Dependency Architecture: Native mathematical physics, vector calculations, and no external plugins.
 * =========================================================================================
 */

'use strict';

// Import sub-systems if in Node environment, or consume globals in browser
let GNCSystemModule = null;
let EWModule = null;
let TDLModule = null;
let SMSModule = null;

if (typeof require !== 'undefined') {
    try {
        GNCSystemModule = require('./GNCSystem.js');
        EWModule = require('./ElectronicWarfareSuite.js');
        TDLModule = require('./TacticalDataLink.js');
        SMSModule = require('./StoresManagementSystem.js');
    } catch (e) {
        // Fallback to global namespace
    }
}

/**
 * Self-contained 3D Vector for Master Controller
 */
class HeliVector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = Number(x) || 0;
        this.y = Number(y) || 0;
        this.z = Number(z) || 0;
    }

    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    clone() { return new HeliVector3(this.x, this.y, this.z); }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    scale(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
    lengthSq() { return this.x * this.x + this.y * this.y + this.z * this.z; }
    normalize() {
        const l = this.length();
        if (l > 1e-6) { this.x /= l; this.y /= l; this.z /= l; }
        return this;
    }
    dot(v) { return this.x * v.x + this.y * v.y + this.z * v.z; }
    cross(v) {
        return new HeliVector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }
}

/**
 * Master Combat Vehicle Controller
 */
class AntiGravityHelicopterMaster {
    /**
     * @param {Object} app Engine Application Reference (PlayCanvas AppBase or custom)
     * @param {Object} entity 3D Vehicle Root Entity with RigidBodyComponent
     */
    constructor(app = null, entity = null) {
        this.app = app;
        this.entity = entity;

        // Kinematic physical state
        this.worldPosition = new HeliVector3(0, 15, 0);
        this.linearVelocity = new HeliVector3(0, 0, 0);
        this.angularVelocity = new HeliVector3(0, 0, 0);
        this.forwardVector = new HeliVector3(0, 0, 1);
        this.upVector = new HeliVector3(0, 1, 0);
        this.rightVector = new HeliVector3(1, 0, 0);

        // Aerodynamic constants
        this.airDensityRho = 1.225; // kg/m^3 (sea level standard)
        this.dragCoefficientCd = 0.42; // Streamlined attack helicopter airframe
        this.frontalAreaA = 5.8; // m^2 frontal cross-section
        this.angularDampingCoeff = 850.0; // N*m*s/rad angular rate damping

        // Pilot control inputs (-1.0 to +1.0)
        this.cyclicPitchInput = 0.0; // Forward / Aft stick
        this.cyclicRollInput = 0.0;  // Lateral Left / Right stick
        this.yawPedalInput = 0.0;    // Anti-torque tail rotor pedals
        this.collectiveInput = 0.0;  // Vertical altitude climb / descent throttle (-1 to +1)

        // Subsystems Instantiation
        const GNCClass = (GNCSystemModule && GNCSystemModule.GNCSystem) || (typeof window !== 'undefined' && window.GNCSystem);
        const EWClass = (EWModule && EWModule.ElectronicWarfareSuite) || (typeof window !== 'undefined' && window.ElectronicWarfareSuite);
        const FCRClass = (TDLModule && TDLModule.FireControlRadar) || (typeof window !== 'undefined' && window.FireControlRadar);
        const SMSClass = (SMSModule && SMSModule.StoresManagementSystem) || (typeof window !== 'undefined' && window.StoresManagementSystem);

        this.gncSystem = GNCClass ? new GNCClass(app, entity) : null;
        this.ewSuite = EWClass ? new EWClass(app, entity) : null;
        this.fcrRadar = FCRClass ? new FCRClass(entity) : null;
        this.smsSystem = SMSClass ? new SMSClass(entity) : null;

        // Wire cross-references
        if (this.entity) {
            this.entity.gncSystem = this.gncSystem;
            this.entity.ewSuite = this.ewSuite;
            this.entity.fcrRadar = this.fcrRadar;
            this.entity.smsSystem = this.smsSystem;
        }

        // Flight modes
        this.flightMode = 'AUTO_GNC_HOVER'; // 'AUTO_GNC_HOVER', 'MANUAL_TERRAIN_FOLLOW', 'FULL_MANUAL'

        // Total thrust output telemetry
        this.totalAppliedForce = new HeliVector3(0, 0, 0);
        this.totalAppliedTorque = new HeliVector3(0, 0, 0);
    }

    /**
     * Initialize all avionics and audio synthesizers
     */
    initialize() {
        if (this.ewSuite && typeof this.ewSuite.init === 'function') {
            this.ewSuite.init();
        }
    }

    /**
     * Read entity transforms into local vector caches
     */
    syncKinematicsFromEntity() {
        if (!this.entity) return;

        if (this.entity.getPosition) {
            const p = this.entity.getPosition();
            this.worldPosition.set(p.x, p.y, p.z);
        }
        if (this.entity.forward) {
            this.forwardVector.set(this.entity.forward.x, this.entity.forward.y, this.entity.forward.z).normalize();
        }
        if (this.entity.up) {
            this.upVector.set(this.entity.up.x, this.entity.up.y, this.entity.up.z).normalize();
        }
        if (this.entity.right) {
            this.rightVector.set(this.entity.right.x, this.entity.right.y, this.entity.right.z).normalize();
        }

        if (this.entity.rigidbody) {
            if (this.entity.rigidbody.linearVelocity) {
                const lv = this.entity.rigidbody.linearVelocity;
                this.linearVelocity.set(lv.x, lv.y, lv.z);
            }
            if (this.entity.rigidbody.angularVelocity) {
                const av = this.entity.rigidbody.angularVelocity;
                this.angularVelocity.set(av.x, av.y, av.z);
            }
        }
    }

    /**
     * Pilot Flight Control Input Interface
     * @param {number} pitch Cyclic pitch (-1.0 aft, +1.0 nose down)
     * @param {number} roll Cyclic roll (-1.0 left bank, +1.0 right bank)
     * @param {number} yaw Anti-torque pedals (-1.0 yaw left, +1.0 yaw right)
     * @param {number} collective Collective throttle (-1.0 descend, +1.0 climb)
     */
    setPilotInputs(pitch, roll, yaw, collective) {
        this.cyclicPitchInput = Math.max(-1.0, Math.min(1.0, pitch || 0.0));
        this.cyclicRollInput = Math.max(-1.0, Math.min(1.0, roll || 0.0));
        this.yawPedalInput = Math.max(-1.0, Math.min(1.0, yaw || 0.0));
        this.collectiveInput = Math.max(-1.0, Math.min(1.0, collective || 0.0));

        // When pilot actively deflects cyclic or collective, switch to active manual/TFR mode
        if (Math.abs(this.cyclicPitchInput) > 0.05 ||
            Math.abs(this.cyclicRollInput) > 0.05 ||
            Math.abs(this.collectiveInput) > 0.05) {
            if (this.flightMode === 'AUTO_GNC_HOVER') {
                this.flightMode = 'MANUAL_TERRAIN_FOLLOW';
                if (this.gncSystem) {
                    this.gncSystem.setHoverEngaged(false);
                }
            }
        }
    }

    /**
     * Fixed-rate physics update loop (FixedUpdate)
     * Computes anti-gravity forces, aerodynamics, angular torques, and updates all avionics suites.
     *
     * @param {number} fixedDeltaTime Physics delta time step (e.g., 0.01667 or 0.02s)
     * @param {Array} enemyRadarEmitters Array of active enemy radar emitters in sector
     * @param {Array} link16CandidateTracks Array of tactical targets from Link 16 registry
     * @param {Function} raycastHook Physics line-of-sight & terrain raycasting provider
     */
    fixedUpdate(fixedDeltaTime, enemyRadarEmitters = [], link16CandidateTracks = [], raycastHook = null) {
        this.syncKinematicsFromEntity();

        // 1. Get vehicle total mass and center of gravity offset from SMS
        let currentMass = 2000.0;
        let comOffset = new HeliVector3(0, 0, 0);
        let asymRollTorque = new HeliVector3(0, 0, 0);

        if (this.smsSystem) {
            currentMass = this.smsSystem.totalVehicleMassKg;
            comOffset.set(
                this.smsSystem.calculatedCenterOfMass.x,
                this.smsSystem.calculatedCenterOfMass.y,
                this.smsSystem.calculatedCenterOfMass.z
            );
            asymRollTorque.set(
                this.smsSystem.inducedAsymmetricRollTorque.x,
                this.smsSystem.inducedAsymmetricRollTorque.y,
                this.smsSystem.inducedAsymmetricRollTorque.z
            );
        }

        // 2. Compute GNC Forces
        let gncForce = new HeliVector3(0, 0, 0);
        if (this.gncSystem) {
            const rawForce = this.gncSystem.fixedUpdate(fixedDeltaTime, currentMass, raycastHook);
            gncForce.set(rawForce.x, rawForce.y, rawForce.z);
        }

        // 3. Compute Pilot Control Forces & Anti-Gravity Base Thrust
        const netForce = new HeliVector3(0, 0, 0);
        const netTorque = new HeliVector3(0, 0, 0);

        if (this.flightMode === 'AUTO_GNC_HOVER') {
            // Under full GNC hover, the PID controller commands the force vector directly
            netForce.copy(gncForce);
        } else {
            // Manual Flight / TFR Assist Mode:
            // Anti-gravity baseline thrust counteracting world gravity:
            // F_anti_g = mass * g along the world up vector
            const baseAntiGravityThrust = currentMass * 9.80665;

            // Collective input modulates vertical thrust (+/- 45% of base thrust)
            const collectiveThrust = baseAntiGravityThrust * (1.0 + (this.collectiveInput * 0.45));

            // Pitch stick tilts thrust vector forward/backward for propulsion
            const forwardThrust = this.forwardVector.clone().scale(this.cyclicPitchInput * 12500.0);

            // Lateral stick banks thrust vector
            const lateralThrust = this.rightVector.clone().scale(this.cyclicRollInput * 8500.0);

            netForce.add(new HeliVector3(0, collectiveThrust, 0));
            netForce.add(forwardThrust);
            netForce.add(lateralThrust);

            // If TFR is active, apply vertical altitude restorative force
            if (this.gncSystem && this.gncSystem.isTFREngaged) {
                const altitudeError = this.gncSystem.targetPosition.y - this.worldPosition.y;
                const tfrClimbForce = Math.max(-4000.0, Math.min(8000.0, altitudeError * 1800.0));
                netForce.y += tfrClimbForce;
            }
        }

        // 4. Aerodynamic Drag Calculation: F_drag = -0.5 * rho * Cd * A * |v| * v
        const speed = this.linearVelocity.length();
        if (speed > 1e-4) {
            const dragMagnitude = 0.5 * this.airDensityRho * this.dragCoefficientCd * this.frontalAreaA * speed * speed;
            const dragForce = this.linearVelocity.clone().normalize().scale(-dragMagnitude);
            netForce.add(dragForce);
        }

        // 5. Compute Angular Torques & Asymmetrical Stores Balancing
        // Pilot cyclic pitch torque (around right axis)
        const pitchTorque = this.rightVector.clone().scale(this.cyclicPitchInput * 9500.0);

        // Pilot cyclic roll torque (around forward axis)
        const rollTorque = this.forwardVector.clone().scale(this.cyclicRollInput * 7500.0);

        // Pilot yaw pedal torque (around up axis)
        const yawTorque = this.upVector.clone().scale(this.yawPedalInput * 11000.0);

        netTorque.add(pitchTorque);
        netTorque.add(rollTorque);
        netTorque.add(yawTorque);

        // Introduce the physical asymmetrical rolling torque caused by uneven weapon loads:
        netTorque.add(asymRollTorque);

        // Active GNC Auto-Trim against asymmetrical roll torque:
        // Automatically injects counter-torque to keep wings level
        if (Math.abs(asymRollTorque.z) > 1.0) {
            const trimCounterTorque = this.forwardVector.clone().scale(-asymRollTorque.z * 0.92);
            netTorque.add(trimCounterTorque);
        }

        // Angular Damping: tau_damp = -I_damp * omega
        const dampingTorque = this.angularVelocity.clone().scale(-this.angularDampingCoeff);
        netTorque.add(dampingTorque);

        // 6. Apply Net Forces & Torques to Rigidbody
        this.totalAppliedForce.copy(netForce);
        this.totalAppliedTorque.copy(netTorque);

        if (this.entity && this.entity.rigidbody) {
            // PlayCanvas applyForce and applyTorque
            if (typeof pc !== 'undefined' && pc.Vec3) {
                this.entity.rigidbody.applyForce(new pc.Vec3(netForce.x, netForce.y, netForce.z));
                this.entity.rigidbody.applyTorque(new pc.Vec3(netTorque.x, netTorque.y, netTorque.z));
            } else if (typeof this.entity.rigidbody.applyForce === 'function') {
                this.entity.rigidbody.applyForce(netForce.x, netForce.y, netForce.z);
                if (typeof this.entity.rigidbody.applyTorque === 'function') {
                    this.entity.rigidbody.applyTorque(netTorque.x, netTorque.y, netTorque.z);
                }
            }
        }

        // 7. Tick Electronic Warfare Suite
        if (this.ewSuite) {
            this.ewSuite.update(fixedDeltaTime, enemyRadarEmitters, raycastHook);
        }

        // 8. Tick Fire Control Radar (FCR) Sweep & Priority Sorting
        if (this.fcrRadar) {
            this.fcrRadar.executeFCRSweep(link16CandidateTracks, raycastHook);
        }
    }

    /**
     * Get Complete Monospace Cockpit MFD String Readout
     * @returns {string} Formatted military MFD text screen
     */
    getMFDTextScreen() {
        if (!this.smsSystem) return 'SMS OFFLINE';

        const gncTelemetry = {
            currentAltitude: this.worldPosition.y,
            targetHoverAltitude: this.gncSystem ? this.gncSystem.targetPosition.y : 15.0,
            isTFREngaged: this.gncSystem ? this.gncSystem.isTFREngaged : false,
            lookaheadDistance: this.gncSystem ? this.gncSystem.currentLookaheadDistance : 50.0,
            pitchDeg: this.gncSystem ? this.gncSystem.pitchDegrees : 0.0,
            rollDeg: this.gncSystem ? this.gncSystem.rollDegrees : 0.0,
            pidForce: this.totalAppliedForce
        };

        const ewTelemetry = {
            activeThreatCount: this.ewSuite ? this.ewSuite.trackedThreats.size : 0,
            highestThreatStatus: this.ewSuite ? this.ewSuite.highestThreatStatus : 'NONE',
            flares: this.ewSuite ? this.ewSuite.flareCount : 60,
            chaff: this.ewSuite ? this.ewSuite.chaffCount : 60,
            activeMissileLocksCount: this.ewSuite ? this.ewSuite.activeMissileLocksCount : 0,
            threatContacts: this.ewSuite ? Array.from(this.ewSuite.trackedThreats.values()) : []
        };

        const tacTelemetry = {
            sortedTrackRecords: this.fcrRadar ? this.fcrRadar.sortedTrackRecords : [],
            primaryTargetLock: this.fcrRadar ? this.fcrRadar.primaryTargetLock : null
        };

        return this.smsSystem.generateMFDDisplayStream(gncTelemetry, ewTelemetry, tacTelemetry);
    }
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        HeliVector3,
        AntiGravityHelicopterMaster
    };
}
if (typeof window !== 'undefined') {
    window.AntiGravityHelicopterMaster = AntiGravityHelicopterMaster;
}
