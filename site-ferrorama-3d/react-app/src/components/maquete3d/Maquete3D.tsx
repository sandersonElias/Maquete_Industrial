import { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows, Stars, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { MODULOS, PALETA, PASSOS_TOUR, TELEMETRIA, CAMERAS_POV } from './modulos';
import {
  Base,
  Ferrovia,
  Mineradora,
  Porto,
  Controle,
  GrupoInterativo,
} from './Modulos3D';
import { Cenario3D } from './Cenario3D';
import { CameraPov, type PovId } from './CameraPov';
import { MaqueteBlender } from './MaqueteBlender';
import { usePrefersReducedMotion } from '../../lib/motion';

import { LAYOUT } from './geometria';

/** Posições de cada módulo sobre a placa. */
const POSICOES: Record<string, [number, number, number]> = LAYOUT;

const CAMERA_INICIAL = new THREE.Vector3(24, 18, 28);
const COR_NOITE = '#040508';
/** Céu de oficina — cinza-azulado, sem estourar o PBR. */
const COR_DIA = '#5a7a96';

/* ============================================================
   Câmera: aproxima suavemente do módulo selecionado
   ============================================================ */

function CameraFoco({
  selecionado,
  controlsRef,
  tourAtivo,
}: {
  selecionado: string | null;
  controlsRef: React.RefObject<any>;
  tourAtivo: boolean;
}) {
  const { camera } = useThree();
  const alvoPos = useRef(new THREE.Vector3());
  const alvoOlhar = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (tourAtivo) return;
    const mod = MODULOS.find((m) => m.id === selecionado);
    if (mod) {
      const [x, , z] = POSICOES[mod.id];
      alvoOlhar.current.set(x, 0.6, z);
      alvoPos.current.set(x + 9, 7.2, z + 10);
    } else {
      alvoOlhar.current.set(0, 0, 0);
      alvoPos.current.copy(CAMERA_INICIAL);
    }
  }, [selecionado, tourAtivo]);

  useFrame((_, delta) => {
    if (tourAtivo) return;
    const k = Math.min(delta * 2.4, 1);
    camera.position.lerp(alvoPos.current, k);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(alvoOlhar.current, k);
      controlsRef.current.update();
    }
  });

  return null;
}

/* ============================================================
   Tour cinematográfico — orbita cada módulo automaticamente
   ============================================================ */

function CameraTour({
  passo,
  ativo,
}: {
  passo: number;
  ativo: boolean;
}) {
  const { camera } = useThree();
  const tempo = useRef(0);
  const alvoPos = useRef(new THREE.Vector3());
  const alvoOlhar = useRef(new THREE.Vector3());

  const calcularPosicao = (passoAtual: number, t: number) => {
    const config = PASSOS_TOUR[passoAtual];
    const modId = config.moduloId;
    const ang = t * 0.28;

    if (modId) {
      const [x, , z] = POSICOES[modId];
      const raio = modId === 'ferrovia' ? 15 : 11;
      alvoOlhar.current.set(x, 0.55, z);
      alvoPos.current.set(
        x + Math.cos(ang) * raio,
        4.8 + Math.sin(t * 0.6) * 0.6,
        z + Math.sin(ang) * raio + 5
      );
    } else {
      alvoOlhar.current.set(0, 0.55, 0);
      alvoPos.current.set(
        15 + Math.cos(ang * 0.5) * 2,
        12 + Math.sin(t * 0.4) * 0.5,
        17 + Math.sin(ang * 0.5) * 2
      );
    }
  };

  useEffect(() => {
    if (!ativo) return;
    tempo.current = 0;
    calcularPosicao(passo, 0);
    camera.position.copy(alvoPos.current);
    camera.lookAt(alvoOlhar.current);
  }, [passo, ativo, camera]);

  useFrame((_, delta) => {
    if (!ativo) return;
    tempo.current += delta;
    calcularPosicao(passo, tempo.current);
    const k = Math.min(delta * 2.2, 1);
    camera.position.lerp(alvoPos.current, k);
    camera.lookAt(alvoOlhar.current);
  });

  return null;
}

