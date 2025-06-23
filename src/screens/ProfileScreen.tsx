import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function ProfileScreen() {
  const [nombre, setNombre] = useState('Juan Pérez');
  const [correo, setCorreo] = useState('juan@example.com');
  const [clave, setClave] = useState('123456');
  const [foto, setFoto] = useState('https://i.pravatar.cc/150?img=3'); // Foto por defecto

  const handleGuardar = () => {
    Alert.alert('✅ Cambios guardados');
    // Aquí se podría hacer un fetch PUT para guardar en backend
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: foto }} style={styles.avatar} />

      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />

      <Text style={styles.label}>Correo</Text>
      <TextInput style={styles.input} value={correo} onChangeText={setCorreo} keyboardType="email-address" />

      <Text style={styles.label}>Contraseña</Text>
      <TextInput style={styles.input} value={clave} onChangeText={setClave} secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={handleGuardar}>
        <Text style={styles.buttonText}>Guardar Cambios</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f2f2f2',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: 30,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});