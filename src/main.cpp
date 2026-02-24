/*
 * ESP8266 IoT Sensor Monitor with WiFi Cloud Integration
 *
 * Sensors: DHT11 (Temp/Humidity), MQ-6 (Gas), LDR (Light), Soil Moisture, LCD I2C (Display)
 * MQ-6, LDR, Soil share A0 via CD4051 multiplexer.
 *
 * Hardware:
 * - DHT11: Data → D4 (GPIO2), 10kΩ pull-up, VCC → 3.3V
 * - MQ-6:  AOUT → CD4051 ch0 → A0, VCC → 5V
 * - LDR:   AOUT → CD4051 ch1 → A0, VCC → 3.3V
 * - Soil:  AOUT → CD4051 ch2 → A0, VCC → 3.3V
 * - CD4051: S0→GPIO12(D6), S1→GPIO13(D7), S2→GPIO14(D5), common→A0
 * - LCD:   SDA → D2 (GPIO4), SCL → D1 (GPIO5), VCC → 3.3V
 */

#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

// ========== WiFi CONFIGURATION ==========
// CHANGE THESE TO YOUR WiFi CREDENTIALS!
const char* ssid = "Akashesp";           // Your hotspot name
const char* password = "";                // Empty for open network (no password)

// ========== CLOUD SERVER CONFIGURATION ==========
// Your computer's IP address on Akashesp hotspot
// Current IP: 10.148.123.96
const char* serverUrl = "http://10.148.123.96:5001/api/sensor-data";

// ========== PIN DEFINITIONS ==========
#define DHT_PIN 2              // GPIO2 = D4
#define DHT_TYPE DHT11
#define MUX_ANALOG A0          // CD4051 common output
#define MUX_S0 12              // GPIO12 = D6, channel select
#define MUX_S1 13              // GPIO13 = D7
#define MUX_S2 14              // GPIO14 = D5

// ========== LCD SETUP ==========
#define LCD_ADDRESS 0x27
LiquidCrystal_I2C lcd(LCD_ADDRESS, 16, 2);

// ========== SENSOR INITIALIZATION ==========
DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient wifiClient;

// ========== VARIABLES ==========
float temperature = 0.0;
float humidity = 0.0;
int gasAnalog = 0;
int gasDigital = 0;
int lightLevel = 0;    // LDR: 0-1023
int soilMoisture = 0; // Soil: 0-1023

unsigned long lastSensorRead = 0;
unsigned long lastCloudUpload = 0;
unsigned long lastDisplayUpdate = 0;

const unsigned long SENSOR_INTERVAL = 2000;    // Read sensors every 2 seconds
const unsigned long CLOUD_INTERVAL = 10000;    // Upload to cloud every 10 seconds
const unsigned long DISPLAY_INTERVAL = 3000;   // Change display every 3 seconds

int displayMode = 0;
bool wifiConnected = false;
int uploadCount = 0;

// Function declarations
void connectWiFi();
void setMuxChannel(int ch);
void readSensors();
void uploadToCloud();
void updateLCD();
void printSerialData();

void setup() {
  // ========== SERIAL MONITOR ==========
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n========================================");
  Serial.println("ESP8266 IoT Sensor Monitor with WiFi");
  Serial.println("========================================");
  
  // ========== SENSORS INITIALIZATION ==========
  Serial.println("Initializing sensors...");
  dht.begin();
  pinMode(MUX_S0, OUTPUT);
  pinMode(MUX_S1, OUTPUT);
  pinMode(MUX_S2, OUTPUT);
  
  // ========== LCD INITIALIZATION ==========
  Wire.begin(4, 5);  // SDA, SCL
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("IoT Sensor");
  lcd.setCursor(0, 1);
  lcd.print("Connecting WiFi");
  
  Serial.println("✓ Sensors initialized");
  Serial.println("✓ LCD initialized");
  
  // ========== WiFi CONNECTION ==========
  connectWiFi();
  
  Serial.println("\n========================================");
  Serial.println("Setup Complete!");
  Serial.println("========================================\n");
  
  delay(2000);
}

void loop() {
  unsigned long currentMillis = millis();
  
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    wifiConnected = false;
    connectWiFi();
  } else {
    wifiConnected = true;
  }
  
  // Read sensors
  if (currentMillis - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = currentMillis;
    readSensors();
    printSerialData();
  }
  
  // Upload to cloud
  if (currentMillis - lastCloudUpload >= CLOUD_INTERVAL) {
    lastCloudUpload = currentMillis;
    if (wifiConnected) {
      uploadToCloud();
    }
  }
  
  // Update LCD display
  if (currentMillis - lastDisplayUpdate >= DISPLAY_INTERVAL) {
    lastDisplayUpdate = currentMillis;
    displayMode = (displayMode + 1) % 6;  // 6 screens (added LDR, Soil)
  }
  updateLCD();
  
  delay(100);
}

// ========== WiFi CONNECTION ==========
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
    Serial.println("\n✓ WiFi Connected!");
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
    Serial.println("\n✗ WiFi Connection Failed!");
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

