import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { LoopRepeat, Vector3, type Object3D } from 'three';
import {
  PONTOS_HAUL_MINA,
  criarTracado,
  curvaEspelhadaZ,
  faseHaulCat,
  posicionarNaCurva,
  tMaisProximo,
  tracadoComDesvio,
} from './geometria';

const URL = '/models/maquete-blender.glb?v=fase17';
/**
 * Decodificador Draco servido pelo próprio site (`public/draco/`), não por CDN:
 * na 4G da feira uma requisição a um domínio de terceiro é mais um handshake
 * TLS e mais um ponto de falha. São ~250 KB (wasm + wrapper) baixados uma vez,
 * contra os megabytes que a compressão tira do `.glb`.
 *
 * Funciona nos dois sentidos: se o `.glb` for exportado SEM Draco, o
 * GLTFLoader simplesmente não aciona o decodificador.
 */
const DRACO = '/draco/';

/**
 * Fase 9 — composição articulada.
 *
 * Antes a locomotiva e os vagões eram filhos rígidos de um único `Trem`: o
 * React posicionava o pai na curva e o resto ia junto, em linha reta. Nas
 * curvas de raio 2,25 do oval a composição cortava o traçado por dentro e o
 * último vagão saía do lastro.
 *
 * Agora cada veículo é um nó próprio (`TremLoco`, `TremVagao0..N`) e cada um
 * anda no seu ponto de comprimento de arco, atrás do da frente. Os números
 * abaixo espelham `PASSO_VAGAO` e `N_VAGOES` em `scripts/maquete_bpy/vehicles.py`.
 */
const PASSO_VAGAO = 0.86;
const RECUO_PRIMEIRO_VAGAO = 1.06;
/** Altura do topo do boleto: as peças são modeladas com a base da roda em y=0. */
const ALTURA_BOLETO = 0.08;

/**
 * Fase 22 — a composição para onde é carregada e descarregada.
 *
 * Até aqui o trem dava voltas em velocidade constante, e era isso que mais
 * denunciava a animação: um trem de minério passa a maior parte do dia parado.
 * Ele frea antes do ponto, fica parado o tempo do serviço e sai acelerando.
 *
 * Os pontos estão em coordenadas de planta (as do `geometria.ts`, Z ainda não
 * espelhado) e são casados com a rota vigente em tempo de montagem: quando o
 * desvio da mina não está aberto, o ramal não faz parte da rota e a parada da
 * mina simplesmente não existe naquele giro. Os dois primeiros são as pontas
 * dos balões — a moega da mina e o virador do porto, onde o serviço é longo;
 * os dois últimos são as plataformas dentro do oval (`Plat0`/`Plat1` em
 * `railway.py`), onde a parada é curta, de estação.
 */
const PARADAS: { ponto: [number, number]; espera: number }[] = [
  { ponto: [-18.8, -8.25], espera: 6.5 },
  { ponto: [19.95, 8.15], espera: 6.5 },
  { ponto: [-8.55, -1.45], espera: 2.6 },
  { ponto: [8.55, 2.55], espera: 2.6 },
];
/** Distância máxima entre o ponto de serviço e a rota para a parada valer. */
const RAIO_PARADA = 1.4;
/** Trecho de frenagem antes da parada, em fração de volta. */
const FREIO = 0.045;
/** Fração de volta abaixo da qual a composição é considerada no ponto. */
const NO_PONTO = 0.0015;

/**
 * Fase 5 — o modelo do Blender chegava sem sombra nenhuma: esta função tinha o
 * nome certo e não ligava `castShadow`/`receiveShadow` em coisa alguma, e ainda
 * zerava `envMapIntensity`, o que deixava todo o metal chapado. As sombras de
 * contato são o que assenta um equipamento no chão; a reflexão do ambiente é o
 * que separa aço de plástico.
 *
 * Só objetos com raio de bounding sphere acima do limiar projetam sombra: um
 * cone de trânsito de 5 cm custa a mesma passada de shadow map que um galpão e
 * não aparece. O `Canvas` já desliga sombra inteira no celular (`shadows={!leve}`).
 */
