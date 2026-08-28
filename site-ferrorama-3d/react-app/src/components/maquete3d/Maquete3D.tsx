import { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows, Stars, Sky, Environment, Lightformer, useProgress } from '@react-three/drei';
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

import { LAYOUT, ramoAtivo } from './geometria';

/** Posições de cada módulo sobre a placa. */
const POSICOES: Record<string, [number, number, number]> = LAYOUT;

/** No GLB o export Blender→glTF espelha Z; câmeras precisam do mesmo espelho. */
function posModulo(id: string, espelharZ: boolean): [number, number, number] {
  const p = POSICOES[id] ?? [0, 0, 0];
  return espelharZ ? [p[0], p[1], -p[2]] : p;
}

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
  espelharZ = false,
}: {
  selecionado: string | null;
  controlsRef: React.RefObject<any>;
  tourAtivo: boolean;
  espelharZ?: boolean;
}) {
  const { camera } = useThree();
  const alvoPos = useRef(new THREE.Vector3());
  const alvoOlhar = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    if (tourAtivo) return;
    const mod = MODULOS.find((m) => m.id === selecionado);
    if (mod) {
      const [x, , z] = posModulo(mod.id, espelharZ);
      alvoOlhar.current.set(x, 0.6, z);
      alvoPos.current.set(x + 9, 7.2, z + 10);
    } else {
      alvoOlhar.current.set(0, 0, 0);
      alvoPos.current.copy(CAMERA_INICIAL);
    }
  }, [selecionado, tourAtivo, espelharZ]);

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
  espelharZ = false,
}: {
  passo: number;
  ativo: boolean;
  espelharZ?: boolean;
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
      const [x, , z] = posModulo(modId, espelharZ);
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
   Responsividade de celular — classe do aparelho e enquadramento
   ============================================================ */

export type Qualidade = 'leve' | 'media' | 'alta';

function medirQualidade(): Qualidade {
  if (typeof window === 'undefined') return 'media';
  const nav = navigator as Navigator & { deviceMemory?: number };
  const estreito = window.matchMedia('(max-width: 768px)').matches;
  const toque = window.matchMedia('(pointer: coarse)').matches;
  const memoria = nav.deviceMemory ?? 8;
  const nucleos = navigator.hardwareConcurrency ?? 8;
  if (estreito || memoria <= 4 || nucleos <= 4) return 'leve';
  if (toque || memoria <= 8) return 'media';
  return 'alta';
}

/**
 * Ponteiro grosso (dedo, caneta) — não é a mesma pergunta que "o aparelho é
 * fraco": um tablet potente é toque, um notebook velho é mouse. Quem manda na
 * sensibilidade dos controles é o ponteiro, não a qualidade gráfica.
 */
function usePonteiroGrosso(): boolean {
  const [grosso, setGrosso] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(pointer: coarse)');
    const ao = () => setGrosso(mq.matches);
    mq.addEventListener('change', ao);
    return () => mq.removeEventListener('change', ao);
  }, []);
  return grosso;
}

/**
 * Largura de tela sozinha não diz se o aparelho aguenta: um tablet largo pode
 * ser mais fraco que um celular novo. Cruzamos largura, tipo de ponteiro,
 * memória e núcleos, e reavaliamos quando o aparelho gira — antes disso o valor
 * era calculado uma vez durante o render e nunca mais mudava.
 */
function useQualidade(): Qualidade {
  const [q, setQ] = useState<Qualidade>(medirQualidade);
  useEffect(() => {
    const recalcular = () => setQ(medirQualidade());
    const mq = window.matchMedia('(max-width: 768px)');
    mq.addEventListener('change', recalcular);
    window.addEventListener('orientationchange', recalcular);
    return () => {
      mq.removeEventListener('change', recalcular);
      window.removeEventListener('orientationchange', recalcular);
    };
  }, []);
  return q;
}

/**
 * Mantém o campo de visão HORIZONTAL constante.
 *
 * A maquete é larga (47 x 35) e o `fov` do three é vertical: numa tela de
 * celular em pé o quadro fica estreito e a mina e o porto saem pelas laterais.
 * Em vez de empurrar a câmera para trás — o que brigaria com o dedo do usuário
 * no OrbitControls — abrimos o fov vertical na medida exata em que o aspecto
 * encolheu. O enquadramento horizontal fica igual em qualquer tela.
 */
