import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { LanguageContext } from '../context/LanguageContext';
import { translations } from '../translations/translations';
import { launchCamera } from 'react-native-image-picker';

const INITIAL_PRODUCTS = [
  {
    id: '1',
    name: { es: 'Manzana', en: 'Apple' },
    description: { es: 'Fruta roja', en: 'Red fruit' },
  },
  {
    id: '2',
    name: { es: 'Leche', en: 'Milk' },
    description: { es: 'Producto lácteo', en: 'Dairy product' },
  },
];

export default function HomeScreen() {
  const { language, toggleLanguage } = useContext(LanguageContext);
  const [photoUri, setPhotoUri] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [products, setProducts] = useState(INITIAL_PRODUCTS);

  const { title, changeLang, takePhoto } = translations[language];

  const handlePhoto = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Permiso para usar la cámara',
            message: 'La app necesita acceso a la cámara para tomar fotos',
            buttonNeutral: 'Preguntar luego',
            buttonNegative: 'Cancelar',
            buttonPositive: 'Aceptar',
          }
        );

        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permiso denegado', 'No se puede acceder a la cámara');
          return;
        }
      }

      const options = {
        mediaType: 'photo',
        saveToPhotos: true,
        cameraType: 'back',
      };

      launchCamera(options, response => {
        if (response.didCancel) {
          console.log('Captura cancelada');
        } else if (response.errorCode) {
          console.log('Error al tomar foto:', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          setPhotoUri(response.assets[0].uri);
        }
      });
    } catch (error) {
      console.log('Error al solicitar permisos:', error);
    }
  };

  const handleAddProduct = () => {
    if (newName.trim() === '' || newDesc.trim() === '') {
      Alert.alert('Campos obligatorios', 'Por favor completa ambos campos.');
      return;
    }

    const nuevoProducto = {
      id: Date.now().toString(),
      name: { es: newName, en: newName },
      description: { es: newDesc, en: newDesc },
    };

    setProducts([...products, nuevoProducto]);
    setNewName('');
    setNewDesc('');
    setModalVisible(false);
  };

  const eliminarProducto = (id) => {
    const actualizados = products.filter(item => item.id !== id);
    setProducts(actualizados);
  };

  const eliminarFoto = () => {
    setPhotoUri(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity style={styles.button} onPress={toggleLanguage}>
        <Text style={styles.buttonText}>{changeLang}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>Agregar Producto</Text>
      </TouchableOpacity>

      <FlatList
        data={products}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{item.name[language]}</Text>
              <TouchableOpacity onPress={() => eliminarProducto(item.id)} style={styles.deleteIcon}>
                <Text style={styles.deleteText}>🗑</Text>
              </TouchableOpacity>
            </View>
            <Text>{item.description[language]}</Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.button} onPress={handlePhoto}>
        <Text style={styles.buttonText}>{takePhoto}</Text>
      </TouchableOpacity>

      {photoUri && (
        <View style={styles.photoContainer}>
          <Image source={{ uri: photoUri }} style={styles.photo} />
          <TouchableOpacity onPress={eliminarFoto} style={styles.deletePhotoIcon}>
            <Text style={styles.deleteText}>🗑</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.name}>Nuevo Producto</Text>

            <TextInput
              placeholder="Nombre"
              value={newName}
              onChangeText={setNewName}
              style={styles.input}
            />
            <TextInput
              placeholder="Descripción"
              value={newDesc}
              onChangeText={setNewDesc}
              style={styles.input}
            />

            <TouchableOpacity style={styles.button} onPress={handleAddProduct}>
              <Text style={styles.buttonText}>Guardar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ textAlign: 'center', marginTop: 10, color: '#007BFF' }}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f2f2f2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  deleteIcon: {
    padding: 4,
  },
  deleteText: {
    fontSize: 18,
    color: '#dc3545',
  },
  photoContainer: {
    marginTop: 16,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  deletePhotoIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fff',
    padding: 4,
    borderRadius: 20,
    elevation: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '90%',
    elevation: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    backgroundColor: '#fff',
  },
});