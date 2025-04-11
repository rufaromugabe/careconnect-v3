-- Create tables for CareConnect

-- Create hospitals table
CREATE TABLE IF NOT EXISTS public.hospitals (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  location text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT hospitals_pkey PRIMARY KEY (id)
);

-- Create pharmacies table
CREATE TABLE IF NOT EXISTS public.pharmacies (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  location text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT pharmacies_pkey PRIMARY KEY (id)
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_key UNIQUE (user_id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT user_roles_role_check CHECK ((role = ANY (ARRAY['doctor', 'patient', 'pharmacist', 'super-admin', 'nurse'])))
);

-- Create doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  license_number text NOT NULL,
  specialization text NOT NULL,
  hospital_id uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT doctors_pkey PRIMARY KEY (id),
  CONSTRAINT doctors_user_id_key UNIQUE (user_id),
  CONSTRAINT doctors_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  CONSTRAINT doctors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create nurses table
CREATE TABLE IF NOT EXISTS public.nurses (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  license_number text NOT NULL,
  department text NOT NULL,
  hospital_id uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT nurses_pkey PRIMARY KEY (id),
  CONSTRAINT nurses_user_id_key UNIQUE (user_id),
  CONSTRAINT nurses_hospital_id_fkey FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
  CONSTRAINT nurses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create patients table
CREATE TABLE IF NOT EXISTS public.patients (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  dob date NOT NULL,
  blood_type text NULL,
  allergies text[] NULL,
  doctor_id uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT patients_pkey PRIMARY KEY (id),
  CONSTRAINT patients_user_id_key UNIQUE (user_id),
  CONSTRAINT patients_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create pharmacists table
CREATE TABLE IF NOT EXISTS public.pharmacists (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  license_number text NOT NULL,
  pharmacy_id uuid NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT pharmacists_pkey PRIMARY KEY (id),
  CONSTRAINT pharmacists_user_id_key UNIQUE (user_id),
  CONSTRAINT pharmacists_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id),
  CONSTRAINT pharmacists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  doctor_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  filled_date timestamp with time zone NULL,
  canceled_date timestamp with time zone NULL,
  expired_date timestamp with time zone NULL,
  filled_by uuid NULL,
  expiration_date timestamp with time zone NULL DEFAULT (now() + '30 days'::interval),
  CONSTRAINT prescriptions_pkey PRIMARY KEY (id),
  CONSTRAINT prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  CONSTRAINT prescriptions_filled_by_fkey FOREIGN KEY (filled_by) REFERENCES pharmacists(id),
  CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT prescriptions_status_check CHECK ((status = ANY (ARRAY['pending', 'filled', 'canceled', 'expired'])))
);

-- Create health_records table
CREATE TABLE IF NOT EXISTS public.health_records (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  patient_id uuid NOT NULL,
  doctor_id uuid NOT NULL,
  visit_date timestamp with time zone NOT NULL,
  notes text NULL,
  diagnosis_name text NOT NULL,
  diagnosis_description text NULL,
  diagnosis_severity text NOT NULL,
  attachments text[] NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT health_records_pkey PRIMARY KEY (id),
  CONSTRAINT health_records_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  CONSTRAINT health_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT health_records_diagnosis_severity_check CHECK ((diagnosis_severity = ANY (ARRAY['low', 'medium', 'high'])))
);

-- Create vital_signs table
CREATE TABLE IF NOT EXISTS public.vital_signs (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  health_record_id uuid NOT NULL,
  recorded_at timestamp with time zone NOT NULL,
  temperature numeric NULL,
  systolic integer NULL,
  diastolic integer NULL,
  recorded_by uuid NOT NULL,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT vital_signs_pkey PRIMARY KEY (id),
  CONSTRAINT vital_signs_health_record_id_fkey FOREIGN KEY (health_record_id) REFERENCES health_records(id) ON DELETE CASCADE,
  CONSTRAINT vital_signs_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES auth.users(id)
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  doctor_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  date_time timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES doctors(id),
  CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES patients(id),
  CONSTRAINT appointments_status_check CHECK ((status = ANY (ARRAY['scheduled', 'completed', 'canceled'])))
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  pharmacy_id uuid NOT NULL,
  name text NOT NULL,
  description text NULL,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT inventory_items_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_items_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES pharmacies(id)
);

-- Create super_admins table
CREATE TABLE IF NOT EXISTS public.super_admins (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  access_level text NOT NULL,
  managed_entities text[] NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT super_admins_pkey PRIMARY KEY (id),
  CONSTRAINT super_admins_user_id_key UNIQUE (user_id),
  CONSTRAINT super_admins_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT super_admins_access_level_check CHECK ((access_level = ANY (ARRAY['full', 'limited'])))
);