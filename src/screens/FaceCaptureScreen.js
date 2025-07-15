import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function FaceCaptureScreen({ navigation }) {
  const seleccionarImagen = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        includeBase64: true,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        Alert.alert('Cancelado', 'No se seleccionó ninguna imagen.');
        return;
      }

      const base64 = result.assets?.[0]?.base64;
      if (!base64) {
        Alert.alert('Error', 'No se pudo obtener la imagen.');
        return;
      }

      const base64Imagen = `data:image/jpeg;base64,${base64}`;

      await AsyncStorage.setItem('faceImage', base64Imagen);

      Alert.alert('✅ Selfie guardada', 'Tu rostro fue guardado localmente para el registro.');
      navigation.goBack();
    } catch (error) {
      console.error('❌ Error al guardar selfie localmente:', error);
      Alert.alert('Error', 'Ocurrió un problema al guardar la selfie.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Selecciona una selfie</Text>
      <Text style={styles.subtitle}>Desde tu galería</Text>

      <TouchableOpacity style={styles.button} onPress={seleccionarImagen}>
        <Text style={styles.buttonText}>📁 Elegir imagen</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
