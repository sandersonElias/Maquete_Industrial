import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, ContactShadows } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { MODULOS, PALETA, POSICOES, VITRINE } from './modulos';
import {
  Zona,
  CentralQuimica,
  Mina,
  Porto,
  Predio,
  PlantaIndustrial,
} from './Modulos3D';
import {
  Pedestal,
  Vitrine,
  Terreno,
  Arvores,
  Veiculos,
  TurbinasEolicas,
  PainelSolar,
  EsferasArmazenamento,
  FeixeLuz,
  TubulacaoNeon,
} from './Cenario';
import Hologramas from './Hologramas';
import Ferrovia from './Ferrovia';
import {
  TRECHOS,
  NOS,
  ORDEM_DESVIOS,
  DESCRICAO_DESVIOS,
  EstadoDesvio,
  proximoTrecho,
} from './tracado';
import { usePrefersReducedMotion, EASE_OUT_EXPO } from '../../lib/motion';

const CAMERA_INICIAL = new THREE.Vector3(21, 17, 26);

/** Tamanho da plataforma de cada zona, seguindo a planta. */
const TAMANHOS: Record<string, [number, number]> = {
  quimica: [7, 6.6],
  mina: [7, 8.4],
  ferrorama: [15.5, 12.5],
  porto: [7, 8.4],
};

