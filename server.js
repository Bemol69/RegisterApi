const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Configuración de CORS
app.use(cors());
app.use(bodyParser.json());

// Configuración de la base de datos
let db = mysql.createPool({
  host: process.env.MYSQL_ADDON_HOST || 'btobfr8tsydxjfr145sr-mysql.services.clever-cloud.com',
  user: process.env.MYSQL_ADDON_USER || 'udz2sujon3ngyznn',
  password: process.env.MYSQL_ADDON_PASSWORD || 'RI9uUntNUwrdGkjdkALk',
  database: process.env.MYSQL_ADDON_DB || 'btobfr8tsydxjfr145sr',
  port: process.env.MYSQL_ADDON_PORT || 3306,
  connectionLimit: 10
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

// Ruta para login de profesor
app.post('/api/login-profesor', (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ success: false, message: 'Usuario y contraseña son requeridos' });
  }

  db.query(
    'SELECT * FROM usuarios WHERE usuario = ? AND contrasena = ? AND perfil = "profesor"',
    [usuario, contrasena],
    (err, results) => {
      if (err) {
        console.error('Error en login de profesor:', err);
        return res.status(500).json({ success: false, message: 'Error en el servidor' });
      }
      if (results.length > 0) {
        // Enviar `profesorId` (que es `results[0].id`) en la respuesta
        res.json({ success: true, profesorId: results[0].id });
      } else {
        res.json({ success: false, message: 'Credenciales incorrectas' });
      }
    }
  );
});


// Ruta para obtener los datos de un profesor
app.get('/api/profesores/:id', (req, res) => {
  const profesorId = req.params.id;

  // Aquí obtienes los datos del profesor desde la base de datos
  db.query('SELECT * FROM usuarios WHERE id = ? AND perfil = "profesor"', [profesorId], (err, results) => {
    if (err) {
      console.error('Error al obtener datos del profesor:', err);
      return res.status(500).send('Error en el servidor');
    }

    if (results.length > 0) {
      res.json({ profesor: results[0] }); // Envía los datos del profesor
    } else {
      res.status(404).send('Profesor no encontrado');
    }
  });
});

// Ruta para obtener la información del alumno
app.get('/api/alumno/:id', (req, res) => {
  const alumnoId = req.params.id;

  const alumnoQuery = 'SELECT nombre_completo, carrera FROM usuarios WHERE id = ?';
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

// Ruta para obtener los ramos del alumno con asistencias
app.get('/api/ramos/:alumnoId', (req, res) => {
  const alumnoId = req.params.alumnoId;

  const query = 
    'SELECT r.nombre_ramo, COUNT(c.id) AS clases_totales, ' +
    'SUM(CASE WHEN a.estudiante_id = ? THEN 1 ELSE 0 END) AS clases_asistidas ' + 
    'FROM ramos r ' +
    'JOIN estudiante_ramos er ON r.id = er.ramo_id ' +
    'JOIN clases c ON r.id = c.ramo_id ' +
    'LEFT JOIN asistencias a ON a.clase_id = c.id AND a.estudiante_id = ? ' +
    'WHERE er.estudiante_id = ? ' +
    'GROUP BY r.id';

  db.query(query, [alumnoId, alumnoId, alumnoId], (err, results) => {
    if (err) {
      console.error('Error al obtener los ramos del alumno:', err);
      return res.status(500).json({ error: 'Hubo un error al obtener los ramos' });
    }
    res.json({ ramos: results });
  });
});

// Iniciar el servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});




// Ruta para obtener la asistencia del alumno
app.get('/api/asistencia/:alumnoId', (req, res) => {
  const alumnoId = req.params.alumnoId;

  const query = 
    'SELECT c.nombre_clase, r.nombre_ramo, a.fecha, a.estado ' +
    'FROM asistencias a ' +
    'JOIN clases c ON a.clase_id = c.id ' +
    'JOIN ramos r ON a.ramo_id = r.id ' +
    'WHERE a.estudiante_id = ? AND a.estado = "asistido"';

  db.query(query, [alumnoId], (err, results) => {
    if (err) {
      console.error('Error al obtener la asistencia del alumno:', err);
      return res.status(500).json({ error: 'Hubo un error al obtener la asistencia' });
    }
    res.json({ asistencia: results });
  });
});








// Ruta para crear una clase
app.post('/api/crear-clase', (req, res) => {
  const { ramo_id, profesor_id, fecha } = req.body;

  const query = `INSERT INTO clases (ramo_id, profesor_id, fecha) VALUES (?, ?, ?)`;
  db.query(query, [ramo_id, profesor_id, fecha], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error al crear la clase' });
    }
    // Devolvemos el ID de la clase creada
    res.json({ clase_id: result.insertId });
  });
});

// Ruta para generar el QR
app.post('/api/generar-qr', (req, res) => {
  const { command } = req.body;
  const url = `https://miapp.com/scan-qr?clase_id=${command}`;

  QRCode.toDataURL(url, (err, qrCodeUrl) => {
    if (err) {
      return res.status(500).json({ message: 'Error al generar el QR' });
    }
    res.json({ qrCodeUrl });
  });
});

// Ruta para obtener los ramos de un profesor
app.get('/api/ramos-profesor/:profesorId', (req, res) => {
  const profesorId = req.params.profesorId;

  const query = `
    SELECT r.id, r.nombre_ramo
    FROM ramos r
    JOIN profesor_ramos pr ON r.id = pr.ramo_id
    WHERE pr.profesor_id = ?
  `;
  db.query(query, [profesorId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Error al obtener los ramos' });
    }
    res.json(result);
  });
});

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
