#include <SoftwareSerial.h>
#include <DHT.h>

// Pin Definitions
#define MQ2_PIN A0
#define DHTPIN 2
#define DHTTYPE DHT11
#define BUZZER_PIN 8
#define LED_PIN 9
#define BT_RX 10 // Connects to HC-05 TXD
#define BT_TX 11 // Connects to HC-05 RXD

DHT dht(DHTPIN, DHTTYPE);
SoftwareSerial BT(BT_RX, BT_TX); 

// Thresholds & Stabilization
const int threshold = 300; // Gas threshold trigger level (ADC)
const unsigned long WARMUP_TIME_MS = 30000; // 30-second initial sensor stabilization hold

/**
 * ARCHITECTURAL DESIGN & KNOWN LIMITATION:
 * The Arduino Nano operates as a zero-trust edge safety floor. If gasValue > threshold (300 ADC)
 * outside the warm-up window, the local buzzer (D8) and LED (D9) trigger immediately and autonomously,
 * requiring zero host connectivity or network uptime.
 *
 * KNOWN LIMITATION: Because the 8-bit ATmega328P relies on a static threshold without multi-sensor
 * regression, dense kitchen steam exceeding 300 ADC can sound the local physical buzzer.
 * The cyber analytical pipeline running on the host bridge implements the dynamic humidity/temperature
 * cross-sensitivity compensation (K_RH = 2.8, K_T = 1.2) to classify and suppress such nuisance alarms
 * on the dashboard and remote caregiver alerting network.
 */

void sendPacket(int gas, float temp, float hum, int alarm) {
  static uint16_t seq = 0;

  // Scale temp and humidity by 10 with rounding (integers only for AVR libc)
  int temp_x10 = (int)(temp * 10.0f + (temp >= 0 ? 0.5f : -0.5f));
  int rh_x10   = (int)(hum * 10.0f + 0.5f);

  // Format payload between '$' and '*'
  char payload[48];
  snprintf(payload, sizeof(payload), "S,%u,%d,%d,%d,%d", seq++, gas, temp_x10, rh_x10, alarm);

  // XOR checksum across all characters between '$' and '*'
  uint8_t checksum = 0;
  for (uint8_t i = 0; payload[i] != '\0'; i++) {
    checksum ^= (uint8_t)payload[i];
  }

  // Assemble final packet with 2-digit uppercase hex checksum
  char packet[64];
  snprintf(packet, sizeof(packet), "$%s*%02X", payload, checksum);

  Serial.println(packet);
  BT.println(packet);
}

void setup() {
  Serial.begin(9600); 
  BT.begin(9600);     
  dht.begin();        

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  Serial.println("System Ready. Warming up MQ-2 sensor (30s hold)...");
  BT.println("System Ready. Warming up MQ-2 sensor (30s hold)...");
}

void loop() {
  // Listen for commands from web dashboard (e.g. physical buzzer test)
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "TEST_BUZZER") {
      digitalWrite(BUZZER_PIN, HIGH);
      digitalWrite(LED_PIN, HIGH);
      delay(1000);
      digitalWrite(BUZZER_PIN, LOW);
      digitalWrite(LED_PIN, LOW);
    }
  }

  int gasValue = analogRead(MQ2_PIN);
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  // Check if DHT read failed
  if (isnan(temp) || isnan(hum)) {
    temp = 0.0;
    hum = 0.0;
  }

  // Sensor stabilization check: suppress false alarms during warm-up
  bool isWarmingUp = (millis() < WARMUP_TIME_MS);

  // Format legacy status string for human-readable monitors
  String statusMsg = "Gas: " + String(gasValue) + " | Temp: " + String(temp, 1) + "C | Hum: " + String(hum, 1) + "%";
  if (isWarmingUp) {
    unsigned long remainingSec = (WARMUP_TIME_MS - millis()) / 1000;
    statusMsg += " [WARMING UP: " + String(remainingSec) + "s remaining]";
  }
  Serial.println(statusMsg);
  BT.println(statusMsg);

  // Dispatch standard telemetry packet once per second ($S,<seq>,<gas>,<temp*10>,<rh*10>,<alarm>*<CS>)
  // Alarm state is held off during warm-up to prevent boot-time false alarms
  int alarmState = (!isWarmingUp && gasValue > threshold) ? 1 : 0;
  sendPacket(gasValue, temp, hum, alarmState);

  // Gas Detection Alert Logic
  if (alarmState == 1) {
    String alertMsg = ">>> WARNING: GAS DETECTED! <<<";
    Serial.println(alertMsg);
    BT.println(alertMsg);

    digitalWrite(LED_PIN, HIGH);
    
    // Pulsed alarm beep (2 x 150ms beeps = 600ms total)
    for (int i = 0; i < 2; i++) {
      digitalWrite(BUZZER_PIN, HIGH);
      delay(150);
      digitalWrite(BUZZER_PIN, LOW);
      delay(150);
    }
    delay(400); // Keeps total alarm cycle time at 1 second for DHT11 stability
  } else {
    digitalWrite(LED_PIN, LOW);
    digitalWrite(BUZZER_PIN, LOW);
    delay(1000); // 1-second sample interval in normal/warmup state
  }
}
