/* ============================================
   THREE.JS SCENE - MAQUETE FERRORAMA XP-500S
   Baseado nas fotos reais da maquete física
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
    this.animationId = null;
    this.clock = new THREE.Clock();

    this.trains = [];
    this.trainIdCounter = 0;
    this.trackCurves = [];

    this.trainColors = [
      { name: 'Rumo Azul',     body: 0x0d47a1, accent: 0x1565c0, strip: 0xffd700, under: 0x222222 },
      { name: 'Rumo Vermelho', body: 0xb71c1c, accent: 0xc62828, strip: 0xffffff, under: 0x222222 },
      { name: 'Verde Floresta',body: 0x1b5e20, accent: 0x2e7d32, strip: 0xffd700, under: 0x222222 },
      { name: 'Amarelo Ouro',  body: 0xf9a825, accent: 0xfbc02d, strip: 0x1a1a1a, under: 0x222222 },
      { name: 'Laranja Fogo',  body: 0xe65100, accent: 0xef6c00, strip: 0xffffff, under: 0x222222 },
      { name: 'Roxo Royal',    body: 0x4a148c, accent: 0x6a1b9a, strip: 0xffd700, under: 0x222222 },
    ];

    this.trainTypes = [
      { name: 'Carga',     cars: 4, label: 'Carga' },
      { name: 'Passageiro',cars: 5, label: 'Passageiro' },
      { name: 'Expresso',  cars: 3, label: 'Expresso' },
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
      this.scene.background = new THREE.Color(0x080810);
      this.scene.fog = new THREE.FogExp2(0x080810, 0.008);

      var w = this.container.clientWidth;
      var h = this.container.clientHeight;

      this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 1000);
      this.camera.position.set(0, 18, 22);

      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.container.appendChild(this.renderer.domElement);

      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.maxPolarAngle = Math.PI / 2.1;
      this.controls.minDistance = 5;
      this.controls.maxDistance = 50;

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
    this.scene.add(new THREE.AmbientLight(0x201810, 0.5));

    var key = new THREE.DirectionalLight(0xfff5e6, 1.2);
    key.position.set(8, 18, 10);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 60;
    key.shadow.camera.left = -18;
    key.shadow.camera.right = 18;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -12;
    key.shadow.bias = -0.0005;
    this.scene.add(key);

    var fill = new THREE.DirectionalLight(0x8899bb, 0.3);
    fill.position.set(-8, 12, -6);
    this.scene.add(fill);

    var rim = new THREE.PointLight(0xff8844, 0.4, 35);
    rim.position.set(0, 8, -10);
    this.scene.add(rim);
  }

  createMaquette() {
    this.createBase();
    this.createTrackSystem();
    this.createViaduct();
    this.createSwitches();
    this.createReversor();
    this.createElectronics();
  }

  // ==========================================
  // BASE — MDF board like in the photos
  // ==========================================
  createBase() {
    var mdfMat = new THREE.MeshStandardMaterial({ color: 0xc49464, roughness: 0.9, metalness: 0.02 });
    var base = new THREE.Mesh(new THREE.BoxGeometry(22, 0.4, 12), mdfMat);
    base.position.y = -0.2;
    base.receiveShadow = true;
    base.castShadow = true;
    this.scene.add(base);

    // Edge strips
    var edgeMat = new THREE.MeshStandardMaterial({ color: 0xa07848, roughness: 0.85 });
    [[-6, 0.05, 0], [6, 0.05, 0]].forEach(function(p) {
      var e = new THREE.Mesh(new THREE.BoxGeometry(22, 0.15, 0.2), edgeMat);
      e.position.set(p[0], p[1], p[2]);
      this.scene.add(e);
    }.bind(this));
    [[-11, 0.05, 0], [11, 0.05, 0]].forEach(function(p) {
      var e = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 12), edgeMat);
      e.position.set(p[0], p[1], p[2]);
      this.scene.add(e);
    }.bind(this));
  }

  // ==========================================
  // TRACK SYSTEM — based on real photos
  // ==========================================
  createTrackSystem() {
    this.trackCurves = [];
    var railMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.85, roughness: 0.2 });
    var sleeperMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.8 });

    // From the photos, the layout is:
    // - Main oval (elongated, left side is narrower)
    // - Right side has an elevated bypass (viaduct)
    // - Switches connect the oval to the bypass
    // - The bypass goes up, curves around the right, and comes back down

    // === MAIN OVAL ===
    // Elongated oval matching the photo proportions
    var ow = 8.0, oh = 3.5, cr = 2.0;
    var pts = [];
    var cSegs = 30, sSegs = 40;

    // Top straight
    for (var i = 0; i <= sSegs; i++) {
      var t = i / sSegs;
      pts.push(new THREE.Vector3(-ow + cr + t * (2 * ow - 2 * cr), 0.45, -oh));
    }
    // Top-right corner
    for (var i = 1; i <= cSegs; i++) {
      var a = -Math.PI / 2 + (i / cSegs) * (Math.PI / 2);
      pts.push(new THREE.Vector3(ow - cr + Math.cos(a) * cr, 0.45, -oh + cr + Math.sin(a) * cr));
    }
    // Right straight
    for (var i = 1; i <= sSegs; i++) {
      var t = i / sSegs;
      pts.push(new THREE.Vector3(ow, 0.45, -oh + cr + t * (2 * oh - 2 * cr)));
    }
    // Bottom-right corner
    for (var i = 1; i <= cSegs; i++) {
      var a = 0 + (i / cSegs) * (Math.PI / 2);
      pts.push(new THREE.Vector3(ow - cr + Math.cos(a) * cr, 0.45, oh - cr + Math.sin(a) * cr));
    }
    // Bottom straight
    for (var i = 1; i <= sSegs; i++) {
      var t = i / sSegs;
      pts.push(new THREE.Vector3(ow - cr - t * (2 * ow - 2 * cr), 0.45, oh));
    }
    // Bottom-left corner
    for (var i = 1; i <= cSegs; i++) {
      var a = Math.PI / 2 + (i / cSegs) * (Math.PI / 2);
      pts.push(new THREE.Vector3(-ow + cr + Math.cos(a) * cr, 0.45, oh - cr + Math.sin(a) * cr));
    }
    // Left straight
    for (var i = 1; i <= sSegs; i++) {
      var t = i / sSegs;
      pts.push(new THREE.Vector3(-ow, 0.45, oh - cr - t * (2 * oh - 2 * cr)));
    }
    // Top-left corner
    for (var i = 1; i <= cSegs; i++) {
      var a = Math.PI + (i / cSegs) * (Math.PI / 2);
      pts.push(new THREE.Vector3(-ow + cr + Math.cos(a) * cr, 0.45, -oh + cr + Math.sin(a) * cr));
    }

    var ovalCurve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.0);
    this.trackCurves.push({ curve: ovalCurve, name: 'circuito principal', elevation: 0 });
    this._renderRail(ovalCurve, railMat, sleeperMat, pts.length * 2, 0.45);

    // === VIADUCT / ELEVATED BYPASS (right side) ===
    // From photos: goes from bottom-right area, curves up, goes across the top, curves back down to top-right
    var vElev = 1.2; // height of viaduct
    var viaductPts = [
      new THREE.Vector3(ow - 1.5, 0.45, oh - 0.5),      // start at bottom-right of oval
      new THREE.Vector3(ow + 0.5, 0.45, oh - 1.5),       // curve out
      new THREE.Vector3(ow + 1.5, 0.45 + vElev * 0.3, oh - 2.5), // start rising
      new THREE.Vector3(ow + 2.0, 0.45 + vElev * 0.7, -oh + 1.0), // mid height
      new THREE.Vector3(ow + 1.5, 0.45 + vElev, -oh + 0.5),       // full height
      new THREE.Vector3(ow + 0.5, 0.45 + vElev, -oh + 1.5),       // across top
      new THREE.Vector3(ow - 1.0, 0.45 + vElev, -oh + 0.5),       // approaching oval
      new THREE.Vector3(ow - 2.0, 0.45 + vElev * 0.7, -oh + 1.0), // descending
      new THREE.Vector3(ow - 1.5, 0.45 + vElev * 0.3, -oh + 2.0), // more descent
      new THREE.Vector3(ow - 1.0, 0.45, -oh + 0.5),      // back to ground level
    ];

    var viaductCurve = new THREE.CatmullRomCurve3(viaductPts, false, 'catmullrom', 0.0);
    this.trackCurves.push({ curve: viaductCurve, name: 'viaduto', elevation: vElev });
    this._renderRail(viaductCurve, railMat, sleeperMat, 200, 0.45);
  }

  _renderRail(curve, railMat, sleeperMat, seg, baseY) {
    if (seg < 10) seg = 10;

    var tube = new THREE.TubeGeometry(curve, seg, 0.04, 8, false);
    var mesh = new THREE.Mesh(tube, railMat);
    mesh.castShadow = true;
    this.scene.add(mesh);

    // Second rail (offset 0.22 — HO gauge)
    var pts = curve.getPoints(seg);
    var pts2 = [];
    for (var i = 0; i < pts.length; i++) {
      pts2.push(new THREE.Vector3(pts[i].x, pts[i].y, pts[i].z + 0.22));
    }
    var curve2 = new THREE.CatmullRomCurve3(pts2, false, 'catmullrom', 0.0);
    var tube2 = new THREE.TubeGeometry(curve2, seg, 0.04, 8, false);
    var mesh2 = new THREE.Mesh(tube2, railMat);
    mesh2.castShadow = true;
    this.scene.add(mesh2);

    // Sleepers
    var step = Math.max(6, Math.floor(pts.length / 35));
    for (var i = 0; i < pts.length; i += step) {
      var p = pts[i];
      var q = pts2[i];
      if (!p || !q) continue;
      var s = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.025, 0.30), sleeperMat);
      s.position.set((p.x + q.x) / 2, (p.y + q.y) / 2 - 0.01, (p.z + q.z) / 2);
      if (i < pts.length - 1) {
        var n = pts[i + 1];
        s.rotation.y = -Math.atan2(n.z - p.z, n.x - p.x);
      }
      this.scene.add(s);
    }
  }

  // ==========================================
  // VIADUCT SUPPORTS
  // ==========================================
  createViaduct() {
    var supportMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.85, metalness: 0.02 });

    // Triangular supports along the viaduct
    var supportPositions = [
      { x: 9.5, z: 2.0, h: 0.6 },
      { x: 10.0, z: 0.5, h: 1.0 },
      { x: 10.2, z: -1.0, h: 1.4 },
      { x: 10.0, z: -2.5, h: 1.6 },
      { x: 9.5, z: -3.5, h: 1.6 },
      { x: 8.5, z: -4.0, h: 1.4 },
      { x: 7.5, z: -3.8, h: 1.0 },
      { x: 7.0, z: -3.2, h: 0.6 },
    ];

    for (var i = 0; i < supportPositions.length; i++) {
      var pos = supportPositions[i];
      // Triangular support
      var shape = new THREE.Shape();
      shape.moveTo(-0.3, 0);
      shape.lineTo(0.3, 0);
      shape.lineTo(0, pos.h);
      shape.lineTo(-0.3, 0);

      var geo = new THREE.ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: false });
      var support = new THREE.Mesh(geo, supportMat);
      support.position.set(pos.x, 0.25, pos.z);
      support.castShadow = true;
      this.scene.add(support);
    }

    // Platform on top of supports
    var platMat = new THREE.MeshStandardMaterial({ color: 0x9B8B6B, roughness: 0.8 });
    var platform = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 1.0), platMat);
    platform.position.set(9.0, 1.65, -1.5);
    platform.castShadow = true;
    this.scene.add(platform);
  }

  // ==========================================
  // SWITCHES
  // ==========================================
  createSwitches() {
    var positions = [
      { x: 6.0, z: 3.5, r: 0.3, label: 'SW1' },
      { x: 2.0, z: -3.0, r: -0.2, label: 'SW2' },
      { x: -2.0, z: 3.0, r: 0.4, label: 'SW3' },
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var g = new THREE.Group();

      // Black base
      var baseMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
      var base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.35), baseMat);
      base.position.y = 0.04;
      base.castShadow = true;
      g.add(base);

      // Yellow mechanism
      var mechMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4, metalness: 0.3, emissive: 0x443300, emissiveIntensity: 0.15 });
      var mech = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.2), mechMat);
      mech.position.y = 0.14;
      g.add(mech);

      // Lever arm
      var lever = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 6), mechMat);
      lever.position.set(0.15, 0.24, 0);
      lever.rotation.z = Math.PI / 4;
      g.add(lever);

      g.position.set(pos.x, 0.45, pos.z);
      g.rotation.y = pos.r;
      g.userData = { type: 'switch', label: pos.label };
      this.scene.add(g);
    }
  }

  // ==========================================
  // REVERSOR
  // ==========================================
  createReversor() {
    var g = new THREE.Group();

    // Black box
    var boxMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    var box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.15, 0.4), boxMat);
    box.position.y = 0.08;
    box.castShadow = true;
    g.add(box);

    // Yellow top strip
    var stripMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4, metalness: 0.3 });
    var strip = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 0.35), stripMat);
    strip.position.y = 0.17;
    g.add(strip);

    // Red indicator
    var redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.4 });
    var red = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), redMat);
    red.position.set(-0.25, 0.22, 0);
    g.add(red);

    // Green indicator
    var greenMat = new THREE.MeshStandardMaterial({ color: 0x00cc00, emissive: 0x00ff00, emissiveIntensity: 0.4 });
    var green = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), greenMat);
    green.position.set(0.25, 0.22, 0);
    g.add(green);

    g.position.set(4.0, 0.45, -3.5);
    g.userData = { type: 'reversor' };
    this.scene.add(g);
  }

  // ==========================================
  // ELECTRONICS (Arduino, breadboard, wires)
  // ==========================================
  createElectronics() {
    var eg = new THREE.Group();

    // Breadboard
    var bb = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.06, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.8 })
    );
    bb.position.set(-7, 0.52, 2);
    bb.castShadow = true;
    eg.add(bb);

    // Arduino
    var ar = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.05, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x0066cc, roughness: 0.6 })
    );
    ar.position.set(-7, 0.52, 3.2);
    ar.castShadow = true;
    eg.add(ar);

    // Wires
    var wireColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff6600];
    for (var i = 0; i < 5; i++) {
      var w = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 1.5, 4),
        new THREE.MeshStandardMaterial({ color: wireColors[i] })
      );
      w.position.set(-7 + i * 0.15, 0.55, 2.6);
      w.rotation.x = Math.PI / 2;
      w.rotation.z = (Math.random() - 0.5) * 0.4;
      eg.add(w);
    }

    this.scene.add(eg);
  }

  // ==========================================
  // PARTICLES
  // ==========================================
  createParticles() {
    var geo = new THREE.BufferGeometry();
    var count = 300;
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 40;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.particles = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.03, color: 0xffaa66, transparent: true, opacity: 0.15,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    this.scene.add(this.particles);
  }

  // ==========================================
  // HOVER INDICATOR
  // ==========================================
  createHoverIndicator() {
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.38, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ffb2, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.6;
    this.hoverIndicator = ring;
    this.scene.add(ring);
  }

  // ==========================================
  // CLICK HANDLER
  // ==========================================
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
      var pts = self.trackCurves[0].curve.getPoints(300);
      var best = null, bestD = Infinity;
      for (var i = 0; i < pts.length; i++) {
        var pt = pts[i].clone(); pt.y = 0.6;
        var pr = new THREE.Vector3();
        self.raycaster.ray.closestPointToPoint(pt, pr);
        var d = pt.distanceTo(pr);
        if (d < bestD && d < 2.5) { bestD = d; best = i / pts.length; }
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
      var pts = self.trackCurves[0].curve.getPoints(300);
      var best = null, bestD = Infinity;
      for (var i = 0; i < pts.length; i++) {
        var pt = pts[i].clone(); pt.y = 0.6;
        var pr = new THREE.Vector3();
        self.raycaster.ray.closestPointToPoint(pt, pr);
        var d = pt.distanceTo(pr);
        if (d < bestD && d < 2.5) { bestD = d; best = pts[i]; }
      }
      if (best) {
        self.hoverIndicator.position.set(best.x, 0.6, best.z);
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
  // TRAIN CREATION — XP-500S detailed
  // ==========================================
  _makeWheel(radius, width) {
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.15 });
    var disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 16), mat);
    disc.rotation.x = Math.PI / 2;
    g.add(disc);
    var flange = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.007, radius + 0.007, width + 0.005, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.85, roughness: 0.2 }));
    flange.rotation.x = Math.PI / 2;
    g.add(flange);
    return g;
  }

  _makeLoco(c) {
    var g = new THREE.Group();
    var mB = new THREE.MeshStandardMaterial({ color: c.body, metalness: 0.55, roughness: 0.3 });
    var mA = new THREE.MeshStandardMaterial({ color: c.accent, metalness: 0.4, roughness: 0.35 });
    var mS = new THREE.MeshStandardMaterial({ color: c.strip, metalness: 0.3, roughness: 0.5 });
    var mU = new THREE.MeshStandardMaterial({ color: c.under, metalness: 0.6, roughness: 0.45 });
    var mC = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.1 });
    var mG = new THREE.MeshStandardMaterial({ color: 0x88ccff, metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.5 });
    var mH = new THREE.MeshBasicMaterial({ color: 0xffeeaa });
    var mR = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.3, roughness: 0.4 });
    var mK = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.7, roughness: 0.4 });

    // Underframe
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.04, 0.28), mU), { position: new THREE.Vector3(0, 0.10, 0) }));
    // Frame rails
    for (var zz = 0; zz < 2; zz++) {
      var z = zz === 0 ? -0.13 : 0.13;
      g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.02, 0.012), mU), { position: new THREE.Vector3(0, 0.12, z) }));
    }
    // Fuel tank
    g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.20, 10), mK), { position: new THREE.Vector3(0.05, 0.08, 0), rotation: new THREE.Euler(0, 0, Math.PI / 2) }));
    // Body
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.18, 0.28), mB), { position: new THREE.Vector3(0, 0.22, 0), castShadow: true }));
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.10, 0.26), mB), { position: new THREE.Vector3(0, 0.35, 0), castShadow: true }));
    // Side panels
    for (var zz = 0; zz < 2; zz++) {
      var z = zz === 0 ? -0.141 : 0.141;
      g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.07, 0.004), mA), { position: new THREE.Vector3(0.04, 0.24, z) }));
    }
    // Stripes
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.018, 0.29), mS), { position: new THREE.Vector3(0, 0.33, 0) }));
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.006, 0.29), mS), { position: new THREE.Vector3(0, 0.30, 0) }));
    // Cab
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.26), mA), { position: new THREE.Vector3(-0.20, 0.44, 0), castShadow: true }));
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.025, 0.28), mK), { position: new THREE.Vector3(-0.20, 0.51, 0) }));
    // Windows
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.06, 0.16), mG), { position: new THREE.Vector3(-0.32, 0.45, 0) }));
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.05, 0.12), mG), { position: new THREE.Vector3(-0.08, 0.45, 0) }));
    for (var zz = 0; zz < 2; zz++) {
      var z = zz === 0 ? -0.131 : 0.131;
      g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.01), mG), { position: new THREE.Vector3(-0.20, 0.46, z) }));
    }
    // Nose
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.24), mB), { position: new THREE.Vector3(0.37, 0.23, 0), castShadow: true }));
    // Headlights
    for (var zz = 0; zz < 2; zz++) {
      var z = zz === 0 ? -0.09 : 0.09;
      g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), mH), { position: new THREE.Vector3(0.41, 0.25, z) }));
    }
    // Rear lights
    for (var zz = 0; zz < 2; zz++) {
      var z = zz === 0 ? -0.09 : 0.09;
      g.add(Object.assign(new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), mR), { position: new THREE.Vector3(-0.33, 0.22, z) }));
    }
    // Exhaust
    for (var ei = 0; ei < 2; ei++) {
      var ex = ei === 0 ? 0.14 : 0.20;
      g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.015, 0.05, 8), mK), { position: new THREE.Vector3(ex, 0.40, 0) }));
      g.add(Object.assign(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.012, 0.006, 8), mC), { position: new THREE.Vector3(ex, 0.43, 0) }));
    }
    // Handrails
    var hrMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.15 });
    for (var zz = 0; zz < 2; zz++) {
      var z = zz === 0 ? -0.145 : 0.145;
      g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.003, 0.003), hrMat), { position: new THREE.Vector3(0, 0.37, z) }));
    }
    // Wheels
    var wX = [-0.26, -0.01, 0.22];
    var wZ = [-0.14, 0.14];
    for (var wi = 0; wi < wX.length; wi++) {
      for (var wj = 0; wj < wZ.length; wj++) {
        var w = this._makeWheel(0.048, 0.030);
        w.position.set(wX[wi], 0.048, wZ[wj]);
        g.add(w);
      }
    }
    // Connecting rods
    var rodMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.85, roughness: 0.2 });
    for (var wj = 0; wj < wZ.length; wj++) {
      var rz = wZ[wj] > 0 ? wZ[wj] + 0.016 : wZ[wj] - 0.016;
      g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.010, 0.006), rodMat), { position: new THREE.Vector3(-0.02, 0.048, rz) }));
    }
    // Couplers
    for (var cx of [0.40, -0.34]) {
      g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, 0.05), mK), { position: new THREE.Vector3(cx, 0.10, 0) }));
      g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.035), mC), { position: new THREE.Vector3(cx + (cx > 0 ? 0.02 : -0.02), 0.10, 0) }));
    }
    return g;
  }

  _makeCar(c) {
    var g = new THREE.Group();
    var mB = new THREE.MeshStandardMaterial({ color: c.body, metalness: 0.45, roughness: 0.35 });
    var mA = new THREE.MeshStandardMaterial({ color: c.accent, metalness: 0.35, roughness: 0.4 });
    var mU = new THREE.MeshStandardMaterial({ color: c.under, metalness: 0.6, roughness: 0.45 });
    var mC = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.9, roughness: 0.15 });
    var mK = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.7, roughness: 0.4 });

    // Underframe
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.03, 0.26), mU), { position: new THREE.Vector3(0, 0.09, 0) }));
    // Body
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.18, 0.25), mB), { position: new THREE.Vector3(0, 0.20, 0), castShadow: true }));
    // Roof
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.02, 0.26), mA), { position: new THREE.Vector3(0, 0.31, 0) }));
    // Stripes
    g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.012, 0.26), mA), { position: new THREE.Vector3(0, 0.28, 0) }));
    // Side ribs
    for (var zz = 0; zz < 2; zz++) {
      var z = zz === 0 ? -0.126 : 0.126;
      for (var xi = -2; xi <= 2; xi++) {
        g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.16, 0.003), mA), { position: new THREE.Vector3(xi * 0.10, 0.20, z) }));
      }
    }
    // Windows
    for (var zz = 0; zz < 2; zz++) {
      var z = zz === 0 ? -0.127 : 0.127;
      for (var wi = -2; wi <= 2; wi++) {
        g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.003),
          new THREE.MeshStandardMaterial({ color: 0x88ccff, metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.4 })),
          { position: new THREE.Vector3(wi * 0.10, 0.24, z) }));
      }
    }
    // Wheels
    var wX = [-0.18, 0.18];
    var wZ = [-0.12, 0.12];
    for (var wi = 0; wi < wX.length; wi++) {
      for (var wj = 0; wj < wZ.length; wj++) {
        var w = this._makeWheel(0.042, 0.026);
        w.position.set(wX[wi], 0.042, wZ[wj]);
        g.add(w);
      }
    }
    // Couplers
    for (var cx of [0.30, -0.30]) {
      g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.02, 0.045), mK), { position: new THREE.Vector3(cx, 0.09, 0) }));
      g.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.03), mC), { position: new THREE.Vector3(cx + (cx > 0 ? 0.018 : -0.018), 0.09, 0) }));
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

    this.scene.add(group);

    var train = {
      id: id, group: group, parts: parts, type: type, color: color,
      progress: progressOnTrack || 0,
      targetSpeed: 0.04, currentSpeed: 0,
      running: false, direction: 1,
      name: type.label + ' #' + (id + 1),
      trackIndex: 0, partGap: 0.022
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
    this.scene.remove(train.group);
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
        t.targetSpeed = t.running ? 0.04 : 0;
        if (typeof this.onTrainToggled === 'function') this.onTrainToggled(t);
        return t.running;
      }
    }
    return false;
  }

  startAllTrains() {
    for (var i = 0; i < this.trains.length; i++) {
      this.trains[i].running = true;
      this.trains[i].targetSpeed = 0.04;
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
      part.position.set(point.x, point.y + 0.01, point.z);

      var ahead = new THREE.Vector3().copy(point).add(tangent);
      part.lookAt(ahead);
      part.rotateY(Math.PI / 2);

      // Banking
      var dt = 0.005;
      var t1 = curve.getTangentAt(Math.max(0, t - dt));
      var t2 = curve.getTangentAt(Math.min(1, t + dt));
      var curvX = t2.x - t1.x;
      var bank = curvX * 6;
      if (bank > 0.18) bank = 0.18;
      if (bank < -0.18) bank = -0.18;
      part.rotateZ(bank);
    }
  }

  // ==========================================
  // CAMERA VIEWS
  // ==========================================
  animateToView(view) {
    var views = {
      overview: { x: 0, y: 18, z: 22, lx: 0, ly: 0, lz: 0 },
      mina: { x: -12, y: 5, z: 3, lx: -7, ly: 0, lz: 2.5 },
      porto: { x: 12, y: 5, z: 3, lx: 9, ly: 0, lz: -1 },
      trem: { x: 0, y: 4, z: 8, lx: 0, ly: 0, lz: 0 },
      mine: { x: -12, y: 5, z: 3, lx: -7, ly: 0, lz: 2.5 },
      port: { x: 12, y: 5, z: 3, lx: 9, ly: 0, lz: -1 }
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

    if (this.particles) this.particles.rotation.y = time * 0.01;

    // Trains with smooth acceleration
    for (var i = 0; i < this.trains.length; i++) {
      var train = this.trains[i];
      var rate = train.running ? 1.2 : 2.0;
      train.currentSpeed += (train.targetSpeed - train.currentSpeed) * Math.min(rate * dt, 1);
      if (Math.abs(train.currentSpeed) < 0.0001) train.currentSpeed = 0;
      train.progress += train.currentSpeed * train.direction;
      this._placeTrainOnTrack(train);
    }

    // Switch animation
    this.scene.traverse(function(c) {
      if (c.userData && c.userData.type === 'switch') {
        c.scale.setScalar(1 + Math.sin(time * 2.5 + c.position.x) * 0.03);
      }
      if (c.userData && c.userData.type === 'reversor') {
        c.children.forEach(function(child) {
          if (child.material && child.material.emissive) {
            child.material.emissiveIntensity = 0.3 + Math.sin(time * 3) * 0.3;
          }
        });
      }
    });

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
