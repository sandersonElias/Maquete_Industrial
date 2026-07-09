/* ============================================
   THREE.JS SCENE - MAQUETE INDUSTRIAL 3D
   Layout fiel ao diagrama:
   Esquerda: Central de Química + Mina
   Centro: Ferrorama com trilhos, SW1/SW2/SW3, Reversor
   Direita: Aeroporto Logístico + Porto Logístico
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
      this.scene.background = new THREE.Color(0x0a0a0f);
      this.scene.fog = new THREE.Fog(0x0a0a0f, 30, 80);

      var w = this.container.clientWidth;
      var h = this.container.clientHeight;

      this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      this.camera.position.set(0, 22, 20);

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
      this.controls.maxDistance = 60;

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
  // LIGHTS
  // ==========================================
  setupLights() {
    this.scene.add(new THREE.AmbientLight(0x404060, 0.5));

    var dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(10, 25, 15);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 2048;
    dir.shadow.mapSize.height = 2048;
    dir.shadow.camera.near = 0.5;
    dir.shadow.camera.far = 60;
    dir.shadow.camera.left = -25;
    dir.shadow.camera.right = 25;
    dir.shadow.camera.top = 15;
    dir.shadow.camera.bottom = -15;
    this.scene.add(dir);

    var warm = new THREE.PointLight(0xff8844, 0.6, 50);
    warm.position.set(0, 12, 0);
    this.scene.add(warm);
  }

  // ==========================================
  // CREATE FULL MAQUETTE
  // ==========================================
  createMaquette() {
    this.createBaseTable();
    this.createLeftBlock();    // Central de Química + Mina
    this.createCenterBlock();  // Ferrorama com trilhos
    this.createRightBlock();   // Aeroporto + Porto
    this.createTrackSystem();
    this.createLabels();
  }

  // ==========================================
  // BASE TABLE
  // ==========================================
  createBaseTable() {
    var mat = new THREE.MeshStandardMaterial({ color: 0x0a0a0f, roughness: 0.9, metalness: 0.1 });
    var table = new THREE.Mesh(new THREE.BoxGeometry(32, 0.3, 14), mat);
    table.position.y = -0.15;
    table.receiveShadow = true;
    this.scene.add(table);
  }

  // ==========================================
  // LEFT BLOCK - Central de Química + Mina
  // ==========================================
  createLeftBlock() {
    var panelMat = new THREE.MeshStandardMaterial({ color: 0x2a1a08, roughness: 0.8, metalness: 0.1 });
    var borderMat = new THREE.MeshStandardMaterial({ color: 0xcc6600, roughness: 0.6, metalness: 0.2 });
    var innerMat = new THREE.MeshStandardMaterial({ color: 0x1a1005, roughness: 0.9 });

    // Outer panel
    var panel = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 12), panelMat);
    panel.position.set(-11, 0.1, 0);
    panel.receiveShadow = true;
    this.scene.add(panel);

    // Orange border
    this._addBorder(-11, 0.21, 0, 6, 12, borderMat);

    // Central de Química (top)
    var quimica = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 4), innerMat);
    quimica.position.set(-11, 0.25, -3.5);
    quimica.receiveShadow = true;
    this.scene.add(quimica);
    this._addInnerBorder(-11, 0.32, -3.5, 5, 4, borderMat);

    // Mina (bottom, larger)
    var mina = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 6.5), innerMat);
    mina.position.set(-11, 0.25, 2.5);
    mina.receiveShadow = true;
    this.scene.add(mina);
    this._addInnerBorder(-11, 0.32, 2.5, 5, 6.5, borderMat);
  }

  // ==========================================
  // CENTER BLOCK - Ferrorama
  // ==========================================
  createCenterBlock() {
    var panelMat = new THREE.MeshStandardMaterial({ color: 0x2a1a08, roughness: 0.8, metalness: 0.1 });
    var borderMat = new THREE.MeshStandardMaterial({ color: 0xcc6600, roughness: 0.6, metalness: 0.2 });

    // Main panel
    var panel = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 12), panelMat);
    panel.position.set(0, 0.1, 0);
    panel.receiveShadow = true;
    this.scene.add(panel);

    // Orange border
    this._addBorder(0, 0.21, 0, 14, 12, borderMat);
  }

  // ==========================================
  // RIGHT BLOCK - Aeroporto + Porto
  // ==========================================
  createRightBlock() {
    var panelMat = new THREE.MeshStandardMaterial({ color: 0x2a1a08, roughness: 0.8, metalness: 0.1 });
    var borderMat = new THREE.MeshStandardMaterial({ color: 0xcc6600, roughness: 0.6, metalness: 0.2 });
    var innerMat = new THREE.MeshStandardMaterial({ color: 0x1a1005, roughness: 0.9 });

    // Outer panel
    var panel = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 12), panelMat);
    panel.position.set(11, 0.1, 0);
    panel.receiveShadow = true;
    this.scene.add(panel);

    // Orange border
    this._addBorder(11, 0.21, 0, 6, 12, borderMat);

    // Aeroporto Logístico (top)
    var aero = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 4), innerMat);
    aero.position.set(11, 0.25, -3.5);
    aero.receiveShadow = true;
    this.scene.add(aero);
    this._addInnerBorder(11, 0.32, -3.5, 5, 4, borderMat);

    // Porto Logístico (bottom)
    var porto = new THREE.Mesh(new THREE.BoxGeometry(5, 0.15, 5), innerMat);
    porto.position.set(11, 0.25, 3);
    porto.receiveShadow = true;
    this.scene.add(porto);
    this._addInnerBorder(11, 0.32, 3, 5, 5, borderMat);
  }

  // ==========================================
  // BORDER HELPERS
  // ==========================================
  _addBorder(cx, cy, cz, w, d, mat) {
    var t = 0.15; // border thickness
    var h = 0.25;
    // Front
    this.scene.add(this._makeBox(w + t * 2, h, t, mat, cx, cy, cz + d / 2 + t / 2));
    // Back
    this.scene.add(this._makeBox(w + t * 2, h, t, mat, cx, cy, cz - d / 2 - t / 2));
    // Left
    this.scene.add(this._makeBox(t, h, d + t * 2, mat, cx - w / 2 - t / 2, cy, cz));
    // Right
    this.scene.add(this._makeBox(t, h, d + t * 2, mat, cx + w / 2 + t / 2, cy, cz));
  }

  _addInnerBorder(cx, cy, cz, w, d, mat) {
    var t = 0.1;
    var h = 0.2;
    this.scene.add(this._makeBox(w + t * 2, h, t, mat, cx, cy, cz + d / 2 + t / 2));
    this.scene.add(this._makeBox(w + t * 2, h, t, mat, cx, cy, cz - d / 2 - t / 2));
    this.scene.add(this._makeBox(t, h, d + t * 2, mat, cx - w / 2 - t / 2, cy, cz));
    this.scene.add(this._makeBox(t, h, d + t * 2, mat, cx + w / 2 + t / 2, cy, cz));
  }

  _makeBox(w, h, d, mat, x, y, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    return m;
  }

  // ==========================================
  // TRACK SYSTEM — matches the diagram exactly
  // ==========================================
  createTrackSystem() {
    this.trackCurves = [];
    var trackMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.4 });
    var sleeperMat = new THREE.MeshStandardMaterial({ color: 0x3d3d3d, roughness: 0.8 });

    // === MAIN OVAL CIRCUIT ===
    // The main oval is roughly centered in the middle panel
    var ovalPts = [];
    for (var i = 0; i <= 80; i++) {
      var a = (i / 80) * Math.PI * 2;
      // Slightly squashed oval
      var x = Math.cos(a) * 5.5;
      var z = Math.sin(a) * 3.0;
      ovalPts.push(new THREE.Vector3(x, 0.35, z));
    }
    var ovalCurve = new THREE.CatmullRomCurve3(ovalPts, true);
    this.trackCurves.push({ curve: ovalCurve, name: 'circuito principal' });
    this._renderRail(ovalCurve, trackMat, 200);

    // === UPPER BRANCH (SW1 + Reversor) ===
    // Straight branch above the oval, connected at the top-left
    var upperPts = [
      new THREE.Vector3(-3.5, 0.35, -3.0),   // Connects to oval top-left
      new THREE.Vector3(-2.0, 0.35, -3.8),   // Goes up-left
      new THREE.Vector3(0.0, 0.35, -4.2),    // Straight section (SW1 area)
      new THREE.Vector3(2.0, 0.35, -4.2),    // Reversor area
      new THREE.Vector3(4.0, 0.35, -3.8),    // Curves right
      new THREE.Vector3(5.0, 0.35, -3.0),    // Connects to oval top-right
    ];
    var upperCurve = new THREE.CatmullRomCurve3(upperPts, false);
    this.trackCurves.push({ curve: upperCurve, name: 'ramal superior' });
    this._renderRail(upperCurve, trackMat, 100);

    // === LOWER BRANCH (SW2 + SW3) ===
    // Branch below the oval, connected at bottom
    var lowerPts = [
      new THREE.Vector3(-1.0, 0.35, 2.0),    // Connects to oval bottom-left
      new THREE.Vector3(-0.5, 0.35, 3.0),    // Goes down
      new THREE.Vector3(0.5, 0.35, 3.5),     // SW2 area
      new THREE.Vector3(2.0, 0.35, 3.5),     // SW3 area
      new THREE.Vector3(3.0, 0.35, 2.8),     // Curves back up
      new THREE.Vector3(3.5, 0.35, 2.0),     // Connects to oval bottom-right
    ];
    var lowerCurve = new THREE.CatmullRomCurve3(lowerPts, false);
    this.trackCurves.push({ curve: lowerCurve, name: 'ramal inferior' });
    this._renderRail(lowerCurve, trackMat, 100);

    // === DIAGONAL CONNECTION ===
    var diagPts = [
      new THREE.Vector3(-2.0, 0.35, -2.5),
      new THREE.Vector3(-0.5, 0.35, 0.0),
      new THREE.Vector3(1.5, 0.35, 2.0),
    ];
    var diagCurve = new THREE.CatmullRomCurve3(diagPts, false);
    this.trackCurves.push({ curve: diagCurve, name: 'diagonal' });
    this._renderRail(diagCurve, trackMat, 60);

    // === SWITCHES (SW1, SW2, SW3) ===
    this._createSwitch(-2.0, 0.35, -3.8, 'SW1');
    this._createSwitch(0.5, 0.35, 3.5, 'SW2');
    this._createSwitch(2.0, 0.35, 3.5, 'SW3');

    // === REVERSOR ===
    this._createReversor(2.0, 0.35, -4.2);
  }

  _renderRail(curve, mat, segments) {
    var tube = new THREE.TubeGeometry(curve, segments, 0.06, 8, false);
    var mesh = new THREE.Mesh(tube, mat);
    mesh.castShadow = true;
    this.scene.add(mesh);

    // Second rail (offset)
    var pts = curve.getPoints(segments);
    var pts2 = [];
    for (var i = 0; i < pts.length; i++) {
      pts2.push(new THREE.Vector3(pts[i].x, pts[i].y, pts[i].z + 0.3));
    }
    var curve2 = new THREE.CatmullRomCurve3(pts2, false);
    var tube2 = new THREE.TubeGeometry(curve2, segments, 0.06, 8, false);
    var mesh2 = new THREE.Mesh(tube2, mat);
    mesh2.castShadow = true;
    this.scene.add(mesh2);

    // Sleepers
    for (var i = 0; i < pts.length; i += 4) {
      var p = pts[i];
      var q = pts2[i];
      if (!p || !q) continue;
      var sleeper = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.04, 0.42),
        new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 })
      );
      sleeper.position.set((p.x + q.x) / 2, 0.32, (p.z + q.z) / 2);
      if (i < pts.length - 1) {
        var next = pts[i + 1];
        sleeper.rotation.y = -Math.atan2(next.z - p.z, next.x - p.x);
      }
      this.scene.add(sleeper);
    }
  }

  _createSwitch(x, y, z, label) {
    var g = new THREE.Group();

    // White block
    var block = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.15, 0.35),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    block.position.y = 0.1;
    block.castShadow = true;
    g.add(block);

    // Yellow mechanism
    var mech = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.12, 0.2),
      new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.3, roughness: 0.5 })
    );
    mech.position.y = 0.22;
    g.add(mech);

    // Lever
    var lever = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    lever.position.set(0, 0.38, 0);
    lever.rotation.z = Math.PI / 6;
    g.add(lever);

    g.position.set(x, y, z);
    g.userData = { type: 'switch', label: label };
    this.scene.add(g);

    // Label
    this._addTextSprite(label, x, y + 0.7, z, 0xffffff);
  }

  _createReversor(x, y, z) {
    var g = new THREE.Group();

    // White rectangle
    var block = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.12, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    block.position.y = 0.08;
    block.castShadow = true;
    g.add(block);

    // Green indicator
    var indicator = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.08, 0.15),
      new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00, emissiveIntensity: 0.3 })
    );
    indicator.position.set(-0.35, 0.18, 0);
    g.add(indicator);

    // Red indicator
    var indicator2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.08, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.3 })
    );
    indicator2.position.set(0.35, 0.18, 0);
    g.add(indicator2);

    g.position.set(x, y, z);
    g.userData = { type: 'reversor' };
    this.scene.add(g);

    // Label
    this._addTextSprite('REVERSOR', x, y + 0.6, z, 0xffffff);
  }

  // ==========================================
  // TEXT LABELS (using canvas textures)
  // ==========================================
  createLabels() {
    // Block titles
    this._addTextSprite('Central', -11, 1.2, -3.5, 0xffffff, 1.2);
    this._addTextSprite('de Química', -11, 0.85, -3.5, 0xffffff, 1.0);

    this._addTextSprite('Mina', -11, 0.85, 2.5, 0xffffff, 1.4);

    this._addTextSprite('Ferrorama', 0, 1.5, 0, 0xffffff, 1.6);

    this._addTextSprite('Aeroporto', 11, 1.2, -3.5, 0xffffff, 1.2);
    this._addTextSprite('Logístico', 11, 0.85, -3.5, 0xffffff, 1.0);

    this._addTextSprite('Porto', 11, 1.2, 3, 0xffffff, 1.2);
    this._addTextSprite('Logístico', 11, 0.85, 3, 0xffffff, 1.0);
  }

  _addTextSprite(text, x, y, z, color, scale) {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    var ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 256, 128);
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Handle multi-line text
    var lines = text.split('\n');
    if (lines.length === 1 && text.length > 10) {
      // Auto-split long text
      var mid = Math.ceil(text.length / 2);
      var spaceIdx = text.indexOf(' ', mid);
      if (spaceIdx > 0) {
        lines = [text.substring(0, spaceIdx), text.substring(spaceIdx + 1)];
      }
    }

    var lineHeight = 40;
    var startY = 64 - ((lines.length - 1) * lineHeight) / 2;
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], 128, startY + i * lineHeight);
    }

    var texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    var mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    var sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, z);
    var s = scale || 1.0;
    sprite.scale.set(s * 3, s * 1.5, 1);
    this.scene.add(sprite);
  }

  // ==========================================
  // PARTICLES
  // ==========================================
  createParticles() {
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(600);
    for (var i = 0; i < 600; i++) pos[i] = (Math.random() - 0.5) * 50;
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.particles = new THREE.Points(geo, new THREE.PointsMaterial({
      size: 0.04, color: 0xcc6600, transparent: true, opacity: 0.3
    }));
    this.scene.add(this.particles);
  }

  // ==========================================
  // HOVER INDICATOR
  // ==========================================
  createHoverIndicator() {
    var ring = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.45, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ffb2, transparent: true, opacity: 0, side: THREE.DoubleSide })
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
      var pts = self.trackCurves[0].curve.getPoints(200);
      var best = null, bestD = Infinity;
      for (var i = 0; i < pts.length; i++) {
        var pt = pts[i].clone();
        pt.y = 0.6;
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
      var pts = self.trackCurves[0].curve.getPoints(200);
      var best = null, bestD = Infinity;
      for (var i = 0; i < pts.length; i++) {
        var pt = pts[i].clone();
        pt.y = 0.6;
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

    this.scene.add(group);

    var train = {
      id: id, group: group, parts: parts, type: type, color: color,
      progress: progressOnTrack || 0,
      targetSpeed: 0.03, currentSpeed: 0,
      running: false, direction: 1,
      name: type.label + ' #' + (id + 1),
      trackIndex: 0, partGap: 0.03
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
      part.position.set(point.x, point.y + 0.02, point.z);

      var ahead = new THREE.Vector3().copy(point).add(tangent);
      part.lookAt(ahead);

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
      overview: { x: 0, y: 22, z: 20, lx: 0, ly: 0, lz: 0 },
      mina: { x: -14, y: 6, z: 4, lx: -11, ly: 0, lz: 2.5 },
      porto: { x: 14, y: 6, z: 4, lx: 11, ly: 0, lz: 3 },
      trem: { x: 0, y: 6, z: 10, lx: 0, ly: 0, lz: 0 },
      mine: { x: -14, y: 6, z: 4, lx: -11, ly: 0, lz: 2.5 },
      port: { x: 14, y: 6, z: 4, lx: 11, ly: 0, lz: 3 }
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

    if (this.particles) this.particles.rotation.y = time * 0.02;

    for (var i = 0; i < this.trains.length; i++) {
      var train = this.trains[i];
      var rate = train.running ? 1.5 : 2.5;
      train.currentSpeed += (train.targetSpeed - train.currentSpeed) * Math.min(rate * dt, 1);
      if (Math.abs(train.currentSpeed) < 0.0001) train.currentSpeed = 0;
      train.progress += train.currentSpeed * train.direction;
      this._placeTrainOnTrack(train);
    }

    // Switch animation
    this.scene.traverse(function(c) {
      if (c.userData && c.userData.type === 'switch') {
        c.scale.setScalar(1 + Math.sin(time * 2 + c.position.x) * 0.05);
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
