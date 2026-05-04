// app/(tabs)/Perfil.tsx
import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImages } from "../../constants/images";

export default function PerfilScreen() {
  const { width, height } = useWindowDimensions();
  const scale = width / 390;
  const s = (value: number) => value * scale;
  const v = (value: number) => value * (height / 844);

  const [frase, onChangeFrase] = useState('');
  const [modoOscuro, setModoOscuro] = useState(false);
  const [notificaciones, setNotificaciones] = useState(true);
  const [recordatorios, setRecordatorios] = useState(true);
  const [sonidos, setSonidos] = useState(true);

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      
      <ImageBackground
        source={AppImages.backgroundImg || require('../../assets/images/bD.jpg')}
        style={styles.fullScreenBackground}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={[styles.container, { paddingBottom: v(30) }]}>

                {/* ========== BANNER CON IMAGEN Y AVATAR (estilo consistente) ========== */}
                <View style={[styles.bannerSection, { marginBottom: v(20) }]}>
                  <View>
                    <Image
                      source={{ uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/bGeXzy3fHJ/7e8hahxo_expires_30_days.png" }}
                      resizeMode="cover"
                      style={[styles.bannerImage, { height: s(150), width: '100%' }]}
                    />
                    <View style={[styles.avatarContainer, { bottom: s(-50), marginHorizontal: s(135) }]}>
                      <Image
                        source={{ uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/bGeXzy3fHJ/95n5ezb6_expires_30_days.png" }}
                        resizeMode="cover"
                        style={[styles.avatar, { width: s(120), height: s(120), borderRadius: s(105), borderWidth: s(3), marginHorizontal : 'auto'}]}
                      />
                    </View>
                  </View>
                  
                  <Text style={[styles.userName, {
                    fontSize: s(28),
                    marginTop: s(50),
					marginHorizontal: 'auto',
                  }]}>
                    XXX XXX
                  </Text>
                  
                  <Text style={[styles.userBio, {
                    fontSize: s(12),
                    marginBottom: v(15),
                    marginLeft: s(130),
                    color: "#989898",
                  }]}>
                    Estudiante dedicado
                  </Text>
                </View>

                {/* ========== BOTONES DE ACCIÓN ========== */}
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity 
                    style={[styles.actionButton, {
                      borderRadius: s(24),
                      paddingVertical: v(12),
                      marginBottom: v(12),
                      backgroundColor: "#373737",
                    }]} 
                    onPress={() => alert('Editar Perfil')}
                  >
                    <Text style={[styles.actionButtonText, {
                      fontSize: s(18),
                      color: "#FFFFFF",
                    }]}>
                      Editar Perfil
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, {
                      borderRadius: s(24),
                      paddingVertical: v(10),
                      marginBottom: v(20),
                      backgroundColor: "#2E2E2E",
                    }]} 
                    onPress={() => alert('Editar Frase')}
                  >
                    <Text style={[styles.actionButtonText, {
                      fontSize: s(18),
                      color: "#FFFFFF",
                    }]}>
                    	Editar Frase 
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ========== SECCIÓN DE CONFIGURACIÓN ========== */}
                <View style={[styles.settingsCard, {
                  borderRadius: s(20),
                  paddingVertical: v(16),
                  marginBottom: v(20),
                  marginHorizontal: s(16),
                  backgroundColor: "rgba(46, 46, 46, 0.95)",
                }]}>
                  
                  {/* Modo Oscuro */}
                  <View style={[styles.settingItem, { paddingHorizontal: s(16), marginBottom: v(12) }]}>
                    <View style={styles.settingRow}>
                      <Text style={[styles.settingIcon, { fontSize: s(24), marginRight: s(12) }]}>🌕</Text>
                      <Text style={[styles.settingText, { fontSize: s(16), color: "#FFFFFF", flex: 1 }]}>
                        Modo Oscuro
                      </Text>
                      <Switch
                        value={modoOscuro}
                        onValueChange={setModoOscuro}
                        trackColor={{ false: "#4A4A4A", true: "#df96c0" }}
                        thumbColor={modoOscuro ? "#FFFFFF" : "#f4f3f4"}
                      />
                    </View>
                    <View style={[styles.divider, { height: s(1), backgroundColor: "#4A4A4A", marginTop: v(12) }]} />
                  </View>

                  {/* Notificaciones */}
                  <View style={[styles.settingItem, { paddingHorizontal: s(16), marginBottom: v(12) }]}>
                    <View style={styles.settingRow}>
                      <Text style={[styles.settingIcon, { fontSize: s(24), marginRight: s(12) }]}>🎐</Text>
                      <Text style={[styles.settingText, { fontSize: s(16), color: "#FFFFFF", flex: 1 }]}>
                        Notificaciones
                      </Text>
                      <Switch
                        value={notificaciones}
                        onValueChange={setNotificaciones}
                        trackColor={{ false: "#4A4A4A", true: "#df96c0" }}
                        thumbColor={notificaciones ? "#FFFFFF" : "#f4f3f4"}
                      />
                    </View>
                    <View style={[styles.divider, { height: s(1), backgroundColor: "#4A4A4A", marginTop: v(12) }]} />
                  </View>

                  {/* Recordatorios */}
                  <View style={[styles.settingItem, { paddingHorizontal: s(16), marginBottom: v(12) }]}>
                    <View style={styles.settingRow}>
                      <Text style={[styles.settingIcon, { fontSize: s(24), marginRight: s(12) }]}>‼️</Text>
                      <Text style={[styles.settingText, { fontSize: s(16), color: "#FFFFFF", flex: 1 }]}>
                        Recordatorios
                      </Text>
                      <Switch
                        value={recordatorios}
                        onValueChange={setRecordatorios}
                        trackColor={{ false: "#4A4A4A", true: "#df96c0" }}
                        thumbColor={recordatorios ? "#FFFFFF" : "#f4f3f4"}
                      />
                    </View>
                    <View style={[styles.divider, { height: s(1), backgroundColor: "#4A4A4A", marginTop: v(12) }]} />
                  </View>

                  {/* Sonidos */}
                  <View style={[styles.settingItem, { paddingHorizontal: s(16) }]}>
                    <View style={styles.settingRow}>
                      <Text style={[styles.settingIcon, { fontSize: s(24), marginRight: s(12) }]}>📀</Text>
                      <Text style={[styles.settingText, { fontSize: s(16), color: "#FFFFFF", flex: 1 }]}>
                        Sonidos
                      </Text>
                      <Switch
                        value={sonidos}
                        onValueChange={setSonidos}
                        trackColor={{ false: "#4A4A4A", true: "#df96c0" }}
                        thumbColor={sonidos ? "#FFFFFF" : "#f4f3f4"}
                      />
                    </View>
                  </View>
                </View>

                {/* ========== INPUT PARA FRASE PERSONALIZADA ========== */}
                <View style={[styles.phraseCard, {
                  borderRadius: s(20),
                  padding: s(16),
                  marginHorizontal: s(16),
                  marginBottom: v(20),
                  backgroundColor: "rgba(46, 46, 46, 0.95)",
                }]}>
                  <Text style={[styles.phraseLabel, { fontSize: s(14), color: "#b5b5b5", marginBottom: v(8) }]}>
                    Frase Motivacional Personalizada
                  </Text>
                  <TextInput
                    placeholder="Ej: La constancia es la clave del éxito..."
                    placeholderTextColor="#888888"
                    value={frase}
                    onChangeText={onChangeFrase}
                    style={[styles.phraseInput, {
                      fontSize: s(14),
                      color: "#FFFFFF",
                      paddingVertical: s(10),
                      paddingHorizontal: s(12),
                      borderRadius: s(12),
                      backgroundColor: "#2a2f34",
                    }]}
                    multiline
                  />
                </View>

                {/* ========== BOTONES DE ACCIÓN FINAL ========== */}
                <TouchableOpacity 
                  style={[styles.logoutButton, {
                    borderRadius: s(20),
                    paddingVertical: v(14),
                    marginBottom: v(12),
                    marginHorizontal: s(16),
                    backgroundColor: "#CCCCCC",
                  }]} 
                  onPress={() => alert('Cerrar Sesión')}
                >
                  <Text style={[styles.logoutText, { fontSize: s(16), color: "#000000", fontWeight: "bold" }]}>
                    Cerrar Sesión
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.deleteButton, {
                    borderRadius: s(20),
                    paddingVertical: v(14),
                    marginBottom: v(20),
                    marginHorizontal: s(16),
                    backgroundColor: "#2A2A2A",
                  }]} 
                  onPress={() => alert('Eliminar Cuenta')}
                >
                  <Text style={[styles.deleteText, { fontSize: s(16), color: "#ff8888", fontWeight: "bold" }]}>
                    ¡Eliminar Cuenta!
                  </Text>
                </TouchableOpacity>
                
                <Text style={[styles.versionText, {
                  fontSize: s(12),
                  color: "#989898",
                  textAlign: "center",
                  marginBottom: v(20),
                }]}>
                  Versión 1.0.1
                </Text>

              </View>
            </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  fullScreenBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  // Banner Section (estilo consistente con otras pantallas)
  bannerSection: {
    width: '100%',
  },
  bannerImage: {
    width: '100%',
  },
  avatarContainer: {
    position: "absolute",
	justifyContent	: "center",
	alignItems		: "center",
  },
  avatar: {
    borderColor: '#FFFFFF',
    backgroundColor: '#111',
  },
  userName: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  userBio: {
    fontWeight: "500",
  },
  // Buttons Container
  buttonsContainer: {
    paddingHorizontal: 16,
	marginTop: -15,
  },
  actionButton: {
    alignItems: "center",
  },
  actionButtonText: {
    fontWeight: "600",
  },
  // Settings Card
  settingsCard: {
    borderWidth: 1,
    borderColor: '#343a40',
  },
  settingItem: {
    width: '100%',
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingIcon: {
    textAlign: "center",
  },
  settingText: {
    fontWeight: "500",
  },
  divider: {
    width: '100%',
  },
  // Phrase Card
  phraseCard: {
    borderWidth: 1,
    borderColor: '#343a40',
  },
  phraseLabel: {
    fontWeight: "500",
  },
  phraseInput: {
    borderWidth: 1,
    borderColor: '#343a40',
    textAlignVertical: 'top',
  },
  // Action Buttons
  logoutButton: {
    alignItems: "center",
  },
  logoutText: {
    fontWeight: "bold",
  },
  deleteButton: {
    alignItems: "center",
  },
  deleteText: {
    fontWeight: "bold",
  },
  versionText: {
    fontWeight: "500",
  },
});