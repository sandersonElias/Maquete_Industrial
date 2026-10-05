# Projeto CCO Ferrovia

Sistema supervisório local para uma maquete ferroviária com Arduino Uno, sete sensores HW-201, três servos SG90, dois semáforos combinados da passagem de nível e até três locomotivas com ESP-12E e MX1508.

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

1. Instale o pacote indicado em `software/cco/requirements.txt`.
2. Grave o firmware do Arduino Uno.
3. Copie `secrets.example.h` para `secrets.h` e informe o nome e a senha do hotspot.
4. Copie e grave o firmware do ESP-12E em cada locomotiva, alterando `LOCO_ID` para L01, L02 e L03.
5. Configure o hotspot de 2,4 GHz com os mesmos dados do arquivo `secrets.h`.
6. Execute `software/cco/INICIAR_SISTEMA.cmd`.

## Funções implementadas

- identificação nominal do operador, sem senha;
- controle de L01, L02 e L03;
- barras e porcentagem de bateria;
- frente, ré, parada, espera, prioridade e envio à oficina;
- confirmação obrigatória da posição inicial antes da partida;
- limite de duas locomotivas simultaneamente em movimento, mantendo a terceira disponível;
- rotas plana, elevada e oficina;
- diagnóstico da sequência dos sete sensores;
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
