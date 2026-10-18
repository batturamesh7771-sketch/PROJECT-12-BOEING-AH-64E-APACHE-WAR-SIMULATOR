/**
 * =========================================================================================
 * TacticalDataLink.js - Tactical Data Link (Link 16) & Fire Control Radar (FCR) Sorting
 * -----------------------------------------------------------------------------------------
 * Implements:
 * 1. Link 16 Data Pipeline Simulation:
 *    - DataLinkTrack lightweight military data structure
 *    - Central static network manager bus (Link16NetworkBus) synced across friendly nodes
 *    - Military encryption & procedural latency emulation (0.1 to 0.5s delay based on range)
 *    - Realistic radio-electronic distortion & position variance over long transmission distances
 * 2. Fire Control Radar (FCR) Target Selection and Priority Sorting:
 *    - Conical volumetric sweep: 1000m max range, 90° azimuth aperture (+/- 45° off nose)
 *    - Dot product angular filtering (cos 45° threshold = 0.70710678)
 *    - Terrain line-of-sight raycasting verification
 *    - Algorithmic Threat Index Weight calculation (45% Proximity, 35% Threat Class, 20% Aspect/Closure)
 *    - Priority sort of top 16 tracked targets with Index 0 Primary Weapon Lock designation
 *
 * Engine Target: PlayCanvas Engine & Standalone Simulation Architecture
 * Zero-Dependency Architecture: Native vector calculations and sorting algorithms.
 * =========================================================================================
 */

'use strict';

/**
 * Tactical Target Classification Enum
 */
const TARGET_CLASS = {
    Air: 'Air',                          // Air Defense Jets / Gunships / Drones (100 pts)
    TrackedGround: 'TrackedGround',      // Tanks / Tracked SAMs / Heavy Armor (60 pts)
    WheeledGround: 'WheeledGround',      // Technicals / Rocket Launchers / Trucks (30 pts)
    StaticStructure: 'StaticStructure'   // Hardened Bunkers / Radar Dishes (10 pts)
};

/**
 * Threat Class Base Scoring Matrix
 */
const THREAT_CLASS_SCORES = {
    [TARGET_CLASS.Air]: 100.0,
    [TARGET_CLASS.TrackedGround]: 60.0,
    [TARGET_CLASS.WheeledGround]: 30.0,
    [TARGET_CLASS.StaticStructure]: 10.0
};

/**
 * Self-contained 3D Vector for Tactical Data Link
 */
class TDLVector3 {
    constructor(x = 0, y = 0, z = 0) {
        this.x = Number(x) || 0;
        this.y = Number(y) || 0;
        this.z = Number(z) || 0;
    }

    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
    copy(v) { this.x = v.x; this.y = v.y; this.z = v.z; return this; }
    clone() { return new TDLVector3(this.x, this.y, this.z); }
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
 * Military Encrypted Data Link Track Structure (Link 16 Standard)
 */
class DataLinkTrack {
    /**
     * @param {string} trackId Unique network tracking identifier (e.g., 'TRK-A101')
     * @param {string} classification Target classification enum (TARGET_CLASS)
     * @param {TDLVector3} position World-space coordinates
     * @param {TDLVector3} velocity World-space velocity vector
     * @param {number} signatureStrength Radar/optical cross section (0.0 to 1.0)
     * @param {number} timestamp Network transmission timestamp in seconds
     * @param {string} reportingSource Reporting node ('AEW&C_NET', 'SCOUT_DRONE', 'FORWARD_JTAC')
     */
    constructor(trackId, classification, position, velocity, signatureStrength, timestamp, reportingSource = 'LINK16_BUS') {
        this.trackId = String(trackId);
        this.classification = classification;
        this.position = position.clone();
        this.velocity = velocity.clone();
        this.signatureStrength = Math.max(0.0, Math.min(1.0, Number(signatureStrength) || 0.5));
        this.timestamp = Number(timestamp) || 0.0;
        this.reportingSource = String(reportingSource);
    }
}

/**
 * Link 16 Central Static Network Bus
 * Synchronizes shared tactical picture across friendly air and ground nodes
 */
class Link16NetworkBus {
    static registry = new Map(); // trackId -> DataLinkTrack

