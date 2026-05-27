import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { loginUser } from '../../services/auth';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
  if (!email.trim() || !password.trim()) {
    Alert.alert('Error', 'Por favor ingresa email y contraseña');
    return;
  }

  setLoading(true);
  const result = await loginUser(email, password);
  setLoading(false);

  if (result.success) {
    // ✅ Navegar a Main dentro de tabs
    router.replace('/(tabs)/Main');
  } else {
    Alert.alert('Error', result.error || 'No se pudo iniciar sesión');
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <ImageBackground
        source={require('../../assets/images/c.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.content}>
              {/* Logo */}
              <View style={styles.logoContainer}>
                <Text style={styles.logoEmoji}>🙊</Text>
                <Text style={styles.logoText}>CokoNotion</Text>
                <Text style={styles.logoSubtext}>Organiza tu estudio, mejora tu disciplina</Text>
              </View>

              {/* Formulario */}
              <View style={styles.form}>
                <Text style={styles.title}>Iniciar Sesión</Text>

                <TextInput
                  style={styles.input}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                <TouchableOpacity
                  style={styles.loginButton}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.loginButtonText}>Ingresar</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.push('/register')}
                  style={styles.registerLink}
                >
                  <Text style={styles.registerLinkText}>
                    ¿No tienes cuenta? <Text style={styles.registerLinkBold}>Regístrate</Text>
                  </Text>
                </TouchableOpacity>

                
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  logoSubtext: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    backgroundColor: '#8c8c8c',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  registerLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  registerLinkText: {
    color: '#666',
    fontSize: 14,
  },
  registerLinkBold: {
    color: '#b5b5b5',
    fontWeight: '600',
  },
  forgotText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
      marginTop: 12,
    },
});

export default LoginScreen;