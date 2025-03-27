import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}
console.log(supabaseUrl, supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  try {
    // First, check if the user exists in the auth system
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'atharvsankpal799@gmail.com',
      password: 'Admin@123',
    });

    if (!signInError) {
      console.log('Admin user already exists and credentials are valid!');
      console.log('Email: atharvsankpal799@gmail.com');
      console.log('Password: Admin@123');
      return;
    }

    // If sign in fails, create the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'atharvsankpal799@gmail.com',
      password: 'Admin@123',
    });

    if (authError) {
      if (authError.message === 'User already registered') {
        console.log('Admin user exists but password might be different.');
        return;
      }
      throw authError;
    }

    if (!authData.user) {
      console.error('No user data returned');
      return;
    }

    // Check if user record exists in the users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'atharvsankpal799@gmail.com')
      .single();

    if (!existingUser) {
      // Create the user record if it doesn't exist
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: 'atharvsankpal799@gmail.com',
          full_name: 'Admin User',
          role: 'admin',
        });

      if (userError) {
        console.error('Error creating user record:', userError.message);
        return;
      }
    }

    console.log('Admin user setup completed successfully!');
    console.log('Email: atharvsankpal799@gmail.com');
    console.log('Password: Admin@123');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
createAdminUser();