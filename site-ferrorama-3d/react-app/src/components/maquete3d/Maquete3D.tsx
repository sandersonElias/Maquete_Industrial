import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { MODULOS, PALETA, POSICOES } from './modulos';
import { Base, Zona, CentralQuimica, Mina, Porto, Aeroporto } from './Modulos3D';
import Ferrovia from './Ferrovia';
import {
  TRECHOS,
  NOS,
  ORDEM_DESVIOS,
  DESCRICAO_DESVIOS,
  EstadoDesvio,
  proximoTrecho,
} from './tracado';
import { usePrefersReducedMotion } from '../../lib/motion';

const CAMERA_INICIAL = new THREE.Vector3(17, 15, 21);

/** Tamanho da plataforma de cada zona, seguindo a planta. */
const TAMANHOS: Record<string, [number, number]> = {
  quimica: [7, 6.6],
  mina: [7, 8.4],
  ferrorama: [15.5, 12.5],
  aeroporto: [7, 6.6],
  porto: [7, 8.4],
};

/**
 * Percorre a rede com os desvios atuais e devolve os trechos que o trem
 * realmente vai usar. Alimenta o destaque dos trilhos na cena e a lista
 * de rota no painel.
 */
function calcularRota(desvios: Record<string, EstadoDesvio>, sentido: number): string[] {
  const visitados: string[] = [];
  let atual = 'topo';

  for (let i = 0; i < 12; i++) {
    if (visitados.includes(atual)) break;
    visitados.push(atual);
    const no = sentido > 0 ? TRECHOS[atual].para : TRECHOS[atual].de;
    atual = proximoTrecho(no, sentido, desvios);
  }

  return visitados;
}

/* ============================================================
   Câmera
   ============================================================ */

