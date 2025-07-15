import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MapaDireccionScreen from './src/screens/MapaDireccionScreen';
import FaceCaptureScreen from './src/screens/FaceCaptureScreen'; 

import { LanguageProvider } from './src/context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { autenticarBiometricamente } from './src/utils/biometricAuth';

import ReactNativeBiometrics from 'react-native-biometrics';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: undefined;
  Register: undefined;
  FaceCapture: undefined; 
  MapaDireccionScreen: { regresarA: 'Register' | 'Profile' } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

  useEffect(() => {
    const checkBiometricLogin = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('usuario');
        if (!storedUser) {
          console.warn('🔍 No hay sesión previa. Va a Login.');
          setInitialRoute('Login');
          return;
        }

        const { correo } = JSON.parse(storedUser);
        const correoLimpio = correo.trim().toLowerCase();

        const rnBiometrics = new ReactNativeBiometrics();
        const { available } = await rnBiometrics.isSensorAvailable();

        if (!available) {
          console.warn('⚠️ No hay biometría disponible');
          setInitialRoute('Login');
          return;
        }

        const result = await autenticarBiometricamente();

        if (!result.success) {
          console.warn('🔒 Autenticación biométrica falló:', result.error);
          setInitialRoute('Login');
          return;
        }

        const res = await fetch(`http://192.168.0.104:3000/api/usuarios/huella/${correoLimpio}`);
        const text = await res.text();
        let data;

        try {
          data = JSON.parse(text);
        } catch {
          console.error('❌ No se pudo parsear JSON:', text);
          setInitialRoute('Login');
          return;
        }

        if (res.ok && data?.biometricoHabilitado) {
          console.log('✅ Biometría habilitada. Va a Home.');
          setInitialRoute('Home');
        } else {
          console.warn('⚠️ Biometría no activada en backend. Va a Login.');
          setInitialRoute('Login');
        }
      } catch (error) {
        console.error('❌ Error general en App:', error);
        setInitialRoute('Login');
      }
    };

    checkBiometricLogin();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <LanguageProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Listado de Productos' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mi Perfil' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registro de Usuario' }} />
          <Stack.Screen name="MapaDireccionScreen" component={MapaDireccionScreen} options={{ title: 'Seleccionar Dirección' }} />
          <Stack.Screen name="FaceCapture" component={FaceCaptureScreen} options={{ title: 'Capturar rostro' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </LanguageProvider>
  );
}