const RAIO_MIN_SOMBRA = 0.28;
const SEM_SOMBRA = /^(agua|grama|terreno|placa|capim)/i;
/**
 * Restos do aeroporto antigo, que nenhum script gera mais mas que ficariam
 * visíveis se um `.glb` velho fosse servido. `terminal` leva um lookahead
 * negativo porque o `TerminalCarvao` da mina é legítimo e estava sendo
 * escondido junto — a cava de carvão aparecia sem o terminal de carga.
 */
/**
 * Fase 11 — adereços que o celular não precisa desenhar.
 *
 * Cone de trânsito, poça, mancha de óleo, palete, tambor e marco quilométrico
 * ocupam dois ou três pixels num telefone e custam uma chamada de desenho
 * cada. Some no tier `leve`; as pessoas ficam, porque são elas que dão a
 * escala e sem elas a maquete vira maquete de novo.
 */
const ADERECOS = /^(cone|poca|oleo|palete|tambores|sucata|marcokm|bandeiras)/i;

const OCULTOS = /^(pista|terminal(?!carvao)|hangar|torre|c5|estradaaero|termvidro|torrecab|plat2|casa2|telhado2|janela2)/i;

const _haulDir = new Vector3();
const _haulPos = new Vector3();

/** Anda na polilinha reta (espaço GLB, Z já espelhado) sem Catmull. */
function posicionarNoHaul(
  objeto: Object3D,
  pts: Vector3[],
  u: number,
  frente: 'plusZ' | 'minusZ'
) {
  const t = Math.max(0, Math.min(1, u));
  let total = 0;
  const lens: number[] = [0];
  for (let i = 0; i < pts.length - 1; i++) {
    total += pts[i].distanceTo(pts[i + 1]);
    lens.push(total);
  }
  const alvo = t * total;
  let i = 0;
  while (i < pts.length - 2 && lens[i + 1] < alvo) i++;
  const span = Math.max(lens[i + 1] - lens[i], 1e-6);
  const local = (alvo - lens[i]) / span;
  _haulPos.lerpVectors(pts[i], pts[i + 1], local);
  _haulDir.subVectors(pts[i + 1], pts[i]).normalize();
  if (_haulDir.lengthSq() < 1e-8) _haulDir.set(0, 0, 1);
  const yaw = Math.atan2(_haulDir.x, _haulDir.z) + (frente === 'minusZ' ? Math.PI : 0);
  objeto.position.copy(_haulPos);
  objeto.rotation.set(0, yaw, 0);
}

function prepararSombras(obj: Object3D, leve: boolean) {
  obj.traverse((child) => {
    if (OCULTOS.test(child.name)) {
      child.visible = false;
      return;
    }
    const mesh = child as Object3D & {
      isMesh?: boolean;
      material?: unknown;
      geometry?: {
        boundingSphere?: { radius: number } | null;
        computeBoundingSphere?: () => void;
      };
    };
    if (!mesh.isMesh) return;
    child.visible = !(leve && ADERECOS.test(child.name));

    const g = mesh.geometry;
    if (g && !g.boundingSphere) g.computeBoundingSphere?.();
    const raio = g?.boundingSphere?.radius ?? 0;
    mesh.castShadow = raio >= RAIO_MIN_SOMBRA && !SEM_SOMBRA.test(child.name);
    mesh.receiveShadow = true;

    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach((raw) => {
      const m = raw as {
        name?: string;
        envMapIntensity?: number;
        metalness?: number;
        roughness?: number;
        color?: { setRGB?: (r: number, g: number, b: number) => void };
      } | null;
      if (!m) return;
      const names = `${child.name} ${m.name || ''}`.toLowerCase();
      // Reflexão do ambiente ligada — o IBL vem dos Lightformers em Maquete3D.
      if ('envMapIntensity' in m) m.envMapIntensity = 0.55;
      if (
        names.includes('grama') ||
        names.includes('copa') ||
        names.includes('grass') ||
        // O entorno (`TerrenoLonge`, material `Mata`) nascia num verde escuro
        // dessaturado que, sob o sol de dia e o tonemapping, lia como um
        // amarelo-mostarda: a maquete ficava numa ilha verde no meio de um
        // descampado seco. Entra no mesmo ramo da grama e recebe exatamente a
        // mesma cor, para que o solo do tabuleiro e a serra ao redor sejam a
        // mesma paisagem. A névoa continua apagando a serra ao longe.
        names.includes('mata') ||
        names.includes('terrenolonge')
      ) {
        if ('metalness' in m) m.metalness = 0;
        if ('roughness' in m) m.roughness = 1;
        if ('envMapIntensity' in m) m.envMapIntensity = 0.12;
        m.color?.setRGB?.(0.28, 0.48, 0.18);
      }
      if (names.includes('terra') || names.includes('rocha') || names.includes('lastro')) {
        if ('metalness' in m) m.metalness = 0;
        if ('roughness' in m) m.roughness = 0.98;
        if ('envMapIntensity' in m) m.envMapIntensity = 0.18;
      }
    });
  });
}

