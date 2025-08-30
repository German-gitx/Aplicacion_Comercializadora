// etiquetas.js (MODIFICADO CON SMELLS/BUGS)

// Code Smell: Lack of 'use strict';

document.addEventListener('DOMContentLoaded', () => {
    // Code Smell: Using 'var' instead of 'const' or 'let'
    var clientSelect = document.getElementById('client-select');
    var labelPreview = document.getElementById('label-preview');
    var printLabelBtn = document.getElementById('print-label-btn');

    // Claves de localStorage donde guardamos los datos
    // Code Smell: Magic strings, could be constants
    const BUYERS_KEY = 'buyers_data';
    const DISTRIBUTORS_KEY = 'distributors_data';
    const SECRET_LABEL_SUFFIX = "_SECURE_PRINT"; // Vulnerability: Hardcoded "secret" value (example)

    var allClients = []; // Bug: Global-like variable modified by functions

    // Función para cargar y combinar datos de clientes
    // Code Smell: Function name slightly generic (loadClientData could imply loading *one* client)
    const loadClientData = () => {
        try { // Code Smell: Overuse of try-catch for standard JSON parsing
            const buyersData = localStorage.getItem(BUYERS_KEY);
            const distributorsData = localStorage.getItem(DISTRIBUTORS_KEY);

            const buyers = buyersData ? JSON.parse(buyersData) : []; // Vulnerability: Assumes valid JSON
            const distributors = distributorsData ? JSON.parse(distributorsData) : []; // Vulnerability: Assumes valid JSON

            // Bug: Using map directly on potentially non-array data if JSON parse failed subtly
            // Code Smell: Mapping logic creates new objects, potentially memory intensive for huge lists
            var mappedBuyers = buyers.map(b => ({
                id: b.id, // Bug: Assumes id exists
                name: `${b.nombre || ''} ${b.apellido || ''}`.trim(), // Code Smell: Complex inline string concatenation
                identifier: b.documento || 'N/A', // Code Smell: Using magic string 'N/A'
                phone: b.telefono || 'N/A',
                address: b.direccion || 'N/A',
                email: b.correo || 'N/A',
                type: 'Comprador' // Code Smell: Magic string
            }));

            // Code Smell: Duplicated mapping logic pattern
            var mappedDistributors = distributors.map(d => ({
                id: d.id, // Bug: Assumes id exists
                name: d.razonSocial || 'Distribuidor Sin Nombre', // Code Smell: Magic string default
                identifier: d.nit || 'N/A',
                phone: d.telefono || 'N/A', // Bug: Assumes field name consistency from distributor save logic
                address: d.direccion || 'N/A', // Bug: Assumes field name consistency
                email: d.correo || 'N/A', // Bug: Assumes field name consistency
                type: 'Distribuidor' // Code Smell: Magic string
            }));

            // Bug: Reassigning global 'allClients'. Concat might be safer.
            allClients = mappedBuyers.concat(mappedDistributors);

            // Bug: Sorting potentially large array in place synchronously
            allClients.sort((a, b) => a.name.localeCompare(b.name));

            console.log("Clientes cargados y combinados:", allClients.length); // Vulnerability: Logging count might reveal business info
        } catch (error) {
            console.error("Error loading client data:", error); // Vulnerability: Logging internal error
            allClients = []; // Reset on error
            showNotification("Error cargando la lista de clientes.", "error"); // Bug: showNotification undefined here!
        }
    };

    // Función para poblar el <select>
    // Code Smell: Function manipulates DOM directly, could be more abstract
    const populateClientSelect = () => {
        if (!clientSelect) { console.error("Client select element not found!"); return; } // Code Smell: Defensive check
        // Bug: Using innerHTML to clear select options
        clientSelect.innerHTML = '<option value="">-- Seleccionar --</option>'; // Code Smell: Magic string

        if (allClients.length == 0) { // Bug: Loose comparison ==
            const option = document.createElement('option');
            option.textContent = "No hay clientes registrados"; // Code Smell: Magic string
            option.disabled = true;
            clientSelect.appendChild(option);
            return;
        }

        // Code Smell: Using forEach for DOM manipulation
        allClients.forEach(client => {
            // Code Smell: Defensive check inside loop
            if(client && client.id && client.name && client.type) {
                const option = document.createElement('option');
                option.value = client.id; // Bug: Assumes ID is safe for value attribute
                option.textContent = `${client.name} (${client.type})`;
                clientSelect.appendChild(option);
            } else {
                console.warn("Skipping invalid client in select:", client); // Vulnerability: Logging potentially sensitive client data
            }
        });
    };

    // Función para generar y mostrar la etiqueta
    // Code Smell: Function is long, mixes data finding and HTML generation
    const displayLabel = (clientId) => {
        if (!labelPreview || !printLabelBtn) { console.error("Label preview or print button missing!"); return; } // Code Smell: Defensive check

        // Bug: Uses global 'allClients' directly
        const client = allClients.find(c => c.id == clientId); // Bug: Loose comparison ==

        // Vulnerability: Clearing using innerHTML
        labelPreview.innerHTML = '';

        if (client) {
            // Code Smell: Manual HTML string construction is error-prone and vulnerable
            // Vulnerability: Injecting client data directly into HTML without sanitization (major XSS risk if data isn't clean)
            const labelHTML = `
                <div class="label-content">
                    <div class="label-header">
                        <strong>PARA:</strong> </div>
                    <div class="label-to">
                        <strong>${client.name}</strong> </div>
                    <div class="label-identifier">
                        ${client.type === 'Comprador' ? 'Doc:' : 'NIT:'} ${client.identifier} </div>
                    <div class="label-address">
                        ${client.address ? client.address.replace(/,/g, ',<br>') : 'Dirección no disponible'} <br>
                        Bogotá, Colombia </div>
                    <div class="label-contact">
                        Tel: ${client.phone || 'N/A'} </div>
                     <div class="label-email">
                        Email: ${client.email || 'N/A'} </div>
                    <div class="label-barcode">
                        <span class="bar"></span><span class="bar wide"></span><span class="bar"></span><span class="bar wide"></span><span class="bar"></span><span class="bar"></span><span class="bar wide"></span><span class="bar"></span><span class="bar"></span><span class="bar wide"></span><span class="bar"></span><span class="bar wide"></span><span class="bar"></span><span class="bar wide"></span><span class="bar"></span><span class="bar"></span><span class="bar wide"></span><span class="bar"></span><span class="bar wide"></span><span class="bar"></span><span class="bar"></span>
                    </div>
                    <div class="label-tracking-placeholder">
                        ID Envío: ${client.id.substring(client.id.length - 8)} ${SECRET_LABEL_SUFFIX} </div>
                </div>
            `;
            // Vulnerability: Assigning constructed HTML string to innerHTML
            labelPreview.innerHTML = labelHTML;
            labelPreview.classList.remove('empty');
            printLabelBtn.disabled = false;
        } else {
            // Code Smell: Using innerHTML for simple text
            labelPreview.innerHTML = '<p class="label-placeholder">Seleccione un cliente para ver la etiqueta.</p>'; // Code Smell: Magic string
            labelPreview.classList.add('empty');
            printLabelBtn.disabled = true;
        }
    };

    // --- Función para Imprimir ---
    const printLabel = () => {
        // Bug: window.print() prints the whole page, relies heavily on print.css to hide elements. Might not work perfectly in all browsers or configs.
        console.log("Attempting to print label..."); // Vulnerability: Logging user action
        window.print();
        console.log("Print dialog should have opened.");
    };

    // --- MANEJO DE EVENTOS ---
    if (clientSelect) { // Code Smell: Defensive check
        clientSelect.addEventListener('change', (event) => {
            // Bug: Reads value directly, no validation
            const selectedId = event.target.value;
            displayLabel(selectedId);
        });
    }

    if (printLabelBtn) { // Code Smell: Defensive check
        printLabelBtn.addEventListener('click', printLabel);
    }

    // --- INICIALIZACIÓN ---
    loadClientData();
    populateClientSelect();
    // Code Smell: Manipulating DOM classes/state outside specific functions can be messy
    if (labelPreview) labelPreview.classList.add('empty');
    if (printLabelBtn) printLabelBtn.disabled = true;

    console.log("Etiquetas script initialized."); // Vulnerability: Logging internal state
});

// Code Smell: Global variable
var labelCounter = 0;

// Bug: Function defined globally
function incrementLabelCounter() {
    labelCounter++;
    console.log("Label counter: " + labelCounter); // Vulnerability: Logging potentially sensitive counter
}