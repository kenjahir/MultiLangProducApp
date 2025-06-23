const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Producto = require('./models/Producto');
const Usuario = require('./models/Usuario'); // ✅ Nuevo modelo

const app = express();
const PORT = 3000;

mongoose.connect('mongodb://127.0.0.1:27017/MultiLangProductApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

app.use(cors());
app.use(bodyParser.json());

// ✅ Simulación de usuarios (mock)
const usuarios = [
  { correo: 'admin@gmail.com', clave: '12345', nombre: 'Administrador' },
  { correo: 'kenjahir@gmail.com', clave: '54321', nombre: 'Ken Jahir' }
];

// ✅ Ruta de login simulado
app.post('/login', (req, res) => {
  const { correo, clave } = req.body;
  const usuarioValido = usuarios.find(
    (user) => user.correo === correo && user.clave === clave
  );

  if (usuarioValido) {
    return res.status(200).json({
      mensaje: 'Acceso correcto',
      correo: usuarioValido.correo,
      nombre: usuarioValido.nombre
    });
  } else {
    return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
  }
});

// ✅ Ruta de login real con MongoDB
app.post('/api/usuarios/login', async (req, res) => {
  const { correo, clave } = req.body;

  try {
    const usuario = await Usuario.findOne({ correo, clave });
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

    res.status(200).json({
      mensaje: 'Acceso correcto desde MongoDB',
      correo: usuario.correo,
      nombre: usuario.nombre
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al verificar credenciales', error });
  }
});

// ✅ Ruta para registrar usuario en MongoDB
app.post('/api/usuarios/register', async (req, res) => {
  const { nombre, correo, clave, direccion } = req.body;

  if (!nombre || !correo || !clave || !direccion) {
    return res.status(400).json({ mensaje: 'Campos incompletos' });
  }

  try {
    const yaExiste = await Usuario.findOne({ correo });
    if (yaExiste) {
      return res.status(409).json({ mensaje: 'Correo ya registrado' });
    }

    const nuevoUsuario = new Usuario({ nombre, correo, clave, direccion });
    await nuevoUsuario.save();

    res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar usuario', error });
  }
});

// ✅ Obtener productos de un usuario
app.get('/productos/:correo', async (req, res) => {
  try {
    const productos = await Producto.find({ correoUsuario: req.params.correo });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener productos', error });
  }
});

// ✅ Guardar productos para un usuario
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

app.get('/insertar-prueba', async (req, res) => {
  try {
    await Producto.deleteMany({ correoUsuario: 'admin@gmail.com' });

    await Producto.insertMany([
      {
        nombre: 'Producto de prueba',
        descripcion: 'Este es un producto de prueba',
        idioma: 'es',
        foto: '',
        correoUsuario: 'admin@gmail.com'
      }
    ]);

    res.send('✅ Producto de prueba insertado');
  } catch (err) {
    res.status(500).send('❌ Error al insertar prueba');
  }
});

// 🔥 Ruta para eliminar todos los productos
app.delete('/eliminar-todos-productos', async (req, res) => {
  try {
    await Producto.deleteMany({});
    res.status(200).json({ mensaje: '🧹 Todos los productos fueron eliminados' });
  } catch (error) {
    res.status(500).json({ mensaje: '❌ Error al eliminar productos', error });
  }
});

// 🔥 Ruta para eliminar productos por correo
app.delete('/eliminar-productos/:correo', async (req, res) => {
  try {
    const correo = req.params.correo;
    await Producto.deleteMany({ correoUsuario: correo });
    res.status(200).json({ mensaje: `🧹 Productos del usuario ${correo} eliminados` });
  } catch (error) {
    res.status(500).json({ mensaje: '❌ Error al eliminar productos del usuario', error });
  }
});

// ✅ Iniciar servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});