const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS más permisiva para producción
app.use(cors());
app.use(bodyParser.json());

// Configuración de la base de datos usando variables de entorno
const db = mysql.createConnection({
  host: process.env.MYSQL_ADDON_HOST || 'btobfr8tsydxjfr145sr-mysql.services.clever-cloud.com',
  user: process.env.MYSQL_ADDON_USER || 'udz2sujon3ngyznn',
  password: process.env.MYSQL_ADDON_PASSWORD || 'RI9uUntNUwrdGkjdkALk',
  database: process.env.MYSQL_ADDON_DB || 'btobfr8tsydxjfr145sr',
  port: process.env.MYSQL_ADDON_PORT || 3306
});

// Manejo mejorado de la conexión a la base de datos
db.connect(err => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conectado a MySQL en Clever Cloud');
});

// Manejo de reconexión
db.on('error', function(err) {
  console.error('Error de base de datos:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    handleDisconnect();
  } else {
    throw err;
  }
});

function handleDisconnect() {
  db.connect(function(err) {
    if (err) {
      console.error('Error reconectando:', err);
      setTimeout(handleDisconnect, 2000);
    }
  });
}

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Ruta para obtener todos los usuarios
app.get('/api/usuarios', (req, res) => {
  db.query('SELECT * FROM usuarios', (err, results) => {
    if (err) {
      console.error('Error al obtener usuarios:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
    }
    res.json(results);
  });
});

// Ruta para login de alumno
app.post('/api/login-alumno', (req, res) => {
  const { usuario, correo_institucional, rut } = req.body;
  
  if (!usuario || !correo_institucional || !rut) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
  }

  db.query('SELECT * FROM usuarios WHERE usuario = ? AND correo_institucional = ? AND rut = ?', 
    [usuario, correo_institucional, rut], 
    (err, results) => {
      if (err) {
        console.error('Error en login de alumno:', err);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
      }
      if (results.length > 0) {
        res.json({ success: true, usuario: results[0] });
      } else {
        res.json({ success: false, message: 'Credenciales incorrectas' });
      }
  });
});

// Ruta para registro de profesor
app.post('/api/registro-profesor', (req, res) => {
  const { rut, correo_institucional, contrasena } = req.body;
  
  if (!rut || !correo_institucional || !contrasena) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
  }

  db.query('SELECT * FROM usuarios WHERE rut = ? AND correo_institucional = ? AND perfil = "profesor"', 
    [rut, correo_institucional], 
    (err, results) => {
      if (err) {
        console.error('Error en la consulta:', err);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
      }
      if (results.length > 0) {
        db.query('UPDATE usuarios SET contrasena = ? WHERE rut = ? AND correo_institucional = ?', 
          [contrasena, rut, correo_institucional], 
          (updateErr, updateResult) => {
            if (updateErr) {
              console.error('Error al actualizar:', updateErr);
              return res.status(500).json({ success: false, message: 'Error al actualizar la contraseña' });
            }
            res.json({ success: true, message: 'Registro exitoso' });
          });
      } else {
        res.status(404).json({ success: false, message: 'Profesor no encontrado. Verifique RUT y correo institucional.' });
      }
  });
});

// Ruta para login de profesor
app.post('/api/login-profesor', (req, res) => {
  const { usuario, contrasena } = req.body;
  
  if (!usuario || !contrasena) {
    return res.status(400).json({ success: false, message: 'Usuario y contraseña son requeridos' });
  }

  db.query('SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?', 
    [usuario, contrasena], 
    (err, results) => {
      if (err) {
        console.error('Error en login de profesor:', err);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
      }
      if (results.length > 0) {
        res.json({ success: true, usuario: results[0] });
      } else {
        res.json({ success: false, message: 'Credenciales incorrectas' });
      }
  });
});

// Iniciar el servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Rechazo no manejado en:', promise, 'razón:', reason);
});
