/* ============================================
   THREE.JS SCENE - 3D MAQUETTE INTERATIVA
   Usuário pode adicionar trens e controlá-los
   ============================================ */

class MaquetteScene {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) { console.error('Container not found:', containerId); return; }
    if (this.container.clientWidth === 0 || this.container.clientHeight === 0) {
      console.error('Container has no dimensions:', containerId); return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.maquette = null;
    this.animationId = null;
    this.clock = new THREE.Clock();

    this.trains = [];
    this.trainIdCounter = 0;
    this.trackCurves = [];
    this.trackPoints = [];

    this.trainColors = [
      { name: 'Azul', body: 0x1e3a5f, accent: 0x2196f3, strip: 0xffd700 },
      { name: 'Vermelho', body: 0x8b1a1a, accent: 0xcc3333, strip: 0xffffff },
      { name: 'Verde', body: 0x1a5e1a, accent: 0x33cc33, strip: 0xffd700 },
      { name: 'Amarelo', body: 0x8b7d00, accent: 0xffcc00, strip: 0x1a1a1a },
      { name: 'Laranja', body: 0x8b4500, accent: 0xff6b35, strip: 0xffffff },
      { name: 'Roxo', body: 0x4a1a6b, accent: 0x9933ff, strip: 0xffd700 },
    ];

    this.trainTypes = [
      { name: 'Carga', cars: 4, label: 'Carga', icon: '🚂' },
      { name: 'Passageiro', cars: 5, label: 'Passageiro', icon: '🚆' },
      { name: 'Expresso', cars: 3, label: 'Expresso', icon: '🚄' },
      { name: 'Minerador', cars: 3, label: 'Minerador', icon: '⛏️' },
    ];

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoverIndicator = null;
    this.placementMode = false;
    this.selectedTrainType = 0;

    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 25, 70);

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    this.camera.position.set(0, 18, 18);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
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

    this.setupLights();
    this.createMaquette();
    this.createParticles();
    this.createHoverIndicator();
    this.setupClickHandler();

    this.container.classList.add('loaded');
    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  setupLights() {
    this.scene.add(new THREE.AmbientLight(0x404060, 0.6));

    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(10, 25, 15);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 60;
    dir.shadow.camera.left = dir.shadow.camera.bottom = -20;
    dir.shadow.camera.right = dir.shadow.camera.top = 20;
    this.scene.add(dir);

    this.scene.add(Object.assign(new THREE.PointLight(0x00d4ff, 1.5, 40), { position: new THREE.Vector3(-10, 8, 5) }));
    this.scene.add(Object.assign(new THREE.PointLight(0x00ffb2, 1, 35), { position: new THREE.Vector3(10, 6, -5) }));
    this.scene.add(Object.assign(new THREE.PointLight(0xff6b35, 0.8, 25), { position: new THREE.Vector3(0, 5, 10) }));
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
    const mat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.85, metalness: 0.05 });
    const table = new THREE.Mesh(new THREE.BoxGeometry(24, 0.5, 10), mat);
    table.position.y = -0.25;
    table.receiveShadow = true;
    table.castShadow = true;
    this.maquette.add(table);

    const em = new THREE.MeshStandardMaterial({ color: 0xc49464, roughness: 0.9 });
    [-5, 5].forEach(z => {
      const e = new THREE.Mesh(new THREE.BoxGeometry(24, 0.3, 0.3), em);
      e.position.set(0, 0.15, z);
      this.maquette.add(e);
    });
    [-12, 12].forEach(x => {
      const e = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 10), em);
      e.position.set(x, 0.15, 0);
      this.maquette.add(e);
    });
  }

  createTrackSystem() {
    const tm = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7, roughness: 0.3 });
    const sm = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.8 });
    this.trackCurves = [];

    const makeOval = (cx, cz, rx, ry, n = 64) => {
      const pts = [];
      for (let i = 0; i <= n; i++) {
        const a = (i / n) * Math.PI * 2;
        pts.push(new THREE.Vector3(cx + Math.cos(a) * rx, 0.25, cz + Math.sin(a) * ry));
      }
      return pts;
    };

    const main = makeOval(0, 0, 9, 3.5);
    this.trackPoints = main;
    const mainCurve = new THREE.CatmullRomCurve3(main, true);
    this.trackCurves.push({ curve: mainCurve, name: 'loop principal' });
    this.renderTrack(main, tm, sm);

    const upper = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      upper.push(new THREE.Vector3(-4 + t * 3, 0.25 + t * 1.5, -3.5 + Math.sin(t * Math.PI) * -1.5));
    }
    this.trackCurves.push({ curve: new THREE.CatmullRomCurve3(upper), name: 'ramal elevado' });
    this.renderTrack(upper, tm, sm, true);

    const lower = [];
    for (let i = 0; i <= 15; i++) {
      const t = i / 15;
      lower.push(new THREE.Vector3(2 + t * 4, 0.25, 3.5 - t));
    }
    this.trackCurves.push({ curve: new THREE.CatmullRomCurve3(lower), name: 'ramal inferior' });
    this.renderTrack(lower, tm, sm);

    const diag = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      diag.push(new THREE.Vector3(-4 + t * 8, 0.25, -2 + t * 4));
    }
    this.trackCurves.push({ curve: new THREE.CatmullRomCurve3(diag), name: 'diagonal' });
    this.renderTrack(diag, tm, sm);
  }

  renderTrack(points, tm, sm) {
    if (points.length < 2) return;
    const c1 = new THREE.CatmullRomCurve3(points);
    this.maquette.add(new THREE.Mesh(new THREE.TubeGeometry(c1, 100, 0.08, 8, false), tm));

    const off = 0.35;
    const p2 = points.map(p => new THREE.Vector3(p.x, p.y, p.z + off));
    const c2 = new THREE.CatmullRomCurve3(p2);
    const t2 = new THREE.Mesh(new THREE.TubeGeometry(c2, 100, 0.08, 8, false), tm);
    t2.castShadow = true;
    this.maquette.add(t2);

    for (let i = 0; i < points.length - 1; i += 2) {
      const p = points[i], q = p2[i];
      if (!p || !q) continue;
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.5), sm);
      s.position.set((p.x + q.x) / 2, (p.y + q.y) / 2 - 0.02, (p.z + q.z) / 2);
      if (i < points.length - 2) {
        const n = points[i + 1];
        s.rotation.y = -Math.atan2(n.z - p.z, n.x - p.x);
      }
      this.maquette.add(s);
    }
  }

  createElevatedSupports() {
    const m = new THREE.MeshStandardMaterial({ color: 0xc49464, roughness: 0.9 });
    [
      { x: -5, z: -4.5, h: 1.5 }, { x: -3, z: -5, h: 1.8 }, { x: -1, z: -4.8, h: 2 },
      { x: 1, z: -4.5, h: 1.8 }, { x: 3, z: -4, h: 1.5 }
    ].forEach(p => {
      const s = new THREE.Shape();
      s.moveTo(-0.4, 0); s.lineTo(0.4, 0); s.lineTo(0, p.h); s.lineTo(-0.4, 0);
      const sup = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false }), m);
      sup.position.set(p.x, 0, p.z);
      sup.castShadow = true;
      this.maquette.add(sup);
    });
    const plat = new THREE.Mesh(new THREE.BoxGeometry(8, 0.15, 1.5), m);
    plat.position.set(-1, 1.8, -4.5);
    plat.castShadow = true;
    this.maquette.add(plat);
  }

  createSwitches() {
    const sw = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.3, roughness: 0.5 });
    const bm = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 });
    [
      { x: -6, z: 0, r: 0 }, { x: 0, z: -3.5, r: Math.PI / 4 },
      { x: 4, z: 2, r: -Math.PI / 6 }, { x: -2, z: 3, r: Math.PI / 3 }
    ].forEach(p => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.4), bm).translateY(0.1));
      g.add(new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.25), sw).translateY(0.25));
      const l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3), sw);
      l.position.set(0, 0.45, 0); l.rotation.z = Math.PI / 6;
      g.add(l);
      g.position.set(p.x, 0, p.z); g.rotation.y = p.r;
      g.userData = { type: 'switch' };
      this.maquette.add(g);
    });
  }

  createElectronics() {
    const eg = new THREE.Group();
    eg.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.8),
      new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 })), { position: new THREE.Vector3(-8, 0.15, 2) }));
    eg.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x0066cc, roughness: 0.6 })), { position: new THREE.Vector3(-8, 0.15, 3.5) }));
    [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff].forEach((c, i) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2),
        new THREE.MeshStandardMaterial({ color: c }));
      w.position.set(-8 + i * 0.2, 0.2, 2.75);
      w.rotation.x = Math.PI / 2;
      w.rotation.z = Math.random() * 0.5 - 0.25;
      eg.add(w);
    });
    this.maquette.add(eg);
  }

  createStructures() {
    const cg = new THREE.Group();
    cg.add(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a })).translateY(0.15));
    cg.add(new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.5, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xffd700 })).translateY(1));
    const hk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffd700 }));
    hk.position.set(0.4, 1.8, 0);
    cg.add(hk);
    cg.position.set(-6, 0, -1);
    this.maquette.add(cg);

    const s2 = new THREE.Group();
    s2.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xffd700 })).translateY(0.2));
    s2.add(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1),
      new THREE.MeshStandardMaterial({ color: 0xffd700 })).translateY(0.9));
    s2.position.set(2, 0, -2);
    this.maquette.add(s2);

    [[-10, 0, 0x8b4513], [-9, -1, 0x654321], [8, -1, 0x2a2a2a], [10, 1, 0x4a4a4a]].forEach(([x, z, c]) => {
      const b = new THREE.Mesh(
        new THREE.BoxGeometry(0.5 + Math.random() * 0.5, 0.3 + Math.random() * 0.4, 0.4 + Math.random() * 0.3),
        new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }));
      b.position.set(x, 0.2, z); b.rotation.y = Math.random() * Math.PI; b.castShadow = true;
      this.maquette.add(b);
    });
  }

  createParticles() {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(900);
    for (let i = 0; i < 900; i++) pos[i] = (Math.random() - 0.5) * 40;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.particles = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.05, color: 0x00d4ff, transparent: true, opacity: 0.4
    }));
    this.scene.add(this.particles);
  }

  // ==========================================
  // HOVER INDICATOR
  // ==========================================
  createHoverIndicator() {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.45, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ffb2, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.5;
    this.hoverIndicator = ring;
    this.scene.add(ring);
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

      if (this.trackCurves.length === 0) return;
      const pts = this.trackCurves[0].curve.getPoints(200);
      let best = null, bestD = Infinity;
      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i].clone(); pt.y = 0.5;
        const pr = new THREE.Vector3();
        this.raycaster.ray.closestPointToPoint(pt, pr);
        const d = pt.distanceTo(pr);
        if (d < bestD && d < 2.0) { bestD = d; best = i / pts.length; }
      }
      if (best !== null) {
        const ci = this.trainIdCounter % this.trainColors.length;
        this.addTrain(best, ci, this.selectedTrainType || 0);
        this.placementMode = false;
        this.hoverIndicator.material.opacity = 0;
        if (typeof this.onTrainPlaced === 'function') this.onTrainPlaced();
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.placementMode) { this.hoverIndicator.material.opacity = 0; return; }
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);

      const pts = this.trackCurves[0].curve.getPoints(200);
      let best = null, bestD = Infinity;
      for (let i = 0; i < pts.length; i++) {
        const pt = pts[i].clone(); pt.y = 0.5;
        const pr = new THREE.Vector3();
        this.raycaster.ray.closestPointToPoint(pt, pr);
        const d = pt.distanceTo(pr);
        if (d < bestD && d < 2.0) { bestD = d; best = pts[i]; }
      }
      if (best) {
        this.hoverIndicator.position.set(best.x, 0.5, best.z);
        this.hoverIndicator.material.opacity = bestD < 1.5 ? 0.8 : 0.3;
      } else {
        this.hoverIndicator.material.opacity = 0;
      }
    });
  }

  setPlacementMode(active, typeIndex) {
    this.placementMode = active;
    this.selectedTrainType = typeIndex || 0;
    if (!active) this.hoverIndicator.material.opacity = 0;
  }

  // ==========================================
  // TRAIN CREATION — single group, parts positioned along track
  // ==========================================
  _makeLoco(c) {
    const g = new THREE.Group();
    const mb = new THREE.MeshStandardMaterial({ color: c.body, metalness: 0.4, roughness: 0.5 });
    const ma = new THREE.MeshStandardMaterial({ color: c.accent, metalness: 0.3 });
    const ms = new THREE.MeshStandardMaterial({ color: c.strip });
    const mw = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });
    const mh = new THREE.MeshBasicMaterial({ color: 0xffff99 });

    // Body — facing +X direction
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.28, 0.3), mb);
    body.position.y = 0.22; body.castShadow = true; g.add(body);

    // Cabin at back
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.22, 0.28), ma);
    cab.position.set(-0.25, 0.42, 0); g.add(cab);

    // Yellow stripe
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.035, 0.32), ms);
    strip.position.y = 0.38; g.add(strip);

    // Wheels
    const wg = new THREE.CylinderGeometry(0.065, 0.065, 0.04);
    for (const x of [-0.22, 0.22]) {
      for (const z of [-0.16, 0.16]) {
        const w = new THREE.Mesh(wg, mw);
        w.rotation.x = Math.PI / 2;
        w.position.set(x, 0.065, z);
        g.add(w);
      }
    }

    // Headlights at front (+X)
    for (const z of [-0.08, 0.08]) {
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), mh);
      hl.position.set(0.42, 0.2, z); g.add(hl);
    }

    // Glow
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffff99, transparent: true, opacity: 0.2 })
    );
    glow.position.set(0.45, 0.2, 0); g.add(glow);

    return g;
  }

  _makeCar(c) {
    const g = new THREE.Group();
    const mb = new THREE.MeshStandardMaterial({ color: c.body, metalness: 0.3, roughness: 0.5 });
    const ma = new THREE.MeshStandardMaterial({ color: c.accent });
    const mw = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 0.28), mb);
    body.position.y = 0.19; body.castShadow = true; g.add(body);

    const top = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.3), ma);
    top.position.y = 0.34; g.add(top);

    const wg = new THREE.CylinderGeometry(0.055, 0.055, 0.03);
    for (const x of [-0.18, 0.18]) {
      for (const z of [-0.14, 0.14]) {
        const w = new THREE.Mesh(wg, mw);
        w.rotation.x = Math.PI / 2;
        w.position.set(x, 0.055, z);
        g.add(w);
      }
    }

    return g;
  }

  addTrain(progressOnTrack, colorIndex, typeIndex) {
    const color = this.trainColors[colorIndex % this.trainColors.length];
    const type = this.trainTypes[typeIndex % this.trainTypes.length];
    const id = this.trainIdCounter++;

    // Create a single group containing all parts
    const group = new THREE.Group();
    const parts = [];

    // Locomotive (index 0)
    const loco = this._makeLoco(color);
    group.add(loco);
    parts.push(loco);

    // Cars
    for (let i = 0; i < type.cars; i++) {
      const car = this._makeCar(color);
      group.add(car);
      parts.push(car);
    }

    this.maquette.add(group);

    const train = {
      id, group, parts, type, color,
      progress: progressOnTrack || 0,
      targetSpeed: 0.03,
      currentSpeed: 0,
      running: false,
      direction: 1,
      name: `${type.label} #${id + 1}`,
      trackIndex: 0,
      partGap: 0.03, // curve-param gap between parts
    };

    this.trains.push(train);
    this._placeTrainOnTrack(train);

    if (typeof this.onTrainAdded === 'function') this.onTrainAdded(train);
    return train;
  }

  removeTrain(id) {
    const idx = this.trains.findIndex(t => t.id === id);
    if (idx === -1) return;
    const train = this.trains[idx];
    this.maquette.remove(train.group);
    train.group.traverse(c => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
        else c.material.dispose();
      }
    });
    this.trains.splice(idx, 1);
    if (typeof this.onTrainRemoved === 'function') this.onTrainRemoved(id);
  }

  // ==========================================
  // TRAIN CONTROL
  // ==========================================
  setTrainSpeed(id, speed) {
    const t = this.trains.find(t => t.id === id);
    if (t) t.targetSpeed = speed;
  }

  toggleTrainRunning(id) {
    const t = this.trains.find(t => t.id === id);
    if (t) {
      t.running = !t.running;
      t.targetSpeed = t.running ? 0.03 : 0;
      if (typeof this.onTrainToggled === 'function') this.onTrainToggled(t);
    }
    return t ? t.running : false;
  }

  startAllTrains() {
    this.trains.forEach(t => { t.running = true; t.targetSpeed = 0.03; });
    if (typeof this.onAllTrainsToggled === 'function') this.onAllTrainsToggled(true);
  }

  stopAllTrains() {
    this.trains.forEach(t => { t.running = false; t.targetSpeed = 0; });
    if (typeof this.onAllTrainsToggled === 'function') this.onAllTrainsToggled(false);
  }

  reverseTrain(id) {
    const t = this.trains.find(t => t.id === id);
    if (t) t.direction *= -1;
  }

  getTrainCount() { return this.trains.length; }
  getRunningCount() { return this.trains.filter(t => t.running).length; }

  // ==========================================
  // TRAIN POSITIONING — simple and robust
  // ==========================================
  _placeTrainOnTrack(train) {
    const curve = this.trackCurves[train.trackIndex].curve;
    const p = ((train.progress % 1) + 1) % 1;

    // Position each part along the curve
    for (let i = 0; i < train.parts.length; i++) {
      const t = ((p - i * train.partGap) % 1 + 1) % 1;
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);

      const part = train.parts[i];
      part.position.set(point.x, point.y + 0.05, point.z);

      // Rotate to face tangent direction
      // lookAt makes -Z face the target, so we aim ahead
      const ahead = point.clone().add(tangent);
      part.lookAt(ahead.x, ahead.y, ahead.z);

      // Slight banking on curves
      const dt = 0.005;
      const t1 = curve.getTangentAt(Math.max(0, t - dt));
      const t2 = curve.getTangentAt(Math.min(1, t + dt));
      const curv = new THREE.Vector3().subVectors(t2, t1);
      // Banking = tilt sideways proportional to curvature
      const bank = THREE.MathUtils.clamp(-curv.x * 4, -0.25, 0.25);
      part.rotateZ(bank);
    }
  }

  // ==========================================
  // CAMERA VIEWS
  // ==========================================
  animateToView(view) {
    const views = {
      overview: { x: 0, y: 18, z: 18, lx: 0, ly: 0, lz: 0 },
      mina: { x: -12, y: 6, z: 5, lx: -6, ly: 0, lz: -1 },
      porto: { x: 12, y: 6, z: 5, lx: 8, ly: 0, lz: 0 },
      trem: { x: 0, y: 5, z: 8, lx: 0, ly: 0, lz: 0 },
    };
    const v = views[view];
    if (!v) return;

    const start = this.camera.position.clone();
    const end = new THREE.Vector3(v.x, v.y, v.z);
    const t0 = Date.now();
    const dur = 1500;

    const tick = () => {
      const elapsed = Date.now() - t0;
      const t = Math.min(elapsed / dur, 1);
      const e = 1 - Math.pow(1 - t, 3); // ease out cubic
      this.camera.position.lerpVectors(start, end, e);
      this.controls.target.set(v.lx, v.ly, v.lz);
      if (t < 1) requestAnimationFrame(tick);
    };
    tick();
  }

  // ==========================================
  // ANIMATION LOOP
  // ==========================================
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    const dt = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    if (this.particles) this.particles.rotation.y = time * 0.03;

    // Animate trains
    for (const train of this.trains) {
      // Smooth acceleration
      const rate = train.running ? 1.5 : 2.5;
      train.currentSpeed += (train.targetSpeed - train.currentSpeed) * Math.min(rate * dt, 1);
      if (Math.abs(train.currentSpeed) < 0.0001) train.currentSpeed = 0;

      train.progress += train.currentSpeed * train.direction;
      this._placeTrainOnTrack(train);
    }

    // Switch animation
    this.maquette.children.forEach(c => {
      if (c.userData && c.userData.type === 'switch') {
        c.scale.setScalar(1 + Math.sin(time * 2 + c.position.x) * 0.05);
      }
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderer) this.renderer.dispose();
  }
}

window.MaquetteScene = MaquetteScene;
