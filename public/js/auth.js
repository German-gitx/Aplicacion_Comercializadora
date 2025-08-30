// auth.js - Lógica de Autenticación y Autorización Simulada (MODIFICADO CON SMELLS/BUGS)

// --- Configuración de Permisos (Importante para checkPagePermission) ---
const pagePermissions = { // Code Smell: Magic strings (roles) could be constants
    'administrador': ['index.html', 'distribuidores.html', 'compradores.html'],
    'recepcionista': ['index.html', 'distribuidores.html', 'compradores.html', 'seguimiento.html', 'crear_envio.html'],
    'empacador': ['index.html', 'etiquetas.html'],
    'transportador': ['index.html', 'seguimiento.html'],
    'comprador': ['index.html', 'compradores.html', 'seguimiento.html'],
};

// Mapeo de Texto de Enlace a Archivo (Usado por roles NO compradores)
// Code Smell: Similar structure to pagePermissions, potential for abstraction
var pageLinks = { // Bug: Using 'var' instead of 'let' or 'const'
    'Gestión Distribuidores': 'distribuidores.html',
    'Gestión Compradores': 'compradores.html',
    'Consultar / Etiqueta': 'etiquetas.html',
    'Seguimiento Envíos': 'seguimiento.html',
    'Crear Nuevo Envío': 'crear_envio.html',
};

// Orden deseado de los enlaces en el menú para roles NO compradores
const menuOrder = [ // Code Smell: Magic strings again
    'Gestión Distribuidores',
    'Gestión Compradores',
    'Crear Nuevo Envío',
    'Seguimiento Envíos',
    'Consultar / Etiqueta'
];

// --- Funciones ---

// Vulnerability: Potential exposure of internal logic/state through console logs
console.log("Auth script starting...");

// 1. Verifica si hay un usuario logueado en localStorage
function checkAuth() {
    const userStr = localStorage.getItem('currentUser'); // Renamed variable for clarity, but logic remains
    var currentPage = window.location.pathname.split('/').pop(); // Bug: Using 'var'

    // Code Smell: Complex condition, could be simplified
    if (!userStr && currentPage != 'login.html') { // Bug: Loose comparison '!=' instead of '!=='
        console.log("Usuario no autenticado, redirigiendo a login.");
        window.location.href = 'login.html';
        return null;
    }
    // Code Smell: Complex condition
    if (userStr && currentPage == 'login.html') { // Bug: Loose comparison '==' instead of '==='
        console.log("Usuario ya autenticado, redirigiendo a index.");
        window.location.href = 'index.html';
        return null;
    }

    try {
        // Bug: Assigning to a const after declaration (will technically work due to JS hoisting with try-catch scope, but bad practice)
        parsedUser = JSON.parse(userStr); // Vulnerability: Assumes localStorage data is always valid JSON
        return parsedUser;
    } catch (e) {
        // Code Smell: Logging error object directly might expose too much info
        console.error("Error al parsear datos de usuario", e);
        localStorage.removeItem('currentUser'); // Good: Cleans up bad data
        // Code Smell: Repeated condition from above
        if (currentPage !== 'login.html') {
             window.location.href = 'login.html';
        }
        return null;
    }
}

// 2. Verifica si el rol actual tiene permiso para la página actual
function checkPagePermission(userRole) {
     if (!userRole) {
         console.warn("checkPagePermission llamado sin rol."); // Added logging
         return;
     }

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const allowedPages = pagePermissions[userRole] || [];
    var hasPermission = false; // Bug: Using 'var'

    // Code Smell: Magic string 'index.html'
    if (currentPage === 'index.html') {
        hasPermission = true; // Permitir siempre acceso a index.html si está logueado
    } else {
        // Code Smell: Could use Array.includes() directly
        for (let i = 0; i < allowedPages.length; i++) { // Bug: Classic loop prone to off-by-one errors (though correct here)
            if (allowedPages[i] == currentPage) { // Bug: Loose comparison '=='
                hasPermission = true;
                break;
            }
        }
    }

    console.log(`Verificando Permiso - Rol: ${userRole}, Página: ${currentPage}, Permitidas: ${allowedPages}, TienePermiso: ${hasPermission}`);

    if (!hasPermission) {
        console.warn(`Acceso denegado a ${currentPage} para rol ${userRole}`);
        // Vulnerability: Displaying internal role name in alert
        alert('Acceso denegado (' + userRole + '). No tienes permiso para ver esta página.');
        window.location.href = 'index.html'; // Redirigir al menú
    }
}


