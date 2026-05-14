// app/(tabs)/Perfil.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Image,
  Text,
  TextInput,
  ImageBackground,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../../hooks/useUser";
import { AppImages } from "../../constants/images";
import { getUserAvatar, getUserBanner, getUserBackground } from "../../services/avatarService";
import { updateUserPhrase, getUserPhrase, updateUserProfile, logoutUser, deleteCurrentAccount, reauthenticateUser } from "../../services/auth";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PerfilScreen() {
  const { width, height } = useWindowDimensions();
  const scale = width / 390;
  const s = (value: number) => value * scale;
  const v = (value: number) => value * (height / 844);

  const { user, loading: userLoading, refreshUser } = useUser();
  
  // 🔥 Estado para refresh
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para imágenes
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(true);
  
  // Estados para la frase motivacional
  const [frase, setFrase] = useState('');
  const [autor, setAutor] = useState('');
  const [savingPhrase, setSavingPhrase] = useState(false);
  const [editandoFrase, setEditandoFrase] = useState(false);
  
  // Estados para editar nombre
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [savingName, setSavingName] = useState(false);
  
  // Estados para eliminar cuenta
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  const [userName, setUserName] = useState("Estudiante");

  // Cargar datos
  useEffect(() => {
    if (user?.uid) {
      cargarImagenes();
      cargarFrase();
    }
    if (user?.displayName) {
      setUserName(user.displayName);
      setNuevoNombre(user.displayName);
    }
  }, [user]);

  const cargarImagenes = async () => {
    if (!user?.uid) return;
    setLoadingImages(true);
    
    try {
      const [avatar, banner, background] = await Promise.all([
        getUserAvatar(user.uid),
        getUserBanner(user.uid),
        getUserBackground(user.uid),
      ]);
      
      setAvatarUrl(avatar);
      setBannerUrl(banner);
      setBackgroundUrl(background);
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  // Cargar frase guardada
  const cargarFrase = async () => {
    if (!user?.uid) return;
    const fraseData = await getUserPhrase(user.uid);
    if (fraseData) {
      setFrase(fraseData.frase);
      setAutor(fraseData.autor);
    }
  };

  // 🔥 Función de refresco (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      await cargarImagenes();
      await cargarFrase();
      console.log('✅ Perfil refrescado correctamente');
    } catch (error) {
      console.error('❌ Error al refrescar perfil:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser]);

  // Guardar frase
  const guardarFrase = async () => {
    if (!frase.trim()) {
      Alert.alert('Error', 'La frase no puede estar vacía');
      return;
    }
    
    setSavingPhrase(true);
    const result = await updateUserPhrase(user!.uid, frase.trim(), autor.trim() || undefined);
    setSavingPhrase(false);
    
    if (result.success) {
      setEditandoFrase(false);
      Alert.alert('Éxito', 'Frase actualizada correctamente');
      await refreshUser();
    } else {
      Alert.alert('Error', 'No se pudo guardar la frase');
    }
  };

  // Guardar nuevo nombre
  const guardarNombre = async () => {
    if (!nuevoNombre.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    setSavingName(true);
    
    const result = await updateUserProfile(user!.uid, {
      displayName: nuevoNombre.trim(),
    });
    
    setSavingName(false);
    
    if (result.success) {
      setUserName(nuevoNombre.trim());
      setEditandoNombre(false);
      
      try {
        if (user?.uid) {
          await AsyncStorage.setItem(`userName_${user.uid}`, nuevoNombre.trim());
          console.log('✅ Nombre actualizado en AsyncStorage');
        }
      } catch (error) {
        console.error('Error al guardar nombre en AsyncStorage:', error);
      }
      
      await refreshUser();
      Alert.alert('Éxito', 'Nombre actualizado correctamente');
    } else {
      Alert.alert('Error', result.error || 'No se pudo actualizar el nombre');
      setNuevoNombre(userName);
    }
  };

  // Cerrar sesión
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
              if (user?.uid) {
                await AsyncStorage.removeItem(`userName_${user.uid}`);
              }
              router.replace('/(auth)/login');
            } else {
              Alert.alert("Error", result.error || "No se pudo cerrar sesión");
            }
          },
        },
      ]
    );
  };

  // Eliminar cuenta
  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      Alert.alert("Error", "Debes ingresar tu contraseña para eliminar la cuenta");
      return;
    }

    setDeleting(true);
    const result = await deleteCurrentAccount(deletePassword);
    setDeleting(false);
    
    if (result.success) {
      if (user?.uid) {
        await AsyncStorage.removeItem(`userName_${user.uid}`);
      }
      Alert.alert(
        "Cuenta eliminada",
        "Tu cuenta ha sido eliminada correctamente.",
        [{ text: "OK", onPress: () => router.replace('/(auth)/login') }]
      );
    } else {
      Alert.alert("Error", result.error || "No se pudo eliminar la cuenta");
      setDeletePassword('');
    }
  };

  if (userLoading || loadingImages) {
    return (
      <View style={styles.mainContainer}>
        <ImageBackground
          source={backgroundUrl ? { uri: backgroundUrl } : AppImages.backgroundImg || require('../../assets/images/bD.jpg')}
          style={styles.fullScreenBackground}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#df96c0" />
              <Text style={styles.loadingText}>Cargando perfil...</Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      
      <ImageBackground
        source={backgroundUrl ? { uri: backgroundUrl } : AppImages.backgroundImg || require('../../assets/images/bD.jpg')}
        style={styles.fullScreenBackground}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              // 🔥 AÑADIDO: RefreshControl para pull-to-refresh
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#df96c0', '#FF9F4A']}
                  tintColor="#df96c0"
                  title="Actualizando perfil..."
                  titleColor="#ffffff"
                  progressBackgroundColor="rgba(0,0,0,0.3)"
                />
              }
            >
              <View style={[styles.container, { paddingBottom: v(30) }]}>

                {/* BANNER CON AVATAR */}
                <View style={[styles.bannerSection, { marginBottom: v(20) }]}>
                  <View>
                    <Image
                      source={bannerUrl ? { uri: bannerUrl } : AppImages.banner}
                      resizeMode="cover"
                      style={[styles.bannerImage, { height: s(150), width: '100%' }]}
                    />
                    <View style={[styles.avatarContainer, { bottom: s(-50), marginHorizontal: s(135) }]}>
                      {avatarUrl ? (
                        <Image
                          source={{ uri: avatarUrl }}
                          resizeMode="cover"
                          style={[styles.avatar, { width: s(120), height: s(120), borderRadius: s(105), borderWidth: s(3), marginHorizontal: 'auto' }]}
                        />
                      ) : (
                        <Image
                          source={AppImages.icon}
                          resizeMode="cover"
                          style={[styles.avatar, { width: s(120), height: s(120), borderRadius: s(105), borderWidth: s(3), marginHorizontal: 'auto' }]}
                        />
                      )}
                    </View>
                  </View>
                  
                  {/* NOMBRE EDITABLE */}
                  {editandoNombre ? (
                    <View style={[styles.editNameContainer, { marginTop: s(50), marginHorizontal: s(20) }]}>
                      <TextInput
                        style={[styles.editNameInput, { 
                          fontSize: s(24), 
                          color: "#FFFFFF",
                          textAlign: 'center',
                          borderBottomWidth: 1,
                          borderBottomColor: '#df96c0',
                          paddingVertical: s(5)
                        }]}
                        value={nuevoNombre}
                        onChangeText={setNuevoNombre}
                        placeholder="Tu nombre"
                        placeholderTextColor="#888888"
                        autoFocus
                      />
                      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: s(20), marginTop: v(10) }}>
                        <TouchableOpacity onPress={() => {
                          setEditandoNombre(false);
                          setNuevoNombre(userName);
                        }}>
                          <Text style={{ color: "#888888", fontSize: s(14) }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={guardarNombre} disabled={savingName}>
                          <Text style={{ color: "#df96c0", fontSize: s(14), fontWeight: 'bold' }}>
                            {savingName ? 'Guardando...' : 'Guardar'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => setEditandoNombre(true)}>
                      <Text style={[styles.userName, { fontSize: s(28), marginTop: s(50), marginHorizontal: 'auto' }]}>
                        {userName} ✎𓂃
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  <Text style={[styles.userBio, { fontSize: s(12), marginBottom: v(15), textAlign: 'center', color: "#989898" }]}>
                    {user?.email || "usuario@cokonotion.com"}
                  </Text>
                </View>

                {/* SECCIÓN DE FRASE MOTIVACIONAL */}
                <View style={[styles.phraseCard, {
                  borderRadius: s(20),
                  padding: s(16),
                  marginHorizontal: s(16),
                  marginBottom: v(20),
                  backgroundColor: "rgba(46, 46, 46, 0.95)",
                }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: v(8) }}>
                    <Text style={[styles.phraseLabel, { fontSize: s(14), color: "#b5b5b5", fontWeight: "600" }]}>
                      ၊၊||၊ Frase Motivacional
                    </Text>
                    {!editandoFrase ? (
                      <TouchableOpacity onPress={() => setEditandoFrase(true)}>
                        <Text style={{ fontSize: s(12), color: "#df96c0" }}>Editar</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={guardarFrase} disabled={savingPhrase}>
                        <Text style={{ fontSize: s(12), color: savingPhrase ? "#666" : "#4CAF50" }}>
                          {savingPhrase ? 'Guardando...' : 'Guardar'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  
                  {editandoFrase ? (
                    <>
                      <TextInput
                        placeholder="Ej: La constancia es la clave del éxito..."
                        placeholderTextColor="#888888"
                        value={frase}
                        onChangeText={setFrase}
                        style={[styles.phraseInput, {
                          fontSize: s(14),
                          color: "#FFFFFF",
                          paddingVertical: s(10),
                          paddingHorizontal: s(12),
                          borderRadius: s(12),
                          backgroundColor: "#2a2f34",
                          marginBottom: v(8),
                        }]}
                        multiline
                      />
                      <TextInput
                        placeholder="Autor (opcional)"
                        placeholderTextColor="#888888"
                        value={autor}
                        onChangeText={setAutor}
                        style={[styles.phraseInput, {
                          fontSize: s(12),
                          color: "#FFFFFF",
                          paddingVertical: s(8),
                          paddingHorizontal: s(12),
                          borderRadius: s(12),
                          backgroundColor: "#2a2f34",
                        }]}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={[styles.phraseText, { fontSize: s(16), color: "#FFFFFF", fontStyle: 'italic', textAlign: 'center' }]}>
                        "{frase}"
                      </Text>
                      {autor ? (
                        <Text style={[styles.phraseAuthor, { fontSize: s(12), color: "#b5b5b5", textAlign: 'center', marginTop: v(8) }]}>
                          — {autor}
                        </Text>
                      ) : null}
                    </>
                  )}
                </View>

                {/* BOTÓN EDITAR IMÁGENES */}
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity 
                    style={[styles.actionButton, {
                      borderRadius: s(24),
                      paddingVertical: v(12),
                      marginBottom: v(12),
                      backgroundColor: "#373737",
                    }]} 
                    onPress={() => router.push('/NACADA')}
                  >
                    <Text style={[styles.actionButtonText, { fontSize: s(18), color: "#FFFFFF" }]}>
                       𝄞 Editar Imágenes
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* BOTONES DE ACCIÓN FINAL */}
                <TouchableOpacity 
                  style={[styles.logoutButton, { borderRadius: s(20), paddingVertical: v(14), marginBottom: v(12), marginHorizontal: s(16), backgroundColor: "#CCCCCC" }]} 
                  onPress={handleLogout}
                >
                  <Text style={[styles.logoutText, { fontSize: s(16), color: "#000000", fontWeight: "bold" }]}>
                  ➜] Cerrar Sesión
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.deleteButton, { borderRadius: s(20), paddingVertical: v(14), marginBottom: v(20), marginHorizontal: s(16), backgroundColor: "#2A2A2A" }]} 
                  onPress={() => setShowDeleteModal(true)}
                >
                  <Text style={[styles.deleteText, { fontSize: s(16), color: "#ff8888", fontWeight: "bold" }]}>
                    ⌦ Eliminar Cuenta
                  </Text>
                </TouchableOpacity>
                
                <Text style={[styles.versionText, { fontSize: s(12), color: "#989898", textAlign: "center", marginBottom: v(20) }]}>
                  Versión 1.0.1
                </Text>

              </View>
            </ScrollView>
         
        </View>
      </ImageBackground>

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
          <View style={[styles.modalContainer, { backgroundColor: '#2E2E2E' }]}>
            <Text style={[styles.modalTitle, { color: '#FFFFFF', fontSize: s(18), fontWeight: 'bold' }]}>
              ⚠️ Eliminar Cuenta
            </Text>
            <Text style={[styles.modalSubtitle, { color: '#b5b5b5', fontSize: s(12), marginBottom: v(12) }]}>
              Esta acción es irreversible. Se eliminarán todos tus datos.
            </Text>
            
            <TextInput
              style={[styles.modalInput, { 
                color: '#FFFFFF',
                borderColor: '#343a40',
                backgroundColor: '#1a1a1a',
                borderRadius: s(12),
                padding: s(12),
                marginBottom: v(16),
                fontSize: s(14)
              }]}
              placeholder="Contraseña"
              placeholderTextColor="#888888"
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalCancelButton, { borderColor: '#343a40', padding: s(10), borderRadius: s(10), flex: 1, marginRight: s(8) }]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                }}
              >
                <Text style={[styles.modalButtonText, { color: '#b5b5b5', textAlign: 'center' }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalDeleteButton, { backgroundColor: '#ff4444', padding: s(10), borderRadius: s(10), flex: 1, marginLeft: s(8) }]}
                onPress={handleDeleteAccount}
                disabled={deleting}
              >
                <Text style={[styles.modalButtonText, { color: '#ffffff', textAlign: 'center' }]}>
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  fullScreenBackground: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#FFFFFF' },
  bannerSection: { width: '100%' },
  bannerImage: { width: '100%' },
  avatarContainer: { position: "absolute", justifyContent: "center", alignItems: "center" },
  avatar: { borderColor: '#FFFFFF', backgroundColor: '#111' },
  userName: { color: "#FFFFFF", fontWeight: "bold", textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 },
  userBio: { fontWeight: "500" },
  editNameContainer: { alignItems: 'center' },
  editNameInput: { minWidth: 200, textAlign: 'center' },
  buttonsContainer: { paddingHorizontal: 16, marginTop: -15 },
  actionButton: { alignItems: "center" },
  actionButtonText: { fontWeight: "600" },
  phraseCard: { borderWidth: 1, borderColor: '#343a40' },
  phraseLabel: { fontWeight: "500" },
  phraseInput: { borderWidth: 1, borderColor: '#343a40', textAlignVertical: 'top' },
  phraseText: { fontWeight: "500" },
  phraseAuthor: { fontWeight: "400" },
  logoutButton: { alignItems: "center" },
  logoutText: { fontWeight: "bold" },
  deleteButton: { alignItems: "center" },
  deleteText: { fontWeight: "bold" },
  versionText: { fontWeight: "500" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '85%', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#343a40' },
  modalTitle: { textAlign: 'center', marginBottom: 10 },
  modalSubtitle: { textAlign: 'center', marginBottom: 15 },
  modalInput: { borderWidth: 1 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { alignItems: 'center' },
  modalCancelButton: { borderWidth: 1 },
  modalDeleteButton: {},
  modalButtonText: { fontWeight: '500' },
});