function EnquadramentoResponsivo({ base = 42, aspectoBase = 16 / 10 }: { base?: number; aspectoBase?: number }) {
  const camera = useThree((s) => s.camera);
  const largura = useThree((s) => s.size.width);
  const altura = useThree((s) => s.size.height);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    if (!cam.isPerspectiveCamera) return;
    const aspecto = largura / Math.max(1, altura);
    const fov =
      aspecto >= aspectoBase
        ? base
        : THREE.MathUtils.radToDeg(
            2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(base) / 2) * (aspectoBase / aspecto))
          );
    cam.fov = Math.min(fov, 78);
    cam.updateProjectionMatrix();
  }, [camera, largura, altura, base, aspectoBase]);

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
function Iluminacao({ noite, qualidade = 'alta' }: { noite: boolean; qualidade?: Qualidade }) {
  // O shadow map é uma passada extra da cena inteira: 2048 no desktop, 1024 em
  // aparelho de toque. No 'leve' o Canvas já desliga sombra por completo.
  const mapaSombra = qualidade === 'alta' ? 2048 : 1024;
  const resAmbiente = qualidade === 'alta' ? 64 : 32;
  const estrelas = qualidade === 'leve' ? 500 : 1200;
  return (
    <group key={noite ? 'noite' : 'dia'}>
      {noite ? (
        <>
          <ambientLight intensity={0.12} color="#1a2030" />
          <directionalLight position={[8, 14, 6]} intensity={0.35} color="#8899bb" />
          <hemisphereLight args={['#0a1020', '#020204', 0.25]} />
          {/* IBL noturno fraco: sem ele o metal fica preto chapado. */}
          <Environment resolution={Math.min(resAmbiente, 32)} frames={1}>
            <Lightformer intensity={0.5} color="#243044" position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[16, 16, 1]} />
            <Lightformer intensity={0.9} color="#ffc27a" position={[6, 2, 4]} scale={[4, 2, 1]} />
          </Environment>
          <Stars radius={80} depth={40} count={estrelas} factor={3} saturation={0.2} fade speed={0.4} />
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
          <ambientLight intensity={0.22} color="#d8c8a8" />
          {/* Fase 5 — IBL montado com Lightformers em vez de HDRI de CDN: a
              maquete é aberta por QR code na 4G da feira e um .hdr de vários MB
              não pode entrar no caminho crítico. Céu quente em cima, rebote
              frio do horizonte, rebote de terra por baixo. */}
          <Environment resolution={resAmbiente} frames={1}>
            <Lightformer intensity={2.1} color="#fff2dc" position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[18, 18, 1]} />
            <Lightformer intensity={0.85} color="#b9d6ff" position={[-10, 3, -8]} rotation={[0, Math.PI / 3, 0]} scale={[10, 7, 1]} />
            <Lightformer intensity={0.7} color="#cfe4ff" position={[10, 3, 8]} rotation={[0, -Math.PI / 3, 0]} scale={[10, 7, 1]} />
            <Lightformer intensity={0.45} color="#6d5a3d" position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[18, 18, 1]} />
          </Environment>
          <directionalLight
            position={[16, 22, 10]}
            intensity={1.55}
            color="#ffe4b8"
            castShadow
            shadow-mapSize={[mapaSombra, mapaSombra]}
            shadow-camera-left={-34}
            shadow-camera-right={34}
            shadow-camera-top={34}
            shadow-camera-bottom={-34}
            shadow-bias={-0.0002}
            shadow-normalBias={0.04}
          />
          <directionalLight position={[-12, 8, -10]} intensity={0.38} color="#7a9bb8" />
          <hemisphereLight args={['#6ea0cc', '#4a3d28', 0.48]} />
          <pointLight position={[-17.2, 3.2, -9.4]} color="#ffcc88" intensity={0.55} distance={12} decay={2} />
          <pointLight position={[17.6, 3.4, 8.6]} color="#c8e8ff" intensity={0.5} distance={14} decay={2} />
          <pointLight position={[8.55, 1.4, 0]} color="#ffe0b0" intensity={0.28} distance={6} decay={2} />
          <pointLight position={[-8.55, 1.4, 0]} color="#ffe0b0" intensity={0.28} distance={6} decay={2} />
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
  /** Classe do aparelho: define shadow map, resolução do IBL e dpr. */
  qualidade: Qualidade;
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
  onDesvio: (indice: number) => void;
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

/**
 * Fase 11 — progresso do `.glb` dentro da cena.
 *
 * O `Suspense` da maquete tinha `fallback={null}`: enquanto os ~5 MB do modelo
 * desciam pela 4G da feira, o visitante via uma tela vazia por dez segundos e
 * concluía que não tinha funcionado. O fallback da seção (`maquete3d-carregando`)
 * só cobre o carregamento do *chunk* JavaScript, que termina bem antes.
 */
function CarregandoModelo() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="maquete3d-glb" role="status" aria-live="polite">
        <div className="maquete3d-glb__barra">
          <span style={{ width: `${Math.max(4, Math.round(progress))}%` }} />
        </div>
        <p>Carregando maquete · {Math.round(progress)}%</p>
      </div>
    </Html>
  );
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
  onDesvio,
  controlsRef,
  qualidade,
}: CenaProps) {
  const alternar = (id: string) => setSelecionado(selecionado === id ? null : id);
  const blender = fonte === 'blender';
  const livre = pov === 'overview' && !tourAtivo;
  const toque = usePonteiroGrosso();

  return (
    <>
      <Ambiente noite={noite} />
      <Iluminacao noite={noite} qualidade={qualidade} />
      <EnquadramentoResponsivo />
      {!noite && !blender && (
        <Sky sunPosition={[100, 42, 24]} turbidity={2.2} rayleigh={1.15} mieCoefficient={0.004} mieDirectionalG={0.82} />
      )}

      {blender ? (
        <Suspense fallback={<CarregandoModelo />}>
          <MaqueteBlender
            rodando={rodando}
            velocidade={velocidade}
            desvios={desvios}
            onDesvio={onDesvio}
            leve={qualidade === 'leve'}
          />
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

      {!blender && (
        <ContactShadows
          position={[0, 0.02, 0]}
          opacity={noite ? 0.65 : 0.28}
          scale={52}
          blur={2.6}
          far={8}
        />
      )}

      {/* No dedo o mesmo arrasto percorre muito mais ângulo que no mouse: sem
          reduzir a velocidade, um toque atravessa a maquete inteira e o
          visitante perde a referência. O amortecimento também sobe, para o
          giro parar sozinho em vez de derrapar. */}
      <OrbitControls
        ref={controlsRef}
        enabled={livre}
        enablePan={livre}
        minDistance={5}
        maxDistance={58}
        maxPolarAngle={Math.PI / 2.15}
        enableDamping
        dampingFactor={toque ? 0.11 : 0.07}
        rotateSpeed={toque ? 0.55 : 1}
        zoomSpeed={toque ? 0.7 : 1}
        panSpeed={toque ? 0.7 : 1}
        makeDefault
      />

      <CameraTour passo={passoTour} ativo={!blender && tourAtivo && pov === 'overview'} espelharZ={false} />
      {livre && (
        <CameraFoco selecionado={selecionado} controlsRef={controlsRef} tourAtivo={false} espelharZ={blender} />
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
  const [desvios, setDesvios] = useState([0, 0, 0, 0]);
  const [tourAtivo, setTourAtivo] = useState(false);
  const [passoTour, setPassoTour] = useState(0);
  const [visivel, setVisivel] = useState(true);
  const [pov, setPov] = useState<PovId>('overview');
  const [fonte, setFonte] = useState<'codigo' | 'blender'>('blender');

  const wrapperRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  const reduzido = usePrefersReducedMotion();
  const qualidade = useQualidade();
  const leve = qualidade === 'leve';

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
  const ramo = ramoAtivo(desvios);
  const destinoTrem =
    ramo === 'porto' ? 'Porto' : ramo === 'mina' ? 'Mina' : ramo === 'diagonal' ? 'Atalho' : 'Loop principal';

  return (
    <div className={`maquete3d${telaCheia ? ' maquete3d--cheia' : ''}`} ref={wrapperRef}>
      <div className="maquete3d-palco">
        <Canvas
          shadows={!leve}
          /* Fora da tela o loop para de verdade. Antes ficava em "always" e
             renderizava a 60 fps mesmo com a maquete rolada para fora da
             janela — o `invalidate` do PausarForaDaTela não tem efeito nesse
             modo. Na tela cheia (/maquete) a seção está sempre visível. */
          frameloop={visivel ? 'always' : 'never'}
          dpr={leve ? [1, 1.25] : qualidade === 'media' ? [1, 1.5] : [1, 1.75]}
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
            onDesvio={girarDesvio}
            controlsRef={controlsRef}
            qualidade={qualidade}
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
            Desvios · SW1/2 atalho · SW3 porto · SW4 mina · destino: {destinoTrem}
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
