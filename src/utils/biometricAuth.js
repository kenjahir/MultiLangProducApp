import ReactNativeBiometrics from 'react-native-biometrics';

export async function autenticarBiometricamente(tipoForzado = null) {
  const rnBiometrics = new ReactNativeBiometrics();
  const { available } = await rnBiometrics.isSensorAvailable();

  if (!available) {
    return {
      success: false,
      error: 'Tu dispositivo no tiene autenticación biométrica disponible.',
    };
  }

  // Solo usamos el tipo para mostrar mensaje, no para bloquear
  const promptMessage =
    tipoForzado === 'FaceRecognition'
      ? 'Escanea tu rostro para continuar'
      : 'Escanea tu huella para continuar';

  try {
    const result = await rnBiometrics.simplePrompt({
      promptMessage,
      cancelButtonText: 'Cancelar',
    });

    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: 'Autenticación cancelada por el usuario.',
      };
    }
  } catch (error) {
    console.error('❌ Error en autenticación biométrica:', error);
    return {
      success: false,
      error: 'Error al autenticar con biometría.',
    };
  }
}
