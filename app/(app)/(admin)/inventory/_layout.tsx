import { Stack } from 'expo-router';

export default function InventoryLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Inventory',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: 'Add Item',
          headerShown: true,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Edit Item',
          headerShown: true,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="usage"
        options={{
          title: 'Record Usage',
          headerShown: true,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}