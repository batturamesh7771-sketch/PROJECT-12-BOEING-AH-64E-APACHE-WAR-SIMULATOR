/**
 * =========================================================================================
 * StoresManagementSystem.js - Stores Management System (SMS) & Multi-Function Display (MFD)
 * -----------------------------------------------------------------------------------------
 * Implements:
 * 1. Stores Management System (SMS) Balancing Data Matrix:
 *    - 4 distinct wing hardpoints (Left Outboard, Left Inboard, Right Inboard, Right Outboard)
 *    - Heavy Anti-Armor Guided Missile (AGM-114L Hellfire, 50kg each, max 4 per hardpoint)
 *    - High-Explosive Unguided Rocket Pod (Hydra 70, 100kg loaded, max 1 pod per hardpoint)
 *    - 30mm Autocannon Ammunition Drum (Central fuselage mount, 0.1kg per round, max 1200 rds)
 *    - Dynamic Mass & Center of Gravity (CoM) Recalculation:
 *      * Step 1: Base empty vehicle mass = 2000.0 kg
 *      * Step 2: Total Mass = M_empty + sum(M_stores) + M_30mm (assigned to Rigidbody.mass)
 *      * Step 3: Weighted average Center of Mass vector offset:
 *                R_CoM = (M_empty * R_empty + sum(m_i * r_i)) / Total_Mass
 *                Assigned to Rigidbody.centerOfMass
 *      * Generates asymmetrical rolling torque when stores deplete unevenly (tau = R_CoM x -Mg)
 * 2. Multi-Function Display (MFD) Telemetry Engine:
 *    - Page state machine: MFD_PAGE { MENU, GNC_TFR, EW_RWR, TAC_LINK, SMS_STORES }
 *    - Monospace military cockpit display text stream generator for each page
 *
 * Engine Target: PlayCanvas Engine & Standalone Simulation Architecture
 * Zero-Dependency Architecture: Self-contained vector mathematics and formatted strings.
 * =========================================================================================
 */

'use strict';

/**
 * MFD Page Navigation State Machine
 */
const MFD_PAGE = {
    MENU: 'MENU',
    GNC_TFR: 'GNC_TFR',
    EW_RWR: 'EW_RWR',
    TAC_LINK: 'TAC_LINK',
    SMS_STORES: 'SMS_STORES'
};

/**
 * Weapon Stores Types
 */
const WEAPON_TYPE = {
    NONE: 'NONE',
    AGM_114L_HELLFIRE: 'AGM_114L_HELLFIRE',
    HYDRA_70_ROCKET_POD: 'HYDRA_70_ROCKET_POD',
    M230_30MM_AUTOCANNON: 'M230_30MM_AUTOCANNON'
};

/**
 * Hardpoint Station Identifiers
 */
const HARDPOINT_ID = {
    STATION_1_LEFT_OUTBOARD: 0,
    STATION_2_LEFT_INBOARD: 1,
    STATION_3_RIGHT_INBOARD: 2,
    STATION_4_RIGHT_OUTBOARD: 3
};

/**
 * Self-contained 3D Vector for SMS
 */
class SMSVector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = Number(x) || 0;
        this.y = Number(y) || 0;
        this.z = Number(z) || 0;
    }

    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    clone() { return new SMSVector3(this.x, this.y, this.z); }
    add(v) { this.x += v.x; this.y += v.y; this.z += v.z; return this; }
    sub(v) { this.x -= v.x; this.y -= v.y; this.z -= v.z; return this; }
    scale(s) { this.x *= s; this.y *= s; this.z *= s; return this; }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z); }
    cross(v) {
        return new SMSVector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }
}

/**
 * Wing Hardpoint Station Definition
 */