function CameraFoco({
  selecionado,
  controlsRef,
}: {
  selecionado: string | null;
  controlsRef: React.RefObject<any>;
}) {
  const { camera } = useThree();
  const alvoPos = useRef(new THREE.Vector3().copy(CAMERA_INICIAL));
  const alvoOlhar = useRef(new THREE.Vector3(0, 0, 0));

  useEffect(() => {
    const pos = selecionado ? POSICOES[selecionado] : null;
    if (pos) {
      const [x, , z] = pos;
      alvoOlhar.current.set(x, 0.6, z);
      // Aproxima pelo lado de fora da placa, para não atravessar outra zona
      alvoPos.current.set(x + Math.sign(x || 1) * 6, 6, z + 8.5);
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

function PausarForaDaTela({ ativo }: { ativo: boolean }) {
  const { setFrameloop, invalidate } = useThree();
  useEffect(() => {
    setFrameloop(ativo ? 'always' : 'never');
    if (ativo) invalidate();
  }, [ativo, setFrameloop, invalidate]);
  return null;
}

/* ============================================================
   Etiquetas
   ============================================================ */

function Etiqueta({
  texto,
  cor,
  position,
}: {
  texto: string;
  cor: string;
  position: [number, number, number];
}) {
  return (
    <Html position={position} center distanceFactor={30} zIndexRange={[10, 0]}>
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
  desvios: Record<string, EstadoDesvio>;
  sentido: number;
  rotaAtiva: string[];
  etiquetas: boolean;
  controlsRef: React.RefObject<any>;
}

function Cena(props: CenaProps) {
  const {
    selecionado,
    destacado,
    setSelecionado,
    setDestacado,
    rodando,
    velocidade,
    desvios,
    sentido,
    rotaAtiva,
    etiquetas,
    controlsRef,
  } = props;

  const alternar = (id: string) => setSelecionado(selecionado === id ? null : id);

  const conteudo: Record<string, React.ReactNode> = {
    quimica: <CentralQuimica rodando={rodando} />,
    mina: <Mina rodando={rodando} />,
    ferrorama: (
      <Ferrovia
        rodando={rodando}
        velocidade={velocidade}
        desvios={desvios}
        sentido={sentido}
        rotaAtiva={rotaAtiva}
      />
    ),
    aeroporto: <Aeroporto rodando={rodando} />,
    porto: <Porto rodando={rodando} />,
  };

  return (
    <>
      <ambientLight intensity={0.6} color="#b8c4d4" />
      <directionalLight
        position={[14, 20, 12]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
      />
      <directionalLight position={[-12, 9, -10]} intensity={0.5} color={PALETA.accent} />
      <hemisphereLight args={['#5a6b7d', '#1a1410', 0.6]} />

      <Base />

      {MODULOS.map((mod) => (
        <group key={mod.id}>
          <Zona
            id={mod.id}
            cor={mod.cor}
            selecionado={selecionado === mod.id}
            destacado={destacado === mod.id}
            onSelecionar={alternar}
            onDestacar={setDestacado}
            position={POSICOES[mod.id]}
            tamanho={TAMANHOS[mod.id]}
          >
            {conteudo[mod.id]}
          </Zona>

          {etiquetas && (
            <Etiqueta
              texto={mod.nome}
              cor={mod.cor}
              position={[
                POSICOES[mod.id][0],
                mod.id === 'ferrorama' ? 4.2 : 3,
                POSICOES[mod.id][2] - TAMANHOS[mod.id][1] / 2 + 0.6,
              ]}
            />
          )}
        </group>
      ))}

      {/* Etiquetas dos desvios e do reversor, ancoradas nos pontos reais */}
      {etiquetas &&
        ORDEM_DESVIOS.map((id) => (
          <Etiqueta
            key={id}
            texto={id}
            cor={desvios[id] === 0 ? PALETA.glow : PALETA.warning}
            position={[
              POSICOES.ferrorama[0] + NOS[id].posicao.x,
              1.15,
              POSICOES.ferrorama[2] + NOS[id].posicao.z,
            ]}
          />
        ))}

      <ContactShadows position={[0, 0.02, 0]} opacity={0.4} scale={40} blur={2.6} far={7} />

      <OrbitControls
        ref={controlsRef}
        enablePan
        minDistance={8}
        maxDistance={46}
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

const NOMES_TRECHO: Record<string, string> = {
  topo: 'Reta principal (reversor)',
  fundo: 'Reta de baixo',
  esq: 'Curva da esquerda',
  diagA: 'Diagonal SW1-SW2',
  diagB: 'Diagonal SW3-SW1',
  manobra: 'Desvio de manobra',
};

export default function Maquete3D() {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [destacado, setDestacado] = useState<string | null>(null);
  const [rodando, setRodando] = useState(true);
  const [velocidade, setVelocidade] = useState(1);
  const [etiquetas, setEtiquetas] = useState(true);
  const [sentido, setSentido] = useState(1);
  const [desvios, setDesvios] = useState<Record<string, EstadoDesvio>>({
    SW1: 0,
    SW2: 0,
    SW3: 0,
  });
  const [visivel, setVisivel] = useState(true);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  const reduzido = usePrefersReducedMotion();

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting), {
      rootMargin: '150px',
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const rotaAtiva = useMemo(() => calcularRota(desvios, sentido), [desvios, sentido]);
  const modulo = MODULOS.find((m) => m.id === selecionado);
  const animando = rodando && !reduzido;

  const virarDesvio = (id: string) =>
    setDesvios((prev) => ({ ...prev, [id]: prev[id] === 0 ? 1 : 0 }));

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
          <fog attach="fog" args={[PALETA.dark, 40, 78]} />
          <PausarForaDaTela ativo={visivel} />
          <Cena
            selecionado={selecionado}
            destacado={destacado}
            setSelecionado={setSelecionado}
            setDestacado={setDestacado}
            rodando={animando}
            velocidade={velocidade}
            desvios={desvios}
            sentido={sentido}
            rotaAtiva={rotaAtiva}
            etiquetas={etiquetas}
            controlsRef={controlsRef}
          />
        </Canvas>

        <p className="maquete3d-dica" aria-hidden="true">
          Arraste para girar · Role para aproximar · Clique em uma zona
        </p>
      </div>

      {/* ---------- Painel de operação ---------- */}
      <div className="maquete3d-painel">
        {/* Reversor em destaque: é o controle mais chamativo da apresentação */}
        <div className="maquete3d-grupo">
          <span className="maquete3d-rotulo" id="rot-marcha">
            Reversor
          </span>
          <div className="maquete3d-reversor" role="group" aria-labelledby="rot-marcha">
            <button
              type="button"
              className={`maquete3d-btn maquete3d-btn-reversor ${sentido < 0 ? 'invertido' : ''}`}
              onClick={() => setSentido((s) => -s)}
              aria-pressed={sentido < 0}
            >
              <span className="maquete3d-seta" aria-hidden="true">
                {sentido > 0 ? '▶' : '◀'}
              </span>
              {sentido > 0 ? 'Marcha à frente' : 'Marcha à ré'}
            </button>
            <span className="maquete3d-status" role="status">
              Sentido {sentido > 0 ? 'normal' : 'invertido'}
            </span>
          </div>
        </div>

        {/* Desvios: mudam de verdade o caminho do trem */}
        <div className="maquete3d-grupo">
          <span className="maquete3d-rotulo" id="rot-desvios">
            Mudança de linha
          </span>
          <div className="maquete3d-desvios" role="group" aria-labelledby="rot-desvios">
            {ORDEM_DESVIOS.map((id) => {
              const estado = desvios[id];
              return (
                <button
                  key={id}
                  type="button"
                  className={`maquete3d-chave ${estado === 1 ? 'desviado' : ''}`}
                  onClick={() => virarDesvio(id)}
                  aria-pressed={estado === 1}
                  aria-label={`${id}: ${DESCRICAO_DESVIOS[id][estado]}. Ativar para trocar.`}
                >
                  <span className="maquete3d-chave-id">{id}</span>
                  <span className="maquete3d-chave-estado">
                    {estado === 0 ? 'RETO' : 'DESVIO'}
                  </span>
                  <span className="maquete3d-chave-desc">{DESCRICAO_DESVIOS[id][estado]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rota resultante — mostra ao público o efeito das chaves */}
        <div className="maquete3d-grupo">
          <span className="maquete3d-rotulo">Rota com esta configuração</span>
          <ol className="maquete3d-rota" aria-live="polite">
            {rotaAtiva.map((id) => (
              <li key={id}>{NOMES_TRECHO[id]}</li>
            ))}
          </ol>
        </div>

        <div className="maquete3d-grupo maquete3d-grupo-linha">
          <button
            type="button"
            className="maquete3d-btn maquete3d-btn-acao"
            onClick={() => setRodando((r) => !r)}
            aria-pressed={rodando}
          >
            {rodando ? 'Parar trem' : 'Iniciar trem'}
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
        </div>

        {/* Zonas */}
        <div className="maquete3d-grupo">
          <span className="maquete3d-rotulo" id="rot-zonas">
            Zonas da maquete
          </span>
          <div className="maquete3d-botoes" role="group" aria-labelledby="rot-zonas">
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
            <button
              type="button"
              className="maquete3d-btn maquete3d-btn-acao"
              onClick={() => setSelecionado(null)}
            >
              Ver tudo
            </button>
          </div>
        </div>
      </div>

      <div className="maquete3d-info" aria-live="polite">
        {modulo ? (
          <div
            className="maquete3d-ficha"
            style={{ '--ficha-cor': modulo.cor } as React.CSSProperties}
          >
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
            Vire uma chave e veja o trem mudar de linha. Clique em uma zona para ver como ela
            funciona na maquete real.
          </p>
        )}
      </div>

      {reduzido && (
        <p className="maquete3d-aviso">
          As animações estão pausadas porque seu sistema pede movimento reduzido. A maquete
          continua girando e clicável.
        </p>
      )}
    </div>
  );
}
