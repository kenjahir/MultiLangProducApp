const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

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
    return res.status(200).json({ mensaje: 'Acceso correcto' });
  } else {
    return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});