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

int threshold = 300; // Gas threshold trigger level

void setup() {
  Serial.begin(9600); 
  BT.begin(9600);     
  dht.begin();        

  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  Serial.println("System Ready. Warming up MQ-2 sensor...");
  BT.println("System Ready. Warming up MQ-2 sensor...");
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

  // Format data string
  String statusMsg = "Gas: " + String(gasValue) + " | Temp: " + String(temp, 1) + "C | Hum: " + String(hum, 1) + "%";

  Serial.println(statusMsg);
  BT.println(statusMsg);

  // Gas Detection Alert Logic
  if (gasValue > threshold) {
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
    delay(1000); // 1-second sample interval in normal state
  }
}