/* ============================================================
   Pausa o render quando a maquete sai da tela (só invalida — nunca para o loop)
   ============================================================ */

function PausarForaDaTela({ ativo }: { ativo: boolean }) {
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (ativo) invalidate();
  }, [ativo, invalidate]);

  return null;
}

/** Luzes — remonta ao trocar dia/noite para evitar acúmulo. */
function Iluminacao({ noite }: { noite: boolean }) {
  return (
    <group key={noite ? 'noite' : 'dia'}>
      {noite ? (
        <>
          <ambientLight intensity={0.12} color="#1a2030" />
          <directionalLight position={[8, 14, 6]} intensity={0.35} color="#8899bb" />
          <hemisphereLight args={['#0a1020', '#020204', 0.25]} />
          <Stars radius={80} depth={40} count={1200} factor={3} saturation={0.2} fade speed={0.4} />
          {MODULOS.map((mod) => (
            <pointLight
              key={`luz-${mod.id}`}
              position={[POSICOES[mod.id][0], 2.2, POSICOES[mod.id][2]]}
              color={mod.cor}
              intensity={0.35}
              distance={14}
              decay={2}
            />
          ))}
        </>
      ) : (
        <>
          <ambientLight intensity={0.16} color="#d8c8a8" />
          <directionalLight
            position={[18, 24, 8]}
            intensity={1.35}
            color="#ffe8c4"
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-34}
            shadow-camera-right={34}
            shadow-camera-top={34}
            shadow-camera-bottom={-34}
            shadow-bias={-0.0002}
            shadow-normalBias={0.04}
          />
          <directionalLight position={[-10, 6, -9]} intensity={0.28} color="#7a9bb8" />
          <hemisphereLight args={['#6ea0cc', '#4a3d28', 0.38]} />
        </>
      )}
    </group>
  );
}

/* ============================================================
   Etiqueta flutuante de cada módulo
   ============================================================ */

function Etiqueta({
  texto,
  subtitulo,
  cor,
  position,
  visivel,
}: {
  texto: string;
  subtitulo?: string;
  cor: string;
  position: [number, number, number];
  visivel: boolean;
}) {
  if (!visivel) return null;
  return (
    <Html position={position} center distanceFactor={36} zIndexRange={[10, 0]}>
      <div className="maquete3d-tag-wrap">
        <span className="maquete3d-tag" style={{ '--tag-cor': cor } as React.CSSProperties}>
          {texto}
        </span>
        {subtitulo && <span className="maquete3d-tag-sub">{subtitulo}</span>}
      </div>
    </Html>
  );
}

/* ============================================================
   Cena
   ============================================================ */

interface CenaProps {
  selecionado: string | null;
  destacado: string | null;
  setSelecionado: (id: string | null) => void;
  setDestacado: (id: string | null) => void;
  rodando: boolean;
  velocidade: number;
  desvios: number[];
  etiquetas: boolean;
  noite: boolean;
  cenario: boolean;
  tourAtivo: boolean;
  passoTour: number;
  pov: PovId;
  onPov: (id: string) => void;
  fonte: 'codigo' | 'blender';
  controlsRef: React.RefObject<any>;
}

function Modulo3D({
  id,
  rodando,
  velocidade,
  desvios,
  noite,
  onPov,
}: {
  id: string;
  rodando: boolean;
  velocidade: number;
  desvios: number[];
  noite: boolean;
  onPov?: (id: string) => void;
}) {
  switch (id) {
    case 'mineradora':
      return (
        <group scale={1.22}>
          <Mineradora rodando={rodando} noite={noite} />
        </group>
      );
    case 'ferrovia':
      return <Ferrovia rodando={rodando} velocidade={velocidade} desvios={desvios} />;
    case 'porto':
      return (
        <group scale={1.48}>
          <Porto rodando={rodando} noite={noite} />
        </group>
      );
    case 'controle':
      return <Controle rodando={rodando} noite={noite} onPov={onPov} />;
    default:
      return null;
  }
}

