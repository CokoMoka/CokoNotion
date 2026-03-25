import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
    ImageBackground,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    Modal,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Colors, getFontFamily } from '../../constants/theme';
import { updateUserProfile, logoutUser, deleteCurrentAccount   } from '../../services/auth';
import { useRouter } from 'expo-router';
import { useUser } from '../../hooks/useUser';
import { reauthenticateUser } from '../../services/auth';

const ProfileScreen = () => {
  const { user, loading: userLoading, refreshUser } = useUser();
  
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [modoOscuro, setModoOscuro] = useState(true);
  const [notificaciones, setNotificaciones] = useState(true);
  const [recordatorios, setRecordatorios] = useState(true);
  const [sonidos, setSonidos] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [saving, setSaving] = useState(false);

  const theme = Colors.light;
  const router = useRouter();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
const [deletePassword, setDeletePassword] = useState('');
const [deleting, setDeleting] = useState(false);
  
  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  // Cargar datos del usuario desde el hook
  useEffect(() => {
    if (user) {
      setNombre(user.displayName || "");
      setEmail(user.email);
      setModoOscuro(user.modoOscuro ?? true);
      setNotificaciones(user.notificaciones ?? true);
      setRecordatorios(user.recordatorios ?? true);
      setSonidos(user.sonidos ?? false);
    }
  }, [user]);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
const [passwordForVerification, setPasswordForVerification] = useState('');
const [pendingEmail, setPendingEmail] = useState('');


  const handleGuardar = async () => {
  if (!nombre.trim()) {
    Alert.alert("Campo requerido", "Debes ingresar tu nombre.");
    return;
  }

  if (!email.trim() || !email.includes('@')) {
    Alert.alert("Campo requerido", "Debes ingresar un email válido.");
    return;
  }

  // ✅ Si se va a cambiar el email, pedir contraseña con modal
  if (email !== user?.email) {
    setPendingEmail(email);
    setShowPasswordModal(true);
  } else {
    await realizarActualizacion();
  }
};

const realizarActualizacion = async () => {
  if (!user) {
    Alert.alert("Error", "No hay usuario autenticado");
    return;
  }

  setSaving(true);

  const result = await updateUserProfile(user.uid, {
    displayName: nombre.trim(),
    email: email.trim(),
    modoOscuro,
    notificaciones,
    recordatorios,
    sonidos,
  });

  setSaving(false);

  if (result.success) {
    setModoEdicion(false);
    Alert.alert("Éxito", "Perfil actualizado correctamente");
    refreshUser(); // Refrescar el hook
  } else {
    Alert.alert("Error", result.error || "No se pudo actualizar el perfil");
  }
};

const handlePasswordVerification = async () => {
  if (!passwordForVerification.trim()) {
    Alert.alert("Error", "Debes ingresar tu contraseña");
    return;
  }

  const reauthResult = await reauthenticateUser(passwordForVerification);
  
  if (reauthResult.success) {
    setShowPasswordModal(false);
    setPasswordForVerification('');
    await realizarActualizacion();
  } else {
    Alert.alert("Error", reauthResult.error || "No se pudo verificar tu identidad");
    setPasswordForVerification('');
  }
};

  const handleLogout = async () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            const result = await logoutUser();
            if (result.success) {
              router.replace('/(auth)/login');
            } else {
              Alert.alert("Error", result.error || "No se pudo cerrar sesión");
            }
          },
        },
      ]
    );
  };

  // ProfileScreen.tsx - Después de handleLogout
