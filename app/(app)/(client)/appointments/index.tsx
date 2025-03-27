import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Calendar, Clock, CircleCheck as CheckCircle2, Circle as XCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type Appointment = {
  id: string;
  service_name: string;
  appointment_date: string;
  time_slot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
};

export default function AppointmentsScreen() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', user.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;
      setAppointments(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#34C759';
      case 'pending':
        return '#FF9500';
      case 'completed':
        return '#007AFF';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle2 size={20} color={getStatusColor(status)} />;
      case 'cancelled':
        return <XCircle size={20} color={getStatusColor(status)} />;
      default:
        return <Clock size={20} color={getStatusColor(status)} />;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading appointments...</Text>
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
      <Link href="/appointments/book" asChild>
        <TouchableOpacity style={styles.bookButton}>
          <Calendar size={24} color="#fff" />
          <Text style={styles.bookButtonText}>Book New Appointment</Text>
        </TouchableOpacity>
      </Link>

      {appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color="#8E8E93" />
          <Text style={styles.emptyStateText}>No appointments yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Book your first appointment to get started
          </Text>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.serviceName}>{item.service_name}</Text>
                {getStatusIcon(item.status)}
              </View>
              
              <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {new Date(item.appointment_date).toLocaleDateString()}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Clock size={16} color="#666" />
                  <Text style={styles.detailText}>{item.time_slot}</Text>
                </View>
              </View>

              <View style={[styles.statusBar, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  bookButton: {
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
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  list: {
    gap: 15,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
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
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
  },
  appointmentDetails: {
    padding: 15,
    paddingTop: 0,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  statusBar: {
    padding: 8,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  error: {
    color: '#FF3B30',
    textAlign: 'center',
  },
});