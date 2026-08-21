/* ============================================
   THREE.JS SCENE - MAQUETE FERRORAMA XP-500S
   Baseado nas fotos reais da maquete física
   ============================================ */

class MaquetteScene {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

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

    this.reversor = null;
    this.reversorRed = null;
    this.reversorGreen = null;
    this.reversorState = 'green';

    this.switches = [];
    this.switchStates = {};

    this.init();
  }

  init() {
    try {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x06060c);
      this.scene.fog = new THREE.FogExp2(0x06060c, 0.005);

      var w = this.container.clientWidth || this.container.offsetWidth || 800;
      var h = this.container.clientHeight || this.container.offsetHeight || 600;

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
      this.setupReversorClick();
      this.setupSwitchClick();
      this.setupCursorHandler();

      this.container.classList.add('loaded');
      window.addEventListener('resize', this.onResize.bind(this));
      this.animate();
    } catch (e) {
      console.error('MaquetteScene init error:', e);
    }
  }

  setupLights() {
    // Ambient - warm industrial feel with pink tint
    this.scene.add(new THREE.AmbientLight(0x1a1410, 0.6));

    // Key light - main directional
    var key = new THREE.DirectionalLight(0xfff5e6, 1.4);
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

    // Fill light - cooler tone
    var fill = new THREE.DirectionalLight(0x8899bb, 0.35);
    fill.position.set(-8, 12, -6);
    this.scene.add(fill);

    // Rim light - accent
    var rim = new THREE.PointLight(0xff8844, 0.5, 40);
    rim.position.set(0, 8, -10);
    this.scene.add(rim);

    // Pink accent light (matching SVG #FFB7B7)
    var pinkLight = new THREE.PointLight(0xFFB7B7, 0.3, 30);
    pinkLight.position.set(0, 10, 0);
    this.scene.add(pinkLight);

    // Bottom fill - subtle
    var bottom = new THREE.DirectionalLight(0x332211, 0.15);
    bottom.position.set(0, -5, 0);
    this.scene.add(bottom);
  }

  createMaquette() {
    this.createBase();
    this.createGround();
    this.createTrackSystem();
    this.createViaduct();
    this.createTurntables();
    this.createSwitches();
    this.createReversor();
    this.createElectronics();
    this.createStructures();
    this.createWater();
  }

  // ==========================================
  // BASE — MDF board matching SVG proportions (2.33:1)
  // ==========================================
  createBase() {
    // SVG proportions: 441x189 = 2.33:1 ratio
    var baseWidth = 23.3;  // 23.3 units wide
    var baseDepth = 10.0;  // 10 units deep
    
    var mdfMat = new THREE.MeshStandardMaterial({ color: 0xc49464, roughness: 0.9, metalness: 0.02 });
    var base = new THREE.Mesh(new THREE.BoxGeometry(baseWidth, 0.4, baseDepth), mdfMat);
    base.position.y = -0.2;
    base.receiveShadow = true;
    base.castShadow = true;
    this.scene.add(base);

    // Edge strips (as shown in SVG with defined segments)
    var edgeMat = new THREE.MeshStandardMaterial({ color: 0xa07848, roughness: 0.85 });
    
    // Pink accent edge strips (matching SVG #FFB7B7 color)
    var pinkEdgeMat = new THREE.MeshStandardMaterial({ 
      color: 0xFFB7B7, 
      roughness: 0.7, 
      metalness: 0.1,
      emissive: 0xFFB7B7,
      emissiveIntensity: 0.1
    });
    
    // Long sides with pink accent
    [[-5, 0.05, 0], [5, 0.05, 0]].forEach(function(p) {
      var e = new THREE.Mesh(new THREE.BoxGeometry(baseWidth, 0.1, 0.12), pinkEdgeMat);
      e.position.set(p[0], p[1], p[2]);
      this.scene.add(e);
    }.bind(this));
    
    // Short sides with pink accent
    [[-11.65, 0.05, 0], [11.65, 0.05, 0]].forEach(function(p) {
      var e = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, baseDepth), pinkEdgeMat);
      e.position.set(p[0], p[1], p[2]);
      this.scene.add(e);
    }.bind(this));
    
    // Add decorative pink dots along edges (matching SVG pattern)
    var dotMat = new THREE.MeshStandardMaterial({ 
      color: 0xFFB7B7, 
      roughness: 0.5, 
      metalness: 0.2,
      emissive: 0xFFB7B7,
      emissiveIntensity: 0.2
    });
    
    for (var i = 0; i < 20; i++) {
      var x = -11 + i * 1.165;
      var dot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.02, 8), dotMat);
      dot.position.set(x, 0.12, -5.06);
      this.scene.add(dot);
      
      var dot2 = dot.clone();
      dot2.position.z = 5.06;
      this.scene.add(dot2);
    }
  }

  // ==========================================
  // GROUND — Grass and terrain around the base
  // ==========================================
  createGround() {
    // Larger grass ground plane for rectangular layout
    var grassMat = new THREE.MeshStandardMaterial({
      color: 0x2d5a1e,
      roughness: 0.95,
      metalness: 0.0
    });
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 35), grassMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Dirt patches near the base (as shown in SVG)
    var dirtMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.95 });
    for (var i = 0; i < 12; i++) {
      var patch = new THREE.Mesh(
        new THREE.CircleGeometry(0.3 + Math.random() * 0.5, 16),
        dirtMat
      );
      patch.rotation.x = -Math.PI / 2;
      patch.position.set(
        (Math.random() - 0.5) * 20,
        -0.24,
        (Math.random() - 0.5) * 11
      );
      this.scene.add(patch);
    }
    
    // Pink accent areas (matching SVG #FFB7B7)
    var pinkMat = new THREE.MeshStandardMaterial({ 
      color: 0xFFB7B7, 
      roughness: 0.9, 
      metalness: 0.0,
      transparent: true,
      opacity: 0.3
    });
    
    // Add subtle pink ground patches
    for (var i = 0; i < 6; i++) {
      var pinkPatch = new THREE.Mesh(
        new THREE.CircleGeometry(0.4 + Math.random() * 0.3, 16),
        pinkMat
      );
      pinkPatch.rotation.x = -Math.PI / 2;
      pinkPatch.position.set(
        (Math.random() - 0.5) * 18,
        -0.23,
        (Math.random() - 0.5) * 9
      );
      this.scene.add(pinkPatch);
    }
  }

  // ==========================================
  // STRUCTURES — buildings and vegetation
  // Positioned to match SVG rectangular layout
  // ==========================================
  createStructures() {
    var self = this;

    // Buildings positioned according to rectangular layout
    var buildings = [
      // Industrial buildings along the outer loop
      { x: -9.0, z: -2.0, w: 1.2, h: 0.6, d: 0.7, color: 0x4a4a4a },  // Left industrial
      { x: -9.0, z: 2.0, w: 0.9, h: 0.5, d: 0.6, color: 0x5a5a5a },   // Left warehouse
      { x: 9.0, z: -2.0, w: 1.0, h: 0.55, d: 0.65, color: 0x4a4a4a }, // Right industrial
      { x: 9.0, z: 2.0, w: 0.85, h: 0.45, d: 0.55, color: 0x5a5a5a }, // Right warehouse
      // Control buildings near center
      { x: -2.5, z: 0.0, w: 0.6, h: 0.4, d: 0.5, color: 0x3a3a3a },   // Control center
      { x: 2.5, z: 0.0, w: 0.5, h: 0.35, d: 0.45, color: 0x4a4a4a },  // Signal box
      // Additional buildings from SVG
      { x: -6.0, z: -3.5, w: 0.8, h: 0.45, d: 0.5, color: 0x4a4a4a }, // Top-left building
      { x: 6.0, z: -3.5, w: 0.7, h: 0.4, d: 0.45, color: 0x5a5a5a },  // Top-right building
      { x: -6.0, z: 3.5, w: 0.75, h: 0.42, d: 0.48, color: 0x4a4a4a }, // Bottom-left building
      { x: 6.0, z: 3.5, w: 0.8, h: 0.44, d: 0.5, color: 0x5a5a5a },   // Bottom-right building
    ];

    buildings.forEach(function(b) {
      var mat = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.8 });
      var body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat);
      body.position.set(b.x, 0.45 + b.h / 2, b.z);
      body.castShadow = true;
      body.receiveShadow = true;
      self.scene.add(body);

      // Roof
      var roofMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
      var roof = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.06, 0.05, b.d + 0.06), roofMat);
      roof.position.set(b.x, 0.45 + b.h + 0.025, b.z);
      roof.castShadow = true;
      self.scene.add(roof);

      // Windows (as shown in SVG with regular spacing)
      var windowMat = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        metalness: 0.8,
        roughness: 0.1,
        transparent: true,
        opacity: 0.4
      });
      for (var zz = 0; zz < 2; zz++) {
        var z = zz === 0 ? -b.d / 2 - 0.01 : b.d / 2 + 0.01;
        var win = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.08), windowMat);
        win.position.set(b.x, 0.45 + b.h * 0.6, z);
        win.rotation.y = zz === 0 ? 0 : Math.PI;
        self.scene.add(win);
      }
      
      // Pink accent on buildings (matching SVG #FFB7B7)
      var pinkMat = new THREE.MeshStandardMaterial({ 
        color: 0xFFB7B7, 
        roughness: 0.6, 
        metalness: 0.1,
        emissive: 0xFFB7B7,
        emissiveIntensity: 0.1
      });
      var pinkStrip = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.02, 0.02, b.d + 0.02), pinkMat);
      pinkStrip.position.set(b.x, 0.45 + b.h + 0.06, b.z);
      self.scene.add(pinkStrip);
    });

    // Trees positioned around the rectangular layout
    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.9 });
    var leavesMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.85 });
    var leavesMat2 = new THREE.MeshStandardMaterial({ color: 0x1B5E20, roughness: 0.85 });

    // Trees along the edges and corners
    var treePositions = [
      // Outer corners
      { x: -9.5, z: -4.5 },
      { x: 9.5, z: -4.5 },
      { x: -9.5, z: 4.5 },
      { x: 9.5, z: 4.5 },
      // Along top edge
      { x: -4.0, z: -4.7 },
      { x: 0.0, z: -4.7 },
      { x: 4.0, z: -4.7 },
      // Along bottom edge
      { x: -4.0, z: 4.7 },
      { x: 0.0, z: 4.7 },
      { x: 4.0, z: 4.7 },
      // Inner area trees
      { x: -1.5, z: -1.0 },
      { x: 1.5, z: 1.0 },
      // Additional trees from SVG
      { x: -7.0, z: -3.0 },
      { x: 7.0, z: -3.0 },
      { x: -7.0, z: 3.0 },
      { x: 7.0, z: 3.0 },
    ];

    treePositions.forEach(function(pos, idx) {
      var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.35, 6), trunkMat);
      trunk.position.set(pos.x, 0.45, pos.z);
      trunk.castShadow = true;
      self.scene.add(trunk);

      var leaves = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 6),
        idx % 2 === 0 ? leavesMat : leavesMat2
      );
      leaves.position.set(pos.x, 0.7, pos.z);
      leaves.scale.set(1, 0.8, 1);
      leaves.castShadow = true;
      self.scene.add(leaves);
    });
    
    // Pink accent trees (matching SVG #FFB7B7)
    var pinkTreeMat = new THREE.MeshStandardMaterial({ 
      color: 0xFFB7B7, 
      roughness: 0.7, 
      metalness: 0.1,
      emissive: 0xFFB7B7,
      emissiveIntensity: 0.15
    });
    
    var pinkTreePositions = [
      { x: -5.0, z: -4.5 },
      { x: 5.0, z: -4.5 },
      { x: -5.0, z: 4.5 },
      { x: 5.0, z: 4.5 },
    ];
    
    pinkTreePositions.forEach(function(pos) {
      var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.3, 6), trunkMat);
      trunk.position.set(pos.x, 0.45, pos.z);
      trunk.castShadow = true;
      self.scene.add(trunk);
      
      var leaves = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 8, 6),
        pinkTreeMat
      );
      leaves.position.set(pos.x, 0.65, pos.z);
      leaves.scale.set(1, 0.8, 1);
      leaves.castShadow = true;
      self.scene.add(leaves);
    });
  }

  // ==========================================
  // WATER — port area (as shown in SVG)
  // ==========================================
  createWater() {
    // Water area positioned according to rectangular layout
    var waterMat = new THREE.MeshStandardMaterial({
      color: 0x1a5276,
      metalness: 0.3,
      roughness: 0.2,
      transparent: true,
      opacity: 0.7
    });
    var water = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.5), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(8.5, -0.22, -2.0);
    this.scene.add(water);

    // Dock/pier (as shown in SVG with defined segments)
    var dockMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41, roughness: 0.85 });
    var dock = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.07, 0.3), dockMat);
    dock.position.set(8.5, 0.45, -0.7);
    dock.castShadow = true;
    this.scene.add(dock);
    
    // Additional dock section
    var dock2 = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.25), dockMat);
    dock2.position.set(8.5, 0.45, -2.8);
    dock2.castShadow = true;
    this.scene.add(dock2);

    // Simple ship (as shown in SVG)
    var shipMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.6, metalness: 0.3 });
    var shipBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.4), shipMat);
    shipBody.position.set(8.5, -0.12, -2.0);
    this.scene.add(shipBody);

    var cabinMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.7 });
    var cabin = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.35), cabinMat);
    cabin.position.set(8.5, 0.04, -2.0);
    this.scene.add(cabin);
    
    // Pink accent on ship (matching SVG #FFB7B7)
    var pinkMat = new THREE.MeshStandardMaterial({ 
      color: 0xFFB7B7, 
      roughness: 0.5, 
      metalness: 0.2,
      emissive: 0xFFB7B7,
      emissiveIntensity: 0.15
    });
    var pinkStrip = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.015, 0.42), pinkMat);
    pinkStrip.position.set(8.5, -0.05, -2.0);
    this.scene.add(pinkStrip);
    
    // Water pink accents
    var waterPinkMat = new THREE.MeshStandardMaterial({ 
      color: 0xFFB7B7, 
      roughness: 0.3, 
      metalness: 0.1,
      transparent: true,
      opacity: 0.2
    });
    
    for (var i = 0; i < 5; i++) {
      var wave = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.05), waterPinkMat);
      wave.rotation.x = -Math.PI / 2;
      wave.position.set(8.5 + (Math.random() - 0.5) * 3, -0.21, -2.0 + (Math.random() - 0.5) * 2);
      this.scene.add(wave);
    }
  }

  // ==========================================
  // TURNTABLES — circular platforms for turning locomotives
  // Positioned to match SVG rectangular layout
  // ==========================================
  createTurntables() {
    // Turntable positions based on rectangular SVG layout
    // Positioned at key junction points
    var turntablePositions = [
      { x: -6.0, z: -3.5, radius: 0.5, label: 'TG1' },   // Top-left junction
      { x: -2.0, z: 3.5, radius: 0.45, label: 'TG2' },   // Bottom-left junction
      { x: 2.0, z: -3.5, radius: 0.45, label: 'TG3' },   // Top-right junction
      { x: 6.0, z: 3.5, radius: 0.4, label: 'TG4' },     // Bottom-right junction
      { x: 0.0, z: 0.0, radius: 0.6, label: 'TG5' },     // Center (main turntable)
    ];

    for (var i = 0; i < turntablePositions.length; i++) {
      var pos = turntablePositions[i];
      var g = new THREE.Group();

      // Pit (sunken area)
      var pitMat = new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        roughness: 0.9,
        metalness: 0.1
      });
      var pit = new THREE.Mesh(
        new THREE.CylinderGeometry(pos.radius + 0.08, pos.radius + 0.08, 0.04, 32),
        pitMat
      );
      pit.position.y = 0.43;
      pit.receiveShadow = true;
      g.add(pit);

      // Platform (rotating disc)
      var platformMat = new THREE.MeshStandardMaterial({
        color: 0x8B7355,
        roughness: 0.7,
        metalness: 0.2
      });
      var platform = new THREE.Mesh(
        new THREE.CylinderGeometry(pos.radius, pos.radius, 0.035, 32),
        platformMat
      );
      platform.position.y = 0.47;
      platform.castShadow = true;
      platform.receiveShadow = true;
      g.add(platform);

      // Center pivot
      var pivotMat = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.5,
        metalness: 0.6
      });
      var pivot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.035, 0.05, 12),
        pivotMat
      );
      pivot.position.y = 0.5;
      g.add(pivot);

      // Track segment on platform
      var trackMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.4,
        metalness: 0.7
      });
      var track = new THREE.Mesh(
        new THREE.BoxGeometry(pos.radius * 2, 0.018, 0.07),
        trackMat
      );
      track.position.y = 0.5;
      g.add(track);

      // Rails on track
      var railMat = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 0.3,
        metalness: 0.8
      });
      for (var side = -1; side <= 1; side += 2) {
        var rail = new THREE.Mesh(
          new THREE.BoxGeometry(pos.radius * 2, 0.012, 0.012),
          railMat
        );
        rail.position.set(0, 0.51, side * 0.025);
        g.add(rail);
      }

      // Edge ring (as shown in SVG)
      var edgeMat = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.6,
        metalness: 0.4
      });
      var edge = new THREE.Mesh(
        new THREE.TorusGeometry(pos.radius + 0.04, 0.012, 8, 32),
        edgeMat
      );
      edge.rotation.x = Math.PI / 2;
      edge.position.y = 0.48;
      g.add(edge);
      
      // Pink accent on turntable (matching SVG #FFB7B7)
      var pinkMat = new THREE.MeshStandardMaterial({ 
        color: 0xFFB7B7, 
        roughness: 0.5, 
        metalness: 0.2,
        emissive: 0xFFB7B7,
        emissiveIntensity: 0.15
      });
      var pinkRing = new THREE.Mesh(
        new THREE.TorusGeometry(pos.radius + 0.06, 0.008, 8, 32),
        pinkMat
      );
      pinkRing.rotation.x = Math.PI / 2;
      pinkRing.position.y = 0.49;
      g.add(pinkRing);

      g.position.set(pos.x, 0, pos.z);
      g.userData = { type: 'turntable', label: pos.label };
      this.scene.add(g);
    }
  }

  // ==========================================
  // TRACK SYSTEM — faithful to SVG reference
  // Rectangular layout with defined segments
  // ==========================================
  createTrackSystem() {
    this.trackCurves = [];
    var railMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.35 });
    var sleeperMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85 });

    // === MAIN RECTANGULAR CIRCUIT (faithful to SVG) ===
    // SVG shows rectangular segments with regular spacing
    // Layout: rectangle with rounded corners, matching SVG proportions
    var trackWidth = 10.0;   // Half-width of rectangle (increased for 2.33:1 ratio)
    var trackHeight = 4.3;   // Half-height of rectangle
    var cornerRadius = 2.0;  // Rounded corners
    
    var pts = [];
    var segsPerSide = 30;
    var cornerSegs = 20;

    // Top side (left to right)
    for (var i = 0; i <= segsPerSide; i++) {
      var t = i / segsPerSide;
      pts.push(new THREE.Vector3(
        -trackWidth + cornerRadius + t * (2 * trackWidth - 2 * cornerRadius),
        0.45,
        -trackHeight
      ));
    }

    // Top-right corner
    for (var i = 1; i <= cornerSegs; i++) {
      var angle = -Math.PI / 2 + (i / cornerSegs) * (Math.PI / 2);
      pts.push(new THREE.Vector3(
        trackWidth - cornerRadius + Math.cos(angle) * cornerRadius,
        0.45,
        -trackHeight + cornerRadius + Math.sin(angle) * cornerRadius
      ));
    }

    // Right side (top to bottom)
    for (var i = 1; i <= segsPerSide; i++) {
      var t = i / segsPerSide;
      pts.push(new THREE.Vector3(
        trackWidth,
        0.45,
        -trackHeight + cornerRadius + t * (2 * trackHeight - 2 * cornerRadius)
      ));
    }

    // Bottom-right corner
    for (var i = 1; i <= cornerSegs; i++) {
      var angle = 0 + (i / cornerSegs) * (Math.PI / 2);
      pts.push(new THREE.Vector3(
        trackWidth - cornerRadius + Math.cos(angle) * cornerRadius,
        0.45,
        trackHeight - cornerRadius + Math.sin(angle) * cornerRadius
      ));
    }

    // Bottom side (right to left)
    for (var i = 1; i <= segsPerSide; i++) {
      var t = i / segsPerSide;
      pts.push(new THREE.Vector3(
        trackWidth - cornerRadius - t * (2 * trackWidth - 2 * cornerRadius),
        0.45,
        trackHeight
      ));
    }

    // Bottom-left corner
    for (var i = 1; i <= cornerSegs; i++) {
      var angle = Math.PI / 2 + (i / cornerSegs) * (Math.PI / 2);
      pts.push(new THREE.Vector3(
        -trackWidth + cornerRadius + Math.cos(angle) * cornerRadius,
        0.45,
        trackHeight - cornerRadius + Math.sin(angle) * cornerRadius
      ));
    }

    // Left side (bottom to top)
    for (var i = 1; i <= segsPerSide; i++) {
      var t = i / segsPerSide;
      pts.push(new THREE.Vector3(
        -trackWidth,
        0.45,
        trackHeight - cornerRadius - t * (2 * trackHeight - 2 * cornerRadius)
      ));
    }

    // Top-left corner
    for (var i = 1; i <= cornerSegs; i++) {
      var angle = Math.PI + (i / cornerSegs) * (Math.PI / 2);
      pts.push(new THREE.Vector3(
        -trackWidth + cornerRadius + Math.cos(angle) * cornerRadius,
        0.45,
        -trackHeight + cornerRadius + Math.sin(angle) * cornerRadius
      ));
    }

    var mainCurve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.0);
    this.trackCurves.push({ curve: mainCurve, name: 'circuito principal', elevation: 0 });
    this._renderRail(mainCurve, railMat, sleeperMat, pts.length * 2, 0.45);

    // === INNER LOOP (as shown in SVG) ===
    var innerWidth = 4.5;
    var innerHeight = 2.0;
    var innerRadius = 1.0;
    var innerPts = [];

    // Inner top side
    for (var i = 0; i <= 15; i++) {
      var t = i / 15;
      innerPts.push(new THREE.Vector3(
        -innerWidth + innerRadius + t * (2 * innerWidth - 2 * innerRadius),
        0.45,
        -innerHeight
      ));
    }

    // Inner top-right corner
    for (var i = 1; i <= 10; i++) {
      var angle = -Math.PI / 2 + (i / 10) * (Math.PI / 2);
      innerPts.push(new THREE.Vector3(
        innerWidth - innerRadius + Math.cos(angle) * innerRadius,
        0.45,
        -innerHeight + innerRadius + Math.sin(angle) * innerRadius
      ));
    }

    // Inner right side
    for (var i = 1; i <= 15; i++) {
      var t = i / 15;
      innerPts.push(new THREE.Vector3(
        innerWidth,
        0.45,
        -innerHeight + innerRadius + t * (2 * innerHeight - 2 * innerRadius)
      ));
    }

    // Inner bottom-right corner
    for (var i = 1; i <= 10; i++) {
      var angle = 0 + (i / 10) * (Math.PI / 2);
      innerPts.push(new THREE.Vector3(
        innerWidth - innerRadius + Math.cos(angle) * innerRadius,
        0.45,
        innerHeight - innerRadius + Math.sin(angle) * innerRadius
      ));
    }

    // Inner bottom side
    for (var i = 1; i <= 15; i++) {
      var t = i / 15;
      innerPts.push(new THREE.Vector3(
        innerWidth - innerRadius - t * (2 * innerWidth - 2 * innerRadius),
        0.45,
        innerHeight
      ));
    }

    // Inner bottom-left corner
    for (var i = 1; i <= 10; i++) {
      var angle = Math.PI / 2 + (i / 10) * (Math.PI / 2);
      innerPts.push(new THREE.Vector3(
        -innerWidth + innerRadius + Math.cos(angle) * innerRadius,
        0.45,
        innerHeight - innerRadius + Math.sin(angle) * innerRadius
      ));
    }

    // Inner left side
    for (var i = 1; i <= 15; i++) {
      var t = i / 15;
      innerPts.push(new THREE.Vector3(
        -innerWidth,
        0.45,
        innerHeight - innerRadius - t * (2 * innerHeight - 2 * innerRadius)
      ));
    }

    // Inner top-left corner
    for (var i = 1; i <= 10; i++) {
      var angle = Math.PI + (i / 10) * (Math.PI / 2);
      innerPts.push(new THREE.Vector3(
        -innerWidth + innerRadius + Math.cos(angle) * innerRadius,
        0.45,
        -innerHeight + innerRadius + Math.sin(angle) * innerRadius
      ));
    }

    var innerCurve = new THREE.CatmullRomCurve3(innerPts, true, 'catmullrom', 0.0);
    this.trackCurves.push({ curve: innerCurve, name: 'circuito interno', elevation: 0 });
    this._renderRail(innerCurve, railMat, sleeperMat, innerPts.length * 2, 0.45);

    // === VIADUCT — elevated crossover (as shown in SVG) ===
    var vElev = 1.2;

    // Junction points connecting outer and inner loops
    var jRightOuter = mainCurve.getPointAt(0.25);
    var jRightInner = innerCurve.getPointAt(0.25);
    var jLeftOuter = mainCurve.getPointAt(0.75);
    var jLeftInner = innerCurve.getPointAt(0.75);

    var viaductPts = [
      // Start at outer loop (right side)
      new THREE.Vector3(jRightOuter.x, jRightOuter.y, jRightOuter.z),
      // Ramp up
      new THREE.Vector3(jRightOuter.x - 0.5, 0.45 + vElev * 0.2, jRightOuter.z - 0.5),
      new THREE.Vector3(jRightOuter.x - 1.2, 0.45 + vElev * 0.4, jRightOuter.z - 1.0),
      new THREE.Vector3(jRightOuter.x - 2.0, 0.45 + vElev * 0.6, jRightOuter.z - 1.5),
      // Cross over center
      new THREE.Vector3(0, 0.45 + vElev, 0),
      // Descend to inner loop
      new THREE.Vector3(jLeftInner.x + 2.0, 0.45 + vElev * 0.6, jLeftInner.z + 1.5),
      new THREE.Vector3(jLeftInner.x + 1.2, 0.45 + vElev * 0.4, jLeftInner.z + 1.0),
      new THREE.Vector3(jLeftInner.x + 0.5, 0.45 + vElev * 0.2, jLeftInner.z + 0.5),
      // End at inner loop
      new THREE.Vector3(jLeftInner.x, jLeftInner.y, jLeftInner.z),
    ];

    var viaductCurve = new THREE.CatmullRomCurve3(viaductPts, false, 'catmullrom', 0.0);
    this.trackCurves.push({ curve: viaductCurve, name: 'viaduto', elevation: vElev });
    this._renderRail(viaductCurve, railMat, sleeperMat, 150, 0.45);

    // === CONNECTING RAILS between loops ===
    // As shown in SVG, add connecting segments
    this._createConnectingRail(
      new THREE.Vector3(trackWidth, 0.45, 0),
      new THREE.Vector3(innerWidth, 0.45, 0),
      railMat, sleeperMat
    );
    this._createConnectingRail(
      new THREE.Vector3(-trackWidth, 0.45, 0),
      new THREE.Vector3(-innerWidth, 0.45, 0),
      railMat, sleeperMat
    );

    // === JUNCTION MARKERS ===
    this._createJunctionMarker(jRightOuter.x, jRightOuter.y, jRightOuter.z);
    this._createJunctionMarker(jLeftInner.x, jLeftInner.y, jLeftInner.z);
    this._createJunctionMarker(trackWidth, 0.45, 0);
    this._createJunctionMarker(-trackWidth, 0.45, 0);
    
    // === PINK ACCENT TRACKS (matching SVG #FFB7B7) ===
    this._createPinkAccentTracks(trackWidth, trackHeight);
  }
  
  // Create pink accent tracks matching SVG color scheme
  _createPinkAccentTracks(trackWidth, trackHeight) {
    var pinkMat = new THREE.MeshStandardMaterial({ 
      color: 0xFFB7B7, 
      roughness: 0.5, 
      metalness: 0.2,
      emissive: 0xFFB7B7,
      emissiveIntensity: 0.15
    });
    
    // Add pink accent lines along the outer edges
    for (var side = -1; side <= 1; side += 2) {
      var line = new THREE.Mesh(
        new THREE.BoxGeometry(trackWidth * 2 - 4, 0.008, 0.04),
        pinkMat
      );
      line.position.set(0, 0.46, side * (trackHeight - 0.2));
      this.scene.add(line);
    }
    
    // Add pink accent lines on sides
    for (var side = -1; side <= 1; side += 2) {
      var line = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.008, trackHeight * 2 - 4),
        pinkMat
      );
      line.position.set(side * (trackWidth - 0.2), 0.46, 0);
      this.scene.add(line);
    }
  }

  // Create a short connecting rail between two points
  _createConnectingRail(start, end, railMat, sleeperMat) {
    var pts = [start, end];
    var curve = new THREE.LineCurve3(start, end);
    this._renderRail(curve, railMat, sleeperMat, 10, 0.45);
  }

  // Visual marker at track junction (where viaduct meets oval)
  _createJunctionMarker(x, y, z) {
    var markerMat = new THREE.MeshStandardMaterial({
      color: 0xffd700, roughness: 0.4, metalness: 0.3,
      emissive: 0x664400, emissiveIntensity: 0.3
    });
    // Small yellow disc at the junction point
    var marker = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16), markerMat);
    marker.position.set(x, y + 0.01, z);
    marker.castShadow = true;
    this.scene.add(marker);
  }

  _renderRail(curve, railMat, sleeperMat, seg, baseY) {
    if (seg < 10) seg = 10;

    var pts = curve.getPoints(seg);
    var pts2 = [];
    var gauge = 0.18; // HO gauge distance between rails

    // Compute second rail offset
    for (var i = 0; i < pts.length; i++) {
      var t = i / Math.max(1, pts.length - 1);
      var tangent = curve.getTangentAt(Math.min(t, 0.999));
      tangent.normalize();

      var up = new THREE.Vector3(0, 1, 0);
      var normal = new THREE.Vector3().crossVectors(up, tangent).normalize();

      if (normal.lengthSq() < 0.001) {
        normal.set(0, 0, 1);
      }

      pts2.push(new THREE.Vector3(
        pts[i].x + normal.x * gauge,
        pts[i].y,
        pts[i].z + normal.z * gauge
      ));
    }

    // Render rail 1 — flat strip (like real HO rails)
    for (var i = 0; i < pts.length - 1; i++) {
      var p1 = pts[i];
      var p2 = pts[i + 1];
      var dx = p2.x - p1.x;
      var dz = p2.z - p1.z;
      var len = Math.sqrt(dx * dx + dz * dz);
      if (len < 0.001) continue;

      var railSeg = new THREE.Mesh(
        new THREE.BoxGeometry(len, 0.02, 0.025),
        railMat
      );
      railSeg.position.set(
        (p1.x + p2.x) / 2,
        (p1.y + p2.y) / 2,
        (p1.z + p2.z) / 2
      );
      railSeg.rotation.y = -Math.atan2(dz, dx);
      railSeg.castShadow = true;
      this.scene.add(railSeg);
    }

    // Render rail 2 — flat strip
    for (var i = 0; i < pts2.length - 1; i++) {
      var p1 = pts2[i];
      var p2 = pts2[i + 1];
      var dx = p2.x - p1.x;
      var dz = p2.z - p1.z;
      var len = Math.sqrt(dx * dx + dz * dz);
      if (len < 0.001) continue;

      var railSeg = new THREE.Mesh(
        new THREE.BoxGeometry(len, 0.02, 0.025),
        railMat
      );
      railSeg.position.set(
        (p1.x + p2.x) / 2,
        (p1.y + p2.y) / 2,
        (p1.z + p2.z) / 2
      );
      railSeg.rotation.y = -Math.atan2(dz, dx);
      railSeg.castShadow = true;
      this.scene.add(railSeg);
    }

    // Sleepers — perpendicular to track direction
    var step = Math.max(5, Math.floor(pts.length / 50));
    for (var i = 0; i < pts.length; i += step) {
      var p = pts[i];
      var q = pts2[i];
      if (!p || !q) continue;

      var sleeper = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.015, gauge + 0.1),
        sleeperMat
      );
      sleeper.position.set((p.x + q.x) / 2, (p.y + q.y) / 2 - 0.01, (p.z + q.z) / 2);

      if (i < pts.length - 1) {
        var n = pts[Math.min(i + 1, pts.length - 1)];
        sleeper.rotation.y = -Math.atan2(n.z - p.z, n.x - p.x);
      }
      sleeper.castShadow = true;
      this.scene.add(sleeper);
    }
  }

  // ==========================================
  // VIADUCT — concrete structure with pillars
  // Faithful to SVG: elevated section crossing over
  // ==========================================
  createViaduct() {
    var viaductCurve = this.trackCurves[2].curve; // Viaduct is now index 2
    var vPts = viaductCurve.getPoints(60);

    // Materials
    var concreteMat = new THREE.MeshStandardMaterial({
      color: 0xe8e0d8,
      roughness: 0.8,
      metalness: 0.05
    });
    var pillarMat = new THREE.MeshStandardMaterial({
      color: 0xf5f5f0,
      roughness: 0.6,
      metalness: 0.1
    });
    var beamMat = new THREE.MeshStandardMaterial({
      color: 0xd0c8c0,
      roughness: 0.75,
      metalness: 0.05
    });
    var bedMat = new THREE.MeshStandardMaterial({
      color: 0x8B7355,
      roughness: 0.85,
      metalness: 0.02
    });

    // Place pillars along elevated portion (as shown in SVG with regular spacing)
    var pillarSpacing = 6;
    for (var i = 3; i < vPts.length - 3; i += pillarSpacing) {
      var p = vPts[i];
      var h = p.y - 0.45;
      if (h < 0.15) continue;

      // Main vertical pillar (white, matching SVG pillars)
      var pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.045, h, 8),
        pillarMat
      );
      pillar.position.set(p.x, 0.45 + h / 2, p.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);

      // Crossbeam at top
      var crossbeam = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.035, 0.3),
        beamMat
      );
      crossbeam.position.set(p.x, 0.45 + h - 0.02, p.z);
      crossbeam.castShadow = true;
      this.scene.add(crossbeam);

      // Base plate
      var basePlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.025, 0.18),
        concreteMat
      );
      basePlate.position.set(p.x, 0.46, p.z);
      basePlate.castShadow = true;
      this.scene.add(basePlate);

      // Triangular support bracket (as shown in SVG)
      if (h > 0.25) {
        var bracketShape = new THREE.Shape();
        bracketShape.moveTo(-0.12, 0);
        bracketShape.lineTo(0.12, 0);
        bracketShape.lineTo(0, h * 0.6);
        bracketShape.lineTo(-0.12, 0);

        var bracketGeo = new THREE.ExtrudeGeometry(bracketShape, {
          depth: 0.015,
          bevelEnabled: false
        });
        var bracket = new THREE.Mesh(bracketGeo, new THREE.MeshStandardMaterial({
          color: 0x8B6914,
          roughness: 0.9
        }));
        bracket.position.set(p.x, 0.45, p.z - 0.1);
        bracket.castShadow = true;
        this.scene.add(bracket);

        var bracket2 = bracket.clone();
        bracket2.position.z = p.z + 0.1;
        bracket2.rotation.y = Math.PI;
        this.scene.add(bracket2);
      }
    }

    // Elevated track bed
    var bedPts = [];
    for (var i = 2; i < vPts.length - 2; i++) {
      var p = vPts[i];
      if (p.y > 0.55) {
        bedPts.push(new THREE.Vector3(p.x, p.y - 0.03, p.z));
      }
    }

    if (bedPts.length > 2) {
      var bedCurve = new THREE.CatmullRomCurve3(bedPts, false, 'catmullrom', 0.0);

      // Main bed
      var bedTube = new THREE.TubeGeometry(bedCurve, bedPts.length * 3, 0.2, 8, false);
      var bed = new THREE.Mesh(bedTube, bedMat);
      bed.castShadow = true;
      bed.receiveShadow = true;
      this.scene.add(bed);

      // Side rails on elevated section
      for (var side = -1; side <= 1; side += 2) {
        var sidePts = bedPts.map(function(p) {
          return new THREE.Vector3(p.x, p.y + 0.02, p.z + side * 0.16);
        });
        var sideCurve = new THREE.CatmullRomCurve3(sidePts, false, 'catmullrom', 0.0);
        var sideRail = new THREE.TubeGeometry(sideCurve, sidePts.length * 2, 0.012, 6, false);
        var sideMesh = new THREE.Mesh(sideRail, new THREE.MeshStandardMaterial({
          color: 0xaaaaaa,
          metalness: 0.7,
          roughness: 0.3
        }));
        sideMesh.castShadow = true;
        this.scene.add(sideMesh);
      }
    }
  }

  // ==========================================
  // SWITCHES — mechanisms at track junctions
  // Positioned to match SVG rectangular layout
  // ==========================================
  createSwitches() {
    // Switch positions at key junction points in rectangular layout
    var positions = [
      { x: 8.0, z: 0.0, r: Math.PI / 2, label: 'SW1' },      // Right side junction
      { x: -8.0, z: 0.0, r: -Math.PI / 2, label: 'SW2' },    // Left side junction
      { x: 0.0, z: -3.5, r: 0, label: 'SW3' },               // Top center junction
      { x: 0.0, z: 3.5, r: Math.PI, label: 'SW4' },          // Bottom center junction
      { x: 3.0, z: -2.0, r: Math.PI / 4, label: 'SW5' },     // Top-right approach
      { x: -3.0, z: 2.0, r: -Math.PI / 4, label: 'SW6' },    // Bottom-left approach
      // Additional switches from SVG
      { x: 5.0, z: -3.0, r: Math.PI / 3, label: 'SW7' },     // Top-right corner
      { x: -5.0, z: 3.0, r: -Math.PI / 3, label: 'SW8' },    // Bottom-left corner
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var g = new THREE.Group();

      // Black base
      var baseMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
      var base = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.07, 0.3), baseMat);
      base.position.y = 0.04;
      base.castShadow = true;
      g.add(base);

      // Yellow mechanism (as shown in SVG)
      var mechMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.4,
        metalness: 0.3,
        emissive: 0x664400,
        emissiveIntensity: 0.2
      });
      var mech = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.18), mechMat);
      mech.position.y = 0.14;
      g.add(mech);

      // Lever arm
      var lever = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 6), mechMat);
      lever.position.set(0.13, 0.24, 0);
      lever.rotation.z = Math.PI / 4;
      g.add(lever);
      
      // Pink accent on switch (matching SVG #FFB7B7)
      var pinkMat = new THREE.MeshStandardMaterial({ 
        color: 0xFFB7B7, 
        roughness: 0.5, 
        metalness: 0.2,
        emissive: 0xFFB7B7,
        emissiveIntensity: 0.15
      });
      var pinkStrip = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.01, 0.31), pinkMat);
      pinkStrip.position.y = 0.08;
      g.add(pinkStrip);

      g.position.set(pos.x, 0.45, pos.z);
      g.rotation.y = pos.r;
      g.userData = { type: 'switch', label: pos.label };
      this.scene.add(g);
    }

    // White towers/pillars (as shown in SVG with regular spacing)
    var towerMat = new THREE.MeshStandardMaterial({ color: 0xf0f0e8, roughness: 0.7 });
    var towerPositions = [
      { x: -7.0, z: -4.0 },
      { x: 7.0, z: -4.0 },
      { x: -7.0, z: 4.0 },
      { x: 7.0, z: 4.0 },
      { x: 0.0, z: -4.5 },
      { x: 0.0, z: 4.5 },
      { x: -3.5, z: 0.0 },
      { x: 3.5, z: 0.0 },
      // Additional towers from SVG
      { x: -5.0, z: -4.0 },
      { x: 5.0, z: -4.0 },
      { x: -5.0, z: 4.0 },
      { x: 5.0, z: 4.0 },
    ];

    for (var i = 0; i < towerPositions.length; i++) {
      var tp = towerPositions[i];
      var pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.025, 0.7, 6),
        towerMat
      );
      pillar.position.set(tp.x, 0.8, tp.z);
      pillar.castShadow = true;
      this.scene.add(pillar);

      var crossbar = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.018, 0.018),
        towerMat
      );
      crossbar.position.set(tp.x, 1.15, tp.z);
      this.scene.add(crossbar);
      
      // Pink accent on tower top (matching SVG #FFB7B7)
      var pinkMat = new THREE.MeshStandardMaterial({ 
        color: 0xFFB7B7, 
        roughness: 0.5, 
        metalness: 0.2,
        emissive: 0xFFB7B7,
        emissiveIntensity: 0.15
      });
      var pinkTop = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.05, 8), pinkMat);
      pinkTop.position.set(tp.x, 1.18, tp.z);
      this.scene.add(pinkTop);
    }

    // Orange crane/tower (as shown in SVG)
    var orangeMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.6, metalness: 0.2 });
    var craneBase = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.12), orangeMat);
    craneBase.position.set(-9.0, 0.55, -1.5);
    craneBase.castShadow = true;
    this.scene.add(craneBase);

    var craneArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.035, 0.035), orangeMat);
    craneArm.position.set(-9.0, 0.82, -1.5);
    this.scene.add(craneArm);
    
    // Pink accent on crane
    var pinkMat = new THREE.MeshStandardMaterial({ 
      color: 0xFFB7B7, 
      roughness: 0.5, 
      metalness: 0.2,
      emissive: 0xFFB7B7,
      emissiveIntensity: 0.15
    });
    var pinkCraneStrip = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.01, 0.04), pinkMat);
    pinkCraneStrip.position.set(-9.0, 0.84, -1.5);
    this.scene.add(pinkCraneStrip);
  }

  // ==========================================
  // REVERSOR — positioned at control point
  // ==========================================
  createReversor() {
    var g = new THREE.Group();

    // Black box
    var boxMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    var box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.3), boxMat);
    box.position.y = 0.05;
    box.castShadow = true;
    g.add(box);

    // Yellow top strip (as shown in SVG)
    var stripMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4, metalness: 0.3 });
    var strip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.25), stripMat);
    strip.position.y = 0.11;
    g.add(strip);

    // Red indicator (reverse)
    var redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.15 });
    var red = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), redMat);
    red.position.set(-0.18, 0.17, 0);
    g.add(red);
    this.reversorRed = red;

    // Green indicator (forward)
    var greenMat = new THREE.MeshStandardMaterial({ color: 0x00cc00, emissive: 0x00ff00, emissiveIntensity: 0.8 });
    var green = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), greenMat);
    green.position.set(0.18, 0.17, 0);
    g.add(green);
    this.reversorGreen = green;
    
    // Pink accent on reversor (matching SVG #FFB7B7)
    var pinkMat = new THREE.MeshStandardMaterial({ 
      color: 0xFFB7B7, 
      roughness: 0.5, 
      metalness: 0.2,
      emissive: 0xFFB7B7,
      emissiveIntensity: 0.15
    });
    var pinkStrip = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.01, 0.32), pinkMat);
    pinkStrip.position.y = 0.12;
    g.add(pinkStrip);

    // Position at control point (as shown in SVG)
    g.position.set(4.0, 0.45, -2.5);
    g.userData = { type: 'reversor' };
    this.reversor = g;
    this.scene.add(g);
  }

  // ==========================================
  // ELECTRONICS (Arduino, breadboard, wires)
  // Positioned according to rectangular layout
  // ==========================================
  createElectronics() {
    var eg = new THREE.Group();

    // Breadboard (positioned near control center)
    var bb = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.04, 0.4),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.8 })
    );
    bb.position.set(-6.5, 0.52, 1.0);
    bb.castShadow = true;
    eg.add(bb);

    // Arduino (next to breadboard)
    var ar = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.035, 0.35),
      new THREE.MeshStandardMaterial({ color: 0x0066cc, roughness: 0.6 })
    );
    ar.position.set(-6.5, 0.52, 1.8);
    ar.castShadow = true;
    eg.add(ar);
    
    // Arduino USB port
    var usb = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.03, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8, roughness: 0.2 })
    );
    usb.position.set(-6.82, 0.52, 1.8);
    eg.add(usb);
    
    // Arduino pins
    for (var i = 0; i < 8; i++) {
      var pin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.003, 0.003, 0.02, 4),
        new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 })
      );
      pin.position.set(-6.5 + i * 0.06, 0.54, 1.65);
      eg.add(pin);
    }

    // Wires (as shown in SVG with defined routing)
    var wireColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff6600];
    for (var i = 0; i < 5; i++) {
      var w = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 1.0, 4),
        new THREE.MeshStandardMaterial({ color: wireColors[i] })
      );
      w.position.set(-6.5 + i * 0.1, 0.55, 1.4);
      w.rotation.x = Math.PI / 2;
      w.rotation.z = (Math.random() - 0.5) * 0.25;
      eg.add(w);
    }
    
    // Pink accent wires (matching SVG #FFB7B7)
    var pinkWireMat = new THREE.MeshStandardMaterial({ 
      color: 0xFFB7B7, 
      roughness: 0.5, 
      metalness: 0.2,
      emissive: 0xFFB7B7,
      emissiveIntensity: 0.1
    });
    
    for (var i = 0; i < 3; i++) {
      var pw = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.8, 4),
        pinkWireMat
      );
      pw.position.set(-6.5 + i * 0.08, 0.56, 1.2);
      pw.rotation.x = Math.PI / 2;
      pw.rotation.z = (Math.random() - 0.5) * 0.2;
      eg.add(pw);
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
      console.log('Click detected in placement mode');
      var rect = canvas.getBoundingClientRect();
      self.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      self.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      self.raycaster.setFromCamera(self.mouse, self.camera);

      if (self.trackCurves.length === 0) {
        console.log('No track curves found');
        return;
      }
      var pts = self.trackCurves[0].curve.getPoints(300);
      var best = null, bestD = Infinity;
      for (var i = 0; i < pts.length; i++) {
        var pt = pts[i].clone(); pt.y = 0.5;
        var pr = new THREE.Vector3();
        self.raycaster.ray.closestPointToPoint(pt, pr);
        var d = pt.distanceTo(pr);
        if (d < bestD && d < 4.0) { bestD = d; best = i / pts.length; }
      }
      console.log('Best track point found:', best, 'distance:', bestD);
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
        var pt = pts[i].clone(); pt.y = 0.5;
        var pr = new THREE.Vector3();
        self.raycaster.ray.closestPointToPoint(pt, pr);
        var d = pt.distanceTo(pr);
        if (d < bestD && d < 4.0) { bestD = d; best = pts[i]; }
      }
      if (best) {
        self.hoverIndicator.position.set(best.x, 0.55, best.z);
        self.hoverIndicator.material.opacity = bestD < 2.0 ? 0.8 : 0.3;
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
  // REVERSOR CLICK
  // ==========================================
  setupReversorClick() {
    var self = this;
    var canvas = this.renderer.domElement;

    canvas.addEventListener('click', function(e) {
      if (!self.reversor || self.placementMode) return;

      var rect = canvas.getBoundingClientRect();
      self.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      self.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      self.raycaster.setFromCamera(self.mouse, self.camera);

      var intersects = self.raycaster.intersectObjects(self.reversor.children, true);
      if (intersects.length > 0) {
        self.toggleReversor();
      }
    });
  }

  toggleReversor() {
    if (this.reversorState === 'green') {
      this.reversorState = 'red';
      this.reversorRed.material.emissiveIntensity = 0.8;
      this.reversorGreen.material.emissiveIntensity = 0.1;
    } else {
      this.reversorState = 'green';
      this.reversorRed.material.emissiveIntensity = 0.1;
      this.reversorGreen.material.emissiveIntensity = 0.8;
    }

    for (var i = 0; i < this.trains.length; i++) {
      if (this.trains[i].running) {
        this.trains[i].direction *= -1;
      }
    }

    if (typeof this.onReversorToggled === 'function') {
      this.onReversorToggled(this.reversorState);
    }
  }

  // ==========================================
  // SWITCH CLICK
  // ==========================================
  setupSwitchClick() {
    var self = this;
    var canvas = this.renderer.domElement;

    this.scene.traverse(function(c) {
      if (c.userData && c.userData.type === 'switch') {
        self.switches.push(c);
        self.switchStates[c.userData.label] = 'left';
      }
    });

    canvas.addEventListener('click', function(e) {
      if (self.placementMode) return;

      var rect = canvas.getBoundingClientRect();
      self.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      self.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      self.raycaster.setFromCamera(self.mouse, self.camera);

      for (var i = 0; i < self.switches.length; i++) {
        var sw = self.switches[i];
        var intersects = self.raycaster.intersectObjects(sw.children, true);
        if (intersects.length > 0) {
          self.toggleSwitch(sw);
          break;
        }
      }
    });
  }

  toggleSwitch(sw) {
    var label = sw.userData.label;
    var current = this.switchStates[label] || 'left';
    var next = current === 'left' ? 'right' : 'left';
    this.switchStates[label] = next;

    var lever = sw.children[2];
    if (lever) {
      lever.rotation.z = next === 'left' ? Math.PI / 4 : -Math.PI / 4;
    }

    var mech = sw.children[1];
    if (mech && mech.material) {
      mech.material.emissiveIntensity = next === 'right' ? 0.6 : 0.2;
    }

    if (typeof this.onSwitchToggled === 'function') {
      this.onSwitchToggled(label, next);
    }
  }

  // ==========================================
  // CURSOR HANDLER — unified hover cursor
  // ==========================================
  setupCursorHandler() {
    var self = this;
    var canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', function(e) {
      if (self.placementMode) { canvas.style.cursor = 'crosshair'; return; }

      var rect = canvas.getBoundingClientRect();
      self.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      self.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      self.raycaster.setFromCamera(self.mouse, self.camera);

      if (self.reversor) {
        var ri = self.raycaster.intersectObjects(self.reversor.children, true);
        if (ri.length > 0) { canvas.style.cursor = 'pointer'; return; }
      }

      for (var i = 0; i < self.switches.length; i++) {
        var si = self.raycaster.intersectObjects(self.switches[i].children, true);
        if (si.length > 0) { canvas.style.cursor = 'pointer'; return; }
      }

      canvas.style.cursor = '';
    });
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

  _addMesh(group, geo, mat, px, py, pz) {
    var m = new THREE.Mesh(geo, mat);
    m.position.set(px, py, pz);
    group.add(m);
    return m;
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
    var hrMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.15 });
    var rodMat = new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.85, roughness: 0.2 });
    var a = this._addMesh.bind(this, g);

    // Underframe
    a(new THREE.BoxGeometry(0.80, 0.04, 0.28), mU, 0, 0.10, 0);
    // Frame rails
    a(new THREE.BoxGeometry(0.76, 0.02, 0.012), mU, 0, 0.12, -0.13);
    a(new THREE.BoxGeometry(0.76, 0.02, 0.012), mU, 0, 0.12, 0.13);
    // Fuel tank
    var ft = a(new THREE.CylinderGeometry(0.045, 0.045, 0.20, 10), mK, 0.05, 0.08, 0);
    ft.rotation.z = Math.PI / 2;
    // Body
    a(new THREE.BoxGeometry(0.76, 0.18, 0.28), mB, 0, 0.22, 0).castShadow = true;
    a(new THREE.BoxGeometry(0.68, 0.10, 0.26), mB, 0, 0.35, 0).castShadow = true;
    // Side panels
    a(new THREE.BoxGeometry(0.48, 0.07, 0.004), mA, 0.04, 0.24, -0.141);
    a(new THREE.BoxGeometry(0.48, 0.07, 0.004), mA, 0.04, 0.24, 0.141);
    // Stripes
    a(new THREE.BoxGeometry(0.74, 0.018, 0.29), mS, 0, 0.33, 0);
    a(new THREE.BoxGeometry(0.74, 0.006, 0.29), mS, 0, 0.30, 0);
    // Cab
    a(new THREE.BoxGeometry(0.24, 0.12, 0.26), mA, -0.20, 0.44, 0).castShadow = true;
    a(new THREE.BoxGeometry(0.26, 0.025, 0.28), mK, -0.20, 0.51, 0);
    // Windows
    a(new THREE.BoxGeometry(0.012, 0.06, 0.16), mG, -0.32, 0.45, 0);
    a(new THREE.BoxGeometry(0.012, 0.05, 0.12), mG, -0.08, 0.45, 0);
    a(new THREE.BoxGeometry(0.14, 0.05, 0.01), mG, -0.20, 0.46, -0.131);
    a(new THREE.BoxGeometry(0.14, 0.05, 0.01), mG, -0.20, 0.46, 0.131);
    // Nose
    a(new THREE.BoxGeometry(0.07, 0.09, 0.24), mB, 0.37, 0.23, 0).castShadow = true;
    // Headlights
    a(new THREE.SphereGeometry(0.02, 8, 8), mH, 0.41, 0.25, -0.09);
    a(new THREE.SphereGeometry(0.02, 8, 8), mH, 0.41, 0.25, 0.09);
    // Rear lights
    a(new THREE.SphereGeometry(0.015, 6, 6), mR, -0.33, 0.22, -0.09);
    a(new THREE.SphereGeometry(0.015, 6, 6), mR, -0.33, 0.22, 0.09);
    // Exhaust
    a(new THREE.CylinderGeometry(0.012, 0.015, 0.05, 8), mK, 0.14, 0.40, 0);
    a(new THREE.CylinderGeometry(0.018, 0.012, 0.006, 8), mC, 0.14, 0.43, 0);
    a(new THREE.CylinderGeometry(0.012, 0.015, 0.05, 8), mK, 0.20, 0.40, 0);
    a(new THREE.CylinderGeometry(0.018, 0.012, 0.006, 8), mC, 0.20, 0.43, 0);
    // Handrails
    a(new THREE.BoxGeometry(0.62, 0.003, 0.003), hrMat, 0, 0.37, -0.145);
    a(new THREE.BoxGeometry(0.62, 0.003, 0.003), hrMat, 0, 0.37, 0.145);
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
    for (var wj = 0; wj < wZ.length; wj++) {
      var rz = wZ[wj] > 0 ? wZ[wj] + 0.016 : wZ[wj] - 0.016;
      a(new THREE.BoxGeometry(0.50, 0.010, 0.006), rodMat, -0.02, 0.048, rz);
    }
    // Couplers
    a(new THREE.BoxGeometry(0.035, 0.025, 0.05), mK, 0.40, 0.10, 0);
    a(new THREE.BoxGeometry(0.015, 0.015, 0.035), mC, 0.42, 0.10, 0);
    a(new THREE.BoxGeometry(0.035, 0.025, 0.05), mK, -0.34, 0.10, 0);
    a(new THREE.BoxGeometry(0.015, 0.015, 0.035), mC, -0.36, 0.10, 0);
    return g;
  }

  _makeCar(c) {
    var g = new THREE.Group();
    var mB = new THREE.MeshStandardMaterial({ color: c.body, metalness: 0.45, roughness: 0.35 });
    var mA = new THREE.MeshStandardMaterial({ color: c.accent, metalness: 0.35, roughness: 0.4 });
    var mU = new THREE.MeshStandardMaterial({ color: c.under, metalness: 0.6, roughness: 0.45 });
    var mC = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.9, roughness: 0.15 });
    var mK = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.7, roughness: 0.4 });
    var mW = new THREE.MeshStandardMaterial({ color: 0x88ccff, metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.4 });
    var a = this._addMesh.bind(this, g);

    // Underframe
    a(new THREE.BoxGeometry(0.58, 0.03, 0.26), mU, 0, 0.09, 0);
    // Body
    a(new THREE.BoxGeometry(0.56, 0.18, 0.25), mB, 0, 0.20, 0).castShadow = true;
    // Roof
    a(new THREE.BoxGeometry(0.54, 0.02, 0.26), mA, 0, 0.31, 0);
    // Stripes
    a(new THREE.BoxGeometry(0.52, 0.012, 0.26), mA, 0, 0.28, 0);
    // Side ribs
    for (var zz = 0; zz < 2; zz++) {
      var z = zz === 0 ? -0.126 : 0.126;
      for (var xi = -2; xi <= 2; xi++) {
        a(new THREE.BoxGeometry(0.006, 0.16, 0.003), mA, xi * 0.10, 0.20, z);
      }
    }
    // Windows
    for (var zz = 0; zz < 2; zz++) {
      var z = zz === 0 ? -0.127 : 0.127;
      for (var wi = -2; wi <= 2; wi++) {
        a(new THREE.BoxGeometry(0.04, 0.04, 0.003), mW, wi * 0.10, 0.24, z);
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
    a(new THREE.BoxGeometry(0.03, 0.02, 0.045), mK, 0.30, 0.09, 0);
    a(new THREE.BoxGeometry(0.012, 0.012, 0.03), mC, 0.318, 0.09, 0);
    a(new THREE.BoxGeometry(0.03, 0.02, 0.045), mK, -0.30, 0.09, 0);
    a(new THREE.BoxGeometry(0.012, 0.012, 0.03), mC, -0.318, 0.09, 0);
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
      targetSpeed: 0, currentSpeed: 0,
      running: false, direction: 1,
      name: type.label + ' #' + (id + 1),
      trackIndex: 0, partGap: 0.022
    };

    this.trains.push(train);
    this._placeTrainOnTrack(train);
    console.log('Train added:', train.name, 'at progress:', progressOnTrack);
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
      // Place train on top of rail at actual track height + wheel offset
      part.position.set(point.x, point.y + 0.048, point.z);

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
  // CAMERA VIEWS — updated for rectangular layout
  // ==========================================
  animateToView(view) {
    var views = {
      overview: { x: 0, y: 18, z: 22, lx: 0, ly: 0, lz: 0 },
      mina: { x: -8, y: 5, z: 4, lx: -5, ly: 0, lz: 1 },
      porto: { x: 8, y: 5, z: 4, lx: 6, ly: 0, lz: -2 },
      trem: { x: 0, y: 5, z: 10, lx: 0, ly: 0.5, lz: 0 },
      mine: { x: -8, y: 5, z: 4, lx: -5, ly: 0, lz: 1 },
      port: { x: 8, y: 5, z: 4, lx: 6, ly: 0, lz: -2 }
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

    // Switch + Reversor animation
    var reversorGlow = 0.7 + Math.sin(time * 3) * 0.3;
    this.scene.traverse(function(c) {
      if (c.userData && c.userData.type === 'switch') {
        c.scale.setScalar(1 + Math.sin(time * 2.5 + c.position.x) * 0.03);
      }
      if (c.userData && c.userData.type === 'reversor') {
        c.children.forEach(function(child) {
          if (child.material && child.material.emissive) {
            // Pulse only indicators that are "on" (intensity > 0.5)
            if (child.material.emissiveIntensity > 0.5) {
              child.material.emissiveIntensity = reversorGlow;
            }
          }
        });
      }
    });

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    if (!this.container) return;
    var w = this.container.clientWidth || this.container.offsetWidth;
    var h = this.container.clientHeight || this.container.offsetHeight;
    if (w === 0 || h === 0) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  destroy() {
    if (this.animationId) cancelAnimationFrame(this.animationId);
    if (this.renderer) this.renderer.dispose();
  }

  // ==========================================
  // AUTO-SPAWN DEFAULT TRAINS
  // ==========================================
  _spawnDefaultTrains() {
    var configs = [
      { colorIndex: 0, typeIndex: 0, progress: 0.0,  speed: 0.04,  direction: 1  },
      { colorIndex: 1, typeIndex: 1, progress: 0.35, speed: 0.03,  direction: 1  },
      { colorIndex: 2, typeIndex: 2, progress: 0.65, speed: 0.05,  direction: -1 },
    ];
    for (var i = 0; i < configs.length; i++) {
      var cfg = configs[i];
      // Set targetSpeed BEFORE addTrain so the card shows correct value
      var origAddTrain = this.addTrain;
      var train = this.addTrain(cfg.progress, cfg.colorIndex, cfg.typeIndex);
      train.targetSpeed = cfg.speed;
      train.currentSpeed = cfg.speed;
      train.direction = cfg.direction;
      train.running = true;
      this._placeTrainOnTrack(train);
      if (typeof this.onTrainToggled === 'function') this.onTrainToggled(train);
      // Update the card's speed slider to match actual speed
      var slider = document.querySelector('.train-card[data-id="' + train.id + '"] input[type="range"]');
      if (slider) slider.value = cfg.speed;
      var valSpan = document.querySelector('.train-card[data-id="' + train.id + '"] .speed-val');
      if (valSpan) valSpan.textContent = Math.round((cfg.speed / 0.1) * 100) + '%';
    }
  }
}

window.MaquetteScene = MaquetteScene;
