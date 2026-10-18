/**
 * =========================================================================================
 * GNCSystem.js - Comprehensive Guidance, Navigation, and Control (GNC) Engine
 * -----------------------------------------------------------------------------------------
 * Implements:
 * 1. Discrete 3D Proportional-Integral-Derivative (PID) Anti-Gravity Hover Controller
 *    - Independent vertical (Y) and horizontal (XZ) gain matrices (Kp, Ki, Kd)
 *    - Strict anti-windup clamping threshold on integral accumulator
 *    - Low-pass filtered derivative term (alpha filter) to eliminate physics jitter
 *    - Continuous force vector output applied directly to Rigidbody Center of Mass
 * 2. Terrain Following Radar (TFR) Kinematics
 *    - 3-ray predictive down-forward lookahead array (0° downward, 30° forward, 45° forward)
 *    - Dynamic lookahead distance scaling based on forward velocity (50m to 300m)
 *    - Surface hit analysis & highest obstacle projection
 *    - Cubic Hermite Spline target altitude smoother (+15.0m clearance above highest terrain)
 *
 * Engine Target: PlayCanvas Engine (v2.x / v1.x compatible) & Standalone Rigidbody Physics
 * Zero-Dependency Architecture: All vector, raycast, and spline mathematics self-contained.
 * =========================================================================================
 */

'use strict';

/**
 * Self-contained 3D Vector Math Utility if running outside PlayCanvas context
 */
class Vector3D {
    constructor(x = 0, y = 0, z = 0) {
        this.x = Number(x) || 0;
        this.y = Number(y) || 0;
        this.z = Number(z) || 0;
    }

    set(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        return this;
    }

    copy(v) {
        this.x = v.x;
        this.y = v.y;
        this.z = v.z;
        return this;
    }

    clone() {
        return new Vector3D(this.x, this.y, this.z);
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        this.z += v.z;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        this.z -= v.z;
        return this;
    }