    /**
     * Friendly unit registers or updates an acquired target
     */
    static publishTrack(track) {
        if (!track || !track.trackId) return;
        Link16NetworkBus.registry.set(track.trackId, track);
    }

    /**
     * Remove track upon confirmed battle damage assessment (BDA)
     */
    static removeTrack(trackId) {
        Link16NetworkBus.registry.delete(trackId);
    }

    /**
     * Clear all stale tracks older than maxAge seconds
     */
    static purgeStaleTracks(currentTime, maxAgeSeconds = 10.0) {
        for (const [id, track] of Link16NetworkBus.registry) {
            if ((currentTime - track.timestamp) > maxAgeSeconds) {
                Link16NetworkBus.registry.delete(id);
            }
        }
    }

    /**
     * Retrieve tracks with simulated radio latency and electronic distortion
     * @param {TDLVector3} receiverPosition Current receiver world position
     * @param {number} currentTime Current network clock in seconds
     * @returns {Array<DataLinkTrack>} Distorted received tracks
     */
    static queryTracksWithLatency(receiverPosition, currentTime) {
        const receivedTracks = [];

        for (const [, origTrack] of Link16NetworkBus.registry) {
            const distance = receiverPosition.clone().sub(origTrack.position).length();

            // Procedural network latency delay (0.1 to 0.5 seconds based on distance)
            const latencyDelay = 0.10 + 0.40 * Math.min(1.0, distance / 10000.0);

            // Extrapolate position using delayed kinematics: P' = P + V * latency
            const delayedPos = origTrack.position.clone().add(origTrack.velocity.clone().scale(latencyDelay));

            // Long-range radio-electronic distortion noise (0.2m to 5.0m standard deviation)
            const distortionMagnitude = 0.2 + 4.8 * Math.min(1.0, distance / 10000.0);
            const noise = new TDLVector3(
                (Math.random() - 0.5) * 2.0 * distortionMagnitude,
                (Math.random() - 0.5) * 0.8 * distortionMagnitude,
                (Math.random() - 0.5) * 2.0 * distortionMagnitude
            );
            delayedPos.add(noise);

            const trackClone = new DataLinkTrack(
                origTrack.trackId,
                origTrack.classification,
                delayedPos,
                origTrack.velocity,
                origTrack.signatureStrength,
                currentTime - latencyDelay,
                origTrack.reportingSource
            );

            receivedTracks.push(trackClone);
        }

        return receivedTracks;
    }
}

/**
 * Track Record stored inside the helicopter's Fire Control Radar (FCR)
 */
class FCRTrackRecord {
    constructor(trackId, classification, worldPosition, velocity) {
        this.trackId = trackId;
        this.classification = classification;
        this.worldPosition = worldPosition.clone();
        this.velocity = velocity.clone();
        this.distanceMeters = 0.0;
        this.azimuthAngleDeg = 0.0;
        this.threatIndexWeight = 0.0;
        this.proximityScore = 0.0;
        this.classScore = 0.0;
        this.aspectScore = 0.0;
        this.closureVelocityMps = 0.0;
        this.isLineOfSightClear = true;
        this.isPrimaryLock = false;
    }
}

/**
 * Fire Control Radar (FCR) Target Selection & Priority Sorting Engine
 */
class FireControlRadar {
    constructor(helicopterEntity) {
        this.entity = helicopterEntity;

        // FCR Physical Radar Parameters
        this.maxRadarRangeMeters = 1000.0; // 1,000 meters maximum range
        this.apertureHalfAngleDeg = 45.0;  // 90° total aperture (+/- 45° from nose)
        this.cosApertureThreshold = Math.cos(45.0 * (Math.PI / 180.0)); // 0.70710678

        // Helicopter spatial state
        this.helicopterPosition = new TDLVector3(0, 15, 0);
        this.helicopterForward = new TDLVector3(0, 0, 1);
        this.helicopterVelocity = new TDLVector3(0, 0, 0);

        // Track limits
        this.maxTrackedCapacity = 16; // Maximum 16 simultaneously tracked targets
        this.sortedTrackRecords = []; // Array of up to 16 FCRTrackRecord items
        this.primaryTargetLock = null; // Index 0 auto-lock pointer

        // Telemetry
        this.totalDetectedContacts = 0;
    }

