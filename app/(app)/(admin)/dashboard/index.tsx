import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Calendar, Package2, DollarSign, Users } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type DashboardStats = {
  totalAppointments: number;
  totalRevenue: number;
  totalClients: number;
  lowStockItems: number;
};

type RecentAppointment = {
  id: string;
  service_name: string;
  appointment_date: string;
  time_slot: string;
  status: string;
  client: {
    full_name: string;
  };
};

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    totalRevenue: 0,
    totalClients: 0,
    lowStockItems: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<RecentAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for the chart
  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [500, 750, 600, 900, 800, 1200, 1000],
    }],
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('count')
        .eq('status', 'completed');
      
      if (appointmentsError) throw appointmentsError;

      // Fetch total revenue from payments
      const { data: revenue, error: revenueError } = await supabase
        .from('payments')
        .select('sum(amount)');
      
      if (revenueError) throw revenueError;

      // Fetch total clients
      const { data: clients, error: clientsError } = await supabase
        .from('users')
        .select('count')
        .eq('role', 'client');
      
      if (clientsError) throw clientsError;

      // Fetch low stock items
      const { data: lowStock, error: lowStockError } = await supabase
        .from('inventory')
        .select('count')
        .lte('quantity', 'reorder_level');
      
      if (lowStockError) throw lowStockError;

      // Fetch recent appointments
      const { data: recentAppts, error: recentApptsError } = await supabase
        .from('appointments')
        .select(`
          id,
          service_name,
          appointment_date,
          time_slot,
          status,
          client:users (full_name)
        `)
        .order('appointment_date', { ascending: false })
        .limit(5);
      
      if (recentApptsError) throw recentApptsError;

      setStats({
        totalAppointments: appointments[0].count,
        totalRevenue: revenue[0].sum || 0,
        totalClients: clients[0].count,
        lowStockItems: lowStock[0].count,
      });

      setRecentAppointments(recentAppts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading dashboard...</Text>
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
    <ScrollView style={styles.container}>
      <Text style={styles.greeting}>Welcome back, Admin!</Text>
      
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.appointments]}>
          <Calendar size={24} color="#007AFF" />
          <Text style={styles.statNumber}>{stats.totalAppointments}</Text>
          <Text style={styles.statLabel}>Appointments</Text>
        </View>

        <View style={[styles.statCard, styles.revenue]}>
          <DollarSign size={24} color="#34C759" />
          <Text style={styles.statNumber}>${stats.totalRevenue.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>

        <View style={[styles.statCard, styles.clients]}>
          <Users size={24} color="#5856D6" />
          <Text style={styles.statNumber}>{stats.totalClients}</Text>
          <Text style={styles.statLabel}>Total Clients</Text>
        </View>

        <View style={[styles.statCard, styles.inventory]}>
          <Package2 size={24} color="#FF9500" />
          <Text style={styles.statNumber}>{stats.lowStockItems}</Text>
          <Text style={styles.statLabel}>Low Stock Items</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Weekly Revenue</Text>
        <LineChart
          data={revenueData}
          width={Dimensions.get('window').width - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#ffffff',
            backgroundGradientFrom: '#ffffff',
            backgroundGradientTo: '#ffffff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.appointmentsContainer}>
        <Text style={styles.sectionTitle}>Recent Appointments</Text>
        {recentAppointments.map((appointment) => (
          <View key={appointment.id} style={styles.appointmentCard}>
            <View style={styles.appointmentHeader}>
              <Text style={styles.serviceName}>{appointment.service_name}</Text>
              <Text style={[
                styles.status,
                { color: getStatusColor(appointment.status) }
              ]}>
                {appointment.status}
              </Text>
            </View>
            
            <View style={styles.appointmentDetails}>
              <Text style={styles.clientName}>{appointment.client.full_name}</Text>
              <Text style={styles.appointmentTime}>
                {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.time_slot}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
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
  appointments: {
    borderTopColor: '#007AFF',
    borderTopWidth: 3,
  },
  revenue: {
    borderTopColor: '#34C759',
    borderTopWidth: 3,
  },
  clients: {
    borderTopColor: '#5856D6',
    borderTopWidth: 3,
  },
  inventory: {
    borderTopColor: '#FF9500',
    borderTopWidth: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  chartContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
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
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  appointmentsContainer: {
    gap: 10,
  },
  appointmentCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
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
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 14,
    fontWeight: '500',
  },
  appointmentDetails: {
    gap: 4,
  },
  clientName: {
    fontSize: 14,
    color: '#666',
  },
  appointmentTime: {
    fontSize: 14,
    color: '#666',
  },
  error: {
    color: '#FF3B30',
    textAlign: 'center',
  },
});