import { Stack } from 'expo-router';

export default function ServicesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Services',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: 'Add Service',
          headerShown: true,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Edit Service',
          headerShown: true,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}