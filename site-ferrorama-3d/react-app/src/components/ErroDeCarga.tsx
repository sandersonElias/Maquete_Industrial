import { Component, type ReactNode } from 'react';

type Props = {
  /** Texto explicando o que falhou, no tom da interface. */
  mensagem: string;
  /**
   * Chamado quando o usuário pede para tentar de novo. O chamador precisa
   * recriar o `lazy()` importado: o React memoiza a promessa do chunk, e um
   * import rejeitado continuaria rejeitado sem uma nova tentativa.
   */
  aoTentar?: () => void;
  children: ReactNode;
};

type State = { erro: Error | null };

/**
 * Fronteira de erro para o chunk da maquete 3D.
 * Sem ela, um chunk que não baixa (rede de 4G da feira, cache quebrado)
 * derruba a tela inteira no lugar de mostrar alguma coisa.
 */
export default class ErroDeCarga extends Component<Props, State> {
  state: State = { erro: null };

  static getDerivedStateFromError(erro: Error): State {
    return { erro };
  }

  /**
   * Limpa o cache do `.glb` (o `useGLTF` segura a promessa rejeitada) e só
   * então chama o chamador, que recria o `lazy()` da maquete.
   *
   * O import é do próprio chunk da maquete e não de `MaqueteBlender` — apontar
   * para o módulo criaria uma segunda aresta de chunk e bagunçaria o orçamento
   * de tamanho documentado no CLAUDE.md.
   */
  private tentarDeNovo = async () => {
    try {
      const { limparCacheGlb } = await import('./maquete3d/Maquete3D');
      limparCacheGlb();
    } catch {
      /* o chunk que falhou era este — a nova tentativa tenta baixar de novo */
    }
    this.props.aoTentar?.();
  };

  render() {
    if (!this.state.erro) return this.props.children;

    return (
      <div className="maquete3d-carregando" role="alert">
        <p>{this.props.mensagem}</p>
        <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{this.state.erro.message}</p>
        {this.props.aoTentar && (
          <div className="maquete-abrir">
            <button type="button" className="hero-cta" onClick={this.tentarDeNovo}>
              Tentar de novo
            </button>
          </div>
        )}
      </div>
    );
  }
}
