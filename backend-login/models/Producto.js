const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
  name: {
    es: String,
    en: String
  },
  description: {
    es: String,
    en: String
  },
  image: String,
  correoUsuario: String
});

module.exports = mongoose.model('Producto', productoSchema);