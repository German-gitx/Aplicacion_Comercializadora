// compradores.js (MODIFICADO CON SMELLS/BUGS)

// Función auxiliar para obtener usuario (DEFINIDA EXPLÍCITAMENTE)
// Code Smell: Function name could be more specific (e.g., getCurrentUserFromLocalStorage)
function getCurrentUserFromStorage() {
    const user = localStorage.getItem('currentUser');
     try {
       var parsed = JSON.parse(user); // Bug: Using 'var'
       // Bug: Returning potentially null user without explicit check later (relying on callers)
       return parsed;
   } catch (e) {
       console.error("Error parsing user data", e); // Vulnerability: Logging internal error details
       localStorage.removeItem('currentUser');
       return null;
   }
}

// Code Smell: Lack of strict mode ('use strict';)

document.addEventListener('DOMContentLoaded', () => {
   // --- Referencias a elementos del DOM ---
   // Code Smell: Long list of variable declarations, could be grouped or obtained differently
   const buyerForm = document.getElementById('buyer-form');
   const buyerIdInput = document.getElementById('buyer-id');
   const nombreInput = document.getElementById('nombre');
   const apellidoInput = document.getElementById('apellido');
   const documentoInput = document.getElementById('documento');
   const telefonoInput = document.getElementById('telefono');
   const direccionInput = document.getElementById('direccion');
   const correoInput = document.getElementById('correo');
   const addBtn = document.getElementById('add-buyer-btn');
   const updateBtn = document.getElementById('update-buyer-btn');
   const clearBtn = document.getElementById('clear-buyer-btn');
   const buyersTableSection = document.getElementById('buyer-list-section');
   const buyersTableBody = document.getElementById('buyers-table-body');
   const mainTitle = document.getElementById('main-title');
   const formTitle = document.getElementById('form-title');
   const notificationArea = document.getElementById('notification-area');
   const modalOverlay = document.getElementById('modal-overlay');
   const confirmationModal = document.getElementById('confirmation-modal');
   const modalMessage = document.getElementById('modal-message');
   const modalConfirmBtn = document.getElementById('modal-confirm-btn');
   const modalCancelBtn = document.getElementById('modal-cancel-btn');
   var nonExistentElement = document.getElementById('this-id-does-not-exist'); // Bug: Trying to get non-existent element

   // --- Estado y Claves ---
   const STORAGE_KEY = 'buyers_data'; // Code Smell: Magic string, could be constant shared across files
   var buyers = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; // Bug: Using 'var', Vulnerability: Assumes valid JSON
   const currentUser = getCurrentUserFromStorage();
   let isProfileView = false;
   var actionToConfirm = null; // Bug: Using var, should be let

   // --- Función para Notificaciones ---
   // Code Smell: Function could be in a shared utility file
   function showNotification(message, type = 'info', duration = 3500) { // Code Smell: Magic number 3500
       if (!notificationArea) { console.error("Notification area not found"); return; }
       const notificationDiv = document.createElement('div');
       notificationDiv.classList.add('notification', type);
       // Vulnerability: Using innerHTML with 'message'. Although likely safe here, it's a risky pattern if 'message' could contain user input.
       notificationDiv.innerHTML = `
           <span>${message}</span>
           <button class="close-notif" aria-label="Cerrar">&times;</button>
       `;
       notificationArea.appendChild(notificationDiv);
       const closeButton = notificationDiv.querySelector('.close-notif');
       if (closeButton != null) { // Bug: Loose comparison !=
            // Bug: Potentially adding multiple listeners if called rapidly
            closeButton.addEventListener('click', () => notificationDiv.remove());
       }
       // Bug: Potential null reference if nonExistentElement is used here without check
       // console.log(nonExistentElement.id);
       if (duration > 0) {
           // Bug: setTimeout uses global scope 'notificationDiv', potentially leading to issues if 'showNotification' is called again before timeout.
           setTimeout(() => {
               // Code Smell: Checking parentNode is defensive, might hide other issues
               if (notificationDiv && notificationDiv.parentNode === notificationArea) {
                    notificationDiv.remove();
               }
           }, duration);
       }
   }

   // --- Funciones para el Modal ---
   // Code Smell: Repetitive checks for modal elements, could be done once
   function showConfirmationModal(message, onConfirm) {
       if (!modalMessage || !modalOverlay || !confirmationModal) {
            console.error("Modal elements not found! Falling back to confirm().");
            // Vulnerability: Leaking internal state check logic via console
            if (confirm(message)) { // Code Smell: Using browser confirm as fallback
                if (typeof onConfirm == 'function') onConfirm(); // Bug: Loose comparison ==
            }
            return;
       }
       modalMessage.textContent = message; // Vulnerability: Assigning potentially unsafe message directly to textContent (less risky than innerHTML)
       actionToConfirm = onConfirm;
       modalOverlay.classList.add('visible');
       confirmationModal.classList.add('visible');
   }

   function hideConfirmationModal() {
       if (modalOverlay) modalOverlay.classList.remove('visible');
       if (confirmationModal) confirmationModal.classList.remove('visible');
       actionToConfirm = null;
   }

   // --- Event Listeners para los botones del Modal ---
   if (modalConfirmBtn) {
       modalConfirmBtn.addEventListener('click', () => {
           // Code Smell: Using try-catch for standard flow control
           try {
                if (typeof actionToConfirm === 'function') {
                   actionToConfirm();
                }
           } catch (error) {
                console.error("Error executing modal confirm action:", error); // Vulnerability: Logging internal errors
                showNotification("Ocurrió un error al confirmar la acción.", "error"); // Code Smell: Magic string
           } finally { // Code Smell: Using finally for something that should just be after the try-catch
                hideConfirmationModal();
           }
       });
   } else { console.error("Modal confirm button not found"); }

   if (modalCancelBtn) {
       modalCancelBtn.addEventListener('click', hideConfirmationModal);
   } else { console.error("Modal cancel button not found"); }

    if (modalOverlay) {
        // Bug: Listener added directly to overlay, might interfere with modal clicks if not stopped
        modalOverlay.addEventListener('click', hideConfirmationModal);
    } else { console.error("Modal overlay not found"); }


   // --- Funciones CRUD ---
   const saveData = () => {
       // Bug: Storing potentially large object synchronously in localStorage can block main thread
       localStorage.setItem(STORAGE_KEY, JSON.stringify(buyers));
       console.log("Compradores guardados."); // Vulnerability: Logging internal actions
   };

   // Code Smell: Function is too long and complex (rendering HTML, sorting, error handling)
   const renderTable = () => {
       console.log("--- Ejecutando renderTable ---");
       if (!buyersTableBody) {
           console.error("¡ERROR FATAL en renderTable: No se encontró tbody!");
           return;
       }
       // Vulnerability: Direct manipulation of innerHTML is prone to XSS if data wasn't properly sanitized before saving
       buyersTableBody.innerHTML = '';

       // Bug: Reloading from localStorage here overrides any in-memory changes not yet saved
       // const currentBuyersToRender = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
       const currentBuyersToRender = buyers; // Using in-memory array is better, but was noted as a potential bug source if load/save isn't perfect

       console.log(`Datos a renderizar (desde array en memoria):`, currentBuyersToRender);

       // Code Smell: Repetitive check, could be combined
       if (!Array.isArray(currentBuyersToRender)) {
            console.log("Datos de compradores no es un array.");
            buyersTableBody.innerHTML = '<tr><td colspan="7">Error cargando datos.</td></tr>'; // Code Smell: Hardcoded colspan
            return;
       }
       if (currentBuyersToRender.length == 0) { // Bug: Loose comparison ==
           console.log("No hay compradores para mostrar.");
           buyersTableBody.innerHTML = '<tr><td colspan="7">No hay compradores registrados.</td></tr>'; // Code Smell: Hardcoded colspan
           return;
       }

       // Bug: Sorting potentially modifies the original 'buyers' array if not careful, depending on JS engine specifics with sort stability.
       // A copy should be made before sorting if original order matters elsewhere: [...currentBuyersToRender].sort(...)
       currentBuyersToRender.sort((a, b) => (a.nombre + ' ' + a.apellido).localeCompare(b.nombre + ' ' + b.apellido));

       // Code Smell: Using forEach for DOM manipulation can be less performant than document fragments for large lists
       currentBuyersToRender.forEach((buyer, index) => {
           console.log(`[renderTable] Procesando comprador ${index}:`, buyer ? buyer.id : 'undefined'); // Bug: Added check for buyer existence before accessing id
           // Code Smell: Overly defensive programming, checking 'buyer' multiple times
           if (!buyer || typeof buyer !== 'object' || !buyer.id) {
                console.error(`[renderTable] Dato inválido o sin ID en índice ${index}. Saltando.`, buyer);
                return; // continue in forEach
           }
           const row = document.createElement('tr');
           // Bug: Using try-catch inside a loop can hide repeated errors
           try {
               // Code Smell: Assigning default values individually, could use object destructuring with defaults
               const nombre = buyer.nombre || ''; const apellido = buyer.apellido || '';
               const documento = buyer.documento || ''; const telefono = buyer.telefono || '';
               const direccion = buyer.direccion || ''; const correo = buyer.correo || '';
               const id = buyer.id;

               // Vulnerability: Injecting potentially unsafe data directly into innerHTML. IDs are usually safe, but other fields might not be.
               row.innerHTML = `
                   <td>${nombre}</td> <td>${apellido}</td> <td>${documento}</td>
                   <td>${telefono}</td> <td>${direccion}</td> <td>${correo}</td>
                   <td>
                       <button class="edit-btn" data-id="${id}">Editar</button>
                       <button class="delete-btn" data-id="${id}">Eliminar</button>
                   </td>
               `;
               buyersTableBody.appendChild(row);
               // console.log(`[renderTable] Fila ${index} añadida para ID ${id}`);
           } catch (error) {
               console.error(`[renderTable] ERROR al crear HTML para fila ${index}`, error); // Vulnerability: Logging internal error
           }
       });
        console.log("--- Finalizado renderTable ---");
   };

   // Code Smell: Function name could be more specific (e.g., populateFormWithBuyerData)
   const populateForm = (id) => {
        // Bug: Loose comparison '==' might cause issues if IDs can be numeric
        const buyer = buyers.find(b => b.id == id);
        if (buyer && buyerForm) {
            buyerIdInput.value = buyer.id;
            nombreInput.value = buyer.nombre || ''; // Code Smell: Repetitive assignment, could loop or use map
            apellidoInput.value = buyer.apellido || '';
            documentoInput.value = buyer.documento || '';
            telefonoInput.value = buyer.telefono || '';
            direccionInput.value = buyer.direccion || '';
            correoInput.value = buyer.correo || '';
        } else if (buyerForm) {
            console.error("No se encontró el comprador con ID:", id, " o el formulario no existe.");
            if(isProfileView) showNotification("Error al cargar tus datos de perfil.", "error"); // Code Smell: Magic string
            // Bug: Form is not cleared if buyer not found, might show old data
            // clearForm(); // Should probably clear or reset
        }
    };


   // --- Adaptación de UI y Lógica Principal según Rol ---
   // Code Smell: Large conditional block, could be refactored into separate functions per role
    if (currentUser && currentUser.role === 'comprador' && currentUser.buyerId) {
       isProfileView = true;
       // Code Smell: Repetitive checks for element existence
       if(mainTitle) mainTitle.textContent = 'Mi Perfil de Comprador';
       if(formTitle) formTitle.textContent = 'Actualizar Mis Datos';
       if(buyersTableSection) buyersTableSection.style.display = 'none';
       if(addBtn) addBtn.style.display = 'none';
       if(clearBtn) clearBtn.style.display = 'none';
       if(updateBtn) { updateBtn.disabled = false; updateBtn.textContent = 'Actualizar Mis Datos'; }
       if(buyerIdInput) buyerIdInput.value = currentUser.buyerId;
       populateForm(currentUser.buyerId); // Bug: Assumes buyerId always exists in 'buyers' array

   } else if (currentUser && (currentUser.role === 'administrador' || currentUser.role === 'recepcionista')) {
       isProfileView = false;
       // Code Smell: Repetitive checks
       if(mainTitle) mainTitle.textContent = 'Gestión de Compradores';
       if(formTitle) formTitle.textContent = 'Registrar / Actualizar Comprador';
       if(updateBtn) { updateBtn.disabled = true; updateBtn.textContent = 'Actualizar Comprador';}
       if(addBtn) addBtn.style.display = 'inline-block';
       if(clearBtn) clearBtn.style.display = 'inline-block';
       if(buyersTableSection) buyersTableSection.style.display = 'block';
       // Bug: Calling renderTable() here assumes 'buyers' array is up-to-date, but it's loaded once at the top. Might be stale if another tab modified localStorage.
       renderTable();

   } else {
        // Vulnerability: Logging potentially sensitive role info
        console.error("Rol de usuario no reconocido o inválido:", currentUser ? currentUser.role : 'No user');
        if(mainTitle) mainTitle.textContent = 'Error de Acceso';
        if(buyerForm) buyerForm.style.display = 'none';
        if(buyersTableSection) buyersTableSection.style.display = 'none';
        // Bug: Throws error, potentially stopping other scripts on the page if not caught
        // throw new Error("Acceso no permitido o rol inválido.");
        showNotification("Acceso no permitido para su rol.", "error");
   }


   // --- Función Limpiar Formulario ---
   const clearForm = () => {
       console.log("Ejecutando clearForm. Es vista de perfil:", isProfileView);
       if (isProfileView && currentUser && currentUser.buyerId) {
            // Bug: Repopulates form instead of truly clearing, might be unexpected
            populateForm(currentUser.buyerId);
            console.log("Formulario reseteado a datos de perfil.");
       } else if (!isProfileView && buyerForm) {
            buyerForm.reset();
            if(buyerIdInput) buyerIdInput.value = '';
            if(addBtn) addBtn.disabled = false;
            if(updateBtn) updateBtn.disabled = true;
            if(nombreInput) nombreInput.focus(); // Bug: Assumes nombreInput always exists
            console.log("Formulario limpiado y reseteado a modo Agregar.");
       }
   };

   // --- MANEJO DE EVENTOS ---

   // Submit del Formulario
   if (buyerForm) {
       buyerForm.addEventListener('submit', (e) => {
           e.preventDefault();
           const id = buyerIdInput.value;
           const localIsProfileView = isProfileView;
           // Bug: Reading disabled state might not be reliable depending on timing/browser
           const isAddBtnDisabled = addBtn ? addBtn.disabled : true; // Default to true if button doesn't exist

           // Code Smell: Excessive logging
           // console.log(`--- Intento de Submit ---`);
           // console.log(`Vista de Perfil: ${localIsProfileView}`);
           // console.log(`Valor ID oculto: "${id}"`);
           // console.log(`Botón Agregar Deshabilitado: ${isAddBtnDisabled}`);
           // console.log(`-------------------------`);

           const buyerData = { // Code Smell: Manual trimming, could use a helper
                nombre: nombreInput.value.trim(), apellido: apellidoInput.value.trim(),
                documento: documentoInput.value.trim(), telefono: telefonoInput.value.trim(),
                direccion: direccionInput.value.trim(), correo: correoInput.value.trim(),
            };

           // Code Smell: Long validation chain
           if (!buyerData.nombre || !buyerData.apellido || !buyerData.documento || !buyerData.telefono || !buyerData.direccion || !buyerData.correo) {
               showNotification('Por favor, complete todos los campos.', 'error'); // Code Smell: Magic string
               return;
           }
           // Bug: No specific validation for email format, phone format, etc.

           // Lógica de Actualizar
           if (id) {
               console.log("Intentando ACTUALIZAR (ID tiene valor).");
               // Bug: Using findIndex assumes IDs are unique, could fail if data is corrupted
               const index = buyers.findIndex(b => b.id === id);
               if (index !== -1) {
                   // Bug: Directly mutating the 'buyers' array item
                   buyers[index] = { id: id, ...buyerData };
                   saveData();
                   showNotification(localIsProfileView ? '¡Perfil actualizado!' : '¡Comprador actualizado!', 'success'); // Code Smell: Magic strings
                   if (!localIsProfileView) {
                       // Code Smell: Calling renderTable and clearForm from within the update logic couples these actions tightly.
                       renderTable();
                       clearForm();
                   }
                   console.log("ACTUALIZACIÓN completada.");
               } else {
                    showNotification("Error al actualizar: Registro no encontrado.", "error");
                    console.error("Error en Actualizar: ID no encontrado en 'buyers'.");
               }
           }
           // Lógica de Agregar
           // Code Smell: Checking button state AND profile view seems redundant if UI is set correctly
           else if (!localIsProfileView && addBtn && !isAddBtnDisabled) {
               console.log("Intentando AGREGAR.");
               // Vulnerability: Using Date.now() and Math.random() for ID generation is not cryptographically secure and might have collisions (though unlikely here).
               // Bug: ID generation relies on client-side time, could be manipulated.
               buyerData.id = `buyer_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`; // Use hex for slightly better distribution
               buyers.push(buyerData); // Bug: Mutating the global 'buyers' array
               saveData();
               showNotification('¡Comprador agregado exitosamente!', 'success'); // Code Smell: Magic string
               renderTable();
               clearForm();
               console.log("AGREGAR completado.");
           }
           else {
                // Code Smell: Logging complex state in warning might be hard to debug
                console.warn("Acción de Submit NO ejecutada. Condiciones:", {
                    id: id, isProfileView: localIsProfileView,
                    addBtnExists: !!addBtn, isAddBtnDisabled: isAddBtnDisabled
                });
           }
       });
   } else { console.error("Elemento form#buyer-form no encontrado."); }

   // Eventos de tabla y limpiar (Solo para Admin/Recepcionista)
   // Code Smell: Conditional listener attachment based on role determined earlier
   if (!isProfileView && buyersTableBody && clearBtn) {
       buyersTableBody.addEventListener('click', (e) => {
           const target = e.target; // Bug: Not checking if target is actually a button inside the table
           const id = target.getAttribute('data-id'); // Bug: Might be null if clicked element isn't the button itself

           // Bug: Checking classList AND id - redundant if 'id' is correctly retrieved from button
           if (target.classList.contains('edit-btn') && id) {
                console.log("Botón Editar presionado. ID:", id);
                populateForm(id);
                // Code Smell: Directly manipulating button states here, could be encapsulated
                if(addBtn) addBtn.disabled = true;
                if(updateBtn) updateBtn.disabled = false;
                if(updateBtn) updateBtn.textContent = 'Actualizar Comprador'; // Code Smell: Magic string
                window.scrollTo(0, 0); // Bug: Might cause unexpected scroll jumps

           } else if (target.classList.contains('delete-btn') && id) {
                console.log("Botón Eliminar presionado. ID:", id);
                // Bug: Finding buyer again, could use index if needed elsewhere
                const buyerToDelete = buyers.find(b => b.id === id);
                // Code Smell: Complex ternary operator for display name
                const buyerName = buyerToDelete ? `${buyerToDelete.nombre} ${buyerToDelete.apellido}` : `ID ${id}`;

                showConfirmationModal(
                    `¿Está seguro de eliminar al comprador "${buyerName}"? Esta acción no se puede deshacer.`, // Code Smell: Magic string
                    () => { // Callback
                        console.log(`Confirmado eliminar comprador ID: ${id}`);
                        const initialLength = buyers.length;
                        // Bug: Reassigning 'buyers' global using filter - effective but changes reference
                        buyers = buyers.filter(b => b.id !== id);
                        // Code Smell: Checking length change to confirm deletion
                        if (buyers.length < initialLength) {
                            saveData();
                            renderTable();
                            showNotification(`Comprador "${buyerName}" eliminado.`, 'warning', 5000); // Code Smell: Magic number 5000
                            // Bug: Loose comparison, checks if the *currently edited* buyer was the one deleted
                            if (buyerIdInput.value == id) { clearForm(); }
                            console.log("Eliminación completada.");
                        } else {
                            showNotification("Error al eliminar.", "error");
                             console.error("Error en Eliminar: No se encontró el comprador tras confirmar.");
                        }
                    }
                );
           }
       });
        // Listener para el botón Limpiar
        clearBtn.addEventListener('click', clearForm);

   } else if (!isProfileView) {
       // Code Smell: Logging warnings for potentially expected missing elements (if user role doesn't need them)
        if (!buyersTableBody) console.warn("Elemento tbody#buyers-table-body no encontrado (esperado si rol incorrecto).");
        if (!clearBtn) console.warn("Elemento button#clear-buyer-btn no encontrado (esperado si rol incorrecto).");
   }

   // --- FIN DEL DOMContentLoaded ---
});