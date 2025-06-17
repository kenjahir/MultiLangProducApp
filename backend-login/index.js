const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Simulación de usuarios
const usuarios = [
  { correo: 'admin@gmail.com', clave: '12345' },
  { correo: 'kenjahir@gmail.com', clave: '54321' }
];

// Ruta de login
app.post('/login', (req, res) => {
  const { correo, clave } = req.body;

  const usuarioValido = usuarios.find(
    (user) => user.correo === correo && user.clave === clave
  );

  if (usuarioValido) {
    return res.status(200).json({ mensaje: 'Acceso correcto', correo });
  } else {
    return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
  }
});

// Ruta para obtener productos de un usuario
app.get('/productos/:correo', (req, res) => {
  const correo = req.params.correo;
  const filePath = path.join(__dirname, 'productos', `${correo}.json`);

  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    res.json(JSON.parse(data));
  } else {
    res.json([]); // No hay productos guardados aún
  }
});

// Ruta para guardar productos de un usuario
app.post('/productos/:correo', (req, res) => {
  const correo = req.params.correo;
  const productos = req.body;

  if (!Array.isArray(productos)) {
    return res.status(400).json({ mensaje: 'El cuerpo debe ser un arreglo de productos' });
  }

  const dirPath = path.join(__dirname, 'productos');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }

  const filePath = path.join(dirPath, `${correo}.json`);
  fs.writeFileSync(filePath, JSON.stringify(productos, null, 2));
  res.status(200).json({ mensaje: 'Productos guardados correctamente' });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});