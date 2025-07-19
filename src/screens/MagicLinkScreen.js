import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

const MagicLinkScreen = () => {
  const [correo, setCorreo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [contador, setContador] = useState(0);
  const navigation = useNavigation();

  const BASE_URL = 'http://192.168.0.105:3000';

  useEffect(() => {
    const recuperarCorreo = async () => {
      const guardado = await AsyncStorage.getItem('correo_magiclink');
      if (guardado) setCorreo(guardado);
    };
    recuperarCorreo();
  }, []);

  useEffect(() => {
    let interval;
    if (contador > 0) {
      interval = setInterval(() => {
        setContador(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [contador]);

  const enviarMagicLink = async () => {
    if (!correo || !correo.includes('@')) {
      Alert.alert('Correo inválido', 'Por favor ingresa un correo válido.');
      return;
    }

    try {
      setCargando(true);
      await AsyncStorage.setItem('correo_magiclink', correo.trim());

      const res = await axios.post(
        `${BASE_URL}/api/magic-link/enviar`,
        { correo: correo.trim() },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.status === 200) {
        setEnviado(true);
        setContador(30);
        Alert.alert('✅ Éxito', 'Revisa tu correo para iniciar sesión.');
      }
    } catch (error) {
      console.error('❌ Error al enviar magic link:', error);
      Alert.alert(
        'Error',
        error.response?.data?.mensaje || 'No se pudo enviar el enlace. Intenta de nuevo.'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#EAF0FF' }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.title}>🔐 Ingreso por Magic Link</Text>

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            keyboardType="email-address"
            autoCapitalize="none"
            value={correo}
            onChangeText={setCorreo}
            editable={!cargando}
          />

          {cargando ? (
            <ActivityIndicator size="large" color="#007AFF" style={{ marginVertical: 20 }} />
          ) : (
            <Pressable
              onPress={enviarMagicLink}
              style={({ pressed }) => [
                styles.boton,
                {
                  backgroundColor: contador > 0 ? '#A0A0A0' : pressed ? '#005BEA' : '#007BFF',
                }
              ]}
              disabled={contador > 0}
            >
              <Text style={styles.botonTexto}>
                {contador > 0
                  ? `⏳ Espera ${contador}s`
                  : enviado
                  ? '📩 Reenviar Magic Link'
                  : '📨 Enviar Magic Link'}
              </Text>
            </Pressable>
          )}

          {enviado && (
            <View style={styles.iconoExito}>
              <Icon name="checkmark-circle-outline" size={40} color="green" />
              <Text style={styles.success}>
                ¡Correo enviado! Verifica tu bandeja principal o spam para continuar.
              </Text>
            </View>
          )}

          <Pressable onPress={() => navigation.goBack()} style={styles.volver}>
            <Icon name="arrow-back" size={20} color="#007AFF" />
            <Text style={styles.volverTexto}> Volver al inicio de sesión</Text>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default MagicLinkScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 25
  },
  title: {
    fontSize: 26,
    marginBottom: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1A2A40'
  },
  input: {
    borderWidth: 1,
    borderColor: '#AAA',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 20
  },
  boton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10
  },
  botonTexto: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  success: {
    marginTop: 12,
    paddingHorizontal: 10,
    color: '#28a745',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16
  },
  iconoExito: {
    marginTop: 20,
    alignItems: 'center'
  },
  volver: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  volverTexto: {
    color: '#007AFF',
    fontSize: 16
  }
});
