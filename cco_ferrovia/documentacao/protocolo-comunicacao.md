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
```

O Arduino responde com `SENSOR`, `SWITCH`, `SIGNAL`, `PONG` ou `FAULT`.

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
