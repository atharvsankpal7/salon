/*
  # Initial Schema Setup for Salon Management System

  1. Tables
    - users: Stores user information for both clients and admins
    - appointments: Stores appointment bookings
    - inventory: Tracks salon inventory
    - payments: Records payment history
    - feedback: Stores client feedback

  2. Security
    - Enable RLS on all tables
    - Add policies for data access
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  phone_number text,
  full_name text,
  role text NOT NULL CHECK (role IN ('admin', 'client')),
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES users(id),
  service_name text NOT NULL,
  appointment_date date NOT NULL,
  time_slot text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  unit_price decimal(10,2) NOT NULL,
  reorder_level integer NOT NULL DEFAULT 10,
  last_updated timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid REFERENCES appointments(id),
  amount decimal(10,2) NOT NULL,
  payment_date timestamptz DEFAULT now(),
  payment_method text NOT NULL,
  notes text
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES users(id),
  appointment_id uuid REFERENCES appointments(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Clients can view their appointments"
  ON appointments
  FOR SELECT
  USING (client_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Clients can create appointments"
  ON appointments
  FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Admins can manage all appointments"
  ON appointments
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Only admins can manage inventory"
  ON inventory
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage all payments"
  ON payments
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Clients can view their payments"
  ON payments
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM appointments 
    WHERE appointments.id = payments.appointment_id 
    AND appointments.client_id = auth.uid()
  ));

CREATE POLICY "Clients can create feedback"
  ON feedback
  FOR INSERT
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Users can view feedback"
  ON feedback
  FOR SELECT
  USING (true);