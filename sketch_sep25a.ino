#include <WiFi.h>
#include <WebServer.h>

// ====== Wi-Fi credentials ======
const char* ssid = "HARSH20 35";         // 🔹 Replace with your Wi-Fi SSID
const char* password = "87651234"; // 🔹 Replace with your Wi-Fi Password

// ====== Create Web Server on port 80 ======
WebServer server(80);

// ====== Relay pin mapping ======
#define RELAY1 12   // Relay 1 (Light)
#define RELAY2 13   // Relay 2 (Fan)
#define RELAY3 14   // Relay 3 (AC)
#define RELAY4 2    // Relay 4 (TV) — safer than GPIO15

// ====== Function: Control Relay ======
void controlRelay(String device, String action) {
  bool state = (action == "on");

  if (device == "bulb1") digitalWrite(RELAY1, state ? LOW : HIGH);
  else if (device == "bulb2") digitalWrite(RELAY2, state ? LOW : HIGH);
  else if (device == "bulb3") digitalWrite(RELAY3, state ? LOW : HIGH);
  else if (device == "bulb4") digitalWrite(RELAY4, state ? LOW : HIGH);
  else {
    Serial.println("⚠ Unknown device name: " + device);
    return;
  }

  // Debug print to Serial Monitor
  Serial.printf("Device: %s -> %s\n", device.c_str(), state ? "ON" : "OFF");
}

// ====== Function: Handle incoming requests ======
void handleRequest() {
  String path = server.uri();  // Example: /bulb1/on
  Serial.println("Incoming command: " + path);

  // Parse the path
  path.remove(0, 1); // remove leading '/'
  int slashIndex = path.indexOf('/');
  if (slashIndex == -1) {
    server.send(400, "application/json", "{\"message\":\"Invalid path\"}");
    return;
  }

  String device = path.substring(0, slashIndex);
  String action = path.substring(slashIndex + 1);

  controlRelay(device, action);

  // Send response
  String response = "{\"device\":\"" + device + "\",\"action\":\"" + action + "\"}";
  server.send(200, "application/json", response);
}

// ====== Function: Handle root page ======
void handleRoot() {
  String html = "<h2>ESP32-CAM Relay Controller</h2>"
                "<p>Try visiting /bulb1/on or /bulb1/off in your browser.</p>";
  server.send(200, "text/html", html);
}

// ====== Setup ======
void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("\nBooting ESP32-CAM Relay Controller...");

  // Initialize relay pins as outputs
  pinMode(RELAY1, OUTPUT);
  pinMode(RELAY2, OUTPUT);
  pinMode(RELAY3, OUTPUT);
  pinMode(RELAY4, OUTPUT);

  // Start with all relays OFF (HIGH for Active LOW relay)
  digitalWrite(RELAY1, HIGH);
  digitalWrite(RELAY2, HIGH);
  digitalWrite(RELAY3, HIGH);
  digitalWrite(RELAY4, HIGH);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n✅ Connected to Wi-Fi!");
  Serial.print("📶 IP Address: ");
  Serial.println(WiFi.localIP());

  // Define web routes
  server.on("/", handleRoot);
  server.onNotFound(handleRequest);

  // Start the web server
  server.begin();
  Serial.println("🌐 Web server started — waiting for commands...");
}

// ====== Loop ======
void loop() {
  server.handleClient();
}
