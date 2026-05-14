// app/ImageTestScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ImageBackground,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { 
  uploadAvatarFromGallery, 
  uploadAvatarFromCamera, 
  getUserAvatar, 
  deleteAvatar,
  uploadBannerFromGallery,
  getUserBanner,
  deleteBanner,
  uploadBackgroundFromGallery,
  getUserBackground,
  deleteBackground,
  uploadCoverFromGallery,
  getUserCover,
  deleteCover,
} from "../services/avatarService";
import { getCurrentUser } from "../services/auth";
import { AppImages } from "../constants/images";

export default function ImageTestScreen() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUserAndImages();
  }, []);

  const loadUserAndImages = async () => {
    const user = getCurrentUser();
    if (user) {
      setUserId(user.uid);
      await loadImages();
    } else {
      Alert.alert("Info", "No hay usuario logueado. Inicia sesión primero.");
    }
  };

  const loadImages = async () => {
    if (!userId) return;
    setLoading(true);
    
    try {
      const [avatar, banner, cover, background] = await Promise.all([
        getUserAvatar(userId),
        getUserBanner(userId),
        getUserCover(userId),
        getUserBackground(userId),
      ]);
      
      setAvatarUrl(avatar);
      setBannerUrl(banner);
      setCoverUrl(cover);
      setBackgroundUrl(background);
    } catch (error) {
      console.error("Error al cargar imágenes:", error);
    } finally {
      setLoading(false);
    }
  };

  // ========== HANDLERS AVATAR ==========
  const handleUploadAvatar = async (useCamera: boolean) => {
    setLoading(true);
    const success = useCamera 
      ? await uploadAvatarFromCamera()
      : await uploadAvatarFromGallery();
    setLoading(false);
    
    if (success) {
      await loadImages();
      Alert.alert("Éxito", "Avatar actualizado correctamente");
    } else {
      Alert.alert("Error", "No se pudo subir el avatar");
    }
  };

  const handleDeleteAvatar = async () => {
    Alert.alert("Confirmar", "¿Eliminar avatar actual?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          const success = await deleteAvatar();
          setLoading(false);
          if (success) {
            setAvatarUrl(null);
            Alert.alert("Éxito", "Avatar eliminado");
          }
        },
      },
    ]);
  };

  // ========== HANDLERS BANNER ==========
  const handleUploadBanner = async () => {
    setLoading(true);
    const success = await uploadBannerFromGallery();
    setLoading(false);
    
    if (success) {
      await loadImages();
      Alert.alert("Éxito", "Banner actualizado correctamente");
    } else {
      Alert.alert("Error", "No se pudo subir el banner");
    }
  };

  const handleDeleteBanner = async () => {
    Alert.alert("Confirmar", "¿Eliminar banner actual?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          const success = await deleteBanner();
          setLoading(false);
          if (success) {
            setBannerUrl(null);
            Alert.alert("Éxito", "Banner eliminado");
          }
        },
      },
    ]);
  };

  // ========== HANDLERS COVER ==========
  const handleUploadCover = async () => {
    setLoading(true);
    const success = await uploadCoverFromGallery();
    setLoading(false);
    
    if (success) {
      await loadImages();
      Alert.alert("Éxito", "Cover actualizado correctamente");
    } else {
      Alert.alert("Error", "No se pudo subir el cover");
    }
  };

  const handleDeleteCover = async () => {
    Alert.alert("Confirmar", "¿Eliminar cover actual?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          const success = await deleteCover();
          setLoading(false);
          if (success) {
            setCoverUrl(null);
            Alert.alert("Éxito", "Cover eliminado");
          }
        },
      },
    ]);
  };

  // ========== HANDLERS BACKGROUND ==========
  const handleUploadBackground = async () => {
    setLoading(true);
    const success = await uploadBackgroundFromGallery();
    setLoading(false);
    
    if (success) {
      await loadImages();
      Alert.alert("Éxito", "Fondo actualizado correctamente");
    } else {
      Alert.alert("Error", "No se pudo subir el fondo");
    }
  };

  const handleDeleteBackground = async () => {
    Alert.alert("Confirmar", "¿Eliminar fondo actual?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          const success = await deleteBackground();
          setLoading(false);
          if (success) {
            setBackgroundUrl(null);
            Alert.alert("Éxito", "Fondo eliminado");
          }
        },
      },
    ]);
  };

  // ========== REFRESH ==========
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadImages();
    setRefreshing(false);
    Alert.alert("Info", "Imágenes recargadas");
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.mainContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#df96c0" />
          <Text style={styles.loadingText}>Cargando imágenes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#df96c0"]}
            tintColor="#df96c0"
          />
        }
      >
        <Text style={styles.title}>Editar Mis Imagenes</Text>
        <Text style={styles.userId}>Usuario: {userId || "No logueado"}</Text>

        {/* ========== VISTA PREVIA ========== */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>Vista Previa del Perfil</Text>
          <View style={styles.previewBannerContainer}>
            <ImageBackground
              source={bannerUrl ? { uri: bannerUrl } : { uri: "https://via.placeholder.com/800x200/434343/FFFFFF?text=Banner" }}
              style={styles.previewBanner}
              resizeMode="cover"
            >
              <View style={styles.previewOverlay}>
                <View style={styles.previewAvatarContainer}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.previewAvatar} />
                  ) : (
                    <View style={[styles.previewAvatar, styles.previewAvatarPlaceholder]}>
                      <Text style={styles.previewAvatarText}>👤</Text>
                    </View>
                  )}
                </View>
              </View>
            </ImageBackground>
          </View>
          <Text style={styles.previewHint}>
            Banner + Avatar
          </Text>
        </View>

        {/* ========== 1. BACKGROUND ========== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>FONDO GENERAL</Text>
          <Text style={styles.cardDescription}>
            Aparece como fondo en todas las pantallas
          </Text>
          <View style={styles.previewBox}>
            {backgroundUrl ? (
              <Image source={{ uri: backgroundUrl }} style={styles.previewBoxImage} />
            ) : (
              <View style={[styles.previewBoxImage, styles.previewBoxPlaceholder]}>
                <Text style={styles.placeholderText}>🌄</Text>
              </View>
            )}
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.uploadButton]} onPress={handleUploadBackground}>
              <Text style={styles.buttonText}>Subir Fondo</Text>
            </TouchableOpacity>
            {backgroundUrl && (
              <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteBackground}>
                <Text style={styles.buttonText}>Eliminar fondo actual</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ========== 2. BANNER ========== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>BANNER DE PORTADA</Text>
          <Text style={styles.cardDescription}>
            Imagen superior detrás de tu avatar (rectangular)
          </Text>
          <View style={styles.previewBox}>
            {bannerUrl ? (
              <Image source={{ uri: bannerUrl }} style={styles.previewBoxImage} />
            ) : (
              <View style={[styles.previewBoxImage, styles.previewBoxPlaceholder]}>
                <Text style={styles.placeholderText}>🎨</Text>
              </View>
            )}
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.uploadButton]} onPress={handleUploadBanner}>
              <Text style={styles.buttonText}>Subir Banner</Text>
            </TouchableOpacity>
            {bannerUrl && (
              <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteBanner}>
                <Text style={styles.buttonText}>Eliminar Banner</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ========== 3. AVATAR ========== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>AVATAR DE PERFIL</Text>
          <Text style={styles.cardDescription}>
            Foto circular que se muestra junto a tu nombre
          </Text>
          <View style={styles.avatarPreviewBox}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarPreviewLarge} />
            ) : (
              <View style={[styles.avatarPreviewLarge, styles.avatarPlaceholderLarge]}>
                <Text style={styles.placeholderTextLarge}>👤</Text>
              </View>
            )}
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.galleryButton]} onPress={() => handleUploadAvatar(false)}>
              <Text style={styles.buttonText}>Mi Galería</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.cameraButton]} onPress={() => handleUploadAvatar(true)}>
              <Text style={styles.buttonText}>Abrir Cámara</Text>
            </TouchableOpacity>
            {avatarUrl && (
              <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteAvatar}>
                <Text style={styles.buttonText}>Eliminar Actual</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ========== 4. COVER (POMODORO) ========== */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>COVER PARA POMODORO</Text>
          <Text style={styles.cardDescription}>
            Imagen cuadrada que aparece en el temporizador (300x300px)
          </Text>
          <View style={styles.previewBox}>
            {coverUrl ? (
              <Image source={{ uri: coverUrl }} style={styles.previewBoxImageSquare} />
            ) : (
              <View style={[styles.previewBoxImageSquare, styles.previewBoxPlaceholder]}>
                <Text style={styles.placeholderText}>🍅</Text>
              </View>
            )}
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={[styles.button, styles.uploadButton]} onPress={handleUploadCover}>
              <Text style={styles.buttonText}>Subir Cover</Text>
            </TouchableOpacity>
            {coverUrl && (
              <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteCover}>
                <Text style={styles.buttonText}>Eliminar Cover</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ========== INFO ========== */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>ℹ️ Informacion!</Text>
          <Text style={styles.infoText}>
            💾 Todas las imagenes se guardan como Base64 en Realtime Database{'\n'}
            📏 Tamaño recomendado: menos de 500KB cada una
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#1C1C1C",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 35,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
    marginTop: 30,
  },
  userId: {
    fontSize: 11,
    color: "#353535",
    textAlign: "center",
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#FFFFFF",
  },
  // Vista Previa
  previewSection: {
    marginBottom: 24,
    backgroundColor: "#2E2E2E",
    borderRadius: 16,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#df96c0",
    marginBottom: 12,
    justifyContent: "center",
    textAlign: "center",
  },
  previewBannerContainer: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 10,
  },
  previewBanner: {
    width: "100%",
    height: 100,
    justifyContent: "flex-end",
  },
  previewOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0)",
    padding: 8,
  },
  previewAvatarContainer: {
    alignItems: "center",
  },
  previewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  previewAvatarPlaceholder: {
    backgroundColor: "#434343",
    justifyContent: "center",
    alignItems: "center",
  },
  previewAvatarText: {
    fontSize: 24,
    color: "#888888",
  },
  previewHint: {
    fontSize: 10,
    color: "#888888",
    textAlign: "center",
    marginTop: 8,
  },
  // Cards
  card: {
    backgroundColor: "#2E2E2E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#df96c0",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 12,
  },
  previewBox: {
    alignItems: "center",
    marginBottom: 16,
  },
  previewBoxImage: {
    width: "100%",
    height: 100,
    borderRadius: 12,
    backgroundColor: "#1A1A1A",
  },
  previewBoxImageSquare: {
    width: 120,
    height: 120,
    borderRadius: 12,
    backgroundColor: "#1A1A1A",
  },
  previewBoxPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPreviewBox: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarPreviewLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#df96c0",
  },
  avatarPlaceholderLarge: {
    backgroundColor: "#434343",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 40,
    color: "#888888",
  },
  placeholderTextLarge: {
    fontSize: 48,
    color: "#888888",
  },
  // Botones
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    minWidth: 100,
  },
  uploadButton: {
    backgroundColor: "#ce8aca",
  },
  galleryButton: {
    backgroundColor: "#c97ec7",
  },
  cameraButton: {
    backgroundColor: "#d677c5",
  },
  deleteButton: {
    backgroundColor: "#a46094",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 13,
  },
  // Info Card
  infoCard: {
    backgroundColor: "#2E2E2E",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#df96c0",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 11,
    color: "#888888",
    lineHeight: 18,
  },
});