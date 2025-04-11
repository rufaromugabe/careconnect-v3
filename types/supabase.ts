export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      doctors: {
        Row: {
          id: string
          user_id: string
          license_number: string
          specialization: string
          hospital_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          license_number: string
          specialization: string
          hospital_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          license_number?: string
          specialization?: string
          hospital_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctors_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctors_hospital_id_fkey"
            columns: ["hospital_id"]
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      nurses: {
        Row: {
          id: string
          user_id: string
          license_number: string
          department: string
          hospital_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          license_number: string
          department: string
          hospital_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          license_number?: string
          department?: string
          hospital_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nurses_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nurses_hospital_id_fkey"
            columns: ["hospital_id"]
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          id: string
          user_id: string
          dob: string
          blood_type: string | null
          allergies: string[] | null
          doctor_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          dob: string
          blood_type?: string | null
          allergies?: string[] | null
          doctor_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          dob?: string
          blood_type?: string | null
          allergies?: string[] | null
          doctor_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_doctor_id_fkey"
            columns: ["doctor_id"]
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacists: {
        Row: {
          id: string
          user_id: string
          license_number: string
          pharmacy_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          license_number: string
          pharmacy_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          license_number?: string
          pharmacy_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacists_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacists_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admins: {
        Row: {
          id: string
          user_id: string
          access_level: "full" | "limited"
          managed_entities: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_level: "full" | "limited"
          managed_entities?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_level?: "full" | "limited"
          managed_entities?: string[] | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "super_admins_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      hospitals: {
        Row: {
          id: string
          name: string
          location: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          created_at?: string
        }
        Relationships: []
      }
      pharmacies: {
        Row: {
          id: string
          name: string
          location: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string
          created_at?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          status: "pending" | "filled" | "canceled"
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          status?: "pending" | "filled" | "canceled"
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_id?: string
          status?: "pending" | "filled" | "canceled"
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_doctor_id_fkey"
            columns: ["doctor_id"]
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          id: string
          prescription_id: string
          name: string
          description: string | null
          dosage: string
          frequency: string
          duration: string
          created_at: string
        }
        Insert: {
          id?: string
          prescription_id: string
          name: string
          description?: string | null
          dosage: string
          frequency: string
          duration: string
          created_at?: string
        }
        Update: {
          id?: string
          prescription_id?: string
          name?: string
          description?: string | null
          dosage?: string
          frequency?: string
          duration?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_prescription_id_fkey"
            columns: ["prescription_id"]
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          id: string
          patient_id: string
          doctor_id: string
          visit_date: string
          notes: string | null
          diagnosis_name: string
          diagnosis_description: string | null
          diagnosis_severity: "low" | "medium" | "high"
          attachments: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          doctor_id: string
          visit_date: string
          notes?: string | null
          diagnosis_name: string
          diagnosis_description?: string | null
          diagnosis_severity: "low" | "medium" | "high"
          attachments?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          doctor_id?: string
          visit_date?: string
          notes?: string | null
          diagnosis_name?: string
          diagnosis_description?: string | null
          diagnosis_severity?: "low" | "medium" | "high"
          attachments?: string[] | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_records_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_doctor_id_fkey"
            columns: ["doctor_id"]
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      vital_signs: {
        Row: {
          id: string
          health_record_id: string
          recorded_at: string
          temperature: number | null
          systolic: number | null
          diastolic: number | null
          recorded_by: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          health_record_id: string
          recorded_at: string
          temperature?: number | null
          systolic?: number | null
          diastolic?: number | null
          recorded_by: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          health_record_id?: string
          recorded_at?: string
          temperature?: number | null
          systolic?: number | null
          diastolic?: number | null
          recorded_by?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vital_signs_health_record_id_fkey"
            columns: ["health_record_id"]
            referencedRelation: "health_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vital_signs_recorded_by_fkey"
            columns: ["recorded_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          id: string
          doctor_id: string
          patient_id: string
          date_time: string
          status: "scheduled" | "completed" | "canceled"
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doctor_id: string
          patient_id: string
          date_time: string
          status?: "scheduled" | "completed" | "canceled"
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          doctor_id?: string
          patient_id?: string
          date_time?: string
          status?: "scheduled" | "completed" | "canceled"
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          id: string
          pharmacy_id: string
          name: string
          description: string | null
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          name: string
          description?: string | null
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          pharmacy_id?: string
          name?: string
          description?: string | null
          quantity?: number
          price?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: "doctor" | "patient" | "pharmacist" | "super-admin" | "nurse"
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: "doctor" | "patient" | "pharmacist" | "super-admin" | "nurse"
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: "doctor" | "patient" | "pharmacist" | "super-admin" | "nurse"
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
