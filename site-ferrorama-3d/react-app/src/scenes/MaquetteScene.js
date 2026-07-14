/* ============================================
   THREE.JS SCENE - MAQUETE FERRORAMA XP-500S
   Adapted for React (used via refs)
   ============================================ */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default class MaquetteScene {
  constructor(container) {
    this.container = container;
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
      { name: 'Rumo Azul', body: 0x0d47a1, accent: 0x1565c0, strip: 0xffd700, under: 0x222222 },
      { name: 'Rumo Vermelho', body: 0xb71c1c, accent: 0xc62828, strip: 0xffffff, under: 0x222222 },
      { name: 'Verde Floresta', body: 0x1b5e20, accent: 0x2e7d32, strip: 0xffd700, under: 0x222222 },
      { name: 'Amarelo Ouro', body: 0xf9a825, accent: 0xfbc02d, strip: 0x1a1a1a, under: 0x222222 },
      { name: 'Laranja Fogo', body: 0xe65100, accent: 0xef6c00, strip: 0xffffff, under: 0x222222 },
      { name: 'Roxo Royal', body: 0x4a148c, accent: 0x6a1b9a, strip: 0xffd700, under: 0x222222 },
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

    this.reversor = null;
    this.reversorRed = null;
    this.reversorGreen = null;
    this.reversorState = 'green';

    this.switches = [];
    this.switchStates = {};

    // Callbacks (set by React)
    this.onTrainAdded = null;
    this.onTrainRemoved = null;
    this.onTrainToggled = null;
    this.onTrainPlaced = null;
    this.onAllTrainsToggled = null;
    this.onReversorToggled = null;
    this.onSwitchToggled = null;

    this.init();
  }

  init() {
    try {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x06060c);
      this.scene.fog = new THREE.FogExp2(0x06060c, 0.005);

      var w = this.container.clientWidth || 800;
      var h = this.container.clientHeight || 600;

      this.camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 1000);
      this.camera.position.set(0, 18, 22);

      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.2;
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.container.appendChild(this.renderer.domElement);

      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
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
      this._onResize = this.onResize.bind(this);
      window.addEventListener('resize', this._onResize);
      this.animate();
    } catch (e) {
      console.error('MaquetteScene init error:', e);
    }
  }

  setupLights() {
    this.scene.add(new THREE.AmbientLight(0x1a1410, 0.6));

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

    var fill = new THREE.DirectionalLight(0x8899bb, 0.35);
    fill.position.set(-8, 12, -6);
    this.scene.add(fill);

    var rim = new THREE.PointLight(0xff8844, 0.5, 40);
    rim.position.set(0, 8, -10);
    this.scene.add(rim);

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

  createBase() {
    var mdfMat = new THREE.MeshStandardMaterial({ color: 0xc49464, roughness: 0.9, metalness: 0.02 });
    var base = new THREE.Mesh(new THREE.BoxGeometry(20, 0.4, 10), mdfMat);
    base.position.y = -0.2;
    base.receiveShadow = true;
    base.castShadow = true;
    this.scene.add(base);

    var edgeMat = new THREE.MeshStandardMaterial({ color: 0xa07848, roughness: 0.85 });
    [[-5, 0.05, 0], [5, 0.05, 0]].forEach(function (p) {
      var e = new THREE.Mesh(new THREE.BoxGeometry(20, 0.12, 0.15), edgeMat);
      e.position.set(p[0], p[1], p[2]);
      this.scene.add(e);
    }.bind(this));
    [[-10, 0.05, 0], [10, 0.05, 0]].forEach(function (p) {
      var e = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 10), edgeMat);
      e.position.set(p[0], p[1], p[2]);
      this.scene.add(e);
    }.bind(this));
  }

  createGround() {
    var grassMat = new THREE.MeshStandardMaterial({ color: 0x2d5a1e, roughness: 0.95, metalness: 0.0 });
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(50, 30), grassMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.25;
    ground.receiveShadow = true;
    this.scene.add(ground);

    var dirtMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.95 });
    for (var i = 0; i < 6; i++) {
      var patch = new THREE.Mesh(new THREE.CircleGeometry(0.4 + Math.random() * 0.6, 16), dirtMat);
      patch.rotation.x = -Math.PI / 2;
      patch.position.set((Math.random() - 0.5) * 15, -0.24, (Math.random() - 0.5) * 8);
      this.scene.add(patch);
    }
  }

  createStructures() {
    var self = this;
    var buildings = [
      { x: -7, z: -3.5, w: 1.0, h: 0.7, d: 0.7, color: 0x4a4a4a },
      { x: -7, z: 3.5, w: 0.8, h: 0.5, d: 0.6, color: 0x5a5a5a },
    ];

    buildings.forEach(function (b) {
      var mat = new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.8 });
      var body = new THREE.Mesh(new THREE.BoxGeometry(b.w, b.h, b.d), mat);
      body.position.set(b.x, 0.45 + b.h / 2, b.z);
      body.castShadow = true;
      body.receiveShadow = true;
      self.scene.add(body);

      var roofMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
      var roof = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.08, 0.06, b.d + 0.08), roofMat);
      roof.position.set(b.x, 0.45 + b.h + 0.03, b.z);
      roof.castShadow = true;
      self.scene.add(roof);

      var windowMat = new THREE.MeshStandardMaterial({
        color: 0x88ccff, metalness: 0.8, roughness: 0.1, transparent: true, opacity: 0.4
      });
      for (var zz = 0; zz < 2; zz++) {
        var z = zz === 0 ? -b.d / 2 - 0.01 : b.d / 2 + 0.01;
        var win = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.1), windowMat);
        win.position.set(b.x, 0.45 + b.h * 0.6, z);
        win.rotation.y = zz === 0 ? 0 : Math.PI;
        self.scene.add(win);
      }
    });

    var trunkMat = new THREE.MeshStandardMaterial({ color: 0x5D4037, roughness: 0.9 });
    var leavesMat = new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.85 });
    var leavesMat2 = new THREE.MeshStandardMaterial({ color: 0x1B5E20, roughness: 0.85 });

    var treePositions = [
      { x: -8.5, z: -4.5 }, { x: -8.5, z: 4.5 }, { x: 8.5, z: -4.5 },
      { x: -4, z: -4.0 }, { x: 4, z: 4.0 }, { x: 0, z: -4.5 }, { x: -6, z: 0 },
    ];

    treePositions.forEach(function (pos, idx) {
      var trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.4, 6), trunkMat);
      trunk.position.set(pos.x, 0.45, pos.z);
      trunk.castShadow = true;
      self.scene.add(trunk);

      var leaves = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 8, 6),
        idx % 2 === 0 ? leavesMat : leavesMat2
      );
      leaves.position.set(pos.x, 0.75, pos.z);
      leaves.scale.set(1, 0.8, 1);
      leaves.castShadow = true;
      self.scene.add(leaves);
    });
  }

  createWater() {
    var waterMat = new THREE.MeshStandardMaterial({
      color: 0x1a5276, metalness: 0.3, roughness: 0.2, transparent: true, opacity: 0.7
    });
    var water = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.5), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set(8.5, -0.22, -2.5);
    this.scene.add(water);

    var dockMat = new THREE.MeshStandardMaterial({ color: 0x6D4C41, roughness: 0.85 });
    var dock = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.08, 0.35), dockMat);
    dock.position.set(8.5, 0.45, -1.2);
    dock.castShadow = true;
    this.scene.add(dock);

    var shipMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.6, metalness: 0.3 });
    var shipBody = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.4), shipMat);
    shipBody.position.set(8.5, -0.12, -2.5);
    this.scene.add(shipBody);

    var cabinMat = new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.7 });
    var cabin = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.35), cabinMat);
    cabin.position.set(8.5, 0.02, -2.5);
    this.scene.add(cabin);
  }

  createTurntables() {
    var turntablePositions = [
      { x: -5.0, z: -2.8, radius: 0.6, label: 'TG1' },
      { x: -2.5, z: 2.8, radius: 0.5, label: 'TG2' },
      { x: 2.5, z: -2.8, radius: 0.5, label: 'TG3' },
      { x: 4.8, z: 2.4, radius: 0.45, label: 'TG4' },
    ];

    for (var i = 0; i < turntablePositions.length; i++) {
      var pos = turntablePositions[i];
      var g = new THREE.Group();

      var pitMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9, metalness: 0.1 });
      var pit = new THREE.Mesh(new THREE.CylinderGeometry(pos.radius + 0.1, pos.radius + 0.1, 0.05, 32), pitMat);
      pit.position.y = 0.43;
      pit.receiveShadow = true;
      g.add(pit);

      var platformMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.7, metalness: 0.2 });
      var platform = new THREE.Mesh(new THREE.CylinderGeometry(pos.radius, pos.radius, 0.04, 32), platformMat);
      platform.position.y = 0.47;
      platform.castShadow = true;
      platform.receiveShadow = true;
      g.add(platform);

      var pivotMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.6 });
      var pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.06, 12), pivotMat);
      pivot.position.y = 0.5;
      g.add(pivot);

      var trackMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.7 });
      var track = new THREE.Mesh(new THREE.BoxGeometry(pos.radius * 2, 0.02, 0.08), trackMat);
      track.position.y = 0.5;
      g.add(track);

      var railMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3, metalness: 0.8 });
      for (var side = -1; side <= 1; side += 2) {
        var rail = new THREE.Mesh(new THREE.BoxGeometry(pos.radius * 2, 0.015, 0.015), railMat);
        rail.position.set(0, 0.51, side * 0.03);
        g.add(rail);
      }

      var edgeMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.6, metalness: 0.4 });
      var edge = new THREE.Mesh(new THREE.TorusGeometry(pos.radius + 0.05, 0.015, 8, 32), edgeMat);
      edge.rotation.x = Math.PI / 2;
      edge.position.y = 0.48;
      g.add(edge);

      g.position.set(pos.x, 0, pos.z);
      g.userData = { type: 'turntable', label: pos.label };
      this.scene.add(g);
    }
  }

  // Build a curve from straight LineCurve3 segments (perfectly straight rails)
  _buildStraightTrack(waypoints) {
    var segments = [];
    for (var i = 0; i < waypoints.length - 1; i++) {
      segments.push(new THREE.LineCurve3(waypoints[i], waypoints[i + 1]));
    }
    // Return a custom curve-like object that dispatches to the right segment
    var totalSegments = segments.length;
    return {
      getPointAt: function (t) {
        t = ((t % 1) + 1) % 1;
        var idx = Math.min(Math.floor(t * totalSegments), totalSegments - 1);
        var localT = (t * totalSegments) - idx;
        return segments[idx].getPointAt(localT);
      },
      getTangentAt: function (t) {
        t = ((t % 1) + 1) % 1;
        var idx = Math.min(Math.floor(t * totalSegments), totalSegments - 1);
        return segments[idx].getTangentAt(0);
      },
      getPoints: function (count) {
        var pts = [];
        for (var i = 0; i <= count; i++) {
          pts.push(this.getPointAt(i / count));
        }
        return pts;
      }
    };
  }

  createTrackSystem() {
    this.trackCurves = [];
    var railMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.35 });
    var sleeperMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.85 });

    // --- Oval track: 4 straight segments + 4 corner arcs ---
    var ow = 6.0, oh = 2.5, cr = 1.0;

    // 4 corner centers
    var corners = [
      new THREE.Vector3(ow - cr, 0.45, -oh + cr),   // top-right
      new THREE.Vector3(ow - cr, 0.45, oh - cr),    // bottom-right
      new THREE.Vector3(-ow + cr, 0.45, oh - cr),   // bottom-left
      new THREE.Vector3(-ow + cr, 0.45, -oh + cr),  // top-left
    ];

    var ovalPts = [];
    var arcSegs = 12;

    // top side: straight from (-ow+cr, -oh) to (ow-cr, -oh)
    ovalPts.push(new THREE.Vector3(-ow + cr, 0.45, -oh));
    ovalPts.push(new THREE.Vector3(ow - cr, 0.45, -oh));

    // top-right corner arc
    for (var i = 1; i <= arcSegs; i++) {
      var a = -Math.PI / 2 + (i / arcSegs) * (Math.PI / 2);
      ovalPts.push(new THREE.Vector3(corners[0].x + Math.cos(a) * cr, 0.45, corners[0].z + Math.sin(a) * cr));
    }

    // right side: straight from (ow, -oh+cr) to (ow, oh-cr)
    ovalPts.push(new THREE.Vector3(ow, 0.45, -oh + cr));
    ovalPts.push(new THREE.Vector3(ow, 0.45, oh - cr));

    // bottom-right corner arc
    for (var i = 1; i <= arcSegs; i++) {
      var a = 0 + (i / arcSegs) * (Math.PI / 2);
      ovalPts.push(new THREE.Vector3(corners[1].x + Math.cos(a) * cr, 0.45, corners[1].z + Math.sin(a) * cr));
    }

    // bottom side: straight from (ow-cr, oh) to (-ow+cr, oh)
    ovalPts.push(new THREE.Vector3(ow - cr, 0.45, oh));
    ovalPts.push(new THREE.Vector3(-ow + cr, 0.45, oh));

    // bottom-left corner arc
    for (var i = 1; i <= arcSegs; i++) {
      var a = Math.PI / 2 + (i / arcSegs) * (Math.PI / 2);
      ovalPts.push(new THREE.Vector3(corners[2].x + Math.cos(a) * cr, 0.45, corners[2].z + Math.sin(a) * cr));
    }

    // left side: straight from (-ow, oh-cr) to (-ow, -oh+cr)
    ovalPts.push(new THREE.Vector3(-ow, 0.45, oh - cr));
    ovalPts.push(new THREE.Vector3(-ow, 0.45, -oh + cr));

    // top-left corner arc
    for (var i = 1; i <= arcSegs; i++) {
      var a = Math.PI + (i / arcSegs) * (Math.PI / 2);
      ovalPts.push(new THREE.Vector3(corners[3].x + Math.cos(a) * cr, 0.45, corners[3].z + Math.sin(a) * cr));
    }

    var ovalCurve = this._buildStraightTrack(ovalPts);
    this.trackCurves.push({ curve: ovalCurve, name: 'circuito principal', elevation: 0 });
    this._renderRail(ovalCurve, railMat, sleeperMat, ovalPts.length * 4, 0.45);

    // --- Viaduct (elevated track) ---
    var vElev = 1.3;
    // Junction points on the oval (use approximate positions)
    var jRight = new THREE.Vector3(ow - 1.0, 0.45, -oh + 0.5);
    var jLeft = new THREE.Vector3(-ow + 1.0, 0.45, oh - 0.5);

    var viaductPts = [
      jRight.clone(),
      new THREE.Vector3(jRight.x - 0.5, 0.45 + vElev * 0.15, jRight.z - 0.7),
      new THREE.Vector3(jRight.x - 1.2, 0.45 + vElev * 0.35, jRight.z - 1.4),
      new THREE.Vector3(jRight.x - 2.5, 0.45 + vElev * 0.7, jRight.z - 2.0),
      new THREE.Vector3(0, 0.45 + vElev, 0),
      new THREE.Vector3(jLeft.x + 2.5, 0.45 + vElev * 0.7, jLeft.z + 2.0),
      new THREE.Vector3(jLeft.x + 1.2, 0.45 + vElev * 0.35, jLeft.z + 1.4),
      new THREE.Vector3(jLeft.x + 0.5, 0.45 + vElev * 0.15, jLeft.z + 0.7),
      jLeft.clone(),
    ];

    var viaductCurve = this._buildStraightTrack(viaductPts);
    this.trackCurves.push({ curve: viaductCurve, name: 'viaduto', elevation: vElev });
    this._renderRail(viaductCurve, railMat, sleeperMat, 200, 0.45);

    this._createJunctionMarker(jRight.x, jRight.y, jRight.z);
    this._createJunctionMarker(jLeft.x, jLeft.y, jLeft.z);
  }

  _createJunctionMarker(x, y, z) {
    var markerMat = new THREE.MeshStandardMaterial({
      color: 0xffd700, roughness: 0.4, metalness: 0.3, emissive: 0x664400, emissiveIntensity: 0.3
    });
    var marker = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.02, 16), markerMat);
    marker.position.set(x, y + 0.01, z);
    marker.castShadow = true;
    this.scene.add(marker);
  }

  _renderRail(curve, railMat, sleeperMat, seg, baseY) {
    if (seg < 10) seg = 10;
    var pts = curve.getPoints(seg);
    var gauge = 0.18;

    // Compute parallel rail (offset by gauge perpendicular to track)
    var pts2 = [];
    for (var i = 0; i < pts.length; i++) {
      var t = i / Math.max(1, pts.length - 1);
      var tangent = curve.getTangentAt(Math.min(t, 0.999));
      tangent.normalize();
      var up = new THREE.Vector3(0, 1, 0);
      var normal = new THREE.Vector3().crossVectors(up, tangent).normalize();
      if (normal.lengthSq() < 0.001) normal.set(0, 0, 1);
      pts2.push(new THREE.Vector3(pts[i].x + normal.x * gauge, pts[i].y, pts[i].z + normal.z * gauge));
    }

    // Helper: render a series of points as straight rail segments
    var renderRailSide = function (points) {
      for (var i = 0; i < points.length - 1; i++) {
        var p1 = points[i]; var p2 = points[i + 1];
        var dx = p2.x - p1.x; var dz = p2.z - p1.z;
        var len = Math.sqrt(dx * dx + dz * dz);
        if (len < 0.001) continue;
        var railSeg = new THREE.Mesh(new THREE.BoxGeometry(len + 0.005, 0.02, 0.025), railMat);
        railSeg.position.set((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
        railSeg.rotation.y = -Math.atan2(dz, dx);
        railSeg.castShadow = true;
        this.scene.add(railSeg);
      }
    }.bind(this);

    renderRailSide(pts);
    renderRailSide(pts2);

    // Sleepers (cross-ties) connecting both rails
    var step = Math.max(3, Math.floor(pts.length / 60));
    for (var i = 0; i < pts.length; i += step) {
      var p = pts[i]; var q = pts2[i];
      if (!p || !q) continue;
      var sleeper = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.015, gauge + 0.1), sleeperMat);
      sleeper.position.set((p.x + q.x) / 2, (p.y + q.y) / 2 - 0.01, (p.z + q.z) / 2);
      if (i < pts.length - 1) {
        var n = pts[Math.min(i + 1, pts.length - 1)];
        sleeper.rotation.y = -Math.atan2(n.z - p.z, n.x - p.x);
      }
      sleeper.castShadow = true;
      this.scene.add(sleeper);
    }
  }

  createViaduct() {
    var viaductCurve = this.trackCurves[1].curve;
    var vPts = viaductCurve.getPoints(80);

    var concreteMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d8, roughness: 0.8, metalness: 0.05 });
    var pillarMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f0, roughness: 0.6, metalness: 0.1 });
    var beamMat = new THREE.MeshStandardMaterial({ color: 0xd0c8c0, roughness: 0.75, metalness: 0.05 });
    var bedMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.85, metalness: 0.02 });

    var pillarSpacing = 5;
    for (var i = 4; i < vPts.length - 4; i += pillarSpacing) {
      var p = vPts[i];
      var h = p.y - 0.45;
      if (h < 0.2) continue;

      var pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, h, 8), pillarMat);
      pillar.position.set(p.x, 0.45 + h / 2, p.z);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      this.scene.add(pillar);

      var pillar2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, h, 8), pillarMat);
      pillar2.position.set(p.x, 0.45 + h / 2, p.z);
      pillar2.castShadow = true;
      this.scene.add(pillar2);

      var crossbeam = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.35), beamMat);
      crossbeam.position.set(p.x, 0.45 + h - 0.02, p.z);
      crossbeam.castShadow = true;
      this.scene.add(crossbeam);

      if (h > 0.5) {
        var midBeam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.3), beamMat);
        midBeam.position.set(p.x, 0.45 + h * 0.5, p.z);
        this.scene.add(midBeam);
      }

      var basePlate = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.2), concreteMat);
      basePlate.position.set(p.x, 0.46, p.z);
      basePlate.castShadow = true;
      this.scene.add(basePlate);

      if (h > 0.3) {
        var bracketShape = new THREE.Shape();
        bracketShape.moveTo(-0.15, 0);
        bracketShape.lineTo(0.15, 0);
        bracketShape.lineTo(0, h * 0.6);
        bracketShape.lineTo(-0.15, 0);

        var bracketGeo = new THREE.ExtrudeGeometry(bracketShape, { depth: 0.02, bevelEnabled: false });
        var bracket = new THREE.Mesh(bracketGeo, new THREE.MeshStandardMaterial({ color: 0x8B6914, roughness: 0.9 }));
        bracket.position.set(p.x, 0.45, p.z - 0.12);
        bracket.castShadow = true;
        this.scene.add(bracket);

        var bracket2 = bracket.clone();
        bracket2.position.z = p.z + 0.12;
        bracket2.rotation.y = Math.PI;
        this.scene.add(bracket2);
      }
    }

    var bedPts = [];
    for (var i = 2; i < vPts.length - 2; i++) {
      var p = vPts[i];
      if (p.y > 0.6) bedPts.push(new THREE.Vector3(p.x, p.y - 0.03, p.z));
    }

    if (bedPts.length > 2) {
      var bedCurve = new THREE.CatmullRomCurve3(bedPts, false, 'catmullrom', 0.0);
      var bedTube = new THREE.TubeGeometry(bedCurve, bedPts.length * 3, 0.22, 8, false);
      var bed = new THREE.Mesh(bedTube, bedMat);
      bed.castShadow = true;
      bed.receiveShadow = true;
      this.scene.add(bed);

      for (var side = -1; side <= 1; side += 2) {
        var sidePts = bedPts.map(function (p) {
          return new THREE.Vector3(p.x, p.y + 0.02, p.z + side * 0.18);
        });
        var sideCurve = new THREE.CatmullRomCurve3(sidePts, false, 'catmullrom', 0.0);
        var sideRail = new THREE.TubeGeometry(sideCurve, sidePts.length * 2, 0.015, 6, false);
        var sideMesh = new THREE.Mesh(sideRail, new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.7, roughness: 0.3 }));
        sideMesh.castShadow = true;
        this.scene.add(sideMesh);
      }
    }
  }

  createSwitches() {
    var positions = [
      { x: 5.5, z: 2.8, r: 0.3, label: 'SW1' },
      { x: 2.0, z: -2.8, r: -0.2, label: 'SW2' },
      { x: -3.5, z: 2.5, r: 0.4, label: 'SW3' },
      { x: -5.5, z: -1.5, r: 0.1, label: 'SW4' },
    ];

    for (var i = 0; i < positions.length; i++) {
      var pos = positions[i];
      var g = new THREE.Group();

      var baseMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
      var base = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.08, 0.35), baseMat);
      base.position.y = 0.04;
      base.castShadow = true;
      g.add(base);

      var mechMat = new THREE.MeshStandardMaterial({
        color: 0xffd700, roughness: 0.4, metalness: 0.3, emissive: 0x664400, emissiveIntensity: 0.2
      });
      var mech = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.14, 0.2), mechMat);
      mech.position.y = 0.15;
      g.add(mech);

      var lever = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 6), mechMat);
      lever.position.set(0.15, 0.26, 0);
      lever.rotation.z = Math.PI / 4;
      g.add(lever);

      g.position.set(pos.x, 0.45, pos.z);
      g.rotation.y = pos.r;
      g.userData = { type: 'switch', label: pos.label };
      this.scene.add(g);
    }

    var towerMat = new THREE.MeshStandardMaterial({ color: 0xf0f0e8, roughness: 0.7 });
    var towerPositions = [
      { x: -4.5, z: -3.5 }, { x: 4.5, z: -3.5 }, { x: -4.5, z: 3.5 },
      { x: 4.5, z: 3.5 }, { x: 0.0, z: -4.0 }, { x: 0.0, z: 4.0 },
    ];

    for (var i = 0; i < towerPositions.length; i++) {
      var tp = towerPositions[i];
      var pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.8, 6), towerMat);
      pillar.position.set(tp.x, 0.85, tp.z);
      pillar.castShadow = true;
      this.scene.add(pillar);

      var crossbar = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.02), towerMat);
      crossbar.position.set(tp.x, 1.25, tp.z);
      this.scene.add(crossbar);
    }

    var orangeMat = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.6, metalness: 0.2 });
    var craneBase = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.15), orangeMat);
    craneBase.position.set(-8.5, 0.6, -1.5);
    craneBase.castShadow = true;
    this.scene.add(craneBase);

    var craneArm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.04, 0.04), orangeMat);
    craneArm.position.set(-8.5, 0.9, -1.5);
    this.scene.add(craneArm);
  }

  createReversor() {
    var g = new THREE.Group();

    var boxMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    var box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.35), boxMat);
    box.position.y = 0.06;
    box.castShadow = true;
    g.add(box);

    var stripMat = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.4, metalness: 0.3 });
    var strip = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.025, 0.3), stripMat);
    strip.position.y = 0.13;
    g.add(strip);

    var redMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.15 });
    var red = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), redMat);
    red.position.set(-0.2, 0.19, 0);
    g.add(red);
    this.reversorRed = red;

    var greenMat = new THREE.MeshStandardMaterial({ color: 0x00cc00, emissive: 0x00ff00, emissiveIntensity: 0.8 });
    var green = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), greenMat);
    green.position.set(0.2, 0.19, 0);
    g.add(green);
    this.reversorGreen = green;

    g.position.set(3.5, 0.45, -2.8);
    g.userData = { type: 'reversor' };
    this.reversor = g;
    this.scene.add(g);
  }

  createElectronics() {
    var eg = new THREE.Group();

    var bb = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.05, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0, roughness: 0.8 })
    );
    bb.position.set(-6, 0.52, 1.5);
    bb.castShadow = true;
    eg.add(bb);

    var ar = new THREE.Mesh(
      new THREE.BoxGeometry(0.7, 0.04, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x0066cc, roughness: 0.6 })
    );
    ar.position.set(-6, 0.52, 2.5);
    ar.castShadow = true;
    eg.add(ar);

    var wireColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff6600];
    for (var i = 0; i < 5; i++) {
      var w = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 1.2, 4),
        new THREE.MeshStandardMaterial({ color: wireColors[i] })
      );
      w.position.set(-6 + i * 0.12, 0.55, 2.0);
      w.rotation.x = Math.PI / 2;
      w.rotation.z = (Math.random() - 0.5) * 0.3;
      eg.add(w);
    }

    this.scene.add(eg);
  }

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

  setupClickHandler() {
    var self = this;
    var canvas = this.renderer.domElement;

    canvas.addEventListener('click', function (e) {
      if (!self.placementMode) return;
      var rect = canvas.getBoundingClientRect();
      self.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      self.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      self.raycaster.setFromCamera(self.mouse, self.camera);

      if (self.trackCurves.length === 0) return;
      var pts = self.trackCurves[0].curve.getPoints(300);
      var best = null, bestD = Infinity;
      for (var i = 0; i < pts.length; i++) {
        var pt = pts[i].clone(); pt.y = 0.5;
        var pr = new THREE.Vector3();
        self.raycaster.ray.closestPointToPoint(pt, pr);
        var d = pt.distanceTo(pr);
        if (d < bestD && d < 4.0) { bestD = d; best = i / pts.length; }
      }
      if (best !== null) {
        var ci = self.trainIdCounter % self.trainColors.length;
        self.addTrain(best, ci, self.selectedTrainType || 0);
        self.placementMode = false;
        self.hoverIndicator.material.opacity = 0;
        if (typeof self.onTrainPlaced === 'function') self.onTrainPlaced();
      }
    });

    canvas.addEventListener('mousemove', function (e) {
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

  setupReversorClick() {
    var self = this;
    var canvas = this.renderer.domElement;

    canvas.addEventListener('click', function (e) {
      if (!self.reversor || self.placementMode) return;
      var rect = canvas.getBoundingClientRect();
      self.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      self.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      self.raycaster.setFromCamera(self.mouse, self.camera);
      var intersects = self.raycaster.intersectObjects(self.reversor.children, true);
      if (intersects.length > 0) self.toggleReversor();
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
      if (this.trains[i].running) this.trains[i].direction *= -1;
    }

    if (typeof this.onReversorToggled === 'function') this.onReversorToggled(this.reversorState);
  }

  setupSwitchClick() {
    var self = this;
    var canvas = this.renderer.domElement;

    this.scene.traverse(function (c) {
      if (c.userData && c.userData.type === 'switch') {
        self.switches.push(c);
        self.switchStates[c.userData.label] = 'left';
      }
    });

    canvas.addEventListener('click', function (e) {
      if (self.placementMode) return;
      var rect = canvas.getBoundingClientRect();
      self.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      self.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      self.raycaster.setFromCamera(self.mouse, self.camera);

      for (var i = 0; i < self.switches.length; i++) {
        var sw = self.switches[i];
        var intersects = self.raycaster.intersectObjects(sw.children, true);
        if (intersects.length > 0) { self.toggleSwitch(sw); break; }
      }
    });
  }

  toggleSwitch(sw) {
    var label = sw.userData.label;
    var current = this.switchStates[label] || 'left';
    var next = current === 'left' ? 'right' : 'left';
    this.switchStates[label] = next;

    var lever = sw.children[2];
    if (lever) lever.rotation.z = next === 'left' ? Math.PI / 4 : -Math.PI / 4;

    var mech = sw.children[1];
    if (mech && mech.material) mech.material.emissiveIntensity = next === 'right' ? 0.6 : 0.2;

    if (typeof this.onSwitchToggled === 'function') this.onSwitchToggled(label, next);
  }

  setupCursorHandler() {
    var self = this;
    var canvas = this.renderer.domElement;

    canvas.addEventListener('mousemove', function (e) {
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
  // TRAIN CREATION
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

    a(new THREE.BoxGeometry(0.80, 0.04, 0.28), mU, 0, 0.10, 0);
    a(new THREE.BoxGeometry(0.76, 0.02, 0.012), mU, 0, 0.12, -0.13);
    a(new THREE.BoxGeometry(0.76, 0.02, 0.012), mU, 0, 0.12, 0.13);
    var ft = a(new THREE.CylinderGeometry(0.045, 0.045, 0.20, 10), mK, 0.05, 0.08, 0);
    ft.rotation.z = Math.PI / 2;
    a(new THREE.BoxGeometry(0.76, 0.18, 0.28), mB, 0, 0.22, 0).castShadow = true;
    a(new THREE.BoxGeometry(0.68, 0.10, 0.26), mB, 0, 0.35, 0).castShadow = true;
    a(new THREE.BoxGeometry(0.48, 0.07, 0.004), mA, 0.04, 0.24, -0.141);
    a(new THREE.BoxGeometry(0.48, 0.07, 0.004), mA, 0.04, 0.24, 0.141);
    a(new THREE.BoxGeometry(0.74, 0.018, 0.29), mS, 0, 0.33, 0);
    a(new THREE.BoxGeometry(0.74, 0.006, 0.29), mS, 0, 0.30, 0);
    a(new THREE.BoxGeometry(0.24, 0.12, 0.26), mA, -0.20, 0.44, 0).castShadow = true;
    a(new THREE.BoxGeometry(0.26, 0.025, 0.28), mK, -0.20, 0.51, 0);
    a(new THREE.BoxGeometry(0.012, 0.06, 0.16), mG, -0.32, 0.45, 0);
    a(new THREE.BoxGeometry(0.012, 0.05, 0.12), mG, -0.08, 0.45, 0);
    a(new THREE.BoxGeometry(0.14, 0.05, 0.01), mG, -0.20, 0.46, -0.131);
    a(new THREE.BoxGeometry(0.14, 0.05, 0.01), mG, -0.20, 0.46, 0.131);
    a(new THREE.BoxGeometry(0.07, 0.09, 0.24), mB, 0.37, 0.23, 0).castShadow = true;
    a(new THREE.SphereGeometry(0.02, 8, 8), mH, 0.41, 0.25, -0.09);
    a(new THREE.SphereGeometry(0.02, 8, 8), mH, 0.41, 0.25, 0.09);
    a(new THREE.SphereGeometry(0.015, 6, 6), mR, -0.33, 0.22, -0.09);
    a(new THREE.SphereGeometry(0.015, 6, 6), mR, -0.33, 0.22, 0.09);
    a(new THREE.CylinderGeometry(0.012, 0.015, 0.05, 8), mK, 0.14, 0.40, 0);
    a(new THREE.CylinderGeometry(0.018, 0.012, 0.006, 8), mC, 0.14, 0.43, 0);
    a(new THREE.CylinderGeometry(0.012, 0.015, 0.05, 8), mK, 0.20, 0.40, 0);
    a(new THREE.CylinderGeometry(0.018, 0.012, 0.006, 8), mC, 0.20, 0.43, 0);
    a(new THREE.BoxGeometry(0.62, 0.003, 0.003), hrMat, 0, 0.37, -0.145);
    a(new THREE.BoxGeometry(0.62, 0.003, 0.003), hrMat, 0, 0.37, 0.145);

    var wX = [-0.26, -0.01, 0.22];
    var wZ = [-0.14, 0.14];
    for (var wi = 0; wi < wX.length; wi++) {
      for (var wj = 0; wj < wZ.length; wj++) {
        var w = this._makeWheel(0.048, 0.030);
        w.position.set(wX[wi], 0.048, wZ[wj]);
        g.add(w);
      }
    }
    for (var wj = 0; wj < wZ.length; wj++) {
      var rz = wZ[wj] > 0 ? wZ[wj] + 0.016 : wZ[wj] - 0.016;
      a(new THREE.BoxGeometry(0.50, 0.010, 0.006), rodMat, -0.02, 0.048, rz);
    }
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

    a(new THREE.BoxGeometry(0.58, 0.03, 0.26), mU, 0, 0.09, 0);
    a(new THREE.BoxGeometry(0.56, 0.18, 0.25), mB, 0, 0.20, 0).castShadow = true;
    a(new THREE.BoxGeometry(0.54, 0.02, 0.26), mA, 0, 0.31, 0);
    a(new THREE.BoxGeometry(0.52, 0.012, 0.26), mA, 0, 0.28, 0);
    for (var zz = 0; zz < 2; zz++) {
      var z = zz === 0 ? -0.126 : 0.126;
      for (var xi = -2; xi <= 2; xi++) a(new THREE.BoxGeometry(0.006, 0.16, 0.003), mA, xi * 0.10, 0.20, z);
    }
    for (var zz = 0; zz < 2; zz++) {
      var z = zz === 0 ? -0.127 : 0.127;
      for (var wi = -2; wi <= 2; wi++) a(new THREE.BoxGeometry(0.04, 0.04, 0.003), mW, wi * 0.10, 0.24, z);
    }
    var wX = [-0.18, 0.18];
    var wZ = [-0.12, 0.12];
    for (var wi = 0; wi < wX.length; wi++) {
      for (var wj = 0; wj < wZ.length; wj++) {
        var w = this._makeWheel(0.042, 0.026);
        w.position.set(wX[wi], 0.042, wZ[wj]);
        g.add(w);
      }
    }
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
      id, group, parts, type, color,
      progress: progressOnTrack || 0,
      targetSpeed: 0, currentSpeed: 0,
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
    train.group.traverse(function (c) {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach(function (m) { m.dispose(); });
        else c.material.dispose();
      }
    });
    this.trains.splice(idx, 1);
    if (typeof this.onTrainRemoved === 'function') this.onTrainRemoved(id);
  }

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

  _placeTrainOnTrack(train) {
    var curve = this.trackCurves[train.trackIndex].curve;
    var p = ((train.progress % 1) + 1) % 1;

    for (var i = 0; i < train.parts.length; i++) {
      var t = ((p - i * train.partGap) % 1 + 1) % 1;
      var point = curve.getPointAt(t);
      var tangent = curve.getTangentAt(t);

      var part = train.parts[i];
      part.position.set(point.x, point.y + 0.048, point.z);

      var ahead = new THREE.Vector3().copy(point).add(tangent);
      part.lookAt(ahead);
      part.rotateY(Math.PI / 2);

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

  animateToView(view) {
    var views = {
      overview: { x: 0, y: 16, z: 20, lx: 0, ly: 0, lz: 0 },
      mina: { x: -8, y: 4, z: 3, lx: -5, ly: 0, lz: 1 },
      porto: { x: 8, y: 4, z: 3, lx: 6, ly: 0, lz: -2 },
      trem: { x: 0, y: 4, z: 9, lx: 0, ly: 0.5, lz: 0 },
      mine: { x: -8, y: 4, z: 3, lx: -5, ly: 0, lz: 1 },
      port: { x: 8, y: 4, z: 3, lx: 6, ly: 0, lz: -2 }
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

  animate() {
    var self = this;
    this.animationId = requestAnimationFrame(function () { self.animate(); });

    var dt = this.clock.getDelta();
    var time = this.clock.getElapsedTime();

    if (this.particles) this.particles.rotation.y = time * 0.01;

    for (var i = 0; i < this.trains.length; i++) {
      var train = this.trains[i];
      var rate = train.running ? 1.2 : 2.0;
      train.currentSpeed += (train.targetSpeed - train.currentSpeed) * Math.min(rate * dt, 1);
      if (Math.abs(train.currentSpeed) < 0.0001) train.currentSpeed = 0;
      train.progress += train.currentSpeed * train.direction;
      this._placeTrainOnTrack(train);
    }

    var reversorGlow = 0.7 + Math.sin(time * 3) * 0.3;
    this.scene.traverse(function (c) {
      if (c.userData && c.userData.type === 'switch') {
        c.scale.setScalar(1 + Math.sin(time * 2.5 + c.position.x) * 0.03);
      }
      if (c.userData && c.userData.type === 'reversor') {
        c.children.forEach(function (child) {
          if (child.material && child.material.emissive) {
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
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }

  _spawnDefaultTrains() {
    var configs = [
      { colorIndex: 0, typeIndex: 0, progress: 0.0, speed: 0.04, direction: 1 },
      { colorIndex: 1, typeIndex: 1, progress: 0.35, speed: 0.03, direction: 1 },
      { colorIndex: 2, typeIndex: 2, progress: 0.65, speed: 0.05, direction: -1 },
    ];
    for (var i = 0; i < configs.length; i++) {
      var cfg = configs[i];
      var train = this.addTrain(cfg.progress, cfg.colorIndex, cfg.typeIndex);
      train.targetSpeed = cfg.speed;
      train.currentSpeed = cfg.speed;
      train.direction = cfg.direction;
      train.running = true;
      this._placeTrainOnTrack(train);
      if (typeof this.onTrainToggled === 'function') this.onTrainToggled(train);
    }
  }
}