const handleDeleteAccount = async () => {
  if (!deletePassword.trim()) {
    Alert.alert("Error", "Debes ingresar tu contraseña para eliminar la cuenta");
    return;
  }

  setDeleting(true);
  
  const result = await deleteCurrentAccount(deletePassword);
  
  setDeleting(false);
  
  if (result.success) {
    Alert.alert(
      "Cuenta eliminada",
      "Tu cuenta ha sido eliminada correctamente. Serás redirigido al inicio.",
      [
        { 
          text: "OK", 
          onPress: () => router.replace('/(auth)/login') 
        }
      ]
    );
  } else {
    Alert.alert("Error", result.error || "No se pudo eliminar la cuenta");
    setDeletePassword('');
  }
};

  const stats = [
    { label: 'Días activos', value: '156', icon: '📅' },
    { label: 'Racha máxima', value: '23', icon: '🔥' },
    { label: 'Notas creadas', value: '89', icon: '📝' },
    { label: 'Flashcards', value: '234', icon: '🎴' },
  ];

  if (userLoading) {
    return (
      <SafeAreaProvider>
        <ImageBackground
          source={require('../../assets/images/bD.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.bearPrimary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Cargando perfil...
                </Text>
              </View>
            </SafeAreaView>
          </View>
        </ImageBackground>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ImageBackground
        source={require('../../assets/images/bD.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" />
            
            <ScrollView 
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.container}>
                {/* BANNER */}
                <View style={styles.bannerWrapper}>
                  <View style={styles.bannerContainer}>
                    <Image
                      source={require('../../assets/images/aD.jpg')}
                      style={styles.bannerImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', theme.background]}
                      style={styles.bannerGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    />
                  </View>
                </View>

                {/* AVATAR Y BOTÓN DE EDICIÓN */}
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarEmoji}>🧸</Text>
                  </View>
                  {!modoEdicion && (
                    <TouchableOpacity 
                      style={[styles.editAvatarButton, { borderColor: theme.text }]}
                      onPress={() => setModoEdicion(true)}
                    >
                      <Text style={[styles.editAvatarText, { color: theme.text }]}>Editar</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* MODO EDICIÓN / VISUALIZACIÓN */}
                {modoEdicion ? (
                  // FORMULARIO DE EDICIÓN
                  <View style={[styles.editCard, { 
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  }]}>
                    <Text style={[styles.editTitle, { color: '#ffffff' }, font('rounded')]}>
                      Editar Perfil
                    </Text>

                    <Text style={[styles.label, { color: theme.textSecondary }, font('sans')]}>
                      Nombre
                    </Text>
                    <TextInput
                      style={[styles.input, { 
                        color: theme.text,
                        borderColor: theme.border,
                      }, font('sans')]}
                      value={nombre}
                      onChangeText={setNombre}
                      placeholder="Tu nombre"
                      placeholderTextColor={theme.textMuted}
                    />


                    <View style={styles.buttonRow}>
                      <TouchableOpacity 
                        style={[styles.saveButton, { backgroundColor: theme.bearPrimary }]}
                        onPress={handleGuardar}
                        disabled={saving}
                      >
                        <Text style={[styles.saveButtonText, { color: '#ffffff' }, font('rounded')]}>
                          {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.cancelButton, { borderColor: theme.border }]}
                        onPress={() => {
                          setModoEdicion(false);
                          // Restaurar datos originales desde el user
                          if (user) {
                            setNombre(user.displayName || "");
                            setEmail(user.email);
                            setModoOscuro(user.modoOscuro ?? true);
                            setNotificaciones(user.notificaciones ?? true);
                            setRecordatorios(user.recordatorios ?? true);
                            setSonidos(user.sonidos ?? false);
                          }
                        }}
                      >
                        <Text style={[styles.cancelButtonText, { color: theme.textSecondary }, font('sans')]}>
                          Cancelar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  // DATOS DEL PERFIL
                  <>
                    <Text style={[styles.userName, { color: '#ffffff' }, font('rounded')]}>
                      {nombre || "Estudiante Gloomy"}
                    </Text>
                    <Text style={[styles.userEmail, { color: theme.textSecondary }, font('sans')]}>
                      {email || "estudiante@cokonotion.com"}
                    </Text>
                  </>
                )}

                {/* ESTADÍSTICAS */}
                <View style={styles.statsGrid}>
                  {stats.map((stat, index) => (
                    <View key={index} style={[styles.statCard, { 
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    }]}>
                      <Text style={styles.statIcon}>{stat.icon}</Text>
                      <Text style={[styles.statValue, { color: theme.bearPrimary }, font('rounded')]}>
                        {stat.value}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.textMuted }, font('sans')]}>
                        {stat.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* CONFIGURACIÓN */}
                <Text style={[styles.sectionTitle, { color: '#ffffff' }, font('rounded')]}>
                  Preferencias
                </Text>
                <View style={[styles.settingsCard, { 
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                }]}>
                  <View style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                      <Text style={[styles.settingIcon, { color: theme.bearPrimary }]}>🌙</Text>
                      <View>
                        <Text style={[styles.settingLabel, { color: theme.text }, font('sans')]}>
                          Modo oscuro
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={modoOscuro}
                      onValueChange={setModoOscuro}
                      trackColor={{ false: '#3a3a3a', true: theme.bearPrimary }}
                      thumbColor={modoOscuro ? theme.bearSecondary : '#ffffff'}
                    />
                  </View>

                  <View style={styles.settingDivider} />

                  <View style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                      <Text style={[styles.settingIcon, { color: theme.bearPrimary }]}>🔔</Text>
                      <View>
                        <Text style={[styles.settingLabel, { color: theme.text }, font('sans')]}>
                          Notificaciones
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={notificaciones}
                      onValueChange={setNotificaciones}
                      trackColor={{ false: '#3a3a3a', true: theme.bearPrimary }}
                      thumbColor={notificaciones ? theme.bearSecondary : '#ffffff'}
                    />
                  </View>

                  <View style={styles.settingDivider} />

                  <View style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                      <Text style={[styles.settingIcon, { color: theme.bearPrimary }]}>⏰</Text>
                      <View>
                        <Text style={[styles.settingLabel, { color: theme.text }, font('sans')]}>
                          Recordatorios
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={recordatorios}
                      onValueChange={setRecordatorios}
                      trackColor={{ false: '#3a3a3a', true: theme.bearPrimary }}
                      thumbColor={recordatorios ? theme.bearSecondary : '#ffffff'}
                    />
                  </View>

                  <View style={styles.settingDivider} />

                  <View style={styles.settingItem}>
                    <View style={styles.settingLeft}>
                      <Text style={[styles.settingIcon, { color: theme.bearPrimary }]}>🔊</Text>
                      <View>
                        <Text style={[styles.settingLabel, { color: theme.text }, font('sans')]}>
                          Sonidos
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={sonidos}
                      onValueChange={setSonidos}
                      trackColor={{ false: '#3a3a3a', true: theme.bearPrimary }}
                      thumbColor={sonidos ? theme.bearSecondary : '#ffffff'}
                    />
                  </View>
                </View>

                {/* Botón Cerrar Sesión */}
                <TouchableOpacity 
                  style={[styles.logoutButton, { borderColor: theme.bearLight, backgroundColor: theme.bearPrimary }]}
                  onPress={handleLogout}
                >
                  <Text style={[styles.logoutText, { color: theme.bearSecondary }, font('rounded')]}>
                    Cerrar Sesión
                  </Text>
                </TouchableOpacity>

                {/* Botón Eliminar Cuenta */}
<TouchableOpacity 
  style={[styles.deleteButton, { borderColor: '#ff4444' }]}
  onPress={() => setShowDeleteModal(true)}
>
  <Text style={[styles.deleteButtonText, { color: '#ff4444' }, font('rounded')]}>
    Eliminar Cuenta
  </Text>
</TouchableOpacity>

{/* Versión */}
<Text style={[styles.versionText, { color: theme.textMuted }, font('sans')]}>
  Versión 1.0.0
</Text>

{/* Modal para confirmar eliminación de cuenta */}
<Modal
  visible={showDeleteModal}
  transparent
  animationType="fade"
  onRequestClose={() => {
    setShowDeleteModal(false);
    setDeletePassword('');
  }}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.modalTitle, { color: theme.text }, font('rounded')]}>
        ⚠️ Eliminar Cuenta
      </Text>
      <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
        Esta acción es irreversible. Se eliminarán todos tus datos:
      </Text>
      <View style={styles.deleteInfoList}>
        <Text style={[styles.deleteInfoItem, { color: theme.textSecondary }]}>• Notas y tareas</Text>
        <Text style={[styles.deleteInfoItem, { color: theme.textSecondary }]}>• Flashcards</Text>
        <Text style={[styles.deleteInfoItem, { color: theme.textSecondary }]}>• Estadísticas</Text>
        <Text style={[styles.deleteInfoItem, { color: theme.textSecondary }]}>• Datos de perfil</Text>
      </View>
      
      <Text style={[styles.modalSubtitle, { color: theme.textSecondary, marginTop: 10 }]}>
        Para confirmar, ingresa tu contraseña:
      </Text>
      
      <TextInput
        style={[styles.modalInput, { 
          color: theme.text,
          borderColor: theme.border,
          backgroundColor: theme.background
        }]}
        placeholder="Contraseña"
        placeholderTextColor={theme.textMuted}
        secureTextEntry
        value={deletePassword}
        onChangeText={setDeletePassword}
        autoFocus
      />
      
      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.modalCancelButton]}
          onPress={() => {
            setShowDeleteModal(false);
            setDeletePassword('');
          }}
        >
          <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>
            Cancelar
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modalButton, styles.modalDeleteButton, { backgroundColor: '#ff4444' }]}
          onPress={handleDeleteAccount}
          disabled={deleting}
        >
          <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

                {/* Versión */}
                <Text style={[styles.versionText, { color: theme.textMuted }, font('sans')]}>
                  Versión 1.0.0
                </Text>
              </View>
              {/* Modal para verificar contraseña */}
