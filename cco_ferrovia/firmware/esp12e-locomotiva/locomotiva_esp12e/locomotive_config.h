#pragma once

// Altere para L02 ou L03 antes de gravar as outras locomotivas.
#define LOCO_ID "L01"

// GPIO12 -> IN1 do MX1508; GPIO13 -> IN2 do MX1508.
#define MOTOR_IN1_PIN 12
#define MOTOR_IN2_PIN 13

// Ative somente depois de instalar e calibrar o divisor resistivo no A0.
#define BATTERY_MONITOR_ENABLED false

// Exemplo para 220 kohm (superior) e 56 kohm (inferior): (220 + 56) / 56.
#define BATTERY_DIVIDER_RATIO 4.9286f
#define ADC_REFERENCE_MV 1000.0f
#define BATTERY_WARNING_MV 3500
#define BATTERY_CRITICAL_MV 3300
