const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Producto = require('./models/Producto');
const Usuario = require('./models/Usuario');

const app = express();
const PORT = 3000;

mongoose.connect('mongodb://127.0.0.1:27017/MultiLangProductApp')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// ✅ Login
app.post('/api/usuarios/login', async (req, res) => {
  const { correo, clave } = req.body;

  try {
    const usuario = await Usuario.findOne({ correo, clave });
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' });
    }

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

// ✅ Activar biometría (huella o rostro)
app.patch('/api/usuarios/activar-biometrico/:correo', async (req, res) => {
  try {
    const correo = req.params.correo;
    const usuario = await Usuario.findOneAndUpdate(
      { correo },
      { biometricoHabilitado: true },
      { new: true, runValidators: true }
    );

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.status(200).json({ mensaje: 'Biometría activada correctamente', usuario });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al activar biometría', error });
  }
});

// ✅ Verificar biometría
app.get('/api/usuarios/huella/:correo', async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ correo: req.params.correo });

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

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

// ✅ Registro con rostro incluido
app.post('/api/usuarios/register', async (req, res) => {
  const { nombre, correo, clave, direccion, telefono, imagen, rostroBase64 } = req.body;

  console.log('📨 Datos recibidos para registro:');
  console.log('Nombre:', nombre);
  console.log('Correo:', correo);
  console.log('Tiene imagen de perfil:', !!imagen);
  console.log('Tiene rostroBase64:', !!rostroBase64);
  console.log('Base64 rostro (inicio):', (rostroBase64 || '').slice(0, 100));

  if (!nombre || !correo || !clave || !direccion || !telefono || !imagen) {
    return res.status(400).json({ mensaje: 'Campos incompletos' });
  }

  try {
    const usuarioExistente = await Usuario.findOne({ correo });

    if (usuarioExistente) {
      return res.status(409).json({ mensaje: 'Correo ya registrado' });
    }

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
    console.log('✅ Usuario guardado correctamente:', nuevoUsuario);

    res.status(201).json({ mensaje: 'Usuario registrado con éxito' });
  } catch (error) {
    console.error('❌ Error al guardar usuario:', error);
    res.status(500).json({ mensaje: 'Error al registrar usuario', error });
  }
});

// ✅ Guardar rostro luego del registro
app.patch('/api/usuarios/guardar-rostro/:correo', async (req, res) => {
  const { correo } = req.params;
  const { rostroBase64 } = req.body;

  if (!rostroBase64) {
    return res.status(400).json({ mensaje: 'Falta imagen del rostro' });
  }

  try {
    const usuario = await Usuario.findOneAndUpdate(
      { correo },
      { rostroBase64 },
      { new: true }
    );

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado para guardar rostro' });
    }

    res.status(200).json({ mensaje: 'Rostro guardado correctamente', usuario });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al guardar rostro', error });
  }
});

// ✅ Obtener rostro
app.get('/api/usuarios/rostro/:correo', async (req, res) => {
  const { correo } = req.params;

  try {
    const usuario = await Usuario.findOne({ correo });

    if (!usuario || !usuario.rostroBase64) {
      return res.status(404).json({ mensaje: 'Rostro no encontrado para este usuario' });
    }

    res.status(200).json({ rostroBase64: usuario.rostroBase64 });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener rostro', error });
  }
});

// ✅ Obtener usuario por correo
app.get('/api/usuarios/correo/:correo', async (req, res) => {
  try {
    const usuario = await Usuario.findOne({ correo: req.params.correo });

    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.status(200).json({
      mensaje: 'Usuario encontrado',
      nombre: usuario.nombre,
      correo: usuario.correo,
      direccion: usuario.direccion,
      telefono: usuario.telefono,
      imagen: usuario.imagen,
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al buscar usuario', error });
  }
});

// ✅ Ver todos los usuarios
app.get('/api/usuarios/todos', async (req, res) => {
  try {
    const usuarios = await Usuario.find({}, 'correo biometricoHabilitado');
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar usuarios', error });
  }
});

// ✅ Productos
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

// ✅ Limpieza
app.delete('/eliminar-todos-productos', async (req, res) => {
  try {
    await Producto.deleteMany({});
    res.status(200).json({ mensaje: 'Todos los productos fueron eliminados' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar productos', error });
  }
});

app.delete('/eliminar-productos/:correo', async (req, res) => {
  try {
    await Producto.deleteMany({ correoUsuario: req.params.correo });
    res.status(200).json({ mensaje: `Productos del usuario ${req.params.correo} eliminados` });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar productos del usuario', error });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