<Modal
  visible={showPasswordModal}
  transparent
  animationType="fade"
  onRequestClose={() => {
    setShowPasswordModal(false);
    setPasswordForVerification('');
  }}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.modalTitle, { color: theme.text }, font('rounded')]}>
        Verificación de seguridad
      </Text>
      <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
        Para cambiar tu correo a "{pendingEmail}", por favor ingresa tu contraseña actual.
      </Text>
      
      <TextInput
        style={[styles.modalInput, { 
          color: theme.text,
          borderColor: theme.border,
          backgroundColor: theme.background
        }]}
        placeholder="Contraseña"
        placeholderTextColor={theme.textMuted}
        secureTextEntry
        value={passwordForVerification}
        onChangeText={setPasswordForVerification}
        autoFocus
      />
      
      <View style={styles.modalButtons}>
        <TouchableOpacity 
          style={[styles.modalButton, styles.modalCancelButton]}
          onPress={() => {
            setShowPasswordModal(false);
            setPasswordForVerification('');
          }}
        >
          <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>
            Cancelar
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.modalButton, styles.modalConfirmButton, { backgroundColor: theme.bearPrimary }]}
          onPress={handlePasswordVerification}
        >
          <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
            Confirmar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  bannerWrapper: {
    marginHorizontal: -20,
    marginBottom: 0,
  },
  bannerContainer: {
    height: 200,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bannerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginTop: -50,
    marginBottom: 15,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#df96c0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    marginBottom: 8,
  },
  avatarEmoji: {
    fontSize: 50,
  },
  editAvatarButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15,
    borderWidth: 1,
  },
  editAvatarText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  userEmail: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 25,
  },
  editCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
  },
  editTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  saveButton: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  settingsCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 25,
    borderWidth: 1,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 22,
    width: 40,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#333333',
    marginVertical: 8,
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 15,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(223, 150, 192, 0.05)',
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '600',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 10,
  },
  // Agregar al final de styles
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContainer: {
  width: '85%',
  borderRadius: 20,
  padding: 20,
  borderWidth: 1,
},
modalTitle: {
  fontSize: 20,
  fontWeight: '600',
  textAlign: 'center',
  marginBottom: 10,
},
modalSubtitle: {
  fontSize: 14,
  textAlign: 'center',
  marginBottom: 20,
  lineHeight: 20,
},
modalInput: {
  borderWidth: 1,
  borderRadius: 12,
  padding: 14,
  fontSize: 16,
  marginBottom: 20,
},
modalButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 12,
},
modalButton: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 12,
  alignItems: 'center',
},
modalCancelButton: {
  borderWidth: 1,
  borderColor: '#333',
},
modalConfirmButton: {
  borderWidth: 1,
},
modalButtonText: {
  fontSize: 16,
  fontWeight: '500',
},
// Agregar al StyleSheet
deleteButton: {
  alignItems: 'center',
  paddingVertical: 16,
  marginBottom: 15,
  borderRadius: 20,
  borderWidth: 1,
  backgroundColor: 'rgba(255, 68, 68, 0.05)',
},
deleteButtonText: {
  fontSize: 18,
  fontWeight: '600',
},
deleteInfoList: {
  marginVertical: 10,
  paddingLeft: 10,
},
deleteInfoItem: {
  fontSize: 14,
  marginVertical: 4,
},
modalDeleteButton: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 12,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#ff4444',
},
});

export default ProfileScreen;