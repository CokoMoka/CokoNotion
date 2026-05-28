// screens/AuditScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllAuditEntries, exportFullAudit, AuditEntry } from '../../services/auditLogger';

const AuditScreen: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  const loadAuditEntries = async () => {
    try {
      const data = await getAllAuditEntries();
      setEntries(data);
      applyFilters(data, searchTerm, filterAction);
    } catch (error) {
      console.error('Error al cargar auditoría:', error);
      Alert.alert('Error', 'No se pudieron cargar los registros de auditoría');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (data: AuditEntry[], search: string, action: string) => {
    let filtered = [...data];
    
    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.noteTitle.toLowerCase().includes(lowerSearch) ||
        entry.details.toLowerCase().includes(lowerSearch) ||
        entry.action.toLowerCase().includes(lowerSearch)
      );
    }
    
    if (action !== 'all') {
      filtered = filtered.filter(entry => entry.action === action);
    }
    
    setFilteredEntries(filtered);
  };

  useEffect(() => {
    loadAuditEntries();
  }, []);

  useEffect(() => {
    applyFilters(entries, searchTerm, filterAction);
  }, [searchTerm, filterAction, entries]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAuditEntries();
  }, []);

  const handleExport = async () => {
    Alert.alert(
      'Exportar Auditoría',
      '¿Deseas exportar todos los registros a un archivo de texto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Exportar',
          onPress: async () => {
            try {
              const fileUri = await exportFullAudit();
              if (fileUri) {
                await Share.share({
                  title: 'Auditoría CokoNotion',
                  message: 'Registro de auditoría exportado',
                  url: fileUri,
                });
                Alert.alert('Éxito', 'Auditoría exportada correctamente');
              } else {
                Alert.alert('Error', 'No se pudo exportar la auditoría');
              }
            } catch (error) {
              console.error('Error al exportar:', error);
              Alert.alert('Error', 'Error al exportar la auditoría');
            }
          },
        },
      ]
    );
  };

  const getActionIcon = (action: string): string => {
    const icons: Record<string, string> = {
      'CREATE_NOTE': 'create-outline',
      'UPDATE_NOTE': 'create-outline',
      'DELETE_NOTE': 'trash-outline',
      'CREATE_TASK': 'checkbox-outline',
      'UPDATE_TASK': 'checkbox-outline',
      'DELETE_TASK': 'trash-outline',
      'COMPLETE_TASK': 'checkmark-circle-outline',
      'UNCOMPLETE_TASK': 'refresh-circle-outline',
      'TOGGLE_IMPORTANT': 'star-outline',
      'USER_LOGIN': 'log-in-outline',
      'USER_LOGOUT': 'log-out-outline',
      'USER_REGISTER': 'person-add-outline',
      'DELETE_ACCOUNT': 'person-remove-outline',
      'UPDATE_PROFILE_NAME': 'person-outline',
      'UPDATE_PROFILE_EMAIL': 'mail-outline',
      'UPDATE_PROFILE_PREFERENCES': 'settings-outline',
    };
    return icons[action] || 'document-text-outline';
  };

  const getActionColor = (action: string): string => {
    if (action.includes('CREATE')) return '#7eaf80';
    if (action.includes('UPDATE')) return '#85b7e1';
    if (action.includes('DELETE')) return '#cb6159';
    if (action.includes('LOGIN')) return '#a122b7';
    if (action.includes('LOGOUT')) return '#dab072';
    return '#757575';
  };

  const renderEntry = ({ item }: { item: AuditEntry }) => {
    const date = new Date(item.timestamp);
    const formattedDate = `${date.toLocaleDateString('es-MX')} ${date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    
    return (
      <View style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={[styles.iconContainer, { backgroundColor: getActionColor(item.action) + '20' }]}>
            <Ionicons name={getActionIcon(item.action)} size={24} color={getActionColor(item.action)} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.actionText}>{item.action.replace(/_/g, ' ')}</Text>
            <Text style={styles.timestamp}>{formattedDate}</Text>
          </View>
        </View>
        
        <View style={styles.entryBody}>
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={16} color="#666" />
            <Text style={styles.noteTitle}>{item.noteTitle}</Text>
          </View>
          
          {item.details && (
            <View style={styles.detailRow}>
              <Ionicons name="information-circle-outline" size={16} color="#666" />
              <Text style={styles.details}>{item.details}</Text>
            </View>
          )}
          
          {item.previousState && item.newState && (
            <View style={styles.changesContainer}>
              <Text style={styles.changesTitle}>Cambios:</Text>
              {Object.keys(item.newState).map(key => (
                <Text key={key} style={styles.changeText}>
                  • {key}: {JSON.stringify(item.previousState?.[key])} → {JSON.stringify(item.newState[key])}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const uniqueActions = ['all', ...new Set(entries.map(e => e.action))];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#f58cee" />
        <Text style={styles.loadingText}>Cargando registros...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🙈 Auditoría</Text>
      
      </View>
      
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#bb8abf" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por título, acción o detalle..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor="#999"
        />
        {searchTerm !== '' && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color="#b570a7" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>Filtrar por acción:</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={uniqueActions}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filterAction === item && styles.filterChipActive]}
              onPress={() => setFilterAction(item)}
            >
              <Text style={[styles.filterChipText, filterAction === item && styles.filterChipTextActive]}>
                {item === 'all' ? 'Todos' : item.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.filterList}
        />
      </View>
      
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#e878d2']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No hay registros de auditoría</Text>
          </View>
        }
        contentContainerStyle={filteredEntries.length === 0 ? styles.emptyList : styles.list}
      />
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Total: {filteredEntries.length} registros {searchTerm || filterAction !== 'all' ? '(filtrados)' : ''}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginTop: 26,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e878d2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exportText: {
    color: '#FFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    marginBottom: 8,
  },
  filterLabel: {
    marginLeft: 16,
    marginBottom: 8,
    fontSize: 14,
    color: '#666',
  },
  filterList: {
    paddingHorizontal: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: {
    backgroundColor: '#e878d2',
    borderColor: '#e878d2',
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  entryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  entryBody: {
    marginLeft: 52,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    flex: 1,
  },
  details: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  changesContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F9F9F9',
    borderRadius: 6,
  },
  changesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  changeText: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default AuditScreen;