"""O catálogo — a lista fechada dos assets, com metadados e origem.

Cada linha aqui é um **termo independente**: um `slug` estável, a função que o
constrói, a família a que pertence, a pegada aproximada em unidades do
tabuleiro e a foto de referência de onde ele saiu.

Para que serve cada campo:

* `slug` — a chave. Nunca muda; é por ele que a folha de contato, o verificador
  de layout e as instruções de posicionamento se referem ao asset.
* `fn` — a função construtora. Assinatura idêntica em todos:
  `fn(name, x, z, m, yaw=0, escala=1, sal=0, y=0, **kw)`, devolvendo a lista de
  objetos criados.
* `larg`, `prof`, `alt` — a caixa envolvente aproximada, em unidades. Serve
  para espaçar a folha de contato e para o pré-voo de layout saber quanto
  espaço reservar antes de plantar.
* `afunda` — quanto a peça desce abaixo da própria base, quando isso é de
  propósito (a defensa de pneu do cais pende para dentro d'água, a canaleta é
  escavada). Sem esse campo a auditoria acusaria as duas como afundadas.
* `ref` — o arquivo em `design/referencias/` que justifica o desenho. Um asset
  sem referência é um asset inventado, e é assim que a qualidade cai.

Nada aqui constrói nada por conta própria: importar este módulo não toca no
Blender. É só descrição.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

from . import beneficiamento as _ben
from . import edificacoes as _edi
from . import extracao as _ext
from . import ferrovia as _fer
from . import infraestrutura as _inf
from . import patio as _pat
from . import porto as _por
from . import rodoviario as _rod
from . import vegetacao as _veg

REF_CAVA = "mina-cava-ferromodelismo.png"
REF_MINA = "mina-operacao-aerea.png"
REF_PORTO = "porto-maquete-navio.png"
REF_TERMINAL = "terminal-logistico-aereo.png"
REF_FABRICA = "fabrica-corte-didatico.png"
REF_ARVORES = "arvores-ferromodelismo.png"


@dataclass(frozen=True)
class Asset:
    slug: str
    nome: str
    familia: str
    fn: Callable
    larg: float
    prof: float
    alt: float
    ref: str
    afunda: float = 0.0


def _a(slug, nome, familia, fn, larg, prof, alt, ref, afunda=0.0):
    return Asset(slug, nome, familia, fn, larg, prof, alt, ref, afunda)


# --- A. Extração -----------------------------------------------------------
EXTRACAO = [
    _a("torre-extracao", "Torre de extração", "extracao", _ext.torre_extracao, 2.4, 0.9, 3.4, REF_MINA),
    _a("escavadeira-cabo", "Pá mecânica de cabo", "extracao", _ext.escavadeira_cabo, 1.9, 1.6, 2.2, REF_CAVA),
    _a("escavadeira-hidraulica", "Escavadeira hidráulica", "extracao", _ext.escavadeira_hidraulica, 1.8, 1.0, 1.2, REF_CAVA),
    _a("caminhao-fora-estrada", "Caminhão fora-de-estrada", "extracao", _ext.caminhao_fora_estrada, 1.1, 0.6, 0.7, REF_CAVA),
    _a("caminhao-articulado", "Caminhão articulado 6x6", "extracao", _ext.caminhao_articulado, 1.2, 0.5, 0.6, REF_CAVA),
    _a("perfuratriz", "Perfuratriz de bancada", "extracao", _ext.perfuratriz, 0.9, 0.5, 1.5, REF_CAVA),
    _a("trator-esteira", "Trator de esteiras", "extracao", _ext.trator_esteira, 0.9, 0.6, 0.5, REF_CAVA),
    _a("carregadeira", "Pá carregadeira", "extracao", _ext.carregadeira, 1.0, 0.5, 0.5, REF_CAVA),
    _a("motoniveladora", "Motoniveladora", "extracao", _ext.motoniveladora, 1.0, 0.4, 0.45, REF_MINA),
    _a("monte-terra", "Monte de terra", "extracao", _ext.monte_terra, 1.9, 1.9, 0.35, REF_MINA),
    _a("monte-minerio", "Pilha de minério", "extracao", _ext.monte_minerio, 1.5, 1.5, 0.45, REF_MINA),
    _a("bancada-rocha", "Bancada de talude", "extracao", _ext.bancada_rocha, 2.4, 1.2, 1.2, REF_CAVA),
    _a("poca-lama", "Poça de lama", "extracao", _ext.poca_lama, 0.6, 0.6, 0.02, REF_CAVA),
    _a("marca-pneu", "Rastro de pneu", "extracao", _ext.marca_pneu, 1.4, 0.5, 0.01, REF_MINA),
]

# --- B. Beneficiamento -----------------------------------------------------
BENEFICIAMENTO = [
    _a("moega", "Moega de recebimento", "beneficiamento", _ben.moega, 2.6, 1.1, 0.75, REF_MINA),
    _a("britador-mandibula", "Britador de mandíbulas", "beneficiamento", _ben.britador_mandibula, 0.9, 0.7, 0.6, REF_MINA),
    _a("britador-conico", "Britador cônico", "beneficiamento", _ben.britador_conico, 0.9, 0.7, 1.1, REF_MINA),
    _a("peneira-vibratoria", "Peneira vibratória", "beneficiamento", _ben.peneira_vibratoria, 1.1, 0.5, 0.8, REF_MINA),
    _a("silo-conico", "Silo de embarque", "beneficiamento", _ben.silo_conico, 0.8, 0.8, 1.7, REF_MINA),
    _a("silo-cilindrico", "Silo de estoque", "beneficiamento", _ben.silo_cilindrico, 0.9, 0.9, 1.3, REF_MINA),
    _a("tanque-agitador", "Tanque agitador", "beneficiamento", _ben.tanque_agitador, 0.7, 0.7, 0.9, REF_MINA),
    _a("espessador", "Espessador", "beneficiamento", _ben.espessador, 2.0, 2.0, 0.6, REF_MINA),
    _a("celula-flotacao", "Bateria de flotação", "beneficiamento", _ben.celula_flotacao, 1.5, 0.8, 0.7, REF_MINA),
    _a("filtro-prensa", "Filtro prensa", "beneficiamento", _ben.filtro_prensa, 1.0, 0.5, 0.5, REF_MINA),
    _a("galeria-correia", "Galeria de correia", "beneficiamento", _ben.galeria_correia, 3.0, 0.4, 1.2, REF_MINA),
    _a("torre-transferencia", "Torre de transferência", "beneficiamento", _ben.torre_transferencia, 0.9, 0.9, 2.6, REF_MINA),
    _a("chute-carga", "Chute de carregamento", "beneficiamento", _ben.chute_carga, 0.7, 1.0, 1.4, REF_MINA),
]

# --- C. Edificações --------------------------------------------------------
EDIFICACOES = [
    _a("galpao-industrial", "Galpão de duas águas", "edificacoes", _edi.galpao_industrial, 5.0, 2.2, 1.3, REF_MINA),
    _a("galpao-arco", "Galpão de cobertura em arco", "edificacoes", _edi.galpao_arco, 3.6, 2.0, 1.2, REF_MINA),
    _a("predio-administrativo", "Prédio administrativo", "edificacoes", _edi.predio_administrativo, 3.2, 2.2, 1.0, REF_TERMINAL),
    _a("predio-vidro", "Bloco envidraçado", "edificacoes", _edi.predio_vidro, 2.4, 1.6, 1.4, REF_TERMINAL),
    _a("oficina-manutencao", "Oficina de manutenção", "edificacoes", _edi.oficina_manutencao, 3.4, 2.8, 1.6, REF_MINA),
    _a("subestacao", "Subestação", "edificacoes", _edi.subestacao, 2.5, 1.8, 1.3, REF_MINA),
    _a("casa-bombas", "Casa de bombas", "edificacoes", _edi.casa_bombas, 1.2, 1.1, 0.6, REF_MINA),
    _a("guarita", "Guarita com cancela", "edificacoes", _edi.guarita, 0.6, 1.2, 0.35, REF_TERMINAL),
    _a("vestiario", "Vestiário", "edificacoes", _edi.vestiario, 2.0, 1.0, 0.7, REF_MINA),
    _a("refeitorio", "Refeitório", "edificacoes", _edi.refeitorio, 2.6, 1.8, 0.5, REF_TERMINAL),
    _a("laboratorio", "Laboratório de análises", "edificacoes", _edi.laboratorio, 1.7, 1.2, 0.7, REF_MINA),
    _a("almoxarifado", "Almoxarifado com doca", "edificacoes", _edi.almoxarifado, 2.6, 1.8, 1.0, REF_TERMINAL),
    _a("torre-agua", "Torre d'água", "edificacoes", _edi.torre_agua, 0.8, 0.8, 2.6, REF_MINA),
]

# --- D. Ferrovia -----------------------------------------------------------
FERROVIA = [
    _a("via-ferrea", "Trecho de via", "ferrovia", _fer.via_ferrea, 2.0, 0.45, 0.09, REF_MINA),
    _a("amv", "Aparelho de mudança de via", "ferrovia", _fer.aparelho_mudanca_via, 1.3, 0.8, 0.35, REF_MINA),
    _a("para-choque", "Para-choque de fim de linha", "ferrovia", _fer.para_choque, 0.4, 0.35, 0.3, REF_PORTO),
    _a("marco-km", "Marco quilométrico", "ferrovia", _fer.marco_km, 0.1, 0.1, 0.2, REF_MINA),
    _a("passagem-nivel", "Passagem de nível", "ferrovia", _fer.passagem_nivel, 0.8, 0.9, 0.35, REF_MINA),
    _a("sinal-ferroviario", "Sinal luminoso", "ferrovia", _fer.sinal_ferroviario, 0.25, 0.15, 0.8, REF_PORTO),
    _a("locomotiva-diesel", "Locomotiva diesel", "ferrovia", _fer.locomotiva_diesel, 1.9, 0.32, 0.55, REF_PORTO),
    _a("vagao-gondola", "Vagão gôndola", "ferrovia", _fer.vagao_gondola, 1.25, 0.3, 0.45, REF_MINA),
    _a("vagao-hopper", "Vagão hopper", "ferrovia", _fer.vagao_hopper, 1.3, 0.3, 0.5, REF_MINA),
    _a("vagao-tanque", "Vagão tanque", "ferrovia", _fer.vagao_tanque, 1.35, 0.32, 0.5, REF_PORTO),
    _a("vagonete", "Vagonete de mina", "ferrovia", _fer.vagonete, 0.32, 0.22, 0.25, REF_MINA),
    _a("plataforma-estacao", "Plataforma de estação", "ferrovia", _fer.plataforma_estacao, 3.0, 0.55, 0.5, REF_PORTO),
]

# --- E. Porto --------------------------------------------------------------
PORTO = [
    _a("guindaste-portico", "Pórtico de cais", "porto", _por.guindaste_portico, 3.4, 2.4, 3.9, REF_PORTO),
    _a("guindaste-trelicado", "Guindaste treliçado", "porto", _por.guindaste_trelicado, 3.0, 1.2, 3.4, REF_PORTO),
    _a("guindaste-torre", "Guindaste de torre", "porto", _por.guindaste_torre, 4.2, 0.9, 4.5, REF_PORTO),
    _a("shiploader", "Carregador de navio", "porto", _por.shiploader, 4.2, 1.4, 3.2, REF_PORTO),
    _a("navio-graneleiro", "Navio graneleiro", "porto", _por.navio_graneleiro, 11.0, 1.8, 3.4, REF_PORTO),
    _a("barcaca", "Barcaça de granel", "porto", _por.barcaca, 5.0, 1.2, 0.6, REF_PORTO),
    _a("rebocador", "Rebocador", "porto", _por.rebocador, 2.6, 0.9, 1.7, REF_PORTO),
    _a("cabeco-defensa", "Borda de cais", "porto", _por.cabeco_defensa, 0.8, 0.3, 0.15, REF_PORTO, afunda=0.36),
    _a("conteiner", "Contêiner marítimo", "porto", _por.conteiner, 1.25, 0.26, 0.27, REF_PORTO),
    _a("pilha-conteiner", "Pilha de contêineres", "porto", _por.pilha_conteiner, 1.25, 1.0, 0.8, REF_TERMINAL),
    _a("armazem-cais", "Armazém de cais", "porto", _por.armazem_cais, 4.6, 2.0, 1.3, REF_PORTO),
]

# --- F. Rodoviário ---------------------------------------------------------
RODOVIARIO = [
    _a("caminhao-bau", "Caminhão de baú", "rodoviario", _rod.caminhao_bau, 0.9, 0.25, 0.35, REF_TERMINAL),
    _a("carreta-bitrem", "Carreta com semirreboque", "rodoviario", _rod.carreta_bitrem, 1.9, 0.3, 0.4, REF_TERMINAL),
    _a("caminhao-basculante", "Caminhão caçamba", "rodoviario", _rod.caminhao_basculante, 0.95, 0.25, 0.35, REF_MINA),
    _a("caminhao-tanque", "Caminhão-tanque", "rodoviario", _rod.caminhao_tanque, 0.98, 0.25, 0.4, REF_MINA),
    _a("van-utilitaria", "Van de serviço", "rodoviario", _rod.van_utilitaria, 0.6, 0.21, 0.25, REF_TERMINAL),
    _a("pickup", "Picape cabine dupla", "rodoviario", _rod.pickup, 0.6, 0.2, 0.28, REF_MINA),
    _a("carro-passeio", "Carro de passeio", "rodoviario", _rod.carro_passeio, 0.45, 0.19, 0.16, REF_TERMINAL),
    _a("onibus-funcionarios", "Ônibus de turno", "rodoviario", _rod.onibus_funcionarios, 1.25, 0.27, 0.35, REF_TERMINAL),
    _a("empilhadeira", "Empilhadeira", "rodoviario", _rod.empilhadeira, 0.35, 0.14, 0.36, REF_TERMINAL),
    _a("plataforma-elevatoria", "Plataforma elevatória", "rodoviario", _rod.plataforma_elevatoria, 0.4, 0.25, 0.72, REF_TERMINAL),
]

# --- G. Infraestrutura -----------------------------------------------------
INFRAESTRUTURA = [
    _a("poste-iluminacao", "Poste de iluminação", "infraestrutura", _inf.poste_iluminacao, 0.07, 0.35, 1.2, REF_TERMINAL),
    _a("torre-holofote", "Torre de holofotes", "infraestrutura", _inf.torre_holofote, 0.4, 0.4, 2.7, REF_MINA),
    _a("torre-transmissao", "Torre de transmissão", "infraestrutura", _inf.torre_transmissao, 0.9, 1.6, 4.0, REF_MINA),
    _a("poste-energia", "Poste de distribuição", "infraestrutura", _inf.poste_energia, 0.04, 0.26, 1.0, REF_MINA),
    _a("linha-energia", "Trecho de rede aérea", "infraestrutura", _inf.linha_energia, 14.0, 0.26, 1.0, REF_MINA),
    _a("pipe-rack", "Rack de tubulação", "infraestrutura", _inf.pipe_rack, 4.0, 0.45, 0.65, REF_MINA),
    _a("tubulacao-aerea", "Travessia de tubulação", "infraestrutura", _inf.tubulacao_aerea, 1.8, 0.5, 1.0, REF_MINA),
    _a("cerca-industrial", "Cerca de perímetro", "infraestrutura", _inf.cerca_industrial, 3.0, 0.06, 0.3, REF_MINA),
    _a("muro-concreto", "Muro pré-moldado", "infraestrutura", _inf.muro_concreto, 3.0, 0.06, 0.32, REF_TERMINAL),
    _a("portao-deslizante", "Portão de correr", "infraestrutura", _inf.portao_deslizante, 1.7, 0.12, 0.36, REF_TERMINAL),
    _a("antena-comunicacao", "Torre de comunicação", "infraestrutura", _inf.antena_comunicacao, 2.0, 2.0, 3.2, REF_MINA),
    _a("canaleta-drenagem", "Canaleta de drenagem", "infraestrutura", _inf.canaleta_drenagem, 2.0, 0.3, 0.02, REF_MINA, afunda=0.06),
]

# --- H. Pátio --------------------------------------------------------------
PATIO = [
    _a("container-escritorio", "Contêiner escritório", "patio", _pat.container_escritorio, 0.65, 0.3, 0.32, REF_MINA),
    _a("tambores", "Grupo de tambores", "patio", _pat.tambores, 0.3, 0.22, 0.13, REF_MINA),
    _a("palete-carga", "Palete com carga", "patio", _pat.palete_carga, 0.14, 0.11, 0.11, REF_TERMINAL),
    _a("bobina-cabo", "Bobina de cabo", "patio", _pat.bobina_cabo, 0.25, 0.14, 0.23, REF_MINA),
    _a("pilha-tubos", "Pilha de tubos", "patio", _pat.pilha_tubos, 0.85, 0.35, 0.2, REF_MINA),
    _a("cacamba-entulho", "Caçamba de entulho", "patio", _pat.cacamba_entulho, 0.45, 0.24, 0.16, REF_MINA),
    _a("cone-sinalizacao", "Cone de sinalização", "patio", _pat.cone_sinalizacao, 0.06, 0.05, 0.08, REF_CAVA),
    _a("placa-sinalizacao", "Placa de sinalização", "patio", _pat.placa_sinalizacao, 0.05, 0.18, 0.32, REF_MINA),
    _a("barreira-concreto", "Barreira New Jersey", "patio", _pat.barreira_concreto, 0.85, 0.07, 0.09, REF_TERMINAL),
    _a("banco-praca", "Banco com lixeira", "patio", _pat.banco_praca, 0.22, 0.09, 0.09, REF_TERMINAL),
    _a("lixeira-industrial", "Coleta seletiva", "patio", _pat.lixeira_industrial, 0.2, 0.35, 0.27, REF_TERMINAL),
    _a("sucata", "Pátio de sucata", "patio", _pat.sucata, 0.75, 0.55, 0.15, REF_MINA),
    _a("operario", "Operário", "patio", _pat.operario, 0.04, 0.05, 0.18, REF_CAVA),
]

# --- I. Vegetação ----------------------------------------------------------
VEGETACAO = [
    _a("arvore-conifera", "Conífera", "vegetacao", _veg.arvore_conifera, 0.7, 0.7, 1.6, REF_ARVORES),
    _a("arvore-folhosa", "Folhosa", "vegetacao", _veg.arvore_folhosa, 0.85, 0.85, 1.0, REF_ARVORES),
    _a("arvore-colunar", "Colunar", "vegetacao", _veg.arvore_colunar, 0.28, 0.28, 1.3, REF_ARVORES),
    _a("arvore-chorao", "Chorão", "vegetacao", _veg.arvore_chorao, 0.9, 0.9, 0.85, REF_ARVORES),
    _a("arbusto-florido", "Arbusto florido", "vegetacao", _veg.arbusto_florido, 0.3, 0.3, 0.25, REF_ARVORES),
    _a("moita-capim", "Moita de capim", "vegetacao", _veg.moita_capim, 0.16, 0.2, 0.1, REF_ARVORES),
    _a("toco-tronco", "Toco e tronco caído", "vegetacao", _veg.toco_tronco, 0.7, 0.35, 0.1, REF_MINA),
    _a("afloramento-rocha", "Afloramento rochoso", "vegetacao", _veg.afloramento_rocha, 0.65, 0.65, 0.2, REF_MINA),
]

FAMILIAS = {
    "extracao": ("Extração", EXTRACAO),
    "beneficiamento": ("Beneficiamento", BENEFICIAMENTO),
    "edificacoes": ("Edificações", EDIFICACOES),
    "ferrovia": ("Ferrovia", FERROVIA),
    "porto": ("Porto", PORTO),
    "rodoviario": ("Rodoviário", RODOVIARIO),
    "infraestrutura": ("Infraestrutura", INFRAESTRUTURA),
    "patio": ("Pátio", PATIO),
    "vegetacao": ("Vegetação", VEGETACAO),
}

TODOS = [a for _rotulo, lista in FAMILIAS.values() for a in lista]
POR_SLUG = {a.slug: a for a in TODOS}

assert len(POR_SLUG) == len(TODOS), "slug duplicado no catálogo"


def obter(slug: str) -> Asset:
    """Busca um asset pelo slug, com erro legível quando não existe."""
    try:
        return POR_SLUG[slug]
    except KeyError:
        raise KeyError(f"asset desconhecido: {slug!r}. Conhecidos: {', '.join(sorted(POR_SLUG))}") from None


def plantar(slug: str, name: str, x: float, z: float, m, **kw):
    """Constrói um asset do catálogo no ponto pedido.

    É o único jeito recomendado de usar um asset a partir dos módulos de
    montagem: passando pelo catálogo, o slug fica sendo a referência única e
    trocar a implementação de um asset não exige mexer em quem o usa.
    """
    return obter(slug).fn(name, x, z, m, **kw)
