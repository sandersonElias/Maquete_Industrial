/**
 * ============================================================
 *  CÓDIGO OFICIAL - CARRINHO BASCULANTE RC (BLUETOOTH)
 * ============================================================
 *  Este código recebe comandos via Bluetooth (HC-05) para
 *  controlar o carrinho.
 *  
 *  IMPORTANTE: Desconecte os pinos RX/TX do HC-05 ao carregar
 *  este código para o Arduino.
 * ============================================================
 */

#include <Servo.h>

// Definição dos Pinos
const int PIN_SERVO_DIR = 5;
const int PIN_SERVO_BUCKET = 6;
const int PIN_MOTOR_IN1 = 7;
const int PIN_MOTOR_IN2 = 8;

// Objetos Servo
Servo servoDirecao;
Servo servoCacamba;

// Variáveis de Estado
int anguloDirecao = 90; // Centro
int anguloCacamba = 0;  // Baixo
char comando;

void setup() {
  // Inicializa Serial (Bluetooth) a 9600 baud rate
  Serial.begin(9600);

  // Configura Pinos do Motor
  pinMode(PIN_MOTOR_IN1, OUTPUT);
  pinMode(PIN_MOTOR_IN2, OUTPUT);
  pararMotor();

  // Configura Servos
  servoDirecao.attach(PIN_SERVO_DIR);
  servoCacamba.attach(PIN_SERVO_BUCKET);

  // Posição Inicial
  servoDirecao.write(anguloDirecao);
  servoCacamba.write(anguloCacamba);
}

void loop() {
  // Verifica se há dados chegando do Bluetooth
  if (Serial.available() > 0) {
    comando = Serial.read();

    switch (comando) {
      // --- MOVIMENTAÇÃO (MOTOR DC) ---
      case 'F': // Frente
        digitalWrite(PIN_MOTOR_IN1, HIGH);
        digitalWrite(PIN_MOTOR_IN2, LOW);
        break;
      case 'B': // Ré
        digitalWrite(PIN_MOTOR_IN1, LOW);
        digitalWrite(PIN_MOTOR_IN2, HIGH);
        break;
      case 'S': // Parar
        pararMotor();
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

void pararMotor() {
  digitalWrite(PIN_MOTOR_IN1, LOW);
  digitalWrite(PIN_MOTOR_IN2, LOW);
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
