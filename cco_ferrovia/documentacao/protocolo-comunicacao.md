# Protocolo de comunicação - CCO Ferrovia

## Computador para Arduino Uno

Mensagens ASCII terminadas por quebra de linha:

```text
PING|sequencia
SWITCH|C1|NORMAL|sequencia
SWITCH|C1|REVERSA|sequencia
SIGNAL|F1|RED|sequencia
EMERGENCY|ON|sequencia
EMERGENCY|OFF|sequencia
SNAPSHOT|sequencia
CAL|START
CAL|STOP
```

O Arduino responde com `SENSOR`, `PASS`, `SWITCH`, `SIGNAL`, `PONG`, `CAL` ou `FAULT`.

`SENSOR|4|ACTIVE|ms` marca a chegada do objeto ao S04. Enquanto houver presença,
o sensor permanece ocupado. Após 150 ms de ausência contínua, envia
`PASS|4|duracao_ms` e `SENSOR|4|CLEAR|ms`. A duração vai da primeira ativação
até a última transição para livre, sem incluir os 150 ms de estabilização.
Espaços menores que esse intervalo são agrupados; a distância e a montagem
precisam ser validadas para que o corpo da locomotiva gere uma passagem contínua.
Não há decodificação de etiqueta preto/branco.

O painel usa os nomes LC01/LC02/LC03, mas mantém L01/L02/L03 no protocolo Wi-Fi
para compatibilidade com os firmwares já gravados.

`CAL|START` inicia um diagnóstico de 30 s: a cada 100 ms o Arduino envia
`CAL|<lógico>|<bruto>|ms` para os sete sensores. Use com o CCO fechado, pelo
Monitor Serial, para conferir a polaridade e ajustar o potenciômetro do HW-201.
Com o CCO fechado, o Arduino pode reportar `FAULT|PC_TIMEOUT` após 4 s; isso é
normal e desaparece no próximo `PING`.

`F1` representa o sinal unico da passagem de nivel. Os semaforos externo e interno
sao combinados eletricamente e sempre exibem a mesma cor.

## Computador para ESP-12E

UDP local:

```text
CMD|L01|sequencia|FORWARD
CMD|L01|sequencia|REVERSE
CMD|L01|sequencia|STOP
CMD|L01|sequencia|PING
```

Telemetria:

```text
HELLO|L01|versao
STATUS|L01|STOP|tensao_mV|bateria_pct|rssi|falha
ACK|L01|sequencia|comando
```

Cada ESP para localmente o motor se os comandos de manutenção de comunicação deixarem de chegar.
Ao iniciar ou recuperar o Wi-Fi, o ESP envia `HELLO` por broadcast. O CCO associa o
IP de origem ao identificador L01, L02 ou L03 e começa a enviar `PING` a cada 500 ms.