// ========== CD4051: select channel 0..7 ==========
void setMuxChannel(int ch) {
  digitalWrite(MUX_S0, (ch & 1) ? HIGH : LOW);
  digitalWrite(MUX_S1, (ch & 2) ? HIGH : LOW);
  digitalWrite(MUX_S2, (ch & 4) ? HIGH : LOW);
  delay(2);  // settle
}

// ========== READ SENSORS ==========
void readSensors() {
  temperature = dht.readTemperature();
  humidity = dht.readHumidity();
  setMuxChannel(0);
  gasAnalog = analogRead(MUX_ANALOG);
  gasDigital = 0;  // not used with CD4051
  setMuxChannel(1);
  lightLevel = analogRead(MUX_ANALOG);
  setMuxChannel(2);
  soilMoisture = analogRead(MUX_ANALOG);
}

// ========== UPLOAD TO CLOUD ==========
void uploadToCloud() {
  if (!wifiConnected) return;
  
  HTTPClient http;
  
  // Create JSON payload (same as before + light_level, soil_moisture)
  String jsonData = "{";
  jsonData += "\"temperature\":" + String(temperature, 1) + ",";
  jsonData += "\"humidity\":" + String(humidity, 1) + ",";
  jsonData += "\"gas_analog\":" + String(gasAnalog) + ",";
  jsonData += "\"gas_digital\":" + String(gasDigital) + ",";
  jsonData += "\"light_level\":" + String(lightLevel) + ",";
  jsonData += "\"soil_moisture\":" + String(soilMoisture) + ",";
  jsonData += "\"timestamp\":" + String(millis()) + ",";
  jsonData += "\"device_id\":\"ESP8266_" + WiFi.macAddress() + "\"";
  jsonData += "}";
  
  http.begin(wifiClient, serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.POST(jsonData);
  
  if (httpCode > 0) {
    uploadCount++;
    Serial.print("☁ Cloud Upload #");
    Serial.print(uploadCount);
    Serial.print(" - HTTP ");
    Serial.print(httpCode);
    
    if (httpCode == 200 || httpCode == 201) {
      Serial.println(" ✓ SUCCESS");
    } else {
      Serial.println(" - Response: " + http.getString());
    }
  } else {
    Serial.print("✗ Upload failed: ");
    Serial.println(http.errorToString(httpCode));
  }
  
  http.end();
}

// ========== PRINT SERIAL DATA ==========
void printSerialData() {
  Serial.println("========================================");
  Serial.println("Sensor Readings:");
  Serial.println("----------------------------------------");
  
  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("DHT11: ✗ Failed to read");
  } else {
    Serial.println("DHT11: ✓ Working");
    Serial.print("  Temperature: ");
    Serial.print(temperature, 1);
    Serial.println(" °C");
    Serial.print("  Humidity:    ");
    Serial.print(humidity, 1);
    Serial.println(" %");
  }
  
  Serial.println("\nMQ-6 Gas Sensor:");
  Serial.print("  Analog:  ");
  Serial.print(gasAnalog);
  Serial.print(" / 1024 (");
  Serial.print((gasAnalog / 1024.0) * 100, 1);
  Serial.println("%)");

  Serial.println("\nLDR (Light):");
  Serial.print("  Raw: ");
  Serial.println(lightLevel);

  Serial.println("Soil Moisture:");
  Serial.print("  Raw: ");
  Serial.println(soilMoisture);

  Serial.print("\nWiFi: ");
  Serial.print(wifiConnected ? "✓ Connected (" : "✗ Disconnected");
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

// ========== UPDATE LCD DISPLAY ==========
void updateLCD() {
  switch (displayMode) {
    case 0:  // Temperature & Humidity
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
      
    case 1:  // Gas Level with Bar
    {
      lcd.setCursor(0, 0);
      lcd.print("Gas: ");
      if (gasAnalog < 10) lcd.print("  ");
      else if (gasAnalog < 100) lcd.print(" ");
      lcd.print(gasAnalog);
      lcd.print("/1024  ");
      
      lcd.setCursor(0, 1);
      int bars = map(gasAnalog, 0, 1024, 0, 16);
      for(int i = 0; i < 16; i++) {
        lcd.print(i < bars ? (char)255 : ' ');
      }
      break;
    }
      
    case 2:  // Gas Status
    {
      lcd.setCursor(0, 0);
      if (gasAnalog < 100) {
        lcd.print("Air: GOOD       ");
        lcd.setCursor(0, 1);
        lcd.print("Safe to breathe ");
      } else if (gasAnalog < 300) {
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
    
    case 3:  // WiFi & Cloud Status
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

    case 4:  // LDR (Light)
    {
      lcd.setCursor(0, 0);
      lcd.print("Light: ");
      lcd.print(lightLevel);
      lcd.print("     ");
      lcd.setCursor(0, 1);
      lcd.print(lightLevel > 512 ? "Bright    " : "Dark      ");
      break;
    }

    case 5:  // Soil Moisture
    {
      lcd.setCursor(0, 0);
      lcd.print("Soil: ");
      lcd.print(soilMoisture);
      lcd.print("     ");
      lcd.setCursor(0, 1);
      lcd.print(soilMoisture > 512 ? "Wet       " : "Dry       ");
      break;
    }
  }
}

