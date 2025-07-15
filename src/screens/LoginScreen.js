import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { autenticarBiometricamente } from '../utils/biometricAuth';
import ReactNativeBiometrics from 'react-native-biometrics';
import { validarRostroConSelfie } from '../utils/validateFace'; // ✅ Usamos la nueva función

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [biometryType, setBiometryType] = useState(null);

  useEffect(() => {
    const checkBiometry = async () => {
      const rnBiometrics = new ReactNativeBiometrics();
      const { available, biometryType: tipoDetectado } = await rnBiometrics.isSensorAvailable();
      if (available) setBiometryType(tipoDetectado);
    };
    checkBiometry();
  }, []);

  const handleLogin = async () => {
    const correoLimpio = email.trim().toLowerCase();
    if (!correoLimpio || !password.trim()) {
      Alert.alert('Campos vacíos', 'Ingresa tu correo y contraseña.');
      return;
    }

    try {
      const response = await fetch('http://192.168.194.91:3000/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: correoLimpio, clave: password }),
      });

      const data = await response.json();

      if (response.status === 200) {
        const usuario = {
          nombre: data.nombre || 'Usuario',
          correo: correoLimpio,
        };

        await AsyncStorage.setItem('usuario', JSON.stringify(usuario));
        await AsyncStorage.removeItem('sesionCerrada');

        await fetch(`http://192.168.194.91:3000/api/usuarios/activar-biometrico/${correoLimpio}`, {
          method: 'PATCH',
        });

        Alert.alert('✅ Bienvenido', data.mensaje || 'Inicio de sesión exitoso');
        setTimeout(() => navigation.replace('Home'), 500);
      } else {
        Alert.alert('❌ Error', data.mensaje || 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error de red', 'No se pudo conectar con el servidor');
    }
  };

  const handleLoginWithSelfie = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('usuario');
      if (!storedUser) {
        Alert.alert('⚠️ Sesión no detectada', 'Primero inicia sesión manual al menos una vez.');
        return;
      }

      const { correo } = JSON.parse(storedUser);
      const correoLimpio = correo.trim().toLowerCase();

      const resultado = await validarRostroConSelfie(correoLimpio); // ✅ Cambio aquí

      if (resultado.success) {
        Alert.alert('✅ Rostro reconocido', 'Bienvenido de nuevo');
        navigation.replace('Home');
      } else {
        Alert.alert('❌ Error', resultado.error || 'No se pudo autenticar con selfie');
      }
    } catch (err) {
      console.error('❌ Selfie login error:', err);
      Alert.alert('Error', 'No se pudo iniciar sesión con selfie');
    }
  };

  const handleBiometricLogin = async (tipo) => {
    if (tipo === 'FaceRecognition' && biometryType !== 'FaceRecognition') {
      Alert.alert('⚠️ Face ID no disponible', 'Tu dispositivo no tiene sensor de rostro.');
      return;
    }

    const result = await autenticarBiometricamente(tipo);
    if (!result.success) {
      Alert.alert('❌ Falló la autenticación', result.error || 'No se pudo autenticar');
      return;
    }

    try {
      const storedUser = await AsyncStorage.getItem('usuario');
      if (!storedUser) {
        Alert.alert('⚠️ Sin sesión previa', 'Primero inicia sesión manual para usar biometría.');
        return;
      }

      const { correo } = JSON.parse(storedUser);
      const correoLimpio = correo.trim().toLowerCase();

      const res = await fetch(`http://192.168.0.104:3000/api/usuarios/huella/${correoLimpio}`);
      const data = await res.json();

      if (res.ok && data.biometricoHabilitado) {
        Alert.alert('✅ Reconocido', 'Bienvenido nuevamente');
        navigation.replace('Home');
      } else {
        Alert.alert('⚠️ No activado', 'Tu cuenta aún no tiene biometría activada.');
      }
    } catch (err) {
      console.error('❌ Error validando biometría:', err);
      Alert.alert('Error', 'No se pudo validar la biometría');
    }
  };

  const irARegistro = () => navigation.navigate('Register');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar Sesión</Text>

      <TextInput
        placeholder="Correo electrónico"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Contraseña"
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
          secureTextEntry={secureText}
        />
        <TouchableOpacity onPress={() => setSecureText(!secureText)}>
          <Text style={styles.eye}>{secureText ? '👁️' : '🙈'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Ingresar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#28a745' }]}
        onPress={() => handleBiometricLogin('Fingerprint')}
      >
        <Text style={styles.buttonText}>Ingresar con huella</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#6f42c1' }]}
        onPress={() => handleBiometricLogin('FaceRecognition')}
      >
        <Text style={styles.buttonText}>Ingresar con Face ID</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#da1627ff' }]}
        onPress={handleLoginWithSelfie}
      >
        <Text style={styles.buttonText}>Ingresar con Selfie </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={irARegistro} style={styles.linkContainer}>
        <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 30, backgroundColor: '#f2f2f2' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 40, textAlign: 'center', color: '#333' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  passwordInput: { flex: 1, paddingVertical: 12 },
  eye: { fontSize: 20, paddingHorizontal: 10 },
  button: {
    backgroundColor: '#007BFF',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkContainer: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#007BFF', fontWeight: 'bold' },
});
