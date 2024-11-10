const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const QRCode = require('qrcode');
const app = express();
const port = 3000;

// Configuración de la base de datos
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'asistencia'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Conectado a la base de datos');
});

// Middleware
app.use(bodyParser.json());

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
