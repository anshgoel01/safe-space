// ==========================================================================
// Safe Space - ESP32 Sensor Code with HRV (RMSSD) Calculation
//
// This code reads raw data, converts it to standard units, and now also
// calculates Heart Rate Variability (HRV) from the BVP signal.
//
// ==========================================================================
// >> REQUIRED LIBRARIES <<
// You MUST install the following libraries from the Arduino IDE Library Manager:
// 1. ArduinoJson
// 2. PulseSensor Playground (We use its beat-finding algorithm)
// ==========================================================================

#include <Wire.h>
#include "MAX30105.h"
#include <OneWire.h>
#include <DallasTemperature.h>
#include "BluetoothSerial.h"
#include <ArduinoJson.h>

// === Pin Definitions ===
#define GSR_PIN 36      // Analog input for EDA
#define MPU_ADDR 0x68   // I2C address for MPU6050
#define ONE_WIRE_BUS 4  // DS18B20 data pin
#define LED_BUILTIN 2   // Onboard LED, usually GPIO 2 for ESP32 boards

// === Conversion Constants ===
const float ACC_SENSITIVITY = 16384.0;
const float GSR_REF_RESISTANCE = 10000.0;
const float ADC_VOLTAGE = 3.3;

// === HRV Calculation Constants & Variables ===
#define IBI_BUFFER_SIZE 20 // Store the last 20 Inter-Beat Intervals
volatile int ibi_buffer[IBI_BUFFER_SIZE];
volatile int ibi_buffer_index = 0;
volatile bool beat_detected = false;
volatile int BPM = 0;
volatile int IBI = 0;
volatile float hrv_rmssd = 0.0;

// Variables for the beat-finding algorithm
int Signal;
unsigned long sampleCounter = 0;
unsigned long lastBeatTime = 0;
int P = 512;
int T = 512;
int thresh = 525;
int amp = 100;
bool firstBeat = true;
bool secondBeat = false;

// === Sensor Instances ===
MAX30105 particleSensor;
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature tempSensor(&oneWire);
BluetoothSerial SerialBT;

// === Timing Control ===
unsigned long lastDataSend = 0;
const long dataSendInterval = 250;
unsigned long lastHrvSampleTime = 0;

// === Processed Sensor Value Storage ===
static float eda_uS = 0.0;
static float acc_x_g = 0.0, acc_y_g = 0.0, acc_z_g = 0.0;
static float temp_c = 0.0;

// === Function Declarations ===
void processOtherSensors();
void handleSerialCommands();
void sendJsonData();
void calculateRMSSD();

void setup() {
  Serial.begin(115200);
  SerialBT.begin("ESP32_SafeSpace_HRV");
  Wire.begin();
  analogReadResolution(12);
  pinMode(LED_BUILTIN, OUTPUT); // Initialize the built-in LED pin

  Serial.println("Initializing sensors...");
  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x6B); Wire.write(0x00);
  Wire.endTransmission();

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 not found. Halting.");
    while (1);
  }
  particleSensor.setup(0, 4, 2, 4096, 400, 118); // Power, Sample Avg, LED Mode, Sample Rate, Pulse Width, ADC Range
  tempSensor.begin();
  Serial.println("All sensors initialized. Ready to connect.");
}

void loop() {
  handleSerialCommands();
  processOtherSensors();

  // --- HRV Processing Loop ---
  // This runs as fast as possible to catch every heartbeat
  Signal = particleSensor.getIR();
  sampleCounter = millis();
  int N = sampleCounter - lastBeatTime;

  // Find the peak and trough of the pulse wave
  if (Signal < thresh && N > (IBI / 5) * 3) {
    if (Signal < T) {
      T = Signal;
    }
  }

  if (Signal > thresh && Signal > P) {
    P = Signal;
  }

  // Look for a beat
  if (N > 250) {
    if ((Signal > thresh) && (beat_detected == false) && (N > (IBI / 5) * 3)) {
      beat_detected = true;
      digitalWrite(LED_BUILTIN, HIGH);
      IBI = sampleCounter - lastBeatTime;
      lastBeatTime = sampleCounter;

      if (firstBeat) {
        firstBeat = false;
        secondBeat = true;
      } else {
        if (IBI > 300 && IBI < 2000) { // Filter out unrealistic IBI values
          // Store IBI in a circular buffer
          ibi_buffer[ibi_buffer_index] = IBI;
          ibi_buffer_index = (ibi_buffer_index + 1) % IBI_BUFFER_SIZE;
          // Recalculate RMSSD with the new IBI value
          calculateRMSSD();
        }
      }
    }
  }

  if (Signal < thresh && beat_detected == true) {
    digitalWrite(LED_BUILTIN, LOW);
    beat_detected = false;
    amp = P - T;
    thresh = amp / 2 + T;
    P = thresh;
    T = thresh;
  }

  if (N > 2500) {
    thresh = 512;
    P = 512;
    T = 512;
    lastBeatTime = sampleCounter;
    firstBeat = true;
    secondBeat = false;
    hrv_rmssd = 0; // Reset HRV if no beat is detected for a while
  }
  // --- End HRV Loop ---

  // Send all data at a fixed interval
  if (millis() - lastDataSend >= dataSendInterval) {
    sendJsonData();
    lastDataSend = millis();
  }
}

