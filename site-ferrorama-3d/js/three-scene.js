/* ============================================
   THREE.JS SCENE - 3D MAQUETTE
   Baseado nas fotos reais da maquete
   ============================================ */

class MaquetteScene {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Container not found:', containerId);
      return;
    }
    
    // Check if container has dimensions
    if (this.container.clientWidth === 0 || this.container.clientHeight === 0) {
      console.error('Container has no dimensions:', containerId);
      return;
    }
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.maquette = null;
    this.train = null;
    this.animationId = null;
    this.clock = new THREE.Clock();
    this.trackPoints = []; // Pontos do trilho para o trem seguir
    
    this.init();
  }
  
  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 20, 60);
    
    // Camera
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    this.camera.position.set(0, 18, 18);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true 
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    
    // Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.1;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 40;
    this.controls.target.set(0, 0, 0);
    
    // Lights
    this.setupLights();
    
    // Create maquette
    this.createMaquette();
    
    // Create particles
    this.createParticles();
    
    // Events
    window.addEventListener('resize', () => this.onResize());
    
    // Start animation
    this.animate();
  }
  
  setupLights() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambient);
    
    // Main directional light (sol)
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
    
    // Blue neon light
    const blueLight = new THREE.PointLight(0x00d4ff, 1.5, 40);
    blueLight.position.set(-10, 8, 5);
    this.scene.add(blueLight);
    
    // Green accent light
    const greenLight = new THREE.PointLight(0x00ffb2, 1, 35);
    greenLight.position.set(10, 6, -5);
    this.scene.add(greenLight);
    
    // Orange accent light
    const orangeLight = new THREE.PointLight(0xff6b35, 0.8, 25);
    orangeLight.position.set(0, 5, 10);
    this.scene.add(orangeLight);
  }
  
  createMaquette() {
    this.maquette = new THREE.Group();
    
    // Base (MDF/Table) - Retangular longa como na foto
    this.createBase();
    
    // Trilhos - Layout oval com ramais
    this.createTrackSystem();
    
    // Suportes elevados (cardboard)
    this.createElevatedSupports();
    
    // Chaveamentos (switches amarelos)
    this.createSwitches();
    
    // Trem azul
    this.createTrain();
    
    // Componentes eletrônicos
    this.createElectronics();
    
    // Estruturas/objetos na mesa
    this.createStructures();
    
    this.scene.add(this.maquette);
  }
  
  createBase() {
    // Mesa principal (MDF)
    const tableGeometry = new THREE.BoxGeometry(24, 0.5, 10);
    const tableMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd4a574, // Cor do MDF/cartão
      roughness: 0.85,
      metalness: 0.05
    });
    const table = new THREE.Mesh(tableGeometry, tableMaterial);
    table.position.y = -0.25;
    table.receiveShadow = true;
    table.castShadow = true;
    this.maquette.add(table);
    
    // Bordas da mesa
    const edgeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xc49464,
      roughness: 0.9
    });
    
    // Bordas laterais
    [-5, 5].forEach(z => {
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(24, 0.3, 0.3),
        edgeMaterial
      );
      edge.position.set(0, 0.15, z);
      this.maquette.add(edge);
    });
    
    [-12, 12].forEach(x => {
      const edge = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.3, 10),
        edgeMaterial
      );
      edge.position.set(x, 0.15, 0);
      this.maquette.add(edge);
    });
  }
  
  createTrackSystem() {
    const trackMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2a2a2a,
      metalness: 0.7,
      roughness: 0.3
    });
    
    const sleeperMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3d3d3d,
      roughness: 0.8
    });
    
    // Criar trilhos seguindo o layout real (oval com ramais)
    this.trackPoints = [];
    
    // Loop principal oval
    const createOvalTrack = (cx, cz, rx, ry, segments = 64) => {
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = cx + Math.cos(angle) * rx;
        const z = cz + Math.sin(angle) * ry;
        points.push(new THREE.Vector3(x, 0.25, z));
      }
      return points;
    };
    
    // Loop principal
    const mainLoop = createOvalTrack(0, 0, 9, 3.5);
    this.trackPoints = mainLoop;
    
    // Renderizar trilhos do loop principal
    this.renderTrackFromPoints(mainLoop, trackMaterial, sleeperMaterial);
    
    // Ramal superior (curva para elevated section)
    const branchUpper = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = -4 + t * 3;
      const z = -3.5 + Math.sin(t * Math.PI) * -1.5;
      const y = 0.25 + t * 1.5; // Elevação
      branchUpper.push(new THREE.Vector3(x, y, z));
    }
    this.renderTrackFromPoints(branchUpper, trackMaterial, sleeperMaterial, true);
    
    // Ramal inferior
    const branchLower = [];
    for (let i = 0; i <= 15; i++) {
      const t = i / 15;
      const x = 2 + t * 4;
      const z = 3.5 - t * 1;
      branchLower.push(new THREE.Vector3(x, 0.25, z));
    }
    this.renderTrackFromPoints(branchLower, trackMaterial, sleeperMaterial);
    
    // Conexão diagonal
    const diagonal = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x = -4 + t * 8;
      const z = -2 + t * 4;
      diagonal.push(new THREE.Vector3(x, 0.25, z));
    }
    this.renderTrackFromPoints(diagonal, trackMaterial, sleeperMaterial);
  }
  
  renderTrackFromPoints(points, trackMaterial, sleeperMaterial, elevated = false) {
    // Criar trilhos contínuos usando tube geometry
    if (points.length < 2) return;
    
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 100, 0.08, 8, false);
    const track = new THREE.Mesh(tubeGeometry, trackMaterial);
    track.castShadow = true;
    this.maquette.add(track);
    
    // Segundo trilho (par)
    const offset = 0.35;
    const points2 = points.map(p => new THREE.Vector3(p.x, p.y, p.z + offset));
    const curve2 = new THREE.CatmullRomCurve3(points2);
    const tubeGeometry2 = new THREE.TubeGeometry(curve2, 100, 0.08, 8, false);
    const track2 = new THREE.Mesh(tubeGeometry2, trackMaterial);
    track2.castShadow = true;
    this.maquette.add(track2);
    
    // Dormentes
    for (let i = 0; i < points.length - 1; i += 2) {
      const p = points[i];
      const p2 = points2[i];
      if (p && p2) {
        const midX = (p.x + p2.x) / 2;
        const midY = (p.y + p2.y) / 2;
        const midZ = (p.z + p2.z) / 2;
        
        const sleeper = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.05, 0.5),
          sleeperMaterial
        );
        sleeper.position.set(midX, midY - 0.02, midZ);
        
        // Rotacionar dormentes para seguir a direção
        if (i < points.length - 2) {
          const next = points[i + 1];
          const angle = Math.atan2(next.z - p.z, next.x - p.x);
          sleeper.rotation.y = -angle;
        }
        
        this.maquette.add(sleeper);
      }
    }
  }
  
  createElevatedSupports() {
    const supportMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xc49464, // Cor do cardboard
      roughness: 0.9
    });
    
    // Suportes triangulares como nas fotos
    const supportPositions = [
      { x: -5, z: -4.5, h: 1.5 },
      { x: -3, z: -5, h: 1.8 },
      { x: -1, z: -4.8, h: 2 },
      { x: 1, z: -4.5, h: 1.8 },
      { x: 3, z: -4, h: 1.5 },
    ];
    
    supportPositions.forEach(pos => {
      // Suporte triangular
      const shape = new THREE.Shape();
      shape.moveTo(-0.4, 0);
      shape.lineTo(0.4, 0);
      shape.lineTo(0, pos.h);
      shape.lineTo(-0.4, 0);
      
      const extrudeSettings = { depth: 0.3, bevelEnabled: false };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const support = new THREE.Mesh(geometry, supportMaterial);
      support.position.set(pos.x, 0, pos.z);
      support.castShadow = true;
      this.maquette.add(support);
    });
    
    // Plataforma elevada
    const platformGeometry = new THREE.BoxGeometry(8, 0.15, 1.5);
    const platform = new THREE.Mesh(platformGeometry, supportMaterial);
    platform.position.set(-1, 1.8, -4.5);
    platform.castShadow = true;
    this.maquette.add(platform);
  }
  
  createSwitches() {
    const switchMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffd700, // Amarelo como nas fotos
      metalness: 0.3,
      roughness: 0.5
    });
    
    const baseMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2a2a2a,
      roughness: 0.7
    });
    
    // Posições dos chaveamentos (pontos de troca)
    const switchPositions = [
      { x: -6, z: 0, rotation: 0 },
      { x: 0, z: -3.5, rotation: Math.PI / 4 },
      { x: 4, z: 2, rotation: -Math.PI / 6 },
      { x: -2, z: 3, rotation: Math.PI / 3 },
    ];
    
    switchPositions.forEach(pos => {
      const switchGroup = new THREE.Group();
      
      // Base preta
      const base = new THREE.Mesh(
        new THREE.BoxGeometry(0.6, 0.15, 0.4),
        baseMaterial
      );
      base.position.y = 0.1;
      switchGroup.add(base);
      
      // Mecanismo amarelo
      const mechanism = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.2, 0.25),
        switchMaterial
      );
      mechanism.position.y = 0.25;
      switchGroup.add(mechanism);
      
      // Alavanca
      const lever = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.3),
        switchMaterial
      );
      lever.position.set(0, 0.45, 0);
      lever.rotation.z = Math.PI / 6;
      switchGroup.add(lever);
      
      switchGroup.position.set(pos.x, 0, pos.z);
      switchGroup.rotation.y = pos.rotation;
      switchGroup.userData = { type: 'switch' };
      this.maquette.add(switchGroup);
    });
  }
  
  createTrain() {
    this.train = new THREE.Group();
    
    // Locomotiva azul (como na foto)
    const locoGeometry = new THREE.BoxGeometry(1.8, 0.5, 0.5);
    const locoMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1e3a5f, // Azul escuro
      metalness: 0.4,
      roughness: 0.5
    });
    const loco = new THREE.Mesh(locoGeometry, locoMaterial);
    loco.position.y = 0.35;
    loco.castShadow = true;
    this.train.add(loco);
    
    // Cabine
    const cabinGeometry = new THREE.BoxGeometry(0.6, 0.45, 0.45);
    const cabinMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2196f3, // Azul mais claro
      metalness: 0.3
    });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(-0.5, 0.7, 0);
    this.train.add(cabin);
    
    // Detalhe amarelo (como nas fotos)
    const detailGeometry = new THREE.BoxGeometry(1.6, 0.08, 0.52);
    const detailMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700 });
    const detail = new THREE.Mesh(detailGeometry, detailMaterial);
    detail.position.y = 0.6;
    this.train.add(detail);
    
    // Rodas
    const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.08);
    const wheelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x1a1a1a,
      metalness: 0.8
    });
    
    for (let x = -0.5; x <= 0.5; x += 0.5) {
      for (let z = -0.25; z <= 0.25; z += 0.5) {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x, 0.15, z);
        this.train.add(wheel);
      }
    }
    
    // Faróis
    const headlightGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const headlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffff99 });
    
    [-0.15, 0.15].forEach(z => {
      const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
      headlight.position.set(0.9, 0.35, z);
      this.train.add(headlight);
    });
    
    this.train.position.set(8, 0, 0);
    this.train.userData = { type: 'train', progress: 0 };
    this.maquette.add(this.train);
  }
  
  createElectronics() {
    // Área de eletrônicos (como nas fotos)
    const electronicsGroup = new THREE.Group();
    
    // Breadboard
    const breadboardGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.8);
    const breadboardMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xf5f5f5,
      roughness: 0.8
    });
    const breadboard = new THREE.Mesh(breadboardGeometry, breadboardMaterial);
    breadboard.position.set(-8, 0.15, 2);
    electronicsGroup.add(breadboard);
    
    // Arduino
    const arduinoGeometry = new THREE.BoxGeometry(1, 0.08, 0.6);
    const arduinoMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x0066cc,
      roughness: 0.6
    });
    const arduino = new THREE.Mesh(arduinoGeometry, arduinoMaterial);
    arduino.position.set(-8, 0.15, 3.5);
    electronicsGroup.add(arduino);
    
    // Fios coloridos
    const wireColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
    
    for (let i = 0; i < 5; i++) {
      const wireGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2);
      const wireMaterial = new THREE.MeshStandardMaterial({ color: wireColors[i] });
      const wire = new THREE.Mesh(wireGeometry, wireMaterial);
      wire.position.set(-8 + i * 0.2, 0.2, 2.75);
      wire.rotation.x = Math.PI / 2;
      wire.rotation.z = Math.random() * 0.5 - 0.25;
      electronicsGroup.add(wire);
    }
    
    this.maquette.add(electronicsGroup);
  }
  
  createStructures() {
    // Estruturas/objetos vistos nas fotos
    
    // Estrutura amarela (guindaste pequeno)
    const craneGroup = new THREE.Group();
    
    const craneBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.3, 0.4),
      new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
    );
    craneBase.position.y = 0.15;
    craneGroup.add(craneBase);
    
    const craneArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 1.5, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    craneArm.position.set(0, 1, 0);
    craneGroup.add(craneArm);
    
    const craneHook = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    craneHook.position.set(0.4, 1.8, 0);
    craneGroup.add(craneHook);
    
    craneGroup.position.set(-6, 0, -1);
    this.maquette.add(craneGroup);
    
    // Outra estrutura amarela
    const structure2 = new THREE.Group();
    
    const base2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    base2.position.y = 0.2;
    structure2.add(base2);
    
    const pole2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1),
      new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    pole2.position.y = 0.9;
    structure2.add(pole2);
    
    structure2.position.set(2, 0, -2);
    this.maquette.add(structure2);
    
    // Caixas/objetos espalhados
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
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 300;
    const posArray = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 40;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.4
    });
    
    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.scene.add(this.particles);
  }
  
  animateToView(view) {
    const views = {
      overview: { x: 0, y: 18, z: 18, lookAt: { x: 0, y: 0, z: 0 } },
      mine: { x: -12, y: 6, z: 5, lookAt: { x: -6, y: 0, z: -1 } },
      port: { x: 12, y: 6, z: 5, lookAt: { x: 8, y: 0, z: 0 } },
      train: { x: 0, y: 5, z: 8, lookAt: { x: 0, y: 0, z: 0 } }
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
      
      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      }
    };
    
    animateCamera();
  }
  
  getPointOnTrack(t) {
    if (this.trackPoints.length < 2) return new THREE.Vector3(0, 0.25, 0);
    
    const totalPoints = this.trackPoints.length;
    const index = Math.floor(t * (totalPoints - 1));
    const nextIndex = Math.min(index + 1, totalPoints - 1);
    const localT = (t * (totalPoints - 1)) - index;
    
    const p1 = this.trackPoints[index];
    const p2 = this.trackPoints[nextIndex];
    
    return new THREE.Vector3(
      p1.x + (p2.x - p1.x) * localT,
      p1.y + (p2.y - p1.y) * localT,
      p1.z + (p2.z - p1.z) * localT
    );
  }
  
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    
    const time = this.clock.getElapsedTime();
    
    // Rotacionar partículas
    if (this.particles) {
      this.particles.rotation.y = time * 0.03;
    }
    
    // Mover trem ao longo dos trilhos
    if (this.train && this.trackPoints.length > 0) {
      const speed = 0.03;
      const progress = (time * speed) % 1;
      
      const pos = this.getPointOnTrack(progress);
      this.train.position.set(pos.x, pos.y, pos.z);
      
      // Calcular rotação para seguir os trilhos
      const nextPos = this.getPointOnTrack((progress + 0.01) % 1);
      const angle = Math.atan2(nextPos.z - pos.z, nextPos.x - pos.x);
      this.train.rotation.y = -angle;
      
      // Leve balanço
      this.train.position.y += Math.sin(time * 8) * 0.01;
    }
    
    // Animar switches (piscar)
    this.maquette.children.forEach(child => {
      if (child.userData.type === 'switch') {
        const scale = 1 + Math.sin(time * 2 + child.position.x) * 0.05;
        child.scale.setScalar(scale);
      }
    });
    
    // Update controls
    this.controls.update();
    
    // Render
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
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}

// Export for use
window.MaquetteScene = MaquetteScene;
