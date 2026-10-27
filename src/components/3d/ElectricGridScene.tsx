import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Zap, ShieldCheck, Activity, Sun, Layers, Eye, ChevronDown, ChevronUp } from 'lucide-react';

type ViewMode = 'grid' | 'transformer' | 'meter' | 'solar';

export default function ElectricGridScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [gridFrequency, setGridFrequency] = useState(50.02);
  const [substationLoad, setSubstationLoad] = useState(74); // %

  const sceneRef = useRef<{
    camera: THREE.PerspectiveCamera;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    targetPos: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    currentLookAt: THREE.Vector3;
    electronParticles: THREE.Points;
    electronPositions: Float32Array;
    electronCurves: THREE.CatmullRomCurve3[];
    electronProgress: number[];
    isSoftwareGl: boolean;
  } | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Scene, Camera, Renderer
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x030712, 0.022);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(14, 10, 18);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // 3. Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig
    const ambientLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.4);
    keyLight.position.set(15, 25, 12);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const cyanRim = new THREE.DirectionalLight(0x06b6d4, 1.8);
    cyanRim.position.set(-15, 12, -15);
    scene.add(cyanRim);

    // 5. Ground Plane with Radial Grid
    const groundGeo = new THREE.PlaneGeometry(80, 80);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x050b14,
      roughness: 0.85,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = !isSoftwareGl;
    scene.add(ground);

    // Circular contact grid decal
    const gridHelper = new THREE.GridHelper(60, 30, 0x0284c7, 0x1e293b);
    gridHelper.position.y = 0.02;
    scene.add(gridHelper);

    // 6. Composite 3D Models (Three.js Group of 3-12 parts)

    // A. Substation High-Voltage Transformer Unit
    const transformerGroup = new THREE.Group();
    transformerGroup.position.set(-4, 0, 0);

    // Part 1: Concrete plinth base
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, metalness: 0.1 });
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.6, 3.2), baseMat);
    plinth.position.y = 0.3;
    transformerGroup.add(plinth);

    // Part 2: Main steel tank
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.3, metalness: 0.8 });
    const mainTank = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.8, 2.2), tankMat);
    mainTank.position.y = 2.0;
    transformerGroup.add(mainTank);

    // Part 3: Radiator cooling fins
    const finMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4, metalness: 0.7 });
    for (let f = -1.2; f <= 1.2; f += 0.3) {
      const leftFin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 0.8), finMat);
      leftFin.position.set(-1.8, 2.0, f);
      transformerGroup.add(leftFin);

      const rightFin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 0.8), finMat);
      rightFin.position.set(1.8, 2.0, f);
      transformerGroup.add(rightFin);
    }

    // Part 4: Oil conservator drum on top
    const drumMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35, metalness: 0.75 });
    const conservatorDrum = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2.6, 24), drumMat);
    conservatorDrum.rotation.z = Math.PI / 2;
    conservatorDrum.position.set(0, 3.8, -0.6);
    transformerGroup.add(conservatorDrum);

    // Part 5: Porcelain insulator bushings (3 phases: R, Y, B)
    const bushingMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.2, metalness: 0.5 });
    const discMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.1, metalness: 0.3 });
    const phaseOffsets = [-0.8, 0, 0.8];
    phaseOffsets.forEach((xPos) => {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.4, 16), bushingMat);
      stem.position.set(xPos, 4.1, 0.3);
      transformerGroup.add(stem);

      // Insulator discs
      for (let d = 0; d < 3; d++) {
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 16), discMat);
        disc.position.set(xPos, 3.6 + d * 0.3, 0.3);
        transformerGroup.add(disc);
      }
    });

    scene.add(transformerGroup);

    // B. High-Tension Transmission Pylon (Lattice Tower)
    const pylonGroup = new THREE.Group();
    pylonGroup.position.set(5, 0, -4);

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.85 });

    // 4 legs tapering up
    const legGeo = new THREE.CylinderGeometry(0.08, 0.12, 8.5, 8);
    const leg1 = new THREE.Mesh(legGeo, steelMat);
    leg1.position.set(-0.9, 4.2, -0.9);
    leg1.rotation.z = -0.06;
    leg1.rotation.x = 0.06;
    pylonGroup.add(leg1);

    const leg2 = new THREE.Mesh(legGeo, steelMat);
    leg2.position.set(0.9, 4.2, -0.9);
    leg2.rotation.z = 0.06;
    leg2.rotation.x = 0.06;
    pylonGroup.add(leg2);

    const leg3 = new THREE.Mesh(legGeo, steelMat);
    leg3.position.set(-0.9, 4.2, 0.9);
    leg3.rotation.z = -0.06;
    leg3.rotation.x = -0.06;
    pylonGroup.add(leg3);

    const leg4 = new THREE.Mesh(legGeo, steelMat);
    leg4.position.set(0.9, 4.2, 0.9);
    leg4.rotation.z = 0.06;
    leg4.rotation.x = -0.06;
    pylonGroup.add(leg4);

    // Crossarm structure
    const arm1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 0.2), steelMat);
    arm1.position.set(0, 6.8, 0);
    pylonGroup.add(arm1);

    const arm2 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.16, 0.2), steelMat);
    arm2.position.set(0, 8.2, 0);
    pylonGroup.add(arm2);

    scene.add(pylonGroup);

    // C. Smart Distribution Node & Digital Meter Unit
    const nodeGroup = new THREE.Group();
    nodeGroup.position.set(3, 0, 5);

    const cabinetMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35, metalness: 0.8 });
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.4, 0.8), cabinetMat);
    cabinet.position.y = 1.8;
    nodeGroup.add(cabinet);

    // Digital Smart Display Window (Electric Cyan glow)
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), screenMat);
    screen.position.set(0, 2.3, 0.41);
    nodeGroup.add(screen);

    // Meter status LED (steady cyan)
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), ledMat);
    led.position.set(0.35, 2.3, 0.42);
    nodeGroup.add(led);

    // Mounting post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.8, 12), steelMat);
    post.position.y = 0.9;
    nodeGroup.add(post);

    scene.add(nodeGroup);

    // D. Rooftop Solar Panel Canopy Array (Renewable Microgrid)
    const solarGroup = new THREE.Group();
    solarGroup.position.set(-6, 0, 6);

    const solarFrameMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.7 });
    const solarCellMat = new THREE.MeshStandardMaterial({ color: 0x0c4a6e, roughness: 0.15, metalness: 0.85 });

    for (let s = 0; s < 3; s++) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 1.2), solarCellMat);
      panel.position.set(s * 2.0 - 2.0, 1.8, 0);
      panel.rotation.x = -Math.PI / 6;
      solarGroup.add(panel);

      const panelLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8), solarFrameMat);
      panelLeg.position.set(s * 2.0 - 2.0, 0.9, 0);
      solarGroup.add(panelLeg);
    }
    scene.add(solarGroup);

    // 7. Power Lines (Cables) with Dynamic Pulsing Electron Particles
    const cableMat = new THREE.LineBasicMaterial({ color: 0x0284c7, transparent: true, opacity: 0.6 });

    // Cable Curves connecting Transformer -> Pylon -> Distribution Node
    const curve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4, 4.8, 0.3),
      new THREE.Vector3(0, 5.8, -1.8),
      new THREE.Vector3(5, 6.8, -4),
    ]);
    const cableGeo1 = new THREE.BufferGeometry().setFromPoints(curve1.getPoints(50));
    scene.add(new THREE.Line(cableGeo1, cableMat));

    const curve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(5, 6.8, -4),
      new THREE.Vector3(4, 4.5, 0.5),
      new THREE.Vector3(3, 2.8, 5),
    ]);
    const cableGeo2 = new THREE.BufferGeometry().setFromPoints(curve2.getPoints(50));
    scene.add(new THREE.Line(cableGeo2, cableMat));

    const curve3 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-6, 2.0, 6),
      new THREE.Vector3(-2, 2.8, 5.5),
      new THREE.Vector3(3, 2.4, 5),
    ]);
    const cableGeo3 = new THREE.BufferGeometry().setFromPoints(curve3.getPoints(50));
    scene.add(new THREE.Line(cableGeo3, cableMat));

    // High Voltage Electron Particle Stream
    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleCurves = [curve1, curve2, curve3];
    const particleProgress: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      particleProgress.push(Math.random());
      particlePositions[i * 3] = 0;
      particlePositions[i * 3 + 1] = 0;
      particlePositions[i * 3 + 2] = 0;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.28,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    const electronParticles = new THREE.Points(particleGeo, particleMat);
    scene.add(electronParticles);

    // Initial camera targets
    const targetPos = new THREE.Vector3(14, 10, 18);
    const targetLookAt = new THREE.Vector3(0, 2.5, 0);
    const currentLookAt = new THREE.Vector3(0, 2.5, 0);

    sceneRef.current = {
      camera,
      scene,
      renderer,
      targetPos,
      targetLookAt,
      currentLookAt,
      electronParticles,
      electronPositions: particlePositions,
      electronCurves: particleCurves,
      electronProgress: particleProgress,
      isSoftwareGl,
    };

    // 8. Animation & Damping Render Loop
    let frameId = 0;
    let clock = new THREE.Clock();

    function renderLoop() {
      const delta = Math.min(clock.getDelta(), 0.1);

      // Smooth camera interpolation with exponential damping
      if (sceneRef.current) {
        const { camera, targetPos, targetLookAt, currentLookAt, electronPositions, electronCurves, electronProgress, electronParticles } = sceneRef.current;

        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetPos.x, 3.0, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, targetPos.y, 3.0, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetPos.z, 3.0, delta);

        currentLookAt.x = THREE.MathUtils.damp(currentLookAt.x, targetLookAt.x, 3.0, delta);
        currentLookAt.y = THREE.MathUtils.damp(currentLookAt.y, targetLookAt.y, 3.0, delta);
        currentLookAt.z = THREE.MathUtils.damp(currentLookAt.z, targetLookAt.z, 3.0, delta);
        camera.lookAt(currentLookAt);

        // Animate electric particles along cables
        const speed = 0.25;
        for (let i = 0; i < particleCount; i++) {
          electronProgress[i] = (electronProgress[i] + speed * delta) % 1.0;
          const curveIdx = i % electronCurves.length;
          const pt = electronCurves[curveIdx].getPointAt(electronProgress[i]);

          electronPositions[i * 3] = pt.x;
          electronPositions[i * 3 + 1] = pt.y;
          electronPositions[i * 3 + 2] = pt.z;
        }
        electronParticles.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(renderLoop);
    }

    frameId = requestAnimationFrame(renderLoop);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Subtle realistic grid frequency fluctuation interval
    const freqInterval = setInterval(() => {
      setGridFrequency(Number((50.0 + (Math.random() * 0.08 - 0.04)).toFixed(2)));
      setSubstationLoad(Math.floor(72 + Math.random() * 6));
    }, 3000);

    return () => {
      clearInterval(freqInterval);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Camera presets when switching viewMode
  useEffect(() => {
    if (!sceneRef.current) return;
    const { targetPos, targetLookAt } = sceneRef.current;

    switch (viewMode) {
      case 'grid':
        targetPos.set(14, 10, 18);
        targetLookAt.set(0, 2.5, 0);
        break;
      case 'transformer':
        targetPos.set(-4, 5.5, 6);
        targetLookAt.set(-4, 2.5, 0);
        break;
      case 'meter':
        targetPos.set(4.5, 2.6, 8.5);
        targetLookAt.set(3, 2.2, 5);
        break;
      case 'solar':
        targetPos.set(-7, 4.5, 10);
        targetLookAt.set(-5, 1.8, 6);
        break;
    }
  }, [viewMode]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* 3D WebGL Canvas Mount (Isolated from HUD overlays) */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Top Overlay Spec Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-lg px-3.5 py-2 pointer-events-auto shadow-lg">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold tracking-wide text-slate-200 uppercase">Interactive Grid Telemetry</span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-4 text-xs font-mono tabular-nums text-slate-300">
            <span>Freq: <strong className="text-cyan-400 font-semibold">{gridFrequency} Hz</strong></span>
            <span>Substation Load: <strong className="text-emerald-400 font-semibold">{substationLoad}%</strong></span>
            <span className="hidden sm:inline">Phases: <strong className="text-amber-400">R-Y-B Synchronous</strong></span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 pointer-events-auto text-xs text-slate-400">
          <Eye className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real-Time 3D Digital Twin</span>
        </div>
      </div>

      {/* Ergonomic Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-10">
        <div className="bg-slate-900/95 border border-slate-800/90 rounded-xl shadow-2xl p-2.5 transition-all duration-200">
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-slate-800/60">
            <span className="text-xs font-medium text-slate-400 px-1">Simulation Perspectives</span>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2 py-0.5 rounded hover:bg-slate-800/60 transition-colors"
            >
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{isCollapsed ? 'Show Controls' : 'Hide'}</span>
            </button>
          </div>

          {!isCollapsed && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'grid'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Grid Overview</span>
              </button>

              <button
                onClick={() => setViewMode('transformer')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'transformer'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Transformer</span>
              </button>

              <button
                onClick={() => setViewMode('meter')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'meter'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Smart Meter</span>
              </button>

              <button
                onClick={() => setViewMode('solar')}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'solar'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 shrink-0" />
                <span className="whitespace-nowrap">Solar Microgrid</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
