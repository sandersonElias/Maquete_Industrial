import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { MODULOS, PALETA } from './modulos';
import {
  Base,
  Ferrovia,
  Mineradora,
  Porto,
  Aeroporto,
  Controle,
  GrupoInterativo,
} from './Modulos3D';
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

/* ============================================================
   Câmera: aproxima suavemente do módulo selecionado
   ============================================================ */

function CameraFoco({
  selecionado,
  controlsRef,
}: {
  selecionado: string | null;
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();
  const alvoPos = useRef(new THREE.Vector3());
  const alvoOlhar = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const mod = MODULOS.find((m) => m.id === selecionado);
    if (mod) {
      const [x, , z] = POSICOES[mod.id];
      // Aproxima na diagonal, mantendo o módulo enquadrado
      alvoOlhar.current.set(x, 0.6, z);
      alvoPos.current.set(x + 7, 5.5, z + 8);
    } else {
      alvoOlhar.current.set(0, 0, 0);
      alvoPos.current.copy(CAMERA_INICIAL);
    }
  }, [selecionado]);

  useFrame((_, delta) => {
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
   Pausa o render quando a maquete sai da tela
   ============================================================ */

function PausarForaDaTela({ ativo }: { ativo: boolean }) {
  const { invalidate, setFrameloop } = useThree();

  useEffect(() => {
    setFrameloop(ativo ? 'always' : 'never');
    if (ativo) invalidate();
  }, [ativo, setFrameloop, invalidate]);

  return null;
}

/* ============================================================
   Etiqueta flutuante de cada módulo
   ============================================================ */

function Etiqueta({
  texto,
  cor,
  position,
  visivel,
}: {
  texto: string;
  cor: string;
  position: [number, number, number];
  visivel: boolean;
}) {
  if (!visivel) return null;
  return (
    <Html position={position} center distanceFactor={26} zIndexRange={[10, 0]}>
      <span className="maquete3d-tag" style={{ '--tag-cor': cor } as React.CSSProperties}>
        {texto}
      </span>
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
  controlsRef: React.RefObject<any>;
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
  controlsRef,
}: CenaProps) {
  const alternar = (id: string) => setSelecionado(selecionado === id ? null : id);

  const conteudo = useMemo(
    () => ({
      mineradora: <Mineradora rodando={rodando} />,
      ferrovia: <Ferrovia rodando={rodando} velocidade={velocidade} desvios={desvios} />,
      porto: <Porto rodando={rodando} />,
      aeroporto: <Aeroporto rodando={rodando} />,
      controle: <Controle rodando={rodando} />,
    }),
    [rodando, velocidade, desvios]
  );

  return (
    <>
      {/* Luz ambiente fria + key light quente: contraste de maquete iluminada */}
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

      <Base />

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
            {conteudo[mod.id as keyof typeof conteudo]}
          </GrupoInterativo>

          <Etiqueta
            texto={mod.nome}
            cor={mod.cor}
            position={[
              POSICOES[mod.id][0],
              mod.id === 'mineradora' ? 3.2 : 2.4,
              POSICOES[mod.id][2],
            ]}
            visivel={etiquetas}
          />
        </group>
      ))}

      <ContactShadows position={[0, 0.02, 0]} opacity={0.45} scale={34} blur={2.4} far={6} />

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

      <CameraFoco selecionado={selecionado} controlsRef={controlsRef} />
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
  const [desvios, setDesvios] = useState([0, 1, 0, 2]);
  // Começa ligado de propósito: se o IntersectionObserver demorar a responder,
  // o usuário vê a maquete montada e não um retângulo preto.
  const [visivel, setVisivel] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  const reduzido = usePrefersReducedMotion();

  // Só renderiza enquanto a maquete estiver na tela — fora dela, zero GPU
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

  const modulo = MODULOS.find((m) => m.id === selecionado);
  const animando = rodando && !reduzido;

  const girarDesvio = (i: number) =>
    setDesvios((prev) => prev.map((d, j) => (j === i ? (d + 1) % 3 : d)));

  const ESTADOS = ['CENTER', 'LEFT', 'RIGHT'];

  return (
    <div className="maquete3d" ref={wrapperRef}>
      <div className="maquete3d-palco">
        <Canvas
          shadows
          dpr={[1, 1.75]}
          camera={{ position: CAMERA_INICIAL.toArray(), fov: 42 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onPointerMissed={() => setSelecionado(null)}
        >
          <color attach="background" args={[PALETA.dark]} />
          <fog attach="fog" args={[PALETA.dark, 34, 62]} />
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
            controlsRef={controlsRef}
          />
        </Canvas>

        <p className="maquete3d-dica" aria-hidden="true">
          Arraste para girar · Role para aproximar · Clique em um módulo
        </p>
      </div>

      {/* Controles em HTML de verdade: funcionam no teclado e no leitor de tela */}
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
                onClick={() => setSelecionado(selecionado === m.id ? null : m.id)}
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
            Desvios (servos SG90)
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
              checked={etiquetas}
              onChange={(e) => setEtiquetas(e.target.checked)}
            />
            <span>Etiquetas</span>
          </label>

          <button
            type="button"
            className="maquete3d-btn maquete3d-btn-acao"
            onClick={() => setSelecionado(null)}
          >
            Ver tudo
          </button>
        </div>
      </div>

      {/* Detalhes do módulo — anunciado a quem usa leitor de tela */}
      <div className="maquete3d-info" aria-live="polite">
        {modulo ? (
          <div className="maquete3d-ficha" style={{ '--ficha-cor': modulo.cor } as React.CSSProperties}>
            <h4>{modulo.nome}</h4>
            <p>{modulo.resumo}</p>
            <ul>
              {modulo.detalhes.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="maquete3d-vazio">
            Selecione um módulo para ver como ele funciona na maquete real.
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
