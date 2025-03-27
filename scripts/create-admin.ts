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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  try {
    // First, try to sign in to check if user exists
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'admin@smartsalon.com',
      password: 'Admin@123',
    });

    if (signInError) {
      console.log(signInError)      
      return;
    }

    // If sign in fails, create the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'admin@smartsalon.com',
      password: 'Admin@123',
    });

    if (authError) {
      console.error('Error creating auth user:', authError.message);
      return;
    }

    if (!authData.user) {
      console.error('No user data returned');
      return;
    }

    // Then, create the corresponding record in public.users
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: 'admin@smartsalon.com',
        full_name: 'Admin User',
        role: 'admin',
      });

    if (userError) {
      console.error('Error creating user record:', userError.message);
      return;
    }

    console.log('Admin user created successfully!');
    console.log('Email: admin@smartsalon.com');
    console.log('Password: Admin@123');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
createAdminUser();