/**
 * ============================================================
 *  CÓDIGO OFICIAL - CARRINHO BASCULANTE RC (BLUETOOTH)
 * ============================================================
 *  Este código recebe comandos via Bluetooth (HC-05) para
 *  controlar o carrinho com 3 servos:
 *    - Servo de Direção (D5)
 *    - Servo de Caçamba (D6)
 *    - Servo de Motor - Rotação Contínua (D7)
 *  
 *  IMPORTANTE: Desconecte os pinos RX/TX do HC-05 ao carregar
 *  este código para o Arduino.
 * ============================================================
 */

#include <Servo.h>

// Definição dos Pinos
const int PIN_SERVO_DIR = 5;
const int PIN_SERVO_BUCKET = 6;
const int PIN_SERVO_MOTOR = 7;

// Objetos Servo
Servo servoDirecao;
Servo servoCacamba;
Servo servoMotor;

// Variáveis de Estado
int anguloDirecao = 90; // Centro
int anguloCacamba = 0;  // Baixo
char comando;

void setup() {
  // Inicializa Serial (Bluetooth) a 9600 baud rate
  Serial.begin(9600);

  // Configura Servos
  servoDirecao.attach(PIN_SERVO_DIR);
  servoCacamba.attach(PIN_SERVO_BUCKET);
  servoMotor.attach(PIN_SERVO_MOTOR);

  // Posição Inicial
  servoDirecao.write(anguloDirecao);
  servoCacamba.write(anguloCacamba);
  servoMotor.write(90); // Motor parado (neutro)
}

void loop() {
  // Verifica se há dados chegando do Bluetooth
  if (Serial.available() > 0) {
    comando = Serial.read();

    switch (comando) {
      // --- MOVIMENTAÇÃO (SERVO ROTAÇÃO CONTÍNUA) ---
      case 'F': // Frente
        servoMotor.write(180); // Velocidade máxima frente
        break;
      case 'B': // Ré
        servoMotor.write(0);   // Velocidade máxima ré
        break;
      case 'S': // Parar
        servoMotor.write(90);  // Neutro = parado
        break;

      // --- DIREÇÃO (SERVO 1) ---
      case 'L': // Esquerda
        servoDirecao.write(135); // Ajuste este valor se virar pouco/muito
        break;
      case 'R': // Direita
        servoDirecao.write(45);  // Ajuste este valor se virar pouco/muito
        break;
      case 'C': // Centro
        servoDirecao.write(90);  // Ajuste este valor se o centro não ficar reto
        break;

      // --- CAÇAMBA (SERVO 2) ---
      case 'U': // Subir (Up)
        subirCacamba();
        break;
      case 'D': // Descer (Down)
        descerCacamba();
        break;
    }
  }
}

void subirCacamba() {
  // Sobe gradualmente para não dar tranco
  for (int pos = anguloCacamba; pos <= 90; pos += 1) {
    servoCacamba.write(pos);
    delay(15);
  }
  anguloCacamba = 90; // Atualiza o estado
}

void descerCacamba() {
  // Desce gradualmente
  for (int pos = anguloCacamba; pos >= 0; pos -= 1) {
    servoCacamba.write(pos);
    delay(15);
  }
  anguloCacamba = 0; // Atualiza o estado
}
