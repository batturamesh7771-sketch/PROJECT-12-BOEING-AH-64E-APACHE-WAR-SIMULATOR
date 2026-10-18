# Master Aerospace Prompt Engineering Framework

This document records the exact Master Prompt used to architect, design, and implement the comprehensive defense avionics and anti-gravity flight physics systems for **PROJECT-12: Boeing AH-64E Apache Guardian Border Defense Combat Flight Simulator**.

---

```text
ROLE, CONTEXT, AND MISSION
You are acting as a Principal Aerospace Software Engineer, Defense Systems Architect, and Veteran Gameplay Programmer. Your mission is to write a comprehensive, production-ready, ultra-high-fidelity software architecture for an advanced combat vehicle in a realistic anti-gravity battle helicopter game. 

Target Environment: PlayCanvas JavaScript
Physics Paradigm: Rigidbody-based physics using realistic force vectors, torque matrices, and manual kinematics. 
Architecture Constraints: Absolute zero-dependency rule. You must not use any third-party plugins, external asset store packages, or web APIs. Everything must be calculated natively from scratch using pure code, vector mathematics, trigonometric tracking, matrix transforms, native physics raycasting, and built-in engine UI/Canvas architectures. No placeholders, no "// TODO: implement logic here" comments, and no truncated code structures are allowed. Write out every single mathematical function, loop, variable declaration, enum, and operational sequence completely.

PHYSICS & CONTROL BASIS
The vehicle operates on an anti-gravity propulsion system replacing traditional mechanical rotors. Anti-gravity is simulated by calculating continuous vertical thrust vectors counteracting world gravity, combined with aerodynamic drag, angular damping, and center-of-mass balancing.

---

SYSTEM 1: COMPREHENSIVE GNC (GUIDANCE, NAVIGATION, AND CONTROL) ENGINE

1.1 MATHEMATICAL DESCRIPTION OF THE PID ANTI-GRAVITY HOVER CONTROLLER
You must implement a discrete, mathematical Proportional-Integral-Derivative (PID) controller loop running inside the fixed-rate physics update loop (FixedUpdate or equivalent) to manage the vehicle's altitude and spatial position during an automated hover state.
- Inputs: A Vector3 tracking the desired world-space coordinate (Target Position) and a Vector3 tracking the current world-space coordinate (Current Position).
- Output: A continuous Vector3 force vector applied directly to the Rigidbody's center of mass.
- Mathematical Constants: Define individual tuning structures for Proportional Gain (Kp), Integral Gain (Ki), and Derivative Gain (Kd) for both the vertical axis (Y) and the horizontal plane (X, Z).
- Accumulator Management: Implement a strict anti-windup clamping threshold for the Integral accumulator to prevent catastrophic calculation explosion when external forces violently displace the vehicle. Calculate the derivative term based on the change in error divided by the delta-time step, utilizing low-pass filtering on the derivative signal to remove erratic physics jitter.

1.2 TERRAIN FOLLOWING RADAR (TFR) KINEMATICS
The TFR computer must look ahead of the helicopter's trajectory to predict terrain changes before they physically alter the vehicle's position.
- Raycast Array: Implement an array of three down-forward predictive raycasts emanating from the nose of the vehicle. Ray 0 projects directly downward (0 degrees). Ray 1 projects 30 degrees forward from the downward vector. Ray 2 projects 45 degrees forward from the downward vector.
- Lookahead Distance Calculation: Scale the length of the forward raycasts dynamically based on the current forward linear velocity of the vehicle (Minimum length 50 meters, expanding up to 300 meters at terminal forward velocity).
- Terrain Analysis Logic: For each physics tick, read the hit distance and hit normal vectors of all three raycasts. Calculate the highest terrain point detected among the hits. 
- Vertical Target Update: Dynamically recalculate the target altitude of the PID hover controller to exactly 15.0 meters above the projected highest terrain point. Smooth the transition curve using a continuous box-car floating average filter or a mathematically precise cubic Hermite spline interpolation over time to prevent violent, jerky vertical movements when passing over sheer cliffs or sharp mountain ridges.

---

SYSTEM 2: ELECTRONIC WARFARE & RADAR SUITE (RWR & CMDS)

2.1 RADAR WARNING RECEIVER (RWR) ELECTROMAGNETIC SIMULATION
The RWR must actively track all radar emitters in the combat zone. It operates via an active polling and signal evaluation loop tracking game entities with an 'EnemyRadar' classification component.
- Threat Acquisition: Scan the scene to map active enemy radar sources. For each emitter, calculate the distance vector and the absolute angle relative to the helicopter's forward facing direction.
- Azimuth and Threat Grid Translation: Map the relative 360-degree angle of the threat into a normalized local coordinate grid (-180 to +180 degrees). Determine the operational status of the threat emitter based on distance and line-of-sight raycasts: 
  * Status: "SEARCH" (Line of sight established, distance > 500 meters).
  * Status: "TRACK" (Line of sight established, distance <= 500 meters, radar sweep angle focused on player).
  * Status: "LOCK" (Active missile guidance radar beam tracking player).
- Audio Threat Tone Logic: Output precise telemetry variables dictating a procedural audio generation system. The system must output a structural frequency blueprint: a slow, alternating beep pattern for SEARCH (1Hz pulse rate), a rapid, aggressive beep pattern for TRACK (5Hz pulse rate), and a continuous, high-pitched warning tone for LOCK (constant execution), feeding into the UI visual telemetry system.

2.2 AUTOMATED COUNTERMEASURES DISPENSING SYSTEM (CMDS)
The CMDS acts as an autonomous computer-controlled active defense grid.
- Lock Evaluation Intercept: Monitor the RWR state variables. The exact instant an emitter status shifts to "LOCK", initiate an automated threat neutralization sequence.
- Dispense Interval Loop: Execute a time-locked execution thread that fires every 0.25 seconds as long as a missile lock remains active.
- Physical Object Instantiation: Inside the code, construct a programmatic generation routine that instantiates a physical countermeasure game object behind the vehicle's exhaust nodes. 
  * For Heat-Seeking Threats: Instantiate an active "Flare" object. The flare script must immediately add a randomized lateral ejection velocity vector and apply a continuous thermal decoy radius value that ticks down over a 3.0-second burn life.
  * For Radar-Guided Threats: Instantiate a "Chaff" object. The chaff script must apply zero velocity, deploy an expanding cloud collider mesh representing a cloud of reflective aluminum strips, and generate a localized electromagnetic noise field to decoy incoming radar tracking algorithms.
- Tracking Decoy Logic: Write the specific intercept function demonstrating how the presence of a deployed Flare or Chaff object modifies the target trajectory of an incoming enemy missile object by overriding its internal target tracker reference from the helicopter's transform to the countermeasure's transform based on distance probability calculations.

---

SYSTEM 3: TACTICAL DATA LINK & FIRE CONTROL RADAR (FCR) TARGET SORTING

3.1 LINK 16 DATA PIPELINE SIMULATION
Simulate a military encrypted ad-hoc network layer that lets friendly units share target data in real time.
- Data Structure Blueprint: Define a robust, lightweight structure named 'DataLinkTrack' containing: a unique tracking ID (string), a target classification enum (Air, TrackedGround, WheeledGround, StaticStructure), a world-space position vector (Vector3), a velocity vector (Vector3), a target signature strength (float), and a network time-stamp (float).
- Network Synced Register: Create a central static network manager class that acts as the data bus. Friendly scout drones, forward ground troops, and airborne early warning aircraft write their local sensor detections directly into this registry.
- Encryption and Latency Emulation: When reading data from the Link 16 registry, add a procedural network latency delay (0.1 to 0.5 seconds) based on distance from the reporting unit, and add a small, randomized error deviation to the Vector3 position data to simulate realistic radio-electronic distortion over long ranges.

3.2 FIRE CONTROL RADAR (FCR) TARGET SELECTION AND PRIORITY SORTING
The FCR represents the primary computation block for offensive target prioritization.
- Conical Volumetric Sweep: Define a forward-facing radar cone with a maximum range of 1000 meters and a horizontal sweep aperture angle of exactly 90 degrees (+/- 45 degrees from the vehicle's nose).
- Mathematical Filtering: Iterate through all available entities in the Link 16 registry and local physics overlap spheres. Filter out any target whose angular offset from the helicopter's forward vector exceeds the 45-degree threshold using dot product calculations (`Vector3.Dot`). Perform a line-of-sight raycast to ensure the target is not hidden behind world terrain geometry.
- Priority Threat Matrix Formula: Implement a multi-factored algorithmic scoring equation to calculate a 'Threat Index Weight' (float) for up to 16 simultaneously tracked targets. The formula must prioritize targets based on three weighted criteria:
  * Proximity Score (45% weight): Inverse linear scale of distance to target (closer targets score higher).
  * Threat Class Score (35% weight): Static weight lookup based on classification enum (Air Defense Systems = 100 points, Tracked Armor = 60 points, Soft Wheeled Vehicles = 30 points, Static Structures = 10 points).
  * Aspect Angle/Velocity Vector Score (20% weight): Calculate if the target's velocity vector points directly at the helicopter (converging threat velocity scores significantly higher than a retreating target).
- Sorting Implementation: Sort the array of 16 targets in descending order based on their calculated Threat Index Weight. The target at Index 0 is automatically designated as the 'Primary Weapon Target Lock' and its tracking coordinates are fed instantly to the fire control UI and missile tracking rails.

---

SYSTEM 4: MULTI-FUNCTION DISPLAY (MFD) ENGINE & STORES MANAGEMENT SYSTEM (SMS)

4.1 STORES MANAGEMENT SYSTEM (SMS) BALANCING DATA MATRIX
The SMS acts as an active digital inventory manager that interfaces directly with the vehicle's physical rigid-body flight characteristics.
- Hardpoint Payload Configuration: Build a structural data matrix that models 4 distinct weapon stations (Left Outboard, Left Inboard, Right Inboard, Right Outboard). Each station holds a weapon type enum:
  * Heavy Anti-Armor Guided Missile (Weight: 50kg per unit, Max capacity: 4 per hardpoint).
  * High-Explosive Unguided Rocket Pod (Weight: 100kg per fully loaded pod, Max capacity: 1 pod per hardpoint).
  * 30mm Autocannon Ammunition Drum (Central fuselage mount, Weight: 0.1kg per round, Max capacity: 1200 rounds).
- Dynamic Mass and Center of Gravity (CoG) Recalculation: Write an automated updating function that executes every single time a weapon is discharged (e.g., a missile is launched or a rocket is fired).
  * Step 1: Calculate the total base mass of the helicopter empty shell (e.g., 2000kg).
  * Step 2: Loop through all 4 hardpoints and add the current dynamic weight of remaining ordnance plus remaining autocannon ammo mass to compute the new Total Mass. Assign this value directly to the Rigidbody's mass property (Rigidbody.mass).
  * Step 3: Compute the shift in the Center of Mass (CoM). Each weapon hardpoint must have a predefined local offset vector relative to the structural origin of the 3D model. Calculate the weighted average of all remaining payloads to dynamically offset the Rigidbody's center of mass property (Rigidbody.centerOfMass). For example, if all missiles on the left wing are fired while the right wing remains fully loaded, the Center of Mass must mathematically shift to the right, causing the flight physics engine to automatically introduce a realistic left-rolling torque that the GNC autopilot system must actively fight to counteract.

4.2 DATA TELEMETRY VISUALIZATION & MFD INTERFACE CODES
Design a highly structured text-based telemetry stream framework designed to drive an interactive screen interface (Cockpit UI Canvas).
- Page State Machine: Implement an execution enum tracking the current active page of the MFD (MFD_PAGE { MENU, GNC_TFR, EW_RWR, TAC_LINK, SMS_STORES }).
- Text Generator String Architecture: For each specific page state, create a highly formatted, clean string concatenation loop that prints real-time telemetry variables to the console log or a UI Text field. The screens must display formatting matching military hardware layouts exactly:
  * GNC_TFR Page Format: Show Current Altitude, Target Hover Altitude, TFR Status (Active/Standby), Forward Lookahead Distance, Current Pitch/Roll Angles, and PID Correction Force Vector output values.
  * EW_RWR Page Format: Show Active Threat Count, Relative Threat Bearings, Threat Status Alert Levels (SEARCH/TRACK/LOCK), Chaff Count, and Flare Count.
  * TAC_LINK Page Format: Print the complete tracked list of the top 16 sorted targets within the FCR cone, displaying their Assigned Target ID, Classification String, Threat Index Score, Distance in meters, and Lock Status.
  * SMS_STORES Page Format: Output individual status readouts for each of the 4 weapon hardpoints, including Current Round Counts, Total Remaining Payload Weight, Calculated Center of Mass Offset Values, and active weapon selection brackets.
```
