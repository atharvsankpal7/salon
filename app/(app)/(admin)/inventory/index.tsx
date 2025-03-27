import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Link } from 'expo-router';
import { Package2, Plus, CreditCard as Edit2, History, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type InventoryItem = {
  id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  reorder_level: number;
};

export default function InventoryScreen() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('item_name');

      if (error) throw error;
      setInventory(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity <= 0) return 'out';
    if (quantity <= reorderLevel) return 'low';
    return 'good';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out':
        return '#FF3B30';
      case 'low':
        return '#FF9500';
      default:
        return '#34C759';
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading inventory...</Text>
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
      <View style={styles.header}>
        <Link href="/inventory/add" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add New Item</Text>
          </TouchableOpacity>
        </Link>

        <Link href="/inventory/usage" asChild>
          <TouchableOpacity style={styles.usageButton}>
            <History size={24} color="#fff" />
            <Text style={styles.addButtonText}>Record Usage</Text>
          </TouchableOpacity>
        </Link>
      </View>

      {inventory.length === 0 ? (
        <View style={styles.emptyState}>
          <Package2 size={48} color="#8E8E93" />
          <Text style={styles.emptyStateText}>No inventory items</Text>
          <Text style={styles.emptyStateSubtext}>
            Add your first item to start tracking inventory
          </Text>
        </View>
      ) : (
        <FlatList
          data={inventory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const status = getStockStatus(item.quantity, item.reorder_level);
            return (
              <View style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.item_name}</Text>
                    <Text style={styles.itemPrice}>${item.unit_price.toFixed(2)}</Text>
                  </View>
                  <Link href={`/inventory/${item.id}`} asChild>
                    <TouchableOpacity style={styles.editButton}>
                      <Edit2 size={20} color="#007AFF" />
                    </TouchableOpacity>
                  </Link>
                </View>

                <View style={styles.stockInfo}>
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>Current Stock</Text>
                    <Text style={[
                      styles.quantity,
                      { color: getStatusColor(status) }
                    ]}>
                      {item.quantity}
                    </Text>
                  </View>

                  <View style={styles.reorderContainer}>
                    <Text style={styles.reorderLabel}>Reorder Level</Text>
                    <Text style={styles.reorderLevel}>{item.reorder_level}</Text>
                  </View>

                  {status !== 'good' && (
                    <View style={[styles.alert, { backgroundColor: getStatusColor(status) }]}>
                      <AlertTriangle size={16} color="#fff" />
                      <Text style={styles.alertText}>
                        {status === 'out' ? 'Out of Stock' : 'Low Stock'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          }}
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
  header: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  usageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5856D6',
    padding: 15,
    borderRadius: 10,
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
  itemCard: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
    backgroundColor: '#E5F1FF',
    borderRadius: 8,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      },
    }),
  },
  stockInfo: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  quantityContainer: {
    flex: 1,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  quantity: {
    fontSize: 24,
    fontWeight: '700',
  },
  reorderContainer: {
    flex: 1,
  },
  reorderLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  reorderLevel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#8E8E93',
  },
  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 6,
  },
  alertText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
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