import React from 'react';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';

export default function MapaDireccionScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const handleMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);
    const destino = route.params?.regresarA || 'Profile';

    navigation.navigate(destino, {
      direccionSeleccionada: data,
    });
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const htmlContent = `
<!DOCTYPE html>
<html>
  <head>
    <title>Mapa</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
    </style>
    <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet/dist/leaflet.js"></script>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var map = L.map('map').setView([-0.9489, -80.7160], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      var marker;

      function onMapClick(e) {
        if (marker) map.removeLayer(marker);
        marker = L.marker(e.latlng).addTo(map);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          latitude: e.latlng.lat,
          longitude: e.latlng.lng
        }));
      }

      map.on('click', onMapClick);
    </script>
  </body>
</html>
`;