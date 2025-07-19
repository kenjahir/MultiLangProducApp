import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const [nombre, setNombre] = useState('Juan Pérez');
  const [correo, setCorreo] = useState('juan@example.com');
  const [clave, setClave] = useState('123456');
  const [verClave, setVerClave] = useState(false);
  const [foto, setFoto] = useState('https://i.pravatar.cc/150?img=3');
  const [direccion, setDireccion] = useState('');

  useEffect(() => {
    if ((route as any).params?.direccionSeleccionada) {
      const coords = (route as any).params.direccionSeleccionada;
      const texto = `Lat: ${coords.latitude.toFixed(5)}, Lon: ${coords.longitude.toFixed(5)}`;
      setDireccion(texto);
    }
  }, [route]);

  // ✅ Verifica si hay rostro luego de volver de FaceCapture
  useEffect(() => {
    const guardarRostro = async () => {
      try {
        const rostro = await AsyncStorage.getItem('faceImage');
        if (rostro) {
          const correoLimpio = correo.trim().toLowerCase();
          const res = await fetch(`http://192.168.0.105:3000/api/usuarios/guardar-rostro/${correoLimpio}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rostroBase64: rostro })
          });

          if (res.ok) {
            console.log('📸 Rostro actualizado correctamente');
            Alert.alert('✅ Rostro actualizado', 'Tu selfie fue guardada exitosamente');
            await AsyncStorage.removeItem('faceImage'); // Limpia después de guardar
          } else {
            console.warn('⚠️ Error al guardar rostro desde perfil');
          }
        }
      } catch (error) {
        console.error('❌ Error al actualizar rostro en perfil:', error);
      }
    };

    guardarRostro();
  }, [route]);

  const handleGuardar = () => {
    Alert.alert('✅ Cambios guardados');
    // Aquí se podría hacer un fetch PUT para guardar cambios de perfil
  };

  const irAMapa = () => {
    (navigation as any).navigate('MapaDireccionScreen', { regresarA: 'Profile' });
  };

  const irACaptura = () => {
    (navigation as any).navigate('FaceCapture');
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: foto }} style={styles.avatar} />

      <Text style={styles.label}>Nombre</Text>
      <TextInput style={styles.input} value={nombre} onChangeText={setNombre} />

      <Text style={styles.label}>Correo</Text>
      <TextInput
        style={styles.input}
        value={correo}
        onChangeText={setCorreo}
        keyboardType="email-address"
      />

      <Text style={styles.label}>Contraseña</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={clave}
          onChangeText={setClave}
          placeholder="Contraseña"
          secureTextEntry={!verClave}
        />
        <TouchableOpacity style={styles.eyeButton} onPress={() => setVerClave(!verClave)}>
          <Text style={styles.mapButtonText}>{verClave ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Dirección</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={direccion}
          placeholder="Selecciona en el mapa"
          editable={false}
        />
        <TouchableOpacity style={styles.mapButton} onPress={irAMapa}>
          <Text style={styles.mapButtonText}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Botón para ir a capturar selfie */}
      <TouchableOpacity style={styles.mapButton} onPress={irACaptura}>
        <Text style={styles.mapButtonText}>📷 Tomar Selfie (rostro)</Text>
      </TouchableOpacity>

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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapButton: {
    marginLeft: 8,
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
  },
  eyeButton: {
    marginLeft: 8,
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 18,
  },
});
