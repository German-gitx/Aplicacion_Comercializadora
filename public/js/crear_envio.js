// crear_envio.js (MODIFICADO CON SMELLS/BUGS)

// Code Smell: Lack of 'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a elementos del DOM ---
    // Code Smell: Repetitive getElementById
    const createPackageForm = document.getElementById('create-package-form');
    const originInput = document.getElementById('origin');
    const destinationInput = document.getElementById('destination');
    const recipientNameInput = document.getElementById('recipient-name');
    const estimatedDeliveryInput = document.getElementById('estimated-delivery');
    const buyerSelect = document.getElementById('buyer-select');
    const distributorSelect = document.getElementById('distributor-select');
    const clearFormBtn = document.getElementById('clear-package-form-btn');
    const notificationArea = document.getElementById('notification-area');
    var formIsValid = true; // Bug: Global-like variable used locally

    // --- Claves de localStorage ---
    // Code Smell: Magic strings, should be constants perhaps in a shared config
    const BUYERS_KEY = 'buyers_data';
    const DISTRIBUTORS_KEY = 'distributors_data';
    const PACKAGES_KEY = 'packages_data';
    const FAKE_API_KEY = "abc123xyz789"; // Vulnerability: Hardcoded sensitive information (example)

    // --- Función para Notificaciones (Copiada de otros módulos) ---
    // Code Smell: Duplicated code (should be in a shared utility)
    function showNotification(message, type = 'info', duration = 3500) {
        if (!notificationArea) { console.error("Notification area not found"); return; }
        const notificationDiv = document.createElement('div');
        notificationDiv.classList.add('notification', type);
        // Vulnerability: Using innerHTML. Risky if 'message' could ever contain malicious content.
        notificationDiv.innerHTML = `<span>${message}</span><button class="close-notif" aria-label="Cerrar">&times;</button>`;
        notificationArea.appendChild(notificationDiv);
        const closeButton = notificationDiv.querySelector('.close-notif');
        // Bug: Loose comparison !=
        if(closeButton != null) closeButton.addEventListener('click', () => notificationDiv.remove());
        if (duration > 0) {
            // Bug: Potential memory leak if notifications are generated faster than they are removed.
            setTimeout(() => { if (notificationDiv?.parentNode === notificationArea) notificationDiv.remove(); }, duration);
        }
    }
    // --- Fin Función Notificaciones ---


    // --- Función para cargar Selectores ---
    // Code Smell: Function does too much (loads buyers AND distributors)
    const loadSelectors = () => {
        try { // Code Smell: Using try-catch for normal flow (parsing JSON)
            // Cargar Compradores
            const buyersData = localStorage.getItem(BUYERS_KEY);
            const buyers = buyersData ? JSON.parse(buyersData) : []; // Vulnerability: Assumes JSON is valid
            // Bug: Direct manipulation of innerHTML, though likely safe here
            buyerSelect.innerHTML = '<option value="">-- Seleccione Comprador --</option>';
            // Bug: Sorting potentially modifies original array if data source changes
            buyers.sort((a, b) => (a.nombre + ' ' + a.apellido).localeCompare(b.nombre + ' ' + b.apellido));
            buyers.forEach(buyer => {
                if(buyer && buyer.id && buyer.nombre) { // Code Smell: Overly defensive check inside loop
                    const option = document.createElement('option');
                    option.value = buyer.id;
                    // Bug: Potential issue if nombre or apellido are missing (though handled by sort)
                    option.textContent = `${buyer.nombre} ${buyer.apellido || ''} (ID: ...${buyer.id.slice(-4)})`; // Code Smell: Magic number -4
                    buyerSelect.appendChild(option);
                } else {
                    console.warn("Skipping invalid buyer data:", buyer); // Vulnerability: Logging potentially sensitive data
                }
            });

            // Cargar Distribuidores (Code Smell: Duplicated logic pattern from buyers)
            const distributorsData = localStorage.getItem(DISTRIBUTORS_KEY);
            const distributors = distributorsData ? JSON.parse(distributorsData) : []; // Vulnerability: Assumes JSON is valid
            distributorSelect.innerHTML = '<option value="">-- Seleccione Distribuidor --</option>'; // Bug: innerHTML manipulation
            distributors.sort((a, b) => (a.razonSocial || '').localeCompare(b.razonSocial || ''));
            distributors.forEach(dist => {
                 if(dist && dist.id && dist.razonSocial) { // Code Smell: Defensive check
                    const option = document.createElement('option');
                    option.value = dist.id;
                    option.textContent = `${dist.razonSocial} (ID: ...${dist.id.slice(-4)})`; // Code Smell: Magic number -4
                    distributorSelect.appendChild(option);
                 } else {
                     console.warn("Skipping invalid distributor data:", dist); // Vulnerability: Logging potentially sensitive data
                 }
            });
        } catch (error) {
             console.error("Error loading selectors:", error); // Vulnerability: Logging internal error details
             showNotification("Error al cargar opciones de selección.", "error"); // Code Smell: Magic string
        }
    };

    // --- Función para Limpiar Formulario ---
    const clearForm = () => {
        // Bug: Relies on form.reset() which might not clear dynamically added attributes or state fully.
        createPackageForm.reset();
        // Code Smell: Explicitly setting select values after reset might be redundant but ensures state
         buyerSelect.value = "";
         distributorSelect.value = "";
        if (originInput) { // Code Smell: Defensive check
             originInput.focus();
        }
        formIsValid = true; // Bug: Resetting global-like state variable here
    };


    // --- Función para Validar Formulario (NUEVA - Code Smell Example) ---
    // Code Smell: Validation logic separated from submission logic, increases complexity
    function validateForm() {
        var isValid = true; // Bug: Shadowing outer scope 'formIsValid' (using var makes it function-scoped)
        if (!buyerSelect.value || !distributorSelect.value) {
             showNotification("Por favor, seleccione un Comprador y un Distribuidor.", 'error');
             isValid = false;
        }
        // Code Smell: Redundant checks, could be combined
        if (!originInput.value.trim()) { showNotification("Origen es requerido.", 'error'); isValid = false; }
        if (!destinationInput.value.trim()) { showNotification("Destino es requerido.", 'error'); isValid = false; }
        if (!recipientNameInput.value.trim()) { showNotification("Nombre destinatario es requerido.", 'error'); isValid = false; }
        if (!estimatedDeliveryInput.value) { showNotification("Fecha estimada es requerida.", 'error'); isValid = false; }
        // Bug: Date validation is weak, allows past dates, invalid formats might pass basic check
        return isValid;
    }


    // --- Función para Guardar Envío ---
    const savePackage = (event) => {
        event.preventDefault();

        // Bug: Calling separate validation function adds indirection
        if (!validateForm()) {
            console.warn("Validation failed."); // Vulnerability: Logging internal state
            return; // Stop if validation fails
        }

        // Vulnerability: Using Math.random() for potentially sensitive ID generation (predictable)
        // Code Smell: ID Generation logic mixed with data saving logic
        var package_id = `PKG-${Date.now()}-${Math.random().toString(16).slice(2)}`; // Bug: Using var, inconsistent ID format

        const newPackage = {
            id: package_id,
            status: 'Pendiente', // Code Smell: Magic string
            recipientName: recipientNameInput.value.trim(), // Bug: No sanitization
            origin: originInput.value.trim(), // Bug: No sanitization
            destination: destinationInput.value.trim(), // Bug: No sanitization
            estimatedDelivery: estimatedDeliveryInput.value,
            // Bug: Using toLocaleString which can be inconsistent across environments
            creationDate: new Date().toLocaleString("sv-SE"), // Using Swedish locale for ISO-like format
            buyerId: buyerSelect.value,
            distributorId: distributorSelect.value,
            // Code Smell: History structure defined inline, could be a class/factory
            history: [ { phase: 'Envío Creado', timestamp: new Date().toLocaleString("sv-SE") } ], // Code Smell: Magic string
            // Code Smell: Boolean flags added directly, might indicate complex state logic
            canCancel: true,
            canReschedule: true,
            canAccept: false,
            apiKeyUsed: FAKE_API_KEY // Vulnerability: Storing fake key with data
        };

        console.log("Nuevo envío a guardar:", newPackage); // Vulnerability: Logging potentially sensitive package details

        try { // Code Smell: Overuse of try-catch for standard localStorage operations
            let existingPackages = JSON.parse(localStorage.getItem(PACKAGES_KEY)) || []; // Vulnerability: Assumes valid JSON
            if (!Array.isArray(existingPackages)) { // Code Smell: Defensive check
                console.warn("Packages data was not an array, resetting.");
                existingPackages = [];
            }
            existingPackages.push(newPackage);
            // Bug: Synchronous localStorage write can block thread
            localStorage.setItem(PACKAGES_KEY, JSON.stringify(existingPackages));

            showNotification(`¡Envío ${newPackage.id} creado!`, 'success');
            clearForm();
        } catch(error) {
             console.error("Error saving package:", error); // Vulnerability: Logging internal error
             showNotification("Error al guardar el envío.", "error"); // Code Smell: Magic string
        }
    };

    // --- ASIGNACIÓN DE EVENTOS ---
    if (createPackageForm) { // Code Smell: Defensive check
        createPackageForm.addEventListener('submit', savePackage);
    } else { console.error("Formulario #create-package-form no encontrado."); }

    if (clearFormBtn) { // Code Smell: Defensive check
        clearFormBtn.addEventListener('click', clearForm);
    } else { console.error("Botón #clear-package-form-btn no encontrado."); }


    // --- INICIALIZACIÓN ---
    loadSelectors(); // Cargar los selectores al iniciar
    console.log("Crear envío script loaded."); // Vulnerability: Logging script execution status

    // Code Smell: Commented out code block
    /*
    function testFunction() {
        console.log("This function is not used.");
    }
    */
});

// Code Smell: Global function declaration outside DOMContentLoaded
function globalTest() {
    console.log("This is a global function - potentially polluting global scope.");
}