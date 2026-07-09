/* ============================================
   THREE.JS SCENE - MAQUETE INDUSTRIAL 3D
   Trens XP-500S · Layout SCADA · Visual polido
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

    // XP-500S color schemes (based on real Brazilian models)
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
      this.scene.fog = new THREE.FogExp2(0x080810, 0.012);

      var w = this.container.clientWidth;
      var h = this.container.clientHeight;

      this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 1000);
      this.camera.position.set(0, 20, 22);

      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.1;
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.container.appendChild(this.renderer.domElement);

      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.maxPolarAngle = Math.PI / 2.15;
      this.controls.minDistance = 6;
      this.controls.maxDistance = 55;
      this.controls.target.set(0, 0, 0);

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

  // ==========================================
  // LIGHTS — warm industrial lighting
  // ==========================================
  setupLights() {
    // Soft ambient
    var ambient = new THREE.AmbientLight(0x1a1520, 0.4);
    this.scene.add(ambient);

    // Main key light (warm)
    var key = new THREE.DirectionalLight(0xfff0dd, 1.1);
    key.position.set(8, 20, 12);
    key.castShadow = true;
    key.shadow.mapSize.width = 2048;
    key.shadow.mapSize.height = 2048;
    key.shadow.camera.near = 0.5;
    key.shadow.camera.far = 60;
    key.shadow.camera.left = -20;
    key.shadow.camera.right = 20;
    key.shadow.camera.top = 12;
    key.shadow.camera.bottom = -12;
    key.shadow.bias = -0.0005;
    this.scene.add(key);

    // Fill light (cool blue)
    var fill = new THREE.DirectionalLight(0x8899cc, 0.35);
    fill.position.set(-10, 15, -8);
    this.scene.add(fill);

    // Rim light (orange accent)
    var rim = new THREE.PointLight(0xff8844, 0.5, 40);
    rim.position.set(0, 10, -8);
    this.scene.add(rim);

    // Ground bounce
    var bounce = new THREE.PointLight(0xcc6633, 0.3, 30);
    bounce.position.set(0, -2, 5);
    this.scene.add(bounce);

    // Spot on center panel
    var spot = new THREE.SpotLight(0xffeedd, 0.6, 30, Math.PI / 6, 0.5);
    spot.position.set(0, 15, 0);
    spot.target.position.set(0, 0, 0);
    spot.castShadow = false;
    this.scene.add(spot);
    this.scene.add(spot.target);
  }

  // ==========================================
  // CREATE FULL MAQUETTE
  // ==========================================
  createMaquette() {
    this.createGroundPlane();
    this.createLeftBlock();
    this.createCenterBlock();
    this.createRightBlock();
    this.createTrackSystem();
    this.createLabels();
  }

  // ==========================================
  // GROUND PLANE — subtle dark surface
  // ==========================================
  createGroundPlane() {
    var geo = new THREE.PlaneGeometry(60, 40);
    var mat = new THREE.MeshStandardMaterial({
      color: 0x0c0c14,
      roughness: 0.95,
      metalness: 0.05
    });
    var plane = new THREE.Mesh(geo, mat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.3;
    plane.receiveShadow = true;
    this.scene.add(plane);
  }

  // ==========================================
  // LEFT BLOCK — Central de Química + Mina
  // ==========================================
  createLeftBlock() {
    var panelMat = new THREE.MeshStandardMaterial({ color: 0x1c1008, roughness: 0.85, metalness: 0.05 });
    var borderMat = new THREE.MeshStandardMaterial({ color: 0xcc6600, roughness: 0.5, metalness: 0.15, emissive: 0x331800, emissiveIntensity: 0.15 });
    var innerMat = new THREE.MeshStandardMaterial({ color: 0x0f0a04, roughness: 0.9 });

    // Outer panel
    var panel = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.25, 12.2), panelMat);
    panel.position.set(-11, 0.05, 0);
    panel.receiveShadow = true;
    panel.castShadow = true;
    this.scene.add(panel);

    this._addBorder(-11, 0.18, 0, 6.2, 12.2, 0.2, borderMat);

    // Central de Química
    var q = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.18, 4.2), innerMat);
    q.position.set(-11, 0.22, -3.5);
    q.receiveShadow = true;
    this.scene.add(q);
    this._addBorder(-11, 0.32, -3.5, 5.2, 4.2, 0.12, borderMat);

    // Mina
    var m = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.18, 6.8), innerMat);
    m.position.set(-11, 0.22, 2.5);
    m.receiveShadow = true;
    this.scene.add(m);
    this._addBorder(-11, 0.32, 2.5, 5.2, 6.8, 0.12, borderMat);
  }

  // ==========================================
  // CENTER BLOCK — Ferrorama
  // ==========================================
  createCenterBlock() {
    var panelMat = new THREE.MeshStandardMaterial({ color: 0x1c1008, roughness: 0.85, metalness: 0.05 });
    var borderMat = new THREE.MeshStandardMaterial({ color: 0xcc6600, roughness: 0.5, metalness: 0.15, emissive: 0x331800, emissiveIntensity: 0.15 });

    var panel = new THREE.Mesh(new THREE.BoxGeometry(14.2, 0.25, 12.2), panelMat);
    panel.position.set(0, 0.05, 0);
    panel.receiveShadow = true;
    panel.castShadow = true;
    this.scene.add(panel);

    this._addBorder(0, 0.18, 0, 14.2, 12.2, 0.2, borderMat);
  }

  // ==========================================
  // RIGHT BLOCK — Aeroporto + Porto
  // ==========================================
  createRightBlock() {
    var panelMat = new THREE.MeshStandardMaterial({ color: 0x1c1008, roughness: 0.85, metalness: 0.05 });
    var borderMat = new THREE.MeshStandardMaterial({ color: 0xcc6600, roughness: 0.5, metalness: 0.15, emissive: 0x331800, emissiveIntensity: 0.15 });
    var innerMat = new THREE.MeshStandardMaterial({ color: 0x0f0a04, roughness: 0.9 });

    var panel = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.25, 12.2), panelMat);
    panel.position.set(11, 0.05, 0);
    panel.receiveShadow = true;
    panel.castShadow = true;
    this.scene.add(panel);

    this._addBorder(11, 0.18, 0, 6.2, 12.2, 0.2, borderMat);

    // Aeroporto
    var a = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.18, 4.2), innerMat);
    a.position.set(11, 0.22, -3.5);
    a.receiveShadow = true;
    this.scene.add(a);
    this._addBorder(11, 0.32, -3.5, 5.2, 4.2, 0.12, borderMat);

    // Porto
    var p = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.18, 5.2), innerMat);
    p.position.set(11, 0.22, 3);
    p.receiveShadow = true;
    this.scene.add(p);
    this._addBorder(11, 0.32, 3, 5.2, 5.2, 0.12, borderMat);
  }

  // ==========================================
  // BORDER HELPERS
  // ==========================================
  _addBorder(cx, cy, cz, w, d, h, mat) {
    var t = 0.15;
    // Front
    this._addBox(w + t * 2, h, t, mat, cx, cy, cz + d / 2 + t / 2);
    // Back
    this._addBox(w + t * 2, h, t, mat, cx, cy, cz - d / 2 - t / 2);
    // Left
    this._addBox(t, h, d, mat, cx - w / 2 - t / 2, cy, cz);
    // Right
    this._addBox(t, h, d, mat, cx + w / 2 + t / 2, cy, cz);
  }

  _addBox(w, h, d, mat, x, y, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    this.scene.add(m);
  }

  // ==========================================
  // TRACK SYSTEM
  // ==========================================
  createTrackSystem() {
    this.trackCurves = [];

    var railMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.25 });
    var sleeperMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.85 });

    // === MAIN OVAL ===
    var ovalPts = [];
    for (var i = 0; i <= 80; i++) {
      var a = (i / 80) * Math.PI * 2;
      ovalPts.push(new THREE.Vector3(Math.cos(a) * 5.5, 0.38, Math.sin(a) * 3.0));
    }
    var ovalCurve = new THREE.CatmullRomCurve3(ovalPts, true);
    this.trackCurves.push({ curve: ovalCurve, name: 'circuito principal' });
    this._renderRail(ovalCurve, railMat, sleeperMat, 200);

    // === UPPER BRANCH (SW1 + Reversor) ===
    var upperPts = [
      new THREE.Vector3(-3.5, 0.38, -3.0),
      new THREE.Vector3(-2.0, 0.38, -3.8),
      new THREE.Vector3(0.0, 0.38, -4.2),
      new THREE.Vector3(2.0, 0.38, -4.2),
      new THREE.Vector3(4.0, 0.38, -3.8),
      new THREE.Vector3(5.0, 0.38, -3.0),
    ];
    var upperCurve = new THREE.CatmullRomCurve3(upperPts, false);
    this.trackCurves.push({ curve: upperCurve, name: 'ramal superior' });
    this._renderRail(upperCurve, railMat, sleeperMat, 100);

    // === LOWER BRANCH (SW2 + SW3) ===
    var lowerPts = [
      new THREE.Vector3(-1.0, 0.38, 2.0),
      new THREE.Vector3(-0.5, 0.38, 3.0),
      new THREE.Vector3(0.5, 0.38, 3.5),
      new THREE.Vector3(2.0, 0.38, 3.5),
      new THREE.Vector3(3.0, 0.38, 2.8),
      new THREE.Vector3(3.5, 0.38, 2.0),
    ];
    var lowerCurve = new THREE.CatmullRomCurve3(lowerPts, false);
    this.trackCurves.push({ curve: lowerCurve, name: 'ramal inferior' });
    this._renderRail(lowerCurve, railMat, sleeperMat, 100);

    // === DIAGONAL ===
    var diagPts = [
      new THREE.Vector3(-2.0, 0.38, -2.5),
      new THREE.Vector3(-0.5, 0.38, 0.0),
      new THREE.Vector3(1.5, 0.38, 2.0),
    ];
    var diagCurve = new THREE.CatmullRomCurve3(diagPts, false);
    this.trackCurves.push({ curve: diagCurve, name: 'diagonal' });
    this._renderRail(diagCurve, railMat, sleeperMat, 60);

    // === SWITCHES ===
    this._createSwitch(-2.0, 0.38, -3.8, 'SW1');
    this._createSwitch(0.5, 0.38, 3.5, 'SW2');
    this._createSwitch(2.0, 0.38, 3.5, 'SW3');

    // === REVERSOR ===
    this._createReversor(2.0, 0.38, -4.2);
  }

  _renderRail(curve, railMat, sleeperMat, seg) {
    // Main rail
    var tube = new THREE.TubeGeometry(curve, seg, 0.055, 8, false);
    var mesh = new THREE.Mesh(tube, railMat);
    mesh.castShadow = true;
    this.scene.add(mesh);

    // Second rail (offset 0.30)
    var pts = curve.getPoints(seg);
    var pts2 = [];
    for (var i = 0; i < pts.length; i++) {
      pts2.push(new THREE.Vector3(pts[i].x, pts[i].y, pts[i].z + 0.30));
    }
    var curve2 = new THREE.CatmullRomCurve3(pts2, false);
    var tube2 = new THREE.TubeGeometry(curve2, seg, 0.055, 8, false);
    var mesh2 = new THREE.Mesh(tube2, railMat);
    mesh2.castShadow = true;
    this.scene.add(mesh2);

    // Sleepers
    for (var i = 0; i < pts.length; i += 5) {
      var p = pts[i];
      var q = pts2[i];
      if (!p || !q) continue;
      var s = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.035, 0.40), sleeperMat);
      s.position.set((p.x + q.x) / 2, 0.36, (p.z + q.z) / 2);
      if (i < pts.length - 1) {
        var n = pts[i + 1];
        s.rotation.y = -Math.atan2(n.z - p.z, n.x - p.x);
      }
      this.scene.add(s);
    }
  }

  _createSwitch(x, y, z, label) {
    var g = new THREE.Group();

    // White block base
    var baseMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3, metalness: 0.1 });
    var base = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.12, 0.32), baseMat);
    base.position.y = 0.08;
    base.castShadow = true;
    g.add(base);

    // Yellow mechanism
    var mechMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4, metalness: 0.3, emissive: 0x443300, emissiveIntensity: 0.1 });
    var mech = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.18), mechMat);
    mech.position.y = 0.19;
    g.add(mech);

    // Lever
    var lever = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.22),
      mechMat
    );
    lever.position.set(0, 0.34, 0);
    lever.rotation.z = Math.PI / 6;
    g.add(lever);

    g.position.set(x, y, z);
    g.userData = { type: 'switch', label: label };
    this.scene.add(g);

    this._addTextSprite(label, x, y + 0.65, z, 0xffffff, 0.7);
  }

  _createReversor(x, y, z) {
    var g = new THREE.Group();

    var baseMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3, metalness: 0.1 });
    var block = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.1, 0.28), baseMat);
    block.position.y = 0.07;
    block.castShadow = true;
    g.add(block);

    // Green LED
    var greenMat = new THREE.MeshStandardMaterial({ color: 0x00cc44, emissive: 0x00ff55, emissiveIntensity: 0.5, roughness: 0.2 });
    var green = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), greenMat);
    green.position.set(-0.3, 0.16, 0);
    g.add(green);

    // Red LED
    var redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000, emissive: 0xff2200, emissiveIntensity: 0.5, roughness: 0.2 });
    var red = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), redMat);
    red.position.set(0.3, 0.16, 0);
    g.add(red);

    g.position.set(x, y, z);
    g.userData = { type: 'reversor' };
    this.scene.add(g);

    this._addTextSprite('REVERSOR', x, y + 0.55, z, 0xffffff, 0.65);
  }

  // ==========================================
  // TEXT LABELS — canvas texture sprites
  // ==========================================
  createLabels() {
    this._addTextSprite('Central\nde Química', -11, 0.6, -3.5, 0xffffff, 0.9);
    this._addTextSprite('Mina', -11, 0.55, 2.5, 0xffffff, 1.0);
    this._addTextSprite('Ferrorama\nXP-500S', 0, 0.8, 0, 0xcc6600, 1.1);
    this._addTextSprite('Aeroporto\nLogístico', 11, 0.6, -3.5, 0xffffff, 0.9);
    this._addTextSprite('Porto\nLogístico', 11, 0.6, 3, 0xffffff, 0.9);
  }

  _addTextSprite(text, x, y, z, color, scale) {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 128);
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var lines = text.split('\n');
    var lh = 36;
    var startY = 64 - ((lines.length - 1) * lh) / 2;
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 128, startY + i * lh);
    }

    var texture = new THREE.CanvasTexture(canvas);
    var mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    var sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);
    var s = scale || 1.0;
    sprite.scale.set(s * 3.5, s * 1.75, 1);
    this.scene.add(sprite);
  }

  // ==========================================
  // PARTICLES — warm floating dust
  // ==========================================
  createParticles() {
    var geo = new THREE.BufferGeometry();
    var count = 400;
    var pos = new Float32Array(count * 3);
    for (var i = 0; i < count * 3; i++) {
      pos[i] = (Math.random() - 0.5) * 50;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.particles = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.035, color: 0xffaa66, transparent: true, opacity: 0.25,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    this.scene.add(this.particles);
  }

  // ==========================================
  // HOVER INDICATOR
  // ==========================================
  createHoverIndicator() {
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.42, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ffb2, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.55;
    this.hoverIndicator = ring;
    this.scene.add(ring);

    // Inner glow
    var glow = new THREE.Mesh(
      new THREE.CircleGeometry(0.3, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ffb2, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false })
    );
    glow.rotation.x = -Math.PI / 2;
    glow.position.y = 0.54;
    this.hoverGlow = glow;
    this.scene.add(glow);
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
      var pts = self.trackCurves[0].curve.getPoints(200);
      var best = null, bestD = Infinity;
      for (var i = 0; i < pts.length; i++) {
        var pt = pts[i].clone(); pt.y = 0.55;
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
        self.hoverGlow.material.opacity = 0;
        if (typeof self.onTrainPlaced === 'function') self.onTrainPlaced();
      }
    });

    canvas.addEventListener('mousemove', function(e) {
      if (!self.placementMode) {
        self.hoverIndicator.material.opacity = 0;
        self.hoverGlow.material.opacity = 0;
        return;
      }
      var rect = canvas.getBoundingClientRect();
      self.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      self.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      self.raycaster.setFromCamera(self.mouse, self.camera);
      var pts = self.trackCurves[0].curve.getPoints(200);
      var best = null, bestD = Infinity;
      for (var i = 0; i < pts.length; i++) {
        var pt = pts[i].clone(); pt.y = 0.55;
        var pr = new THREE.Vector3();
        self.raycaster.ray.closestPointToPoint(pt, pr);
        var d = pt.distanceTo(pr);
        if (d < bestD && d < 2.5) { bestD = d; best = pts[i]; }
      }
      if (best) {
        self.hoverIndicator.position.set(best.x, 0.55, best.z);
        self.hoverGlow.position.set(best.x, 0.54, best.z);
        var op = bestD < 1.5 ? 0.8 : 0.3;
        self.hoverIndicator.material.opacity = op;
        self.hoverGlow.material.opacity = op * 0.3;
      } else {
        self.hoverIndicator.material.opacity = 0;
        self.hoverGlow.material.opacity = 0;
      }
    });
  }

  setPlacementMode(active, typeIndex) {
    this.placementMode = active;
    this.selectedTrainType = typeIndex || 0;
    if (!active) {
      this.hoverIndicator.material.opacity = 0;
      this.hoverGlow.material.opacity = 0;
    }
  }

  // ==========================================
  // TRAIN CREATION — XP-500S detailed models
  // ==========================================
  _makeWheel(radius, width) {
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9, roughness: 0.15 });
    var matFlange = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.85, roughness: 0.2 });

    var disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 16), mat);
    disc.rotation.x = Math.PI / 2;
    g.add(disc);

    var flange = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.008, radius + 0.008, width + 0.006, 16), matFlange);
    flange.rotation.x = Math.PI / 2;
    g.add(flange);

    var hub = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.3, radius * 0.3, width + 0.01, 8),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.2 }));
    hub.rotation.x = Math.PI / 2;
    g.add(hub);

    return g;
  }

  _makeLoco(c) {
    var g = new THREE.Group();

    // Materials
    var mBody = new THREE.MeshStandardMaterial({ color: c.body, metalness: 0.55, roughness: 0.3 });
    var mAccent = new THREE.MeshStandardMaterial({ color: c.accent, metalness: 0.4, roughness: 0.35 });
    var mStrip = new THREE.MeshStandardMaterial({ color: c.strip, metalness: 0.3, roughness: 0.5 });
    var mUnder = new THREE.MeshStandardMaterial({ color: c.under, metalness: 0.6, roughness: 0.45 });
    var mChrome = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.95, roughness: 0.1 });
    var mGlass = new THREE.MeshStandardMaterial({ color: 0x88ccff, metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.5 });
    var mHL = new THREE.MeshBasicMaterial({ color: 0xffeeaa });
    var mRed = new THREE.MeshStandardMaterial({ color: 0xcc0000, metalness: 0.3, roughness: 0.4 });
    var mBlack = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.7, roughness: 0.4 });

    // UNDERFRAME
    var frame = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.04, 0.30), mUnder);
    frame.position.y = 0.10; frame.castShadow = true;
    g.add(frame);

    // Frame side rails
    for (var zz = 0; zz < 2; zz++) {
      var zSide = zz === 0 ? -0.14 : 0.14;
      var rail = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.025, 0.015), mUnder);
      rail.position.set(0, 0.12, zSide);
      g.add(rail);
    }

    // Fuel tank (cylindrical)
    var tank = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 12), mBlack);
    tank.rotation.z = Math.PI / 2;
    tank.position.set(0.05, 0.08, 0);
    g.add(tank);

    var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.015, 8), mChrome);
    cap.position.set(0.05, 0.13, 0);
    g.add(cap);

    // Air tanks
    for (var ai = 0; ai < 2; ai++) {
      var ax = ai === 0 ? -0.2 : 0.2;
      var airTank = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8), mBlack);
      airTank.rotation.z = Math.PI / 2;
      airTank.position.set(ax, 0.07, 0);
      g.add(airTank);
    }

    // MAIN BODY
    var lowerBody = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.1, 0.30), mBody);
    lowerBody.position.y = 0.18; lowerBody.castShadow = true;
    g.add(lowerBody);

    var upperBody = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.12, 0.28), mBody);
    upperBody.position.y = 0.29; upperBody.castShadow = true;
    g.add(upperBody);

    // Body side panels
    for (var zz = 0; zz < 2; zz++) {
      var zSide = zz === 0 ? -0.153 : 0.153;
      var panel = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.08, 0.005), mAccent);
      panel.position.set(0.05, 0.24, zSide);
      g.add(panel);
    }

    // Radiator grilles
    for (var zz = 0; zz < 2; zz++) {
      var zSide = zz === 0 ? -0.153 : 0.153;
      for (var si = 0; si < 4; si++) {
        var slat = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.06, 0.008), mBlack);
        slat.position.set(0.28 + si * 0.015, 0.24, zSide);
        g.add(slat);
      }
    }

    // Yellow stripes
    var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.02, 0.31), mStrip);
    stripe.position.y = 0.345;
    g.add(stripe);
    var stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.008, 0.31), mStrip);
    stripe2.position.y = 0.31;
    g.add(stripe2);

    // CAB
    var cabBody = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.14, 0.28), mAccent);
    cabBody.position.set(-0.22, 0.42, 0); cabBody.castShadow = true;
    g.add(cabBody);

    var cabRoof = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.30), mBlack);
    cabRoof.position.set(-0.22, 0.50, 0);
    g.add(cabRoof);

    // Cab windows
    var winFront = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.07, 0.18), mGlass);
    winFront.position.set(-0.35, 0.43, 0);
    g.add(winFront);

    var winBack = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.06, 0.14), mGlass);
    winBack.position.set(-0.09, 0.43, 0);
    g.add(winBack);

    for (var zz = 0; zz < 2; zz++) {
      var zSide = zz === 0 ? -0.141 : 0.141;
      var winSide = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.012), mGlass);
      winSide.position.set(-0.22, 0.44, zSide);
      g.add(winSide);
    }

    // Window frames
    for (var zz = 0; zz < 2; zz++) {
      var zSide = zz === 0 ? -0.142 : 0.142;
      var fh1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.004, 0.003), mChrome);
      fh1.position.set(-0.22, 0.475, zSide);
      g.add(fh1);
      var fh2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.004, 0.003), mChrome);
      fh2.position.set(-0.22, 0.41, zSide);
      g.add(fh2);
    }

    // NOSE
    var nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.10, 0.26), mBody);
    nose.position.set(0.38, 0.24, 0); nose.castShadow = true;
    g.add(nose);

    var noseTop = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.24), mAccent);
    noseTop.position.set(0.36, 0.32, 0);
    g.add(noseTop);

    // Headlights
    for (var zz = 0; zz < 2; zz++) {
      var zSide = zz === 0 ? -0.10 : 0.10;
      var hlHouse = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.02, 0.02, 8), mChrome);
      hlHouse.rotation.z = Math.PI / 2;
      hlHouse.position.set(0.43, 0.26, zSide);
      g.add(hlHouse);
      var hlLens = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), mHL);
      hlLens.position.set(0.44, 0.26, zSide);
      g.add(hlLens);
    }

    var glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffeeaa, transparent: true, opacity: 0.12, depthWrite: false })
    );
    glow.position.set(0.46, 0.26, 0);
    g.add(glow);

    // Ditch lights
    for (var zz = 0; zz < 2; zz++) {
      var zSide = zz === 0 ? -0.12 : 0.12;
      var ditch = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), mHL);
      ditch.position.set(0.42, 0.18, zSide);
      g.add(ditch);
    }

    // Rear lights
    for (var zz = 0; zz < 2; zz++) {
      var zSide = zz === 0 ? -0.10 : 0.10;
      var rear = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), mRed);
      rear.position.set(-0.36, 0.22, zSide);
      g.add(rear);
    }

    // TOP DETAILS
    // Exhaust stacks
    for (var ei = 0; ei < 2; ei++) {
      var ex = ei === 0 ? 0.15 : 0.22;
      var exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.06, 8), mBlack);
      exhaust.position.set(ex, 0.38, 0);
      g.add(exhaust);
      var exhaustRim = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.015, 0.008, 8), mChrome);
      exhaustRim.position.set(ex, 0.415, 0);
      g.add(exhaustRim);
    }

    // Horn
    var hornBase = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.03, 6), mChrome);
    hornBase.position.set(-0.05, 0.40, 0.10);
    hornBase.rotation.z = 0.3;
    g.add(hornBase);
    var hornBell = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.008, 0.025, 8), mChrome);
    hornBell.position.set(-0.05, 0.42, 0.10);
    g.add(hornBell);

    // Sand dome
    var sandDome = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.04, 8), mBody);
    sandDome.position.set(0.08, 0.38, 0);
    g.add(sandDome);

    // Bell
    var bell = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.015, 0.02, 8), mChrome);
    bell.position.set(-0.10, 0.40, -0.10);
    g.add(bell);

    // HANDRAILS
    var handrailMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.15 });
    for (var zz = 0; zz < 2; zz++) {
      var zSide = zz === 0 ? -0.155 : 0.155;
      var hRail = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.004, 0.004), handrailMat);
      hRail.position.set(0.0, 0.36, zSide);
      g.add(hRail);
      for (var sx = -0.28; sx <= 0.35; sx += 0.12) {
        var stanchion = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.04, 0.004), handrailMat);
        stanchion.position.set(sx, 0.34, zSide);
        g.add(stanchion);
      }
    }

    // WHEELS
    var wXArr = [-0.28, -0.02, 0.24];
    var wZArr = [-0.16, 0.16];
    for (var wi = 0; wi < wXArr.length; wi++) {
      for (var wj = 0; wj < wZArr.length; wj++) {
        var wheel = this._makeWheel(0.052, 0.032);
        wheel.position.set(wXArr[wi], 0.052, wZArr[wj]);
        g.add(wheel);
      }
    }

    // Connecting rods
    var rodMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.85, roughness: 0.2 });
    for (var wj = 0; wj < wZArr.length; wj++) {
      var rodZ = wZArr[wj] > 0 ? wZArr[wj] + 0.018 : wZArr[wj] - 0.018;
      var rod = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.012, 0.008), rodMat);
      rod.position.set(-0.02, 0.052, rodZ);
      g.add(rod);
      for (var wi = 0; wi < wXArr.length; wi++) {
        var pinZ = wZArr[wj] > 0 ? wZArr[wj] + 0.025 : wZArr[wj] - 0.025;
        var pin = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.015, 6), rodMat);
        pin.rotation.x = Math.PI / 2;
        pin.position.set(wXArr[wi], 0.052, pinZ);
        g.add(pin);
      }
    }

    // Brake shoes
    for (var wi = 0; wi < wXArr.length; wi++) {
      for (var wj = 0; wj < wZArr.length; wj++) {
        var brakeZ = wZArr[wj] > 0 ? wZArr[wj] - 0.02 : wZArr[wj] + 0.02;
        var brake = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.03, 0.005),
          new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 }));
        brake.position.set(wXArr[wi], 0.04, brakeZ);
        g.add(brake);
      }
    }

    // COUPLERS
    var couplerX = [0.42, -0.36];
    for (var ci = 0; ci < 2; ci++) {
      var cx = couplerX[ci];
      var coupler = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.03, 0.06), mBlack);
      coupler.position.set(cx, 0.10, 0);
      g.add(coupler);
      var couplerKnuckle = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.04), mChrome);
      couplerKnuckle.position.set(cx + (cx > 0 ? 0.025 : -0.025), 0.10, 0);
      g.add(couplerKnuckle);
    }

    // Number plates
    var plate = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.03, 0.001),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
    );
    plate.position.set(0.385, 0.20, 0.151);
    g.add(plate);

    for (var zz = 0; zz < 2; zz++) {
      var zSide = zz === 0 ? -0.152 : 0.152;
      var sidePlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.025, 0.001),
        new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 })
      );
      sidePlate.position.set(-0.15, 0.22, zSide);
      g.add(sidePlate);
    }

    return g;
  }

  _makeCar(c) {
    var g = new THREE.Group();

    var mBody = new THREE.MeshStandardMaterial({ color: c.body, metalness: 0.45, roughness: 0.35 });
    var mAccent = new THREE.MeshStandardMaterial({ color: c.accent, metalness: 0.35, roughness: 0.4 });
    var mUnder = new THREE.MeshStandardMaterial({ color: c.under, metalness: 0.6, roughness: 0.45 });
    var mChrome = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.9, roughness: 0.15 });
    var mBlack = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.7, roughness: 0.4 });

    // UNDERFRAME
    var frame = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.28), mUnder);
    frame.position.y = 0.09; frame.castShadow = true;
    g.add(frame);

    // Cross members
    for (var xi = -2; xi <= 2; xi++) {
      var cross = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.02, 0.26), mUnder);
      cross.position.set(xi * 0.11, 0.10, 0);
      g.add(cross);
    }

    // Brake cylinder
    var brakeCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.08, 8), mBlack);
    brakeCyl.rotation.z = Math.PI / 2;
    brakeCyl.position.set(0, 0.08, 0);
    g.add(brakeCyl);

    // BODY
    var lower = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.10, 0.27), mBody);
    lower.position.y = 0.17; lower.castShadow = true;
    g.add(lower);

    var upper = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.10, 0.26), mBody);
    upper.position.y = 0.27; upper.castShadow = true;
    g.add(upper);

    // Side ribs
    for (var zz = 0; zz < 2; zz++) {
      var zSide = zz === 0 ? -0.136 : 0.136;
      for (var xi = -3; xi <= 3; xi++) {
        var rib = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.18, 0.004), mAccent);
        rib.position.set(xi * 0.08, 0.22, zSide);
        g.add(rib);
      }
    }

    // Side stripes
    var stripe = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.015, 0.28), mAccent);
    stripe.position.y = 0.30;
    g.add(stripe);
    var stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.008, 0.28), mAccent);
    stripe2.position.y = 0.16;
    g.add(stripe2);

    // ROOF
    var roof = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.025, 0.28), mAccent);
    roof.position.y = 0.34;
    g.add(roof);

    // Roof vents
    for (var vi = -1; vi <= 1; vi++) {
      var vx = vi * 0.15;
      var vent = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, 0.12), mBlack);
      vent.position.set(vx, 0.36, 0);
      g.add(vent);
      for (var si = 0; si < 3; si++) {
        var slat = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.003, 0.002), mChrome);
        slat.position.set(vx, 0.37, -0.03 + si * 0.03);
        g.add(slat);
      }
    }

    // ENDS
    var endX = [0.29, -0.29];
    for (var ei = 0; ei < 2; ei++) {
      var ex = endX[ei];
      var end = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.20, 0.26), mBody);
      end.position.set(ex, 0.22, 0);
      g.add(end);

      var endWin = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.05, 0.10),
        new THREE.MeshStandardMaterial({ color: 0x88ccff, metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.4 }));
      endWin.position.set(ex > 0 ? ex + 0.005 : ex - 0.005, 0.26, 0);
      g.add(endWin);
    }

    // DOORS
    for (var zz = 0; zz < 2; zz++) {
      var zSide = zz === 0 ? -0.137 : 0.137;
      var zSign = zz === 0 ? -1 : 1;
      var doorX = [-0.18, 0.18];
      for (var di = 0; di < 2; di++) {
        var door = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.003), mAccent);
        door.position.set(doorX[di], 0.22, zSide);
        g.add(door);
        var handle = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.004, 0.003), mChrome);
        handle.position.set(doorX[di] + 0.02, 0.22, zSide + zSign * 0.002);
        g.add(handle);
      }
    }

    // WHEELS
    var wXArr = [-0.20, 0.20];
    var wZArr = [-0.14, 0.14];
    for (var wi = 0; wi < wXArr.length; wi++) {
      for (var wj = 0; wj < wZArr.length; wj++) {
        var wheel = this._makeWheel(0.045, 0.028);
        wheel.position.set(wXArr[wi], 0.045, wZArr[wj]);
        g.add(wheel);
      }
    }

    // Connecting rod
    var rodMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.85, roughness: 0.2 });
    for (var wj = 0; wj < wZArr.length; wj++) {
      var rodZ = wZArr[wj] > 0 ? wZArr[wj] + 0.016 : wZArr[wj] - 0.016;
      var rod = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.010, 0.006), rodMat);
      rod.position.set(0, 0.045, rodZ);
      g.add(rod);
    }

    // Brake shoes
    for (var wi = 0; wi < wXArr.length; wi++) {
      for (var wj = 0; wj < wZArr.length; wj++) {
        var bZ = wZArr[wj] > 0 ? wZArr[wj] - 0.018 : wZArr[wj] + 0.018;
        var brake = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.025, 0.004),
          new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 }));
        brake.position.set(wXArr[wi], 0.035, bZ);
        g.add(brake);
      }
    }

    // COUPLERS
    var couplerX = [0.32, -0.32];
    for (var ci = 0; ci < 2; ci++) {
      var cx = couplerX[ci];
      var coupler = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, 0.05), mBlack);
      coupler.position.set(cx, 0.09, 0);
      g.add(coupler);
      var knuckle = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.015, 0.035), mChrome);
      knuckle.position.set(cx + (cx > 0 ? 0.02 : -0.02), 0.09, 0);
      g.add(knuckle);
    }

    // Air hoses
    for (var hi = 0; hi < 2; hi++) {
      var hx = hi === 0 ? 0.33 : -0.33;
      for (var hz = 0; hz < 2; hz++) {
        var hzz = hz === 0 ? -0.04 : 0.04;
        var hose = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.03, 4), mBlack);
        hose.position.set(hx, 0.07, hzz);
        g.add(hose);
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

    this.scene.add(group);

    var train = {
      id: id, group: group, parts: parts, type: type, color: color,
      progress: progressOnTrack || 0,
      targetSpeed: 0.03, currentSpeed: 0,
      running: false, direction: 1,
      name: type.label + ' #' + (id + 1),
      trackIndex: 0, partGap: 0.028
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
      part.position.set(point.x, point.y + 0.01, point.z);

      var ahead = new THREE.Vector3().copy(point).add(tangent);
      part.lookAt(ahead);

      // Banking
      var dt = 0.005;
      var t1 = curve.getTangentAt(Math.max(0, t - dt));
      var t2 = curve.getTangentAt(Math.min(1, t + dt));
      var curvX = t2.x - t1.x;
      var bank = curvX * 8;
      if (bank > 0.2) bank = 0.2;
      if (bank < -0.2) bank = -0.2;
      part.rotateZ(bank);
    }
  }

  // ==========================================
  // CAMERA VIEWS
  // ==========================================
  animateToView(view) {
    var views = {
      overview: { x: 0, y: 20, z: 22, lx: 0, ly: 0, lz: 0 },
      mina: { x: -14, y: 5, z: 4, lx: -11, ly: 0, lz: 2.5 },
      porto: { x: 14, y: 5, z: 4, lx: 11, ly: 0, lz: 3 },
      trem: { x: 0, y: 5, z: 10, lx: 0, ly: 0, lz: 0 },
      mine: { x: -14, y: 5, z: 4, lx: -11, ly: 0, lz: 2.5 },
      port: { x: 14, y: 5, z: 4, lx: 11, ly: 0, lz: 3 }
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

    // Particles float
    if (this.particles) {
      this.particles.rotation.y = time * 0.015;
      var pos = this.particles.geometry.attributes.position;
      for (var i = 0; i < pos.count; i++) {
        pos.array[i * 3 + 1] += Math.sin(time + i) * 0.001;
      }
      pos.needsUpdate = true;
    }

    // Trains
    for (var i = 0; i < this.trains.length; i++) {
      var train = this.trains[i];
      var rate = train.running ? 1.5 : 2.5;
      train.currentSpeed += (train.targetSpeed - train.currentSpeed) * Math.min(rate * dt, 1);
      if (Math.abs(train.currentSpeed) < 0.0001) train.currentSpeed = 0;
      train.progress += train.currentSpeed * train.direction;
      this._placeTrainOnTrack(train);
    }

    // Switches pulse
    this.scene.traverse(function(c) {
      if (c.userData && c.userData.type === 'switch') {
        c.scale.setScalar(1 + Math.sin(time * 2.5 + c.position.x * 2) * 0.04);
      }
      if (c.userData && c.userData.type === 'reversor') {
        // LED blink
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
