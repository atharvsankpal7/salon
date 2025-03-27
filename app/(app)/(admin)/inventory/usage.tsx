import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

type InventoryItem = {
  id: string;
  item_name: string;
  quantity: number;
};

type UsageItem = {
  id: string;
  quantity: string;
};

export default function RecordUsageScreen() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [usageItems, setUsageItems] = useState<{ [key: string]: UsageItem }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, item_name, quantity')
        .order('item_name');

      if (error) throw error;
      setInventory(data);

      // Initialize usage items
      const initialUsage = data.reduce((acc, item) => {
        acc[item.id] = { id: item.id, quantity: '0' };
        return acc;
      }, {});
      setUsageItems(initialUsage);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleQuantityChange = (id: string, value: string) => {
    setUsageItems(prev => ({
      ...prev,
      [id]: { ...prev[id], quantity: value }
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const updates = Object.values(usageItems)
        .filter(item => parseInt(item.quantity) > 0)
        .map(item => {
          const inventoryItem = inventory.find(i => i.id === item.id);
          const newQuantity = inventoryItem.quantity - parseInt(item.quantity);
          
          if (newQuantity < 0) {
            throw new Error(`Not enough ${inventoryItem.item_name} in stock`);
          }

          return {
            id: item.id,
            quantity: newQuantity,
          };
        });

      if (updates.length === 0) {
        throw new Error('Please enter usage quantity for at least one item');
      }

      for (const update of updates) {
        const { error } = await supabase
          .from('inventory')
          .update({ quantity: update.quantity })
          .eq('id', update.id);

        if (error) throw error;
      }

      router.back();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.description}>
          Record the quantity of items used. This will be deducted from the current inventory.
        </Text>

        {inventory.map(item => (
          <View key={item.id} style={styles.itemContainer}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.item_name}</Text>
              <Text style={styles.currentStock}>Current Stock: {item.quantity}</Text>
            </View>
            
            <View style={styles.quantityInput}>
              <TextInput
                style={styles.input}
                value={usageItems[item.id]?.quantity}
                onChangeText={(value) => handleQuantityChange(item.id, value)}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>
        ))}

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Recording Usage...' : 'Record Usage'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
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
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  currentStock: {
    fontSize: 14,
    color: '#666',
  },
  quantityInput: {
    width: 100,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    color: '#FF3B30',
    marginBottom: 15,
    textAlign: 'center',
  },
});