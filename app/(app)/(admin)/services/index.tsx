import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Plus, CreditCard as Edit2, Trash2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type Service = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
};

export default function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;
      setServices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setServices(services.filter(service => service.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading services...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Link href="/services/add" asChild>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add New Service</Text>
        </TouchableOpacity>
      </Link>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.serviceCard}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{item.name}</Text>
              <Text style={styles.serviceDescription}>{item.description}</Text>
              <View style={styles.serviceDetails}>
                <Text style={styles.serviceDuration}>{item.duration} mins</Text>
                <Text style={styles.servicePrice}>${item.price}</Text>
              </View>
            </View>
            <View style={styles.actionButtons}>
              <Link href={`/services/${item.id}`} asChild>
                <TouchableOpacity style={[styles.actionButton, styles.editButton]}>
                  <Edit2 size={20} color="#007AFF" />
                </TouchableOpacity>
              </Link>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDelete(item.id)}
              >
                <Trash2 size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  list: {
    gap: 15,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      web: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      default: {
        elevation: 2,
      },
    }),
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  serviceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 10,
    borderRadius: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  editButton: {
    backgroundColor: '#E5F1FF',
  },
  deleteButton: {
    backgroundColor: '#FFE5E5',
  },
  error: {
    color: '#FF3B30',
    textAlign: 'center',
  },
});