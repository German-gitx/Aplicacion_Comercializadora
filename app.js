// 1. Importar Express
const express = require('express');

// 2. Crear una instancia de la aplicación Express
const app = express();

// 3. Middleware para parsear JSON
app.use(express.json());

// --- Middleware para servir archivos estáticos desde la carpeta 'public' ---
app.use(express.static('public'));
// --------------------------------------------------------------------

// 4. Almacenamiento en memoria (¡Temporal!)
//    ===========================================================
//    === MODIFICACIÓN: Iniciar con array VACÍO y nextId en 1 ===
let distribuidores = []; // ¡Ya no hay datos de ejemplo aquí!
let nextId = 1;          // Empezamos a asignar IDs desde 1
//    ===========================================================

// --- Definición de las Rutas CRUD para Distribuidores ---

// CREATE - POST /distribuidores
app.post('/distribuidores', (req, res) => {
    const nuevoDistribuidor = req.body;
    if (!nuevoDistribuidor.nombre || !nuevoDistribuidor.telefono || !nuevoDistribuidor.correo) {
        return res.status(400).json({ message: 'Faltan datos obligatorios (nombre, telefono, correo)' });
    }
    nuevoDistribuidor.id = nextId++; // Asigna el ID actual y luego incrementa nextId
    distribuidores.push(nuevoDistribuidor);
    console.log('Backend: Distribuidor creado:', nuevoDistribuidor);
    res.status(201).json(nuevoDistribuidor); // Devuelve el objeto creado
});

// READ ALL - GET /distribuidores
app.get('/distribuidores', (req, res) => {
    console.log('Backend: Enviando todos los distribuidores:', distribuidores);
    res.status(200).json(distribuidores); // Devuelve el array actual (puede estar vacío)
});

// READ ONE - GET /distribuidores/:id
app.get('/distribuidores/:id', (req, res) => {
    const idBuscado = parseInt(req.params.id);
    const distribuidor = distribuidores.find(d => d.id === idBuscado);
    if (distribuidor) {
        console.log('Backend: Distribuidor encontrado:', distribuidor);
        res.status(200).json(distribuidor);
    } else {
        console.log('Backend: Distribuidor no encontrado, ID:', idBuscado);
        res.status(404).json({ message: 'Distribuidor no encontrado' });
    }
});

// UPDATE - PUT /distribuidores/:id
app.put('/distribuidores/:id', (req, res) => {
    const idBuscado = parseInt(req.params.id);
    const datosActualizados = req.body;
    const indice = distribuidores.findIndex(d => d.id === idBuscado);
    if (indice !== -1) {
        // Mantener el ID original, actualizar el resto
        distribuidores[indice] = { ...distribuidores[indice], ...datosActualizados, id: idBuscado };
        console.log('Backend: Distribuidor actualizado:', distribuidores[indice]);
        res.status(200).json(distribuidores[indice]);
    } else {
        console.log('Backend: Distribuidor no encontrado para actualizar, ID:', idBuscado);
        res.status(404).json({ message: 'Distribuidor no encontrado' });
    }
});

// DELETE - DELETE /distribuidores/:id
app.delete('/distribuidores/:id', (req, res) => {
    const idBuscado = parseInt(req.params.id);
    const indice = distribuidores.findIndex(d => d.id === idBuscado);
    if (indice !== -1) {
        const eliminado = distribuidores.splice(indice, 1); // Elimina del array
        console.log('Backend: Distribuidor eliminado:', eliminado[0]);
        res.status(204).send(); // Éxito sin contenido
    } else {
        console.log('Backend: Distribuidor no encontrado para eliminar, ID:', idBuscado);
        res.status(404).json({ message: 'Distribuidor no encontrado' });
    }
});

// --- Fin de las Rutas CRUD ---

// Configuración del puerto y host
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

// Iniciar el servidor Express
app.listen(port, hostname, () => {
    console.log(`Servidor API REST corriendo en http://localhost:${port}`);
    console.log(`Sirviendo archivos estáticos desde la carpeta 'public'`);
    console.log(`(Accede a http://localhost:${port} para ver el formulario)`);
    console.log('Backend iniciado con lista de distribuidores VACÍA.'); // Mensaje añadido
});