// =================================================
// === Core Functions ==============================
// =================================================

/**
 * @brief Reads and processes data from all sensors EXCEPT the BVP sensor.
 */
void processOtherSensors() {
  int16_t raw_ax, raw_ay, raw_az;
  int raw_eda = analogRead(GSR_PIN);

  Wire.beginTransmission(MPU_ADDR);
  Wire.write(0x3B);
  Wire.endTransmission(false);
  Wire.requestFrom(MPU_ADDR, 6, true);
  raw_ax = Wire.read() << 8 | Wire.read();
  raw_ay = Wire.read() << 8 | Wire.read();
  raw_az = Wire.read() << 8 | Wire.read();

  tempSensor.requestTemperatures();
  float raw_temp = tempSensor.getTempCByIndex(0);
  if (raw_temp != DEVICE_DISCONNECTED_C) {
    temp_c = raw_temp;
  }

  acc_x_g = (float)raw_ax / ACC_SENSITIVITY;
  acc_y_g = (float)raw_ay / ACC_SENSITIVITY;
  acc_z_g = (float)raw_az / ACC_SENSITIVITY;

  if (raw_eda > 0) {
    float Vout = (float)raw_eda * (ADC_VOLTAGE / 4095.0);
    float skin_resistance = GSR_REF_RESISTANCE * (ADC_VOLTAGE / Vout - 1.0);
    eda_uS = (1.0 / skin_resistance) * 1000000.0;
  } else {
    eda_uS = 0;
  }
}

/**
 * @brief Calculates RMSSD from the buffer of IBI values.
 */
void calculateRMSSD() {
  long sum_of_squared_diffs = 0;
  int diff_count = 0;

  for (int i = 0; i < IBI_BUFFER_SIZE - 1; ++i) {
    int next_index = (i + 1);
    // Ensure we are comparing valid, consecutive beats
    if (ibi_buffer[i] != 0 && ibi_buffer[next_index] != 0) {
      long diff = ibi_buffer[i] - ibi_buffer[next_index];
      sum_of_squared_diffs += diff * diff;
      diff_count++;
    }
  }

  if (diff_count > 0) {
    hrv_rmssd = sqrt((float)sum_of_squared_diffs / diff_count);
  } else {
    hrv_rmssd = 0.0;
  }
}

/**
 * @brief Handles incoming serial commands.
 */
void handleSerialCommands() {
  if (SerialBT.available()) {
    String command = SerialBT.readStringUntil('\n');
    command.trim();
    if (command == "PING") {
      SerialBT.println("PONG");
    }
  }
  if (Serial.available()) {
    String command = Serial.readStringUntil('\n');
    command.trim();
    if (command == "PING") {
      Serial.println("PONG");
    }
  }
}

/**
 * @brief Creates a JSON object with all processed sensor data and sends it.
 */
void sendJsonData() {
  StaticJsonDocument<256> doc;

  doc["eda_uS"] = eda_uS;
  doc["hrv_rmssd"] = hrv_rmssd; // Add the new HRV value
  doc["temp_c"] = temp_c;
  doc["acc_x_g"] = acc_x_g;
  doc["acc_y_g"] = acc_y_g;
  doc["acc_z_g"] = acc_z_g;
  // We no longer send raw BVP, as it's been processed into HRV
  // If you still need it for plotting, you can add: doc["bvp_raw"] = Signal;

  String output;
  serializeJson(doc, output);
  SerialBT.println(output);
  Serial.println(output);
}
