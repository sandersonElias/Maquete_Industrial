import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETA } from './modulos';

/**
 * Painéis de telemetria flutuando acima do diorama.
 *
 * Cada painel é um único plano com uma CanvasTexture desenhada na API 2D.
 * Preferi isso ao <Html> do drei porque:
 *  - não cria nós no DOM (o drei cria um por painel, e eles competem com os
 *    controles de verdade na navegação por teclado);
 *  - o painel fica dentro da cena, então recebe o mesmo nevoeiro e a mesma
 *    perspectiva do resto — parece projetado no ar, não colado na tela.
 *
 * O canvas só é redesenhado quando os dados mudam de fato (ver `assinatura`),
 * não a cada quadro: redesenhar texto a 60 fps custa caro e não muda nada
 * visualmente.
 */

export interface DadosPainel {
  velocidade: number;
  sentido: number;
  rodando: boolean;
  desvios: Record<string, number>;
  rota: string[];
}

const L = 512;
const A = 320;

function moldura(ctx: CanvasRenderingContext2D, titulo: string) {
  ctx.clearRect(0, 0, L, A);

  // Fundo translúcido
  const g = ctx.createLinearGradient(0, 0, 0, A);
  g.addColorStop(0, 'rgba(10, 32, 52, 0.82)');
  g.addColorStop(1, 'rgba(6, 20, 36, 0.62)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, L, A);

  // Borda e cantos, no estilo HUD
  ctx.strokeStyle = PALETA.accent;
  ctx.lineWidth = 3;
  ctx.globalAlpha = 0.85;
  ctx.strokeRect(6, 6, L - 12, A - 12);

  ctx.lineWidth = 6;
  const c = 34;
  [[6, 6, 1, 1], [L - 6, 6, -1, 1], [6, A - 6, 1, -1], [L - 6, A - 6, -1, -1]].forEach(
    ([x, y, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(x + dx * c, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * c);
      ctx.stroke();
    }
  );
  ctx.globalAlpha = 1;

  // Título
  ctx.font = 'bold 30px Inter, sans-serif';
  ctx.fillStyle = PALETA.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.letterSpacing = '3px';
  ctx.fillText(titulo.toUpperCase(), 28, 26);

  ctx.strokeStyle = 'rgba(77, 216, 255, 0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(28, 70);
  ctx.lineTo(L - 28, 70);
  ctx.stroke();
}

/** Painel 1: marcha e velocidade, com um gráfico de barras. */
function desenharMarcha(ctx: CanvasRenderingContext2D, d: DadosPainel) {
  moldura(ctx, 'Tração');

  ctx.font = 'bold 76px Inter, sans-serif';
  ctx.fillStyle = '#eaf6ff';
  ctx.letterSpacing = '0px';
  ctx.fillText(`${d.velocidade.toFixed(2)}`, 28, 96);

  ctx.font = '500 24px Inter, sans-serif';
  ctx.fillStyle = 'rgba(190, 226, 250, 0.75)';
  ctx.fillText('x velocidade nominal', 30, 182);

  // Estado da marcha
  const cor = !d.rodando ? PALETA.warning : d.sentido > 0 ? PALETA.glow : PALETA.danger;
  const txt = !d.rodando ? 'PARADO' : d.sentido > 0 ? 'FRENTE' : 'RÉ';
  ctx.fillStyle = cor;
  ctx.font = 'bold 34px Inter, sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText(txt, 30, 224);

  // Barras de nível
  for (let i = 0; i < 12; i++) {
    const cheio = i / 12 < d.velocidade / 3;
    ctx.fillStyle = cheio ? PALETA.accent : 'rgba(77, 216, 255, 0.16)';
    ctx.fillRect(30 + i * 38, 274, 28, 18);
  }
}

/** Painel 2: estado dos três desvios. */
function desenharDesvios(ctx: CanvasRenderingContext2D, d: DadosPainel) {
  moldura(ctx, 'Desvios');

  ['SW1', 'SW2', 'SW3'].forEach((id, i) => {
    const y = 100 + i * 68;
    const desviado = d.desvios[id] === 1;

    ctx.font = 'bold 30px Inter, sans-serif';
    ctx.fillStyle = 'rgba(200, 232, 252, 0.9)';
    ctx.letterSpacing = '2px';
    ctx.fillText(id, 30, y);

    ctx.fillStyle = desviado ? PALETA.warning : PALETA.glow;
    ctx.font = 'bold 30px Inter, sans-serif';
    ctx.fillText(desviado ? 'DESVIO' : 'RETO', 130, y);

    // Diagrama do desvio: reta ou bifurcação
    ctx.strokeStyle = desviado ? PALETA.warning : PALETA.glow;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(300, y + 18);
    if (desviado) {
      ctx.lineTo(360, y + 18);
      ctx.lineTo(452, y - 8);
    } else {
      ctx.lineTo(452, y + 18);
    }
    ctx.stroke();
  });
}

/** Painel 3: rota resultante. */
function desenharRota(ctx: CanvasRenderingContext2D, d: DadosPainel) {
  moldura(ctx, 'Rota ativa');

  ctx.font = '600 25px Inter, sans-serif';
  ctx.letterSpacing = '0px';
  d.rota.slice(0, 5).forEach((nome, i) => {
    const y = 98 + i * 42;
    ctx.fillStyle = PALETA.accent;
    ctx.beginPath();
    ctx.arc(42, y + 9, 9, 0, Math.PI * 2);
    ctx.fill();

    if (i < Math.min(d.rota.length, 5) - 1) {
      ctx.strokeStyle = 'rgba(77, 216, 255, 0.45)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(42, y + 20);
      ctx.lineTo(42, y + 40);
      ctx.stroke();
    }

    ctx.fillStyle = '#dbeeff';
    ctx.fillText(nome, 70, y - 4);
  });
}

const DESENHOS = [desenharMarcha, desenharDesvios, desenharRota];
const TITULOS = ['marcha', 'desvios', 'rota'];

function PainelHolografico({
  indice,
  dados,
  position,
  rotationY,
}: {
  indice: number;
  dados: DadosPainel;
  position: [number, number, number];
  rotationY: number;
}) {
  const grupo = useRef<THREE.Group>(null);
  const baseY = position[1];

  const { textura, ctx } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = L;
    c.height = A;
    const contexto = c.getContext('2d')!;
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return { textura: t, ctx: contexto };
  }, []);

  /* Só redesenha quando algum dado realmente muda. Sem isso o canvas seria
     reenviado à GPU 60 vezes por segundo à toa. */
  const assinatura = `${dados.velocidade}|${dados.sentido}|${dados.rodando}|${
    dados.desvios.SW1
  }${dados.desvios.SW2}${dados.desvios.SW3}|${dados.rota.join(',')}`;

  useEffect(() => {
    DESENHOS[indice](ctx, dados);
    textura.needsUpdate = true;
  }, [assinatura, indice, ctx, textura, dados]);

  useEffect(() => () => textura.dispose(), [textura]);

  // Flutua de leve, para não parecer um adesivo parado no ar
  useFrame((state) => {
    if (!grupo.current) return;
    const t = state.clock.elapsedTime;
    grupo.current.position.y = baseY + Math.sin(t * 0.8 + indice * 1.7) * 0.12;
    grupo.current.rotation.z = Math.sin(t * 0.55 + indice) * 0.012;
  });

  return (
    <group ref={grupo} position={position} rotation={[0, rotationY, 0]} raycast={() => null}>
      <mesh raycast={() => null}>
        <planeGeometry args={[3.2, 2]} />
        <meshBasicMaterial
          map={textura}
          transparent
          opacity={0.92}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Halo atrás do painel */}
      <mesh position={[0, 0, -0.02]} raycast={() => null}>
        <planeGeometry args={[3.5, 2.3]} />
        <meshBasicMaterial
          color={PALETA.accent}
          transparent
          opacity={0.07}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Pé de luz ligando o painel à maquete, como uma projeção */}
      <mesh position={[0, -1.6, 0]} raycast={() => null}>
        <planeGeometry args={[0.06, 1.2]} />
        <meshBasicMaterial
          color={PALETA.accent}
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function Hologramas({ dados }: { dados: DadosPainel }) {
  const locais: Array<{ pos: [number, number, number]; rotY: number }> = [
    { pos: [-8.5, 6.6, -2], rotY: 0.42 },
    { pos: [-0.5, 7.6, -5.5], rotY: 0.06 },
    { pos: [8.5, 6.6, -2], rotY: -0.42 },
  ];

  return (
    <group>
      {locais.map((l, i) => (
        <PainelHolografico
          key={TITULOS[i]}
          indice={i}
          dados={dados}
          position={l.pos}
          rotationY={l.rotY}
        />
      ))}
    </group>
  );
}
