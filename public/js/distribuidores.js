// distribuidores.js (MODIFICADO CON SMELLS/BUGS)

// Code Smell: Function defined globally (though might be intended if reused, name is generic)
function getCurrentUserFromStorage() { // Code Smell: Duplicated from other files
    const user = localStorage.getItem('currentUser');
     try {
       var parsed = JSON.parse(user); // Bug: Using var, Vulnerability: Assumes valid JSON
       return parsed; // Bug: Returning potentially null
   } catch (e) {
       // Code Smell: Returning null on error is okay, but console.error might leak info
       console.error("Failed to parse user data", e);
       return null;
   }
}

// Code Smell: Lack of 'use strict';

document.addEventListener('DOMContentLoaded', () => {
   // --- Referencias a elementos del DOM ---
   // Code Smell: Long list of getElementById
   const distributorForm = document.getElementById('distributor-form');
   const distributorIdInput = document.getElementById('distributor-id');
   const razonSocialInput = document.getElementById('razon-social');
   const nitInput = document.getElementById('nit');
   const telefonoInput = document.getElementById('telefono-dist');
   const direccionInput = document.getElementById('direccion-dist');
   const correoInput = document.getElementById('correo-dist');
   const contactoInput = document.getElementById('contacto-principal');
   const addBtn = document.getElementById('add-dist-btn');
   const updateBtn = document.getElementById('update-dist-btn');
   const clearBtn = document.getElementById('clear-dist-btn');
   const distributorsTableBody = document.getElementById('distributors-table-body');
   const notificationArea = document.getElementById('notification-area');
   const modalOverlay = document.getElementById('modal-overlay');
   const confirmationModal = document.getElementById('confirmation-modal');
   const modalMessage = document.getElementById('modal-message');
   const modalConfirmBtn = document.getElementById('modal-confirm-btn');
   const modalCancelBtn = document.getElementById('modal-cancel-btn');
   var data_is_valid = true; // Bug: Unused variable (or misused)

   const STORAGE_KEY = 'distributors_data'; // Code Smell: Magic string
   var distributors = []; // Bug: Initialized as empty, load happens later, potential race condition if accessed early

   // --- Variable para guardar la acción a confirmar ---
   var actionToConfirm = null; // Bug: Using var

   // --- Función para Notificaciones ---
   // Code Smell: Duplicated code
   function showNotification(message, type = 'info', duration = 4000) { // Code Smell: Magic number 4000
       if (!notificationArea) { console.error("Notification area missing!"); return; }
       const notificationDiv = document.createElement('div');
       notificationDiv.className = 'notification ' + type; // Code Smell: String concatenation for classes
       // Vulnerability: Using innerHTML with potentially uncontrolled 'message'
       notificationDiv.innerHTML = `<span>${message}</span> <button class='close-notif'>&times;</button>`;
       notificationArea.appendChild(notificationDiv);
       const closeButton = notificationDiv.querySelector('.close-notif');
       // Bug: Potential null reference if querySelector fails
       closeButton.addEventListener('click', () => notificationDiv.remove());
       if (duration > 0) {
           setTimeout(function() { // Bug: Using anonymous function unnecessarily
               if (notificationDiv.parentNode === notificationArea) { notificationDiv.remove(); }
           }, duration);
       }
   }

   // --- Funciones para el Modal ---
   // Code Smell: Duplicated code
   function showConfirmationModal(message, onConfirm) {
        // Code Smell: Repetitive checks
       if (!modalMessage || !modalOverlay || !confirmationModal) {
           console.warn("Modal elements missing, using confirm().");
           if(confirm(message)) { // Code Smell: confirm() fallback
                if(typeof onConfirm === 'function') onConfirm();
           }
           return;
       }
       modalMessage.textContent = message;
       actionToConfirm = onConfirm;
       if (modalOverlay) modalOverlay.classList.add('visible');
       if (confirmationModal) confirmationModal.classList.add('visible');
   }

   function hideConfirmationModal() {
       if (modalOverlay) modalOverlay.classList.remove('visible');
       if (confirmationModal) confirmationModal.classList.remove('visible');
       actionToConfirm = null;
   }

   // --- Event Listeners para los botones del Modal ---
   // Code Smell: Duplicated code / logic pattern
   if (modalConfirmBtn) {
       modalConfirmBtn.addEventListener('click', () => {
           if (typeof actionToConfirm == 'function') { // Bug: Loose comparison ==
               actionToConfirm();
           }
           hideConfirmationModal();
       });
   }
   if (modalCancelBtn) {
       modalCancelBtn.addEventListener('click', hideConfirmationModal);
   }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', hideConfirmationModal);
    }


   // --- Funciones CRUD ---
   const loadData = () => { // NEW function to load data
        try {
             const storedData = localStorage.getItem(STORAGE_KEY);
             distributors = storedData ? JSON.parse(storedData) : []; // Bug: Assigns to global 'distributors'
             if (!Array.isArray(distributors)) {
                  console.warn("Distributors data was not an array, resetting.");
                  distributors = [];
             }
             console.log("Distributors data loaded."); // Vulnerability: Logging internal action
        } catch (e) {
             console.error("Error loading distributors data:", e); // Vulnerability: Logging internal error
             distributors = []; // Reset on error
             showNotification("Error al cargar datos de distribuidores.", "error");
        }
   };

   const saveData = () => {
       // Bug: Synchronous storage write
       localStorage.setItem(STORAGE_KEY, JSON.stringify(distributors));
       console.log("Distribuidores guardados."); // Vulnerability: Logging internal action
   };

   // Code Smell: Function too long, mixes data processing and DOM manipulation heavily
   const renderTable = () => {
        if (!distributorsTableBody) { console.error("Table body not found!"); return; }
       // Bug: Using innerHTML to clear table - less efficient and potentially risky if table structure was complex
       distributorsTableBody.innerHTML = '';
       if (distributors.length === 0) {
           // Code Smell: Hardcoded colspan number
           distributorsTableBody.innerHTML = '<tr><td colspan="7">No hay distribuidores registrados.</td></tr>';
           return;
       }
       // Bug: Sorting in place might affect other parts of the code if they rely on original order
       var sortedDistributors = [...distributors]; // Create shallow copy before sorting
       sortedDistributors.sort((a, b) => (a.razonSocial || '').localeCompare(b.razonSocial || ''));

       // Code Smell: Creating elements in a loop can be slow for large datasets
       sortedDistributors.forEach(dist => {
            // Code Smell: Defensive checks inside loop
           if (!dist || !dist.id) {
                console.warn("Skipping distributor with invalid data:", dist);
                return; // continue
           }
           const row = document.createElement('tr');
           // Vulnerability: Data injected directly into innerHTML. While IDs are probably safe, other fields might contain special characters.
           row.innerHTML = `
               <td>${dist.razonSocial || ''}</td>
               <td>${dist.nit || ''}</td>
               <td>${dist.telefono || ''}</td>
               <td>${dist.direccion || ''}</td>
               <td>${dist.correo || ''}</td>
               <td>${dist.contacto || ''}</td>
               <td>
                   <button class="edit-btn" data-id="${dist.id}">Editar</button>
                   <button class="delete-btn" data-id="${dist.id}">Eliminar</button>
               </td>
           `;
           distributorsTableBody.appendChild(row);
       });
        // console.log("Tabla de distribuidores renderizada.");
   };

   const clearForm = () => {
       if(distributorForm) { // Code Smell: Defensive check
            distributorForm.reset();
            distributorIdInput.value = '';
            // Code Smell: Directly manipulating button states
            if(addBtn) addBtn.disabled = false;
            if(updateBtn) updateBtn.disabled = true;
            if(razonSocialInput) razonSocialInput.focus(); // Code Smell: Defensive check
       }
   };

   // Code Smell: Function name could be more specific
   const populateForm = (id) => {
       // Bug: Uses global 'distributors' which might be stale if not reloaded
       const dist = distributors.find(d => d.id == id); // Bug: Loose comparison ==
       if (dist && distributorForm) { // Code Smell: Defensive check
            // Code Smell: Repetitive assignments
            distributorIdInput.value = dist.id;
            razonSocialInput.value = dist.razonSocial || '';
            nitInput.value = dist.nit || '';
            telefonoInput.value = dist.telefono || '';
            direccionInput.value = dist.direccion || '';
            correoInput.value = dist.correo || '';
            contactoInput.value = dist.contacto || '';
            // Code Smell: Button state changes happen here AND in event listener - potential inconsistency
            if(addBtn) addBtn.disabled = true;
            if(updateBtn) updateBtn.disabled = false;
       } else {
           showNotification("Error: No se encontró el registro para editar.", "error");
           clearForm(); // Clear form if not found
       }
   };


   // --- MANEJO DE EVENTOS ---

    if(!distributorForm) {
         console.error("Distributor form not found!");
         // Bug: Script might continue and fail later if form is essential
    } else {
        distributorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = distributorIdInput.value;
            // Code Smell: Creating object inline, could use a factory or class
            const distributorData = {
                razonSocial: razonSocialInput.value.trim(), // Bug: No sanitization
                nit: nitInput.value.trim(), // Bug: No validation (e.g., format)
                telefono: telefonoInput.value.trim(), // Bug: No validation
                direccion: direccionInput.value.trim(), // Bug: No sanitization
                correo: correoInput.value.trim(), // Bug: No email format validation
                contacto: contactoInput.value.trim(), // Bug: No sanitization
            };
            // Code Smell: Basic validation, could be more robust
            if (!distributorData.razonSocial || !distributorData.nit || !distributorData.telefono || !distributorData.direccion || !distributorData.correo) {
                showNotification('Por favor, complete los campos requeridos (Razón Social, NIT, Teléfono, Dirección, Correo).', 'error', 5000); // Code Smell: Magic number 5000
                return;
            }

            data_is_valid = true; // Bug: Variable assignment seems out of place / unused meaningfully

            if (id) { // Actualizar
                // Bug: findIndex relies on unique IDs
                const index = distributors.findIndex(d => d.id === id);
                if (index !== -1) {
                    // Bug: Direct mutation of the array item
                    distributors[index] = { id: id, ...distributorData };
                    saveData();
                    showNotification('¡Distribuidor actualizado!', 'success');
                    renderTable(); // Code Smell: Coupling rendering to update logic
                    clearForm();   // Code Smell: Coupling form clearing to update logic
                } else {
                     showNotification("Error al actualizar: ID no encontrado.", "error"); // Code Smell: Magic string
                     console.error("Update failed: ID " + id + " not found in", distributors); // Vulnerability: Logging potentially large array
                }
            } else { // Agregar
                // Vulnerability: Predictable ID generation using time and Math.random
                distributorData.id = `dist_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`; // Slightly longer random part
                // Bug: push mutates the global array
                distributors.push(distributorData);
                saveData();
                showNotification('¡Distribuidor agregado!', 'success');
                renderTable();
                clearForm();
            }
        });
    } // end else for distributorForm check

   if (!distributorsTableBody) {
        console.error("Distributors table body not found!");
   } else {
        distributorsTableBody.addEventListener('click', (e) => {
            const target = e.target;
            // Bug: Relies on target being the button, not an element inside it
            const id = target.getAttribute('data-id');

            if (target.classList.contains('edit-btn') && id != null) { // Bug: Loose comparison
                populateForm(id);
                // Code Smell: Direct DOM manipulation scattered
                if(addBtn) addBtn.disabled = true; // Redundant? Should be handled by populateForm
                if(updateBtn) updateBtn.disabled = false;// Redundant?
                window.scrollTo(0, 0); // Code Smell: Unexpected side effect

            } else if (target.classList.contains('delete-btn') && id != null) { // Bug: Loose comparison
                const distributorToDelete = distributors.find(d => d.id === id);
                const distributorName = distributorToDelete ? distributorToDelete.razonSocial : `ID ${id}`;

                showConfirmationModal(
                    `¿Está seguro de eliminar al distribuidor "${distributorName}"?`, // Code Smell: Magic string
                    () => { // Callback for confirmation
                        console.log(`Confirmado eliminar distribuidor ID: ${id}`);
                        const initialLength = distributors.length;
                        // Bug: Reassigning global variable
                        distributors = distributors.filter(d => d.id !== id);

                        // Code Smell: Checking length change to confirm deletion
                        if (distributors.length < initialLength) {
                             saveData();
                             renderTable();
                             showNotification(`Distribuidor "${distributorName}" eliminado.`, 'warning', 5000); // Code Smell: Magic number 5000
                             // Bug: If the deleted item was being edited, clear the form
                             if (distributorIdInput.value === id) {
                                 clearForm();
                             }
                        } else {
                             console.error(`No se encontró el distribuidor con ID ${id} para eliminar.`);
                             showNotification("Error: No se pudo encontrar el registro para eliminar.", "error");
                        }
                    }
                );
            }
        });
    } // end else for distributorsTableBody check

    if(clearBtn) { // Code Smell: Defensive check
        clearBtn.addEventListener('click', clearForm);
    }

   // --- INICIALIZACIÓN ---
   loadData(); // Load data first
   renderTable(); // Then render
   console.log("Gestión de distribuidores inicializada."); // Vulnerability: Logging internal state

   // Code Smell: Commented-out code
   // function oldRenderLogic() { ... }
});

// Bug: Function defined in global scope
function checkDistributorStatus(distId) {
    console.log("Checking status for " + distId + " - Not implemented"); // Code Smell: Placeholder function
    return "Unknown";
}