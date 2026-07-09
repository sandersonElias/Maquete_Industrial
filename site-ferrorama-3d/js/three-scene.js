/* ============================================
   THREE.JS SCENE - 3D MAQUETTE INTERATIVA
   Usuário pode adicionar trens e controlá-los
   ============================================ */

class MaquetteScene {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Container not found:', containerId);
      return;
    }

    if (this.container.clientWidth === 0 || this.container.clientHeight === 0) {
      console.error('Container has no dimensions:', containerId);
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.maquette = null;
    this.animationId = null;
    this.clock = new THREE.Clock();

    // Trains
    this.trains = [];
    this.selectedTrainIndex = -1;
    this.trainIdCounter = 0;

    // Track data
    this.trackCurves = [];
    this.trackPoints = [];

    // Train colors palette
    this.trainColors = [
      { name: 'Azul', body: 0x1e3a5f, accent: 0x2196f3, strip: 0xffd700 },
      { name: 'Vermelho', body: 0x8b1a1a, accent: 0xcc3333, strip: 0xffffff },
      { name: 'Verde', body: 0x1a5e1a, accent: 0x33cc33, strip: 0xffd700 },
      { name: 'Amarelo', body: 0x8b7d00, accent: 0xffcc00, strip: 0x1a1a1a },
      { name: 'Laranja', body: 0x8b4500, accent: 0xff6b35, strip: 0xffffff },
      { name: 'Roxo', body: 0x4a1a6b, accent: 0x9933ff, strip: 0xffd700 },
    ];

    // Train types
    this.trainTypes = [
      { name: 'Carga', cars: 4, label: 'Carga', icon: '🚂' },
      { name: 'Passageiro', cars: 5, label: 'Passageiro', icon: '🚆' },
      { name: 'Expresso', cars: 3, label: 'Expresso', icon: '🚄' },
      { name: 'Minerador', cars: 3, label: 'Minerador', icon: '⛏️' },
    ];

    // Raycaster for click placement
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoveredTrackPoint = null;
    this.hoverIndicator = null;

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 25, 70);

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(0, 18, 18);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 40;
    this.controls.target.set(0, 0, 0);

    this.setupLights();
    this.createMaquette();
    this.createParticles();
    this.createHoverIndicator();
    this.setupClickHandler();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  setupLights() {
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambient);

    const directional = new THREE.DirectionalLight(0xffffff, 1.2);
    directional.position.set(10, 25, 15);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 60;
    directional.shadow.camera.left = -20;
    directional.shadow.camera.right = 20;
    directional.shadow.camera.top = 20;
    directional.shadow.camera.bottom = -20;
    this.scene.add(directional);

    const blueLight = new THREE.PointLight(0x00d4ff, 1.5, 40);
    blueLight.position.set(-10, 8, 5);
    this.scene.add(blueLight);

    const greenLight = new THREE.PointLight(0x00ffb2, 1, 35);
    greenLight.position.set(10, 6, -5);
    this.scene.add(greenLight);

    const orangeLight = new THREE.PointLight(0xff6b35, 0.8, 25);
    orangeLight.position.set(0, 5, 10);
    this.scene.add(orangeLight);
  }

  createMaquette() {
    this.maquette = new THREE.Group();
    this.createBase();
    this.createTrackSystem();
    this.createElevatedSupports();
    this.createSwitches();
    this.createElectronics();
    this.createStructures();
    this.scene.add(this.maquette);
  }

  createBase() {
    const tableGeometry = new THREE.BoxGeometry(24, 0.5, 10);
    const tableMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4a574,
      roughness: 0.85,
      metalness: 0.05
    });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = -0.25;
    table.receiveShadow = true;
    table.castShadow = true;
    table.userData = { type: 'base' };
    this.maquette.add(table);

    const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xc49464, roughness: 0.9 });

    [-5, 5].forEach(z => {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(24, 0.3, 0.3), edgeMaterial);
      edge.position.set(0, 0.15, z);
      this.maquette.add(edge);
    });

    [-12, 12].forEach(x => {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 10), edgeMaterial);
      edge.position.set(x, 0.15, 0);
      this.maquette.add(edge);
    });
  }

  createTrackSystem() {
    const trackMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a, metalness: 0.7, roughness: 0.3
    });
    const sleeperMaterial = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.8 });

    this.trackCurves = [];

    // Main oval loop
    const createOvalTrack = (cx, cz, rx, ry, segments = 64) => {
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(new THREE.Vector3(cx + Math.cos(angle) * rx, 0.25, cz + Math.sin(angle) * ry));
      }
      return points;
    };

    const mainLoop = createOvalTrack(0, 0, 9, 3.5);
    this.trackPoints = mainLoop;
    const mainCurve = new THREE.CatmullRomCurve3(mainLoop, true);
    this.trackCurves.push({ curve: mainCurve, points: mainLoop, name: 'loop principal' });
    this.renderTrackFromPoints(mainLoop, trackMaterial, sleeperMaterial);

    // Upper branch (elevated)
    const branchUpper = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      branchUpper.push(new THREE.Vector3(
        -4 + t * 3,
        0.25 + t * 1.5,
        -3.5 + Math.sin(t * Math.PI) * -1.5
      ));
    }
    const upperCurve = new THREE.CatmullRomCurve3(branchUpper);
    this.trackCurves.push({ curve: upperCurve, points: branchUpper, name: 'ramal elevado' });
    this.renderTrackFromPoints(branchUpper, trackMaterial, sleeperMaterial, true);

    // Lower branch
    const branchLower = [];
    for (let i = 0; i <= 15; i++) {
      const t = i / 15;
      branchLower.push(new THREE.Vector3(2 + t * 4, 0.25, 3.5 - t * 1));
    }
    const lowerCurve = new THREE.CatmullRomCurve3(branchLower);
    this.trackCurves.push({ curve: lowerCurve, points: branchLower, name: 'ramal inferior' });
    this.renderTrackFromPoints(branchLower, trackMaterial, sleeperMaterial);

    // Diagonal connection
    const diagonal = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      diagonal.push(new THREE.Vector3(-4 + t * 8, 0.25, -2 + t * 4));
    }
    const diagCurve = new THREE.CatmullRomCurve3(diagonal);
    this.trackCurves.push({ curve: diagCurve, points: diagonal, name: 'diagonal' });
    this.renderTrackFromPoints(diagonal, trackMaterial, sleeperMaterial);
  }

  renderTrackFromPoints(points, trackMaterial, sleeperMaterial, elevated = false) {
    if (points.length < 2) return;

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 100, 0.08, 8, false);
    const track = new THREE.Mesh(tubeGeometry, trackMaterial);
    track.castShadow = true;
    this.maquette.add(track);

    const offset = 0.35;
    const points2 = points.map(p => new THREE.Vector3(p.x, p.y, p.z + offset));
    const curve2 = new THREE.CatmullRomCurve3(points2);
    const tubeGeometry2 = new THREE.TubeGeometry(curve2, 100, 0.08, 8, false);
    const track2 = new THREE.Mesh(tubeGeometry2, trackMaterial);
    track2.castShadow = true;
    this.maquette.add(track2);

    for (let i = 0; i < points.length - 1; i += 2) {
      const p = points[i];
      const p2 = points2[i];
      if (p && p2) {
        const sleeper = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.5), sleeperMaterial);
        sleeper.position.set((p.x + p2.x) / 2, (p.y + p2.y) / 2 - 0.02, (p.z + p2.z) / 2);
        if (i < points.length - 2) {
          const next = points[i + 1];
          sleeper.rotation.y = -Math.atan2(next.z - p.z, next.x - p.x);
        }
        this.maquette.add(sleeper);
      }
    }
  }

  createElevatedSupports() {
    const supportMaterial = new THREE.MeshStandardMaterial({ color: 0xc49464, roughness: 0.9 });

    const supportPositions = [
      { x: -5, z: -4.5, h: 1.5 },
      { x: -3, z: -5, h: 1.8 },
      { x: -1, z: -4.8, h: 2 },
      { x: 1, z: -4.5, h: 1.8 },
      { x: 3, z: -4, h: 1.5 },
    ];

    supportPositions.forEach(pos => {
      const shape = new THREE.Shape();
      shape.moveTo(-0.4, 0);
      shape.lineTo(0.4, 0);
      shape.lineTo(0, pos.h);
      shape.lineTo(-0.4, 0);
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
      const support = new THREE.Mesh(geometry, supportMaterial);
      support.position.set(pos.x, 0, pos.z);
      support.castShadow = true;
      this.maquette.add(support);
    });

    const platform = new THREE.Mesh(new THREE.BoxGeometry(8, 0.15, 1.5), supportMaterial);
    platform.position.set(-1, 1.8, -4.5);
    platform.castShadow = true;
    this.maquette.add(platform);
  }

  createSwitches() {
    const switchMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.3, roughness: 0.5 });
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 });

    const switchPositions = [
      { x: -6, z: 0, rotation: 0 },
      { x: 0, z: -3.5, rotation: Math.PI / 4 },
      { x: 4, z: 2, rotation: -Math.PI / 6 },
      { x: -2, z: 3, rotation: Math.PI / 3 },
    ];

    switchPositions.forEach(pos => {
      const switchGroup = new THREE.Group();
      switchGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.4), baseMaterial).translateY(0.1));
      switchGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.25), switchMaterial).translateY(0.25));
      const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3), switchMaterial);
      lever.position.set(0, 0.45, 0);
      lever.rotation.z = Math.PI / 6;
      switchGroup.add(lever);

      switchGroup.position.set(pos.x, 0, pos.z);
      switchGroup.rotation.y = pos.rotation;
      switchGroup.userData = { type: 'switch' };
      this.maquette.add(switchGroup);
    });
  }

  createElectronics() {
    const electronicsGroup = new THREE.Group();

    const breadboard = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.1, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 })
    );
    breadboard.position.set(-8, 0.15, 2);
    electronicsGroup.add(breadboard);

    const arduino = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.08, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x0066cc, roughness: 0.6 })
    );
    arduino.position.set(-8, 0.15, 3.5);
    electronicsGroup.add(arduino);

    const wireColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
    for (let i = 0; i < 5; i++) {
      const wire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 2),
        new THREE.MeshStandardMaterial({ color: wireColors[i] })
      );
      wire.position.set(-8 + i * 0.2, 0.2, 2.75);
      wire.rotation.x = Math.PI / 2;
      wire.rotation.z = Math.random() * 0.5 - 0.25;
      electronicsGroup.add(wire);
    }

    this.maquette.add(electronicsGroup);
  }

  createStructures() {
    // Crane
    const craneGroup = new THREE.Group();
    craneGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0x2a2a2a })).translateY(0.15));
    craneGroup.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.5, 0.15), new THREE.MeshStandardMaterial({ color: 0xffd700 })).translateY(1));
    const hook = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
    hook.position.set(0.4, 1.8, 0);
    craneGroup.add(hook);
    craneGroup.position.set(-6, 0, -1);
    this.maquette.add(craneGroup);

    // Structure
    const structure2 = new THREE.Group();
    structure2.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), new THREE.MeshStandardMaterial({ color: 0xffd700 })).translateY(0.2));
    structure2.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1), new THREE.MeshStandardMaterial({ color: 0xffd700 })).translateY(0.9));
    structure2.position.set(2, 0, -2);
    this.maquette.add(structure2);

    // Boxes
    const boxPositions = [
      { x: -10, z: 0, color: 0x8b4513 },
      { x: -9, z: -1, color: 0x654321 },
      { x: 8, z: -1, color: 0x2a2a2a },
      { x: 10, z: 1, color: 0x4a4a4a },
    ];
    boxPositions.forEach(pos => {
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.5 + Math.random() * 0.5, 0.3 + Math.random() * 0.4, 0.4 + Math.random() * 0.3),
        new THREE.MeshStandardMaterial({ color: pos.color, roughness: 0.8 })
      );
      box.position.set(pos.x, 0.2, pos.z);
      box.rotation.y = Math.random() * Math.PI;
      box.castShadow = true;
      this.maquette.add(box);
    });
  }

  createParticles() {
    const geometry = new THREE.BufferGeometry();
    const count = 300;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 40;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particles = new THREE.Points(geometry, new THREE.PointsMaterial({
      size: 0.05, color: 0x00d4ff, transparent: true, opacity: 0.4
    }));
    this.scene.add(this.particles);
  }

  // ==========================================
  // HOVER INDICATOR for placement
  // ==========================================
  createHoverIndicator() {
    const ringGeometry = new THREE.RingGeometry(0.3, 0.45, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffb2, transparent: true, opacity: 0, side: THREE.DoubleSide
    });
    this.hoverIndicator = new THREE.Mesh(ringGeometry, ringMaterial);
    this.hoverIndicator.rotation.x = -Math.PI / 2;
    this.hoverIndicator.position.y = 0.5;
    this.scene.add(this.hoverIndicator);
  }

  // ==========================================
  // CLICK HANDLER — place train on track
  // ==========================================
  setupClickHandler() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('click', (e) => {
      if (!this.placementMode) return;

      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Check intersection with main track
      if (this.trackCurves.length > 0) {
        const mainCurve = this.trackCurves[0];
        const curvePoints = mainCurve.curve.getPoints(200);

        let closest = null;
        let closestDist = Infinity;

        for (let i = 0; i < curvePoints.length; i++) {
          const pt = curvePoints[i];
          pt.y = 0.5;
          const ray = this.raycaster.ray;
          const pointOnRay = new THREE.Vector3();
          ray.closestPointToPoint(pt, pointOnRay);
          const dist = pt.distanceTo(pointOnRay);

          if (dist < closestDist && dist < 2.0) {
            closestDist = dist;
            closest = i / curvePoints.length;
          }
        }

        if (closest !== null) {
          const colorIdx = this.trainIdCounter % this.trainColors.length;
          const typeIdx = (this.selectedTrainType !== undefined) ? this.selectedTrainType : 0;
          this.addTrain(closest, colorIdx, typeIdx);

          // Disable placement mode after placement
          this.placementMode = false;
          if (this.hoverIndicator) this.hoverIndicator.material.opacity = 0;

          // Notify UI
          if (typeof this.onTrainPlaced === 'function') {
            this.onTrainPlaced();
          }
        }
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.placementMode) {
        if (this.hoverIndicator) this.hoverIndicator.material.opacity = 0;
        return;
      }

      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);

      if (this.trackCurves.length > 0) {
        const curvePoints = this.trackCurves[0].curve.getPoints(200);
        let closest = null;
        let closestDist = Infinity;

        for (let i = 0; i < curvePoints.length; i++) {
          const pt = curvePoints[i].clone();
          pt.y = 0.5;
          const pointOnRay = new THREE.Vector3();
          this.raycaster.ray.closestPointToPoint(pt, pointOnRay);
          const dist = pt.distanceTo(pointOnRay);

          if (dist < closestDist && dist < 2.0) {
            closestDist = dist;
            closest = curvePoints[i];
          }
        }

        if (closest) {
          this.hoverIndicator.position.set(closest.x, 0.5, closest.z);
          this.hoverIndicator.material.opacity = closestDist < 1.5 ? 0.8 : 0.3;
        } else {
          this.hoverIndicator.material.opacity = 0;
        }
      }
    });
  }

  setPlacementMode(active, typeIndex) {
    this.placementMode = active;
    this.selectedTrainType = typeIndex || 0;
    if (!active && this.hoverIndicator) {
      this.hoverIndicator.material.opacity = 0;
    }
  }

  // ==========================================
  // TRAIN CREATION
  // ==========================================
  addTrain(progressOnTrack, colorIndex, typeIndex) {
    const colorScheme = this.trainColors[colorIndex % this.trainColors.length];
    const trainType = this.trainTypes[typeIndex % this.trainTypes.length];
    const trainGroup = new THREE.Group();
    const id = this.trainIdCounter++;

    // Locomotive
    const locoBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 0.5, 0.5),
      new THREE.MeshStandardMaterial({ color: colorScheme.body, metalness: 0.4, roughness: 0.5 })
    );
    locoBody.position.y = 0.35;
    locoBody.castShadow = true;
    trainGroup.add(locoBody);

    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.45, 0.45),
      new THREE.MeshStandardMaterial({ color: colorScheme.accent, metalness: 0.3 })
    );
    cabin.position.set(-0.5, 0.7, 0);
    trainGroup.add(cabin);

    const strip = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.08, 0.52),
      new THREE.MeshStandardMaterial({ color: colorScheme.strip })
    );
    strip.position.y = 0.6;
    trainGroup.add(strip);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.08);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
    for (let x = -0.5; x <= 0.5; x += 0.5) {
      for (let z of [-0.25, 0.25]) {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x, 0.15, z);
        trainGroup.add(wheel);
      }
    }

    // Headlights
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xffff99 });
    for (const z of [-0.15, 0.15]) {
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), headlightMat);
      hl.position.set(0.9, 0.35, z);
      trainGroup.add(hl);
    }

    // Cars
    const carOffset = -1.2;
    for (let c = 0; c < trainType.cars; c++) {
      const carGroup = new THREE.Group();

      const carBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.4, 0.45),
        new THREE.MeshStandardMaterial({ color: colorScheme.body, metalness: 0.3, roughness: 0.5 })
      );
      carBody.position.y = 0.3;
      carBody.castShadow = true;
      carGroup.add(carBody);

      const carTop = new THREE.Mesh(
        new THREE.BoxGeometry(1.4, 0.15, 0.48),
        new THREE.MeshStandardMaterial({ color: colorScheme.accent })
      );
      carTop.position.y = 0.55;
      carGroup.add(carTop);

      // Car wheels
      for (let x = -0.4; x <= 0.4; x += 0.8) {
        for (const z of [-0.22, 0.22]) {
          const w = new THREE.Mesh(wheelGeometry, wheelMaterial);
          w.rotation.x = Math.PI / 2;
          w.position.set(x, 0.15, z);
          carGroup.add(w);
        }
      }

      carGroup.position.x = carOffset - c * 1.5;
      trainGroup.add(carGroup);
    }

    // Headlight glow
    const glowGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({ color: 0xffff99, transparent: true, opacity: 0.3 });
    const headGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    headGlow.position.set(0.95, 0.35, 0);
    trainGroup.add(headGlow);

    // Name label using sprite
    const trainData = {
      id: id,
      group: trainGroup,
      type: trainType,
      color: colorScheme,
      progress: progressOnTrack || 0,
      speed: 0.03,
      running: false,
      direction: 1,
      name: `${trainType.label} #${id + 1}`,
      trackIndex: 0,
    };

    trainGroup.userData = { type: 'train', trainId: id };
    this.trains.push(trainData);
    this.maquette.add(trainGroup);

    // Position train on track
    this.updateTrainPosition(trainData);

    // Notify UI
    if (typeof this.onTrainAdded === 'function') {
      this.onTrainAdded(trainData);
    }

    return trainData;
  }

  removeTrain(id) {
    const idx = this.trains.findIndex(t => t.id === id);
    if (idx === -1) return;
    const train = this.trains[idx];
    this.maquette.remove(train.group);
    train.group.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
    });
    this.trains.splice(idx, 1);

    if (typeof this.onTrainRemoved === 'function') {
      this.onTrainRemoved(id);
    }
  }

  // ==========================================
  // TRAIN CONTROL
  // ==========================================
  setTrainSpeed(id, speed) {
    const train = this.trains.find(t => t.id === id);
    if (train) train.speed = speed;
  }

  toggleTrainRunning(id) {
    const train = this.trains.find(t => t.id === id);
    if (train) {
      train.running = !train.running;
      if (typeof this.onTrainToggled === 'function') {
        this.onTrainToggled(train);
      }
    }
    return train ? train.running : false;
  }

  startAllTrains() {
    this.trains.forEach(t => t.running = true);
    if (typeof this.onAllTrainsToggled === 'function') {
      this.onAllTrainsToggled(true);
    }
  }

  stopAllTrains() {
    this.trains.forEach(t => t.running = false);
    if (typeof this.onAllTrainsToggled === 'function') {
      this.onAllTrainsToggled(false);
    }
  }

  reverseTrain(id) {
    const train = this.trains.find(t => t.id === id);
    if (train) {
      train.direction *= -1;
    }
  }

  setTrainTrack(id, trackIndex) {
    const train = this.trains.find(t => t.id === id);
    if (train && trackIndex < this.trackCurves.length) {
      train.trackIndex = trackIndex;
      train.progress = 0;
    }
  }

  getTrainCount() {
    return this.trains.length;
  }

  getRunningCount() {
    return this.trains.filter(t => t.running).length;
  }

  // ==========================================
  // POSITIONING
  // ==========================================
  updateTrainPosition(train) {
    const trackData = this.trackCurves[train.trackIndex];
    if (!trackData) return;

    const point = trackData.curve.getPointAt(Math.abs(train.progress) % 1);
    const tangent = trackData.curve.getTangentAt(Math.abs(train.progress) % 1);

    train.group.position.set(point.x, point.y, point.z);
    const angle = Math.atan2(tangent.z, tangent.x);
    train.group.rotation.y = train.direction > 0 ? -angle : Math.PI - angle;

    // Slight bobbing
    const time = this.clock.getElapsedTime();
    train.group.position.y += Math.sin(time * 8 + train.id) * 0.008;
  }

  // ==========================================
  // CAMERA VIEWS
  // ==========================================
  animateToView(view) {
    const views = {
      overview: { x: 0, y: 18, z: 18, lookAt: { x: 0, y: 0, z: 0 } },
      mina: { x: -12, y: 6, z: 5, lookAt: { x: -6, y: 0, z: -1 } },
      porto: { x: 12, y: 6, z: 5, lookAt: { x: 8, y: 0, z: 0 } },
      trem: { x: 0, y: 5, z: 8, lookAt: { x: 0, y: 0, z: 0 } }
    };

    const target = views[view];
    if (!target) return;

    const startPos = this.camera.position.clone();
    const endPos = new THREE.Vector3(target.x, target.y, target.z);
    const duration = 1500;
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      this.camera.position.lerpVectors(startPos, endPos, eased);
      this.controls.target.set(target.lookAt.x, target.lookAt.y, target.lookAt.z);

      if (progress < 1) requestAnimationFrame(animateCamera);
    };

    animateCamera();
  }

  // ==========================================
  // ANIMATION LOOP
  // ==========================================
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const time = this.clock.getElapsedTime();

    // Rotate particles
    if (this.particles) {
      this.particles.rotation.y = time * 0.03;
    }

    // Animate all trains
    this.trains.forEach(train => {
      if (train.running) {
        train.progress += train.speed * train.direction;
        if (train.progress > 1) train.progress -= 1;
        if (train.progress < 0) train.progress += 1;
      }
      this.updateTrainPosition(train);
    });

    // Animate switches
    this.maquette.children.forEach(child => {
      if (child.userData.type === 'switch') {
        const scale = 1 + Math.sin(time * 2 + child.position.x) * 0.05;
        child.scale.setScalar(scale);
      }
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderer) this.renderer.dispose();
  }
}

window.MaquetteScene = MaquetteScene;
