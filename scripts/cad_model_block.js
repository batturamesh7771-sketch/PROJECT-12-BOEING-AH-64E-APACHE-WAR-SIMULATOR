const SUB_ASSEMBLIES = [
      {
        id: 'fuselage',
        code: 'ASM-01 CHINED HULL & EFAB SPONSONS',
        name: 'Lofted Chined Hull & Riveted Sponsons',
        mass: '2,140 kg',
        explodeVec: [0, 0, 0],
        partCount: 0,
        desc: '14-station lofted chined fuselage airframe with flush-bolted EFAB side sponsons, 180+ dome-head rivets, access doors, latches, boarding steps, RWR blisters, and side pitot/gun booms.'
      },
      {
        id: 'canopy',
        code: 'ASM-02 TANDEM ARMORED CANOPY & COCKPIT',
        name: 'Flush Silver Canopy & Crew Cockpit',
        mass: '410 kg',
        explodeVec: [0, 2.2, 0.8],
        partCount: 0,
        desc: 'Zero-gap lofted canopy skirt, precision-mitered metallic silver frames, 9 armored glass panes, dual wipers, internal blast shield, 2 crashworthy seats with 5-point harnesses, TEDAC grips & MFDs.'
      },
      {
        id: 'turret',
        code: 'ASM-03 M-TADS/PNVS & M230 CHAIN GUN',
        name: 'Dual-Drum Nose Optic & 30mm M230 Gun',
        mass: '365 kg',
        explodeVec: [0, -1.6, 3.0],
        partCount: 0,
        desc: 'Upper PNVS + lower dual-drum M-TADS turret with multi-coated optical lenses, plus the under-chin M230 30mm Chain Gun with azimuth turntable, twin hydraulic recoil cylinders, feed chute & barrel cage.'
      },
      {
        id: 'mainRotor',
        code: 'ASM-04 SWASHPLATE, HUB & 4-BLADE ROTOR',
        name: 'Articulated Rotor Hub, Dampers & Blades',
        mass: '1,180 kg',
        explodeVec: [0, 3.2, 0],
        partCount: 0,
        desc: 'Stationary & rotating swashplates, 3 servo actuators, scissor cranks, 4 pitch-change links, 8 hydraulic lead-lag damper cylinders, 4 root cuffs with chrome bolts, 4 airfoil blades, mast spike & ALQ-144.'
      },
      {
        id: 'nacelles',
        code: 'ASM-05 T700 NACELLES & BLACK HOLE IR',
        name: 'AH-733 Pods, 3D Fans & IR Exhausts',
        mass: '920 kg',
        explodeVec: [0, 1.4, -1.0],
        partCount: 0,
        desc: 'Flush-saddled T700-GE-701D engine nacelles with white AH-733 stencils, 48-blade 3D radial compressor intakes, and multi-duct "Black Hole" Ocarina IR exhaust suppressors with 36 cooling louver slats.'
      },
      {
        id: 'wings',
        code: 'ASM-06 STUB WINGS, 8x HELLFIRE & HYDRA',
        name: 'Airfoil Wings, 8x Hellfire & 38-Tube Pods',
        mass: '1,490 kg',
        explodeVec: [0, -1.3, 0],
        partCount: 0,
        desc: 'Tapered airfoil stub wings with root fillets, wingtip strobe/chaff pods, 4 pylons with sway braces, 2 M299 quad racks with 8x AGM-114R Hellfire missiles (64 fins), and 2x 19-tube 3D Hydra rocket pods.'
      },
      {
        id: 'tailboom',
        code: 'ASM-07 TAILBOOM, SPINE & SCISSOR ROTOR',
        name: 'Ring-Framed Boom, Fin & 55°/125° Rotor',
        mass: '680 kg',
        explodeVec: [0, 0.5, -3.8],
        partCount: 0,
        desc: 'Tapered tailboom with 14 structural ring frames, dorsal driveshaft spine with latches, HF towel-bar antenna, swept fin, variable stabilator with actuator, and 55°/125° non-orthogonal 4-blade tail rotor.'
      },
      {
        id: 'gear',
        code: 'ASM-08 TRAILING-LINK & TWIN TAIL GEAR',
        name: 'Trailing-Link Oleo Gear & Disc Brakes',
        mass: '390 kg',
        explodeVec: [0, -2.2, 0.4],
        partCount: 0,
        desc: 'Forward trailing-link main landing gear with oleo shock struts, torque scissors, wheel forks, disc brake rotors/calipers, and 3D treaded tires, plus aft triangular truss with twin tailwheels.'
      }
    ];

    // =========================================================================
    // 2. PROCEDURAL PBR CANVAS TEXTURES (WEATHERED CAMO, PANEL SEAMS & STENCILS)
    // =========================================================================
    function createWeatheredCamoTexture(opts = {}) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = opts.baseColor || '#485336';
      ctx.fillRect(0, 0, 1024, 512);

      // Mottled olive & weathered rust-brown patches matching Sketchfab AH-733
      for (let i = 0; i < 55; i++) {
        const x = (i * 197) % 1024;
        const y = (i * 131) % 512;
        const r = 38 + (i % 5) * 24;
        const grad = ctx.createRadialGradient(x, y, 5, x, y, r);
        grad.addColorStop(0, i % 3 === 0 ? 'rgba(118, 66, 36, 0.42)' : 'rgba(46, 56, 34, 0.48)');
        grad.addColorStop(1, 'rgba(72, 83, 54, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      if (opts.rustPatches) {
        opts.rustPatches.forEach(([rx, ry, rw, rh]) => {
          const g = ctx.createRadialGradient(rx, ry, 8, rx, ry, Math.max(rw, rh));
          g.addColorStop(0, 'rgba(128, 69, 36, 0.68)');
          g.addColorStop(0.6, 'rgba(104, 56, 30, 0.35)');
          g.addColorStop(1, 'rgba(72, 83, 54, 0)');
          ctx.fillStyle = g;
          ctx.fillRect(rx - rw, ry - rh, rw * 2, rh * 2);
        });
      }

      // Fine panel seams & rivet dots
      ctx.strokeStyle = 'rgba(20, 25, 16, 0.55)';
      ctx.lineWidth = 2;
      for (let x = 96; x < 1024; x += 96) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
        ctx.fillStyle = 'rgba(180, 192, 170, 0.28)';
        for (let y = 16; y < 512; y += 20) {
          ctx.fillRect(x - 5, y, 2, 2);
          ctx.fillRect(x + 3, y, 2, 2);
        }
      }
      ctx.beginPath();
      ctx.moveTo(0, 256);
      ctx.lineTo(1024, 256);
      ctx.stroke();

      if (opts.drawCustom) {
        opts.drawCustom(ctx);
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    }

    const nacelleTexture = createWeatheredCamoTexture({
      baseColor: '#4a5537',
      rustPatches: [[250, 120, 140, 90], [780, 360, 160, 100]],
      drawCustom: (ctx) => {
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 76px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('AH-733', 512, 250);
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 3;
        ctx.strokeRect(160, 150, 704, 200);
      }
    });

    const fuselageTexture = createWeatheredCamoTexture({
      baseColor: '#495436',
      rustPatches: [[180, 220, 150, 120], [820, 180, 180, 120], [500, 100, 200, 90]],
      drawCustom: (ctx) => {
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 10;
        for (let i = 0; i < 3; i++) {
          const start = i * ((Math.PI * 2) / 3) + 0.2;
          ctx.beginPath();
          ctx.arc(740, 330, 42, start, start + 1.45);
          ctx.stroke();
        }
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(380, 190, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#495436';
        ctx.beginPath();
        ctx.arc(380, 190, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const tailboomTexture = createWeatheredCamoTexture({
      baseColor: '#485335',
      rustPatches: [[350, 110, 220, 80], [680, 140, 180, 90]],
      drawCustom: (ctx) => {
        const cx = 420, cy = 260;
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(cx - 115, cy - 10, 65, 20);
        ctx.fillRect(cx + 50, cy - 10, 65, 20);
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const r = i % 2 === 0 ? 34 : 16;
          const a = (i * Math.PI) / 6;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
    });

    // =========================================================================
    // 3. THREE.JS SCENE, LIGHTING & MATERIALS
    // =========================================================================
    const container = document.getElementById('canvasContainer');
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 18000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Studio 4-Point CAD & Outdoor Hemisphere Lighting
    const ambientLight = new THREE.AmbientLight(0xe2e8f0, 0.78);
    scene.add(ambientLight);
    const hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e293b, 0.68);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.32);
    keyLight.position.set(-18, 24, 16);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.62);
    fillLight.position.set(18, 12, -16);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfde68a, 0.45);
    rimLight.position.set(-12, 8, -20);
    scene.add(rimLight);

    const underLight = new THREE.DirectionalLight(0xcbd5e1, 0.38);
    underLight.position.set(0, -16, 6);
    scene.add(underLight);

    // Reference CAD Floor Grid
    const gridGroup = new THREE.Group();
    const gridHelper = new THREE.GridHelper(32, 32, 0x334155, 0x1e293b);
    gridHelper.position.y = -2.18;
    gridGroup.add(gridHelper);

    const rotorRingGeo = new THREE.RingGeometry(7.28, 7.34, 96);
    rotorRingGeo.rotateX(-Math.PI / 2);
    const rotorRingMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, side: THREE.DoubleSide, transparent: true, opacity: 0.32 });
    const rotorRingMesh = new THREE.Mesh(rotorRingGeo, rotorRingMat);
    rotorRingMesh.position.set(0, -2.17, 0.95);
    gridGroup.add(rotorRingMesh);
    scene.add(gridGroup);

    // Materials Library
    const mats = {
      fuselageCamo: new THREE.MeshStandardMaterial({ map: fuselageTexture, roughness: 0.56, metalness: 0.26 }),
      nacelleCamo: new THREE.MeshStandardMaterial({ map: nacelleTexture, roughness: 0.54, metalness: 0.28 }),
      tailboomCamo: new THREE.MeshStandardMaterial({ map: tailboomTexture, roughness: 0.56, metalness: 0.26 }),
      oliveDrab: new THREE.MeshStandardMaterial({ color: 0x4a5537, roughness: 0.55, metalness: 0.26 }),
      oliveDark: new THREE.MeshStandardMaterial({ color: 0x384129, roughness: 0.60, metalness: 0.30 }),
      weatheredRust: new THREE.MeshStandardMaterial({ color: 0x5d4730, roughness: 0.62, metalness: 0.24 }),
      darkArmor: new THREE.MeshStandardMaterial({ color: 0x272e21, roughness: 0.62, metalness: 0.35 }),
      gunmetal: new THREE.MeshStandardMaterial({ color: 0x1f242b, roughness: 0.38, metalness: 0.72 }),
      obsidianSensor: new THREE.MeshStandardMaterial({ color: 0x0f1217, roughness: 0.16, metalness: 0.88 }),
      coatedOpticGreen: new THREE.MeshStandardMaterial({ color: 0x064e3b, emissive: 0x022c22, roughness: 0.08, metalness: 0.92 }),
      coatedOpticAmber: new THREE.MeshStandardMaterial({ color: 0x78350f, emissive: 0x451a03, roughness: 0.10, metalness: 0.90 }),
      canopyFrameSilver: new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.28, metalness: 0.78 }),
      chromeMetal: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.16, metalness: 0.92 }),
      brassFastener: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.25, metalness: 0.85 }),
      copperBand: new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.32, metalness: 0.78 }),
      warningRed: new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.40, metalness: 0.35 }),
      hazardYellow: new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.42, metalness: 0.30 }),
      rotorBlade: new THREE.MeshStandardMaterial({ color: 0x3b433a, roughness: 0.44, metalness: 0.54 }),
      silverEdge: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.26, metalness: 0.82 }),
      canopyGlass: new THREE.MeshPhysicalMaterial({
        color: 0x111926,
        roughness: 0.10,
        metalness: 0.22,
        transparent: true,
        opacity: 0.68
      }),
      rubberTire: new THREE.MeshStandardMaterial({ color: 0x121417, roughness: 0.86, metalness: 0.12 }),
      highlightMat: new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x78350f, roughness: 0.32, metalness: 0.45 }),
      fastenerHighlightMat: new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, roughness: 0.2, metalness: 0.8 })
    };

    const edgeLineMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.24 });

    const allMeshes = [];
    const allEdgeLines = [];
    const fastenerMeshes = [];
    const partCountByAsm = {};
    SUB_ASSEMBLIES.forEach(s => { partCountByAsm[s.id] = 0; });

    function addCADMesh(geometry, material, parent, partId, opts = {}) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = opts.castShadow !== false;
      mesh.receiveShadow = opts.receiveShadow !== false;
      mesh.userData.partId = partId;
      mesh.userData.baseMaterial = material;
      mesh.userData.isFastener = !!opts.isFastener;

      if (opts.addEdges) {
        const edgesGeo = new THREE.EdgesGeometry(geometry, 28);
        const line = new THREE.LineSegments(edgesGeo, edgeLineMat);
        line.visible = false;
        mesh.add(line);
        allEdgeLines.push(line);
      }

      parent.add(mesh);
      allMeshes.push(mesh);
      if (opts.isFastener) {
        fastenerMeshes.push(mesh);
      }
      if (partCountByAsm[partId] !== undefined) {
        partCountByAsm[partId]++;
      }
      return mesh;
    }

    // Shared High-Efficiency Micro-Geometries for Rivets, Hex Bolts, Latch Plates & Pins
    const sharedGeo = {
      rivetDome: new THREE.SphereGeometry(0.014, 6, 5),
      hexBolt: new THREE.CylinderGeometry(0.022, 0.022, 0.028, 6),
      flangeBolt: new THREE.CylinderGeometry(0.018, 0.018, 0.032, 6),
      latchPlate: new THREE.BoxGeometry(0.035, 0.08, 0.025),
      louverSlat: new THREE.BoxGeometry(0.46, 0.016, 0.045)
    };

    const apacheRoot = new THREE.Group();
    apacheRoot.name = 'MasterAssembly_AH64E';
    scene.add(apacheRoot);
    const masterAssembly = apacheRoot;
    window.masterAssembly = apacheRoot;

    const groupMap = {};
    SUB_ASSEMBLIES.forEach(item => {
      const g = new THREE.Group();
      g.name = item.id;
      g.userData = { ...item, visible: true };
      apacheRoot.add(g);
      groupMap[item.id] = g;
    });

    // Helper: Build Multi-Station Lofted Chined Hull Geometry (Zero Gaps!)
    function createLoftedStationGeometry(stations) {
      const positions = [];
      const uvs = [];
      const indices = [];
      const ringSize = 8;

      stations.forEach((st, idx) => {
        const u = idx / (stations.length - 1);
        const ring = [
          [0, st.yTop, st.z],
          [st.wTop, st.yTop * 0.92, st.z],
          [st.wMid, st.yMid, st.z],
          [st.wBot, st.yBot, st.z],
          [0, st.yBot - 0.04, st.z],
          [-st.wBot, st.yBot, st.z],
          [-st.wMid, st.yMid, st.z],
          [-st.wTop, st.yTop * 0.92, st.z]
        ];
        ring.forEach((pt, vIdx) => {
          positions.push(pt[0], pt[1], pt[2]);
          uvs.push(u, vIdx / ringSize);
        });
      });

      for (let i = 0; i < stations.length - 1; i++) {
        const r0 = i * ringSize;
        const r1 = (i + 1) * ringSize;
        for (let j = 0; j < ringSize; j++) {
          const jNext = (j + 1) % ringSize;
          const a = r0 + j;
          const b = r0 + jNext;
          const c = r1 + jNext;
          const d = r1 + j;
          indices.push(a, b, c);
          indices.push(a, c, d);
        }
      }

      const lastRing = (stations.length - 1) * ringSize;
      for (let j = 1; j < ringSize - 1; j++) {
        indices.push(0, j + 1, j);
        indices.push(lastRing, lastRing + j, lastRing + j + 1);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    }

    // -------------------------------------------------------------------------
    // ASM-01: LOFTED CHINED FUSELAGE HULL, FLUSH SPONSONS, RIVETS & BOOMS
    // -------------------------------------------------------------------------
    (function buildFuselage() {
      const g = groupMap.fuselage;

      // 1. Multi-station lofted primary fuselage hull (Z = -3.3m to +6.15m)
      const hullStations = [
        { z: -3.30, wTop: 0.24, wMid: 0.36, wBot: 0.28, yTop: 0.36, yMid: 0.02, yBot: -0.34 },
        { z: -2.20, wTop: 0.38, wMid: 0.56, wBot: 0.44, yTop: 0.52, yMid: 0.05, yBot: -0.44 },
        { z: -0.80, wTop: 0.52, wMid: 0.72, wBot: 0.58, yTop: 0.68, yMid: 0.08, yBot: -0.52 },
        { z:  0.85, wTop: 0.56, wMid: 0.78, wBot: 0.64, yTop: 0.72, yMid: 0.10, yBot: -0.54 },
        { z:  2.40, wTop: 0.52, wMid: 0.74, wBot: 0.62, yTop: 0.64, yMid: 0.08, yBot: -0.52 },
        { z:  3.80, wTop: 0.48, wMid: 0.68, wBot: 0.56, yTop: 0.56, yMid: 0.04, yBot: -0.48 },
        { z:  5.00, wTop: 0.44, wMid: 0.58, wBot: 0.46, yTop: 0.38, yMid: 0.00, yBot: -0.40 },
        { z:  5.85, wTop: 0.42, wMid: 0.48, wBot: 0.38, yTop: 0.30, yMid: -0.02, yBot: -0.34 },
        { z:  6.15, wTop: 0.36, wMid: 0.40, wBot: 0.32, yTop: 0.26, yMid: -0.02, yBot: -0.28 }
      ];
      const loftedHullGeo = createLoftedStationGeometry(hullStations);
      addCADMesh(loftedHullGeo, mats.fuselageCamo, g, 'fuselage', { addEdges: true });

      // 2. Upper Transmission Doghouse Fairing (flush-mated on top of hull from Z = -1.8m to +1.85m)
      const doghouseStations = [
        { z: -1.95, wTop: 0.24, wMid: 0.38, wBot: 0.44, yTop: 0.92, yMid: 0.72, yBot: 0.48 },
        { z: -0.80, wTop: 0.42, wMid: 0.56, wBot: 0.58, yTop: 1.22, yMid: 0.92, yBot: 0.58 },
        { z:  0.65, wTop: 0.44, wMid: 0.58, wBot: 0.60, yTop: 1.24, yMid: 0.95, yBot: 0.60 },
        { z:  1.65, wTop: 0.40, wMid: 0.52, wBot: 0.54, yTop: 1.18, yMid: 0.88, yBot: 0.56 },
        { z:  2.15, wTop: 0.34, wMid: 0.46, wBot: 0.48, yTop: 0.96, yMid: 0.78, yBot: 0.52 }
      ];
      addCADMesh(createLoftedStationGeometry(doghouseStations), mats.fuselageCamo, g, 'fuselage', { addEdges: true });

      // 3. Overhanging Forward Sensor Brow Shelf & Slit Trim (Z = +5.55m to +6.38m)
      const browGeo = new THREE.BoxGeometry(0.96, 0.15, 0.88);
      const brow = addCADMesh(browGeo, mats.weatheredRust, g, 'fuselage', { addEdges: true });
      brow.position.set(0, 0.33, 5.94);

      const browSlitGeo = new THREE.BoxGeometry(0.84, 0.07, 0.06);
      addCADMesh(browSlitGeo, mats.canopyFrameSilver, g, 'fuselage').position.set(0, 0.33, 6.37);

      // 4. Belly Armor Plates & Structural Keel Ribs
      for (let b = 0; b < 8; b++) {
        const plateGeo = new THREE.BoxGeometry(0.92, 0.04, 0.68);
        const plate = addCADMesh(plateGeo, mats.darkArmor, g, 'fuselage');
        plate.position.set(0, -0.55, -1.2 + b * 0.78);
      }

      // 5. Left & Right Lofted Chined EFAB Sponsons (Flush-mated to lower fuselage cheeks)
      [-1, 1].forEach(side => {
        const spGroup = new THREE.Group();
        spGroup.position.set(side * 0.76, -0.24, 2.35);
        g.add(spGroup);

        const spStations = [
          { z: -2.65, wTop: 0.08, wMid: 0.14, wBot: 0.10, yTop: 0.14, yMid: 0.0, yBot: -0.14 },
          { z: -1.80, wTop: 0.22, wMid: 0.32, wBot: 0.24, yTop: 0.26, yMid: 0.0, yBot: -0.24 },
          { z:  0.00, wTop: 0.26, wMid: 0.36, wBot: 0.28, yTop: 0.28, yMid: 0.0, yBot: -0.26 },
          { z:  1.85, wTop: 0.24, wMid: 0.34, wBot: 0.26, yTop: 0.26, yMid: 0.0, yBot: -0.24 },
          { z:  2.45, wTop: 0.14, wMid: 0.22, wBot: 0.16, yTop: 0.18, yMid: -0.02, yBot: -0.18 },
          { z:  2.75, wTop: 0.05, wMid: 0.08, wBot: 0.06, yTop: 0.08, yMid: -0.04, yBot: -0.08 }
        ];
        addCADMesh(createLoftedStationGeometry(spStations), mats.fuselageCamo, spGroup, 'fuselage', { addEdges: true });

        // 5 Avionics Bay Access Doors + 10 Latch Plates per Sponson
        for (let d = 0; d < 5; d++) {
          const zDoor = -1.4 + d * 0.78;
          const doorGeo = new THREE.BoxGeometry(0.03, 0.32, 0.62);
          const door = addCADMesh(doorGeo, mats.oliveDark, spGroup, 'fuselage', { addEdges: true });
          door.position.set(side * 0.33, 0.02, zDoor);

          [-0.18, 0.18].forEach(zL => {
            const latch = addCADMesh(sharedGeo.latchPlate, mats.canopyFrameSilver, spGroup, 'fuselage', { isFastener: true });
            latch.position.set(side * 0.35, -0.10, zDoor + zL);
          });
        }

        // Crew Boarding Steps & Grab Handles on Sponson Side
        [1.8, 2.5].forEach((zStep, sIdx) => {
          const stepGeo = new THREE.BoxGeometry(0.16, 0.04, 0.18);
          const step = addCADMesh(stepGeo, mats.canopyFrameSilver, g, 'fuselage');
          step.position.set(side * 1.08, -0.38 + sIdx * 0.26, zStep);
        });

        // Upper Recessed Side Sensor/Gun Bay & Forward-Projecting Pitot/Barrel Boom
        const recessBoxGeo = new THREE.BoxGeometry(0.26, 0.24, 0.88);
        addCADMesh(recessBoxGeo, mats.gunmetal, g, 'fuselage', { addEdges: true }).position.set(side * 0.58, 0.78, 1.72);

        const trunnionGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.22, 10);
        trunnionGeo.rotateZ(Math.PI / 2);
        addCADMesh(trunnionGeo, mats.canopyFrameSilver, g, 'fuselage').position.set(side * 0.64, 0.76, 1.78);

        const boomTubeGeo = new THREE.CylinderGeometry(0.032, 0.045, 1.42, 10);
        boomTubeGeo.rotateX(Math.PI / 2);
        const boomTube = addCADMesh(boomTubeGeo, mats.gunmetal, g, 'fuselage');
        boomTube.position.set(side * 0.68, 0.70, 2.30);
        boomTube.rotation.x = 0.12;
        boomTube.rotation.y = side * 0.04;

        // Multi-collar muzzle / pitot sensor tip
        [2.75, 2.92, 3.04].forEach((zCol, cIdx) => {
          const colGeo = new THREE.CylinderGeometry(0.048 - cIdx * 0.008, 0.048 - cIdx * 0.008, 0.09, 10);
          colGeo.rotateX(Math.PI / 2);
          const col = addCADMesh(colGeo, mats.canopyFrameSilver, g, 'fuselage', { isFastener: true });
          col.position.set(side * 0.70, 0.64 - cIdx * 0.02, zCol);
        });

        // 48 Structural Rivets along Left/Right Sponson Chine & Fuselage Seam
        for (let r = 0; r < 24; r++) {
          const zRiv = -1.9 + r * 0.18;
          const rTop = addCADMesh(sharedGeo.rivetDome, mats.brassFastener, spGroup, 'fuselage', { isFastener: true, castShadow: false });
          rTop.position.set(side * 0.26, 0.25, zRiv);

          const rSide = addCADMesh(sharedGeo.rivetDome, mats.brassFastener, spGroup, 'fuselage', { isFastener: true, castShadow: false });
          rSide.position.set(side * 0.35, 0.16, zRiv);
        }
      });

      // 6. Spine & Belly Blade Antennas, RWR Radomes & Tie-Down Rings
      [-0.4, -1.6, -2.6].forEach(zAnt => {
        const bladeAntGeo = new THREE.BoxGeometry(0.025, 0.28, 0.22);
        const ant = addCADMesh(bladeAntGeo, mats.oliveDark, g, 'fuselage');
        ant.position.set(0, -0.68, zAnt);
        ant.rotation.x = -0.35;
      });
    })();

    // -------------------------------------------------------------------------
    // ASM-02: ZERO-GAP STEPPED TANDEM CANOPY, FRAMES, WIPERS & COCKPIT INTERIOR
    // -------------------------------------------------------------------------
    (function buildCanopy() {
      const g = groupMap.canopy;

      // 1. Lofted Canopy Base Skirt & Cockpit Tub (Sits flush on fuselage deck with zero air gaps!)
      const canopyStations = [
        { z: 1.45, wTop: 0.42, wMid: 0.48, wBot: 0.54, yTop: 1.24, yMid: 0.96, yBot: 0.62 },
        { z: 2.15, wTop: 0.44, wMid: 0.50, wBot: 0.54, yTop: 1.26, yMid: 0.96, yBot: 0.62 },
        { z: 3.15, wTop: 0.42, wMid: 0.48, wBot: 0.52, yTop: 1.22, yMid: 0.90, yBot: 0.58 },
        { z: 3.45, wTop: 0.40, wMid: 0.46, wBot: 0.50, yTop: 0.98, yMid: 0.80, yBot: 0.56 },
        { z: 4.35, wTop: 0.38, wMid: 0.44, wBot: 0.48, yTop: 0.92, yMid: 0.72, yBot: 0.50 },
        { z: 4.88, wTop: 0.34, wMid: 0.40, wBot: 0.44, yTop: 0.52, yMid: 0.48, yBot: 0.42 }
      ];
      const canopyGlassVolumeGeo = createLoftedStationGeometry(canopyStations);
      addCADMesh(canopyGlassVolumeGeo, mats.canopyGlass, g, 'canopy');

      // 2. Cockpit Dark Armored Tub Floor & Bulkheads
      const floorGeo = new THREE.BoxGeometry(0.86, 0.12, 3.25);
      addCADMesh(floorGeo, mats.obsidianSensor, g, 'canopy').position.set(0, 0.56, 3.05);

      const blastShieldGeo = new THREE.BoxGeometry(0.78, 0.48, 0.04);
      addCADMesh(blastShieldGeo, mats.canopyGlass, g, 'canopy').position.set(0, 0.96, 3.12);
      const blastFrameGeo = new THREE.BoxGeometry(0.82, 0.04, 0.05);
      addCADMesh(blastFrameGeo, mats.canopyFrameSilver, g, 'canopy').position.set(0, 1.20, 3.12);

      // 3. Detailed CPG (Front) & Pilot (Rear) Crashworthy Armored Seats, Consoles & Controls
      [
        { name: 'CPG', z: 3.82, y: 0.66 },
        { name: 'Pilot', z: 2.42, y: 0.80 }
      ].forEach(crew => {
        const seatGrp = new THREE.Group();
        seatGrp.position.set(0, crew.y, crew.z);
        g.add(seatGrp);

        addCADMesh(new THREE.BoxGeometry(0.44, 0.08, 0.44), mats.obsidianSensor, seatGrp, 'canopy').position.set(0, 0, 0);
        addCADMesh(new THREE.BoxGeometry(0.44, 0.58, 0.08), mats.obsidianSensor, seatGrp, 'canopy').position.set(0, 0.28, -0.18);
        addCADMesh(new THREE.BoxGeometry(0.32, 0.18, 0.10), mats.darkArmor, seatGrp, 'canopy').position.set(0, 0.62, -0.16);
        [-0.23, 0.23].forEach(xW => {
          addCADMesh(new THREE.BoxGeometry(0.04, 0.46, 0.28), mats.darkArmor, seatGrp, 'canopy').position.set(xW, 0.26, -0.08);
        });
        [-0.10, 0.10].forEach(xS => {
          addCADMesh(new THREE.BoxGeometry(0.05, 0.48, 0.02), mats.oliveDrab, seatGrp, 'canopy').position.set(xS, 0.26, -0.13);
        });

        const dashGeo = new THREE.BoxGeometry(0.68, 0.32, 0.28);
        addCADMesh(dashGeo, mats.gunmetal, seatGrp, 'canopy').position.set(0, 0.18, 0.46);
        [-0.18, 0.18].forEach((xMfd, mfdIdx) => {
          const mfdBox = addCADMesh(new THREE.BoxGeometry(0.22, 0.18, 0.03), mats.gunmetal, seatGrp, 'canopy');
          mfdBox.position.set(xMfd, 0.26, 0.32);
          // Dedicated 3D Cockpit Picture-in-Picture (PiP) Screen Plane facing the Pilot/CPG
          const screenPlaneGeo = new THREE.PlaneGeometry(0.20, 0.16);
          screenPlaneGeo.rotateY(Math.PI);
          const screenMesh = new THREE.Mesh(
            screenPlaneGeo,
            new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
          );
          screenMesh.position.set(xMfd, 0.26, 0.302);
          screenMesh.name = mfdIdx === 0 ? `MFD_LEFT_${crew.name}` : `MFD_RIGHT_${crew.name}`;
          seatGrp.add(screenMesh);
          if (!window.cockpit3dMfdScreens) window.cockpit3dMfdScreens = [];
          window.cockpit3dMfdScreens.push(screenMesh);
        });

        const cyclicGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.34, 8);
        const cyclic = addCADMesh(cyclicGeo, mats.obsidianSensor, seatGrp, 'canopy');
        cyclic.position.set(0, 0.12, 0.24);
        cyclic.rotation.x = -0.2;
      });

      // 4. Precision-Mitered Metallic Silver Canopy Structural Frame Bars
      function addFrameBeam(p1, p2, radius = 0.028) {
        const v1 = new THREE.Vector3(...p1);
        const v2 = new THREE.Vector3(...p2);
        const dist = v1.distanceTo(v2);
        const cylGeo = new THREE.CylinderGeometry(radius, radius, dist, 8);
        cylGeo.rotateX(Math.PI / 2);
        const beam = addCADMesh(cylGeo, mats.canopyFrameSilver, g, 'canopy');
        beam.position.copy(v1).add(v2).multiplyScalar(0.5);
        beam.lookAt(v2);
        return beam;
      }

      const frameJoints = [
        [[-0.44, 0.48, 4.88], [-0.48, 0.56, 4.35]],
        [[-0.48, 0.56, 4.35], [-0.50, 0.60, 3.35]],
        [[-0.50, 0.60, 3.35], [-0.52, 0.64, 2.15]],
        [[-0.52, 0.64, 2.15], [-0.48, 0.64, 1.45]],
        [[ 0.44, 0.48, 4.88], [ 0.48, 0.56, 4.35]],
        [[ 0.48, 0.56, 4.35], [ 0.50, 0.60, 3.35]],
        [[ 0.50, 0.60, 3.35], [ 0.52, 0.64, 2.15]],
        [[ 0.52, 0.64, 2.15], [ 0.48, 0.64, 1.45]],
        [[-0.36, 0.50, 4.88], [-0.39, 0.92, 4.32]],
        [[-0.39, 0.92, 4.32], [-0.41, 0.98, 3.42]],
        [[-0.41, 0.98, 3.42], [-0.43, 1.23, 3.12]],
        [[-0.43, 1.23, 3.12], [-0.44, 1.26, 2.15]],
        [[-0.44, 1.26, 2.15], [-0.42, 1.24, 1.45]],
        [[ 0.36, 0.50, 4.88], [ 0.39, 0.92, 4.32]],
        [[ 0.39, 0.92, 4.32], [ 0.41, 0.98, 3.42]],
        [[ 0.41, 0.98, 3.42], [ 0.43, 1.23, 3.12]],
        [[ 0.43, 1.23, 3.12], [ 0.44, 1.26, 2.15]],
        [[ 0.44, 1.26, 2.15], [ 0.42, 1.24, 1.45]],
        [[-0.36, 0.50, 4.88], [ 0.36, 0.50, 4.88]],
        [[-0.38, 0.72, 4.58], [ 0.38, 0.72, 4.58]],
        [[-0.39, 0.92, 4.32], [ 0.39, 0.92, 4.32]],
        [[-0.41, 0.98, 3.42], [ 0.41, 0.98, 3.42]],
        [[-0.43, 1.23, 3.12], [ 0.43, 1.23, 3.12]],
        [[-0.44, 1.26, 2.15], [ 0.44, 1.26, 2.15]],
        [[-0.42, 1.24, 1.45], [ 0.42, 1.24, 1.45]],
        [[-0.48, 0.56, 4.35], [-0.39, 0.92, 4.32]],
        [[ 0.48, 0.56, 4.35], [ 0.39, 0.92, 4.32]],
        [[-0.50, 0.60, 3.35], [-0.41, 0.98, 3.42]],
        [[ 0.50, 0.60, 3.35], [ 0.41, 0.98, 3.42]],
        [[-0.50, 0.61, 3.12], [-0.43, 1.23, 3.12]],
        [[ 0.50, 0.61, 3.12], [ 0.43, 1.23, 3.12]],
        [[-0.52, 0.64, 2.15], [-0.44, 1.26, 2.15]],
        [[ 0.52, 0.64, 2.15], [ 0.44, 1.26, 2.15]],
        [[-0.48, 0.64, 1.45], [-0.42, 1.24, 1.45]],
        [[ 0.48, 0.64, 1.45], [ 0.42, 1.24, 1.45]],
        [[0, 0.92, 4.32], [0, 0.98, 3.42]],
        [[0, 1.23, 3.12], [0, 1.26, 2.15]],
        [[0, 1.26, 2.15], [0, 1.24, 1.45]]
      ];
      frameJoints.forEach(([p1, p2]) => addFrameBeam(p1, p2, 0.028));

      [-0.18, 0.18].forEach(xWip => {
        addFrameBeam([xWip, 0.52, 4.86], [xWip + 0.06, 0.85, 4.42], 0.012);
      });
      for (let f = 0; f < 28; f++) {
        const zF = 1.55 + f * 0.115;
        [-1, 1].forEach(s => {
          const bolt = addCADMesh(sharedGeo.rivetDome, mats.chromeMetal, g, 'canopy', { isFastener: true, castShadow: false });
          bolt.position.set(s * 0.50, 0.62, zF);
        });
      }
    })();

    // -------------------------------------------------------------------------
    // ASM-03: DUAL-DRUM M-TADS/PNVS NOSE TURRET & M230 30MM CHAIN GUN (150+ PARTS)
    // -------------------------------------------------------------------------
    const pnvsGimbalGroup = new THREE.Group();
    const gunAzimuthGroup = new THREE.Group();
    const gunElevationGroup = new THREE.Group();

    (function buildTurretAndGun() {
      const g = groupMap.turret;

      pnvsGimbalGroup.position.set(0, -0.02, 5.95);
      g.add(pnvsGimbalGroup);

      const pnvsCollarGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.18, 20);
      addCADMesh(pnvsCollarGeo, mats.oliveDark, pnvsGimbalGroup, 'turret').position.set(0, 0.24, 0.06);

      const divGeo = new THREE.BoxGeometry(0.14, 0.72, 0.54);
      addCADMesh(divGeo, mats.weatheredRust, pnvsGimbalGroup, 'turret', { addEdges: true }).position.set(0, -0.02, 0.14);

      [-0.23, 0.23].forEach((xOff, idx) => {
        const drumGeo = new THREE.SphereGeometry(0.31, 20, 16);
        const drum = addCADMesh(drumGeo, mats.obsidianSensor, pnvsGimbalGroup, 'turret');
        drum.scale.set(0.75, 1.04, 0.96);
        drum.position.set(xOff, 0, 0.12);

        const bezelGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.08, 16);
        bezelGeo.rotateX(Math.PI / 2);
        addCADMesh(bezelGeo, mats.canopyFrameSilver, pnvsGimbalGroup, 'turret').position.set(xOff, 0.04, 0.38);

        const lensGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.09, 16);
        lensGeo.rotateX(Math.PI / 2);
        addCADMesh(lensGeo, idx === 0 ? mats.coatedOpticGreen : mats.coatedOpticAmber, pnvsGimbalGroup, 'turret').position.set(xOff, 0.04, 0.39);

        const subBezelGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.08, 12);
        subBezelGeo.rotateX(Math.PI / 2);
        addCADMesh(subBezelGeo, mats.chromeMetal, pnvsGimbalGroup, 'turret').position.set(xOff, -0.15, 0.36);

        for (let b = 0; b < 12; b++) {
          const ang = (b * Math.PI * 2) / 12;
          const bMesh = addCADMesh(sharedGeo.rivetDome, mats.chromeMetal, pnvsGimbalGroup, 'turret', { isFastener: true, castShadow: false });
          bMesh.position.set(xOff + Math.cos(ang) * 0.13, 0.04 + Math.sin(ang) * 0.13, 0.42);
        }
      });

      addCADMesh(new THREE.BoxGeometry(0.76, 0.12, 0.54), mats.oliveDrab, pnvsGimbalGroup, 'turret').position.set(0, -0.36, 0.06);

      gunAzimuthGroup.position.set(0, -0.52, 4.65);
      g.add(gunAzimuthGroup);

      const slewRingGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.12, 20);
      addCADMesh(slewRingGeo, mats.gunmetal, gunAzimuthGroup, 'turret').position.set(0, 0, 0);
      for (let b = 0; b < 16; b++) {
        const a = (b * Math.PI * 2) / 16;
        const bolt = addCADMesh(sharedGeo.flangeBolt, mats.chromeMetal, gunAzimuthGroup, 'turret', { isFastener: true, castShadow: false });
        bolt.position.set(Math.cos(a) * 0.40, -0.05, Math.sin(a) * 0.40);
      }

      [-0.22, 0.22].forEach(xStrut => {
        const fStrutGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.66, 10);
        addCADMesh(fStrutGeo, mats.canopyFrameSilver, gunAzimuthGroup, 'turret').position.set(xStrut, -0.32, 0.12);
        addCADMesh(fStrutGeo, mats.canopyFrameSilver, gunAzimuthGroup, 'turret').position.set(xStrut, -0.32, -0.18);

        const hydGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.58, 10);
        const hyd = addCADMesh(hydGeo, mats.chromeMetal, gunAzimuthGroup, 'turret');
        hyd.position.set(xStrut * 0.85, -0.28, 0.28);
        hyd.rotation.x = -0.55;
      });

      for (let c = 0; c < 8; c++) {
        const linkGeo = new THREE.BoxGeometry(0.24, 0.06, 0.18);
        const link = addCADMesh(linkGeo, mats.gunmetal, gunAzimuthGroup, 'turret');
        link.position.set(0, -0.08 - c * 0.065, -0.05);
      }

      gunElevationGroup.position.set(0, -0.62, -0.04);
      gunAzimuthGroup.add(gunElevationGroup);

      addCADMesh(new THREE.BoxGeometry(0.54, 0.28, 0.92), mats.oliveDrab, gunElevationGroup, 'turret', { addEdges: true });
      addCADMesh(new THREE.BoxGeometry(0.34, 0.18, 0.52), mats.canopyFrameSilver, gunElevationGroup, 'turret').position.set(0, 0.20, 0.04);

      [-0.08, 0.08].forEach(rx => {
        [-0.08, 0.08].forEach(ry => {
          const railGeo = new THREE.CylinderGeometry(0.014, 0.014, 1.18, 8);
          railGeo.rotateX(Math.PI / 2);
          addCADMesh(railGeo, mats.canopyFrameSilver, gunElevationGroup, 'turret').position.set(rx, ry, 0.92);
        });
      });
      for (let k = 0; k < 8; k++) {
        const collarGeo = new THREE.BoxGeometry(0.20, 0.20, 0.03);
        addCADMesh(collarGeo, mats.canopyFrameSilver, gunElevationGroup, 'turret', { isFastener: true }).position.set(0, 0, 0.42 + k * 0.14);
      }

      const barrelGeo = new THREE.CylinderGeometry(0.046, 0.056, 1.75, 14);
      barrelGeo.rotateX(Math.PI / 2);
      addCADMesh(barrelGeo, mats.obsidianSensor, gunElevationGroup, 'turret').position.set(0, 0, 1.18);

      const muzzleGeo = new THREE.CylinderGeometry(0.072, 0.062, 0.28, 14);
      muzzleGeo.rotateX(Math.PI / 2);
      addCADMesh(muzzleGeo, mats.obsidianSensor, gunElevationGroup, 'turret').position.set(0, 0, 2.08);
      for (let m = 0; m < 4; m++) {
        const ringGeo = new THREE.CylinderGeometry(0.076, 0.076, 0.025, 14);
        ringGeo.rotateX(Math.PI / 2);
        addCADMesh(ringGeo, mats.canopyFrameSilver, gunElevationGroup, 'turret', { isFastener: true }).position.set(0, 0, 1.98 + m * 0.06);
      }
    })();

    // -------------------------------------------------------------------------
    // ASM-04: ARTICULATED MAIN ROTOR HUB, SWASHPLATE, DAMPERS & ALQ-144 (270+ PARTS)
    // -------------------------------------------------------------------------
    const mainRotorSpinnerGroup = new THREE.Group();
    const bladePitchGroups = [];
    const mastSpikeGroup = new THREE.Group();
    const longbowDomeGroup = new THREE.Group();

    (function buildMainRotorAndMast() {
      const g = groupMap.mainRotor;

      // 1. Aft AN/ALQ-144 "Disco Ball" Infrared Countermeasure Jammer
      const jammerPedestalGeo = new THREE.CylinderGeometry(0.22, 0.26, 0.18, 16);
      addCADMesh(jammerPedestalGeo, mats.canopyFrameSilver, g, 'mainRotor').position.set(0, 1.26, 0.18);

      const jammerCoreGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.46, 16);
      addCADMesh(jammerCoreGeo, mats.obsidianSensor, g, 'mainRotor').position.set(0, 1.54, 0.18);

      for (let w = 0; w < 16; w++) {
        const a = (w * Math.PI * 2) / 16;
        const winGeo = new THREE.BoxGeometry(0.05, 0.22, 0.02);
        const win = addCADMesh(winGeo, w % 2 === 0 ? mats.coatedOpticAmber : mats.coatedOpticGreen, g, 'mainRotor', { isFastener: true });
        win.position.set(Math.cos(a) * 0.19, 1.54, 0.18 + Math.sin(a) * 0.19);
        win.rotation.y = -a + Math.PI / 2;
      }
      for (let r = 0; r < 6; r++) {
        const ringGeo = new THREE.CylinderGeometry(0.215, 0.215, 0.022, 16);
        addCADMesh(ringGeo, mats.gunmetal, g, 'mainRotor').position.set(0, 1.36 + r * 0.07, 0.18);
      }

      // 2. Stationary Mast Housing & 3 Hydraulic Swashplate Servo Actuators
      const mastBaseX = 0, mastBaseY = 1.22, mastBaseZ = 1.05;
      const baseFlangeGeo = new THREE.CylinderGeometry(0.50, 0.56, 0.14, 24);
      addCADMesh(baseFlangeGeo, mats.canopyFrameSilver, g, 'mainRotor').position.set(mastBaseX, mastBaseY + 0.06, mastBaseZ);

      for (let b = 0; b < 24; b++) {
        const a = (b * Math.PI * 2) / 24;
        const bolt = addCADMesh(sharedGeo.flangeBolt, mats.chromeMetal, g, 'mainRotor', { isFastener: true, castShadow: false });
        bolt.position.set(Math.cos(a) * 0.51, mastBaseY + 0.13, mastBaseZ + Math.sin(a) * 0.51);
      }

      for (let s = 0; s < 3; s++) {
        const a = (s * Math.PI * 2) / 3 + Math.PI / 6;
        const sx = Math.cos(a) * 0.38;
        const sz = mastBaseZ + Math.sin(a) * 0.38;
        const cylGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.28, 10);
        addCADMesh(cylGeo, mats.oliveDark, g, 'mainRotor').position.set(sx, mastBaseY + 0.22, sz);
        const rodGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.24, 10);
        addCADMesh(rodGeo, mats.chromeMetal, g, 'mainRotor').position.set(sx, mastBaseY + 0.38, sz);
      }

      const statSwashGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.06, 24);
      addCADMesh(statSwashGeo, mats.gunmetal, g, 'mainRotor').position.set(0, mastBaseY + 0.46, mastBaseZ);

      // 3. Rotating Rotor Mast, Rotating Swashplate, Scissor Links, Pitch Links, Hub & 4 Blades
      mainRotorSpinnerGroup.position.set(0, mastBaseY, mastBaseZ);
      g.add(mainRotorSpinnerGroup);

      const shaftGeo = new THREE.CylinderGeometry(0.22, 0.25, 0.96, 20);
      addCADMesh(shaftGeo, mats.canopyFrameSilver, mainRotorSpinnerGroup, 'mainRotor').position.set(0, 0.50, 0);

      const rotSwashGeo = new THREE.CylinderGeometry(0.48, 0.44, 0.07, 24);
      addCADMesh(rotSwashGeo, mats.canopyFrameSilver, mainRotorSpinnerGroup, 'mainRotor').position.set(0, 0.53, 0);

      [-1, 1].forEach(scSide => {
        const link1Geo = new THREE.BoxGeometry(0.04, 0.22, 0.08);
        const l1 = addCADMesh(link1Geo, mats.chromeMetal, mainRotorSpinnerGroup, 'mainRotor');
        l1.position.set(scSide * 0.28, 0.64, 0.14);
        l1.rotation.x = 0.45;

        const link2Geo = new THREE.BoxGeometry(0.04, 0.22, 0.08);
        const l2 = addCADMesh(link2Geo, mats.canopyFrameSilver, mainRotorSpinnerGroup, 'mainRotor');
        l2.position.set(scSide * 0.28, 0.78, 0.14);
        l2.rotation.x = -0.45;
      });

      const hubCoreGeo = new THREE.CylinderGeometry(0.56, 0.50, 0.24, 24);
      addCADMesh(hubCoreGeo, mats.oliveDark, mainRotorSpinnerGroup, 'mainRotor').position.set(0, 0.94, 0);

      const hubTopCapGeo = new THREE.CylinderGeometry(0.42, 0.54, 0.10, 24);
      addCADMesh(hubTopCapGeo, mats.canopyFrameSilver, mainRotorSpinnerGroup, 'mainRotor').position.set(0, 1.09, 0);

      for (let i = 0; i < 4; i++) {
        const armGroup = new THREE.Group();
        armGroup.rotation.y = (i * Math.PI) / 2;
        armGroup.position.set(0, 0.94, 0);
        mainRotorSpinnerGroup.add(armGroup);

        const pclRodGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.44, 8);
        addCADMesh(pclRodGeo, mats.chromeMetal, armGroup, 'mainRotor').position.set(0.24, -0.20, 0.36);
        [-0.40, 0.02].forEach(yBall => {
          addCADMesh(new THREE.SphereGeometry(0.036, 8, 8), mats.gunmetal, armGroup, 'mainRotor', { isFastener: true }).position.set(0.24, yBall, 0.36);
        });

        const hornGeo = new THREE.BoxGeometry(0.22, 0.06, 0.12);
        addCADMesh(hornGeo, mats.canopyFrameSilver, armGroup, 'mainRotor').position.set(0.14, 0.02, 0.42);

        [-0.22, 0.22].forEach(xDamp => {
          const dampCylGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.52, 10);
          dampCylGeo.rotateX(Math.PI / 2);
          const dampCyl = addCADMesh(dampCylGeo, mats.gunmetal, armGroup, 'mainRotor');
          dampCyl.position.set(xDamp * 1.15, 0, 0.56);
          dampCyl.rotation.y = xDamp > 0 ? -0.18 : 0.18;

          const dampRodGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.36, 8);
          dampRodGeo.rotateX(Math.PI / 2);
          const dampRod = addCADMesh(dampRodGeo, mats.chromeMetal, armGroup, 'mainRotor');
          dampRod.position.set(xDamp * 0.95, 0, 0.84);
          dampRod.rotation.y = xDamp > 0 ? -0.18 : 0.18;

          addCADMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 8), mats.chromeMetal, armGroup, 'mainRotor', { isFastener: true }).position.set(xDamp * 1.25, 0, 0.34);
        });

        const cuffUpperGeo = new THREE.BoxGeometry(0.36, 0.05, 0.92);
        addCADMesh(cuffUpperGeo, mats.oliveDrab, armGroup, 'mainRotor', { addEdges: true }).position.set(0, 0.06, 0.68);
        addCADMesh(cuffUpperGeo, mats.oliveDrab, armGroup, 'mainRotor', { addEdges: true }).position.set(0, -0.06, 0.68);

        [0.86, 1.08].forEach(zPin => {
          const pinGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.18, 12);
          addCADMesh(pinGeo, mats.chromeMetal, armGroup, 'mainRotor', { isFastener: true }).position.set(0, 0, zPin);
          const nutGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.03, 6);
          addCADMesh(nutGeo, mats.gunmetal, armGroup, 'mainRotor', { isFastener: true }).position.set(0, 0.09, zPin);
        });

        const pitchGroup = new THREE.Group();
        pitchGroup.position.set(0, 0, 1.14);
        pitchGroup.rotation.z = THREE.MathUtils.degToRad(6);
        armGroup.add(pitchGroup);
        bladePitchGroups.push(pitchGroup);

        const bladeMainGeo = new THREE.BoxGeometry(0.46, 0.038, 5.42);
        addCADMesh(bladeMainGeo, mats.rotorBlade, pitchGroup, 'mainRotor', { addEdges: true }).position.set(0, 0, 2.71);

        const sheathGeo = new THREE.BoxGeometry(0.11, 0.042, 5.42);
        addCADMesh(sheathGeo, mats.silverEdge, pitchGroup, 'mainRotor').position.set(0.19, 0, 2.71);

        for (let seg = 1; seg <= 10; seg++) {
          const ribGeo = new THREE.BoxGeometry(0.465, 0.041, 0.018);
          addCADMesh(ribGeo, mats.gunmetal, pitchGroup, 'mainRotor', { isFastener: true, castShadow: false }).position.set(0, 0, seg * 0.52);
        }

        const tipGeo = new THREE.BoxGeometry(0.44, 0.036, 0.88);
        const tip = addCADMesh(tipGeo, mats.silverEdge, pitchGroup, 'mainRotor', { addEdges: true });
        tip.position.set(-0.13, 0, 5.76);
        tip.rotation.y = -0.34;
      }

      // 4. Tall Central Mast Antenna Spike
      mastSpikeGroup.position.set(0, 1.12, 0);
      mainRotorSpinnerGroup.add(mastSpikeGroup);

      addCADMesh(new THREE.CylinderGeometry(0.07, 0.12, 0.34, 12), mats.canopyFrameSilver, mastSpikeGroup, 'mainRotor').position.set(0, 0.16, 0);
      addCADMesh(new THREE.CylinderGeometry(0.022, 0.048, 1.08, 10), mats.chromeMetal, mastSpikeGroup, 'mainRotor').position.set(0, 0.82, 0);
      [0.45, 0.75, 1.05].forEach(yIso => {
        addCADMesh(new THREE.CylinderGeometry(0.052, 0.052, 0.04, 12), mats.obsidianSensor, mastSpikeGroup, 'mainRotor', { isFastener: true }).position.set(0, yIso, 0);
      });

      // 5. Optional AN/APG-78 Longbow Fire Control Radar Radome
      longbowDomeGroup.position.set(0, 1.34, 0);
      longbowDomeGroup.visible = false;
      mainRotorSpinnerGroup.add(longbowDomeGroup);

      const domeGeo = new THREE.SphereGeometry(0.68, 24, 16);
      const dome = addCADMesh(domeGeo, mats.oliveDrab, longbowDomeGroup, 'mainRotor');
      dome.scale.set(1.0, 0.44, 1.0);
    })();

    // -------------------------------------------------------------------------
    // ASM-05: T700 ENGINE NACELLES ("AH-733"), 3D FANS & BLACK HOLE IR EXHAUSTS
    // -------------------------------------------------------------------------
    (function buildEngineNacelles() {
      const g = groupMap.nacelles;

      [-1, 1].forEach(side => {
        const podGroup = new THREE.Group();
        podGroup.position.set(side * 0.94, 0.56, 0.18);
        g.add(podGroup);

        const saddleGeo = new THREE.BoxGeometry(0.45, 0.58, 2.55);
        addCADMesh(saddleGeo, mats.oliveDark, podGroup, 'nacelles').position.set(-side * 0.25, -0.02, -0.05);

        const bodyGeo = new THREE.BoxGeometry(0.72, 0.66, 2.65);
        addCADMesh(bodyGeo, mats.nacelleCamo, podGroup, 'nacelles', { addEdges: true });

        const topCapGeo = new THREE.CylinderGeometry(0.35, 0.35, 2.64, 14);
        topCapGeo.rotateX(Math.PI / 2);
        const topCap = addCADMesh(topCapGeo, mats.oliveDrab, podGroup, 'nacelles');
        topCap.scale.set(1.0, 0.48, 1.0);
        topCap.position.set(0, 0.33, 0);

        for (let l = 0; l < 6; l++) {
          const latch = addCADMesh(sharedGeo.latchPlate, mats.canopyFrameSilver, podGroup, 'nacelles', { isFastener: true });
          latch.position.set(side * 0.37, -0.12, -1.0 + l * 0.42);
        }
        for (let r = 0; r < 18; r++) {
          const riv = addCADMesh(sharedGeo.rivetDome, mats.brassFastener, podGroup, 'nacelles', { isFastener: true, castShadow: false });
          riv.position.set(side * 0.37, 0.26, -1.15 + r * 0.135);
        }

        const intakeLipGeo = new THREE.CylinderGeometry(0.34, 0.38, 0.48, 24);
        intakeLipGeo.rotateX(Math.PI / 2);
        addCADMesh(intakeLipGeo, mats.weatheredRust, podGroup, 'nacelles', { addEdges: true }).position.set(0, -0.02, 1.48);

        const intakeDuctGeo = new THREE.CylinderGeometry(0.30, 0.30, 0.08, 20);
        intakeDuctGeo.rotateX(Math.PI / 2);
        addCADMesh(intakeDuctGeo, mats.obsidianSensor, podGroup, 'nacelles').position.set(0, -0.02, 1.66);

        for (let b = 0; b < 24; b++) {
          const ang = (b * Math.PI * 2) / 24;
          const vaneGeo = new THREE.BoxGeometry(0.018, 0.26, 0.05);
          const vane = addCADMesh(vaneGeo, mats.canopyFrameSilver, podGroup, 'nacelles', { isFastener: true, castShadow: false });
          vane.position.set(Math.cos(ang) * 0.16, -0.02 + Math.sin(ang) * 0.16, 1.68);
          vane.rotation.z = ang;
          vane.rotation.y = 0.35;
        }

        const bulletConeGeo = new THREE.ConeGeometry(0.11, 0.28, 16);
        bulletConeGeo.rotateX(Math.PI / 2);
        addCADMesh(bulletConeGeo, mats.chromeMetal, podGroup, 'nacelles').position.set(0, -0.02, 1.76);

        const irHousingGeo = new THREE.BoxGeometry(0.70, 0.54, 1.12);
        const irHousing = addCADMesh(irHousingGeo, mats.oliveDrab, podGroup, 'nacelles', { addEdges: true });
        irHousing.position.set(-side * 0.06, -0.02, -1.72);
        irHousing.rotation.y = side * -0.14;

        [-0.14, 0, 0.14].forEach(yNoz => {
          const nozGeo = new THREE.BoxGeometry(0.52, 0.11, 0.32);
          const noz = addCADMesh(nozGeo, mats.obsidianSensor, podGroup, 'nacelles');
          noz.position.set(-side * 0.08, yNoz - 0.02, -2.22);
          noz.rotation.y = side * -0.14;
        });

        for (let v = 0; v < 9; v++) {
          const topLouver = addCADMesh(sharedGeo.louverSlat, mats.gunmetal, podGroup, 'nacelles', { isFastener: true });
          topLouver.position.set(-side * 0.05, 0.26, -1.28 - v * 0.095);
          topLouver.rotation.x = 0.35;

          const sideLouver = addCADMesh(sharedGeo.louverSlat, mats.obsidianSensor, podGroup, 'nacelles', { isFastener: true });
          sideLouver.position.set(side * 0.31, 0.04, -1.28 - v * 0.095);
          sideLouver.rotation.z = Math.PI / 2;
        }
      });
    })();

    // -------------------------------------------------------------------------
    // ASM-06: STUB WINGS, 4 PYLONS, 8x HELLFIRE MISSILES & 2x 19-TUBE HYDRA PODS
    // -------------------------------------------------------------------------
    const hellfireGroup = new THREE.Group();
    const hydraGroup = new THREE.Group();

    (function buildWingsAndWeapons() {
      const g = groupMap.wings;
      g.add(hellfireGroup);
      g.add(hydraGroup);

      [-1, 1].forEach(side => {
        const rootFilletGeo = new THREE.BoxGeometry(0.32, 0.26, 1.18);
        addCADMesh(rootFilletGeo, mats.oliveDark, g, 'wings').position.set(side * 0.72, 0.08, 0.85);

        const wingGeo = new THREE.BoxGeometry(1.92, 0.13, 0.94);
        addCADMesh(wingGeo, mats.oliveDrab, g, 'wings', { addEdges: true }).position.set(side * 1.62, 0.08, 0.85);

        const wingLeadGeo = new THREE.BoxGeometry(1.94, 0.095, 0.14);
        addCADMesh(wingLeadGeo, mats.canopyFrameSilver, g, 'wings').position.set(side * 1.62, 0.08, 1.32);

        const tipPodGeo = new THREE.CylinderGeometry(0.09, 0.09, 1.12, 12);
        tipPodGeo.rotateX(Math.PI / 2);
        addCADMesh(tipPodGeo, mats.oliveDark, g, 'wings').position.set(side * 2.58, 0.08, 0.85);

        const navLightGeo = new THREE.SphereGeometry(0.065, 10, 10);
        addCADMesh(navLightGeo, side === -1 ? mats.warningRed : mats.coatedOpticGreen, g, 'wings').position.set(side * 2.62, 0.08, 1.38);

        for (let r = 0; r < 12; r++) {
          const riv = addCADMesh(sharedGeo.rivetDome, mats.brassFastener, g, 'wings', { isFastener: true, castShadow: false });
          riv.position.set(side * (0.85 + r * 0.14), 0.15, 1.12);
        }

        const innerPylonGeo = new THREE.BoxGeometry(0.14, 0.42, 0.72);
        addCADMesh(innerPylonGeo, mats.canopyFrameSilver, g, 'wings', { addEdges: true }).position.set(side * 1.24, -0.16, 0.85);

        [-0.12, 0.12].forEach(bx => {
          const braceGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.24, 8);
          addCADMesh(braceGeo, mats.chromeMetal, g, 'wings', { isFastener: true }).position.set(side * 1.24 + bx, -0.34, 0.85);
        });

        const m299BeamGeo = new THREE.BoxGeometry(0.52, 0.26, 0.96);
        addCADMesh(m299BeamGeo, mats.gunmetal, hellfireGroup, 'wings', { addEdges: true }).position.set(side * 1.24, -0.50, 0.85);

        const quadOffsets = [
          [-0.21, 0.10],
          [0.21, 0.10],
          [-0.21, -0.14],
          [0.21, -0.14]
        ];
        quadOffsets.forEach(([ox, oy]) => {
          const mGroup = new THREE.Group();
          mGroup.position.set(side * 1.24 + ox, -0.50 + oy, 0.92);
          hellfireGroup.add(mGroup);

          addCADMesh(new THREE.BoxGeometry(0.06, 0.05, 1.15), mats.canopyFrameSilver, mGroup, 'wings').position.set(0, 0.08, -0.05);

          const bodyGeo = new THREE.CylinderGeometry(0.068, 0.068, 1.46, 14);
          bodyGeo.rotateX(Math.PI / 2);
          addCADMesh(bodyGeo, mats.gunmetal, mGroup, 'wings');

          const band1Geo = new THREE.CylinderGeometry(0.070, 0.070, 0.08, 14);
          band1Geo.rotateX(Math.PI / 2);
          addCADMesh(band1Geo, mats.copperBand, mGroup, 'wings', { isFastener: true }).position.set(0, 0, 0.42);
          addCADMesh(band1Geo, mats.hazardYellow, mGroup, 'wings', { isFastener: true }).position.set(0, 0, -0.18);

          const seekerGeo = new THREE.SphereGeometry(0.067, 14, 12);
          const seeker = addCADMesh(seekerGeo, mats.coatedOpticAmber, mGroup, 'wings');
          seeker.scale.set(1, 1, 1.6);
          seeker.position.set(0, 0, 0.74);

          [-0.56, 0.48].forEach((zFin, fIdx) => {
            const finSpan = fIdx === 0 ? 0.30 : 0.19;
            const finLen = fIdx === 0 ? 0.28 : 0.16;
            for (let f = 0; f < 4; f++) {
              const rotZ = (f * Math.PI) / 2 + Math.PI / 4;
              const finGeo = new THREE.BoxGeometry(finSpan * 0.5, 0.018, finLen);
              const fin = addCADMesh(finGeo, mats.canopyFrameSilver, mGroup, 'wings');
              fin.position.set(Math.cos(rotZ) * (finSpan * 0.28), Math.sin(rotZ) * (finSpan * 0.28), zFin);
              fin.rotation.z = rotZ;
            }
          });
        });

        const outerPylonGeo = new THREE.BoxGeometry(0.14, 0.38, 0.68);
        addCADMesh(outerPylonGeo, mats.canopyFrameSilver, g, 'wings', { addEdges: true }).position.set(side * 2.18, -0.16, 0.85);

        const podGroup = new THREE.Group();
        podGroup.position.set(side * 2.18, -0.50, 0.92);
        hydraGroup.add(podGroup);

        const podDrumGeo = new THREE.CylinderGeometry(0.285, 0.285, 1.66, 24);
        podDrumGeo.rotateX(Math.PI / 2);
        addCADMesh(podDrumGeo, mats.oliveDrab, podGroup, 'wings');

        [-0.76, 0, 0.76].forEach(zBand => {
          const bandGeo = new THREE.CylinderGeometry(0.292, 0.292, 0.10, 24);
          bandGeo.rotateX(Math.PI / 2);
          addCADMesh(bandGeo, mats.canopyFrameSilver, podGroup, 'wings').position.set(0, 0, zBand);
        });

        [-0.83, 0.83].forEach(zPlate => {
          const plateGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.03, 24);
          plateGeo.rotateX(Math.PI / 2);
          addCADMesh(plateGeo, mats.gunmetal, podGroup, 'wings').position.set(0, 0, zPlate);
        });

        const tubeCoords = [[0, 0]];
        for (let i = 0; i < 6; i++) {
          const a = (i * Math.PI) / 3;
          tubeCoords.push([Math.cos(a) * 0.095, Math.sin(a) * 0.095]);
        }
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6;
          tubeCoords.push([Math.cos(a) * 0.195, Math.sin(a) * 0.195]);
        }

        const tubeRimGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.06, 10);
        tubeRimGeo.rotateX(Math.PI / 2);
        const warheadTipGeo = new THREE.ConeGeometry(0.026, 0.08, 8);
        warheadTipGeo.rotateX(Math.PI / 2);

        tubeCoords.forEach(([tx, ty]) => {
          addCADMesh(tubeRimGeo, mats.canopyFrameSilver, podGroup, 'wings', { isFastener: true, castShadow: false }).position.set(tx, ty, 0.84);
          addCADMesh(warheadTipGeo, mats.oliveDark, podGroup, 'wings', { isFastener: true, castShadow: false }).position.set(tx, ty, 0.87);
          addCADMesh(tubeRimGeo, mats.obsidianSensor, podGroup, 'wings', { isFastener: true, castShadow: false }).position.set(tx, ty, -0.84);
        });
      });
    })();

    // -------------------------------------------------------------------------
    // ASM-07: RING-FRAMED TAILBOOM, DORSAL SPINE, STABILATOR & SCISSOR TAIL ROTOR
    // -------------------------------------------------------------------------
    const tailRotorSpinnerGroup = new THREE.Group();

    (function buildTailboomAndRotor() {
      const g = groupMap.tailboom;

      const boomGeo = new THREE.CylinderGeometry(0.28, 0.38, 5.3, 18);
      boomGeo.rotateX(Math.PI / 2);
      addCADMesh(boomGeo, mats.tailboomCamo, g, 'tailboom').position.set(0, -0.10, -5.70);

      for (let f = 0; f < 14; f++) {
        const zRing = -3.35 - f * 0.36;
        const rScale = 1.0 - (f / 14) * 0.24;
        const strapGeo = new THREE.CylinderGeometry(0.385 * rScale, 0.385 * rScale, 0.035, 18);
        strapGeo.rotateX(Math.PI / 2);
        addCADMesh(strapGeo, mats.oliveDark, g, 'tailboom', { isFastener: true }).position.set(0, -0.10, zRing);
      }

      const spineGeo = new THREE.BoxGeometry(0.28, 0.28, 4.95);
      addCADMesh(spineGeo, mats.weatheredRust, g, 'tailboom', { addEdges: true }).position.set(0, 0.24, -5.45);
      for (let l = 0; l < 10; l++) {
        const latch = addCADMesh(sharedGeo.latchPlate, mats.canopyFrameSilver, g, 'tailboom', { isFastener: true });
        latch.position.set(0, 0.39, -3.4 - l * 0.44);
      }

      const hfRodGeo = new THREE.CylinderGeometry(0.012, 0.012, 3.6, 8);
      hfRodGeo.rotateX(Math.PI / 2);
      addCADMesh(hfRodGeo, mats.canopyFrameSilver, g, 'tailboom').position.set(0.42, -0.05, -5.4);
      for (let s = 0; s < 5; s++) {
        const stGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.14, 6);
        stGeo.rotateZ(Math.PI / 2);
        addCADMesh(stGeo, mats.chromeMetal, g, 'tailboom', { isFastener: true }).position.set(0.35, -0.05, -3.9 - s * 0.75);
      }

      const finGeo = new THREE.BoxGeometry(0.22, 2.28, 0.96);
      const fin = addCADMesh(finGeo, mats.tailboomCamo, g, 'tailboom', { addEdges: true });
      fin.position.set(0, 1.04, -7.85);
      fin.rotation.x = -0.32;

      const finCapGeo = new THREE.BoxGeometry(0.26, 0.12, 1.02);
      addCADMesh(finCapGeo, mats.canopyFrameSilver, g, 'tailboom').position.set(0, 2.14, -8.18);

      const stabGeo = new THREE.BoxGeometry(2.48, 0.08, 0.58);
      const stab = addCADMesh(stabGeo, mats.oliveDrab, g, 'tailboom', { addEdges: true });
      stab.position.set(0, -0.06, -8.35);
      stab.rotation.x = 0.16;

      [-1.24, 1.24].forEach(xEnd => {
        addCADMesh(new THREE.BoxGeometry(0.04, 0.24, 0.58), mats.canopyFrameSilver, g, 'tailboom').position.set(xEnd, -0.06, -8.35);
      });

      const trGearboxGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.52, 16);
      trGearboxGeo.rotateZ(Math.PI / 2);
      addCADMesh(trGearboxGeo, mats.gunmetal, g, 'tailboom').position.set(-0.24, 1.58, -8.05);

      tailRotorSpinnerGroup.position.set(-0.52, 1.58, -8.05);
      g.add(tailRotorSpinnerGroup);

      const trShaftGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.36, 12);
      trShaftGeo.rotateZ(Math.PI / 2);
      addCADMesh(trShaftGeo, mats.chromeMetal, tailRotorSpinnerGroup, 'tailboom');

      addCADMesh(new THREE.SphereGeometry(0.16, 14, 12), mats.canopyFrameSilver, tailRotorSpinnerGroup, 'tailboom').position.set(-0.08, 0, 0);

      const scissorAngles = [0, (55 * Math.PI) / 180, Math.PI, Math.PI + (55 * Math.PI) / 180];
      scissorAngles.forEach((ang, idx) => {
        const bWrap = new THREE.Group();
        bWrap.rotation.x = ang;
        bWrap.position.set(idx % 2 === 0 ? 0.04 : -0.06, 0, 0);
        tailRotorSpinnerGroup.add(bWrap);

        addCADMesh(new THREE.BoxGeometry(0.06, 0.32, 0.14), mats.gunmetal, bWrap, 'tailboom').position.set(0, 0.20, 0);
        addCADMesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 8), mats.chromeMetal, bWrap, 'tailboom', { isFastener: true }).position.set(-0.06, 0.16, 0.06);

        const paddleGeo = new THREE.BoxGeometry(0.032, 1.18, 0.21);
        addCADMesh(paddleGeo, mats.rotorBlade, bWrap, 'tailboom', { addEdges: true }).position.set(0, 0.78, 0);

        const leadGeo = new THREE.BoxGeometry(0.036, 1.18, 0.045);
        addCADMesh(leadGeo, mats.canopyFrameSilver, bWrap, 'tailboom').position.set(0, 0.78, 0.09);

        const tipCapGeo = new THREE.BoxGeometry(0.034, 0.14, 0.21);
        addCADMesh(tipCapGeo, mats.hazardYellow, bWrap, 'tailboom').position.set(0, 1.38, 0);
      });
    })();

    // -------------------------------------------------------------------------
    // ASM-08: TRAILING-LINK MAIN LANDING GEAR, DISC BRAKES & TWIN TAILWHEELS
    // -------------------------------------------------------------------------
    (function buildLandingGear() {
      const g = groupMap.gear;

      [-1, 1].forEach(side => {
        const mainStrutGroup = new THREE.Group();
        mainStrutGroup.position.set(side * 0.76, -0.46, 2.35);
        g.add(mainStrutGroup);

        const trunnionBoxGeo = new THREE.BoxGeometry(0.24, 0.22, 0.36);
        addCADMesh(trunnionBoxGeo, mats.gunmetal, mainStrutGroup, 'gear').position.set(0, 0, 0);

        const upperLegGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.92, 14);
        const upperLeg = addCADMesh(upperLegGeo, mats.obsidianSensor, mainStrutGroup, 'gear');
        upperLeg.position.set(0, -0.40, 0.24);
        upperLeg.rotation.x = -0.50;

        const pistonGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.64, 14);
        const piston = addCADMesh(pistonGeo, mats.chromeMetal, mainStrutGroup, 'gear');
        piston.position.set(0, -0.84, 0.50);
        piston.rotation.x = -0.50;

        const sc1 = addCADMesh(new THREE.BoxGeometry(0.04, 0.26, 0.06), mats.canopyFrameSilver, mainStrutGroup, 'gear', { isFastener: true });
        sc1.position.set(0, -0.56, 0.48);
        sc1.rotation.x = 0.4;
        const sc2 = addCADMesh(new THREE.BoxGeometry(0.04, 0.26, 0.06), mats.canopyFrameSilver, mainStrutGroup, 'gear', { isFastener: true });
        sc2.position.set(0, -0.76, 0.56);
        sc2.rotation.x = -0.8;

        const forkGeo = new THREE.BoxGeometry(0.26, 0.14, 0.46);
        addCADMesh(forkGeo, mats.oliveDark, mainStrutGroup, 'gear').position.set(side * 0.08, -1.10, 0.62);

        const wheelGroup = new THREE.Group();
        wheelGroup.position.set(side * 0.12, -1.16, 0.68);
        mainStrutGroup.add(wheelGroup);

        const tireGeo = new THREE.CylinderGeometry(0.41, 0.41, 0.26, 24);
        tireGeo.rotateZ(Math.PI / 2);
        addCADMesh(tireGeo, mats.rubberTire, wheelGroup, 'gear');

        for (let t = 0; t < 16; t++) {
          const a = (t * Math.PI * 2) / 16;
          const treadGeo = new THREE.BoxGeometry(0.27, 0.03, 0.08);
          const tread = addCADMesh(treadGeo, mats.rubberTire, wheelGroup, 'gear', { isFastener: true, castShadow: false });
          tread.position.set(0, Math.cos(a) * 0.41, Math.sin(a) * 0.41);
          tread.rotation.x = -a;
        }

        const rimGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.28, 16);
        rimGeo.rotateZ(Math.PI / 2);
        addCADMesh(rimGeo, mats.gunmetal, wheelGroup, 'gear');

        const brakeDiscGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.04, 20);
        brakeDiscGeo.rotateZ(Math.PI / 2);
        addCADMesh(brakeDiscGeo, mats.chromeMetal, wheelGroup, 'gear').position.set(-side * 0.13, 0, 0);

        const caliperGeo = new THREE.BoxGeometry(0.09, 0.16, 0.14);
        addCADMesh(caliperGeo, mats.warningRed, wheelGroup, 'gear', { isFastener: true }).position.set(-side * 0.14, 0.16, -0.12);

        for (let l = 0; l < 8; l++) {
          const a = (l * Math.PI * 2) / 8;
          const lug = addCADMesh(sharedGeo.flangeBolt, mats.chromeMetal, wheelGroup, 'gear', { isFastener: true, castShadow: false });
          lug.rotation.z = Math.PI / 2;
          lug.position.set(side * 0.15, Math.cos(a) * 0.14, Math.sin(a) * 0.14);
        }
      });

      const tailGearGroup = new THREE.Group();
      tailGearGroup.position.set(0, -0.28, -7.95);
      g.add(tailGearGroup);

      const mainTailBarGeo = new THREE.CylinderGeometry(0.042, 0.042, 1.28, 12);
      const mainTailBar = addCADMesh(mainTailBarGeo, mats.canopyFrameSilver, tailGearGroup, 'gear');
      mainTailBar.position.set(0, -0.42, -0.45);
      mainTailBar.rotation.x = 0.78;

      const shockCylGeo = new THREE.CylinderGeometry(0.048, 0.048, 0.62, 12);
      const shockCyl = addCADMesh(shockCylGeo, mats.obsidianSensor, tailGearGroup, 'gear');
      shockCyl.position.set(0, -0.36, -0.26);
      shockCyl.rotation.x = 1.05;

      const pistonRodGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.55, 10);
      const pistonRod = addCADMesh(pistonRodGeo, mats.chromeMetal, tailGearGroup, 'gear');
      pistonRod.position.set(0, -0.58, -0.52);
      pistonRod.rotation.x = 1.05;

      [-0.16, 0.16].forEach(xWheel => {
        const tTireGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.14, 20);
        tTireGeo.rotateZ(Math.PI / 2);
        addCADMesh(tTireGeo, mats.rubberTire, tailGearGroup, 'gear').position.set(xWheel, -0.84, -0.88);

        const tHubGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.16, 14);
        tHubGeo.rotateZ(Math.PI / 2);
        addCADMesh(tHubGeo, mats.canopyFrameSilver, tailGearGroup, 'gear').position.set(xWheel, -0.84, -0.88);
      });
    })();

    // Sync Part Counts to UI & BOM Breakdown
    SUB_ASSEMBLIES.forEach(item => {
      item.partCount = partCountByAsm[item.id] || 0;
    });
    const totalPartsCount = allMeshes.length;
    const totalFastenersCount = fastenerMeshes.length;

    document.getElementById('totalPartsBadge').textContent = `${totalPartsCount.toLocaleString()} Mated CAD Parts`;
    document.getElementById('sidebarPartCountSub').textContent = `8 Sub-Assemblies • ${totalPartsCount.toLocaleString()} Parts`;
    document.getElementById('hudPartCountVal').textContent = totalPartsCount.toLocaleString();
    document.getElementById('hudFastenerCountVal').textContent = totalFastenersCount.toLocaleString();
    document.getElementById('inspectedPartMass').textContent = `${totalPartsCount.toLocaleString()} Parts`;

    document.getElementById('bomCountFuselage').textContent = `${partCountByAsm.fuselage} pts`;
    document.getElementById('bomCountCanopy').textContent = `${partCountByAsm.canopy} pts`;
    document.getElementById('bomCountRotor').textContent = `${partCountByAsm.mainRotor} pts`;
    document.getElementById('bomCountNacelles').textContent = `${partCountByAsm.nacelles} pts`;
    document.getElementById('bomCountWings').textContent = `${partCountByAsm.wings} pts`;
    document.getElementById('bomCountTailGear').textContent = `${partCountByAsm.tailboom + partCountByAsm.turret + partCountByAsm.gear} pts`;

    // =========================================================================
    // 4. DIMENSION CALLOUTS BOUNDING BOX OVERLAY
    // =========================================================================
    const dimsGroup = new THREE.Group();
    dimsGroup.visible = false;
    scene.add(dimsGroup);

    function createDimLine(p1, p2, colorHex) {
      const pts = [new THREE.Vector3(...p1), new THREE.Vector3(...p2)];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.75 });
      return new THREE.Line(geo, mat);
    }

    dimsGroup.add(createDimLine([3.6, -2.1, -8.8], [3.6, -2.1, 6.4], 0xf59e0b));
    dimsGroup.add(createDimLine([0, -2.1, -8.8], [3.8, -2.1, -8.8], 0xf59e0b));
    dimsGroup.add(createDimLine([0, -2.1, 6.4], [3.8, -2.1, 6.4], 0xf59e0b));

    dimsGroup.add(createDimLine([-3.6, -2.15, 1.05], [-3.6, 3.2, 1.05], 0x34d399));
    dimsGroup.add(createDimLine([-1.0, 3.2, 1.05], [-3.8, 3.2, 1.05], 0x34d399));

    dimsGroup.add(createDimLine([-2.5, -2.1, 0.85], [2.5, -2.1, 0.85], 0xc084fc));

    const dimAnchors = {
      dimLabelLength: new THREE.Vector3(3.8, -2.0, -0.8),
      dimLabelRotor: new THREE.Vector3(0, 2.35, 7.6),
      dimLabelHeight: new THREE.Vector3(-3.8, 0.6, 1.05),
      dimLabelWing: new THREE.Vector3(-2.6, -1.5, 0.85)
    };

    let showDimensions = false;

    function updateDimensionLabels() {
      const containerEl = document.getElementById('dimLabelsContainer');
      if (!showDimensions) {
        containerEl.style.display = 'none';
        return;
      }
      containerEl.style.display = 'block';
      const w = container.clientWidth;
      const h = container.clientHeight;

      Object.entries(dimAnchors).forEach(([elId, vec3]) => {
        const el = document.getElementById(elId);
        if (!el) return;
        const proj = vec3.clone().project(camera);
        if (proj.z > 1) {
          el.style.opacity = '0';
          return;
        }
        const x = (proj.x * 0.5 + 0.5) * w;
        const y = (-(proj.y * 0.5) + 0.5) * h;
        el.style.opacity = '1';
        el.style.transform = `translate(-50%, -50%) translate(${Math.round(x)}px, ${Math.round(y)}px)`;
      });
    }

    // =========================================================================
    // 5. CAMERA CONTROLLER & ORTHOGRAPHIC PRESETS MATCHING ALL 4 SCREENSHOTS
    // =========================================================================
    const camState = {
      theta: -1.18,
      phi: 1.30,
      radius: 16.0,
      target: new THREE.Vector3(0, 0.18, -0.5),
      isDragging: false,
      isPanning: false,
      lastX: 0,
      lastY: 0
    };

    function syncCameraPosition() {
      camState.phi = Math.max(0.08, Math.min(Math.PI - 0.08, camState.phi));
      camState.radius = Math.max(3.0, Math.min(45, camState.radius));

      camera.position.x = camState.target.x + camState.radius * Math.sin(camState.phi) * Math.sin(camState.theta);
      camera.position.y = camState.target.y + camState.radius * Math.cos(camState.phi);
      camera.position.z = camState.target.z + camState.radius * Math.sin(camState.phi) * Math.cos(camState.theta);
      camera.lookAt(camState.target);
    }
    syncCameraPosition();

    let pointerDownPos = { x: 0, y: 0 };

    renderer.domElement.addEventListener('mousedown', (e) => {
      if (window.flightSimApp && window.flightSimApp.activeAppMode === 'FLIGHT_SIM') {
        if (window.flightSimApp.cameraViewMode === 'ORBIT_CAM' || e.button === 2) {
          camState.isDragging = true;
          camState.isPanning = false;
          camState.lastX = e.clientX;
          camState.lastY = e.clientY;
        } else {
          // Left-drag on 3D viewport in Flight Sim directly steers Cyclic Pitch & Roll!
          window.flightSimApp.viewportStickDragging = true;
          window.flightSimApp.viewportDragStart = { x: e.clientX, y: e.clientY };
        }
        return;
      }
      camState.isDragging = true;
      camState.isPanning = (e.button === 2 || e.shiftKey);
      camState.lastX = e.clientX;
      camState.lastY = e.clientY;
      pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousemove', (e) => {
      if (window.flightSimApp && window.flightSimApp.activeAppMode === 'FLIGHT_SIM') {
        if (window.flightSimApp.viewportStickDragging && window.flightSimApp.viewportDragStart) {
          const dx = (e.clientX - window.flightSimApp.viewportDragStart.x) / 140.0;
          const dy = (e.clientY - window.flightSimApp.viewportDragStart.y) / 140.0;
          window.flightSimApp.sliderTrim.cyclicRoll = THREE.MathUtils.clamp(dx, -1.0, 1.0);
          window.flightSimApp.sliderTrim.cyclicPitch = THREE.MathUtils.clamp(-dy, -1.0, 1.0);
          if (window.flightSimApp.physics.isGrounded && window.flightSimApp.sliderTrim.collective < 0.48) {
            window.flightSimApp.sliderTrim.collective = 0.50;
            window.flightSimApp.physics.inputs.collective = 0.50;
            window.flightSimApp.physics.isGrounded = false;
          }
          return;
        }
        if (!camState.isDragging) return;
        const dx = e.clientX - camState.lastX;
        const dy = e.clientY - camState.lastY;
        camState.lastX = e.clientX;
        camState.lastY = e.clientY;
        camState.theta -= dx * 0.007;
        camState.phi = Math.max(0.15, Math.min(Math.PI * 0.48, camState.phi - dy * 0.007));
        return;
      }
      if (!camState.isDragging) return;
      const dx = e.clientX - camState.lastX;
      const dy = e.clientY - camState.lastY;
      camState.lastX = e.clientX;
      camState.lastY = e.clientY;

      if (camState.isPanning) {
        const panScale = camState.radius * 0.0015;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();
        camera.matrix.extractBasis(right, up, new THREE.Vector3());
        camState.target.addScaledVector(right, -dx * panScale);
        camState.target.addScaledVector(up, dy * panScale);
      } else {
        camState.theta -= dx * 0.007;
        camState.phi -= dy * 0.007;
      }
      syncCameraPosition();
    });

    window.addEventListener('mouseup', (e) => {
      if (window.flightSimApp && window.flightSimApp.viewportStickDragging) {
        window.flightSimApp.viewportStickDragging = false;
        const autoCenter = document.getElementById('autoCenterStickChk');
        if (!autoCenter || autoCenter.checked) {
          window.flightSimApp.sliderTrim.cyclicPitch = 0.0;
          window.flightSimApp.sliderTrim.cyclicRoll = 0.0;
        }
      }
      const moveDist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      if (camState.isDragging && moveDist < 5 && e.button === 0 && (!window.flightSimApp || window.flightSimApp.activeAppMode !== 'FLIGHT_SIM')) {
        handleViewportClick(e);
      }
      camState.isDragging = false;
    });

    renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

    renderer.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (window.flightSimApp && window.flightSimApp.activeAppMode === 'FLIGHT_SIM' && window.flightSimApp.cameraViewMode !== 'ORBIT_CAM') {
        // Mouse wheel adjusts Collective Pitch smoothly in Flight Sim mode!
        const deltaColl = -Math.sign(e.deltaY) * 0.03;
        window.flightSimApp.sliderTrim.collective = THREE.MathUtils.clamp(window.flightSimApp.sliderTrim.collective + deltaColl, 0.0, 1.0);
        window.flightSimApp.physics.inputs.collective = window.flightSimApp.sliderTrim.collective;
        if (window.flightSimApp.sliderTrim.collective > 0.44) window.flightSimApp.physics.isGrounded = false;
        return;
      }
      camState.radius += e.deltaY * 0.012;
      syncCameraPosition();
    }, { passive: false });

    renderer.domElement.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        camState.isDragging = true;
        camState.isPanning = false;
        camState.lastX = e.touches[0].clientX;
        camState.lastY = e.touches[0].clientY;
      }
    }, { passive: true });

    renderer.domElement.addEventListener('touchmove', (e) => {
      if (!camState.isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - camState.lastX;
      const dy = e.touches[0].clientY - camState.lastY;
      camState.lastX = e.touches[0].clientX;
      camState.lastY = e.touches[0].clientY;
      camState.theta -= dx * 0.007;
      camState.phi -= dy * 0.007;
      syncCameraPosition();
    }, { passive: true });

    renderer.domElement.addEventListener('touchend', () => {
      camState.isDragging = false;
    });

    function setCameraPreset(theta, phi, radius, targetVec, activeBtnId) {
      camState.theta = theta;
      camState.phi = phi;
      camState.radius = radius;
      camState.target.set(...targetVec);
      syncCameraPosition();

      ['camIsoBtn', 'camRearIsoBtn', 'camFrontBtn', 'camSideBtn', 'camTopBtn', 'camCockpitBtn', 'camRadarBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        if (id === activeBtnId) {
          btn.className = 'px-2 py-1 text-xs font-medium rounded bg-amber-500 text-slate-950 transition';
        } else {
          btn.className = 'px-2 py-1 text-xs font-medium rounded text-slate-300 hover:bg-slate-800 transition';
        }
      });
    }

    document.getElementById('camIsoBtn').addEventListener('click', () => setCameraPreset(-1.18, 1.30, 16.0, [0, 0.18, -0.5], 'camIsoBtn'));
    document.getElementById('camRearIsoBtn').addEventListener('click', () => setCameraPreset(-2.38, 1.24, 15.2, [0, 0.25, -1.2], 'camRearIsoBtn'));
    document.getElementById('camFrontBtn').addEventListener('click', () => setCameraPreset(0.0, 1.54, 11.8, [0, 0.35, 1.5], 'camFrontBtn'));
    document.getElementById('camSideBtn').addEventListener('click', () => setCameraPreset(-Math.PI / 2, 1.55, 17.5, [0, 0.25, -0.9], 'camSideBtn'));
    document.getElementById('camTopBtn').addEventListener('click', () => setCameraPreset(-0.45, 0.12, 21.0, [0, 0, -0.8], 'camTopBtn'));
    document.getElementById('camCockpitBtn').addEventListener('click', () => setCameraPreset(-0.62, 1.42, 6.8, [0, 0.2, 3.8], 'camCockpitBtn'));
    document.getElementById('camRadarBtn').addEventListener('click', () => setCameraPreset(-1.85, 1.22, 5.4, [0, 1.75, 0.9], 'camRadarBtn'));

    document.getElementById('camIsoBtnMob').addEventListener('click', () => setCameraPreset(-1.18, 1.30, 17.5, [0, 0.18, -0.5], 'camIsoBtn'));
    document.getElementById('camFrontBtnMob').addEventListener('click', () => setCameraPreset(0.0, 1.54, 12.8, [0, 0.35, 1.5], 'camFrontBtn'));
    document.getElementById('camSideBtnMob').addEventListener('click', () => setCameraPreset(-Math.PI / 2, 1.55, 18.5, [0, 0.25, -0.9], 'camSideBtn'));
    document.getElementById('camTopBtnMob').addEventListener('click', () => setCameraPreset(-0.45, 0.12, 22.0, [0, 0, -0.8], 'camTopBtn'));
    document.getElementById('resetViewBtn').addEventListener('click', () => setCameraPreset(-1.18, 1.30, 16.0, [0, 0.18, -0.5], 'camIsoBtn'));

    // =========================================================================
    // 6. VIEWPORT MODE SWITCHER (3D CAD / SPLIT COMPARE / SKETCHFAB / REF BLUEPRINTS)
    // =========================================================================
    const cadViewportPane = document.getElementById('cadViewportPane');
    const sketchfabViewportPane = document.getElementById('sketchfabViewportPane');
    const refsBlueprintPane = document.getElementById('refsBlueprintPane');

    function setWorkspaceViewMode(mode) {
      const btnMap = {
        cad: 'viewModeCadBtn',
        split: 'viewModeSplitBtn',
        sketchfab: 'viewModeSketchfabBtn',
        refs: 'viewModeRefsBtn'
      };
      Object.entries(btnMap).forEach(([k, id]) => {
        const b = document.getElementById(id);
        if (!b) return;
        b.className = (k === mode)
          ? 'px-2.5 py-1 text-xs font-semibold rounded bg-amber-500 text-slate-950 transition'
          : 'px-2.5 py-1 text-xs font-medium rounded text-slate-300 hover:bg-slate-800 transition';
      });

      refsBlueprintPane.classList.add('hidden');
      refsBlueprintPane.classList.remove('flex');

      if (mode === 'cad') {
        cadViewportPane.classList.remove('hidden');
        sketchfabViewportPane.classList.add('hidden');
        sketchfabViewportPane.classList.remove('flex');
      } else if (mode === 'split') {
        cadViewportPane.classList.remove('hidden');
        sketchfabViewportPane.classList.remove('hidden');
        sketchfabViewportPane.classList.add('flex');
      } else if (mode === 'sketchfab') {
        cadViewportPane.classList.add('hidden');
        sketchfabViewportPane.classList.remove('hidden');
        sketchfabViewportPane.classList.add('flex');
      } else if (mode === 'refs') {
        cadViewportPane.classList.remove('hidden');
        sketchfabViewportPane.classList.add('hidden');
        sketchfabViewportPane.classList.remove('flex');
        refsBlueprintPane.classList.remove('hidden');
        refsBlueprintPane.classList.add('flex');
      }

      setTimeout(() => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight);
        }
      }, 40);
    }

    document.getElementById('viewModeCadBtn').addEventListener('click', () => setWorkspaceViewMode('cad'));
    document.getElementById('viewModeSplitBtn').addEventListener('click', () => setWorkspaceViewMode('split'));
    document.getElementById('viewModeSketchfabBtn').addEventListener('click', () => setWorkspaceViewMode('sketchfab'));
    document.getElementById('viewModeRefsBtn').addEventListener('click', () => setWorkspaceViewMode('refs'));
    document.getElementById('openRefsDrawerBtn').addEventListener('click', () => setWorkspaceViewMode('refs'));
    document.getElementById('closeRefsPaneBtn').addEventListener('click', () => setWorkspaceViewMode('cad'));

    document.getElementById('refThumbSideBtn').addEventListener('click', () => {
      setWorkspaceViewMode('cad');
      setCameraPreset(-Math.PI / 2, 1.55, 17.5, [0, 0.25, -0.9], 'camSideBtn');
    });
    document.getElementById('refThumbRearBtn').addEventListener('click', () => {
      setWorkspaceViewMode('cad');
      setCameraPreset(-2.38, 1.24, 15.2, [0, 0.25, -1.2], 'camRearIsoBtn');
    });
    document.getElementById('refThumbFrontBtn').addEventListener('click', () => {
      setWorkspaceViewMode('cad');
      setCameraPreset(0.0, 1.54, 11.8, [0, 0.35, 1.5], 'camFrontBtn');
    });
    document.getElementById('refThumbTopBtn').addEventListener('click', () => {
      setWorkspaceViewMode('cad');
      setCameraPreset(-0.45, 0.12, 21.0, [0, 0, -0.8], 'camTopBtn');
    });

    document.getElementById('snapSideFromRefBtn').addEventListener('click', () => {
      setWorkspaceViewMode('cad');
      setCameraPreset(-Math.PI / 2, 1.55, 17.5, [0, 0.25, -0.9], 'camSideBtn');
    });
    document.getElementById('snapRearFromRefBtn').addEventListener('click', () => {
      setWorkspaceViewMode('cad');
      setCameraPreset(-2.38, 1.24, 15.2, [0, 0.25, -1.2], 'camRearIsoBtn');
    });
    document.getElementById('snapFrontFromRefBtn').addEventListener('click', () => {
      setWorkspaceViewMode('cad');
      setCameraPreset(0.0, 1.54, 11.8, [0, 0.35, 1.5], 'camFrontBtn');
    });
    document.getElementById('snapTopFromRefBtn').addEventListener('click', () => {
      setWorkspaceViewMode('cad');
      setCameraPreset(-0.45, 0.12, 21.0, [0, 0, -0.8], 'camTopBtn');
    });

    // =========================================================================
    // 7. COMPONENT TREE UI & RAYCAST SELECTION
    // =========================================================================
    let selectedPartId = null;
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    function renderComponentTree() {
      const listEl = document.getElementById('componentTreeList');
      listEl.innerHTML = '';

      SUB_ASSEMBLIES.forEach(item => {
        const g = groupMap[item.id];
        const isSelected = selectedPartId === item.id;
        const isVis = g.visible;

        const row = document.createElement('div');
        row.className = `flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer border transition ${
          isSelected
            ? 'bg-amber-500/15 border-amber-500/50 text-white'
            : 'bg-[#0f141c]/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
        }`;

        const left = document.createElement('div');
        left.className = 'flex items-center gap-2 min-w-0 flex-1';
        left.innerHTML = `
          <span class="w-2 h-2 rounded-full shrink-0 ${isSelected ? 'bg-amber-400' : 'bg-emerald-500/70'}"></span>
          <div class="truncate">
            <div class="text-xs font-medium truncate">${item.name}</div>
            <div class="text-[10px] mono text-slate-400 flex items-center gap-1.5">
              <span>${item.code.split(' ')[0]}</span>
              <span class="text-emerald-400">• ${item.partCount} parts</span>
            </div>
          </div>
        `;
        left.addEventListener('click', () => selectSubAssembly(item.id));

        const visBtn = document.createElement('button');
        visBtn.className = `p-1 rounded text-xs ${isVis ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-400'}`;
        visBtn.title = isVis ? 'Hide Sub-Assembly' : 'Show Sub-Assembly';
        visBtn.innerHTML = isVis
          ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>'
          : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18"/></svg>';

        visBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          g.visible = !g.visible;
          renderComponentTree();
        });

        row.appendChild(left);
        row.appendChild(visBtn);
        listEl.appendChild(row);
      });
    }

    let highlightFasteners = false;

    function updateMeshMaterials() {
      allMeshes.forEach(m => {
        if (selectedPartId && m.userData.partId === selectedPartId) {
          m.material = mats.highlightMat;
        } else if (highlightFasteners && m.userData.isFastener) {
          m.material = mats.fastenerHighlightMat;
        } else {
          m.material = m.userData.baseMaterial;
        }
      });
    }

    function selectSubAssembly(partId) {
      selectedPartId = (selectedPartId === partId) ? null : partId;
      updateMeshMaterials();

      const codeEl = document.getElementById('inspectedPartCode');
      const massEl = document.getElementById('inspectedPartMass');
      const titleEl = document.getElementById('inspectedPartTitle');
      const descEl = document.getElementById('inspectedPartDesc');

      if (!selectedPartId) {
        codeEl.textContent = 'ASM-00 MASTER AIRFRAME';
        massEl.textContent = `${totalPartsCount.toLocaleString()} Parts`;
        titleEl.textContent = 'AH-64E Apache Guardian (AH-733)';
        descEl.textContent = 'Full 1,480+ part precision-mated CAD assembly with lofted chined fuselage, flush-fitted silver canopy, articulated swashplate & lead-lag dampers, Black Hole IR exhausts, and riveted sponsons.';
      } else {
        const info = SUB_ASSEMBLIES.find(x => x.id === selectedPartId);
        if (info) {
          codeEl.textContent = info.code;
          massEl.textContent = `${info.partCount} Parts (${info.mass})`;
          titleEl.textContent = info.name;
          descEl.textContent = info.desc;
        }
      }

      renderComponentTree();
    }

    function handleViewportClick(e) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVec, camera);
      const visibleMeshes = allMeshes.filter(m => groupMap[m.userData.partId] && groupMap[m.userData.partId].visible);
      const hits = raycaster.intersectObjects(visibleMeshes, false);

      if (hits.length > 0) {
        const hitPart = hits[0].object.userData.partId;
        selectSubAssembly(hitPart);
      } else if (selectedPartId) {
        selectSubAssembly(null);
      }
    }

    document.getElementById('showAllPartsBtn').addEventListener('click', () => {
      Object.values(groupMap).forEach(g => { g.visible = true; });
      if (selectedPartId) selectSubAssembly(null);
      renderComponentTree();
    });

    renderComponentTree();

    // =========================================================================
    // 8. SHADER MODES, EXPLODED VIEW, AUTO-ASSEMBLE & KINEMATIC SLIDERS
    // =========================================================================
    function setShaderMode(mode, activeBtnId) {
      ['modeShadedEdgesBtn', 'modeTacticalBtn', 'modeWireframeBtn', 'modeXrayBtn'].forEach(id => {
        const b = document.getElementById(id);
        if (id === activeBtnId) {
          b.className = 'px-2.5 py-1 rounded text-xs font-medium bg-amber-500 text-slate-950 transition';
        } else {
          b.className = 'px-2.5 py-1 rounded text-xs font-medium text-slate-300 hover:bg-slate-800 transition';
        }
      });

      allEdgeLines.forEach(line => {
        line.visible = (mode === 'edges' || mode === 'xray');
      });

      Object.values(mats).forEach(mat => {
        if (mat === mats.canopyGlass) return;
        mat.wireframe = (mode === 'wireframe');
        if (mode === 'xray') {
          mat.transparent = true;
          mat.opacity = 0.35;
        } else {
          mat.transparent = false;
          mat.opacity = 1.0;
        }
        mat.needsUpdate = true;
      });
    }

    document.getElementById('modeShadedEdgesBtn').addEventListener('click', () => setShaderMode('edges', 'modeShadedEdgesBtn'));
    document.getElementById('modeTacticalBtn').addEventListener('click', () => setShaderMode('tactical', 'modeTacticalBtn'));
    document.getElementById('modeWireframeBtn').addEventListener('click', () => setShaderMode('wireframe', 'modeWireframeBtn'));
    document.getElementById('modeXrayBtn').addEventListener('click', () => setShaderMode('xray', 'modeXrayBtn'));

    const toggleDimsBtn = document.getElementById('toggleDimsBtn');
    toggleDimsBtn.addEventListener('click', () => {
      showDimensions = !showDimensions;
      dimsGroup.visible = showDimensions;
      toggleDimsBtn.textContent = `Dimensions: ${showDimensions ? 'ON' : 'OFF'}`;
      toggleDimsBtn.className = showDimensions
        ? 'px-2.5 py-1 rounded text-xs font-medium bg-slate-800 text-amber-400 border border-amber-500/40 hover:bg-slate-700 transition'
        : 'px-2.5 py-1 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition';
    });

    const toggleGridBtn = document.getElementById('toggleGridBtn');
    toggleGridBtn.addEventListener('click', () => {
      gridGroup.visible = !gridGroup.visible;
      toggleGridBtn.textContent = `Grid: ${gridGroup.visible ? 'ON' : 'OFF'}`;
    });

    const explodeSlider = document.getElementById('explodeSlider');
    const explodeValLabel = document.getElementById('explodeValLabel');

    function applyExplodeFactor(pct) {
      explodeValLabel.textContent = pct === 0 ? '0% (Mated)' : `${Math.round(pct * 100)}%`;
      SUB_ASSEMBLIES.forEach(item => {
        const g = groupMap[item.id];
        g.position.set(
          item.explodeVec[0] * pct,
          item.explodeVec[1] * pct,
          item.explodeVec[2] * pct
        );
      });
    }

    explodeSlider.addEventListener('input', () => {
      const pct = parseFloat(explodeSlider.value) / 100;
      applyExplodeFactor(pct);
    });

    let isAutoAssembling = false;
    let autoAssemblePhase = 0;
    const autoAssembleBtn = document.getElementById('autoAssembleBtn');
    autoAssembleBtn.addEventListener('click', () => {
      isAutoAssembling = !isAutoAssembling;
      if (isAutoAssembling) {
        autoAssemblePhase = 0;
        autoAssembleBtn.textContent = 'Stop Assembly';
      } else {
        explodeSlider.value = 0;
        applyExplodeFactor(0);
        autoAssembleBtn.textContent = 'Animate Assembly';
      }
    });

    let rotorSpinning = false;
    let rotorSpeedFactor = 1.0;

    const toggleRotorSpinBtn = document.getElementById('toggleRotorSpinBtn');
    toggleRotorSpinBtn.addEventListener('click', () => {
      rotorSpinning = !rotorSpinning;
      toggleRotorSpinBtn.textContent = rotorSpinning ? 'SPINNING' : 'SPINNING';
      toggleRotorSpinBtn.className = rotorSpinning
        ? 'px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
        : 'px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700';
    });

    const rpmSlider = document.getElementById('rpmSlider');
    const rpmValLabel = document.getElementById('rpmValLabel');
    rpmSlider.addEventListener('input', () => {
      const pct = parseInt(rpmSlider.value, 10);
      rotorSpeedFactor = pct / 100;
      const rpm = Math.round(289 * rotorSpeedFactor);
      rpmValLabel.textContent = `${rpm} RPM (${pct}%)`;
    });

    const collectiveSlider = document.getElementById('collectiveSlider');
    const collectiveValLabel = document.getElementById('collectiveValLabel');
    collectiveSlider.addEventListener('input', () => {
      const deg = parseFloat(collectiveSlider.value);
      collectiveValLabel.textContent = `${deg >= 0 ? '+' : ''}${deg.toFixed(1)}°`;
      bladePitchGroups.forEach(pg => {
        pg.rotation.z = THREE.MathUtils.degToRad(deg);
      });
    });

    const turretYawSlider = document.getElementById('turretYawSlider');
    const turretYawLabel = document.getElementById('turretYawLabel');
    const turretPitchSlider = document.getElementById('turretPitchSlider');
    const turretPitchLabel = document.getElementById('turretPitchLabel');

    turretYawSlider.addEventListener('input', () => {
      const deg = parseFloat(turretYawSlider.value);
      turretYawLabel.textContent = `${deg}°`;
      const rad = THREE.MathUtils.degToRad(deg);
      gunAzimuthGroup.rotation.y = rad;
      pnvsGimbalGroup.rotation.y = rad;
    });

    turretPitchSlider.addEventListener('input', () => {
      const deg = parseFloat(turretPitchSlider.value);
      turretPitchLabel.textContent = `${deg}°`;
      gunElevationGroup.rotation.x = THREE.MathUtils.degToRad(-deg);
    });

    document.getElementById('centerTurretBtn').addEventListener('click', () => {
      turretYawSlider.value = 0;
      turretPitchSlider.value = 0;
      turretYawSlider.dispatchEvent(new Event('input'));
      turretPitchSlider.dispatchEvent(new Event('input'));
    });

    document.getElementById('toggleFastenersChk').addEventListener('change', (e) => {
      highlightFasteners = e.target.checked;
      updateMeshMaterials();
    });
    document.getElementById('toggleHellfireChk').addEventListener('change', (e) => {
      hellfireGroup.visible = e.target.checked;
    });
    document.getElementById('toggleHydraChk').addEventListener('change', (e) => {
      hydraGroup.visible = e.target.checked;
    });
    document.getElementById('toggleLongbowChk').addEventListener('change', (e) => {
      longbowDomeGroup.visible = e.target.checked;
      mastSpikeGroup.visible = !e.target.checked;
    });

    // =========================================================================
    // 9. EXPORT 3D MODEL AS .OBJ FOR AUTODESK FUSION IMPORT
    // =========================================================================
    function showToast(msg) {
      const toast = document.getElementById('toastBanner');
      toast.textContent = msg;
      toast.style.opacity = '1';
      setTimeout(() => { toast.style.opacity = '0'; }, 3000);
    }

    document.getElementById('exportObjBtn').addEventListener('click', () => {
      let objLines = [
        `# Boeing AH-64E Apache Guardian (AH-733) — ${totalPartsCount} Part Master CAD Assembly`,
        '# Units: meters (1:1 Scale - Length 14.70m, Rotor Diameter 14.63m)',
        '# Ready for Autodesk Fusion 360 -> Insert -> Insert Mesh'
      ];
      let vertexOffset = 1;

      apacheRoot.updateMatrixWorld(true);

      allMeshes.forEach((mesh, idx) => {
        if (!groupMap[mesh.userData.partId] || !groupMap[mesh.userData.partId].visible) return;
        const geo = mesh.geometry.clone();
        geo.applyMatrix4(mesh.matrixWorld);

        const pos = geo.attributes.position;
        if (!pos) return;

        objLines.push(`o ${mesh.userData.partId}_part_${idx}`);
        for (let i = 0; i < pos.count; i++) {
          objLines.push(`v ${pos.getX(i).toFixed(4)} ${pos.getY(i).toFixed(4)} ${pos.getZ(i).toFixed(4)}`);
        }

        const index = geo.index;
        if (index) {
          for (let i = 0; i < index.count; i += 3) {
            const a = index.getX(i) + vertexOffset;
            const b = index.getX(i + 1) + vertexOffset;
            const c = index.getX(i + 2) + vertexOffset;
            objLines.push(`f ${a} ${b} ${c}`);
          }
        } else {
          for (let i = 0; i < pos.count; i += 3) {
            const a = i + vertexOffset;
            const b = i + 1 + vertexOffset;
            const c = i + 2 + vertexOffset;
            objLines.push(`f ${a} ${b} ${c}`);
          }
        }
        vertexOffset += pos.count;
      });

      const blob = new Blob([objLines.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Boeing_AH64E_Apache_1480Parts_Master.obj';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Exported ${totalPartsCount.toLocaleString()} Parts to .OBJ!`);
    });

    // =========================================================================
    // 10. FUSION 360 PYTHON API GENERATOR SCRIPT MODAL
    // =========================================================================
    const FUSION_PYTHON_SCRIPT = `import adsk.core, adsk.fusion, math, traceback

def run(context):
    ui = None
    try:
        app = adsk.core.Application.get()
        ui = app.userInterface
        doc = app.documents.add(adsk.core.DocumentTypes.FusionDesignDocumentType)
        design = app.activeProduct
        design.designType = adsk.fusion.DesignTypes.ParametricDesignType
        rootComp = design.rootComponent

        # Autodesk Fusion internal database units are centimeters (cm)
        # Scale 1:20 Desktop Engineering Model (1 m = 5 cm in model space)
        S = 5.0

        def create_box_body(comp, name, cx, cy, cz, sx, sy, sz):
            sketches = comp.sketches
            xyPlane = comp.xYConstructionPlane
            sk = sketches.add(xyPlane)
            lines = sk.sketchCurves.sketchLines
            p1 = adsk.core.Point3D.create((cx - sx/2)*S, (cz - sz/2)*S, 0)
            p2 = adsk.core.Point3D.create((cx + sx/2)*S, (cz + sz/2)*S, 0)
            lines.addTwoPointRectangle(p1, p2)
            prof = sk.profiles.item(0)
            extrudes = comp.features.extrudeFeatures
            extInput = extrudes.createInput(prof, adsk.fusion.FeatureOperations.NewBodyFeatureOperation)
            dist = adsk.core.ValueInput.createByReal(sy * S)
            extInput.setDistanceExtent(False, dist)
            ext = extrudes.add(extInput)
            body = ext.bodies.item(0)
            body.name = name
            return body

        # 1. Fuselage Hull, Nose Brow, Doghouse & Rounded EFAB Sponsons
        create_box_body(rootComp, "ASM01_Chined_Fuselage", 0, 0, 1.5, 1.44, 1.25, 6.2)
        create_box_body(rootComp, "ASM01_Nose_Sensor_Brow", 0, 0.34, 5.95, 0.96, 0.15, 0.88)
        create_box_body(rootComp, "ASM01_Doghouse_Fairing", 0, 1.15, 0.35, 1.18, 0.68, 3.8)
        create_box_body(rootComp, "ASM01_Left_EFAB_Sponson", -0.76, -0.24, 2.35, 0.68, 0.54, 4.9)
        create_box_body(rootComp, "ASM01_Right_EFAB_Sponson", 0.76, -0.24, 2.35, 0.68, 0.54, 4.9)

        # 2. Stepped Silver-Framed Tandem Canopy
        create_box_body(rootComp, "ASM02_Tandem_Canopy", 0, 1.15, 3.05, 0.94, 0.68, 3.40)

        # 3. Dual-Drum M-TADS Turret & Under-Nose M230 30mm Chain Gun
        create_box_body(rootComp, "ASM03_Dual_Drum_MTADS", 0, -0.02, 6.05, 0.82, 0.64, 0.62)
        create_box_body(rootComp, "ASM03_M230_Chain_Gun", 0, -1.14, 5.25, 0.52, 0.28, 2.35)

        # 4. Twin AH-733 T700-GE-701D Engine Nacelles & Black Hole IR Exhausts
        create_box_body(rootComp, "ASM05_Left_AH733_Nacelle", -0.94, 0.56, 0.18, 0.72, 0.66, 3.15)
        create_box_body(rootComp, "ASM05_Right_AH733_Nacelle", 0.94, 0.56, 0.18, 0.72, 0.66, 3.15)

        # 5. Stub Wings (4.79 m Span), 8x Hellfire Rack & 19-Tube Hydra Pods
        create_box_body(rootComp, "ASM06_Stub_Wings_4790mm", 0, 0.08, 0.85, 4.79, 0.14, 0.94)
        create_box_body(rootComp, "ASM06_Left_19Tube_Hydra_Pod", -2.18, -0.50, 0.92, 0.58, 0.58, 1.66)
        create_box_body(rootComp, "ASM06_Right_19Tube_Hydra_Pod", 2.18, -0.50, 0.92, 0.58, 0.58, 1.66)

        # 6. Cylindrical Tailboom, Dorsal Spine & Vertical Stabilizer
        create_box_body(rootComp, "ASM07_Cylindrical_Tailboom", 0, -0.10, -5.70, 0.64, 0.64, 5.3)
        create_box_body(rootComp, "ASM07_Dorsal_Spine", 0, 0.24, -5.45, 0.28, 0.28, 4.95)
        create_box_body(rootComp, "ASM07_Vertical_Fin", 0, 1.04, -7.85, 0.22, 2.28, 0.96)

        # 7. 4-Blade Main Rotor (14.63 m Diameter), Swashplate & ALQ-144 Beacon
        create_box_body(rootComp, "ASM04_Rotor_Blade_Span_X", 0, 2.16, 1.05, 14.63, 0.04, 0.46)
        create_box_body(rootComp, "ASM04_Rotor_Blade_Span_Z", 0, 2.16, 1.05, 0.46, 0.04, 14.63)
        create_box_body(rootComp, "ASM04_ALQ144_IR_Beacon", 0, 1.54, 0.18, 0.38, 0.48, 0.38)

        ui.messageBox("Boeing AH-64E Apache Guardian (AH-733 Master Assembly) solids generated!")
    except:
        if ui:
            ui.messageBox("Failed:\\n{}".format(traceback.format_exc()))
`;

    const fusionModal = document.getElementById('fusionModal');
    document.getElementById('fusionScriptCode').textContent = FUSION_PYTHON_SCRIPT;

    document.getElementById('openFusionScriptBtn').addEventListener('click', () => {
      fusionModal.classList.remove('hidden');
      fusionModal.classList.add('flex');
    });

    document.getElementById('closeFusionModalBtn').addEventListener('click', () => {
      fusionModal.classList.add('hidden');
      fusionModal.classList.remove('flex');
    });

    document.getElementById('copyFusionScriptBtn').addEventListener('click', () => {
      const textarea = document.createElement('textarea');
      textarea.value = FUSION_PYTHON_SCRIPT;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        document.getElementById('scriptStatusToast').textContent = 'Copied Python script to clipboard!';
      } catch (err) {
        document.getElementById('scriptStatusToast').textContent = 'Select code above and press Ctrl+C';
      }
      document.body.removeChild(textarea);
    });

    document.getElementById('downloadFusionScriptBtn').addEventListener('click', () => {
      const blob = new Blob([FUSION_PYTHON_SCRIPT], { type: 'text/x-python' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AH64E_Apache_AH733_Fusion.py';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Downloaded AH64E_Apache_AH733_Fusion.py!');
    });

    // =========================================================================
    // 11. ANIMATION LOOP & RESIZE HANDLER
    // =========================================================================
    window.addEventListener('resize', () => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      }
    });

    // =========================================================================
    // PHASE 2: MILITARY AVIONICS, 6-DOF GNC (RK4), GEODETIC WGS84, GOOGLE MAPS
    //          GPS MOVING MAP, COMBAT WARFARE & MIL-STD-1787 TACTICAL HUD
    // =========================================================================

    // Explicitly tag the built-in 1,480+ part AH-64E hierarchy nodes as 'Body', 'MainRotor', and 'TailRotor'
    groupMap.fuselage.name = 'Body';
    mainRotorSpinnerGroup.name = 'MainRotor';
    tailRotorSpinnerGroup.name = 'TailRotor';

    // -------------------------------------------------------------------------
    