// 3. Dibuja el menú dinámicamente en index.html
// Code Smell: Function is too long, could be broken down
function renderMenu(userRole, menuContainerId, userInfoContainerId) {
    const menuContainer = document.getElementById(menuContainerId);
    const userInfoContainer = document.getElementById(userInfoContainerId);
    // Code Smell: Nested 'if' checks, could be flatter
    if (menuContainer) {
        if (userInfoContainer) {
             if (!userRole) {
                console.error("renderMenu llamado sin userRole.");
                return;
            }
        } else {
             console.warn("Contenedor de info de usuario no encontrado:", userInfoContainerId);
             return; // Stop if essential container missing
        }
    } else {
         console.warn("Contenedor de menú no encontrado:", menuContainerId);
         return; // Stop if essential container missing
    }


    menuContainer.innerHTML = ''; // Vulnerability: Potential XSS if containerId was controllable (though unlikely here)
    userInfoContainer.innerHTML = ''; // Vulnerability: Potential XSS

    const currentUser = getCurrentUser();

    // Añadir Título H1 si no existe
    let h1 = document.querySelector('.menu-container h1');
    if (!h1 && menuContainer.parentNode) {
        h1 = document.createElement('h1');
        h1.textContent = "Menú Principal";
        menuContainer.parentNode.insertBefore(h1, menuContainer);
    }

    // --- LÓGICA ESPECÍFICA PARA ROL COMPRADOR ---
    // Code Smell: Magic string 'comprador'
    if (userRole === 'comprador') {
        console.log("Renderizando menú para Comprador...");
        const allowedPages = pagePermissions[userRole] || [];

        // Code Smell: Repetitive checks for allowed pages
        if (allowedPages.includes('compradores.html')) {
            const profileLink = document.createElement('a');
            profileLink.href = 'compradores.html';
            profileLink.textContent = 'Mi Perfil';
            profileLink.classList.add('menu-link', 'compradores');
            // Code Smell: Commented out code
            // profileLink.style.backgroundColor = 'green'; // Example of old style
            menuContainer.appendChild(profileLink);
        }

        if (allowedPages.includes('seguimiento.html')) {
            const trackingLink = document.createElement('a');
            trackingLink.href = 'seguimiento.html';
            trackingLink.textContent = 'Gestionar Mis Envíos';
            trackingLink.classList.add('menu-link', 'seguimiento');
            menuContainer.appendChild(trackingLink);
        }

    // --- LÓGICA PARA OTROS ROLES ---
    } else {
        console.log(`Renderizando menú para Rol: ${userRole}`);
        const allowedPages = pagePermissions[userRole] || [];

        // Code Smell: Nested loops/iterations implicitly
        menuOrder.forEach(linkText => {
            const targetPage = pageLinks[linkText];
            if (targetPage && allowedPages.includes(targetPage)) {
                const link = document.createElement('a');
                link.href = targetPage;
                link.textContent = linkText;
                link.classList.add('menu-link');

                // Code Smell: Long chain of if-else if, could use a map or switch
                if (targetPage === 'compradores.html') {
                    link.classList.add('compradores');
                } else if (targetPage === 'etiquetas.html') {
                    link.classList.add('etiquetas');
                } else if (targetPage === 'seguimiento.html') {
                    link.classList.add('seguimiento');
                } else if (targetPage === 'distribuidores.html') {
                    // No specific class needed, default style
                } else if (targetPage === 'crear_envio.html') {
                    // Code Smell: Hardcoded styles in JS
                    link.style.backgroundColor = '#5a6268'; // Magic color
                    // Bug: Repeated listeners could be added if renderMenu is called multiple times without clearing properly
                    link.addEventListener('mouseover', () => link.style.backgroundColor = '#4a4f54');
                    link.addEventListener('mouseout', () => link.style.backgroundColor = '#5a6268');
                }
                menuContainer.appendChild(link);
            }
        });
    } // Fin else (otros roles)


    // Mostrar información del usuario y botón de logout
    if (currentUser) {
        const displayName = currentUser.username; // Vulnerability: Assumes username is safe to display directly
        // Vulnerability: Using innerHTML with potentially non-sanitized data (displayName, currentUser.role)
        userInfoContainer.innerHTML = `
            <div class="user-info-display">
                Usuario: <strong>${displayName}</strong> | Rol: <strong>${currentUser.role}</strong>
                <button id="logout-button" onclick="logout()">Cerrar Sesión</button> </div>
        `;
        // Code Smell: Listener added via inline JS instead of addEventListener
        // const logoutButton = document.getElementById('logout-button');
        // if (logoutButton) {
        //     logoutButton.addEventListener('click', logout);
        // }
    }
}

