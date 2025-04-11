import type {
  Doctor,
  Patient,
  Pharmacist,
  Prescription,
  HealthRecord,
  Pharmacy,
  Appointment,
  SuperAdmin,
  InventoryItem,
  Receipt,
  Nurse,
  VitalSigns,
} from "@/types"

const mockDoctors: Doctor[] = [
  {
    id: "1",
    role: "doctor",
    email: "doctor1@example.com",
    name: "Dr. Smith",
    gender: "male",
    phone: "111-222-3333",
    licenseNumber: "12345",
    hospitalId: "hospital1",
    specialization: "Cardiology",
    prescriptions: [],
    healthRecords: [],
    patients: ["1"], // Add this line
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    role: "doctor",
    email: "doctor2@example.com",
    name: "Dr. Johnson",
    gender: "female",
    phone: "444-555-6666",
    licenseNumber: "67890",
    hospitalId: "hospital1",
    specialization: "Pediatrics",
    prescriptions: [],
    healthRecords: [],
    patients: ["2"], // Add this line
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockNurses: Nurse[] = [
  {
    id: "1",
    role: "nurse",
    email: "nurse1@example.com",
    name: "Nancy Williams",
    gender: "female",
    phone: "111-333-5555",
    licenseNumber: "N12345",
    hospitalId: "hospital1",
    department: "Cardiology",
    patients: ["1", "2"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    role: "nurse",
    email: "nurse2@example.com",
    name: "Robert Chen",
    gender: "male",
    phone: "222-444-6666",
    licenseNumber: "N67890",
    hospitalId: "hospital1",
    department: "Pediatrics",
    patients: ["2"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockPatients: Patient[] = [
  {
    id: "1",
    role: "patient",
    email: "patient1@example.com",
    name: "John Doe",
    gender: "male",
    phone: "123-456-7890",
    dob: new Date("1990-01-01"),
    bloodType: "A+",
    prescriptions: [],
    healthRecords: [],
    allergies: ["Penicillin"],
    doctorId: "1", // Add this line
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    role: "patient",
    email: "patient2@example.com",
    name: "Jane Doe",
    gender: "female",
    phone: "987-654-3210",
    dob: new Date("1985-05-15"),
    bloodType: "B-",
    prescriptions: [],
    healthRecords: [],
    allergies: [],
    doctorId: "2", // Add this line
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockPharmacists: Pharmacist[] = [
  {
    id: "1",
    role: "pharmacist",
    email: "pharmacist1@example.com",
    name: "Alice Johnson",
    gender: "female",
    phone: "444-555-6666",
    licenseNumber: "67890",
    pharmacyId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockVitalSigns: VitalSigns[] = [
  {
    id: "VS001",
    recordedAt: new Date("2023-06-01T10:30:00Z"),
    temperature: 37.2,
    bloodPressure: {
      systolic: 120,
      diastolic: 80,
    },
    recordedBy: "1", // Nurse ID
    notes: "Patient appears healthy, normal vital signs",
  },
  {
    id: "VS002",
    recordedAt: new Date("2023-06-02T14:15:00Z"),
    temperature: 38.5,
    bloodPressure: {
      systolic: 135,
      diastolic: 85,
    },
    recordedBy: "1", // Nurse ID
    notes: "Patient has slight fever, monitoring required",
  },
]

const mockPrescriptions: Prescription[] = [
  {
    id: "RX001",
    doctorId: mockDoctors[0].id,
    patientId: mockPatients[0].id,
    status: "pending",
    medications: [
      {
        id: "MED001",
        name: "Amoxicillin",
        description: "Antibiotic",
        dosage: "500mg",
        frequency: "3 times a day",
        duration: "7 days",
        pharmacistId: mockPharmacists[0].id,
      },
    ],
    notes: "Take with food",
    createdAt: new Date("2023-06-01T10:00:00Z"),
    updatedAt: new Date("2023-06-01T10:00:00Z"),
  },
  {
    id: "RX002",
    doctorId: mockDoctors[0].id,
    patientId: mockPatients[1].id,
    status: "filled",
    medications: [
      {
        id: "MED002",
        name: "Lisinopril",
        description: "ACE inhibitor",
        dosage: "10mg",
        frequency: "Once daily",
        duration: "30 days",
        pharmacistId: mockPharmacists[0].id,
      },
    ],
    notes: "Take in the morning",
    createdAt: new Date("2023-05-15T14:30:00Z"),
    updatedAt: new Date("2023-05-16T09:00:00Z"),
  },
  {
    id: "RX003",
    doctorId: mockDoctors[0].id,
    patientId: mockPatients[0].id,
    status: "canceled",
    medications: [
      {
        id: "MED003",
        name: "Ibuprofen",
        description: "NSAID",
        dosage: "400mg",
        frequency: "As needed",
        duration: "5 days",
        pharmacistId: mockPharmacists[0].id,
      },
    ],
    notes: "For pain relief",
    createdAt: new Date("2023-05-20T11:15:00Z"),
    updatedAt: new Date("2023-05-21T16:45:00Z"),
  },
]

const mockHealthRecords: HealthRecord[] = [
  {
    id: "HR001",
    patientId: "1",
    doctorId: "1",
    visitDate: new Date("2023-05-15T09:30:00Z"),
    notes: "Patient complained of persistent cough and fever. Prescribed antibiotics and rest.",
    diagnosis: {
      id: "D001",
      name: "Acute Bronchitis",
      description: "Inflammation of the bronchial tubes",
      severity: "medium",
      date: new Date("2023-05-15T09:30:00Z"),
    },
    attachments: [],
    vitalSigns: [mockVitalSigns[0]],
  },
  {
    id: "HR002",
    patientId: "1",
    doctorId: "1",
    visitDate: new Date("2023-04-02T14:15:00Z"),
    notes: "Routine check-up. All vitals normal. Recommended to maintain current diet and exercise routine.",
    diagnosis: {
      id: "D002",
      name: "Routine Check-up",
      description: "No significant health issues detected",
      severity: "low",
      date: new Date("2023-04-02T14:15:00Z"),
    },
    attachments: [],
    vitalSigns: [mockVitalSigns[1]],
  },
  {
    id: "HR003",
    patientId: "1",
    doctorId: "1",
    visitDate: new Date("2023-03-10T11:00:00Z"),
    notes:
      "Patient reported severe headache and sensitivity to light. Diagnosed as migraine. Prescribed pain relievers and recommended stress management techniques.",
    diagnosis: {
      id: "D003",
      name: "Migraine",
      description: "Severe headache often accompanied by sensitivity to light and sound",
      severity: "high",
      date: new Date("2023-03-10T11:00:00Z"),
    },
    attachments: [],
  },
]

const mockInventoryItems: InventoryItem[] = [
  {
    id: "INV001",
    name: "Amoxicillin",
    description: "Antibiotic",
    quantity: 100,
    price: 10.99,
  },
  {
    id: "INV002",
    name: "Lisinopril",
    description: "ACE inhibitor",
    quantity: 50,
    price: 15.99,
  },
  {
    id: "INV003",
    name: "Ibuprofen",
    description: "NSAID",
    quantity: 200,
    price: 5.99,
  },
]

const mockPharmacies: Pharmacy[] = [
  {
    id: "1",
    name: "MediCare Pharmacy",
    location: "123 Main St, Anytown, USA",
    pharmacists: ["1"],
    inventory: mockInventoryItems,
  },
  {
    id: "2",
    name: "QuickRx Drugstore",
    location: "456 Oak Ave, Somewhere, USA",
    pharmacists: [],
    inventory: [],
  },
  {
    id: "3",
    name: "HealthPlus Pharmacy",
    location: "789 Pine Rd, Elsewhere, USA",
    pharmacists: [],
    inventory: [],
  },
]

const mockAppointments: Appointment[] = [
  {
    id: "APT001",
    doctorId: mockDoctors[0].id,
    patientId: mockPatients[0].id,
    dateTime: new Date("2023-06-15T10:00:00Z"),
    status: "scheduled",
    notes: "Regular check-up",
    createdAt: new Date("2023-06-01T09:00:00Z"),
    updatedAt: new Date("2023-06-01T09:00:00Z"),
  },
  {
    id: "APT002",
    doctorId: mockDoctors[0].id,
    patientId: mockPatients[1].id,
    dateTime: new Date("2023-06-16T14:30:00Z"),
    status: "scheduled",
    notes: "Follow-up on medication",
    createdAt: new Date("2023-06-02T11:00:00Z"),
    updatedAt: new Date("2023-06-02T11:00:00Z"),
  },
  {
    id: "APT003",
    doctorId: mockDoctors[0].id,
    patientId: mockPatients[0].id,
    dateTime: new Date("2023-06-10T11:00:00Z"),
    status: "completed",
    notes: "Discussed test results",
    createdAt: new Date("2023-05-25T10:00:00Z"),
    updatedAt: new Date("2023-06-10T12:00:00Z"),
  },
  {
    id: "APT004",
    doctorId: mockDoctors[0].id,
    patientId: mockPatients[1].id,
    dateTime: new Date("2023-06-12T09:00:00Z"),
    status: "canceled",
    notes: "Patient rescheduled",
    createdAt: new Date("2023-05-30T15:00:00Z"),
    updatedAt: new Date("2023-06-11T08:00:00Z"),
  },
]

const mockSuperAdmins: SuperAdmin[] = [
  {
    id: "sa1",
    role: "super-admin",
    email: "superadmin1@example.com",
    name: "Alex Johnson",
    gender: "other",
    phone: "555-123-4567",
    accessLevel: "full",
    managedEntities: ["doctors", "patients", "pharmacists", "pharmacies"],
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-01T00:00:00Z"),
  },
  {
    id: "sa2",
    role: "super-admin",
    email: "superadmin2@example.com",
    name: "Sam Smith",
    gender: "female",
    phone: "555-987-6543",
    accessLevel: "limited",
    managedEntities: ["pharmacies"],
    createdAt: new Date("2023-02-15T00:00:00Z"),
    updatedAt: new Date("2023-02-15T00:00:00Z"),
  },
]

const mockReceipts: Receipt[] = [
  {
    id: "REC001",
    prescriptionId: "RX001",
    pharmacyId: "1",
    patientId: "1",
    items: [
      {
        medicationId: "MED001",
        quantity: 1,
        price: 10.99,
      },
    ],
    total: 10.99,
    date: new Date(),
  },
]

export {
  mockPatients,
  mockPrescriptions,
  mockHealthRecords,
  mockDoctors,
  mockPharmacists,
  mockPharmacies,
  mockAppointments,
  mockSuperAdmins,
  mockInventoryItems,
  mockReceipts,
  mockNurses,
  mockVitalSigns,
}