/** Aplica cor de fundo e névoa — mais confiável que `<color attach>` com R3F 9 + Three r185. */
function Ambiente({ noite }: { noite: boolean }) {
  const { scene } = useThree();
  const cor = noite ? COR_NOITE : COR_DIA;

  useEffect(() => {
    scene.background = new THREE.Color(cor);
    scene.fog = new THREE.Fog(cor, noite ? 36 : 70, noite ? 68 : 140);
    return () => {
      scene.fog = null;
    };
  }, [scene, cor, noite]);

  return null;
}

function Cena({
  selecionado,
  destacado,
  setSelecionado,
  setDestacado,
  rodando,
  velocidade,
  desvios,
  etiquetas,
  noite,
  cenario,
  tourAtivo,
  passoTour,
  pov,
  onPov,
  fonte,
  controlsRef,
}: CenaProps) {
  const alternar = (id: string) => setSelecionado(selecionado === id ? null : id);
  const blender = fonte === 'blender';
  const livre = pov === 'overview' && !tourAtivo;

  return (
    <>
      <Ambiente noite={noite} />
      <Iluminacao noite={noite} />
      {!noite && !blender && (
        <Sky sunPosition={[100, 42, 24]} turbidity={2.2} rayleigh={1.15} mieCoefficient={0.004} mieDirectionalG={0.82} />
      )}

      {blender ? (
        <Suspense fallback={null}>
          <MaqueteBlender rodando={rodando} velocidade={velocidade} />
        </Suspense>
      ) : (
        <>
          <Base />
          {cenario && <Cenario3D rodando={rodando} noite={noite} />}
          {MODULOS.map((mod) => (
            <group key={mod.id}>
              <GrupoInterativo
                id={mod.id}
                cor={mod.cor}
                selecionado={selecionado === mod.id}
                destacado={destacado === mod.id}
                onSelecionar={alternar}
                onDestacar={setDestacado}
                position={POSICOES[mod.id]}
                elevar={livre}
              >
                <Modulo3D
                  id={mod.id}
                  rodando={rodando}
                  velocidade={velocidade}
                  desvios={desvios}
                  noite={noite}
                  onPov={onPov}
                />
              </GrupoInterativo>

              <Etiqueta
                texto={mod.nome}
                subtitulo={TELEMETRIA[mod.id]}
                cor={mod.cor}
                position={[
                  POSICOES[mod.id][0],
                  mod.id === 'mineradora' ? 4.8 : 3.2,
                  POSICOES[mod.id][2],
                ]}
                visivel={etiquetas && livre}
              />
            </group>
          ))}
        </>
      )}

      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={noite ? 0.65 : 0.28}
        scale={52}
        blur={2.6}
        far={8}
      />

      <OrbitControls
        ref={controlsRef}
        enabled={livre}
        enablePan={livre}
        minDistance={5}
        maxDistance={58}
        maxPolarAngle={Math.PI / 2.15}
        enableDamping
        dampingFactor={0.07}
        makeDefault
      />

      <CameraTour passo={passoTour} ativo={!blender && tourAtivo && pov === 'overview'} />
      {livre && (
        <CameraFoco selecionado={selecionado} controlsRef={controlsRef} tourAtivo={false} />
      )}
      {!blender && <CameraPov modo={pov} />}
    </>
  );
}

/* ============================================================
   Componente exportado
   ============================================================ */