    scale(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        return this;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    lengthSq() {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    normalize() {
        const len = this.length();
        if (len > 1e-6) {
            this.x /= len;
            this.y /= len;
            this.z /= len;
        } else {
            this.x = 0;
            this.y = 0;
            this.z = 0;
        }
        return this;
    }

    dot(v) {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    cross(v) {
        const vx = this.y * v.z - this.z * v.y;
        const vy = this.z * v.x - this.x * v.z;
        const vz = this.x * v.y - this.y * v.x;
        this.x = vx;
        this.y = vy;
        this.z = vz;
        return this;
    }

    lerp(v, t) {
        this.x += (v.x - this.x) * t;
        this.y += (v.y - this.y) * t;
        this.z += (v.z - this.z) * t;
        return this;
    }
}

/**
 * Tuning parameters structure for PID axes
 */
class PIDTuning {
    constructor(kp, ki, kd, maxIntegral, alphaFilter) {
        this.kp = kp;                     // Proportional gain
        this.ki = ki;                     // Integral gain
        this.kd = kd;                     // Derivative gain
        this.maxIntegral = maxIntegral;   // Strict anti-windup clamping threshold
        this.alphaFilter = alphaFilter;   // Low-pass filter weight (0.0 to 1.0)
    }
}

/**
 * 1-Axis Discrete PID Controller with anti-windup accumulator and low-pass filtered derivative
 */
class DiscretePID1D {
    constructor(tuning) {
        this.tuning = tuning;
        this.integral = 0.0;
        this.prevError = 0.0;
        this.filteredDerivative = 0.0;
        this.hasPrevious = false;
    }

    reset() {
        this.integral = 0.0;
        this.prevError = 0.0;
        this.filteredDerivative = 0.0;
        this.hasPrevious = false;
    }

    /**
     * Compute PID correction output for a scalar signal
     * @param {number} target Desired setpoint
     * @param {number} current Current measured state
     * @param {number} dt Time step in seconds
     * @returns {number} Corrective force scalar
     */
    update(target, current, dt) {
        if (dt <= 1e-6) return 0.0;

        const error = target - current;

        // Proportional term
        const pTerm = this.tuning.kp * error;

        // Integral term with anti-windup clamping
        this.integral += error * dt;
        if (this.integral > this.tuning.maxIntegral) {
            this.integral = this.tuning.maxIntegral;
        } else if (this.integral < -this.tuning.maxIntegral) {
            this.integral = -this.tuning.maxIntegral;
        }
        const iTerm = this.tuning.ki * this.integral;

        // Derivative term with low-pass filtering to eliminate physics jitter
        let rawDerivative = 0.0;
        if (this.hasPrevious) {
            rawDerivative = (error - this.prevError) / dt;
        } else {
            rawDerivative = 0.0;
            this.hasPrevious = true;
        }

        // Low-pass filter: y[k] = alpha * raw + (1 - alpha) * y[k-1]
        this.filteredDerivative = (this.tuning.alphaFilter * rawDerivative) +
                                  ((1.0 - this.tuning.alphaFilter) * this.filteredDerivative);

        const dTerm = this.tuning.kd * this.filteredDerivative;
        this.prevError = error;

        return pTerm + iTerm + dTerm;
    }
}

/**
 * 3D PID Controller combining Vertical (Y) and Horizontal (X, Z) controllers
 */
class AntiGravityPID3D {
    constructor(verticalTuning, horizontalTuning) {
        this.pidX = new DiscretePID1D(horizontalTuning);
        this.pidY = new DiscretePID1D(verticalTuning);
        this.pidZ = new DiscretePID1D(horizontalTuning);
        this.outputForce = new Vector3D(0, 0, 0);
    }

    reset() {
        this.pidX.reset();
        this.pidY.reset();
        this.pidZ.reset();
        this.outputForce.set(0, 0, 0);
    }

    /**
     * Update 3D PID loop
     * @param {Vector3D} targetPos Target position vector
     * @param {Vector3D} currentPos Current position vector
     * @param {number} dt Delta time step
     * @param {number} totalMass Vehicle total mass (kg) for gravity compensation
     * @param {number} gravity Gravity acceleration (m/s^2, typically 9.80665)
     * @returns {Vector3D} Continuous force vector applied to CoM
     */
    computeForce(targetPos, currentPos, dt, totalMass = 2000.0, gravity = 9.80665) {
        const fx = this.pidX.update(targetPos.x, currentPos.x, dt);
        const fy = this.pidY.update(targetPos.y, currentPos.y, dt);
        const fz = this.pidZ.update(targetPos.z, currentPos.z, dt);

        // Vertical axis includes base gravity counteracting force (Anti-Gravity baseline)
        const antiGravityFeedforward = totalMass * gravity;

        this.outputForce.set(fx, fy + antiGravityFeedforward, fz);
        return this.outputForce;
    }
}

/**
 * Cubic Hermite Spline Altitude Smoother
 * Evaluates smooth transition between current target altitude and new detected radar terrain target
 */
class HermiteAltitudeSmoother {
    constructor() {
        this.p0 = 15.0;     // Initial point
        this.p1 = 15.0;     // Target point
        this.m0 = 0.0;      // Initial tangent (climb velocity)
        this.m1 = 0.0;      // Target tangent
        this.timer = 0.0;   // Interpolation timer
        this.duration = 1.2;// Smoothing duration in seconds
        this.currentSmoothedAltitude = 15.0;
    }

    /**
     * Set a new terrain elevation target
     * @param {number} targetAltitude Desired altitude in world coordinates
     * @param {number} currentClimbRate Current vertical speed
     */
    setTarget(targetAltitude, currentClimbRate) {
        if (Math.abs(targetAltitude - this.p1) > 0.25) {
            this.p0 = this.currentSmoothedAltitude;
            this.p1 = targetAltitude;
            this.m0 = currentClimbRate;
            this.m1 = 0.0; // Level off at the crest
            this.timer = 0.0;
            // Scale duration based on elevation step magnitude (prevents jerky response on cliffs)
            const deltaAlt = Math.abs(this.p1 - this.p0);
            this.duration = Math.max(0.8, Math.min(2.5, 0.8 + deltaAlt * 0.05));
        }
    }

    /**
     * Evaluate cubic Hermite spline:
     * h(t) = (2t^3 - 3t^2 + 1)p0 + (t^3 - 2t^2 + t)m0 + (-2t^3 + 3t^2)p1 + (t^3 - t^2)m1
     * @param {number} dt Delta time
     * @returns {number} Interpolated smooth altitude
     */
    update(dt) {
        this.timer += dt;
        let t = this.timer / this.duration;
        if (t >= 1.0) {
            t = 1.0;
            this.currentSmoothedAltitude = this.p1;
            return this.currentSmoothedAltitude;
        }

        const t2 = t * t;
        const t3 = t2 * t;

        const h00 = 2.0 * t3 - 3.0 * t2 + 1.0;
        const h10 = t3 - 2.0 * t2 + t;
        const h01 = -2.0 * t3 + 3.0 * t2;
        const h11 = t3 - t2;

        this.currentSmoothedAltitude = (h00 * this.p0) +
                                      (h10 * this.m0 * this.duration) +
                                      (h01 * this.p1) +
                                      (h11 * this.m1 * this.duration);

        return this.currentSmoothedAltitude;
    }
}

/**
 * Terrain Following Radar (TFR) Raycast Definition
 */
class TFRRayDefinition {
    constructor(angleDegrees, label) {
        this.angleDegrees = angleDegrees; // Angle forward from downward vector
        this.label = label;
        this.hit = false;
        this.hitPoint = new Vector3D(0, 0, 0);
        this.hitNormal = new Vector3D(0, 1, 0);
        this.hitDistance = 0.0;
    }
}

/**
 * Main GNC Engine Script Component
 */
class GNCSystem {
    constructor(app, entity) {
        this.app = app;
        this.entity = entity;

        // GNC Mode State
        this.isHoverEngaged = true;
        this.isTFREngaged = true;
        this.tfrClearanceMargin = 15.0; // Exactly 15.0 meters above projected highest terrain point

        // Kinematic state
        this.currentPosition = new Vector3D(0, 15, 0);
        this.targetPosition = new Vector3D(0, 15, 0);
        this.linearVelocity = new Vector3D(0, 0, 0);
        this.forwardVector = new Vector3D(0, 0, 1);
        this.upVector = new Vector3D(0, 1, 0);
        this.rightVector = new Vector3D(1, 0, 0);

        // Tuning parameters according to specifications
        // Vertical axis: High stiffness to maintain altitude against gravity & downdrafts
        this.verticalTuning = new PIDTuning(
            4500.0,  // Kp_y (Proportional gain: 4500 N/m)
            350.0,   // Ki_y (Integral gain: 350 N/m*s)
            2800.0,  // Kd_y (Derivative gain: 2800 N/(m/s))
            3000.0,  // maxIntegral: strict anti-windup clamping threshold
            0.25     // alphaFilter: 25% new raw signal, 75% filtered history
        );

        // Horizontal plane (X, Z): Controlled position retention without overshooting
        this.horizontalTuning = new PIDTuning(
            2200.0,  // Kp_xz (Proportional gain: 2200 N/m)
            120.0,   // Ki_xz (Integral gain: 120 N/m*s)
            1900.0,  // Kd_xz (Derivative gain: 1900 N/(m/s))
            1500.0,  // maxIntegral: strict anti-windup clamping threshold
            0.20     // alphaFilter: 20% new raw signal, 80% filtered history
        );

        // 3D PID Controller instance
        this.pidController = new AntiGravityPID3D(this.verticalTuning, this.horizontalTuning);

        // Altitude smoother instance
        this.altitudeSmoother = new HermiteAltitudeSmoother();

        // TFR Ray Array:
        // Ray 0: Downward (0 degrees from down vector)
        // Ray 1: 30 degrees forward from downward vector
        // Ray 2: 45 degrees forward from downward vector
        this.tfrRays = [
            new TFRRayDefinition(0.0, "RAY_0_NADIR_DOWN"),
            new TFRRayDefinition(30.0, "RAY_1_FWD_30DEG"),
            new TFRRayDefinition(45.0, "RAY_2_FWD_45DEG")
        ];

        // Dynamic lookahead limits
        this.minLookaheadDistance = 50.0;   // Minimum length at 0 m/s
        this.maxLookaheadDistance = 300.0;  // Maximum length at terminal velocity
        this.terminalVelocity = 100.0;      // 100 m/s (approx 194 knots)
        this.currentLookaheadDistance = 50.0;

        // Telemetry outputs
        this.highestDetectedTerrainY = 0.0;
        this.computedControlForce = new Vector3D(0, 0, 0);
        this.pitchDegrees = 0.0;
        this.rollDegrees = 0.0;
    }

    /**
     * Compute predictive ray direction in world space
     * @param {number} forwardAngleDeg Angle forward from straight down
     * @returns {Vector3D} Normalized world ray direction
     */
    calculateRayDirection(forwardAngleDeg) {
        const rad = forwardAngleDeg * (Math.PI / 180.0);
        const cosTheta = Math.cos(rad);
        const sinTheta = Math.sin(rad);

        // Ray direction = -Up * cosTheta + Forward * sinTheta
        const rayDir = new Vector3D();
        rayDir.x = -this.upVector.x * cosTheta + this.forwardVector.x * sinTheta;
        rayDir.y = -this.upVector.y * cosTheta + this.forwardVector.y * sinTheta;
        rayDir.z = -this.upVector.z * cosTheta + this.forwardVector.z * sinTheta;
        rayDir.normalize();
        return rayDir;
    }

    /**
     * Dynamic Lookahead Distance Calculation
     * Scales from 50m to 300m based on forward velocity
     */
    calculateDynamicLookahead() {
        const forwardSpeed = Math.max(0.0, this.linearVelocity.dot(this.forwardVector));
        const velocityRatio = Math.min(1.0, Math.max(0.0, forwardSpeed / this.terminalVelocity));
        this.currentLookaheadDistance = this.minLookaheadDistance +
            (this.maxLookaheadDistance - this.minLookaheadDistance) * velocityRatio;
        return this.currentLookaheadDistance;
    }

    /**
     * Execute Terrain Following Radar Kinematic Evaluation
     * Casts 3 rays, analyzes terrain hits, and updates the target altitude
     * @param {Vector3D} nosePosition World coordinates of vehicle nose
     * @param {Function} raycastCallback Physics raycast provider (start, end) => hitInfo
     */
    executeTFRScan(nosePosition, raycastCallback) {
        if (!this.isTFREngaged) return;

        const lookahead = this.calculateDynamicLookahead();
        let maxTerrainElevation = -99999.0;
        let anyHitDetected = false;

        for (let i = 0; i < this.tfrRays.length; i++) {
            const rayDef = this.tfrRays[i];
            const rayDir = this.calculateRayDirection(rayDef.angleDegrees);

            // Ray 0 (direct down) length is capped to clearance + lookahead margin
            // Rays 1 and 2 scale dynamically with forward velocity
            let rayLength = (i === 0) ? Math.max(80.0, lookahead * 0.4) : lookahead;

            const rayStart = nosePosition.clone();
            const rayEnd = nosePosition.clone().add(rayDir.clone().scale(rayLength));

            // Perform raycast
            let hitResult = null;
            if (typeof raycastCallback === 'function') {
                hitResult = raycastCallback(rayStart, rayEnd);
            } else if (this.app && this.app.systems && this.app.systems.rigidbody) {
                const pcResult = this.app.systems.rigidbody.raycastFirst(
                    new pc.Vec3(rayStart.x, rayStart.y, rayStart.z),
                    new pc.Vec3(rayEnd.x, rayEnd.y, rayEnd.z)
                );
                if (pcResult) {
                    hitResult = {
                        point: new Vector3D(pcResult.point.x, pcResult.point.y, pcResult.point.z),
                        normal: new Vector3D(pcResult.normal.x, pcResult.normal.y, pcResult.normal.z),
                        distance: rayStart.clone().sub(new Vector3D(pcResult.point.x, pcResult.point.y, pcResult.point.z)).length()
                    };
                }
            }

            if (hitResult) {
                rayDef.hit = true;
                rayDef.hitPoint.copy(hitResult.point);
                rayDef.hitNormal.copy(hitResult.normal);
                rayDef.hitDistance = hitResult.distance;
                anyHitDetected = true;

                if (hitResult.point.y > maxTerrainElevation) {
                    maxTerrainElevation = hitResult.point.y;
                }
            } else {
                rayDef.hit = false;
                rayDef.hitDistance = rayLength;
            }
        }

        // If hits were found, highest point determines target hover altitude
        if (anyHitDetected && maxTerrainElevation > -90000.0) {
            this.highestDetectedTerrainY = maxTerrainElevation;
            const desiredAltitude = this.highestDetectedTerrainY + this.tfrClearanceMargin;
            this.altitudeSmoother.setTarget(desiredAltitude, this.linearVelocity.y);
        } else {
            // Default minimum floor target if in open space
            this.highestDetectedTerrainY = 0.0;
            this.altitudeSmoother.setTarget(this.tfrClearanceMargin, this.linearVelocity.y);
        }
    }

    /**
     * Fixed-rate physics update loop (FixedUpdate)
     * Calculates PID hover forces and applies them directly to Rigidbody Center of Mass
     * @param {number} fixedDeltaTime Fixed time step (e.g. 0.01667 or 0.02)
     * @param {number} vehicleMass Current total mass of vehicle (kg)
     * @param {Function} raycastFunction Engine raycasting hook
     * @returns {Vector3D} Force vector applied to Rigidbody
     */
    fixedUpdate(fixedDeltaTime, vehicleMass = 2000.0, raycastFunction = null) {
        // Read current entity spatial orientation
        this.updateOrientationVectors();

        // Execute TFR kinematic lookahead array
        const noseWorldPos = this.currentPosition.clone().add(this.forwardVector.clone().scale(4.2));
        this.executeTFRScan(noseWorldPos, raycastFunction);

        // Smooth target altitude via cubic Hermite spline
        if (this.isTFREngaged) {
            const smoothedTargetY = this.altitudeSmoother.update(fixedDeltaTime);
            this.targetPosition.y = smoothedTargetY;
        }

        // Run PID Anti-Gravity Hover loop if engaged
        if (this.isHoverEngaged) {
            this.computedControlForce = this.pidController.computeForce(
                this.targetPosition,
                this.currentPosition,
                fixedDeltaTime,
                vehicleMass,
                9.80665
            );

            // Apply force directly to Rigidbody center of mass
            if (this.entity && this.entity.rigidbody) {
                if (typeof pc !== 'undefined' && pc.Vec3) {
                    this.entity.rigidbody.applyForce(new pc.Vec3(
                        this.computedControlForce.x,
                        this.computedControlForce.y,
                        this.computedControlForce.z
                    ));
                } else if (typeof this.entity.rigidbody.applyForce === 'function') {
                    this.entity.rigidbody.applyForce(
                        this.computedControlForce.x,
                        this.computedControlForce.y,
                        this.computedControlForce.z
                    );
                }
            }
        } else {
            this.computedControlForce.set(0, 0, 0);
        }

        return this.computedControlForce;
    }

    /**
     * Synchronize orientation vectors from vehicle entity transforms
     */
    updateOrientationVectors() {
        if (!this.entity) return;

        if (this.entity.getPosition) {
            const p = this.entity.getPosition();
            this.currentPosition.set(p.x, p.y, p.z);
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

        // Rigidbody linear velocity
        if (this.entity.rigidbody && this.entity.rigidbody.linearVelocity) {
            const lv = this.entity.rigidbody.linearVelocity;
            this.linearVelocity.set(lv.x, lv.y, lv.z);
        }

        // Compute pitch and roll angles in degrees
        this.pitchDegrees = Math.asin(Math.max(-1.0, Math.min(1.0, this.forwardVector.y))) * (180.0 / Math.PI);
        this.rollDegrees = Math.atan2(this.rightVector.y, this.upVector.y) * (180.0 / Math.PI);
    }

    /**
     * Pilot commanding a new hover position
     */
    setHoverPosition(x, y, z) {
        this.targetPosition.set(x, y, z);
    }

    /**
     * Toggle Automated Hover Hold
     */
    setHoverEngaged(engaged) {
        this.isHoverEngaged = Boolean(engaged);
        if (this.isHoverEngaged) {
            // Re-anchor target position to current position
            this.targetPosition.copy(this.currentPosition);
            this.pidController.reset();
        }
    }

    /**
     * Toggle Terrain Following Radar (TFR)
     */
    setTFREngaged(engaged) {
        this.isTFREngaged = Boolean(engaged);
    }
}

// Module export for Node.js / ES6 / Browser globals
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Vector3D,
        PIDTuning,
        DiscretePID1D,
        AntiGravityPID3D,
        HermiteAltitudeSmoother,
        TFRRayDefinition,
        GNCSystem
    };
}
if (typeof window !== 'undefined') {
    window.GNCSystem = GNCSystem;
    window.AntiGravityPID3D = AntiGravityPID3D;
    window.HermiteAltitudeSmoother = HermiteAltitudeSmoother;
}
