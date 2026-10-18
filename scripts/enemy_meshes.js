# build_enemy_and_weapons_patch.py
# Generates the code blocks for the 12 distinct enemy units, realistic 30mm tracers,
# dynamic muzzle flashes, shell casings, TADS click-to-lock, and Groq Athena AI.

import os

ENEMY_MESHES_CODE = '''
      /**
       * Procedural 3D Mesh Builders for 12 Distinct Indo-Pak Border Adversary / Insurgent Unit Types
       */
      createUnitMesh(type, isAir, role) {
        const root = new THREE.Group();
        const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.6 });
        const darkArmorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.5 });
        const camoMat = new THREE.MeshStandardMaterial({ color: 0x3d4a36, roughness: 0.8, metalness: 0.2 });
        const sandMat = new THREE.MeshStandardMaterial({ color: 0x785e3a, roughness: 0.9, metalness: 0.1 });
        const rustMat = new THREE.MeshStandardMaterial({ color: 0x5c3a21, roughness: 0.85, metalness: 0.3 });
        const radarGlowMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0x881337, roughness: 0.3 });
        const opticalLensMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const tireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

        if (type.includes('SAM')) {
          // 1. HQ-17A / SA-15 Tracked Mobile SAM Battery
          const chassis = new THREE.Mesh(new THREE.BoxGeometry(6.8, 2.2, 10.2), camoMat);
          chassis.position.y = 1.3;
          chassis.castShadow = true;
          root.add(chassis);

          // 12 Road Wheels & Treads
          for (let s = -1; s <= 1; s += 2) {
            const trackSkirt = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 10.4), darkArmorMat);
            trackSkirt.position.set(s * 3.5, 0.8, 0);
            root.add(trackSkirt);
            for (let w = 0; w < 6; w++) {
              const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 12), tireMat);
              wheel.rotateZ(Math.PI / 2);
              wheel.position.set(s * 3.4, 0.55, -4.0 + w * 1.6);
              root.add(wheel);
            }
          }

          // Rotating Turret & 4 Vertical Launch Tubes
          const turret = new THREE.Mesh(new THREE.BoxGeometry(4.4, 1.8, 5.2), camoMat);
          turret.position.set(0, 3.2, -0.6);
          root.add(turret);

          const canister = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.4, 3.2), darkArmorMat);
          canister.position.set(0, 4.8, -0.8);
          root.add(canister);

          // 4 Missile Tube Openings
          [-0.8, 0.8].forEach(mx => {
            [-0.8, 0.8].forEach(mz => {
              const tubeCap = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 10), radarGlowMat);
              tubeCap.position.set(mx, 6.05, -0.8 + mz);
              root.add(tubeCap);
            });
          });

          // Spinning Acquisition Radar Dome & Tracking Dish
          const radarMast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.6, 8), metalMat);
          radarMast.position.set(0, 5.8, 1.2);
          root.add(radarMast);

          const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.25, 14), radarGlowMat);
          dish.rotateX(Math.PI / 3);
          dish.position.set(0, 6.7, 1.2);
          root.add(dish);
          root.userData.dishMesh = dish;

        } else if (type.includes('TANK')) {
          // 2. Al-Khalid / T-90 Main Battle Tank
          const hull = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.8, 11.5), camoMat);
          hull.position.y = 1.1;
          hull.castShadow = true;
          root.add(hull);

          // Sloped front glacis plate
          const glacis = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.6, 2.5), camoMat);
          glacis.position.set(0, 1.6, 5.2);
          glacis.rotateX(-0.35);
          root.add(glacis);

          // Road wheels & tracks
          for (let s = -1; s <= 1; s += 2) {
            const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.1, 11.2), darkArmorMat);
            skirt.position.set(s * 3.7, 0.7, 0);
            root.add(skirt);
            for (let w = 0; w < 6; w++) {
              const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 12), tireMat);
              wheel.rotateZ(Math.PI / 2);
              wheel.position.set(s * 3.6, 0.5, -4.5 + w * 1.8);
              root.add(wheel);
            }
          }

          // Cast Turret with Explosive Reactive Armor (ERA) Blocks
          const turret = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.2, 1.4, 16), camoMat);
          turret.position.set(0, 2.6, 0.2);
          root.add(turret);

          // Long 125mm Smoothbore Main Cannon & Thermal Sleeve
          const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 7.8, 12), metalMat);
          barrel.rotateX(Math.PI / 2);
          barrel.position.set(0, 2.7, 5.0);
          root.add(barrel);

          const boreEvac = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.2, 10), darkArmorMat);
          boreEvac.rotateX(Math.PI / 2);
          boreEvac.position.set(0, 2.7, 4.5);
          root.add(boreEvac);

          // Commander's 12.7mm Anti-Air Hatch Gun
          const mg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 1.8, 8), metalMat);
          mg.rotateX(Math.PI / 2);
          mg.position.set(0.9, 3.6, 0.6);
          root.add(mg);

        } else if (type.includes('SHILKA') || type.includes('AAA')) {
          // 3. ZSU-23-4 Shilka Quad Anti-Aircraft Artillery
          const chassis = new THREE.Mesh(new THREE.BoxGeometry(6.4, 1.9, 9.8), camoMat);
          chassis.position.y = 1.1;
          root.add(chassis);

          const turret = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.9, 1.6, 14), darkArmorMat);
          turret.position.set(0, 2.6, -0.4);
          root.add(turret);

          // Quad 23mm Autocannon Barrels (2 pairs)
          [-0.45, 0.45].forEach(gx => {
            [-0.3, 0.3].forEach(gy => {
              const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 5.4, 8), metalMat);
              b.rotateX(Math.PI / 2);
              b.position.set(gx, 2.7 + gy, 3.2);
              root.add(b);
              // Flash hider muzzle
              const fh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.08, 0.4, 8), metalMat);
              fh.rotateX(Math.PI / 2);
              fh.position.set(gx, 2.7 + gy, 5.9);
              root.add(fh);
            });
          });

          // "Gun Dish" Fire Control Radar on Turret Rear
          const rMast = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8), metalMat);
          rMast.position.set(0, 3.8, -1.8);
          root.add(rMast);

          const rDish = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.2, 12), radarGlowMat);
          rDish.rotateX(Math.PI / 3);
          rDish.position.set(0, 4.4, -1.8);
          root.add(rDish);
          root.userData.dishMesh = rDish;

        } else if (type.includes('TECHNICAL')) {
          // 4. Insurgent Armed 4x4 Technical Pickup Truck
          const frame = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.6, 7.8), rustMat);
          frame.position.y = 0.9;
          root.add(frame);

          // Cab & Windshield
          const cab = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.6, 3.0), sandMat);
          cab.position.set(0, 1.9, 0.8);
          root.add(cab);

          const glass = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.8, 0.1), opticalLensMat);
          glass.position.set(0, 2.1, 2.32);
          root.add(glass);

          // Hood & Grille
          const hood = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.0, 2.2), sandMat);
          hood.position.set(0, 1.5, 3.3);
          root.add(hood);

          // Pickup Bed & Roll Cage
          const bed = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.8, 3.2), rustMat);
          bed.position.set(0, 1.4, -2.1);
          root.add(bed);

          // 4 Big Off-road Rubber Wheels
          [[-1.6, -1.8], [1.6, -1.8], [-1.6, 2.4], [1.6, 2.4]].forEach(([wx, wz]) => {
            const whl = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.5, 12), tireMat);
            whl.rotateZ(Math.PI / 2);
            whl.position.set(wx, 0.65, wz);
            root.add(whl);
          });

          // Mounted DShK 12.7mm Heavy Machine Gun on Tripod
          const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.4, 8), metalMat);
          pedestal.position.set(0, 2.4, -2.0);
          root.add(pedestal);

          const hmg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.4, 8), darkArmorMat);
          hmg.rotateX(Math.PI / 2);
          hmg.position.set(0, 3.1, -1.2);
          root.add(hmg);

        } else if (type.includes('RPG')) {
          // 5. RPG-7 Mountain Ambush Squad with Sandbags
          const sandbags = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.6, 8, 14, Math.PI * 1.4), sandMat);
          sandbags.rotateX(-Math.PI / 2);
          sandbags.position.y = 0.5;
          root.add(sandbags);

          // 2 Combatant Figures
          [-0.8, 0.8].forEach((fx, i) => {
            const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 1.2, 8), camoMat);
            torso.position.set(fx, 1.0, -0.2);
            root.add(torso);
            const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), sandMat);
            head.position.set(fx, 1.8, -0.2);
            root.add(head);
            if (i === 0) {
              // RPG-7 Rocket Launcher Tube + Conical Warhead
              const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.0, 8), darkArmorMat);
              tube.rotateX(Math.PI / 2.3);
              tube.position.set(fx + 0.35, 1.6, 0.4);
              root.add(tube);
              const warhead = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 8), metalMat);
              warhead.rotateX(Math.PI / 2.3);
              warhead.position.set(fx + 0.35, 1.8, 1.4);
              root.add(warhead);
            }
          });

        } else if (type.includes('MORTAR')) {
          // 6. 120mm Heavy Mortar Emplacement
          const sandRing = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.7, 8, 16), sandMat);
          sandRing.rotateX(-Math.PI / 2);
          sandRing.position.y = 0.4;
          root.add(sandRing);

          // Baseplate & Angled Mortar Barrel
          const baseplate = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.2, 0.2, 10), darkArmorMat);
          baseplate.position.set(0, 0.2, -0.6);
          root.add(baseplate);

          const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.2, 10), metalMat);
          tube.rotateX(Math.PI / 3.4);
          tube.position.set(0, 1.5, 0.4);
          root.add(tube);

          // Bipod legs
          [-0.45, 0.45].forEach(bx => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 6), metalMat);
            leg.position.set(bx, 0.9, 0.5);
            leg.rotateZ(bx > 0 ? -0.3 : 0.3);
            root.add(leg);
          });

        } else if (type.includes('MANPADS')) {
          // 7. Anza Mk-II / QW-2 Shoulder-Fired Surface-to-Air Missile Team
          const rockOutcrop = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2, 1), sandMat);
          rockOutcrop.position.y = 0.8;
          root.add(rockOutcrop);

          const gunner = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 1.3, 8), camoMat);
          gunner.position.set(0, 2.2, 0);
          root.add(gunner);

          const gHead = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), darkArmorMat);
          gHead.position.set(0, 3.0, 0);
          root.add(gHead);

          // MANPADS Launch Tube & Grip Stock
          const mTube = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 8), darkArmorMat);
          mTube.rotateX(Math.PI / 2.6);
          mTube.position.set(0.3, 2.8, 0.6);
          root.add(mTube);

          const seekerOptic = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), radarGlowMat);
          seekerOptic.position.set(0.3, 3.4, 1.8);
          root.add(seekerOptic);

        } else if (type.includes('DRONE') || type.includes('KAMIKAZE')) {
          // 8. Kamikaze Shahed-136 Style Delta-Wing Suicide Drone
          const deltaGeo = new THREE.BufferGeometry();
          const verts = new Float32Array([
             0.0, 0.0,  3.2, // Nose
            -2.8, 0.0, -2.4, // Left wingtip
             2.8, 0.0, -2.4, // Right wingtip
             0.0, 0.5, -2.2  // Central spine
          ]);
          deltaGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
          deltaGeo.computeVertexNormals();

          const droneMesh = new THREE.Mesh(new THREE.ConeGeometry(2.8, 4.8, 3), darkArmorMat);
          droneMesh.rotateX(Math.PI / 2);
          droneMesh.scale.set(1.4, 0.25, 1.0);
          root.add(droneMesh);

          // Rear Pusher Propeller Engine
          const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.0, 8), metalMat);
          eng.rotateX(Math.PI / 2);
          eng.position.set(0, 0.1, -2.6);
          root.add(eng);

          const prop = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.18), radarGlowMat);
          prop.position.set(0, 0.1, -3.1);
          root.add(prop);
          root.userData.dishMesh = prop;

          // Seeker Optical Nose Dome
          const seeker = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 8), opticalLensMat);
          seeker.position.set(0, 0, 2.4);
          root.add(seeker);

        } else if (isAir) {
          // 9. Hostile Mi-35 Hind / Mi-28 Attack Gunship
          const hull = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.8, 14.2), camoMat);
          hull.castShadow = true;
          root.add(hull);

          // Tandem Stepped Canopy
          const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 5.2), opticalLensMat);
          canopy.position.set(0, 1.2, 3.2);
          root.add(canopy);

          // Stub Wings with Rocket Pods
          const wings = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.4, 1.8), camoMat);
          wings.position.set(0, 0.2, 0.6);
          root.add(wings);

          [-3.2, 3.2].forEach(wx => {
            const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 2.2, 10), darkArmorMat);
            pod.rotateX(Math.PI / 2);
            pod.position.set(wx, -0.2, 0.6);
            root.add(pod);
          });

          // Tail Boom & Tail Rotor
          const boom = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 7.8), camoMat);
          boom.position.set(0, 0.4, -9.2);
          root.add(boom);

          const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.4, 1.6), camoMat);
          fin.position.set(0, 1.6, -13.0);
          root.add(fin);

          // 5-Blade Main Rotor
          const mRotor = new THREE.Mesh(new THREE.BoxGeometry(14.8, 0.12, 0.8), darkArmorMat);
          mRotor.position.set(0, 2.2, 0.8);
          root.add(mRotor);
          root.userData.dishMesh = mRotor;

          // Chin Autocannon Turret
          const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.8, 8), metalMat);
          gun.rotateX(Math.PI / 2);
          gun.position.set(0, -1.2, 6.2);
          root.add(gun);

        } else if (type.includes('BOAT')) {
          // 10. Riverine Armed Patrol Gunboat
          const boatHull = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.0, 12.8), camoMat);
          boatHull.position.y = 0.8;
          root.add(boatHull);

          const bow = new THREE.Mesh(new THREE.ConeGeometry(2.4, 3.8, 4), camoMat);
          bow.rotateX(Math.PI / 2);
          bow.position.set(0, 0.8, 7.8);
          root.add(bow);

          const cabin = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 4.4), darkArmorMat);
          cabin.position.set(0, 2.4, -0.6);
          root.add(cabin);

          // Forward Twin 14.5mm Naval Gun Turret
          const bTur = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.8, 10), metalMat);
          bTur.position.set(0, 2.1, 4.2);
          root.add(bTur);

          const bGun = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 8), metalMat);
          bGun.rotateX(Math.PI / 2);
          bGun.position.set(0, 2.5, 5.4);
          root.add(bGun);

        } else if (type.includes('RADAR') || type.includes('BUNKER')) {
          // 11. Early Warning Phased-Array Radar & Fortified Command Bunker
          const bunker = new THREE.Mesh(new THREE.CylinderGeometry(5.8, 7.2, 4.2, 8), darkArmorMat);
          bunker.position.y = 2.1;
          root.add(bunker);

          // Gun slit embrasures
          const slit = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.5, 6.2), opticalLensMat);
          slit.position.y = 3.2;
          root.add(slit);

          // Rotating Parabolic Phased-Array Radar Antenna
          const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 3.8, 8), metalMat);
          mast.position.set(0, 5.8, 0);
          root.add(mast);

          const bigDish = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 0.4, 16), radarGlowMat);
          bigDish.rotateX(Math.PI / 3);
          bigDish.position.set(0, 7.8, 0);
          root.add(bigDish);
          root.userData.dishMesh = bigDish;

        } else {
          // 12. Mountain Ridge Sniper Redoubt & Heavy Gun Nest
          const stoneRedoubt = new THREE.Mesh(new THREE.DodecahedronGeometry(3.2, 1), sandMat);
          stoneRedoubt.position.y = 1.2;
          root.add(stoneRedoubt);

          const nest = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 2.4), darkArmorMat);
          nest.position.set(0, 2.4, 0);
          root.add(nest);

          const rifle = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.8, 8), metalMat);
          rifle.rotateX(Math.PI / 2.2);
          rifle.position.set(0, 2.6, 1.8);
          root.add(rifle);
        }

        return root;
      }
'''

print("Generated ENEMY_MESHES_CODE length:", len(ENEMY_MESHES_CODE))
'''