    /**
     * Synchronize helicopter position, forward vector, and velocity
     */
    updateHelicopterState() {
        if (!this.entity) return;

        if (this.entity.getPosition) {
            const p = this.entity.getPosition();
            this.helicopterPosition.set(p.x, p.y, p.z);
        }
        if (this.entity.forward) {
            this.helicopterForward.set(this.entity.forward.x, this.entity.forward.y, this.entity.forward.z).normalize();
        }
        if (this.entity.rigidbody && this.entity.rigidbody.linearVelocity) {
            const v = this.entity.rigidbody.linearVelocity;
            this.helicopterVelocity.set(v.x, v.y, v.z);
        }
    }

    /**
     * Multi-factored Priority Threat Matrix Scoring Formula
     * Formula:
     * ThreatIndexWeight = (0.45 * ProximityScore) + (0.35 * ThreatClassScore) + (0.20 * AspectScore)
     *
     * 1. Proximity Score (45% weight):
     *    Inverse linear scale: max(0, 1.0 - (distance / 1000.0))
     * 2. Threat Class Score (35% weight):
     *    Air Defense = 100 pts, Tracked Armor = 60 pts, Wheeled = 30 pts, Structures = 10 pts
     *    Normalized: score / 100.0
     * 3. Aspect Angle / Velocity Vector Score (20% weight):
     *    Closure velocity V_rel = V_target - V_heli
     *    Closure rate towards heli: -dot(V_rel, Unit_vector_to_target)
     *    Normalized against reference 100 m/s
     *
     * @param {FCRTrackRecord} track
     */
    calculateThreatIndexWeight(track) {
        // 1. Proximity Score (45% weight)
        const proximityScore = Math.max(0.0, 1.0 - (track.distanceMeters / this.maxRadarRangeMeters));

        // 2. Threat Class Score (35% weight)
        const rawClassPoints = THREAT_CLASS_SCORES[track.classification] || 10.0;
        const classScore = rawClassPoints / 100.0;

        // 3. Aspect Angle / Velocity Vector Score (20% weight)
        const toTargetUnit = track.worldPosition.clone().sub(this.helicopterPosition).normalize();
        const relVelocity = track.velocity.clone().sub(this.helicopterVelocity);

        // Closure speed: positive when target is closing in on helicopter
        const closureSpeed = -relVelocity.dot(toTargetUnit);
        track.closureVelocityMps = closureSpeed;

        // Normalize closure speed: 0 at 0 m/s or receding, 1.0 at 100+ m/s closing
        const maxClosureRef = 100.0; // 100 m/s reference closing rate
        const aspectScore = Math.max(0.0, Math.min(1.0, (closureSpeed + 20.0) / (maxClosureRef + 20.0)));

        // Multi-factored algorithmic scoring equation
        const threatIndexWeight = (0.45 * proximityScore) +
                                  (0.35 * classScore) +
                                  (0.20 * aspectScore);

        track.proximityScore = proximityScore;
        track.classScore = classScore;
        track.aspectScore = aspectScore;
        track.threatIndexWeight = threatIndexWeight;

        return threatIndexWeight;
    }

