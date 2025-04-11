create table public.appointments (
  id uuid not null default extensions.uuid_generate_v4 (),
  doctor_id uuid not null,
  patient_id uuid not null,
  date_time timestamp with time zone not null,
  status text not null default 'scheduled'::text,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint appointments_pkey primary key (id),
  constraint appointments_doctor_id_fkey foreign KEY (doctor_id) references doctors (id),
  constraint appointments_patient_id_fkey foreign KEY (patient_id) references patients (id),
  constraint appointments_status_check check (
    (
      status = any (
        array[
          'scheduled'::text,
          'completed'::text,
          'canceled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create table public.doctors (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  license_number text not null,
  specialization text not null,
  hospital_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint doctors_pkey primary key (id),
  constraint doctors_user_id_key unique (user_id),
  constraint doctors_hospital_id_fkey foreign KEY (hospital_id) references hospitals (id),
  constraint doctors_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.health_records (
  id uuid not null default extensions.uuid_generate_v4 (),
  patient_id uuid not null,
  doctor_id uuid not null,
  visit_date timestamp with time zone not null,
  notes text null,
  diagnosis_name text not null,
  diagnosis_description text null,
  diagnosis_severity text not null,
  attachments text[] null,
  created_at timestamp with time zone null default now(),
  constraint health_records_pkey primary key (id),
  constraint health_records_doctor_id_fkey foreign KEY (doctor_id) references doctors (id),
  constraint health_records_patient_id_fkey foreign KEY (patient_id) references patients (id),
  constraint health_records_diagnosis_severity_check check (
    (
      diagnosis_severity = any (array['low'::text, 'medium'::text, 'high'::text])
    )
  )
) TABLESPACE pg_default;
create table public.hospitals (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  location text not null,
  created_at timestamp with time zone null default now(),
  constraint hospitals_pkey primary key (id)
) TABLESPACE pg_default;

create table public.inventory_items (
  id uuid not null default extensions.uuid_generate_v4 (),
  pharmacy_id uuid not null,
  name text not null,
  description text null,
  quantity integer not null,
  price numeric not null,
  created_at timestamp with time zone null default now(),
  constraint inventory_items_pkey primary key (id),
  constraint inventory_items_pharmacy_id_fkey foreign KEY (pharmacy_id) references pharmacies (id)
) TABLESPACE pg_default;

create table public.medications (
  id uuid not null default extensions.uuid_generate_v4 (),
  prescription_id uuid not null,
  name text not null,
  description text null,
  dosage text not null,
  frequency text not null,
  duration text not null,
  created_at timestamp with time zone null default now(),
  constraint medications_pkey primary key (id),
  constraint medications_prescription_id_fkey foreign KEY (prescription_id) references prescriptions (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.nurses (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  license_number text not null,
  department text not null,
  hospital_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint nurses_pkey primary key (id),
  constraint nurses_user_id_key unique (user_id),
  constraint nurses_hospital_id_fkey foreign KEY (hospital_id) references hospitals (id),
  constraint nurses_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.patients (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  dob date not null,
  blood_type text null,
  allergies text[] null,
  doctor_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint patients_pkey primary key (id),
  constraint patients_user_id_key unique (user_id),
  constraint patients_doctor_id_fkey foreign KEY (doctor_id) references doctors (id),
  constraint patients_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;
create table public.pharmacies (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  location text not null,
  created_at timestamp with time zone null default now(),
  constraint pharmacies_pkey primary key (id)
) TABLESPACE pg_default;

create table public.pharmacists (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  license_number text not null,
  pharmacy_id uuid null,
  created_at timestamp with time zone null default now(),
  constraint pharmacists_pkey primary key (id),
  constraint pharmacists_user_id_key unique (user_id),
  constraint pharmacists_pharmacy_id_fkey foreign KEY (pharmacy_id) references pharmacies (id),
  constraint pharmacists_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.prescriptions (
  id uuid not null default extensions.uuid_generate_v4 (),
  doctor_id uuid not null,
  patient_id uuid not null,
  status text not null default 'pending'::text,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  filled_date timestamp with time zone null,
  canceled_date timestamp with time zone null,
  expired_date timestamp with time zone null,
  filled_by uuid null,
  expiration_date timestamp with time zone null default (now() + '30 days'::interval),
  constraint prescriptions_pkey primary key (id),
  constraint prescriptions_doctor_id_fkey foreign KEY (doctor_id) references doctors (id),
  constraint prescriptions_filled_by_fkey foreign KEY (filled_by) references pharmacists (id),
  constraint prescriptions_patient_id_fkey foreign KEY (patient_id) references patients (id),
  constraint prescriptions_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'filled'::text,
          'canceled'::text,
          'expired'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger check_expired_prescriptions_trigger
after INSERT
or
update on prescriptions for EACH STATEMENT
execute FUNCTION check_expired_prescriptions ();

create trigger set_prescription_expiration_trigger BEFORE INSERT on prescriptions for EACH row
execute FUNCTION set_prescription_expiration ();

create table public.super_admins (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  access_level text not null,
  managed_entities text[] null,
  created_at timestamp with time zone null default now(),
  constraint super_admins_pkey primary key (id),
  constraint super_admins_user_id_key unique (user_id),
  constraint super_admins_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint super_admins_access_level_check check (
    (
      access_level = any (array['full'::text, 'limited'::text])
    )
  )
) TABLESPACE pg_default;

create table public.user_roles (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  role text not null,
  created_at timestamp with time zone null default now(),
  constraint user_roles_pkey primary key (id),
  constraint user_roles_user_id_key unique (user_id),
  constraint user_roles_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint user_roles_role_check check (
    (
      role = any (
        array[
          'doctor'::text,
          'patient'::text,
          'pharmacist'::text,
          'super-admin'::text,
          'nurse'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create table public.vital_signs (
  id uuid not null default extensions.uuid_generate_v4 (),
  health_record_id uuid not null,
  recorded_at timestamp with time zone not null,
  temperature numeric null,
  systolic integer null,
  diastolic integer null,
  recorded_by uuid not null,
  notes text null,
  created_at timestamp with time zone null default now(),
  constraint vital_signs_pkey primary key (id),
  constraint vital_signs_health_record_id_fkey foreign KEY (health_record_id) references health_records (id) on delete CASCADE,
  constraint vital_signs_recorded_by_fkey foreign KEY (recorded_by) references auth.users (id)
) TABLESPACE pg_default;