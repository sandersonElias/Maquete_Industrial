# Projeto CCO Ferrovia

Sistema supervisório local para uma maquete ferroviária com Arduino Uno, sete sensores HW-201, três servos SG90, dois semáforos combinados da passagem de nível e até três locomotivas com ESP-12E e ponte H HW-354.

Este módulo é independente do dashboard e do gateway Bluetooth existentes na raiz do repositório. Ele preserva esses sistemas e oferece a alternativa Wi-Fi desenvolvida para o CCO do Ferrorama.

## Pastas

- `software/cco`: serviço local e tela principal.
- `firmware/arduino-uno`: controle dos sensores, chaves e dos semáforos combinados.
- `firmware/esp12e-locomotiva`: firmware comum das locomotivas.
- `documentacao`: pinagem e protocolo.
- `output/pdf`: etiquetas ópticas imprimíveis.

## Testar a tela sem componentes

1. Instale Python 3 no computador.
2. Execute `software/cco/INICIAR_SIMULACAO.cmd`.
3. Acesse `http://127.0.0.1:8080`.
4. Informe o nome do aluno e inicie o turno.
5. Selecione cada locomotiva e confirme sua posição inicial em um dos sensores.

## Executar com o hardware

1. Instale o pacote indicado em `software/cco/requirements.txt` (ou use `py -3`, que já vem com o Python do sistema).
2. Grave o firmware do Arduino Uno.
3. Copie `secrets.example.h` para `secrets.h` e informe o nome e a senha do hotspot.
4. Copie e grave o firmware do ESP-12E em cada locomotiva, alterando `LOCO_ID` para L01, L02 e L03. A ligação validada é GPIO13/D7 em IN1 e GPIO12/D6 em IN2 da HW-354.
5. Configure o hotspot de 2,4 GHz com os mesmos dados do arquivo `secrets.h`.
6. Na primeira execução, rode `software/cco/LIBERAR_FIREWALL.cmd` como administrador para liberar UDP 4210 (telemetria) e TCP 8080 (tela).
7. Execute `software/cco/INICIAR_SISTEMA.cmd`.

## Funções implementadas

- identificação nominal do operador, sem senha;
- controle de L01, L02 e L03;
- barras e porcentagem de bateria;
- frente, ré, parada, espera, prioridade e envio à oficina;
- confirmação obrigatória da posição inicial antes da partida;
- limite de duas locomotivas simultaneamente em movimento, mantendo a terceira disponível;
- rotas plana, elevada e oficina;
- diagnóstico da sequência dos sete sensores;
- confirmação única por passagem, sem repetir a cada barra da etiqueta óptica;
- bloqueio local das chaves próximas a sensores ativos;
- semáforos interno e externo combinados em um único conjunto de três saídas;
- sinalização automática: amarelo na aproximação, vermelho na ocupação e verde após a liberação;
- parada de emergência;
- watchdog de comunicação do Arduino e de cada locomotiva;
- posição confirmada, estimada ou incerta;
- animação contínua na tela entre sensores;
- relatório HTML imprimível e CSV com utilização, disponibilidade, bateria, trocas, paradas e falhas;
- modo de simulação sem hardware.

## Validação realizada

Os testes automatizados verificam bloqueio sem posição inicial, parada ao pular sensor, limite de duas locomotivas e sinalização automática da passagem. Para repeti-los:

```text
py -3 software/cco/testes/teste_seguranca.py
```

## Antes do primeiro teste físico

- confirmar se os ESP-12E são módulos avulsos ou placas NodeMCU;
- confirmar o regulador de 3,3 V e a proteção da 18650;
- confirmar a pinagem e a polaridade dos módulos semáforo;
- informar a corrente máxima da fonte de bancada;
- calibrar os ângulos dos três servos sem conectar a haste às chaves;
- calibrar os tempos entre sensores e a parada temporizada da oficina.
- verificar fisicamente a sequência de sensores de cada rota e corrigir `software/cco/config.json` se necessário.
- conferir se os sete sensores ficam CLEAR sem trem e geram uma única confirmação por passagem.

## Operação simplificada: LC01 dupla + uma simples

1. Regrave o Arduino Uno com `firmware/arduino-uno/cco_via/cco_via.ino`. O firmware
   anterior não envia a duração necessária à calibração. Os ESPs mantêm os IDs
   L01/L02/L03; a tela os apresenta como LC01/LC02/LC03.
2. Reinicie o CCO e clique em **Preparar operação**. Informe o operador, escolha
   LC02 ou LC03 como simples ativa, a rota e as posições iniciais distintas.
   A simples restante fica fora da malha e não pode receber comandos de movimento.
3. Use **Frente**, **Parar** e **Ré** diretamente nos dois cartões. A rota acompanha
   o sentido; a inversão mantém a pausa de proteção do firmware do ESP. As chaves
   não podem ser alteradas para uma rota incompatível enquanto a outra loco se move.
4. O motivo da parada aparece no cartão. O prazo do próximo sensor começa na partida,
   e não no momento em que a posição foi confirmada manualmente. Os watchdogs Wi-Fi
   e os bloqueios por sensor ou trecho reservado continuam ativos.

### Calibrar os tempos

