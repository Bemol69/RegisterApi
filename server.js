const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS más permisiva para producción
app.use(cors());
app.use(bodyParser.json());

// Configuración de la base de datos usando un pool de conexiones
let db = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST || 'btobfr8tsydxjfr145sr-mysql.services.clever-cloud.com',
  user: process.env.MYSQL_ADDON_USER || 'udz2sujon3ngyznn',
  password: process.env.MYSQL_ADDON_PASSWORD || 'RI9uUntNUwrdGkjdkALk',
  database: process.env.MYSQL_ADDON_DB || 'btobfr8tsydxjfr145sr',
  port: process.env.MYSQL_ADDON_PORT || 3306,
  connectionLimit: 10 // Ajusta este límite según tus necesidades
});

// Manejo mejorado de la reconexión en caso de error
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
      setTimeout(handleDisconnect, 2000); // Reintenta después de un corto tiempo
    } else {
      console.log('Reconectado a MySQL en Clever Cloud');
    }
  });
}

// Escuchar eventos de error en el pool de conexiones
db.on('error', (err) => {
  console.error('Error de base de datos:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    handleDisconnect();
  } else {
    throw err;
  }
});

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
  console.log(Servidor escuchando en el puerto ${port});
});

// Manejo de errores no capturados
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Rechazo no manejado en:', promise, 'razón:', reason);
});







// Ruta para obtener la información del alumno
app.get('/api/alumno/:id', (req, res) => {
  const alumnoId = req.params.id;

  // Obtener el nombre completo y la carrera del alumno
  const alumnoQuery = SELECT nombre_completo, carrera FROM usuarios WHERE id = ?;
  db.query(alumnoQuery, [alumnoId], (err, alumnoResults) => {
    if (err) {
      console.error('Error al obtener datos del alumno:', err);
      return res.status(500).json({ success: false, message: 'Error al obtener datos del alumno' });
    }

    if (alumnoResults.length === 0) {
      return res.status(404).json({ success: false, message: 'Alumno no encontrado' });
    }

    const alumno = alumnoResults[0];

    res.json({
      alumno: alumno, // Enviamos solo los datos relevantes: nombre completo y carrera
    });
  });
});


// Ruta para obtener los ramos del alumno
app.get('/api/ramos/:alumnoId', (req, res) => {
  const alumnoId = req.params.alumnoId;

  const query = 
    SELECT r.nombre_ramo
    FROM ramos r
    JOIN estudiante_ramos er ON r.id = er.ramo_id
    WHERE er.estudiante_id = ?;

 db.query(query, [alumnoId], (err, result) => {
  if (err) {
    console.error('Error al obtener los ramos', err); // Esta línea debería mostrar el error en el log del servidor
    return res.status(500).json({ error: 'Hubo un error al obtener los ramos' });
  }
  res.json({ ramos: result });
});
});






// Ruta para obtener los ramos y clases totales del alumno
app.get('/api/ramos/:id', (req, res) => {
  const alumnoId = req.params.id;
  
  // Consulta SQL para obtener ramos y clases totales
  const query = `
    SELECT 
        r.nombre_ramo,
        COUNT(c.id) AS clases_totales
    FROM 
        ramos r
    JOIN 
        estudiante_ramos er ON r.id = er.ramo_id
    JOIN 
        clases c ON r.id = c.ramo_id
    WHERE 
        er.estudiante_id = ?
    GROUP BY 
        r.id;
  `;

  db.query(query, [alumnoId], (err, results) => {
    if (err) {
      console.error('Error al obtener los ramos del alumno:', err);
      return res.status(500).json({ error: 'Hubo un error al obtener los ramos' });
    }
    res.json({ ramos: results });
  });
