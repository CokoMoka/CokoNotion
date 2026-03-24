import React from 'react';
import {
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors, getFontFamily } from '../../constants/theme';

const TimerScreen = () => {
  const [selectedTime, setSelectedTime] = React.useState(25);

  const timeOptions = [25, 30, 45, 60];
  let pomHoy = 2;
  let tiempoTotal = '50min';
  let descansos = 3;
  let frase = '"Ejemplo de frase"';
  let autorFrase = '— Autor';

  const minutos = '25';
  const segundos = '00';

  const theme = Colors.dark;

  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  return (
    <SafeAreaProvider>
      {/* IMAGEN DE FONDO PARA TODA LA PANTALLA */}
      <ImageBackground
        source={require('../../assets/images/bD.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Overlay oscuro para mejorar legibilidad (opcional) */}
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" />
            
            <ScrollView 
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.container}>
                {/* BANNER CON IMAGEN - AHORA CON OVERLAY MÁS CLARO */}
               

                {/* Tarjeta principal - con fondo semitransparente */}
                <View style={[styles.mainCard, { 
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                }]}>
                  
                  {/* Temporizador */}
                  <View style={styles.timerSection}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }, font('sans')]}>
                      tiempo restante
                    </Text>
                    
                    <View style={styles.timeRectanglesContainer}>
                      <View style={[styles.timeRectangle, { 
                        backgroundColor: 'rgba(59, 59, 59, 0.23)',
                        borderColor: theme.border,
                      }]}>
                        <Text style={[styles.timeRectangleValue, { color: theme.textMuted }, font('mono')]}>
                          {minutos}
                        </Text>
                        <Text style={[styles.timeRectangleLabel, { color: theme.text }, font('sans')]}>
                          minutos
                        </Text>
                      </View>
                      
                      <View style={styles.timeSeparator}>
                        <Text style={[styles.timeSeparatorText, { color: theme.bearAccent }, font('mono')]}>
                          :
                        </Text>
                      </View>
                      
                      <View style={[styles.timeRectangle, { 
                        backgroundColor: 'rgba(59, 59, 59, 0.23)',
                        borderColor: theme.border,
                      }]}>
                        <Text style={[styles.timeRectangleValue, { color: theme.textMuted }, font('mono')]}>
                          {segundos}
                        </Text>
                        <Text style={[styles.timeRectangleLabel, { color: theme.text }, font('sans')]}>
                          segundos
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Selector de tiempo */}
                  <View style={styles.timeOptionsSection}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }, font('sans')]}>
                      duración
                    </Text>
                    <View style={styles.timeOptions}>
                      {timeOptions.map((time) => (
                        <TouchableOpacity
                          key={time}
                          style={[
                            styles.timeOption,
                            { 
                              backgroundColor: 'rgba(59, 59, 59, 0.23)',
                              borderColor: theme.border,
                            },
                            selectedTime === time && { 
                              backgroundColor: theme.bearPrimary,
                              borderColor: theme.bearPrimary,
                            },
                          ]}
                          onPress={() => setSelectedTime(time)}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              { color: theme.textSecondary },
                              selectedTime === time && { color: '#ffffff' },
                              font('rounded'),
                            ]}
                          >
                            {time}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Botones de control */}
                  <View style={styles.controlsSection}>
                    <TouchableOpacity 
                      style={[styles.controlButton, { 
                        backgroundColor: theme.bearPrimary,
                      }]}
                    >
                      <Text style={[styles.controlButtonText, { color: '#ffffff' }, font('rounded')]}>
                        Iniciar
                      </Text>
                    </TouchableOpacity>
                    
                    <View style={styles.secondaryControls}>
                      <TouchableOpacity 
                        style={[styles.secondaryButton, { 
                          backgroundColor: 'rgba(59, 59, 59, 0.23)',
                          borderColor: theme.border,
                        }]}
                      >
                        <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }, font('sans')]}>
                          Pausa
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.secondaryButton, { 
                            backgroundColor: 'rgba(59, 59, 59, 0.23)',
                            borderColor: theme.border,
                        }]}
                      >
                        <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }, font('sans')]}>
                          Reiniciar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Estadísticas */}
                <View style={[styles.statsCard, { 
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                }]}>
                  <Text style={[styles.statsTitle, { color: theme.textSecondary }, font('sans')]}>
                    estadísticas de hoy
                  </Text>
                  
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: theme.text }, font('rounded')]}>
                        {pomHoy}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.textMuted }, font('sans')]}>
                        Pomodoros
                      </Text>
                    </View>
                    
                    <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                    
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: theme.text }, font('rounded')]}>
                        {tiempoTotal}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.textMuted }, font('sans')]}>
                        Tiempo total
                      </Text>
                    </View>
                    
                    <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                    
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: theme.text }, font('rounded')]}>
                        {descansos}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.textMuted }, font('sans')]}>
                        Descansos
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Frase */}
                <View style={[styles.quoteCard, { 
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                }]}>
                  <Text style={[styles.quoteText, { color: theme.textSecondary }, font('sans')]}>
                    {frase}
                  </Text>
                  <Text style={[styles.quoteAuthor, { color: theme.text }, font('rounded')]}>
                    {autorFrase}
                  </Text>
                </View>
              </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Overlay oscuro para mejorar legibilidad
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
    paddingTop: 10,
    marginTop: 50,
    paddingBottom: 20,
  },
  // BANNER CON IMAGEN
  bannerContainer: {
    height: 180,
    width: '100%',
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f8d0e841',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  bannerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c2c2c',
  },
  // Tarjeta principal
  mainCard: {
    borderRadius: 24,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#00000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  timerSection: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  timeRectanglesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRectangle: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  timeRectangleValue: {
    fontSize: 64,
    fontWeight: '400',
    fontVariant: ['tabular-nums'],
    marginBottom: 4,
  },
  timeRectangleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeSeparator: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeSeparatorText: {
    fontSize: 64,
    fontWeight: '400',
    opacity: 0.8,
  },
  timeOptionsSection: {
    marginBottom: 28,
  },
  timeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeOption: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  timeOptionText: {
    fontSize: 22,
    fontWeight: '600',
  },
  controlsSection: {
    gap: 12,
  },
  controlButton: {
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  controlButtonText: {
    fontSize: 20,
    fontWeight: '700',
  },
  secondaryControls: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  statsCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
  },
  statsTitle: {
    fontSize: 15,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 18,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 25,
    fontWeight: '400',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  quoteCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 18,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 10,
  },
  quoteAuthor: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TimerScreen;