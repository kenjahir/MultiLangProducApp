import { Alert } from 'react-native';
import { launchCamera } from 'react-native-image-picker';

/**
 * Compara dos cadenas base64 simples comparando sus primeros caracteres.
 */
function compararBase64Simple(img1, img2) {
  if (!img1 || !img2) return false;

  const b1 = img1.replace(/^data:image\/\w+;base64,/, '');
  const b2 = img2.replace(/^data:image\/\w+;base64,/, '');

  const len = Math.min(b1.length, b2.length, 5000); // compara solo los primeros 5000 caracteres
  let iguales = 0;

  for (let i = 0; i < len; i++) {
    if (b1[i] === b2[i]) iguales++;
  }

  const similitud = (iguales / len) * 100;
  console.log(`📊 Similitud de imágenes: ${similitud.toFixed(2)}%`);

  return similitud >= 90 ; // Puedes ajustar el porcentaje según necesidad
}
/**
 * Valida el rostro del usuario mediante una selfie capturada al momento.
 * @param {string} correo - El correo del usuario para buscar su selfie registrada.
 * @returns {Object} - { success: true } si el rostro coincide, o { success: false, error: '...' }
 */
export async function validarRostroConSelfie(correo) {
  try {
    const result = await launchCamera({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.6,
      cameraType: 'front',
    });

    if (result.didCancel || !result.assets || result.assets.length === 0) {
      return { success: false, error: 'Captura cancelada' };
    }

    const { base64 } = result.assets[0];
    const base64Actual = `data:image/jpeg;base64,${base64}`;

    const response = await fetch(`http://192.168.0.105:3000/api/usuarios/rostro/${correo}`);
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error('❌ Respuesta inválida del backend:', text);
      return { success: false, error: 'Respuesta no válida del servidor. Posible error en el backend.' };
    }

    if (!response.ok || !data.rostroBase64) {
      return { success: false, error: 'No hay rostro registrado para este usuario' };
    }

    const base64Guardado = data.rostroBase64;
    const sonIguales = compararBase64Simple(base64Actual, base64Guardado);

    if (!sonIguales) {
      return { success: false, error: 'Rostro no coincide con el registrado' };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error en validación de rostro:', error);
    return { success: false, error: 'Error inesperado en validación facial' };
  }
}
