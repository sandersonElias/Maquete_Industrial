# Diagrama de Ligações - Ferrorama

## Pinagem Correta (Reorganizada)

### Servos (D2 a D5)

```
Servo 1 (Divisão 1) ? D2
Servo 2 (Divisão 2) ? D3
Servo 3 (Divisão 3) ? D4
Servo 4 (Divisão 4) ? D5
```

### LEDs Indicador de Direção (D6 a D13)

```
DIVISÃO 1:
+-- LED Verde (Esquerda)  ? D6  ? Resistor 200O ? GND
+-- LED Vermelho (Direita) ? D7  ? Resistor 200O ? GND

DIVISÃO 2:
+-- LED Verde (Esquerda)  ? D8  ? Resistor 200O ? GND
+-- LED Vermelho (Direita) ? D9  ? Resistor 200O ? GND

DIVISÃO 3:
+-- LED Verde (Esquerda)  ? D10 ? Resistor 200O ? GND
+-- LED Vermelho (Direita) ? D11 ? Resistor 200O ? GND

DIVISÃO 4:
+-- LED Verde (Esquerda)  ? D12 ? Resistor 200O ? GND
+-- LED Vermelho (Direita) ? D13 ? Resistor 200O ? GND
```

### Bluetooth (HC-05)

```
HC-05 VCC ? 5V Arduino
HC-05 GND ? GND Arduino
HC-05 TXD ? D0 (RX Arduino)
HC-05 RXD ? D1 (TX Arduino)
```

### Alimentação

```
Fonte Externa (+) ? 5V Arduino (Vin)
Fonte Externa (-) ? GND Arduino

OU

Fonte Externa (+) ? Barramento 5V (para servos)
Fonte Externa (-) ? Barramento GND (comum)
Arduino GND ? Barramento GND
```

## Tabela Resumo

| Componente | Pino Arduino | Descrição |
|------------|--------------|-----------|
| Servo 1 | D2 | Divisão 1 |
| Servo 2 | D3 | Divisão 2 |
| Servo 3 | D4 | Divisão 3 |
| Servo 4 | D5 | Divisão 4 |
| LED Verde Div 1 | D6 | Esquerda |
| LED Vermelho Div 1 | D7 | Direita |
| LED Verde Div 2 | D8 | Esquerda |
| LED Vermelho Div 2 | D9 | Direita |
| LED Verde Div 3 | D10 | Esquerda |
| LED Vermelho Div 3 | D11 | Direita |
| LED Verde Div 4 | D12 | Esquerda |
| LED Vermelho Div 4 | D13 | Direita |
| HC-05 TXD | D0 | Serial RX |
| HC-05 RXD | D1 | Serial TX |

## Circuito de Cada LED

```
Pino Arduino ? Resistor 200O ? Anodo (+) LED ? Catodo (-) ? GND
```

## Diagrama Visual

```
                    Arduino Uno
                    +-----------+
                    ¦      D0   ¦---- HC-05 TX (RX Serial)
                    ¦      D1   ¦---- HC-05 RX (TX Serial)
                    ¦      D2   ¦---- Servo 1 (Div 1)
                    ¦      D3   ¦---- Servo 2 (Div 2)
                    ¦      D4   ¦---- Servo 3 (Div 3)
                    ¦      D5   ¦---- Servo 4 (Div 4)
                    ¦      D6   ¦---- LED Verde Div 1
                    ¦      D7   ¦---- LED Vermelho Div 1
                    ¦      D8   ¦---- LED Verde Div 2
                    ¦      D9   ¦---- LED Vermelho Div 2
                    ¦      D10  ¦---- LED Verde Div 3
                    ¦      D11  ¦---- LED Vermelho Div 3
                    ¦      D12  ¦---- LED Verde Div 4
                    ¦      D13  ¦---- LED Vermelho Div 4
                    ¦           ¦
                    ¦      5V   ¦---- VCC HC-05
                    ¦      GND  ¦---- GND Comum
                    ¦      Vin  ¦---- Alimentação externa
                    +-----------+
```