- Pare as locomotivas fora dos sensores, retire a outra locomotiva da via e confirme
  a pista livre no diálogo. Abra **Calibrar**, selecione a locomotiva
  e o sensor e inicie a coleta. Volte aos controles e faça pelo menos três passagens
  completas, em velocidade aproximadamente constante e sem vagões. Só a locomotiva
  escolhida pode se movimentar durante a coleta.
- Pare fora do sensor, reabra o diálogo e salve. Repita para a outra locomotiva no
  mesmo sensor. A dupla deve ter duração maior; variação excessiva e faixas que se
  sobrepõem são rejeitadas. Não se assume automaticamente a proporção exata de 2:1.
- A calibração de identificação é específica de cada sensor. Sensores sem as duas
  faixas cadastradas mostram identidade incerta. O tempo confirma a identidade
  prevista pela rota; não troca automaticamente nomes ou posições. Divergência
  com uma faixa válida para a outra loco gera parada e pedido de confirmação.
- Durante a coleta, trechos percorridos sem interrupção também são medidos. Um trecho
  exige três medições para ser salvo. Em **Ajustar tempo entre sensores**, informe
  um tempo de referência realista (1–120 s) para a rota antes de percorrê-la, caso o
  valor inicial seja curto. A margem de segurança do `config.json` permanece aplicada.
- Perfis, tempos de trechos e referências ficam em `software/cco/data/calibration.json`,
  arquivo local ignorado pelo Git. Cancelar uma coleta preserva a calibração anterior.
- O botão não regula o potenciômetro do HW-201. Ajuste o módulo para ficar livre sem
  trem e ativo enquanto a carroceria estiver diante dele. Não foi validado em hardware
  nesta atualização; as faixas e a estabilização de 150 ms precisam de teste na maquete.

### Verificação

`py -3 -m unittest discover -s software/cco/testes -v` executa os testes do servidor.
`node software/cco/testes/verificar_painel.cjs` testa o painel com uma instância de
simulação em `http://127.0.0.1:18080`, Playwright e Edge instalados; pode-se configurar
`CCO_TEST_URL` e `PLAYWRIGHT_MODULE`. Esse teste reinicia apenas o estado da simulação.

Após calibrar, recoloque as locomotivas e execute **Preparar operação** novamente.
A confirmação de pista livre remove a posição antiga da outra locomotiva no mapa.

## Tela secundária: Configurar ferrovia

Acesse **Configurar ferrovia** na barra superior do CCO (`/configurar.html`).
As locomotivas precisam estar paradas e a calibração de identificação encerrada.
Entrar nessa tela ativa um bloqueio global de movimento; fechar a aba não remove
esse bloqueio. Reabra a tela e use **Encerrar ajustes e voltar ao CCO** para sair.
A parada de emergência também está disponível nessa tela.

1. **Identificar sensores:** passe um objeto diante de um HW-201 e observe a entrada
   que ficou verde (por exemplo, D3). Associe esse pino ao ponto S01–S07 correspondente
   no mapa. O diagnóstico observa as sete entradas atualmente salvas. Se o sensor foi
   ligado a um pino diferente dessas entradas, selecione manualmente esse pino,
   salve e faça o teste novamente. Não é feita uma varredura de pinos de saída.
2. **Associar servos:** escolha o pino de sinal de C1, C2 e C3. Cada pino só pode ser
   usado por um componente. D2–D11 e A1–A5 estão disponíveis; D0/D1, D12/D13 e A0
   ficam reservados para serial e semáforos. A1–A5 também funcionam como pinos
   digitais. A configuração trata os fios de sinal; alimentação e GND são físicos.
3. **Salvar ligações e ângulos:** salve a associação completa. O servidor envia a
   pinagem e os ângulos ao Uno e espera `HWACK` da revisão atual. Salvar não aciona
   os servos. Não há persistência em EEPROM: o computador reaplica a configuração
   sempre que o Arduino reconecta. Um firmware antigo sem `HWACK` mantém a operação
   bloqueada e precisa ser substituído pelo firmware desta versão.
4. **Testar servos:** com todos os sensores livres, teste Normal, Reversa ou um ângulo
   específico. Apenas um servo é testado por vez, com rampa de 1° a cada 20 ms.
   Os botões −5°/+5° permitem ajustes pequenos. O primeiro acionamento pode ir à
   referência de 90°; solte a haste se a montagem ainda não está calibrada. Os limites
   aceitos são 0–180°, mas os limites mecânicos precisam ser observados na montagem.
   Emergência, sensor ocupado ou perda dos pings interrompem o teste no Arduino.
5. **Conferir o mapa:** clique nos pontos e chaves para localizar suas linhas.
   Ao terminar, encerre os ajustes. Depois de salvar, use **Preparar operação** para
   confirmar as posições iniciais novamente. Trocar a pinagem dos sensores invalida
   as calibrações de duração e de percurso; trocar apenas servos preserva esses perfis.

As associações ficam em `software/cco/data/hardware.json`, ignorado pelo Git.
O arquivo deve ficar no computador do CCO. É possível usar `CCO_DATA_DIR` para
escolher uma pasta de dados separada, inclusive em testes de simulação.

A verificação da tela pode ser repetida com
`node software/cco/testes/verificar_configuracao.cjs`, usando Playwright, Edge e
uma instância **isolada de simulação** indicada por `CCO_TEST_URL`. Esse teste
altera e salva pinagens nos dados dessa instância; não use os dados da montagem real.
