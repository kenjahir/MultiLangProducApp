const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const path = require('path');
const Producto = require('./models/Producto');
const Usuario = require('./models/Usuario');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'CLAVE_SECRETA_123456';

// 📦 Conectar a MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/MultiLangProductApp')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// 📄 Motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 🧠 Rutas API
// Login tradicional
app.post('/api/usuarios/login', async (req, res) => {
  const { correo, clave } = req.body;
  try {
    const usuario = await Usuario.findOne({ correo, clave });
    if (!usuario) return res.status(401).json({ mensaje: 'Credenciales incorrectas' });

    res.status(200).json({
      mensaje: 'Acceso correcto desde MongoDB',
      nombre: usuario.nombre,
      correo: usuario.correo,
      direccion: usuario.direccion,
      telefono: usuario.telefono,
      imagen: usuario.imagen,
      biometricoHabilitado: usuario.biometricoHabilitado
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al verificar credenciales', error });
  }
});

// Registro
app.post('/api/usuarios/register', async (req, res) => {
  const { nombre, correo, clave, direccion, telefono, imagen, rostroBase64 } = req.body;
  if (!nombre || !correo || !clave || !direccion || !telefono || !imagen) {
    return res.status(400).json({ mensaje: 'Campos incompletos' });
  }

  try {
    const usuarioExistente = await Usuario.findOne({ correo });
    if (usuarioExistente) return res.status(409).json({ mensaje: 'Correo ya registrado' });

    const nuevoUsuario = new Usuario({
      nombre,
      correo,
      clave,
      direccion,
      telefono,
      imagen,
      rostroBase64: rostroBase64 || '',
      biometricoHabilitado: false
    });

    await nuevoUsuario.save();
    res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar usuario', error });
  }
});

// 🔐 Activar biometría
app.patch('/api/usuarios/activar-biometrico/:correo', async (req, res) => {
  try {
    const usuario = await Usuario.findOneAndUpdate(
      { correo: req.params.correo },
      { biometricoHabilitado: true },
      { new: true }
    );
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    res.status(200).json({ mensaje: 'Biometría activada correctamente', usuario });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al activar biometría', error });
  }
});

// 🔍 Verificar biometría
app.get('/api/usuarios/huella/:correo', async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ correo: req.params.correo });
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    res.status(200).json({
      mensaje: 'Usuario encontrado',
      biometricoHabilitado: usuario.biometricoHabilitado,
      nombre: usuario.nombre,
      correo: usuario.correo,
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al consultar huella', error });
  }
});

// 🧠 Rutas Productos
app.get('/productos/:correo', async (req, res) => {
  try {
    const productos = await Producto.find({ correoUsuario: req.params.correo });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener productos', error });
  }
});

app.post('/productos/:correo', async (req, res) => {
  try {
    const correo = req.params.correo;
    const nuevosProductos = req.body;

    if (!Array.isArray(nuevosProductos)) {
      return res.status(400).json({ mensaje: 'El cuerpo debe ser un arreglo de productos' });
    }

    await Producto.deleteMany({ correoUsuario: correo });

    const productosConCorreo = nuevosProductos.map(p => ({
      ...p,
      correoUsuario: correo
    }));

    await Producto.insertMany(productosConCorreo);
    res.status(200).json({ mensaje: 'Productos guardados correctamente' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al guardar productos', error });
  }
});

// ✅ MAGIC LINK: Enviar
app.post('/api/magic-link/enviar', async (req, res) => {
  const { correo } = req.body;

  try {
    const usuario = await Usuario.findOne({ correo });
    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const token = jwt.sign({ correo }, JWT_SECRET, { expiresIn: '15m' });
    const enlace = `http://192.168.0.105:3000/verificar-magic-link.html?token=${token}`;

    await enviarCorreo(correo, enlace);
    res.status(200).json({ mensaje: 'Magic Link enviado con éxito' });
  } catch (error) {
    console.error('❌ Error al enviar Magic Link:', error);
    res.status(500).json({ mensaje: 'Error al enviar Magic Link', error });
  }
});

// ✅ MAGIC LINK: Verificar
app.get('/api/magic-link/verificar', async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const usuario = await Usuario.findOne({ correo: decoded.correo });

    if (!usuario) return res.status(404).json({ mensaje: 'Usuario no válido' });

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      nombre: usuario.nombre,
      correo: usuario.correo,
      direccion: usuario.direccion,
      telefono: usuario.telefono,
      imagen: usuario.imagen,
      biometricoHabilitado: usuario.biometricoHabilitado
    });
  } catch (error) {
    res.status(401).json({ mensaje: 'Token inválido o expirado', error });
  }
});

// ✅ Ruta HTML que redirige al deep link
app.get('/verificar-magic-link.html', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Token no proporcionado');
  res.render('verificar-magic-link', { token });
});

// 📤 Función de envío de correo
async function enviarCorreo(destinatario, enlace) {
  const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'serveruleam@gmail.com',
    pass: 'apvb lpjf jhul qjcg'
  },
  tls: {
    rejectUnauthorized: false // ✅ Esto permite certificados autofirmados
  }
});

  await transporter.sendMail({
  from: '"MultilangProductApp" <server.uleam2024@gmail.com>',
  to: destinatario,
  subject: '🔐 Tu Magic Link para ingresar',
  html: `
    <div style="max-width: 600px; margin: auto; font-family: 'Segoe UI', sans-serif; background: #f9f9f9; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
      <div style="background: #007bff; color: white; padding: 20px 30px; text-align: center;">
        <h2 style="margin: 0;">🔐 Acceso Rápido</h2>
        <p style="margin: 5px 0 0;">Tu enlace mágico para ingresar</p>
      </div>
      <div style="padding: 30px; text-align: center;">
        <p style="font-size: 16px; color: #333;">Hola 👋,</p>
        <p style="font-size: 15px; color: #444;">
          Haz clic en el botón para acceder automáticamente a tu cuenta. Este enlace es válido por <strong>15 minutos</strong>.
        </p>
        <a href="${enlace}" style="display: inline-block; margin: 20px 0; padding: 12px 24px; background-color: #28a745; color: white; font-size: 16px; text-decoration: none; border-radius: 5px;">
          Iniciar sesión
        </a>
        <p style="font-size: 13px; color: #666; margin-top: 20px;">
          Si no solicitaste este correo, puedes ignorarlo sin problema.
        </p>
      </div>
      <div style="background: #f1f1f1; padding: 15px 30px; text-align: center; font-size: 12px; color: #999;">
        © 2025 MultilangProductApp - Todos los derechos reservados
      </div>
    </div>
  `
});
}

// 🚀 Inicio del servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor corriendo en http://0.0.0.0:${PORT}`);
});