class HardpointStation {
    constructor(id, label, localOffset, weaponType, maxCapacity, currentCount, unitMassKg) {
        this.id = id;
        this.label = label;
        this.localOffset = localOffset.clone(); // Local vector relative to helicopter reference origin
        this.weaponType = weaponType;
        this.maxCapacity = maxCapacity;
        this.currentCount = currentCount;
        this.unitMassKg = unitMassKg; // Weight per unit
        this.isSelected = false;
    }

    getCurrentMass() {
        return this.currentCount * this.unitMassKg;
    }
}

/**
 * Stores Management System (SMS) Controller
 */
class StoresManagementSystem {
    constructor(helicopterEntity = null) {
        this.entity = helicopterEntity;

        // Base empty fuselage mass
        this.emptyVehicleMassKg = 2000.0; // 2,000 kg empty shell
        this.emptyCenterOfMass = new SMSVector3(0.0, 0.0, 0.0);

        // Central Fuselage Mounted 30mm Autocannon Drum
        this.cannonRoundMassKg = 0.10; // 0.1 kg per 30mm round (100g)
        this.maxCannonRounds = 1200;   // 1,200 rounds max capacity
        this.currentCannonRounds = 1200;
        this.cannonOffset = new SMSVector3(0.0, -0.65, 0.85); // Mounted chin/belly

        // 4 Wing Hardpoint Stations:
        // Left wing has negative X offsets, Right wing has positive X offsets
        this.hardpoints = [
            new HardpointStation(
                HARDPOINT_ID.STATION_1_LEFT_OUTBOARD,
                'STA 1 [L-OUT]',
                new SMSVector3(-2.40, -0.35, 0.15),
                WEAPON_TYPE.AGM_114L_HELLFIRE,
                4, // 4 Hellfires max
                4,
                50.0 // 50kg each (200kg total)
            ),
            new HardpointStation(
                HARDPOINT_ID.STATION_2_LEFT_INBOARD,
                'STA 2 [L-IN]',
                new SMSVector3(-1.60, -0.35, 0.15),
                WEAPON_TYPE.HYDRA_70_ROCKET_POD,
                19, // 1 pod containing 19 rockets
                19,
                5.263 // ~100kg total pod loaded
            ),
            new HardpointStation(
                HARDPOINT_ID.STATION_3_RIGHT_INBOARD,
                'STA 3 [R-IN]',
                new SMSVector3(1.60, -0.35, 0.15),
                WEAPON_TYPE.HYDRA_70_ROCKET_POD,
                19,
                19,
                5.263 // ~100kg total pod loaded
            ),
            new HardpointStation(
                HARDPOINT_ID.STATION_4_RIGHT_OUTBOARD,
                'STA 4 [R-OUT]',
                new SMSVector3(2.40, -0.35, 0.15),
                WEAPON_TYPE.AGM_114L_HELLFIRE,
                4,
                4,
                50.0 // 50kg each (200kg total)
            )
        ];

        // Active weapon selection state
        this.selectedWeaponType = WEAPON_TYPE.AGM_114L_HELLFIRE;
        this.activeHardpointIndex = 0;
        this.hardpoints[0].isSelected = true;

        // Dynamic mass and center of gravity state
        this.totalVehicleMassKg = 2000.0;
        this.calculatedCenterOfMass = new SMSVector3(0.0, 0.0, 0.0);
        this.inducedAsymmetricRollTorque = new SMSVector3(0.0, 0.0, 0.0);

        // MFD Page Navigation State
        this.currentPage = MFD_PAGE.MENU;

        // Perform initial balancing calculation
        this.recalculateMassAndCenterOfGravity();
    }