export function MaqueteBlender({
  rodando,
  velocidade = 1,
  desvios,
  onDesvio,
  leve = false,
}: {
  rodando: boolean;
  velocidade?: number;
  desvios: number[];
  onDesvio?: (indice: number) => void;
  leve?: boolean;
}) {
  const { scene, animations } = useGLTF(URL, DRACO);
  const { actions, mixer } = useAnimations(animations, scene);
  const tremRef = useRef<Object3D | null>(null);
  /** Veículos na ordem da composição; vazio quando o .glb ainda é o antigo. */
  const veiculosRef = useRef<Object3D[]>([]);
  const catRef = useRef<Object3D | null>(null);
  const cacambaRef = useRef<Object3D | null>(null);
  const progresso = useRef(0);
  const haulCiclo = useRef(0);
  /** Segundos restantes de serviço; > 0 significa composição parada. */
  const espera = useRef(0);
  /** Fator de velocidade suavizado, de 0 (parado) a 1 (em trânsito). */
  const fatorVel = useRef(1);
  // Traçado no espaço do GLB (Z espelhado pelo export Blender→glTF).
  const rota = useMemo(() => {
    const r = tracadoComDesvio(criarTracado(), desvios ?? [0, 0, 0, 0]);
    return curvaEspelhadaZ(r);
  }, [desvios]);
  const haulPts = useMemo(
    () => PONTOS_HAUL_MINA.map(([x, y, z]) => new Vector3(x, y, -z)),
    []
  );
  /** Paradas que a rota vigente de fato serve, já em fração de volta. */
  const paradas = useMemo(() => {
    const alvo = new Vector3();
    return PARADAS.flatMap(({ ponto, espera: seg }) => {
      alvo.set(ponto[0], 0, -ponto[1]);
      // Amostragem fina: com as 220 amostras padrao o ponto de parada erra ate
      // 20 cm ao longo da via, e 20 cm numa plataforma de 1,85 aparecem.
      const t = tMaisProximo(rota, alvo, 2400);
      const dist = rota.getPointAt(t).distanceTo(alvo);
      return dist <= RAIO_PARADA ? [{ t, espera: seg }] : [];
    });
  }, [rota]);

  useLayoutEffect(() => {
    prepararSombras(scene, leve);
    tremRef.current = null;
    catRef.current = null;
    cacambaRef.current = null;
    const vagoes: Object3D[] = [];
    let loco: Object3D | null = null;
    scene.traverse((obj) => {
      if (obj.name === 'Trem') tremRef.current = obj;
      if (obj.name === 'TremLoco') loco = obj;
      const mv = /^TremVagao(\d+)$/.exec(obj.name);
      if (mv) vagoes[Number(mv[1])] = obj;
      if (obj.name === 'CAT') catRef.current = obj;
      if (obj.name === 'CATCacamba') cacambaRef.current = obj;
    });
    // `attach` tira o veículo de baixo do `Trem` preservando a pose no mundo;
    // sem isso o transform do pai se somaria ao que escrevemos por quadro.
    const lista = loco ? [loco, ...vagoes.filter(Boolean)] : [];
    lista.forEach((v) => scene.attach(v));
    veiculosRef.current = lista;
  }, [scene, leve]);

  useEffect(() => {
    if (!tremRef.current) return;
    progresso.current = tMaisProximo(rota, tremRef.current.position);
  }, [rota]);

  useEffect(() => {
    const list = Object.entries(actions).filter(([, a]) => a);
    list.forEach(([nome, a]) => {
      if (/trem|^cat$|cat\./i.test(nome)) {
        a!.stop();
        return;
      }
      a!.reset();
      a!.enabled = true;
      a!.setLoop(LoopRepeat, Infinity);
      a!.play();
    });
    return () => list.forEach(([, a]) => a?.stop());
  }, [actions]);

  useFrame((_, delta) => {
    mixer.timeScale = rodando ? velocidade : 0;
    if (rodando) {
      // Distância, em fração de volta, até a próxima parada À FRENTE. Só olhar
      // para a frente é o que impede a composição de frear de novo assim que
      // sai do ponto: um passo depois de servir a parada, ela está a quase uma
      // volta inteira dali.
      const frac = ((progresso.current % 1) + 1) % 1;
      let vao = Infinity;
      let servico = 0;
      for (const p of paradas) {
        let d = p.t - frac;
        if (d < 0) d += 1;
        if (d < vao) {
          vao = d;
          servico = p.espera;
        }
      }

      let alvo = 1;
      if (espera.current > 0) {
        // Parada: o serviço corre no tempo do relógio, mas acompanha o
        // acelerador da interface para não parecer travamento quando alguém
        // põe a simulação em 3x.
        espera.current -= delta * velocidade;
        alvo = 0;
        if (espera.current <= 0) {
          espera.current = 0;
          // Empurrãozinho para sair do ponto: sem ele `vao` continuaria zero
          // por um quadro e a parada dispararia de novo.
          progresso.current += NO_PONTO * 2;
        }
      } else if (vao < FREIO) {
        // Frenagem quadrática: solta cedo, aperta perto do ponto.
        const u = vao / FREIO;
        alvo = Math.max(u * u, 0.04);
        if (vao < NO_PONTO) {
          espera.current = servico;
          alvo = 0;
        }
      }
      // A inércia da própria composição: nem o freio nem a partida são degraus.
      fatorVel.current += (alvo - fatorVel.current) * Math.min(delta * 2.6, 1);

      progresso.current += delta * 0.046 * velocidade * fatorVel.current;
      haulCiclo.current += delta * 0.055 * velocidade;
    }
    const veiculos = veiculosRef.current;
    if (veiculos.length) {
      // Cada veículo no seu comprimento de arco: a locomotiva na cabeça e cada
      // vagão um passo atrás. O nariz do GLB fica em local −Z.
      const volta = rota.getLength() || 1;
      for (let i = 0; i < veiculos.length; i++) {
        const recuo = i === 0 ? 0 : RECUO_PRIMEIRO_VAGAO + (i - 1) * PASSO_VAGAO;
        posicionarNaCurva(veiculos[i], rota, progresso.current - recuo / volta, ALTURA_BOLETO, 'minusZ');
      }
    } else if (tremRef.current) {
      // `.glb` antigo, sem os nós por veículo: move a composição inteira.
      posicionarNaCurva(tremRef.current, rota, progresso.current, ALTURA_BOLETO, 'minusZ');
    }
    if (catRef.current) {
      const { u, dump } = faseHaulCat(haulCiclo.current);
      // CCab no GLB em −Z; segmentos retos = sem drift.
      posicionarNoHaul(catRef.current, haulPts, u, 'minusZ');
      if (cacambaRef.current) {
        cacambaRef.current.rotation.set(dump, 0, 0);
      }
    }
  });

  return (
    <primitive
      object={scene}
      onClick={(e: { stopPropagation: () => void; object: Object3D }) => {
        e.stopPropagation();
        let obj: Object3D | null = e.object;
        while (obj) {
          const m = obj.name.match(/^Desvio(\d)/);
          if (m && onDesvio) {
            onDesvio(Number(m[1]));
            return;
          }
          obj = obj.parent;
        }
      }}
    />
  );
}

useGLTF.preload(URL, DRACO);
