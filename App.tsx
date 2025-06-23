import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MapaDireccionScreen from './src/screens/MapaDireccionScreen';

import { LanguageProvider } from './src/context/LanguageContext';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: undefined;
  Register: undefined;
  MapaDireccionScreen: { regresarA: 'Register' | 'Profile' } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <LanguageProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Listado de Productos' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mi Perfil' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registro de Usuario' }} />
          <Stack.Screen name="MapaDireccionScreen" component={MapaDireccionScreen} options={{ title: 'Seleccionar Dirección' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </LanguageProvider>
  );
}