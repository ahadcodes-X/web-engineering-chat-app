// auth.js
// This script handles the login/register form from index.html

document.addEventListener("DOMContentLoaded", () => {
    
    // --- Get All Elements ---
    const loginContainer = document.querySelector(".login-container");
    const toggleText = document.getElementById("toggle-text");

    // Login Form
    const loginForm = document.getElementById("login-form");
    const usernameLoginInput = document.getElementById("username-login");
    const passwordLoginInput = document.getElementById("password-login");
    const errorLogin = document.getElementById("form-error-login");
    const submitButtonLogin = document.getElementById("submit-button-login");

    // Register Form
    const registerForm = document.getElementById("register-form");
    const usernameRegisterInput = document.getElementById("username-register");
    const passwordRegisterInput = document.getElementById("password-register");
    const errorRegister = document.getElementById("form-error-register");
    const submitButtonRegister = document.getElementById("submit-button-register");

    let isLoginMode = true;

    // --- Toggle between Login and Register ---
    function toggleAuthMode(e) {
        if (e) e.preventDefault(); 
        
        isLoginMode = !isLoginMode;
        errorLogin.textContent = ''; // Clear errors
        errorRegister.textContent = ''; // Clear errors

        if (isLoginMode) {
            loginContainer.classList.remove("show-register");
            toggleText.innerHTML = 'No account? <a href="#" id="toggle-link-register">Register here</a>';
            // Re-bind listener
            document.getElementById("toggle-link-register").addEventListener("click", toggleAuthMode);
        } else {
            loginContainer.classList.add("show-register");
            toggleText.innerHTML = 'Already have an account? <a href="#" id="toggle-link-login">Login here</a>';
            // Re-bind listener
            document.getElementById("toggle-link-login").addEventListener("click", toggleAuthMode);
        }
    }

    // Attach the initial listener
    document.getElementById("toggle-link-register").addEventListener("click", toggleAuthMode);

    
    // --- Handle Form Submission ---
    loginForm.addEventListener('submit', (e) => handleAuth(e, true));
    registerForm.addEventListener('submit', (e) => handleAuth(e, false));

    async function handleAuth(event, isLogin) {
        event.preventDefault();

        const endpoint = isLogin ? "/api/login" : "/api/register";
        const username = isLogin ? usernameLoginInput.value : usernameRegisterInput.value;
        const password = isLogin ? passwordLoginInput.value : passwordRegisterInput.value;
        const errorEl = isLogin ? errorLogin : errorRegister;
        const button = isLogin ? submitButtonLogin : submitButtonRegister;

        errorEl.textContent = ''; 
        button.classList.add('loading');
        button.disabled = true;

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "An error occurred.");
            }

            if (isLogin) {
                // Login success: Save token and redirect
                localStorage.setItem("chat_token", data.token);
                // AVATAR LINE REMOVED
                window.location.href = "/chat.html";
            } else {
                // Register success: Show message and switch to login mode
                alert("Registration successful! Please log in.");
                toggleAuthMode(null); // Manually toggle back to login
            }

        } catch (error) {
            errorEl.textContent = error.message;
        }

        button.classList.remove('loading');
        button.disabled = false;
    }

    
    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js') // Path is relative to public
                .then(registration => {
                    console.log('ServiceWorker registration successful');
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        });
    }

    // --- Particle Effect Initialization ---
    if (typeof tsParticles !== 'undefined') {
        tsParticles.load("tsparticlesfullpage", {
            background: { color: { value: "transparent" } },
            fpsLimit: 120,
            fullScreen: { enable: false },
            particles: {
                color: { value: "#FFFFFF" },
                move: {
                    direction: "none",
                    enable: true,
                    outModes: { default: "out" },
                    random: false,
                    speed: 1, 
                    straight: false
                },
                number: {
                    density: { enable: true },
                    value: 100 
                },
                opacity: {
                    value: { min: 0.1, max: 1 },
                    animation: { enable: true, speed: 4 }
                },
                size: {
                    value: { min: 0.6, max: 1.4 } 
                }
            },
            detectRetina: true
        });
    }
});