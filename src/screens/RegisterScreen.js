import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RegisterScreen({ route }) {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [imagen, setImagen] = useState(null);
  const [verClave, setVerClave] = useState(false);
  const [rostroPreview, setRostroPreview] = useState(null);

  useEffect(() => {
    if (route.params?.direccionSeleccionada && isFocused) {
      const coords = route.params.direccionSeleccionada;
      const texto = `Lat: ${coords.latitude.toFixed(5)}, Lon: ${coords.longitude.toFixed(5)}`;
      setDireccion(texto);
    }
  }, [route.params, isFocused]);

  useEffect(() => {
    const obtenerSelfie = async () => {
      const selfie = await AsyncStorage.getItem('faceImage');
      setRostroPreview(selfie);
      console.log('📸 Selfie detectada en pantalla:', selfie?.slice(0, 100));
    };
    obtenerSelfie();
  }, [isFocused]);

  const seleccionarImagen = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.5,
    });

    if (!result.didCancel && result.assets && result.assets.length > 0) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setImagen(base64Image);
    }
  };

  const handleRegistro = async () => {
    if (!nombre || !correo || !clave || !direccion || !telefono || !imagen) {
      Alert.alert('❌ Campos incompletos', 'Por favor completa todos los campos.');
      return;
    }

    const rostro = await AsyncStorage.getItem('faceImage');

    if (!rostro) {
      console.log('⚠️ Selfie no encontrada en AsyncStorage');
      Alert.alert('❌ Selfie no encontrada', 'Debes capturar tu selfie antes de registrarte.');
      return;
    }

    console.log('📤 Enviando selfie al backend (inicio base64):', rostro.slice(0, 100));

    try {
      const response = await fetch('http://192.168.0.105:3000/api/usuarios/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          correo,
          clave,
          direccion,
          telefono,
          imagen,
          rostroBase64: rostro,
        }),
      });

      const data = await response.json();
      console.log('📨 Código de estado:', response.status);
      console.log('📨 Respuesta del servidor:', data);

      if (response.status === 201) {
        Alert.alert('✅ Registrado con éxito');
        await AsyncStorage.removeItem('faceImage');
        navigation.replace('Login');
      } else if (response.status === 409) {
        Alert.alert('⚠️ Correo ya registrado', data.mensaje);
      } else {
        Alert.alert('❌ Error', data.mensaje || 'Error inesperado');
      }
    } catch (error) {
      Alert.alert('❌ Error de red', 'No se pudo conectar al servidor');
      console.error('Error al registrar:', error);
    }
  };

  const irAMapa = () => {
    navigation.navigate('MapaDireccionScreen', { regresarA: 'Register' });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Registro de Usuario</Text>

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
              secureTextEntry={!verClave}
              placeholder="Contraseña"
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setVerClave(!verClave)}
            >
              <Text style={styles.eyeText}>{verClave ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Dirección</Text>
          <TextInput style={styles.input} value={direccion} editable={false} />
          <TouchableOpacity style={styles.mapButton} onPress={irAMapa}>
            <Text style={styles.mapButtonText}>📍 Seleccionar en Mapa</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mapButton} onPress={seleccionarImagen}>
            <Text style={styles.mapButtonText}>🖼️ Seleccionar Imagen de Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mapButton}
            onPress={() => navigation.navigate('FaceCapture')}
          >
            <Text style={styles.mapButtonText}>📷 Tomar Selfie (rostro)</Text>
          </TouchableOpacity>

          {rostroPreview && (
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Previsualización de Selfie</Text>
              <Image source={{ uri: rostroPreview }} style={{ width: 100, height: 100, borderRadius: 50 }} />
            </View>
          )}

          <TouchableOpacity
            style={{ backgroundColor: 'gray', padding: 10, borderRadius: 8, marginBottom: 10 }}
            onPress={async () => {
              await AsyncStorage.removeItem('faceImage');
              setRostroPreview(null);
              Alert.alert('🧹 Selfie eliminada del almacenamiento local');
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Eliminar Selfie Guardada</Text>
          </TouchableOpacity>

          {imagen && (
            <View style={styles.imagenContainer}>
              <Image source={{ uri: imagen }} style={styles.imagenSeleccionada} />
              <TouchableOpacity style={styles.borrarImagenBtn} onPress={() => setImagen(null)}>
                <Text style={styles.borrarImagenText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.registerButton} onPress={handleRegistro}>
            <Text style={styles.registerButtonText}>Registrar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 40,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    marginLeft: 8,
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
  },
  eyeText: {
    fontSize: 18,
    color: '#fff',
  },
  mapButton: {
    backgroundColor: '#17a2b8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: '#28a745',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imagenContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 10,
  },
  imagenSeleccionada: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  borrarImagenBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#dc3545',
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
  },
  borrarImagenText: {
    color: '#fff',
    fontSize: 14,
  },
});
