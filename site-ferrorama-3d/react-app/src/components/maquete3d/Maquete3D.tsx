import { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { MODULOS, PALETA, PASSOS_TOUR, TELEMETRIA } from './modulos';
import {
  Base,
  Ferrovia,
  Mineradora,
  Porto,
  Aeroporto,
  Controle,
  GrupoInterativo,
} from './Modulos3D';
import { Cenario3D } from './Cenario3D';
import { usePrefersReducedMotion } from '../../lib/motion';

/** Posições de cada módulo sobre a placa. */
const POSICOES: Record<string, [number, number, number]> = {
  mineradora: [-10.5, 0, -5.5],
  ferrovia: [0, 0, 0],
  porto: [10.5, 0, 4],
  aeroporto: [10, 0, -6],
  controle: [-2, 0, 8],
};

const CAMERA_INICIAL = new THREE.Vector3(16, 13, 18);
const COR_NOITE = '#040508';
const COR_DIA = PALETA.dark;

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
      alvoPos.current.set(x + 7, 5.5, z + 8);
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
      const raio = modId === 'ferrovia' ? 11 : 8.5;
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
          <ambientLight intensity={0.55} color="#b8c4d4" />
          <directionalLight
            position={[12, 18, 10]}
            intensity={1.7}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          <directionalLight position={[-10, 8, -8]} intensity={0.5} color={PALETA.accent} />
          <hemisphereLight args={['#5a6b7d', '#1a1410', 0.6]} />
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
    <Html position={position} center distanceFactor={26} zIndexRange={[10, 0]}>
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
  controlsRef: React.RefObject<any>;
}

function Modulo3D({
  id,
  rodando,
  velocidade,
  desvios,
  noite,
}: {
  id: string;
  rodando: boolean;
  velocidade: number;
  desvios: number[];
  noite: boolean;
}) {
  switch (id) {
    case 'mineradora':
      return <Mineradora rodando={rodando} noite={noite} />;
    case 'ferrovia':
      return <Ferrovia rodando={rodando} velocidade={velocidade} desvios={desvios} />;
    case 'porto':
      return <Porto rodando={rodando} noite={noite} />;
    case 'aeroporto':
      return <Aeroporto rodando={rodando} noite={noite} />;
    case 'controle':
      return <Controle rodando={rodando} noite={noite} />;
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
    scene.fog = new THREE.Fog(cor, noite ? 28 : 34, noite ? 52 : 62);
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
  controlsRef,
}: CenaProps) {
  const alternar = (id: string) => setSelecionado(selecionado === id ? null : id);

  return (
    <>
      <Ambiente noite={noite} />
      <Iluminacao noite={noite} />

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
          >
            <Modulo3D
              id={mod.id}
              rodando={rodando}
              velocidade={velocidade}
              desvios={desvios}
              noite={noite}
            />
          </GrupoInterativo>

          <Etiqueta
            texto={mod.nome}
            subtitulo={TELEMETRIA[mod.id]}
            cor={mod.cor}
            position={[
              POSICOES[mod.id][0],
              mod.id === 'mineradora' ? 3.4 : 2.6,
              POSICOES[mod.id][2],
            ]}
            visivel={etiquetas}
          />
        </group>
      ))}

      <ContactShadows
        position={[0, 0.02, 0]}
        opacity={noite ? 0.65 : 0.45}
        scale={34}
        blur={2.4}
        far={6}
      />

      {!tourAtivo && (
        <OrbitControls
          ref={controlsRef}
          enablePan
          minDistance={7}
          maxDistance={38}
          maxPolarAngle={Math.PI / 2.15}
          enableDamping
          dampingFactor={0.07}
          makeDefault
        />
      )}

      <CameraTour passo={passoTour} ativo={tourAtivo} />
      {!tourAtivo && (
        <CameraFoco selecionado={selecionado} controlsRef={controlsRef} tourAtivo={false} />
      )}
    </>
  );
}

/* ============================================================
   Componente exportado
   ============================================================ */

export default function Maquete3D() {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [destacado, setDestacado] = useState<string | null>(null);
  const [rodando, setRodando] = useState(true);
  const [velocidade, setVelocidade] = useState(1);
  const [etiquetas, setEtiquetas] = useState(true);
  const [noite, setNoite] = useState(false);
  const [cenario, setCenario] = useState(true);
  const [desvios, setDesvios] = useState([0, 1, 0, 2]);
  const [tourAtivo, setTourAtivo] = useState(false);
  const [passoTour, setPassoTour] = useState(0);
  const [visivel, setVisivel] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  const reduzido = usePrefersReducedMotion();

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

  const modulo = MODULOS.find((m) => m.id === selecionado);
  const animando = rodando && !reduzido;
  const passoAtual = PASSOS_TOUR[passoTour];

  const girarDesvio = (i: number) =>
    setDesvios((prev) => prev.map((d, j) => (j === i ? (d + 1) % 3 : d)));

  const ESTADOS = ['CENTER', 'LEFT', 'RIGHT'];
  const destinoTrem =
    desvios[2] === 1 || desvios[3] === 1
      ? 'Porto'
      : desvios[2] === 2 || desvios[3] === 2
        ? 'Aeroporto'
        : 'Loop principal';

  return (
    <div className="maquete3d" ref={wrapperRef}>
      <div className="maquete3d-palco">
        <Canvas
          shadows
          frameloop="always"
          dpr={[1, 1.75]}
          camera={{ position: CAMERA_INICIAL.toArray(), fov: 42, near: 0.1, far: 200 }}
          gl={{
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance',
          }}
          onCreated={({ gl, scene }) => {
            gl.setClearColor(new THREE.Color(COR_DIA), 1);
            scene.background = new THREE.Color(COR_DIA);
          }}
          onPointerMissed={() => !tourAtivo && setSelecionado(null)}
        >
          <PausarForaDaTela ativo={visivel} />
          <Cena
            selecionado={selecionado}
            destacado={destacado}
            setSelecionado={setSelecionado}
            setDestacado={setDestacado}
            rodando={animando}
            velocidade={velocidade}
            desvios={desvios}
            etiquetas={etiquetas}
            noite={noite}
            cenario={cenario}
            tourAtivo={tourAtivo}
            passoTour={passoTour}
            controlsRef={controlsRef}
          />
        </Canvas>

        {tourAtivo && (
          <div className="maquete3d-tour" role="status" aria-live="polite">
            <span className="maquete3d-tour-badge">Tour · {passoTour + 1}/{PASSOS_TOUR.length}</span>
            <p className="maquete3d-tour-texto">{passoAtual.legenda}</p>
          </div>
        )}

        <p className="maquete3d-dica" aria-hidden="true">
          {tourAtivo
            ? 'Tour em andamento — clique Parar tour para interagir'
            : 'Arraste para girar · Role para aproximar · Clique em um módulo'}
        </p>
      </div>

      <div className="maquete3d-painel">
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
              disabled={reduzido}
              title={reduzido ? 'Tour indisponível com movimento reduzido' : undefined}
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
            onClick={() => {
              pararTour();
              setSelecionado(null);
            }}
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
          As animações estão pausadas porque seu sistema pede movimento reduzido.
          A maquete continua girando e clicável.
        </p>
      )}
    </div>
  );
}
