import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

const timeSlots = [
  '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM'
];

export default function BookAppointmentScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
    }
  };

  const handleBooking = async () => {
    try {
      if (!selectedService || !selectedDate || !selectedTime) {
        throw new Error('Please select all required fields');
      }

      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error: bookingError } = await supabase
        .from('appointments')
        .insert({
          client_id: user.id,
          service_name: services.find(s => s.id === selectedService)?.name,
          appointment_date: selectedDate,
          time_slot: selectedTime,
          status: 'pending'
        });

      if (bookingError) throw bookingError;

      router.back();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate next 7 days for date selection
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return date.toISOString().split('T')[0];
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Service</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.serviceList}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.serviceCard,
                selectedService === service.id && styles.selectedCard
              ]}
              onPress={() => setSelectedService(service.id)}
            >
              <Text style={[
                styles.serviceName,
                selectedService === service.id && styles.selectedText
              ]}>
                {service.name}
              </Text>
              <Text style={[
                styles.serviceDetails,
                selectedService === service.id && styles.selectedText
              ]}>
                {service.duration} mins • ${service.price}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateList}>
          {dates.map((date) => (
            <TouchableOpacity
              key={date}
              style={[
                styles.dateCard,
                selectedDate === date && styles.selectedCard
              ]}
              onPress={() => setSelectedDate(date)}
            >
              <Text style={[
                styles.dateText,
                selectedDate === date && styles.selectedText
              ]}>
                {new Date(date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Time</Text>
        <View style={styles.timeGrid}>
          {timeSlots.map((time) => (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeCard,
                selectedTime === time && styles.selectedCard
              ]}
              onPress={() => setSelectedTime(time)}
            >
              <Text style={[
                styles.timeText,
                selectedTime === time && styles.selectedText
              ]}>
                {time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[
          styles.bookButton,
          (!selectedService || !selectedDate || !selectedTime || loading) && styles.buttonDisabled
        ]}
        onPress={handleBooking}
        disabled={!selectedService || !selectedDate || !selectedTime || loading}
      >
        <Text style={styles.bookButtonText}>
          {loading ? 'Booking...' : 'Book Appointment'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  serviceList: {
    flexGrow: 0,
  },
  serviceCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    minWidth: 150,
    ...Platform.select({
      web: {
        cursor: 'pointer',
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
  selectedCard: {
    backgroundColor: '#007AFF',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  serviceDetails: {
    fontSize: 14,
    color: '#666',
  },
  selectedText: {
    color: '#fff',
  },
  dateList: {
    flexGrow: 0,
  },
  dateCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
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
  dateText: {
    fontSize: 14,
    textAlign: 'center',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    width: '23%',
    alignItems: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
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
  timeText: {
    fontSize: 14,
  },
  bookButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    margin: 20,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 10,
  },
});