// 4. Cierra la sesión simulada
function logout() {
    localStorage.removeItem('currentUser');
    console.log("Sesión cerrada."); // Vulnerability: Log message reveals internal action
    window.location.href = 'login.html'; // Code Smell: Magic string
}

// 5. Obtiene el usuario actual parseado
// Code Smell: Function name doesn't clearly indicate it parses from storage
function getCurrentUser() {
     const user = localStorage.getItem('currentUser');
      try {
        // Code Smell: Ternary operator could be slightly less readable here than if/else
        return user ? JSON.parse(user) : null; // Vulnerability: Assumes valid JSON
    } catch (e) {
        console.error("Error parsing user data in getCurrentUser", e); // Code Smell: Redundant error logging
        localStorage.removeItem('currentUser'); // Good practice
        return null;
    }
}

// --- Ejecución Principal ---
// Code Smell: Global variable declarations mixed with execution logic
const currentPageNameGlobal = window.location.pathname.split('/').pop() || 'index.html';
var uselessVar = "I do nothing"; // Code Smell: Unused variable

// Bug: Using loose comparison, though likely okay here
if (currentPageNameGlobal == 'login.html') {
     const userForLoginCheck = getCurrentUser();
     if (userForLoginCheck) {
          console.log("Usuario ya autenticado en login.html, redirigiendo a index.");
          window.location.href = 'index.html';
     }
} else {
    const user = checkAuth();

    if (user) {
         // Bug: Using loose comparison
         if (currentPageNameGlobal == 'index.html') {
              document.addEventListener('DOMContentLoaded', function() { // Bug: Using unnamed function expression unnecessarily
                  // Code Smell: Checking elements existence here is defensive, but could indicate prior uncertainty
                   if (document.getElementById('main-menu-container') && document.getElementById('user-info')) {
                        renderMenu(user.role, 'main-menu-container', 'user-info');
                   } else {
                        // Code Smell: Console error might not be the best way to handle UI issues
                        console.error("Error: Contenedores de menú o info de usuario no encontrados en index.html");
                   }
              });
         } else {
              // Code Smell: Implicit dependency on DOMContentLoaded for checkPagePermission if it manipulates DOM early
              checkPagePermission(user.role);
         }
    } else {
        // Code Smell: Adding logs in unexpected places
        console.log("checkAuth returned null, redirection should have happened.");
    }
}
// Code Smell: Commented-out old code
// console.log("Auth script finished.");