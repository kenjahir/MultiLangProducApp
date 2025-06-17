import React from 'react';
import { LanguageProvider } from './src/context/LanguageContext';
import HomeScreen from './src/screens/HomeScreen';

const App = () => {
  return (
    <LanguageProvider>
      <HomeScreen />
    </LanguageProvider>
  );
};

export default App;