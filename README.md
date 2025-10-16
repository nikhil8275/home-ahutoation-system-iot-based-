# home-ahutoation-system-iot-based-
Smart Home Automation using ESP32 and IoT: A Wi-Fi-based system that allows users to control home appliances remotely through a web interface. The ESP32 microcontroller with relay modules enables real-time ON/OFF switching, secure login, and activity logging, making homes smarter, efficient, and user-friendly.


🚀 System Workflow

The ESP32 connects to Wi-Fi and listens for HTTP requests.

The user logs into the web application using secure credentials.

When a user toggles a device (ON/OFF), the Node.js server sends a command to the ESP32.

The ESP32 activates the corresponding relay to control the appliance.

The backend logs this action into the MySQL database with the username, device name, and timestamp.

This enables real-time device control and complete activity tracking.

🔧 Setup Instructions
🧱 Step 1: Hardware Setup

Connect the relay input pins (IN1–IN4) to ESP32 GPIOs (12, 13, 14, 2).

Connect relay VCC to 5V and GND to GND of ESP32.

Connect appliances to the NO (Normally Open) and COM relay pins.

💻 Step 2: Backend Setup

Install Node.js and MySQL.

Clone the repository:

git clone https://github.com/<your-username>/home-automation-iot.git
cd home-automation-iot
npm install


Update your database credentials in server.js:

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "home_auto"
});


Start the server:

node server.js


The backend will run at http://localhost:5000
.

🔌 Step 3: ESP32 Setup

Open Arduino IDE and install the ESP32 board support package.

Open the ESP32 code file (esp32_relay.ino).

Update Wi-Fi credentials:

const char* ssid = "Your_WiFi_Name";
const char* password = "Your_WiFi_Password";


Upload the code using USB or FTDI programmer.

Open Serial Monitor (115200 baud) to get the ESP32 IP address.

Enter that IP in your web app to connect to the device.

🧠 Security Implementations

Password Hashing: All passwords are securely hashed using bcrypt.

Session Management: Only authenticated users can access the dashboard.

Validation: Input validation prevents SQL injection and form tampering.

Access Control: Role-based access ensures admins and users have proper permissions.

Optional Add-ons: HTTPS encryption, firewall setup, and API key verification for enhanced security.

📈 Future Enhancements

Mobile App Integration – Develop a companion Android/iOS app.

AI & Predictive Automation – Enable smart scheduling and energy optimization.

Voice Control Integration – Support Google Assistant and Alexa commands.

Cloud Hosting – Allow remote access beyond the local network.

IoT Sensors & GPS – Add environmental sensors and track technicians.

Advanced Analytics – Generate smart reports and device insights.

🧪 Testing

The project has been tested for:

Relay response delay (approx. 100ms)

Wi-Fi reconnection reliability

Secure login and logout flows

Cross-device (mobile/desktop) compatibility

Fault handling when ESP32 is disconnected

All modules performed successfully under normal operation conditions.

🧾 Conclusion

The Smart Home Automation System demonstrates a practical IoT solution for household automation.
It provides remote appliance control, activity tracking, and role-based access — reducing manual tasks and improving operational efficiency.
The project can be deployed in both residential and small commercial setups, offering scalability for future smart integrations.

👨‍💻 Author

Nikhil Rane
Bacholres of Computer Science Student
📧 nrane788@gmail.com
]
🌐 [GitHub Profile Link]

📜 License

This project is licensed under the MIT License — you are free to use, modify, and distribute it with proper attribution.
