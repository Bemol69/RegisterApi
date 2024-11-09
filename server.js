const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let db = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST || 'btobfr8tsydxjfr145sr-mysql.services.clever-cloud.com',
  user: process.env.MYSQL_ADDON_USER || 'udz2sujon3ngyznn',
  password: process.env.MYSQL_ADDON_PASSWORD || 'RI9uUntNUwrdGkjdkALk',
  database: process.env.MYSQL_ADDON_DB || 'btobfr8tsydxjfr145sr',
  port: process.env.MYSQL_ADDON_PORT || 3306,
  connectionLimit: 10
});

function handleDisconnect() {
  db = mysql.createPool({
    host: process.env.MYSQL_ADDON_HOST || 'btobfr8tsydxjfr145sr-mysql.services.clever-cloud.com',
    user: process.env.MYSQL_ADDON_USER || 'udz2sujon3ngyznn',
    password: process.env.MYSQL_ADDON_PASSWORD || 'RI9uUntNUwrdGkjdkALk',
    database: process.env.MYSQL_ADDON_DB || 'btobfr8tsydxjfr145sr',
    port: process.env.MYSQL_ADDON_PORT || 3306,
    connectionLimit: 10
  });

  db.getConnection((err) => {
    if (err) {
      console.error('Error reconectando a la base de datos:', err);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log('Reconectado a MySQL en Clever Cloud');
    }
  });
}

db.on('error', (err) => {
  console.error('Error de base de datos:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    handleDisconnect();
  } else {
    throw err;
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

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
      res.json(results.length > 0 ? { success: true, usuario: results[0] } : { success: false, message: 'Credenciales incorrectas' });
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
          (updateErr) => {
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
  
  if (!usuario || !contrasena) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
  }

  db.query('SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ? AND perfil = "profesor"', 
    [usuario, contrasena], 
    (err, results) => {
      if (err) {
        console.error('Error en login de profesor:', err);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
      }
      res.json(results.length > 0 ? { success: true, usuario: results[0] } : { success: false, message: 'Credenciales incorrectas' });
  });
});

// Rutas adicionales para manejar la asistencia y ramos de los alumnos
app.get('/api/alumno/:id', (req, res) => {
  const { id } = req.params;
  
  db.query('SELECT * FROM usuarios WHERE id = ? AND perfil = "alumno"', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al obtener los datos del alumno' });
    }
    res.json(results.length > 0 ? { success: true, alumno: results[0] } : { success: false, message: 'Alumno no encontrado' });
  });
});

app.get('/api/ramos/:alumnoId', (req, res) => {
  const { alumnoId } = req.params;

  db.query('SELECT r.*, COUNT(c.id) AS clases_totales, SUM(a.asistencia = 1) AS clases_asistidas FROM ramos r ' +
    'JOIN clases c ON c.ramo_id = r.id ' +
    'LEFT JOIN asistencia a ON a.clase_id = c.id ' +
    'WHERE r.alumno_id = ? GROUP BY r.id', [alumnoId], (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error al obtener los ramos' });
    }
    res.json({ success: true, ramos: results });
  });
});

// Inicio del servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
