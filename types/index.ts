export interface User {
  id: string
  role: "doctor" | "patient" | "pharmacist" | "super-admin" | "nurse"
  email: string
  name: string
  gender: "male" | "female" | "other"
  phone: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface Doctor extends User {
  licenseNumber: string
  hospitalId: string
  specialization: string
  prescriptions: string[]
  healthRecords: string[]
  patients: string[]
}

export interface Patient extends User {
  dob: Date
  bloodType: string
  prescriptions: string[]
  healthRecords: string[]
  allergies: string[]
  doctorId: string | null
}

export interface Pharmacist extends User {
  licenseNumber: string
  pharmacyId: string
  medications: string[]
}

export interface Nurse extends User {
  licenseNumber: string
  hospitalId: string
  department: string
  patients: string[]
}

export interface Prescription {
  id: string
  doctorId: string
  patientId: string
  status: "pending" | "filled" | "canceled"
  medications: Medication[]
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface Medication {
  id: string
  name: string
  description: string
  dosage: string
  frequency: string
  duration: string
  pharmacistId: string
}

export interface HealthRecord {
  id: string
  patientId: string
  doctorId: string
  visitDate: Date
  notes: string
  diagnosis: Diagnosis
  attachments: string[]
  vitalSigns?: VitalSigns[]
}

export interface VitalSigns {
  id: string
  recordedAt: Date
  temperature?: number
  bloodPressure?: {
    systolic: number
    diastolic: number
  }
  recordedBy: string
  notes?: string
}

export interface Diagnosis {
  id: string
  name: string
  description: string
  severity: "low" | "medium" | "high"
  date: Date
}

export interface Hospital {
  id: string
  name: string
  location: string
  doctors: string[]
  nurses: string[]
}

export interface Pharmacy {
  id: string
  name: string
  location: string
  pharmacists: string[]
  inventory: InventoryItem[]
}

export interface InventoryItem {
  id: string
  name: string
  description: string
  quantity: number
  price: number
}

export interface Appointment {
  id: string
  doctorId: string
  patientId: string
  dateTime: Date
  status: "scheduled" | "completed" | "canceled"
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface SuperAdmin extends User {
  accessLevel: "full" | "limited"
  managedEntities: string[]
}

export interface Pharmacist extends User {
  licenseNumber: string
  pharmacyId: string
}

export interface Receipt {
  id: string
  prescriptionId: string
  pharmacyId: string
  patientId: string
  items: {
    medicationId: string
    quantity: number
    price: number
  }[]
  total: number
  date: Date
}