    /**
     * Automated Dynamic Mass and Center of Gravity (CoG) Recalculation
     * Executed every single time a weapon is discharged
     */
    recalculateMassAndCenterOfGravity() {
        // Step 1: Base mass of empty helicopter shell
        let currentTotalMass = this.emptyVehicleMassKg;

        // Sum weighted positions for Center of Mass: Sum(mass_i * pos_i)
        const weightedMoments = this.emptyCenterOfMass.clone().scale(this.emptyVehicleMassKg);

        // Add 30mm ammunition drum mass & moment
        const cannonFuelMass = this.currentCannonRounds * this.cannonRoundMassKg;
        currentTotalMass += cannonFuelMass;
        weightedMoments.add(this.cannonOffset.clone().scale(cannonFuelMass));

        // Step 2: Loop through all 4 hardpoints and add remaining ordnance weight
        for (let i = 0; i < this.hardpoints.length; i++) {
            const hp = this.hardpoints[i];
            const hpMass = hp.getCurrentMass();
            currentTotalMass += hpMass;
            weightedMoments.add(hp.localOffset.clone().scale(hpMass));
        }

        this.totalVehicleMassKg = currentTotalMass;

        // Step 3: Compute shift in Center of Mass (CoM)
        // R_CoM = weightedMoments / currentTotalMass
        this.calculatedCenterOfMass.set(
            weightedMoments.x / currentTotalMass,
            weightedMoments.y / currentTotalMass,
            weightedMoments.z / currentTotalMass
        );

        // Update Rigidbody properties in engine
        if (this.entity && this.entity.rigidbody) {
            this.entity.rigidbody.mass = this.totalVehicleMassKg;
            if (this.entity.rigidbody.centerOfMass) {
                this.entity.rigidbody.centerOfMass.set(
                    this.calculatedCenterOfMass.x,
                    this.calculatedCenterOfMass.y,
                    this.calculatedCenterOfMass.z
                );
            }
        }

        // Calculate induced rolling torque caused by lateral CoM offset (gravity pulling off-center)
        // Tau = R_CoM x (Mass * [0, -g, 0])
        const gravityForceVector = new SMSVector3(0.0, -currentTotalMass * 9.80665, 0.0);
        this.inducedAsymmetricRollTorque = this.calculatedCenterOfMass.cross(gravityForceVector);

        return {
            totalMassKg: this.totalVehicleMassKg,
            centerOfMass: this.calculatedCenterOfMass,
            asymmetricTorque: this.inducedAsymmetricRollTorque
        };
    }

    /**
     * Discharge a 30mm Autocannon Round
     * @param {number} roundsCount Number of rounds fired in burst
     */
    dischargeAutocannon(roundsCount = 1) {
        if (this.currentCannonRounds <= 0) return false;
        this.currentCannonRounds = Math.max(0, this.currentCannonRounds - roundsCount);
        this.recalculateMassAndCenterOfGravity();
        return true;
    }

    /**
     * Launch an AGM-114L Hellfire Missile from active or specified hardpoint
     * Asymmetrical firing will shift CoM laterally, introducing roll torque!
     */
    launchHellfire(preferredHardpointId = null) {
        let targetStation = null;

        if (preferredHardpointId !== null && this.hardpoints[preferredHardpointId]) {
            if (this.hardpoints[preferredHardpointId].weaponType === WEAPON_TYPE.AGM_114L_HELLFIRE &&
                this.hardpoints[preferredHardpointId].currentCount > 0) {
                targetStation = this.hardpoints[preferredHardpointId];
            }
        }

        // Fallback: search available Hellfire stations
        if (!targetStation) {
            for (let i = 0; i < this.hardpoints.length; i++) {
                const hp = this.hardpoints[i];
                if (hp.weaponType === WEAPON_TYPE.AGM_114L_HELLFIRE && hp.currentCount > 0) {
                    targetStation = hp;
                    break;
                }
            }
        }

        if (!targetStation) return null; // Winchester (out of Hellfires)

        targetStation.currentCount -= 1;
        this.recalculateMassAndCenterOfGravity();

        return {
            stationId: targetStation.id,
            stationLabel: targetStation.label,
            launchOffset: targetStation.localOffset,
            remainingInStation: targetStation.currentCount
        };
    }

