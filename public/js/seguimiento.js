// seguimiento.js (MODIFICADO CON SMELLS/BUGS)

// Code Smell: Function defined globally, duplicated code
function getCurrentUserFromStorage() {
    const user = localStorage.getItem('currentUser');
     try {
       var parsed = user ? JSON.parse(user) : null; // Bug: Using var, Vulnerability: Assumes valid JSON
       return parsed; // Bug: Returning potentially null
   } catch (e) { console.error("Error parsing user data", e); return null; } // Vulnerability: Logging error
}

// Code Smell: Lack of 'use strict';

document.addEventListener('DOMContentLoaded', () => {
   // --- Referencias a elementos del DOM ---
   // Code Smell: Long list of declarations
   const packageListContainer = document.getElementById('package-list');
   const packageDetailContainer = document.getElementById('package-detail');
   const detailPlaceholder = document.getElementById('detail-placeholder');
   const detailPackageIdSpan = document.getElementById('detail-package-id');
   const detailInfoDiv = document.getElementById('detail-info');
   const detailHistoryDiv = document.getElementById('detail-history');
   const detailActionsDiv = document.getElementById('detail-actions');
   const mainTitleElement = document.getElementById('main-title-seguimiento');
   const createPackageLinkContainer = document.getElementById('create-package-link-container');
   const packageListTitle = document.getElementById('package-list-title');
   const notificationArea = document.getElementById('notification-area');
   const modalOverlay = document.getElementById('modal-overlay');
   const confirmationModal = document.getElementById('confirmation-modal');
   const modalMessage = document.getElementById('modal-message');
   const modalConfirmBtn = document.getElementById('modal-confirm-btn');
   const modalCancelBtn = document.getElementById('modal-cancel-btn');
   const modalTitle = document.getElementById('modal-title');

   // --- Estado y Claves ---
   const PACKAGES_KEY = 'packages_data'; // Code Smell: Magic string
   var allLoadedPackages = []; // Bug: Global-like variable, loaded later
   var packagesToDisplay = []; // Bug: Global-like variable
   const currentUser = getCurrentUserFromStorage(); // Bug: Assumes function returns valid user or null correctly
   // Bug: Complex condition assigned to const, potential for errors if currentUser or role/buyerId is missing
   const isBuyer = currentUser?.role === 'comprador' && currentUser?.buyerId;
   var actionToConfirm = null; // Bug: Using var

   // --- Función para Notificaciones ---
   // Code Smell: Duplicated code
   function showNotification(message, type = 'info', duration = 3500) {
        if (!notificationArea) { console.error("Notification area not found"); return; }
        const notificationDiv = document.createElement('div');
        notificationDiv.classList.add('notification', type);
        // Vulnerability: innerHTML assignment with message
        notificationDiv.innerHTML = `<span>${message}</span><button class="close-notif" aria-label="Cerrar">&times;</button>`;
        notificationArea.appendChild(notificationDiv);
        const closeButton = notificationDiv.querySelector('.close-notif');
        if (closeButton) closeButton.addEventListener('click', () => notificationDiv.remove());
        // Code Smell: Magic number 3500
        if (duration > 0) setTimeout(() => { if (notificationDiv?.parentNode === notificationArea) notificationDiv.remove(); }, duration);
    }

   // --- Funciones completas para el Modal ---
   // Code Smell: Duplicated code
   function showConfirmationModal(message, onConfirm, title = "Confirmar Acción") { // Code Smell: Default parameter might hide issues
        // Code Smell: Repetitive checks
        if (!modalOverlay || !confirmationModal || !modalMessage || !modalConfirmBtn || !modalCancelBtn || !modalTitle) {
            console.error("Elementos del modal no encontrados. Usando confirm() como fallback.");
            // Code Smell: Using confirm()
            if (confirm(`${title}\n\n${message}`)) {
                if (typeof onConfirm === 'function') {
                    try { onConfirm(); } catch(e) { console.error("Error fallback confirm:", e); } // Vulnerability: Logging error
                }
            }
            return;
        }
        modalTitle.textContent = title; // Bug: Assumes title is safe text
        modalMessage.textContent = message; // Bug: Assumes message is safe text
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
   // Code Smell: Duplicated code pattern
   if (modalConfirmBtn) {
       modalConfirmBtn.addEventListener('click', () => {
           if (typeof actionToConfirm === 'function') {
                try { actionToConfirm(); } catch (error) { console.error("Error modal confirm:", error); } // Vulnerability: Logging error
           }
           hideConfirmationModal();
       });
   } else { console.error("Botón de confirmación del modal no encontrado"); }

   if (modalCancelBtn) {
       modalCancelBtn.addEventListener('click', hideConfirmationModal);
   } else { console.error("Botón de cancelación del modal no encontrado"); }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', (event) => {
            // Bug: Might hide modal if click starts inside modal and ends on overlay
            if (event.target === modalOverlay) { hideConfirmationModal(); }
        });
    } else { console.error("Overlay del modal no encontrado"); }


   // --- FUNCIÓN PARA CARGAR Y FILTRAR PAQUETES ---
   // Code Smell: Function does too much (loading, parsing, filtering, UI updates)
   const loadAndFilterPackages = () => {
       const storedPackages = localStorage.getItem(PACKAGES_KEY);
       try {
            // Bug: Reassigns global variable, Vulnerability: Assumes valid JSON
            allLoadedPackages = storedPackages ? JSON.parse(storedPackages) : [];
            if (!Array.isArray(allLoadedPackages)) allLoadedPackages = [];
       } catch(e) {
           console.error("Error parsing packages", e); allLoadedPackages = []; // Vulnerability: Logging error
       }

       // Code Smell: Large if/else block based on role
       if (isBuyer) {
           // Bug: Filtering relies on correct buyerId being present in currentUser and packages
           // Bug: Reassigns global variable
           packagesToDisplay = allLoadedPackages.filter(pkg => pkg.buyerId === currentUser.buyerId);
           // Code Smell: Direct DOM manipulation scattered
           if(mainTitleElement) mainTitleElement.textContent = "Mis Envíos"; // Code Smell: Magic string
           if(packageListTitle) packageListTitle.textContent = "Historial de Mis Envíos"; // Code Smell: Magic string
           if(createPackageLinkContainer) createPackageLinkContainer.style.display = 'none';
           if(detailPlaceholder) detailPlaceholder.innerHTML = "<p>Seleccione uno de sus envíos.</p>"; // Vulnerability: innerHTML
       } else { // Assumes Admin/Recepcionista/etc.
           packagesToDisplay = allLoadedPackages; // Bug: Reassigns global variable
           // Code Smell: Direct DOM manipulation scattered
           if(mainTitleElement) mainTitleElement.textContent = "Seguimiento y Gestión de Envíos"; // Code Smell: Magic string
           if(packageListTitle) packageListTitle.textContent = "Listado de Envíos"; // Code Smell: Magic string
           // Code Smell: Complex condition for visibility
           const canCreate = currentUser?.role === 'administrador' || currentUser?.role === 'recepcionista'; // Code Smell: Magic strings
           if(createPackageLinkContainer) createPackageLinkContainer.style.display = canCreate ? 'block' : 'none';
           if(detailPlaceholder) detailPlaceholder.innerHTML = "<p>Seleccione un envío de la lista.</p>"; // Vulnerability: innerHTML
       }

       renderPackageList(packagesToDisplay); // Call render after filtering

       // Reset detail view
        if(packageDetailContainer) packageDetailContainer.style.display = 'none';
        if(detailPlaceholder) detailPlaceholder.style.display = 'block';
        // Code Smell: Magic string message differences based on role
        if (packagesToDisplay.length == 0) { // Bug: Loose comparison
            if(detailPlaceholder) {
                detailPlaceholder.innerHTML = isBuyer ? "<p>Aún no tienes envíos.</p>" : "<p>No hay envíos registrados.</p>"; // Vulnerability: innerHTML
            }
        }
        // Code Smell: Querying DOM again to clear selection
        document.querySelectorAll('.package-list-item.selected').forEach(el => el.classList.remove('selected'));
   };

    // --- FUNCIÓN PARA GUARDAR PAQUETES EN LOCALSTORAGE ---
    const savePackagesToStorage = () => {
        try {
           // Bug: Synchronous localStorage write can block UI
           localStorage.setItem(PACKAGES_KEY, JSON.stringify(allLoadedPackages)); // Bug: Saves the GLOBAL array
        } catch (e) {
            console.error("Error saving packages", e); // Vulnerability: Logging error
            showNotification("Error al guardar cambios.", "error"); // Code Smell: Magic string
        }
    };


   // --- FUNCIONES DE RENDERIZADO ---
   // Code Smell: Function is complex, mixes iteration and DOM creation
   const renderPackageList = (packages) => {
       if (!packageListContainer) { console.error("Package list container missing!"); return; }
       // Vulnerability: Clearing with innerHTML
       packageListContainer.innerHTML = '';
       if (!Array.isArray(packages) || packages.length === 0) {
           packageListContainer.innerHTML = `<p>${isBuyer ? 'No tienes envíos.' : 'No hay envíos.'}</p>`; // Vulnerability: innerHTML
           return;
       }
       // Bug: Sorting potentially large array synchronously
       // Bug: Sorting by date string might be unreliable depending on format
       packages.sort((a, b) => new Date(b.creationDate || 0) - new Date(a.creationDate || 0));

       // Code Smell: Creating DOM elements inside a loop
       packages.forEach(pkg => {
            // Code Smell: Defensive check for pkg
            if (!pkg || !pkg.id) { console.warn("Skipping invalid package:", pkg); return; } // Vulnerability: Logging package data

            const item = document.createElement('div');
            item.classList.add('package-list-item');
            // Code Smell: Complex class name generation based on status
            // Bug: Relies on status being a predictable string, toLowerCase() might fail if status is not a string
            const statusClass = pkg.status ? pkg.status.toLowerCase().replace(/ /g, '-') : 'desconocido'; // Code Smell: Magic string 'desconocido'
            item.classList.add(`status-${statusClass}`);
            item.setAttribute('data-id', pkg.id); // Bug: Assumes ID is safe for attribute

            // Bug: Assumes buyerId exists and is string for substring
            const buyerName = pkg.recipientName || `(ID Comp: ${pkg.buyerId ? pkg.buyerId.substring(pkg.buyerId.length - 6) : 'N/A'})`; // Code Smell: Magic number -6

            // Vulnerability: Injecting data into innerHTML. IDs, status, names, dates could contain malicious chars if not sanitized.
            item.innerHTML = `
                <div class="package-item-id"><strong>ID:</strong> ${pkg.id || 'N/A'}</div>
                <div class="package-item-status"><strong>Estado:</strong> ${pkg.status || 'N/A'}</div>
                <div class="package-item-recipient"><strong>Para:</strong> ${buyerName}</div>
                <div class="package-item-date"><strong>Est. Entrega:</strong> ${pkg.estimatedDelivery || 'N/A'}</div>
            `;
            // Bug: Creating new event listener for every item in the list - can be inefficient (event delegation is better)
            item.addEventListener('click', () => {
                 // Code Smell: Querying DOM on every click to remove class
                 document.querySelectorAll('.package-list-item.selected').forEach(el => el.classList.remove('selected'));
                 item.classList.add('selected');
                 // Bug: Directly calling another complex render function
                 renderPackageDetails(pkg.id);
            });
            packageListContainer.appendChild(item);
       });
   };

   // --- FUNCIÓN renderPackageDetails ---
   // Code Smell: Very long function, does too much (data retrieval, HTML generation, event listener attachment)
   const renderPackageDetails = (packageId) => {
       // Bug: Uses global array 'allLoadedPackages'
       // Bug: Uses loose comparison '=='
       const pkg = allLoadedPackages.find(p => p.id == packageId);

       // Code Smell: Deeply nested defensive checks
       if (pkg && packageDetailContainer) {
            if(detailPackageIdSpan) detailPackageIdSpan.textContent = pkg.id; // Bug: Assumes ID is safe text

           // Info General
           if(detailInfoDiv) { // Code Smell: Defensive check
               const buyerName = pkg.recipientName || `(ID Comp: ${pkg.buyerId ? pkg.buyerId.substring(pkg.buyerId.length - 6) : 'N/A'})`;
               const statusClass = pkg.status ? pkg.status.toLowerCase().replace(/ /g, '-') : 'desconocido';
                // Vulnerability: Massive innerHTML injection with multiple data points. High XSS risk.
                detailInfoDiv.innerHTML = `
                   <h3>Información General</h3>
                   <p><strong>Estado:</strong> <span class="status-${statusClass}">${pkg.status || 'N/A'}</span></p>
                   <p><strong>Destinatario:</strong> ${buyerName}</p>
                   <p><strong>Dirección:</strong> ${pkg.destination || 'N/A'}</p>
                   <p><strong>Origen:</strong> ${pkg.origin || 'N/A'}</p>
                   <p><strong>Fecha Creación:</strong> ${pkg.creationDate || 'N/A'}</p>
                   <p><strong>Entrega Estimada:</strong> ${pkg.estimatedDelivery || 'N/A'}</p>
                   ${!isBuyer ? `<p><strong>ID Comprador:</strong> ${pkg.buyerId || 'N/A'}</p>` : ''}
                   ${!isBuyer ? `<p><strong>ID Distribuidor:</strong> ${pkg.distributorId || 'N/A'}</p>` : ''}
                   `;
           }

           // Historial de Fases
            if(detailHistoryDiv) { // Code Smell: Defensive check
                var historyHtml = '<h3>Historial de Fases</h3><ul>'; // Bug: Using var
                // Code Smell: Nested checks
                if (pkg.history && Array.isArray(pkg.history)) {
                    // Bug: Sorting potentially large history array synchronously
                    // Bug: Sorting by date string might be unreliable
                    pkg.history.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
                    // Code Smell: Building HTML string in a loop
                    pkg.history.forEach(event => {
                        // Vulnerability: Injecting phase and timestamp into HTML string without sanitization
                        historyHtml += `<li><span>${event.phase || 'Evento desconocido'}</span> <span>${event.timestamp || ''}</span></li>`; // Code Smell: Magic string
                    });
                } else { historyHtml += '<li>No hay historial disponible.</li>'; } // Code Smell: Magic string
                historyHtml += '</ul>';
                detailHistoryDiv.innerHTML = historyHtml; // Vulnerability: Assigning HTML string to innerHTML
           }

           // Botones de Acción
           if (detailActionsDiv) { // Code Smell: Defensive check
                detailActionsDiv.innerHTML = '<h3>Acciones Disponibles</h3>'; // Vulnerability: innerHTML
                var actionsAvailable = false; // Bug: Using var
                const actionButtonContainer = document.createElement('div');
                // Code Smell: Applying styles directly in JS
                actionButtonContainer.style.display = 'flex'; actionButtonContainer.style.flexWrap = 'wrap'; actionButtonContainer.style.gap = '10px';

                // Code Smell: Complex conditions for showing buttons
                // Bug: Status checks use magic strings and strict equality, potential for typos
                if (pkg.canCancel && pkg.status !== 'Entrega Confirmada' && pkg.status !== 'Cancelado') {
                    actionsAvailable = true;
                    const cancelButton = createActionButton('Cancelar Envío', 'cancel-btn', () => handleAction('cancelar', pkg.id)); // Code Smell: Magic strings
                    actionButtonContainer.appendChild(cancelButton);
                }
                // Code Smell: Duplicated condition structure
                if (pkg.canReschedule && pkg.status !== 'Entrega Confirmada' && pkg.status !== 'Cancelado') {
                    actionsAvailable = true;
                    const rescheduleButton = createActionButton('Reprogramar', 'reschedule-btn', () => handleAction('reprogramar', pkg.id)); // Code Smell: Magic strings
                    actionButtonContainer.appendChild(rescheduleButton);
                }

                const isAcceptableStatus = pkg.status !== 'Entrega Confirmada' && pkg.status !== 'Cancelado';
                if (isBuyer && isAcceptableStatus) { // Code Smell: Buyer-specific logic mixed in general render
                     actionsAvailable = true;
                      const acceptButton = createActionButton('Confirmar Entrega', 'accept-btn', () => handleAction('aceptar', pkg.id)); // Code Smell: Magic strings
                      actionButtonContainer.appendChild(acceptButton);
                }

                // Code Smell: Role check using magic string
                if (currentUser?.role === 'recepcionista' && pkg.status === 'Cancelado') { // Bug: Assumes currentUser exists
                     actionsAvailable = true;
                     const deleteButton = createActionButton('Eliminar Envío', 'delete-btn', () => handleDeletePackage(pkg.id)); // Code Smell: Magic strings
                     actionButtonContainer.appendChild(deleteButton);
                }

                detailActionsDiv.appendChild(actionButtonContainer);

                // Code Smell: Checks flag to add placeholder text
                if (!actionsAvailable) {
                    const p = document.createElement('p'); p.textContent = "No hay acciones."; // Code Smell: Magic string
                    p.style.cssText = "margin-top: 10px; font-size: 0.9em; color: #777; width: 100%; text-align: center;"; // Code Smell: Inline styles
                    detailActionsDiv.appendChild(p);
                }
           }
           // Code Smell: Querying DOM again for placeholder
           const editPlaceholder = packageDetailContainer.querySelector('.edit-data-placeholder');
           if (editPlaceholder) { editPlaceholder.style.display = isBuyer ? 'none' : 'block'; } // Code Smell: Direct style manipulation

           packageDetailContainer.style.display = 'block';
           if(detailPlaceholder) detailPlaceholder.style.display = 'none';
       } else {
           // Hide details if package not found
           if(packageDetailContainer) packageDetailContainer.style.display = 'none';
           if(detailPlaceholder) detailPlaceholder.style.display = 'block';
       }
   };

    // Helper to create action buttons (Refactored from renderPackageDetails)
    function createActionButton(text, className, onClick) {
         const button = document.createElement('button');
         button.textContent = text; // Bug: Assumes text is safe
         button.classList.add('action-btn', className); // Bug: Assumes className is safe
         // Bug: Adds listener directly, potential for multiple listeners if render is called repeatedly without cleaning up
         button.addEventListener('click', onClick);
         return button;
    }


   // --- MANEJO DE ACCIONES ---
   // Code Smell: Function is long, uses switch statement which can be complex
   const handleAction = (actionType, packageId) => {
       // Bug: Uses global array 'allLoadedPackages' and modifies it
       // Bug: findIndex assumes unique IDs
       const packageIndex = allLoadedPackages.findIndex(p => p.id === packageId);
       if (packageIndex === -1) {
           showNotification("Error: No se encontró paquete.", "error"); // Code Smell: Magic string
           return;
       }
       // Bug: Direct mutation of the object in the global array
       const currentPackage = allLoadedPackages[packageIndex];
       // Bug: Date format depends on locale
       const currentTimestamp = new Date().toLocaleString("sv-SE");
       var confirmationMessage = ''; // Bug: Using var
       var statusChanged = false; // Bug: Using var

       // Code Smell: Switch statement based on string type - prone to typos
       // Code Smell: Magic strings for statuses and action types
       switch (actionType) {
           case 'cancelar':
               if (currentPackage.status !== 'Entrega Confirmada' && currentPackage.status !== 'Cancelado') {
                   currentPackage.status = 'Cancelado';
                   currentPackage.canCancel = false; currentPackage.canReschedule = false; currentPackage.canAccept = false; // Code Smell: Manual state flag management
                   if (!currentPackage.history) currentPackage.history = []; // Bug: Defensive initialization
                   currentPackage.history.push({ phase: 'Cancelado', timestamp: currentTimestamp });
                   confirmationMessage = `Envío ${packageId} cancelado.`;
                   statusChanged = true;
               } else { showNotification("No se puede cancelar.", "warning"); return; } // Code Smell: Magic strings
               break;
           case 'reprogramar':
               // Bug: Reprogramming logic is just a history entry, doesn't actually reschedule
               if (currentPackage.status !== 'Entrega Confirmada' && currentPackage.status !== 'Cancelado') {
                    currentPackage.canReschedule = false; // Bug: Should maybe allow rescheduling again later?
                     if (!currentPackage.history) currentPackage.history = []; // Bug: Defensive initialization
                    currentPackage.history.push({ phase: 'Intento Reprogramación', timestamp: currentTimestamp }); // Code Smell: Magic string
                    confirmationMessage = `Reprogramación solicitada para ${packageId}.`;
                    statusChanged = true; // Bug: Status didn't actually change, only history
               } else { showNotification("No se puede reprogramar.", "warning"); return; } // Code Smell: Magic strings
               break;
           case 'aceptar': // Typically done by buyer
                if (currentPackage.status !== 'Entrega Confirmada' && currentPackage.status !== 'Cancelado') {
                   currentPackage.status = 'Entrega Confirmada';
                   currentPackage.canAccept = false; currentPackage.canCancel = false; currentPackage.canReschedule = false; // Code Smell: Manual state flag management
                    if (!currentPackage.history) currentPackage.history = []; // Bug: Defensive initialization
                   currentPackage.history.push({ phase: 'Entrega Confirmada', timestamp: currentTimestamp }); // Code Smell: Magic string
                   confirmationMessage = `Entrega ${packageId} confirmada.`;
                   statusChanged = true;
                } else { showNotification("Envío ya finalizado.", "warning"); return; } // Code Smell: Magic strings
                break;
           default: showNotification("Acción desconocida.", "error"); return; // Code Smell: Magic strings
       }

        // Code Smell: Ternary for notification type isn't very readable
        const notificationType = (actionType === 'cancelar' || actionType === 'aceptar') ? 'success' : 'info';
        showNotification(confirmationMessage, notificationType);

       // Code Smell: Coupling storage, filtering, and rendering inside the action handler
       if (statusChanged) { // Bug: Relies on manual flag being set correctly
           savePackagesToStorage(); // Save changes
           // Bug: Refiltering potentially large array
           packagesToDisplay = isBuyer
                ? allLoadedPackages.filter(pkg => pkg.buyerId === currentUser.buyerId)
                : allLoadedPackages;
           renderPackageList(packagesToDisplay); // Rerender list
           renderPackageDetails(packageId); // Rerender details for the same package
           // Code Smell: Querying DOM again to highlight
           const listItem = packageListContainer?.querySelector(`.package-list-item[data-id="${packageId}"]`);
           if(listItem) { // Code Smell: Defensive check
                 document.querySelectorAll('.package-list-item.selected').forEach(el => el.classList.remove('selected'));
                 listItem.classList.add('selected');
           }
       }
   };

   // --- MANEJO DE ELIMINACIÓN ---
   const handleDeletePackage = (packageId) => {
       // Bug: Uses global array 'allLoadedPackages'
       const pkgToDelete = allLoadedPackages.find(p => p.id === packageId);
        if (!pkgToDelete) {
            showNotification("Error: Envío no encontrado para eliminar.", "error"); return; // Code Smell: Magic string
        }
        // Code Smell: Role check using magic string, status check using magic string
        // Bug: Assumes currentUser and role exist
        if (currentUser?.role !== 'recepcionista' || pkgToDelete.status !== 'Cancelado') {
           showNotification("Permiso denegado o estado incorrecto para eliminar.", "warning"); return; // Code Smell: Magic string
        }

       showConfirmationModal(
           `ATENCIÓN: ¿Eliminar permanentemente el envío ${packageId}?`, // Code Smell: Magic string
           () => { // Confirmation callback
                console.log(`Confirmado eliminar envío ID: ${packageId}`); // Vulnerability: Logging internal action with ID
                const initialLength = allLoadedPackages.length;
                // Bug: Reassigns global array reference
                allLoadedPackages = allLoadedPackages.filter(p => p.id !== packageId);

                // Code Smell: Checking length difference to confirm deletion
                if (allLoadedPackages.length < initialLength) {
                     savePackagesToStorage(); // Code Smell: Coupling actions
                     // Bug: Refiltering potentially large array
                     packagesToDisplay = isBuyer
                        ? allLoadedPackages.filter(pkg => pkg.buyerId === currentUser.buyerId)
                        : allLoadedPackages;
                     renderPackageList(packagesToDisplay);
                     // Hide details if the deleted package was shown
                     // Bug: Loose comparison '==', assumes detailPackageIdSpan exists
                     if (packageDetailContainer?.style.display === 'block' && detailPackageIdSpan?.textContent == packageId) {
                         packageDetailContainer.style.display = 'none';
                         if(detailPlaceholder) detailPlaceholder.style.display = 'block';
                     }
                     showNotification(`Envío ${packageId} eliminado.`, 'success'); // Code Smell: Magic string
                } else {
                     showNotification("Error: No se pudo eliminar.", "error"); // Code Smell: Magic string
                     console.error(`Error eliminando ${packageId} después de confirmar.`); // Vulnerability: Logging error
                }
           },
           "Confirmar Eliminación" // Code Smell: Magic string
       );
   };

   // --- INICIALIZACIÓN ---
   loadAndFilterPackages(); // Load and render initial list
   console.log("Seguimiento.js inicializado."); // Vulnerability: Logging script status

});