export default function Maquete3D({ telaCheia = false }: { telaCheia?: boolean }) {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [destacado, setDestacado] = useState<string | null>(null);
  const [rodando, setRodando] = useState(true);
  const [velocidade, setVelocidade] = useState(1);
  const [etiquetas, setEtiquetas] = useState(!telaCheia);
  const [noite, setNoite] = useState(false);
  const [cenario, setCenario] = useState(true);
  const [desvios, setDesvios] = useState([0, 1, 1, 1]);
  const [tourAtivo, setTourAtivo] = useState(false);
  const [passoTour, setPassoTour] = useState(0);
  const [visivel, setVisivel] = useState(true);
  const [pov, setPov] = useState<PovId>('overview');
  const [fonte, setFonte] = useState<'codigo' | 'blender'>('blender');

  const wrapperRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  const reduzido = usePrefersReducedMotion();
  const leve = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVisivel(entry.isIntersecting),
      { rootMargin: '150px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!rodando) return;
    const id = window.setInterval(() => {
      setDesvios((prev) => {
        const porto = prev[2] === 1 || prev[3] === 1;
        const alvo = porto ? 2 : 1;
        return [prev[0], prev[1], alvo, alvo];
      });
    }, 20000);
    return () => window.clearInterval(id);
  }, [rodando]);

  // Avança o tour automaticamente
  useEffect(() => {
    if (!tourAtivo || reduzido) return;
    const config = PASSOS_TOUR[passoTour];
    const timer = window.setTimeout(() => {
      const proximo = (passoTour + 1) % PASSOS_TOUR.length;
      setPassoTour(proximo);
      const modId = PASSOS_TOUR[proximo].moduloId;
      setSelecionado(modId);
    }, config.duracao * 1000);
    return () => window.clearTimeout(timer);
  }, [tourAtivo, passoTour, reduzido]);

  const iniciarTour = useCallback(() => {
    setPov('overview');
    setPassoTour(0);
    setSelecionado(PASSOS_TOUR[0].moduloId);
    setTourAtivo(true);
  }, []);

  const pararTour = useCallback(() => {
    setTourAtivo(false);
    setSelecionado(null);
    requestAnimationFrame(() => {
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }
    });
  }, []);

  const entrarPov = useCallback((id: string) => {
    const cam = CAMERAS_POV.find((c) => c.id === id);
    pararTour();
    setPov(id as PovId);
    if (cam) setSelecionado(cam.modulo);
  }, [pararTour]);

  const voltarSala = useCallback(() => {
    setTourAtivo(false);
    setPov('sala');
    setSelecionado('controle');
  }, []);

  const vistaGeral = useCallback(() => {
    setPov('overview');
    pararTour();
  }, [pararTour]);

  const modulo = MODULOS.find((m) => m.id === selecionado);
  const passoAtual = PASSOS_TOUR[passoTour];

  const girarDesvio = (i: number) =>
    setDesvios((prev) => prev.map((d, j) => (j === i ? (d + 1) % 3 : d)));

  const ESTADOS = ['CENTER', 'LEFT', 'RIGHT'];
  const destinoTrem =
    desvios[2] === 1 || desvios[3] === 1
      ? 'Porto'
      : 'Loop principal';

  return (
    <div className={`maquete3d${telaCheia ? ' maquete3d--cheia' : ''}`} ref={wrapperRef}>
      <div className="maquete3d-palco">
        <Canvas
          shadows={!leve}
          frameloop="always"
          dpr={leve ? [1, 1.25] : [1, 1.75]}
          camera={{ position: CAMERA_INICIAL.toArray(), fov: 42, near: 0.1, far: 280 }}
          gl={{
            alpha: false,
            antialias: !leve,
            powerPreference: 'high-performance',
          }}
          onCreated={({ gl, scene }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 0.88;
            gl.outputColorSpace = THREE.SRGBColorSpace;
            gl.setClearColor(new THREE.Color(COR_DIA), 1);
            scene.background = new THREE.Color(COR_DIA);
          }}
          onPointerMissed={() => !tourAtivo && pov === 'overview' && setSelecionado(null)}
        >
          <PausarForaDaTela ativo={visivel} />
          <Cena
            selecionado={selecionado}
            destacado={destacado}
            setSelecionado={setSelecionado}
            setDestacado={setDestacado}
            rodando={rodando}
            velocidade={velocidade}
            desvios={desvios}
            etiquetas={etiquetas}
            noite={noite}
            cenario={cenario}
            tourAtivo={tourAtivo}
            passoTour={passoTour}
            pov={pov}
            onPov={entrarPov}
            fonte={fonte}
            controlsRef={controlsRef}
          />
        </Canvas>

        {tourAtivo && (
          <div className="maquete3d-tour" role="status" aria-live="polite">
            <span className="maquete3d-tour-badge">Tour · {passoTour + 1}/{PASSOS_TOUR.length}</span>
            <p className="maquete3d-tour-texto">{passoAtual.legenda}</p>
          </div>
        )}

        {pov !== 'overview' && (
          <div className="maquete3d-tour" role="status">
            <span className="maquete3d-tour-badge">
              {pov === 'sala' ? 'Sala de controle' : CAMERAS_POV.find((c) => c.id === pov)?.label}
            </span>
            <p className="maquete3d-tour-texto">
              {pov === 'sala'
                ? 'Clique num monitor (ou nos botões abaixo) para entrar na cabine'
                : 'Visão da cabine — volte à sala ou à vista geral'}
            </p>
          </div>
        )}

        <p className="maquete3d-dica" aria-hidden="true">
          {pov !== 'overview'
            ? 'Você está na cabine'
            : tourAtivo
              ? 'Tour em andamento — clique Parar tour para interagir'
              : 'Arraste para girar · Role para aproximar · Clique em um módulo'}
        </p>
      </div>

      <div className="maquete3d-painel">
        <div className="maquete3d-grupo">
          <span className="maquete3d-rotulo" id="rot-fonte">
            Fonte 3D
          </span>
          <div className="maquete3d-botoes" role="group" aria-labelledby="rot-fonte">
            <button
              type="button"
              className={`maquete3d-btn ${fonte === 'blender' ? 'ativo' : ''}`}
              aria-pressed={fonte === 'blender'}
              onClick={() => {
                setFonte('blender');
                setPov('overview');
                pararTour();
              }}
            >
              Blender
            </button>
            <button
              type="button"
              className={`maquete3d-btn ${fonte === 'codigo' ? 'ativo' : ''}`}
              aria-pressed={fonte === 'codigo'}
              onClick={() => setFonte('codigo')}
            >
              Código (atual)
            </button>
          </div>
        </div>

        <div className="maquete3d-grupo">
          <span className="maquete3d-rotulo" id="rot-cameras">
            Monitores da sala
          </span>
          <div className="maquete3d-botoes maquete3d-cameras" role="group" aria-labelledby="rot-cameras">
            <button
              type="button"
              className={`maquete3d-btn ${pov === 'sala' ? 'ativo' : ''}`}
              aria-pressed={pov === 'sala'}
              disabled={fonte === 'blender'}
              onClick={voltarSala}
            >
              Sala SCADA
            </button>
            {CAMERAS_POV.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`maquete3d-btn ${pov === c.id ? 'ativo' : ''}`}
                aria-pressed={pov === c.id}
                disabled={fonte === 'blender'}
                onClick={() => entrarPov(c.id)}
              >
                {c.label}
              </button>
            ))}
            <button
              type="button"
              className={`maquete3d-btn ${pov === 'overview' ? 'ativo' : ''}`}
              aria-pressed={pov === 'overview'}
              onClick={vistaGeral}
            >
              Vista geral
            </button>
          </div>
        </div>

        <div className="maquete3d-grupo">
          <span className="maquete3d-rotulo" id="rot-modulos">
            Módulos
          </span>
          <div className="maquete3d-botoes" role="group" aria-labelledby="rot-modulos">
            {MODULOS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`maquete3d-btn ${selecionado === m.id ? 'ativo' : ''}`}
                style={{ '--btn-cor': m.cor } as React.CSSProperties}
                aria-pressed={selecionado === m.id}
                onClick={() => {
                  setPov('overview');
                  pararTour();
                  setSelecionado(selecionado === m.id ? null : m.id);
                }}
                onMouseEnter={() => setDestacado(m.id)}
                onMouseLeave={() => setDestacado(null)}
                onFocus={() => setDestacado(m.id)}
                onBlur={() => setDestacado(null)}
              >
                <span className="maquete3d-ponto" aria-hidden="true" />
                {m.nome}
              </button>
            ))}
          </div>
        </div>

        <div className="maquete3d-grupo">
          <span className="maquete3d-rotulo" id="rot-desvios">
            Desvios (servos SG90) · destino: {destinoTrem}
          </span>
          <div className="maquete3d-botoes" role="group" aria-labelledby="rot-desvios">
            {desvios.map((estado, i) => (
              <button
                key={i}
                type="button"
                className="maquete3d-btn maquete3d-btn-desvio"
                onClick={() => girarDesvio(i)}
                aria-label={`Desvio ${i + 1}, estado ${ESTADOS[estado]}. Ativar para alternar.`}
              >
                <span className="maquete3d-desvio-id">SW{i + 1}</span>
                <span className="maquete3d-desvio-estado">{ESTADOS[estado]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="maquete3d-grupo maquete3d-grupo-linha">
          {tourAtivo ? (
            <button type="button" className="maquete3d-btn maquete3d-btn-tour ativo" onClick={pararTour}>
              Parar tour
            </button>
          ) : (
            <button
              type="button"
              className="maquete3d-btn maquete3d-btn-tour"
              onClick={iniciarTour}
              disabled={reduzido || fonte === 'blender'}
              title={
                fonte === 'blender'
                  ? 'Tour dos módulos está no modo Código'
                  : reduzido
                    ? 'Tour indisponível com movimento reduzido'
                    : undefined
              }
            >
              Iniciar tour
            </button>
          )}

          <button
            type="button"
            className={`maquete3d-btn maquete3d-btn-acao ${noite ? 'ativo' : ''}`}
            onClick={() => setNoite((n) => !n)}
            aria-pressed={noite}
            style={{ '--btn-cor': PALETA.purple } as React.CSSProperties}
          >
            {noite ? 'Modo dia' : 'Modo noite'}
          </button>

          <button
            type="button"
            className="maquete3d-btn maquete3d-btn-acao"
            onClick={() => setRodando((r) => !r)}
            aria-pressed={rodando}
          >
            {rodando ? 'Pausar operação' : 'Iniciar operação'}
          </button>

          <label className="maquete3d-slider">
            <span>Velocidade</span>
            <input
              type="range"
              min="0.25"
              max="3"
              step="0.25"
              value={velocidade}
              onChange={(e) => setVelocidade(parseFloat(e.target.value))}
              aria-valuetext={`${velocidade} vezes`}
            />
            <span className="maquete3d-valor">{velocidade}x</span>
          </label>

          <label className="maquete3d-check">
            <input
              type="checkbox"
              checked={cenario}
              onChange={(e) => setCenario(e.target.checked)}
            />
            <span>Cenário (árvores, fluxo)</span>
          </label>

          <label className="maquete3d-check">
            <input
              type="checkbox"
              checked={etiquetas}
              onChange={(e) => setEtiquetas(e.target.checked)}
            />
            <span>Etiquetas</span>
          </label>

          <button
            type="button"
            className="maquete3d-btn maquete3d-btn-acao"
            onClick={vistaGeral}
          >
            Ver tudo
          </button>
        </div>
      </div>

      <div className="maquete3d-info" aria-live="polite">
        {modulo ? (
          <div className="maquete3d-ficha" style={{ '--ficha-cor': modulo.cor } as React.CSSProperties}>
            <h4>{modulo.nome}</h4>
            <p className="maquete3d-telemetria">{TELEMETRIA[modulo.id]}</p>
            <p>{modulo.resumo}</p>
            <ul>
              {modulo.detalhes.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="maquete3d-vazio">
            Selecione um módulo ou inicie o tour para percorrer a operação completa.
          </p>
        )}
      </div>

      {reduzido && (
        <p className="maquete3d-aviso">
          O sistema pediu movimento reduzido: o tour automático fica desligado.
          Trem, caminhões e navio continuam na operação.
        </p>
      )}
    </div>
  );
}
