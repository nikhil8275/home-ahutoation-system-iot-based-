document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // --- Part 1: Authentication & Page Routing ---
    // This section handles login, registration, and ensures users are on the correct page.
    const handleAuthentication = () => {

        // --- REGISTRATION FORM ---
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault(); // Stop the form from reloading the page
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;

                try {
                    const response = await fetch('/register', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });

                    const result = await response.json();

                    if (response.ok) {
                        // The server automatically logs the user in after successful registration
                        alert('Registration successful! Redirecting to your dashboard...');
                        window.location.href = '/'; // Redirect to the main protected route
                    } else {
                        // Show the specific error message from the server (e.g., "Username already exists")
                        alert(`Registration Failed: ${result.message}`);
                    }
                } catch (error) {
                    console.error('Registration network error:', error);
                    alert('Could not connect to the server. Please check your connection and try again.');
                }
            });
        }

        // --- LOGIN FORM ---
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;

                try {
                    const response = await fetch('/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    
                    if (response.redirected) {
                        // If the server redirects (on successful login), the browser will follow it.
                        window.location.href = response.url;
                    } else {
                        // If it doesn't redirect, it means there was an error.
                        const result = await response.json();
                        alert(`Login Failed: ${result.message}`);
                    }
                } catch (error) {
                    console.error('Login network error:', error);
                    alert('Could not connect to the server. Please try again.');
                }
            });
        }

        // --- SESSION CHECK ---
        // This runs on every page load to check if the user is already logged in.
        fetch('/session')
            .then(res => res.json())
            .then(data => {
                if (data.loggedIn) {
                    // If the user IS logged in, they cannot be on the login or register pages.
                    if (currentPage === 'login.html' || currentPage === 'register.html') {
                        window.location.href = '/'; // Go to the main dashboard
                    }
                } else {
                    // If the user IS NOT logged in, they cannot be on the dashboard page.
                    if (currentPage !== 'login.html' && currentPage !== 'register.html') {
                        window.location.href = 'login.html';
                    }
                }
            });
    };
    
    // Run the authentication logic for the page
    handleAuthentication();

    // --- Part 2: Dashboard-Specific Functionality ---
    // This code will only execute if the current page is the main dashboard.
    if (currentPage === 'index.html' || currentPage.trim() === '') {
        
        // Fetch the username from the server's session and display it
        fetch('/session')
            .then(res => res.json())
            .then(data => {
                if (data.loggedIn) {
                    document.getElementById('username-display').innerText = data.username;
                }
            });

        // LOGOUT BUTTON: Tell the server to destroy the session
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await fetch('/logout', { method: 'POST' });
            alert('You have been logged out.');
            window.location.href = 'login.html';
        });

        const notificationsBox = document.getElementById('notifications');
        
        // Function to add a NEW, LIVE action to the top of the log for immediate feedback
        const addLiveNotification = (log) => {
            const date = new Date(log.timestamp);
            const ts = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const logElement = document.createElement('div');
            logElement.innerHTML = `<span class="muted">[${ts}] ${log.username} turned ${log.device_name} ${log.action.toUpperCase()}</span>`;
            notificationsBox.prepend(logElement);
        };

        // Function to load HISTORICAL logs from the database when the page loads
        const loadLogs = async () => {
            try {
                const response = await fetch('/logs');
                if (!response.ok) throw new Error('Failed to fetch logs');
                
                const logs = await response.json();
                notificationsBox.innerHTML = ''; // Clear any existing logs
                
                logs.forEach(log => {
                    const date = new Date(log.timestamp);
                    const ts = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    notificationsBox.innerHTML += `<div><span class="muted">[${ts}] ${log.username} turned ${log.device_name} ${log.action.toUpperCase()}</span></div>`;
                });
            } catch (error) {
                console.error("Failed to load logs:", error);
                notificationsBox.innerHTML = "<div>Could not load activity logs.</div>";
            }
        };

        // --- FINAL, CORRECTED DEVICE TOGGLE LOGIC ---
        document.querySelectorAll('.form-check-input[data-device]').forEach(checkbox => {
            checkbox.addEventListener('change', async () => {
                const technicalName = checkbox.dataset.device;                            // e.g., "bulb1"
                const friendlyName = checkbox.closest('.device-card').querySelector('.device-name').innerText; // e.g., "Living Room Light"
                const action = checkbox.checked ? 'on' : 'off';

                try {
                    const response = await fetch(`/turn/${technicalName}/${action}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        // Send the friendly name in the body of the request for logging
                        body: JSON.stringify({ deviceName: friendlyName })
                    });

                    if (!response.ok) {
                        const result = await response.json();
                        throw new Error(result.message || 'An error occurred.');
                    }
                    
                    // On success, instantly update the log on the webpage
                    const currentUser = document.getElementById('username-display').innerText;
                    addLiveNotification({
                        username: currentUser,
                        device_name: friendlyName,
                        action: action,
                        timestamp: new Date()
                    });

                } catch (error) {
                    console.error(`Error toggling device:`, error);
                    alert(`Failed to turn device on. Error: ${error.message}`);
                    // Revert the toggle switch on the webpage if the command failed
                    checkbox.checked = !checkbox.checked;
                }
            });
        });
        
        // Load the logs from the database when the dashboard page first loads
        loadLogs();
    }
});