    /**
     * Fire Hydra 70 Rocket Salvo
     */
    fireHydraRocket(preferredHardpointId = null) {
        let targetStation = null;

        if (preferredHardpointId !== null && this.hardpoints[preferredHardpointId]) {
            if (this.hardpoints[preferredHardpointId].weaponType === WEAPON_TYPE.HYDRA_70_ROCKET_POD &&
                this.hardpoints[preferredHardpointId].currentCount > 0) {
                targetStation = this.hardpoints[preferredHardpointId];
            }
        }

        if (!targetStation) {
            for (let i = 0; i < this.hardpoints.length; i++) {
                const hp = this.hardpoints[i];
                if (hp.weaponType === WEAPON_TYPE.HYDRA_70_ROCKET_POD && hp.currentCount > 0) {
                    targetStation = hp;
                    break;
                }
            }
        }

        if (!targetStation) return null;

        targetStation.currentCount -= 1;
        this.recalculateMassAndCenterOfGravity();

        return {
            stationId: targetStation.id,
            stationLabel: targetStation.label,
            launchOffset: targetStation.localOffset,
            remainingInStation: targetStation.currentCount
        };
    }

    /**
     * Select MFD Page
     * @param {string} page MFD_PAGE enum
     */
    setMFDPage(page) {
        if (MFD_PAGE[page]) {
            this.currentPage = page;
        }
    }