const NOMES_TRECHO: Record<string, string> = {
  topo: 'Reta principal (reversor)',
  fundo: 'Reta de baixo',
  esq: 'Curva da esquerda',
  diagA: 'Diagonal SW1-SW2',
  diagB: 'Diagonal SW3-SW1',
  manobra: 'Desvio de manobra',
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
  zoomAtivo: boolean;
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
    zoomAtivo,
  } = props;

  const alternar = (id: string) => setSelecionado(selecionado === id ? null : id);

  const conteudo: Record<string, React.ReactNode> = {
    quimica: (
      <group>
        <CentralQuimica rodando={rodando} />
        <PlantaIndustrial position={[-1.9, 0, 1.4]} />
        <EsferasArmazenamento position={[1.6, 0, 1.6]} />
        <Predio position={[2.4, 0, -2.2]} tamanho={[1.5, 1.7, 1.2]} andares={4} />
      </group>
    ),
    mina: (
      <group>
        <Mina rodando={rodando} />
        <Predio position={[-2.3, 0, 3]} tamanho={[1.3, 1.1, 1.1]} cor="#B9BEC6" andares={2} />
      </group>
    ),
    ferrorama: (
      <group>
        <Ferrovia
          rodando={rodando}
          velocidade={velocidade}
          desvios={desvios}
          sentido={sentido}
          rotaAtiva={rotaAtiva}
        />
        {/* Torre de controle luminosa no miolo do circuito — ocupa o lugar do
            reator da referência e é a âncora visual da cena */}
        <group position={[3.4, 0, 0]}>
          <mesh castShadow position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.42, 0.55, 1.8, 14]} />
            <meshStandardMaterial
              color="#1a3a6e"
              emissive={VITRINE.azul}
              emissiveIntensity={1.1}
              roughness={0.25}
              metalness={0.5}
            />
          </mesh>
          <mesh castShadow position={[0, 2, 0]}>
            <cylinderGeometry args={[0.72, 0.5, 0.5, 14]} />
            <meshStandardMaterial color="#dfe5ec" roughness={0.3} metalness={0.4} />
          </mesh>
          <mesh position={[0, 2.05, 0]}>
            <cylinderGeometry args={[0.74, 0.52, 0.24, 14]} />
            <meshStandardMaterial
              color={VITRINE.ciano}
              emissive={VITRINE.ciano}
              emissiveIntensity={1.6}
              toneMapped={false}
            />
          </mesh>
          <pointLight position={[0, 1.6, 0]} color={VITRINE.azul} intensity={4} distance={7} />
        </group>
        <FeixeLuz position={[3.4, 2.2, 0]} altura={4.4} raio={0.5} />
      </group>
),
    porto: (
      <group>
        <Porto rodando={rodando} />
        <Predio position={[-2.5, 0, -2.4]} tamanho={[1.1, 1.2, 1]} cor="#B9BEC6" andares={3} />
      </group>
    ),
  };

  return (
    <>
      {/* Luz de vitrine: spot branco de cima (como as luminárias do estande)
          e preenchimento azul frio vindo de baixo, que é o que dá o clima de
          peça iluminada dentro do vidro. */}
      <ambientLight intensity={0.5} color="#9fb3c8" />
      <directionalLight
        position={[14, 24, 12]}
        intensity={2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
      />
      <directionalLight position={[-14, 10, -12]} intensity={0.55} color={VITRINE.azul} />
      <hemisphereLight args={['#7d93ad', '#0c1017', 0.7]} />

      <Pedestal />
      <Terreno />
      <Arvores />
      <Veiculos rodando={rodando} />
      <TurbinasEolicas rodando={rodando} />
      <PainelSolar position={[-8.35, 0.02, -3.2]} />

      {/* Tubulação neon ligando os módulos, como na referência */}
      <TubulacaoNeon pontos={[[-9, -5.2], [-7, -3.6], [-7.6, 0], [-9, 4.4]]} />
      <TubulacaoNeon pontos={[[9, -5.2], [7.4, -3.4], [7.8, 0.4], [9, 4.4]]} />
      <TubulacaoNeon pontos={[[-8.6, 0], [-4, 0.3], [4, 0.3], [8.4, 0]]} />

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

      {/* Painéis de telemetria flutuando sobre a maquete */}
      <Hologramas
        dados={{
          velocidade,
          sentido,
          rodando,
          desvios,
          rota: rotaAtiva.map((id) => NOMES_TRECHO[id] ?? id),
        }}
      />

      <ContactShadows position={[0, 0.14, 0]} opacity={0.42} scale={42} blur={2.6} far={7} />

      {/* A vitrine entra por último: é transparente e não pode receber cliques */}
      <Vitrine />

      <OrbitControls
        ref={controlsRef}
        enablePan
        /* O zoom por roda do mouse fica DESLIGADO por padrão: era ele que
           engolia o evento `wheel` e impedia a página de rolar quando o cursor
           passava sobre a maquete. Só liga com Ctrl/⌘ ou em tela cheia. */
        enableZoom={zoomAtivo}
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
  const [modificadorAtivo, setModificadorAtivo] = useState(false);
  const [emTelaCheia, setEmTelaCheia] = useState(false);
  const [temFullscreen, setTemFullscreen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const palcoRef = useRef<HTMLDivElement>(null);
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

  /* ---------- Rolagem da página x zoom da cena ----------
     A roda do mouse tem que rolar o site normalmente. O zoom da maquete só
     entra com Ctrl/⌘ segurado, ou em tela cheia (onde não há página atrás
     para rolar). Sem isso o OrbitControls consome o `wheel` e o usuário fica
     preso na maquete, que era exatamente a reclamação. */
  useEffect(() => {
    const atualizar = (e: KeyboardEvent) => setModificadorAtivo(e.ctrlKey || e.metaKey);
    // `blur` cobre o caso de soltar a tecla fora da janela (ex.: Alt+Tab)
    const limpar = () => setModificadorAtivo(false);

    window.addEventListener('keydown', atualizar);
    window.addEventListener('keyup', atualizar);
    window.addEventListener('blur', limpar);
    return () => {
      window.removeEventListener('keydown', atualizar);
      window.removeEventListener('keyup', atualizar);
      window.removeEventListener('blur', limpar);
    };
  }, []);

  const zoomAtivo = modificadorAtivo || emTelaCheia;

  /* Com Ctrl/⌘ o navegador daria zoom na PÁGINA inteira. Como nesse caso o
     gesto é para a cena, cancelamos o padrão — mas só aí. Sem modificador o
     evento segue livre e a página rola. Precisa de passive:false para poder
     chamar preventDefault. */
  useEffect(() => {
    const el = palcoRef.current;
    if (!el) return;
    const aoRodar = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey || emTelaCheia) e.preventDefault();
    };
    el.addEventListener('wheel', aoRodar, { passive: false });
    return () => el.removeEventListener('wheel', aoRodar);
  }, [emTelaCheia]);

  /* ---------- Tela cheia ---------- */
  useEffect(() => {
    setTemFullscreen(
      typeof document !== 'undefined' &&
        (document.fullscreenEnabled ?? false) &&
        typeof wrapperRef.current?.requestFullscreen === 'function'
    );
  }, []);

  // O Esc do navegador sai da tela cheia sem passar pelo nosso botão, então o
  // estado do React precisa acompanhar o evento em vez de ser só um toggle.
  useEffect(() => {
    const aoTrocar = () => setEmTelaCheia(document.fullscreenElement === wrapperRef.current);
    document.addEventListener('fullscreenchange', aoTrocar);
    return () => document.removeEventListener('fullscreenchange', aoTrocar);
  }, []);

  const alternarTelaCheia = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await wrapperRef.current?.requestFullscreen();
    } catch {
      // Navegador pode negar (política de permissão). Falha em silêncio:
      // a maquete continua utilizável no tamanho normal.
      setTemFullscreen(false);
    }
  };

  const rotaAtiva = useMemo(() => calcularRota(desvios, sentido), [desvios, sentido]);
  const modulo = MODULOS.find((m) => m.id === selecionado);
  const animando = rodando && !reduzido;

  const virarDesvio = (id: string) =>
    setDesvios((prev) => ({ ...prev, [id]: prev[id] === 0 ? 1 : 0 }));

  return (
    <div className={`maquete3d ${emTelaCheia ? 'tela-cheia' : ''}`} ref={wrapperRef}>
      <div className="maquete3d-palco" ref={palcoRef}>
        <Canvas
          shadows
          /* Em tela cheia a área desenhada é bem maior; segurar o dpr evita
             derrubar o FPS em notebook com vídeo integrado. */
          dpr={emTelaCheia ? [1, 1.4] : [1, 1.75]}
          camera={{ position: CAMERA_INICIAL.toArray(), fov: 42 }}
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          onPointerMissed={() => setSelecionado(null)}
        >
          <color attach="background" args={[VITRINE.fundo]} />
          <fog attach="fog" args={[VITRINE.fundo, 46, 92]} />
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
            zoomAtivo={zoomAtivo}
          />
        </Canvas>

        {/* Ficha sobreposta à cena, perto de onde a pessoa clicou */}
        <AnimatePresence>
          {modulo && (
            <motion.aside
              key={modulo.id}
              className="maquete3d-ficha-flutuante"
              style={{ '--ficha-cor': modulo.cor } as React.CSSProperties}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: reduzido ? 0 : 0.28, ease: EASE_OUT_EXPO }}
            >
              <header>
                <span className="maquete3d-ficha-papel">{modulo.papel}</span>
                <h4>{modulo.nome}</h4>
                <button
                  type="button"
                  className="maquete3d-ficha-fechar"
                  onClick={() => setSelecionado(null)}
                  aria-label={`Fechar descrição de ${modulo.nome}`}
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </header>
              <p>{modulo.resumo}</p>
              <ul>
                {modulo.detalhes.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </motion.aside>
          )}
        </AnimatePresence>

        {temFullscreen && (
          <button
            type="button"
            className="maquete3d-btn-telacheia"
            onClick={alternarTelaCheia}
            aria-pressed={emTelaCheia}
          >
            <span aria-hidden="true">{emTelaCheia ? '⤡' : '⤢'}</span>
            {emTelaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
          </button>
        )}

        <p className="maquete3d-dica" aria-hidden="true">
          {emTelaCheia
            ? 'Arraste para girar · Role para aproximar · Clique em uma área · Esc para sair'
            : 'Arraste para girar · Ctrl + rolagem para aproximar · Clique em uma área'}
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

      {/* A descrição visível agora é a ficha flutuante sobre a cena. Esta região
          existe só para o leitor de tela anunciar a troca de área — repetir o
          texto na tela seria conteúdo duplicado. */}
      <div className="maquete3d-anuncio" aria-live="polite">
        {modulo
          ? `${modulo.nome}. ${modulo.papel}. ${modulo.resumo}`
          : 'Nenhuma área selecionada.'}
      </div>

      {!modulo && (
        <p className="maquete3d-vazio">
          Clique em qualquer construção da maquete para ver o que aquela área faz. Vire uma chave
          e veja o trem mudar de linha.
        </p>
      )}

      {reduzido && (
        <p className="maquete3d-aviso">
          As animações estão pausadas porque seu sistema pede movimento reduzido. A maquete
          continua girando e clicável.
        </p>
      )}
    </div>
  );
}
