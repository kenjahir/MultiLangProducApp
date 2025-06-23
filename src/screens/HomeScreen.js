import React, { useContext, useEffect, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageContext } from '../context/LanguageContext';
import { translations } from '../translations/translations';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

export default function HomeScreen({ navigation }) {
  const { language, toggleLanguage } = useContext(LanguageContext);
  const [photoUri, setPhotoUri] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState('Cargando...');
  const [correoUsuario, setCorreoUsuario] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [products, setProducts] = useState([]);
  const [productoEditando, setProductoEditando] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const {
    title,
    changeLang,
    takePhoto,
    addProduct,
    logout,
    editProfile,
    newProduct,
    save,
    cancel,
    editProduct,
    saveChanges
  } = translations[language];

  const cargarDatos = async () => {
    try {
      const usuarioJSON = await AsyncStorage.getItem('usuario');
      const foto = await AsyncStorage.getItem('fotoPerfilUri');

      if (usuarioJSON) {
        const datos = JSON.parse(usuarioJSON);
        setNombreUsuario(datos.nombre || '');
        setCorreoUsuario(datos.correo || '');

        const response = await fetch(`http://192.168.0.105:3000/productos/${datos.correo}`);
        const productosMongo = await response.json();

        const productosConvertidos = productosMongo.map(p => ({
          id: p._id,
          name: p.name,
          description: p.description,
          image: p.image || null,
        }));

        setProducts(productosConvertidos);
      }

      if (foto) setPhotoUri(foto);
    } catch (error) {
      console.log('Error al cargar datos:', error);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [language]);

  const handlePickFromGallery = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        {
          title: 'Permiso de galería',
          message: 'La app necesita acceder a tus fotos para seleccionar una imagen.',
          buttonPositive: 'Aceptar',
        }
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) return;
    }

    launchImageLibrary({ mediaType: 'photo' }, async (response) => {
      if (!response.didCancel && !response.errorCode && response.assets?.length) {
        const uri = response.assets[0].uri;
        setPhotoUri(uri);
        await AsyncStorage.setItem('fotoPerfilUri', uri);
      }
    });
  };

  const tomarFotoProducto = async (idProducto) => {
    const result = await launchCamera({ mediaType: 'photo' });
    if (!result.didCancel && !result.errorCode && result.assets?.length) {
      const uri = result.assets[0].uri;
      const actualizados = products.map((item) =>
        item.id === idProducto ? { ...item, image: uri } : item
      );
      setProducts(actualizados);
      await guardarProductosMongo(actualizados);
    }
  };

  const guardarPerfil = async () => {
    const nuevosDatos = { nombre: nombreUsuario, correo: correoUsuario };
    await AsyncStorage.setItem('usuario', JSON.stringify(nuevosDatos));
    if (photoUri) await AsyncStorage.setItem('fotoPerfilUri', photoUri);
    await cargarDatos();
    setEditProfileVisible(false);
    Alert.alert('✅ Perfil actualizado');
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('usuario');
    await AsyncStorage.removeItem('fotoPerfilUri');
    navigation.replace('Login');
  };

  const guardarProductosMongo = async (productos) => {
    try {
      const usuario = await AsyncStorage.getItem('usuario');
      const datos = JSON.parse(usuario);
      const productosConFoto = productos.map(p => ({ ...p, correoUsuario: datos.correo }));
      await fetch(`http://192.168.0.105:3000/productos/${datos.correo}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productosConFoto)
      });
    } catch (error) {
      console.error('❌ Error al guardar productos:', error);
    }
  };

  const handleAddProduct = async () => {
    if (newName.trim() === '' || newDesc.trim() === '') {
      Alert.alert('Campos requeridos', 'Completa ambos campos.');
      return;
    }
    const nuevoProducto = {
      id: Date.now().toString(),
      name: { es: newName, en: newName },
      description: { es: newDesc, en: newDesc },
      image: null,
    };
    const nuevosProductos = [...products, nuevoProducto];
    setProducts(nuevosProductos);
    setNewName('');
    setNewDesc('');
    setModalVisible(false);
    await guardarProductosMongo(nuevosProductos);
  };

  const eliminarProducto = async (id) => {
    const actualizados = products.filter(item => item.id !== id);
    setProducts(actualizados);
    await guardarProductosMongo(actualizados);
  };

  const editarProducto = (producto) => {
    setProductoEditando(producto);
    setEditName(typeof producto.name === 'object' ? producto.name[language] : producto.name);
    setEditDesc(typeof producto.description === 'object' ? producto.description[language] : producto.description);
  };

  const guardarEdicion = async () => {
    if (!productoEditando) return;
    const actualizados = products.map(item =>
      item.id === productoEditando.id
        ? {
            ...item,
            name: { ...item.name, [language]: editName },
            description: { ...item.description, [language]: editDesc }
          }
        : item
    );
    setProducts(actualizados);
    setProductoEditando(null);
    await guardarProductosMongo(actualizados);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePickFromGallery} style={styles.avatarContainer}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={{ color: '#777' }}>Seleccionar Foto</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.username}>{nombreUsuario}</Text>
      <Text style={styles.email}>{correoUsuario}</Text>

      <TouchableOpacity style={styles.editButton} onPress={() => setEditProfileVisible(true)}>
        <Text style={styles.buttonText}>{editProfile}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{title}</Text>

      <TouchableOpacity style={styles.button} onPress={toggleLanguage}>
        <Text style={styles.buttonText}>{changeLang}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
        <Text style={styles.buttonText}>{addProduct}</Text>
      </TouchableOpacity>

      <FlatList
        data={products}
        keyExtractor={item => item.id}
        extraData={language}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.name}>{typeof item.name === 'object' ? item.name[language] : item.name}</Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => editarProducto(item)}><Text style={styles.deleteText}>✏️</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => eliminarProducto(item.id)}><Text style={styles.deleteText}>🗑</Text></TouchableOpacity>
              </View>
            </View>
            <Text>{typeof item.description === 'object' ? item.description[language] : item.description}</Text>
            {item.image && (
              <Image source={{ uri: item.image }} style={{ width: '100%', height: 150, marginTop: 10, borderRadius: 8 }} resizeMode="cover" />
            )}
            <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={() => tomarFotoProducto(item.id)}>
              <Text style={styles.buttonText}>{takePhoto}</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={[styles.button, { backgroundColor: '#dc3545' }]} onPress={handleLogout}>
        <Text style={styles.buttonText}>{logout}</Text>
      </TouchableOpacity>

      {/* Modal Agregar */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.name}>{newProduct}</Text>
            <TextInput placeholder="Nombre" value={newName} onChangeText={setNewName} style={styles.input} />
            <TextInput placeholder="Descripción" value={newDesc} onChangeText={setNewDesc} style={styles.input} />
            <TouchableOpacity style={styles.button} onPress={handleAddProduct}><Text style={styles.buttonText}>{save}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ textAlign: 'center', marginTop: 10, color: '#007BFF' }}>{cancel}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Editar */}
      <Modal visible={!!productoEditando} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.name}>{editProduct}</Text>
            <TextInput placeholder="Nombre" value={editName} onChangeText={setEditName} style={styles.input} />
            <TextInput placeholder="Descripción" value={editDesc} onChangeText={setEditDesc} style={styles.input} />
            <TouchableOpacity style={styles.button} onPress={guardarEdicion}><Text style={styles.buttonText}>{saveChanges}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setProductoEditando(null)}><Text style={{ textAlign: 'center', marginTop: 10, color: '#007BFF' }}>{cancel}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Perfil */}
      <Modal visible={editProfileVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.name}>{editProfile}</Text>
            <TextInput placeholder="Nombre" value={nombreUsuario} onChangeText={setNombreUsuario} style={styles.input} />
            <TextInput placeholder="Correo" value={correoUsuario} onChangeText={setCorreoUsuario} style={styles.input} />
            <TouchableOpacity style={styles.button} onPress={guardarPerfil}><Text style={styles.buttonText}>{save}</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setEditProfileVisible(false)}><Text style={{ textAlign: 'center', marginTop: 10, color: '#007BFF' }}>{cancel}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f2f2f2' },
  title: { fontSize: 22, fontWeight: 'bold', marginVertical: 16, color: '#333' },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  deleteText: { fontSize: 18, color: '#dc3545', marginLeft: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    backgroundColor: '#fff',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
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
  avatarContainer: {
    alignSelf: 'center',
    marginVertical: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 60,
    backgroundColor: '#ccc',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 60,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  email: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    width: 150,
    alignSelf: 'center',
  },
});