    /**
     * Multi-Function Display (MFD) Military Monospace String Generator
     * Formats real-time avionics telemetry matching combat vehicle display screens
     *
     * @param {Object} gncTelemetry GNC telemetry object
     * @param {Object} ewTelemetry EW / RWR telemetry object
     * @param {Object} tacTelemetry Tactical Data Link / FCR telemetry object
     * @returns {string} Formatted monospace MFD display text stream
     */
    generateMFDDisplayStream(gncTelemetry = {}, ewTelemetry = {}, tacTelemetry = {}) {
        const divider = '====================================================================\n';
        const subDivider = '--------------------------------------------------------------------\n';

        switch (this.currentPage) {
            case MFD_PAGE.MENU: {
                let s = divider;
                s += '                       MFD MASTER SYSTEM DIRECTORY                   \n';
                s += divider;
                s += '  [F1] GNC_TFR     : GUIDANCE, NAVIGATION & TERRAIN FOLLOWING RADAR \n';
                s += '  [F2] EW_RWR      : ELECTRONIC WARFARE & RADAR WARNING RECEIVER    \n';
                s += '  [F3] TAC_LINK    : LINK-16 TACTICAL DATA & FCR TARGET SORTING     \n';
                s += '  [F4] SMS_STORES  : STORES MANAGEMENT SYSTEM & AIRFRAME BALANCING  \n';
                s += subDivider;
                s += `  AIRFRAME STATUS   : COMBAT OPERATIONAL | MASTER CAUTION: CLEAR   \n`;
                s += `  PROPULSION DRIVE  : ANTI-GRAVITY VERTICAL LIFTERS [ACTIVE 100%]   \n`;
                s += `  TOTAL GROSS WT    : ${this.totalVehicleMassKg.toFixed(1)} KG | CoM OFFSET: [X: ${this.calculatedCenterOfMass.x.toFixed(3)}m]\n`;
                s += divider;
                return s;
            }

            case MFD_PAGE.GNC_TFR: {
                const alt = gncTelemetry.currentAltitude || 15.0;
                const tgtAlt = gncTelemetry.targetHoverAltitude || 15.0;
                const tfrStatus = gncTelemetry.isTFREngaged ? 'ACTIVE (PULL-UP READY)' : 'STANDBY';
                const lookahead = gncTelemetry.lookaheadDistance || 50.0;
                const pitch = gncTelemetry.pitchDeg || 0.0;
                const roll = gncTelemetry.rollDeg || 0.0;
                const fVec = gncTelemetry.pidForce || { x: 0, y: 19613, z: 0 };

                let s = divider;
                s += '                 GNC & TERRAIN FOLLOWING RADAR (TFR)                \n';
                s += divider;
                s += `  SYSTEM STATUS      : ${tfrStatus}\n`;
                s += `  CURRENT ALTITUDE   : ${alt.toFixed(2)} M (${(alt * 3.28084).toFixed(0)} FT MSL)\n`;
                s += `  TARGET HOVER ALT   : ${tgtAlt.toFixed(2)} M (+15.0M CLEARANCE)\n`;
                s += `  PREDICTIVE LOOKAHEAD: ${lookahead.toFixed(1)} M [VELOCITY SCALED 50-300M]\n`;
                s += subDivider;
                s += `  ATTITUDE TRIM      : PITCH: ${pitch.toFixed(1)}° | ROLL: ${roll.toFixed(1)}°\n`;
                s += `  PID FORCE OUTPUT   : FX: ${fVec.x.toFixed(1)} N | FY: ${fVec.y.toFixed(1)} N | FZ: ${fVec.z.toFixed(1)} N\n`;
                s += `  SPLINE SMOOTHING   : CUBIC HERMITE CONTOURING [ENGAGED]\n`;
                s += divider;
                return s;
            }

            case MFD_PAGE.EW_RWR: {
                const threatCount = ewTelemetry.activeThreatCount || 0;
                const highestStatus = ewTelemetry.highestThreatStatus || 'NONE';
                const flares = this.entity && this.entity.ewSuite ? this.entity.ewSuite.flareCount : (ewTelemetry.flares || 60);
                const chaff = this.entity && this.entity.ewSuite ? this.entity.ewSuite.chaffCount : (ewTelemetry.chaff || 60);
                const missileLocks = ewTelemetry.activeMissileLocksCount || 0;
                const threatContacts = ewTelemetry.threatContacts || [];

                let s = divider;
                s += '              AN/APR-39 RWR & AN/ALE-47 CMDS DEFENSE GRID           \n';
                s += divider;
                s += `  THREAT LEVEL STATUS: [ ${highestStatus} ] | ACTIVE RADAR EMITTERS: ${threatCount}\n`;
                s += `  MISSILE LOCKS      : ${missileLocks > 0 ? `>>> WARNING: ${missileLocks} INCOMING LOCKS <<<` : 'NONE'}\n`;
                s += `  CMDS DECOYS STORED : FLARES: ${flares} | CHAFF CLOUDS: ${chaff}\n`;
                s += `  AUTO-DISPENSE LOOP : ${missileLocks > 0 ? 'ACTIVE [0.25s TIME-LOCKED PULSE]' : 'STANDBY ARMED'}\n`;
                s += subDivider;
                s += '  BRG | CLOCK | DISTANCE | EMITTER CLASSIFICATION | STATUS\n';
                if (threatContacts.length === 0) {
                    s += '  NO DETECTED ELECTROMAGNETIC EMISSIONS IN 360° SPHERE\n';
                } else {
                    for (let i = 0; i < Math.min(6, threatContacts.length); i++) {
                        const tc = threatContacts[i];
                        s += `  ${tc.azimuthDeg > 0 ? '+' : ''}${tc.azimuthDeg.toFixed(0).padStart(3, ' ')}° | ${String(tc.clockBearing).padStart(2, ' ')}:00 | ${(tc.distanceMeters).toFixed(0).padStart(5, ' ')}m | ${tc.type.padEnd(20, ' ')} | ${tc.status}\n`;
                    }
                }
                s += divider;
                return s;
            }

            case MFD_PAGE.TAC_LINK: {
                const tracks = tacTelemetry.sortedTrackRecords || [];
                const primaryLock = tacTelemetry.primaryTargetLock;

                let s = divider;
                s += '            LINK-16 TACTICAL DATA BUS & FCR 90° CONICAL SWEEP        \n';
                s += divider;
                s += `  TOTAL FCR CONTACTS : ${tracks.length} / 16 TRACKED | APERTURE: +/- 45° (90° CONE)\n`;
                s += `  PRIMARY LOCK       : ${primaryLock ? `[${primaryLock.trackId}] ${primaryLock.classification} @ ${primaryLock.distanceMeters.toFixed(0)}M` : 'SEARCHING...'}\n`;
                s += subDivider;
                s += '  IDX | TRACK ID | CLASSIFICATION | RNG (M) | THREAT | CLOSURE | LOCK\n';
                if (tracks.length === 0) {
                    s += '  SCANNING FOR RADAR RETURNS INSIDE 1,000M FCR CONE...\n';
                } else {
                    for (let i = 0; i < Math.min(16, tracks.length); i++) {
                        const trk = tracks[i];
                        const lockTag = trk.isPrimaryLock ? '>>> LOCK <<<' : 'TRACKING';
                        s += `  ${String(i).padStart(2, '0')}  | ${trk.trackId.padEnd(8, ' ')} | ${trk.classification.padEnd(14, ' ')} | ${trk.distanceMeters.toFixed(0).padStart(5, ' ')}m |  ${(trk.threatIndexWeight * 100).toFixed(1).padStart(5, ' ')} | ${trk.closureVelocityMps.toFixed(1).padStart(5, ' ')}m/s | ${lockTag}\n`;
                    }
                }
                s += divider;
                return s;
            }

            case MFD_PAGE.SMS_STORES: {
                let s = divider;
                s += '                 STORES MANAGEMENT SYSTEM (SMS) & INVENTORY          \n';
                s += divider;
                s += `  TOTAL ORDNANCE WT  : ${(this.totalVehicleMassKg - this.emptyVehicleMassKg).toFixed(1)} KG | GROSS MASS: ${this.totalVehicleMassKg.toFixed(1)} KG\n`;
                s += `  CENTER OF MASS (CoM): [X: ${this.calculatedCenterOfMass.x.toFixed(3)}m, Y: ${this.calculatedCenterOfMass.y.toFixed(3)}m, Z: ${this.calculatedCenterOfMass.z.toFixed(3)}m]\n`;
                s += `  ASYM ROLL TORQUE   : ${this.inducedAsymmetricRollTorque.z.toFixed(1)} N*m [GNC BALANCING REQUIRED]\n`;
                s += subDivider;
                s += `  CENTRAL DRUM       : 30MM M230 CHAIN GUN -> ${this.currentCannonRounds} / ${this.maxCannonRounds} RDS (${(this.currentCannonRounds * this.cannonRoundMassKg).toFixed(1)} KG)\n`;
                s += subDivider;
                s += '  STATION IDENTIFIER  | WEAPON TYPE         | COUNT | STATION WT | STATUS\n';
                for (let i = 0; i < this.hardpoints.length; i++) {
                    const hp = this.hardpoints[i];
                    const selTag = hp.isSelected ? '>>> SELECTED <<<' : 'READY';
                    s += `  ${hp.label.padEnd(19, ' ')} | ${hp.weaponType.padEnd(19, ' ')} | ${String(hp.currentCount).padStart(2, ' ')}/${String(hp.maxCapacity).padStart(2, ' ')} | ${(hp.getCurrentMass()).toFixed(1).padStart(6, ' ')} KG | ${selTag}\n`;
                }
                s += divider;
                return s;
            }

            default:
                return 'MFD SCREEN OFF';
        }
    }
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MFD_PAGE,
        WEAPON_TYPE,
        HARDPOINT_ID,
        SMSVector3,
        HardpointStation,
        StoresManagementSystem
    };
}
if (typeof window !== 'undefined') {
    window.StoresManagementSystem = StoresManagementSystem;
    window.MFD_PAGE = MFD_PAGE;
    window.WEAPON_TYPE = WEAPON_TYPE;
    window.HARDPOINT_ID = HARDPOINT_ID;
}
