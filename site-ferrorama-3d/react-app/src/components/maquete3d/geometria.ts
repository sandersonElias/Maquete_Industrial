import * as THREE from 'three';

/**
 * Traçado do circuito ferroviário.
 *
 * Uma superelipse (n ≈ 3.2) em vez de uma elipse pura: dá o formato de
 * "estádio" dos trilhos reais em escala HO, com retas longas nas laterais e
 * curvas fechadas nas pontas, em vez de um oval uniforme.
 */
export function criarTracado(rx = 8, rz = 4.2, segmentos = 120): THREE.CatmullRomCurve3 {
  const pontos: THREE.Vector3[] = [];
  const n = 3.2;

  for (let i = 0; i < segmentos; i++) {
    const a = (i / segmentos) * Math.PI * 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    const x = Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * rx;
    const z = Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * rz;
    pontos.push(new THREE.Vector3(x, 0, z));
  }

  return new THREE.CatmullRomCurve3(pontos, true, 'catmullrom', 0.5);
}

/**
 * Gera uma curva paralela ao traçado, deslocada lateralmente.
 * Usada para desenhar os dois trilhos a partir de um único caminho central.
 */
export function curvaParalela(
  base: THREE.CatmullRomCurve3,
  deslocamento: number,
  /* 240 amostras: com 120 o reajuste da spline desviava até 0,5mm em escala
     nas curvas fechadas; dobrando, o erro cai pela metade e o custo é uma
     única vez na montagem. */
  amostras = 240
): THREE.CatmullRomCurve3 {
  const pontos: THREE.Vector3[] = [];
  const tangente = new THREE.Vector3();

  for (let i = 0; i < amostras; i++) {
    const t = i / amostras;
    const p = base.getPointAt(t);
    base.getTangentAt(t, tangente);
    // Perpendicular no plano XZ: gira a tangente 90°
    const perpX = -tangente.z;
    const perpZ = tangente.x;
    const len = Math.hypot(perpX, perpZ) || 1;
    pontos.push(new THREE.Vector3(p.x + (perpX / len) * deslocamento, p.y, p.z + (perpZ / len) * deslocamento));
  }

  return new THREE.CatmullRomCurve3(pontos, true, 'catmullrom', 0.5);
}

/**
 * Matrizes dos dormentes distribuídos ao longo do traçado.
 * Retorna dados prontos para um InstancedMesh — 90 dormentes em uma única
 * chamada de desenho, em vez de 90 meshes separados.
 */
export function matrizesDormentes(curva: THREE.CatmullRomCurve3, quantidade = 90): THREE.Matrix4[] {
  const matrizes: THREE.Matrix4[] = [];
  const tangente = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  for (let i = 0; i < quantidade; i++) {
    const t = i / quantidade;
    const p = curva.getPointAt(t);
    curva.getTangentAt(t, tangente);

    const angulo = Math.atan2(tangente.x, tangente.z);
    const m = new THREE.Matrix4();
    m.compose(
      new THREE.Vector3(p.x, p.y - 0.02, p.z),
      new THREE.Quaternion().setFromAxisAngle(up, angulo),
      new THREE.Vector3(1, 1, 1)
    );
    matrizes.push(m);
  }

  return matrizes;
}

/**
 * Posiciona e orienta um objeto sobre a curva na fração `t` (0 a 1).
 * O objeto sempre aponta para a frente do movimento e fica nivelado — sem
 * capotar nas curvas, que era o defeito da versão anterior em SVG.
 */
export function posicionarNaCurva(
  objeto: THREE.Object3D,
  curva: THREE.CatmullRomCurve3,
  t: number,
  alturaY = 0
) {
  const frac = ((t % 1) + 1) % 1;
  const p = curva.getPointAt(frac);
  const tangente = curva.getTangentAt(frac);

  objeto.position.set(p.x, p.y + alturaY, p.z);
  objeto.rotation.set(0, Math.atan2(tangente.x, tangente.z), 0);
}

/** Ramo visual até o porto ou aeroporto (desvios SW3/SW4). */
export type RamoFerroviario = 'nenhum' | 'porto' | 'aeroporto';

const DESTINO_PORTO = new THREE.Vector3(7.5, 0, 3.8);
const DESTINO_AEROPORTO = new THREE.Vector3(6.5, 0, -5.2);

/** Curva só do ramo — usada para desenhar trilhos secundários. */
export function criarRamoVisual(
  principal: THREE.CatmullRomCurve3,
  tipo: Exclude<RamoFerroviario, 'nenhum'>
): THREE.CatmullRomCurve3 {
  const destino = tipo === 'porto' ? DESTINO_PORTO : DESTINO_AEROPORTO;
  const tEntrada = tipo === 'porto' ? 0.3 : 0.38;
  const tSaida = tipo === 'porto' ? 0.46 : 0.54;
  const entrada = principal.getPointAt(tEntrada);
  const saida = principal.getPointAt(tSaida);
  const meio = new THREE.Vector3().lerpVectors(entrada, destino, 0.55);
  meio.y = 0;
  return new THREE.CatmullRomCurve3(
    [entrada, meio, destino.clone(), new THREE.Vector3().lerpVectors(destino, saida, 0.45), saida],
    false,
    'catmullrom',
    0.5
  );
}

/**
 * Loop principal com desvio pelo porto ou aeroporto conforme SW3/SW4.
 * LEFT → porto · RIGHT → aeroporto · CENTER → oval padrão.
 */
export function tracadoComDesvio(
  principal: THREE.CatmullRomCurve3,
  desvios: number[]
): THREE.CatmullRomCurve3 {
  const sw3 = desvios[2];
  const sw4 = desvios[3];
  const tipo: RamoFerroviario =
    sw3 === 1 || sw4 === 1 ? 'porto' : sw3 === 2 || sw4 === 2 ? 'aeroporto' : 'nenhum';

  if (tipo === 'nenhum') return principal;

  const destino = tipo === 'porto' ? DESTINO_PORTO : DESTINO_AEROPORTO;
  const tEntrada = tipo === 'porto' ? 0.3 : 0.38;
  const tSaida = tipo === 'porto' ? 0.46 : 0.54;
  const entrada = principal.getPointAt(tEntrada);
  const saida = principal.getPointAt(tSaida);
  const pontos: THREE.Vector3[] = [];

  const amostras = 36;
  for (let i = 0; i <= amostras; i++) {
    pontos.push(principal.getPointAt((i / amostras) * tEntrada));
  }

  pontos.push(
    entrada.clone(),
    new THREE.Vector3().lerpVectors(entrada, destino, 0.35),
    destino.clone(),
    new THREE.Vector3().lerpVectors(destino, saida, 0.35),
    saida.clone()
  );

  for (let i = 0; i <= amostras; i++) {
    pontos.push(principal.getPointAt(tSaida + (i / amostras) * (1 - tSaida)));
  }

  return new THREE.CatmullRomCurve3(pontos, true, 'catmullrom', 0.5);
}

export function ramoAtivo(desvios: number[]): RamoFerroviario {
  if (desvios[2] === 1 || desvios[3] === 1) return 'porto';
  if (desvios[2] === 2 || desvios[3] === 2) return 'aeroporto';
  return 'nenhum';
}
