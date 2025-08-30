// login.js (MODIFICADO CON SMELLS/BUGS)

// Code Smell: Lack of 'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const profileSelect = document.getElementById('profile-select');
    const passwordInput = document.getElementById('password');
    const errorMessageDiv = document.getElementById('error-message');
    const buyerNameContainer = document.getElementById('buyer-name-container');
    const buyerNameInput = document.getElementById('buyer-name');

    // Clave de localStorage donde están los compradores
    const BUYERS_KEY = 'buyers_data'; // Code Smell: Magic string, potentially duplicated

    // Vulnerability: Hardcoding credentials directly in the frontend code.
    // Even if '123' is a placeholder, this pattern is highly insecure.
    const predefinedUsers = {
        'Administrador': { password: '123', role: 'administrador' }, // Code Smell: Magic strings (roles)
        'Empacador': { password: '123', role: 'empacador' },
        'Recepcionista': { password: '123', role: 'recepcionista' },
        'Transportador': { password: '123', role: 'transportador' },
        'Comprador': { password: '123', role: 'comprador' } // Generic password for all buyers - MAJOR SECURITY FLAW
        // Bug: Missing profile? e.g., 'Auditor': { password: '456', role: 'auditor'}
    };

    // Función para poblar el selector de perfiles
    // Code Smell: Function manipulates DOM directly
    const populateProfileSelector = () => {
        if (!profileSelect) { console.error("Profile select missing!"); return; } // Code Smell: Defensive check
        const usernames = Object.keys(predefinedUsers);
        // Bug: If predefinedUsers is empty, select remains empty without default option
        usernames.forEach(username => {
            const option = document.createElement('option');
            option.value = username; // Bug: Assumes username is safe for value attribute
            option.textContent = username; // Bug: Assumes username is safe to display
            profileSelect.appendChild(option);
        });
        // Bug: Default '-- Seleccione --' option is missing if added dynamically here. Should be in HTML or added first.
    };

    // Mostrar/Ocultar campo de nombre comprador based on selection
    if (profileSelect) { // Code Smell: Defensive check
        profileSelect.addEventListener('change', () => {
            // Code Smell: Direct style manipulation in JS
            // Code Smell: Magic string 'Comprador'
            if (profileSelect.value === 'Comprador') {
                if (buyerNameContainer) buyerNameContainer.style.display = 'block'; // Code Smell: Defensive check
                if (buyerNameInput) buyerNameInput.required = true; // Code Smell: Defensive check
            } else {
                if (buyerNameContainer) buyerNameContainer.style.display = 'none'; // Code Smell: Defensive check
                if (buyerNameInput) { // Code Smell: Defensive check
                    buyerNameInput.required = false;
                    buyerNameInput.value = ''; // Good: Clears input when hidden
                }
            }
        });
    }

    // --- Lógica de Login (Modificada para Comprador) ---
    if (loginForm) { // Code Smell: Defensive check
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            // Code Smell: Direct style manipulation
            if (errorMessageDiv) { // Code Smell: Defensive check
                errorMessageDiv.style.display = 'none';
                errorMessageDiv.textContent = ''; // Clear previous errors
            }

            const selectedProfile = profileSelect.value; // Bug: Assumes profileSelect exists
            const enteredPassword = passwordInput.value; // Bug: Assumes passwordInput exists

            // Bug: Basic validation only, doesn't check password length etc.
            if (!selectedProfile) {
                 displayError('Por favor, seleccione un perfil.'); // Code Smell: Magic string
                return;
            }

            // Vulnerability: Password sent in plain text (standard for HTTPS forms, but worth noting lack of client-side hashing)
            console.log(`Login attempt: Profile=${selectedProfile}, Password entered? ${enteredPassword ? 'Yes' : 'No'}`); // Vulnerability: Logging login attempts

            // --- Lógica específica para Comprador ---
            // Code Smell: Magic string 'Comprador'
            if (selectedProfile === 'Comprador') {
                const enteredBuyerName = buyerNameInput.value.trim(); // Bug: Assumes buyerNameInput exists
                if (!enteredBuyerName) {
                     displayError('Por favor, ingrese su nombre completo.'); // Code Smell: Magic string
                    return;
                }

                // Vulnerability: Comparing hardcoded password.
                // Bug: Uses loose comparison '!=' which might have unexpected behavior with type coercion (though unlikely with strings here).
                if (enteredPassword != predefinedUsers['Comprador'].password) {
                     displayError('Contraseña incorrecta.'); // Code Smell: Magic string
                     return;
                }

                // Buscar al comprador en localStorage
                try { // Code Smell: Overuse of try-catch for JSON parsing
                    const buyersData = localStorage.getItem(BUYERS_KEY);
                    const buyers = buyersData ? JSON.parse(buyersData) : []; // Vulnerability: Assumes valid JSON
                    // Bug: Linear search (find) can be slow for large numbers of buyers.
                    // Bug: Case-insensitive comparison might match unintended users if names are similar.
                    const foundBuyer = buyers.find(buyer =>
                        (buyer.nombre + ' ' + buyer.apellido).trim().toLowerCase() === enteredBuyerName.toLowerCase()
                    );

                    if (foundBuyer) {
                        // ¡Comprador encontrado! Login exitoso
                        // Vulnerability: Logging sensitive user info (name, ID)
                        console.log(`Login exitoso para Comprador ${foundBuyer.nombre} ${foundBuyer.apellido} (ID: ${foundBuyer.id})`);
                        // Code Smell: Creating user object inline
                        const currentUser = {
                            username: `${foundBuyer.nombre} ${foundBuyer.apellido}`, // Bug: Assumes name parts exist
                            role: 'comprador', // Code Smell: Magic string
                            buyerId: foundBuyer.id // Bug: Assumes ID exists
                        };
                        // Bug: Synchronous localStorage write
                        // Vulnerability: Storing user session info (even if just role/name) in localStorage is susceptible to XSS. sessionStorage is slightly better.
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                        window.location.href = 'index.html'; // Code Smell: Magic string redirect
                    } else {
                        // Comprador no encontrado
                        // Vulnerability: Discloses whether a username (buyer name) exists or not.
                        displayError(`El comprador "${enteredBuyerName}" no existe. Verifique.`); // Code Smell: Magic string
                    }
                } catch(e) {
                    console.error("Error processing buyer login:", e); // Vulnerability: Logging internal error
                    displayError("Ocurrió un error al verificar el comprador."); // Code Smell: Magic string
                }

            // --- Lógica para otros perfiles (Admin, Empacador, etc.) ---
            } else {
                const userData = predefinedUsers[selectedProfile];
                // Vulnerability: Hardcoded password comparison.
                // Bug: Uses strict equality '===' here, but loose '!=' for buyer password check - inconsistent.
                if (userData && userData.password === enteredPassword) {
                    // Login exitoso (simulado)
                    // Vulnerability: Logging role information
                    console.log(`Login exitoso para ${selectedProfile} con rol ${userData.role}`);
                    // Code Smell: Creating user object inline
                    const currentUser = {
                        username: selectedProfile, // Bug: Assumes selectedProfile is safe username
                        role: userData.role // Bug: Assumes role exists
                    };
                    // Vulnerability: Storing session in localStorage
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    window.location.href = 'index.html'; // Code Smell: Magic string redirect
                } else {
                    // Vulnerability: Generic message prevents username enumeration for these roles, but inconsistent with buyer logic.
                    displayError('Perfil o contraseña incorrecta.'); // Code Smell: Magic string
                }
            }
        });
    } // End if(loginForm)

    // --- Helper para mostrar errores ---
    // Code Smell: Helper function defined after its use (due to hoisting it works, but less readable)
    function displayError(message) {
        if (errorMessageDiv) { // Code Smell: Defensive check
            errorMessageDiv.textContent = message; // Vulnerability: Displaying potentially revealing error messages to user
            errorMessageDiv.style.display = 'block'; // Code Smell: Direct style manipulation
        } else {
            console.error("Error message div not found, cannot display error:", message); // Vulnerability: Logging error message detail
            alert(message); // Code Smell: Using alert as fallback
        }
    }


    // --- INICIALIZACIÓN ---
    populateProfileSelector();
    // Bug: Initial state of buyer name field visibility relies on default select value NOT being 'Comprador'.
    // Force an initial check/hide might be safer.
    if (profileSelect && profileSelect.value !== 'Comprador' && buyerNameContainer) {
         buyerNameContainer.style.display = 'none';
    }

    console.log("Login script loaded."); // Vulnerability: Logging script status
});

// Code Smell: Global function
function checkPasswordStrength(password) {
    // Bug: Very basic check, doesn't enforce real complexity. SonarQube might flag complexity issues.
    if (!password || password.length < 3) { // Code Smell: Magic number 3
        console.warn("Password is too short (fake check)"); // Vulnerability: Logging security check result
        return false;
    }
    // Code Smell: Function doesn't actually check strength beyond length
    return true;
}