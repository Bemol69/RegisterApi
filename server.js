const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://localhost:8100', // La URL de tu aplicación Ionic
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Configuración de la base de datos en Clever Cloud
const db = mysql.createConnection({
  host: 'btobfr8tsydxjfr145sr-mysql.services.clever-cloud.com', // Host de tu base de datos en Clever Cloud
  user: 'udz2sujon3ngyznn', // Usuario de tu base de datos
  password: 'RI9uUntNUwrdGkjdkALk', // Contraseña de tu base de datos
  database: 'btobfr8tsydxjfr145sr',  // Nombre de tu base de datos
  port: 3306  // El puerto suele ser 3306
});

db.connect(err => {
  if (err) throw err;
  console.log('Conectado a MySQL en Clever Cloud');
});

// Rutas de la API (no cambian)

app.get('/api/usuarios', (req, res) => {
  db.query('SELECT * FROM usuarios', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

app.post('/api/login-alumno', (req, res) => {
  const { usuario, correo_institucional, rut } = req.body;
  db.query('SELECT * FROM usuarios WHERE usuario = ? AND correo_institucional = ? AND rut = ?', 
    [usuario, correo_institucional, rut], 
    (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        res.json({ success: true, usuario: results[0] });
      } else {
        res.json({ success: false, message: 'Credenciales incorrectas' });
      }
  });
});

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

app.post('/api/login-profesor', (req, res) => {
  const { usuario, contrasena } = req.body;
  db.query('SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ?', 
    [usuario, contrasena], 
    (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        res.json({ success: true, usuario: results[0] });
      } else {
        res.json({ success: false, message: 'Credenciales incorrectas' });
      }
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