    /**
     * Conical Volumetric Sweep and Target Prioritization Loop
     * Evaluates targets within 1000m and +/- 45° azimuth, verifies line-of-sight,
     * computes threat scores, sorts top 16, and designates Index 0 primary lock.
     *
     * @param {Array<DataLinkTrack>} candidateTracks Array of candidate targets from Link 16 and sensors
     * @param {Function} lineOfSightRaycast Raycast callback: (origin, targetPos) => boolean (true = clear)
     * @returns {Array<FCRTrackRecord>} Sorted top 16 targets
     */
    executeFCRSweep(candidateTracks, lineOfSightRaycast = null) {
        this.updateHelicopterState();

        const qualifiedTracks = [];

        for (let i = 0; i < candidateTracks.length; i++) {
            const candidate = candidateTracks[i];
            const targetPos = candidate.position;

            // Distance calculation
            const offset = targetPos.clone().sub(this.helicopterPosition);
            const distance = offset.length();

            // Range filter: Maximum 1000 meters
            if (distance <= 0.1 || distance > this.maxRadarRangeMeters) {
                continue;
            }

            // Conical aperture filter: Dot product check (+/- 45 degrees from nose)
            const unitDirection = offset.clone().normalize();
            const forwardDot = this.helicopterForward.dot(unitDirection);

            // Vector3.Dot threshold for 45° is cos(45°) ≈ 0.7071
            if (forwardDot < this.cosApertureThreshold) {
                continue; // Outside 90° conical sweep
            }

            // Terrain line-of-sight raycast check
            let hasLOS = true;
            if (typeof lineOfSightRaycast === 'function') {
                hasLOS = lineOfSightRaycast(this.helicopterPosition, targetPos);
            }

            if (!hasLOS) {
                continue; // Occluded behind mountains or terrain geometry
            }

            // Construct FCR track record
            const trackRecord = new FCRTrackRecord(
                candidate.trackId,
                candidate.classification,
                candidate.position,
                candidate.velocity
            );
            trackRecord.distanceMeters = distance;
            trackRecord.azimuthAngleDeg = Math.acos(Math.max(-1.0, Math.min(1.0, forwardDot))) * (180.0 / Math.PI);
            trackRecord.isLineOfSightClear = true;

            // Compute Threat Index Weight
            this.calculateThreatIndexWeight(trackRecord);

            qualifiedTracks.push(trackRecord);
        }

        // Sort qualified targets in descending order by Threat Index Weight
        qualifiedTracks.sort((a, b) => b.threatIndexWeight - a.threatIndexWeight);

        // Cap at top 16 simultaneous tracks
        this.sortedTrackRecords = qualifiedTracks.slice(0, this.maxTrackedCapacity);
        this.totalDetectedContacts = qualifiedTracks.length;

        // Auto-designate Index 0 as Primary Weapon Target Lock
        if (this.sortedTrackRecords.length > 0) {
            for (let j = 0; j < this.sortedTrackRecords.length; j++) {
                this.sortedTrackRecords[j].isPrimaryLock = (j === 0);
            }
            this.primaryTargetLock = this.sortedTrackRecords[0];
        } else {
            this.primaryTargetLock = null;
        }

        return this.sortedTrackRecords;
    }

    /**
     * Get Primary Target coordinates for missile guidance and gun turret slewing
     */
    getPrimaryTargetLock() {
        return this.primaryTargetLock;
    }
}

// Module export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TARGET_CLASS,
        THREAT_CLASS_SCORES,
        TDLVector3,
        DataLinkTrack,
        Link16NetworkBus,
        FCRTrackRecord,
        FireControlRadar
    };
}
if (typeof window !== 'undefined') {
    window.TARGET_CLASS = TARGET_CLASS;
    window.THREAT_CLASS_SCORES = THREAT_CLASS_SCORES;
    window.DataLinkTrack = DataLinkTrack;
    window.Link16NetworkBus = Link16NetworkBus;
    window.FireControlRadar = FireControlRadar;
}
