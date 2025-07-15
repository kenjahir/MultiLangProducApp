const mongoose = require('mongoose');

const UsuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  clave: { type: String, required: true },
  direccion: { type: String, required: true },
  telefono: { type: String, required: true },
  imagen: { type: String, required: true },
  biometricoHabilitado: { type: Boolean, default: false },
  rostroBase64: { type: String, required: false }, 
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
