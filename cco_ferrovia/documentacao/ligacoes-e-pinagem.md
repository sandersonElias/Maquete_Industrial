# Ligações e pinagem - Projeto CCO Ferrovia

## Alimentação da via

- Arduino Uno alimentado pelo USB do computador.
- Fonte externa regulada de 5 V para sensores, servos e faróis.
- Unir o GND da fonte externa ao GND do Arduino.
- Não ligar o positivo de 5 V da fonte ao pino 5 V do Uno enquanto ele estiver alimentado pelo USB.
- Não alimentar os servos pelo pino 5 V do Arduino.
- Usar uma fonte com corrente suficiente para os três SG90. A corrente exata será confirmada pela etiqueta da fonte.

## Arduino Uno

| Função | Porta |
|---|---|
| S01 a S07 - saída digital dos HW-201 | D2 a D8 |
| Servo C1 | D9 |
| Servo C2 | D10 |
| Servo C3 | D11 |
| Farol externo: vermelho, amarelo, verde | D12, D13, A0 |
| Farol interno: vermelho, amarelo, verde | A1, A2, A3 |
| Comunicação com o computador | USB / serial |
| Reserva | A4 e A5 |

## Proteção local das chaves

- C1 é protegida pelos sensores S06 e S07.
- C2 é protegida pelo sensor S01.
- C3 é protegida pelos sensores S03, S04 e S05.
- O Arduino recusa uma mudança de posição se um sensor de proteção estiver ativo.

## Locomotiva com ESP-12E e MX1508

```text
18650 protegida
       |
   chave geral
       +-----------------------> alimentação do MX1508
       |                              |
       |                              +----> motor DC 5 V
       |
       +--> regulador 3,3 V --> ESP-12E

ESP GPIO12 --------------------> MX1508 IN1
ESP GPIO13 --------------------> MX1508 IN2
GND da bateria, regulador, ESP e MX1508 interligados
```

### Ligações mínimas do ESP-12E avulso

O ESP-12E avulso não é uma placa pronta como a NodeMCU. Para iniciar normalmente ele também precisa destas ligações:

| Pino ESP-12E | Ligação |
|---|---|
| VCC | 3,3 V regulados |
| GND | GND comum |
| EN / CH_PD | 3,3 V por resistor de 10 kΩ |
| RST | 3,3 V por resistor de 10 kΩ; botão opcional para GND |
| GPIO0 | 3,3 V por 10 kΩ; levar ao GND somente para gravação |
| GPIO2 | 3,3 V por resistor de 10 kΩ |
| GPIO15 | GND por resistor de 10 kΩ |
| GPIO12 | IN1 do MX1508 |
| GPIO13 | IN2 do MX1508 |
| A0 | divisor resistivo da bateria, somente após calibração |

Para gravar o módulo avulso também é necessário um conversor USB–serial de **3,3 V**, com GND comum. Nunca aplique 5 V nos pinos do ESP-12E.

### Alimentação e ruído do motor

- Usar regulador de 3,3 V capaz de fornecer pelo menos 500 mA ao ESP-12E.
- Colocar pelo menos 470 µF entre 3,3 V e GND próximo ao ESP, além de 100 nF cerâmico.
- Colocar 100 nF diretamente nos terminais do motor para reduzir interferência.
- Manter os fios do motor afastados da antena do ESP.
- Usar proteção adequada para a célula 18650 e carregador próprio para lítio.
- A leitura de bateria no firmware começa desativada; só deve ser habilitada após medir e calibrar o divisor no A0.

Recomendações ainda dependentes da confirmação física:

- regulador de 3,3 V com capacidade mínima de 500 mA para os picos do ESP-12E;
- bateria 18650 protegida ou BMS adequado;
- resistores de 10 kΩ mantendo IN1 e IN2 em nível baixo durante a inicialização;
- capacitor eletrolítico próximo ao ESP e capacitor de 100 nF nos terminais do motor;
- divisor resistivo no A0 somente após confirmar que o módulo é um ESP-12E avulso.

## Limitação atual da oficina

Os sete sensores informados não incluem um sensor dentro da oficina. O comando automático usa o S06 e uma temporização calibrável para parar depois da C1. Até que seja instalado um sensor de confirmação na oficina, a posição final deve ser conferida pelo operador.
