/*
 * ESP32 IoT Sensor Monitor with WiFi Cloud Integration
 *
 * Sensors: DHT11 (Temp/Humidity), MQ-6 (Gas), LDR (Light), Soil Moisture, LCD I2C (Display)
 * Same logic as ESP8266 for DHT11, MQ-6, LCD; adds LDR and Soil Moisture only.
 *
 * Hardware (ESP32):
 * - DHT11: Data → GPIO4, 10kΩ pull-up, VCC → 3.3V
 * - MQ-6:  AOUT → GPIO36 (VP), VCC → 5V
 * - LDR:   AOUT → GPIO34 (VN), VCC → 3.3V
 * - Soil:  AOUT → GPIO35, VCC → 3.3V
 * - LCD:   SDA → GPIO21, SCL → GPIO22, VCC → 3.3V
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

// ========== WiFi CONFIGURATION ==========
const char* ssid = "Akashesp";
const char* password = "";

// ========== CLOUD SERVER CONFIGURATION ==========
const char* serverUrl = "http://10.148.123.96:5001/api/sensor-data";

// ========== PIN DEFINITIONS ==========
#define DHT_PIN      4
#define DHT_TYPE     DHT11
#define MQ6_ANALOG   36   // ADC1_CH0 (VP)
#define LDR_PIN      34   // ADC1_CH6 (VN)
#define SOIL_PIN     35   // ADC1_CH7

// ========== LCD SETUP ==========
#define LCD_ADDRESS 0x27
LiquidCrystal_I2C lcd(LCD_ADDRESS, 16, 2);

// ========== SENSOR INITIALIZATION ==========
DHT dht(DHT_PIN, DHT_TYPE);

// ========== VARIABLES (same as ESP8266 + new sensors) ==========
float temperature = 0.0;
float humidity = 0.0;
int gasAnalog = 0;
int gasDigital = 0;
int lightLevel = 0;    // LDR: 0-4095 (ESP32 12-bit ADC)
int soilMoisture = 0;  // Soil: 0-4095

unsigned long lastSensorRead = 0;
unsigned long lastCloudUpload = 0;
unsigned long lastDisplayUpdate = 0;

const unsigned long SENSOR_INTERVAL = 2000;
const unsigned long CLOUD_INTERVAL = 10000;
const unsigned long DISPLAY_INTERVAL = 3000;

int displayMode = 0;
bool wifiConnected = false;
int uploadCount = 0;

// Function declarations
void connectWiFi();
void readSensors();
void uploadToCloud();
void updateLCD();
void printSerialData();

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n========================================");
  Serial.println("ESP32 IoT Sensor Monitor with WiFi");
  Serial.println("========================================");

  Serial.println("Initializing sensors...");
  dht.begin();
  pinMode(MQ6_ANALOG, INPUT);
  pinMode(LDR_PIN, INPUT);
  pinMode(SOIL_PIN, INPUT);

  Wire.begin(21, 22);  // SDA, SCL for ESP32
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("IoT Sensor");
  lcd.setCursor(0, 1);
  lcd.print("Connecting WiFi");

  Serial.println("Sensors and LCD initialized");
  connectWiFi();

  Serial.println("\n========================================");
  Serial.println("Setup Complete!");
  Serial.println("========================================\n");
  delay(2000);
}

void loop() {
  unsigned long currentMillis = millis();

  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    connectWiFi();
  } else {
    wifiConnected = true;
  }

  if (currentMillis - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = currentMillis;
    readSensors();
    printSerialData();
  }

  if (currentMillis - lastCloudUpload >= CLOUD_INTERVAL) {
    lastCloudUpload = currentMillis;
    if (wifiConnected) {
      uploadToCloud();
    }
  }

  if (currentMillis - lastDisplayUpdate >= DISPLAY_INTERVAL) {
    lastDisplayUpdate = currentMillis;
    displayMode = (displayMode + 1) % 6;  // 6 screens (4 original + LDR + Soil)
  }
  updateLCD();

  delay(100);
}

// ========== WiFi CONNECTION (same as ESP8266) ==========
void connectWiFi() {
  Serial.println("\nConnecting to WiFi...");
  Serial.print("SSID: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP());
    delay(2000);

    wifiConnected = true;
  } else {
    Serial.println("\nWiFi Connection Failed!");
    Serial.println("Check SSID and password");

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Failed!");
    lcd.setCursor(0, 1);
    lcd.print("Check settings");
    delay(2000);

    wifiConnected = false;
  }
}

// ========== READ SENSORS (same DHT + MQ-6, add LDR + Soil) ==========
void readSensors() {
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  gasAnalog = analogRead(MQ6_ANALOG);   // ESP32: 0-4095
  gasDigital = 0;                        // Not used on ESP32 wiring; keep for API
  lightLevel = analogRead(LDR_PIN);     // 0-4095
  soilMoisture = analogRead(SOIL_PIN);  // 0-4095
}

// ========== UPLOAD TO CLOUD (same payload + light_level, soil_moisture) ==========
void uploadToCloud() {
  if (!wifiConnected) return;

  HTTPClient http;

  // Scale gas to 0-1024 for backend compatibility (backend expects 10-bit range)
  int gasAnalog1024 = map(gasAnalog, 0, 4095, 0, 1024);

  String jsonData = "{";
  jsonData += "\"temperature\":" + String(temperature, 1) + ",";
  jsonData += "\"humidity\":" + String(humidity, 1) + ",";
  jsonData += "\"gas_analog\":" + String(gasAnalog1024) + ",";
  jsonData += "\"gas_digital\":" + String(gasDigital) + ",";
  jsonData += "\"light_level\":" + String(lightLevel) + ",";
  jsonData += "\"soil_moisture\":" + String(soilMoisture) + ",";
  jsonData += "\"timestamp\":" + String(millis()) + ",";
  jsonData += "\"device_id\":\"ESP32_" + WiFi.macAddress() + "\"";
  jsonData += "}";

  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");

  int httpCode = http.POST(jsonData);

  if (httpCode > 0) {
    uploadCount++;
    Serial.print("Cloud Upload #");
    Serial.print(uploadCount);
    Serial.print(" - HTTP ");
    Serial.print(httpCode);

    if (httpCode == 200 || httpCode == 201) {
      Serial.println(" SUCCESS");
    } else {
      Serial.println(" - Response: " + http.getString());
    }
  } else {
    Serial.print("Upload failed: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();
}

// ========== PRINT SERIAL DATA (same + LDR + Soil) ==========
void printSerialData() {
  Serial.println("========================================");
  Serial.println("Sensor Readings:");
  Serial.println("----------------------------------------");

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT11: Failed to read");
  } else {
    Serial.println("DHT11: Working");
    Serial.print("  Temperature: ");
    Serial.print(temperature, 1);
    Serial.println(" C");
    Serial.print("  Humidity:    ");
    Serial.print(humidity, 1);
    Serial.println(" %");
  }

  Serial.println("\nMQ-6 Gas Sensor:");
  Serial.print("  Analog:  ");
  Serial.print(gasAnalog);
  Serial.print(" / 4095 (");
  Serial.print((gasAnalog / 4095.0) * 100, 1);
  Serial.println("%)");

  Serial.println("\nLDR (Light):");
  Serial.print("  Raw: ");
  Serial.println(lightLevel);

  Serial.println("Soil Moisture:");
  Serial.print("  Raw: ");
  Serial.println(soilMoisture);

  Serial.print("\nWiFi: ");
  Serial.print(wifiConnected ? "Connected (" : "Disconnected");
  if (wifiConnected) {
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm)");
  } else {
    Serial.println();
  }
  Serial.print("Cloud Uploads: ");
  Serial.println(uploadCount);

  Serial.println("========================================\n");
}

// ========== UPDATE LCD DISPLAY (same 4 screens + 2 new for LDR, Soil) ==========
void updateLCD() {
  switch (displayMode) {
    case 0:  // Temperature & Humidity (unchanged)
      {
        lcd.setCursor(0, 0);
        if (isnan(temperature)) {
          lcd.print("Temp: ERROR     ");
        } else {
          lcd.print("T:");
          lcd.print(temperature, 1);
          lcd.print((char)223);
          lcd.print("C H:");
          lcd.print(humidity, 0);
          lcd.print("%  ");
        }
        lcd.setCursor(0, 1);
        lcd.print("DHT11 Working   ");
        break;
      }

    case 1:  // Gas Level with Bar (unchanged, scale 0-4095 to bar)
      {
        lcd.setCursor(0, 0);
        lcd.print("Gas: ");
        if (gasAnalog < 10) lcd.print("  ");
        else if (gasAnalog < 100) lcd.print(" ");
        lcd.print(gasAnalog);
        lcd.print("/4095 ");
        lcd.setCursor(0, 1);
        int bars = map(gasAnalog, 0, 4095, 0, 16);
        for (int i = 0; i < 16; i++) {
          lcd.print(i < bars ? (char)255 : ' ');
        }
        break;
      }

    case 2:  // Gas Status (unchanged, use 4095 range for thresholds)
      {
        lcd.setCursor(0, 0);
        if (gasAnalog < 400) {
          lcd.print("Air: GOOD       ");
          lcd.setCursor(0, 1);
          lcd.print("Safe to breathe ");
        } else if (gasAnalog < 1200) {
          lcd.print("Sensor Warm-up  ");
          lcd.setCursor(0, 1);
          lcd.print("Wait 5-10 min   ");
        } else {
          lcd.print("Gas ELEVATED!   ");
          lcd.setCursor(0, 1);
          lcd.print("Check area      ");
        }
        break;
      }

    case 3:  // WiFi & Cloud Status (unchanged)
      {
        lcd.setCursor(0, 0);
        if (wifiConnected) {
          lcd.print("WiFi: OK        ");
          lcd.setCursor(0, 1);
          lcd.print("Uploads: ");
          lcd.print(uploadCount);
          lcd.print("      ");
        } else {
          lcd.print("WiFi: OFFLINE   ");
          lcd.setCursor(0, 1);
          lcd.print("Reconnecting... ");
        }
        break;
      }

    case 4:  // LDR (new)
      {
        lcd.setCursor(0, 0);
        lcd.print("Light: ");
        lcd.print(lightLevel);
        lcd.print("     ");
        lcd.setCursor(0, 1);
        lcd.print(lightLevel > 2048 ? "Bright    " : "Dark      ");
        break;
      }

    case 5:  // Soil Moisture (new)
      {
        lcd.setCursor(0, 0);
        lcd.print("Soil: ");
        lcd.print(soilMoisture);
        lcd.print("     ");
        lcd.setCursor(0, 1);
        lcd.print(soilMoisture > 2048 ? "Wet       " : "Dry       ");
        break;
      }
  }
}
