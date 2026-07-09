/* ============================================
   THREE.JS SCENE - 3D MAQUETTE INTERATIVA
   ============================================ */

class MaquetteScene {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    if (this.container.clientWidth === 0 || this.container.clientHeight === 0) return;

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
      { name: 'Carga', cars: 4, label: 'Carga' },
      { name: 'Passageiro', cars: 5, label: 'Passageiro' },
      { name: 'Expresso', cars: 3, label: 'Expresso' },
      { name: 'Minerador', cars: 3, label: 'Minerador' },
    ];

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.hoverIndicator = null;
    this.placementMode = false;
    this.selectedTrainType = 0;

    this.init();
  }

  init() {
    try {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x1a1a2e);
      this.scene.fog = new THREE.Fog(0x1a1a2e, 25, 70);

      var w = this.container.clientWidth;
      var h = this.container.clientHeight;

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
      window.addEventListener('resize', this.onResize.bind(this));
      this.animate();
    } catch (e) {
      console.error('MaquetteScene init error:', e);
    }
  }

  setupLights() {
    this.scene.add(new THREE.AmbientLight(0x404060, 0.6));

    var dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(10, 25, 15);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 60;
    dir.shadow.camera.left = -20;
    dir.shadow.camera.right = 20;
    dir.shadow.camera.top = 20;
    dir.shadow.camera.bottom = -20;
    this.scene.add(dir);

    var blue = new THREE.PointLight(0x00d4ff, 1.5, 40);
    blue.position.set(-10, 8, 5);
    this.scene.add(blue);

    var green = new THREE.PointLight(0x00ffb2, 1, 35);
    green.position.set(10, 6, -5);
    this.scene.add(green);

    var orange = new THREE.PointLight(0xff6b35, 0.8, 25);
    orange.position.set(0, 5, 10);
    this.scene.add(orange);
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
    var mat = new THREE.MeshStandardMaterial({ color: 0xd4a574, roughness: 0.85, metalness: 0.05 });
    var table = new THREE.Mesh(new THREE.BoxGeometry(24, 0.5, 10), mat);
    table.position.y = -0.25;
    table.receiveShadow = true;
    table.castShadow = true;
    this.maquette.add(table);

    var em = new THREE.MeshStandardMaterial({ color: 0xc49464, roughness: 0.9 });
    [-5, 5].forEach(function(z) {
      var e = new THREE.Mesh(new THREE.BoxGeometry(24, 0.3, 0.3), em);
      e.position.set(0, 0.15, z);
      this.maquette.add(e);
    }.bind(this));
    [-12, 12].forEach(function(x) {
      var e = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 10), em);
      e.position.set(x, 0.15, 0);
      this.maquette.add(e);
    }.bind(this));
  }

  createTrackSystem() {
    var tm = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7, roughness: 0.3 });
    var sm = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.8 });
    this.trackCurves = [];

    // Main oval loop
    var mainPts = [];
    for (var i = 0; i <= 64; i++) {
      var a = (i / 64) * Math.PI * 2;
      mainPts.push(new THREE.Vector3(Math.cos(a) * 9, 0.25, Math.sin(a) * 3.5));
    }
    this.trackPoints = mainPts;
    var mainCurve = new THREE.CatmullRomCurve3(mainPts, true);
    this.trackCurves.push({ curve: mainCurve, name: 'loop principal' });
    this.renderTrack(mainPts, tm, sm, true);

    // Upper branch
    var upperPts = [];
    for (var i = 0; i <= 20; i++) {
      var t = i / 20;
      upperPts.push(new THREE.Vector3(-4 + t * 3, 0.25 + t * 1.5, -3.5 + Math.sin(t * Math.PI) * -1.5));
    }
    this.trackCurves.push({ curve: new THREE.CatmullRomCurve3(upperPts), name: 'ramal elevado' });
    this.renderTrack(upperPts, tm, sm, false);

    // Lower branch
    var lowerPts = [];
    for (var i = 0; i <= 15; i++) {
      var t = i / 15;
      lowerPts.push(new THREE.Vector3(2 + t * 4, 0.25, 3.5 - t));
    }
    this.trackCurves.push({ curve: new THREE.CatmullRomCurve3(lowerPts), name: 'ramal inferior' });
    this.renderTrack(lowerPts, tm, sm, false);

    // Diagonal
    var diagPts = [];
    for (var i = 0; i <= 20; i++) {
      var t = i / 20;
      diagPts.push(new THREE.Vector3(-4 + t * 8, 0.25, -2 + t * 4));
    }
    this.trackCurves.push({ curve: new THREE.CatmullRomCurve3(diagPts), name: 'diagonal' });
    this.renderTrack(diagPts, tm, sm, false);
  }

  renderTrack(points, tm, sm, closed) {
    if (points.length < 2) return;
    var c1 = new THREE.CatmullRomCurve3(points, closed);
    var mesh1 = new THREE.Mesh(new THREE.TubeGeometry(c1, 100, 0.08, 8, false), tm);
    mesh1.castShadow = true;
    this.maquette.add(mesh1);

    // Second rail
    var offset = 0.35;
    var pts2 = [];
    for (var i = 0; i < points.length; i++) {
      pts2.push(new THREE.Vector3(points[i].x, points[i].y, points[i].z + offset));
    }
    var c2 = new THREE.CatmullRomCurve3(pts2, closed);
    var mesh2 = new THREE.Mesh(new THREE.TubeGeometry(c2, 100, 0.08, 8, false), tm);
    mesh2.castShadow = true;
    this.maquette.add(mesh2);

    // Sleepers
    for (var i = 0; i < points.length - 1; i += 2) {
      var p = points[i];
      var q = pts2[i];
      if (!p || !q) continue;
      var sleeper = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.05, 0.5), sm);
      sleeper.position.set((p.x + q.x) / 2, (p.y + q.y) / 2 - 0.02, (p.z + q.z) / 2);
      if (i < points.length - 2) {
        var next = points[i + 1];
        sleeper.rotation.y = -Math.atan2(next.z - p.z, next.x - p.x);
      }
      this.maquette.add(sleeper);
    }
  }

  createElevatedSupports() {
    var m = new THREE.MeshStandardMaterial({ color: 0xc49464, roughness: 0.9 });
    var positions = [
      { x: -5, z: -4.5, h: 1.5 }, { x: -3, z: -5, h: 1.8 }, { x: -1, z: -4.8, h: 2 },
      { x: 1, z: -4.5, h: 1.8 }, { x: 3, z: -4, h: 1.5 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var s = new THREE.Shape();
      s.moveTo(-0.4, 0);
      s.lineTo(0.4, 0);
      s.lineTo(0, pos.h);
      s.lineTo(-0.4, 0);
      var sup = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false }), m);
      sup.position.set(pos.x, 0, pos.z);
      sup.castShadow = true;
      this.maquette.add(sup);
    }
    var plat = new THREE.Mesh(new THREE.BoxGeometry(8, 0.15, 1.5), m);
    plat.position.set(-1, 1.8, -4.5);
    plat.castShadow = true;
    this.maquette.add(plat);
  }

  createSwitches() {
    var sw = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.3, roughness: 0.5 });
    var bm = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.7 });
    var positions = [
      { x: -6, z: 0, r: 0 }, { x: 0, z: -3.5, r: Math.PI / 4 },
      { x: 4, z: 2, r: -Math.PI / 6 }, { x: -2, z: 3, r: Math.PI / 3 }
    ];
    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var g = new THREE.Group();
      var base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.4), bm);
      base.position.y = 0.1;
      g.add(base);
      var mech = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.25), sw);
      mech.position.y = 0.25;
      g.add(mech);
      var lever = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3), sw);
      lever.position.set(0, 0.45, 0);
      lever.rotation.z = Math.PI / 6;
      g.add(lever);
      g.position.set(pos.x, 0, pos.z);
      g.rotation.y = pos.r;
      g.userData = { type: 'switch' };
      this.maquette.add(g);
    }
  }

  createElectronics() {
    var eg = new THREE.Group();
    var bb = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.1, 0.8), new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.8 }));
    bb.position.set(-8, 0.15, 2);
    eg.add(bb);
    var ar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.08, 0.6), new THREE.MeshStandardMaterial({ color: 0x0066cc, roughness: 0.6 }));
    ar.position.set(-8, 0.15, 3.5);
    eg.add(ar);
    var wc = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
    for (var i = 0; i < 5; i++) {
      var w = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2), new THREE.MeshStandardMaterial({ color: wc[i] }));
      w.position.set(-8 + i * 0.2, 0.2, 2.75);
      w.rotation.x = Math.PI / 2;
      w.rotation.z = Math.random() * 0.5 - 0.25;
      eg.add(w);
    }
    this.maquette.add(eg);
  }

  createStructures() {
    var cg = new THREE.Group();
    var crBase = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.4), new THREE.MeshStandardMaterial({ color: 0x2a2a2a }));
    crBase.position.y = 0.15;
    cg.add(crBase);
    var crArm = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.5, 0.15), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
    crArm.position.y = 1;
    cg.add(crArm);
    var hk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
    hk.position.set(0.4, 1.8, 0);
    cg.add(hk);
    cg.position.set(-6, 0, -1);
    this.maquette.add(cg);

    var s2 = new THREE.Group();
    var s2b = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.5), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
    s2b.position.y = 0.2;
    s2.add(s2b);
    var s2p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
    s2p.position.y = 0.9;
    s2.add(s2p);
    s2.position.set(2, 0, -2);
    this.maquette.add(s2);

    var boxes = [[-10, 0, 0x8b4513], [-9, -1, 0x654321], [8, -1, 0x2a2a2a], [10, 1, 0x4a4a4a]];
    for (var i = 0; i < boxes.length; i++) {
      var b = new THREE.Mesh(
        new THREE.BoxGeometry(0.5 + Math.random() * 0.5, 0.3 + Math.random() * 0.4, 0.4 + Math.random() * 0.3),
        new THREE.MeshStandardMaterial({ color: boxes[i][2], roughness: 0.8 })
      );
      b.position.set(boxes[i][0], 0.2, boxes[i][1]);
      b.rotation.y = Math.random() * Math.PI;
      b.castShadow = true;
      this.maquette.add(b);
    }
  }

  createParticles() {
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(900);
    for (var i = 0; i < 900; i++) pos[i] = (Math.random() - 0.5) * 40;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.particles = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.05, color: 0x00d4ff, transparent: true, opacity: 0.4
    }));
    this.scene.add(this.particles);
  }

  createHoverIndicator() {
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.45, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ffb2, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.5;
    this.hoverIndicator = ring;
    this.scene.add(ring);
  }

  setupClickHandler() {
    var self = this;
    var canvas = this.renderer.domElement;

    canvas.addEventListener('click', function(e) {
      if (!self.placementMode) return;
      var rect = canvas.getBoundingClientRect();
      self.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      self.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      self.raycaster.setFromCamera(self.mouse, self.camera);

      if (self.trackCurves.length === 0) return;
      var pts = self.trackCurves[0].curve.getPoints(200);
      var best = null, bestD = Infinity;
      for (var i = 0; i < pts.length; i++) {
        var pt = pts[i].clone();
        pt.y = 0.5;
        var pr = new THREE.Vector3();
        self.raycaster.ray.closestPointToPoint(pt, pr);
        var d = pt.distanceTo(pr);
        if (d < bestD && d < 2.0) { bestD = d; best = i / pts.length; }
      }
      if (best !== null) {
        var ci = self.trainIdCounter % self.trainColors.length;
        self.addTrain(best, ci, self.selectedTrainType || 0);
        self.placementMode = false;
        self.hoverIndicator.material.opacity = 0;
        if (typeof self.onTrainPlaced === 'function') self.onTrainPlaced();
      }
    });

    canvas.addEventListener('mousemove', function(e) {
      if (!self.placementMode) { self.hoverIndicator.material.opacity = 0; return; }
      var rect = canvas.getBoundingClientRect();
      self.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      self.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      self.raycaster.setFromCamera(self.mouse, self.camera);
      var pts = self.trackCurves[0].curve.getPoints(200);
      var best = null, bestD = Infinity;
      for (var i = 0; i < pts.length; i++) {
        var pt = pts[i].clone();
        pt.y = 0.5;
        var pr = new THREE.Vector3();
        self.raycaster.ray.closestPointToPoint(pt, pr);
        var d = pt.distanceTo(pr);
        if (d < bestD && d < 2.0) { bestD = d; best = pts[i]; }
      }
      if (best) {
        self.hoverIndicator.position.set(best.x, 0.5, best.z);
        self.hoverIndicator.material.opacity = bestD < 1.5 ? 0.8 : 0.3;
      } else {
        self.hoverIndicator.material.opacity = 0;
      }
    });
  }

  setPlacementMode(active, typeIndex) {
    this.placementMode = active;
    this.selectedTrainType = typeIndex || 0;
    if (!active) this.hoverIndicator.material.opacity = 0;
  }

  // ==========================================
  // TRAIN CREATION
  // ==========================================
  _makeLoco(c) {
    var g = new THREE.Group();
    var mb = new THREE.MeshStandardMaterial({ color: c.body, metalness: 0.4, roughness: 0.5 });
    var ma = new THREE.MeshStandardMaterial({ color: c.accent, metalness: 0.3 });
    var ms = new THREE.MeshStandardMaterial({ color: c.strip });
    var mw = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });

    var body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.28, 0.3), mb);
    body.position.y = 0.22;
    body.castShadow = true;
    g.add(body);

    var cab = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.22, 0.28), ma);
    cab.position.set(-0.25, 0.42, 0);
    g.add(cab);

    var strip = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.035, 0.32), ms);
    strip.position.y = 0.38;
    g.add(strip);

    var wg = new THREE.CylinderGeometry(0.065, 0.065, 0.04);
    var wx = [-0.22, 0.22];
    var wz = [-0.16, 0.16];
    for (var i = 0; i < wx.length; i++) {
      for (var j = 0; j < wz.length; j++) {
        var w = new THREE.Mesh(wg, mw);
        w.rotation.x = Math.PI / 2;
        w.position.set(wx[i], 0.065, wz[j]);
        g.add(w);
      }
    }

    var hlMat = new THREE.MeshBasicMaterial({ color: 0xffff99 });
    for (var j = 0; j < wz.length; j++) {
      var hl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), hlMat);
      hl.position.set(0.42, 0.2, wz[j]);
      g.add(hl);
    }

    var glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffff99, transparent: true, opacity: 0.2 })
    );
    glow.position.set(0.45, 0.2, 0);
    g.add(glow);

    return g;
  }

  _makeCar(c) {
    var g = new THREE.Group();
    var mb = new THREE.MeshStandardMaterial({ color: c.body, metalness: 0.3, roughness: 0.5 });
    var ma = new THREE.MeshStandardMaterial({ color: c.accent });
    var mw = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.8 });

    var body = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.22, 0.28), mb);
    body.position.y = 0.19;
    body.castShadow = true;
    g.add(body);

    var top = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.08, 0.3), ma);
    top.position.y = 0.34;
    g.add(top);

    var wg = new THREE.CylinderGeometry(0.055, 0.055, 0.03);
    var wx = [-0.18, 0.18];
    var wz = [-0.14, 0.14];
    for (var i = 0; i < wx.length; i++) {
      for (var j = 0; j < wz.length; j++) {
        var w = new THREE.Mesh(wg, mw);
        w.rotation.x = Math.PI / 2;
        w.position.set(wx[i], 0.055, wz[j]);
        g.add(w);
      }
    }

    return g;
  }

  addTrain(progressOnTrack, colorIndex, typeIndex) {
    var color = this.trainColors[colorIndex % this.trainColors.length];
    var type = this.trainTypes[typeIndex % this.trainTypes.length];
    var id = this.trainIdCounter++;

    var group = new THREE.Group();
    var parts = [];

    var loco = this._makeLoco(color);
    group.add(loco);
    parts.push(loco);

    for (var i = 0; i < type.cars; i++) {
      var car = this._makeCar(color);
      group.add(car);
      parts.push(car);
    }

    this.maquette.add(group);

    var train = {
      id: id,
      group: group,
      parts: parts,
      type: type,
      color: color,
      progress: progressOnTrack || 0,
      targetSpeed: 0.03,
      currentSpeed: 0,
      running: false,
      direction: 1,
      name: type.label + ' #' + (id + 1),
      trackIndex: 0,
      partGap: 0.03
    };

    this.trains.push(train);
    this._placeTrainOnTrack(train);

    if (typeof this.onTrainAdded === 'function') this.onTrainAdded(train);
    return train;
  }

  removeTrain(id) {
    var idx = -1;
    for (var i = 0; i < this.trains.length; i++) {
      if (this.trains[i].id === id) { idx = i; break; }
    }
    if (idx === -1) return;
    var train = this.trains[idx];
    this.maquette.remove(train.group);
    train.group.traverse(function(c) {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach(function(m) { m.dispose(); });
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
    for (var i = 0; i < this.trains.length; i++) {
      if (this.trains[i].id === id) { this.trains[i].targetSpeed = speed; return; }
    }
  }

  toggleTrainRunning(id) {
    for (var i = 0; i < this.trains.length; i++) {
      var t = this.trains[i];
      if (t.id === id) {
        t.running = !t.running;
        t.targetSpeed = t.running ? 0.03 : 0;
        if (typeof this.onTrainToggled === 'function') this.onTrainToggled(t);
        return t.running;
      }
    }
    return false;
  }

  startAllTrains() {
    for (var i = 0; i < this.trains.length; i++) {
      this.trains[i].running = true;
      this.trains[i].targetSpeed = 0.03;
    }
    if (typeof this.onAllTrainsToggled === 'function') this.onAllTrainsToggled(true);
  }

  stopAllTrains() {
    for (var i = 0; i < this.trains.length; i++) {
      this.trains[i].running = false;
      this.trains[i].targetSpeed = 0;
    }
    if (typeof this.onAllTrainsToggled === 'function') this.onAllTrainsToggled(false);
  }

  reverseTrain(id) {
    for (var i = 0; i < this.trains.length; i++) {
      if (this.trains[i].id === id) { this.trains[i].direction *= -1; return; }
    }
  }

  getTrainCount() { return this.trains.length; }
  getRunningCount() {
    var n = 0;
    for (var i = 0; i < this.trains.length; i++) { if (this.trains[i].running) n++; }
    return n;
  }

  // ==========================================
  // TRAIN POSITIONING
  // ==========================================
  _placeTrainOnTrack(train) {
    var curve = this.trackCurves[train.trackIndex].curve;
    var p = ((train.progress % 1) + 1) % 1;

    for (var i = 0; i < train.parts.length; i++) {
      var t = ((p - i * train.partGap) % 1 + 1) % 1;
      var point = curve.getPointAt(t);
      var tangent = curve.getTangentAt(t);

      var part = train.parts[i];
      part.position.set(point.x, point.y + 0.05, point.z);

      // Align to tangent using lookAt
      var ahead = new THREE.Vector3().copy(point).add(tangent);
      part.lookAt(ahead);

      // Simple banking based on tangent change
      var dt = 0.005;
      var t1 = curve.getTangentAt(Math.max(0, t - dt));
      var t2 = curve.getTangentAt(Math.min(1, t + dt));
      var curvX = t2.x - t1.x;
      var bank = curvX * 8;
      if (bank > 0.25) bank = 0.25;
      if (bank < -0.25) bank = -0.25;
      part.rotateZ(bank);
    }
  }

  // ==========================================
  // CAMERA VIEWS
  // ==========================================
  animateToView(view) {
    var views = {
      overview: { x: 0, y: 18, z: 18, lx: 0, ly: 0, lz: 0 },
      mina: { x: -12, y: 6, z: 5, lx: -6, ly: 0, lz: -1 },
      porto: { x: 12, y: 6, z: 5, lx: 8, ly: 0, lz: 0 },
      trem: { x: 0, y: 5, z: 8, lx: 0, ly: 0, lz: 0 },
      mine: { x: -12, y: 6, z: 5, lx: -6, ly: 0, lz: -1 },
      port: { x: 12, y: 6, z: 5, lx: 8, ly: 0, lz: 0 }
    };
    var v = views[view];
    if (!v) return;

    var self = this;
    var startPos = this.camera.position.clone();
    var endPos = new THREE.Vector3(v.x, v.y, v.z);
    var startTarget = this.controls.target.clone();
    var endTarget = new THREE.Vector3(v.lx, v.ly, v.lz);
    var t0 = Date.now();
    var dur = 1500;

    function tick() {
      var elapsed = Date.now() - t0;
      var t = Math.min(elapsed / dur, 1);
      var e = 1 - Math.pow(1 - t, 3);
      self.camera.position.lerpVectors(startPos, endPos, e);
      self.controls.target.lerpVectors(startTarget, endTarget, e);
      if (t < 1) requestAnimationFrame(tick);
    }
    tick();
  }

  // ==========================================
  // ANIMATION LOOP
  // ==========================================
  animate() {
    var self = this;
    this.animationId = requestAnimationFrame(function() { self.animate(); });

    var dt = this.clock.getDelta();
    var time = this.clock.getElapsedTime();

    if (this.particles) this.particles.rotation.y = time * 0.03;

    for (var i = 0; i < this.trains.length; i++) {
      var train = this.trains[i];
      var rate = train.running ? 1.5 : 2.5;
      train.currentSpeed += (train.targetSpeed - train.currentSpeed) * Math.min(rate * dt, 1);
      if (Math.abs(train.currentSpeed) < 0.0001) train.currentSpeed = 0;
      train.progress += train.currentSpeed * train.direction;
      this._placeTrainOnTrack(train);
    }

    for (var i = 0; i < this.maquette.children.length; i++) {
      var c = this.maquette.children[i];
      if (c.userData && c.userData.type === 'switch') {
        c.scale.setScalar(1 + Math.sin(time * 2 + c.position.x) * 0.05);
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.container) return;
    var w = this.container.clientWidth;
    var h = this.container.clientHeight;
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
