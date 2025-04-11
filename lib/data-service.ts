import { supabase } from "./supabase"
// Add import for encryption utilities at the top of the file
import { encryptObject, decryptObject } from "./encryption"

// Define fields that should be encrypted for each data type
const HEALTH_RECORD_ENCRYPTED_FIELDS = ["notes","diagnosis_name", "diagnosis_description"]
const PRESCRIPTION_ENCRYPTED_FIELDS = ["notes" ]
const VITAL_SIGNS_ENCRYPTED_FIELDS = ["notes"]

// User-related functions
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getUserRole(userId: string) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).single()

  if (error) throw error
  return data?.role
}

// Doctor-related functions
export async function getDoctorProfile(userId: string) {
  const { data, error } = await supabase
    .from("doctors")
    .select(`
    id,
    license_number,
    specialization,
    hospital_id,
    user_id
  `)
    .eq("user_id", userId)
    .single()

  if (error) throw error

  // Get user data separately
  if (data) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(data.user_id)
    if (userError) throw userError

    return {
      ...data,
      users: userData.user,
    }
  }

  return data
}

// Add this function to check if a doctor profile exists
export async function checkDoctorProfileExists(userId: string) {
  const { data, error } = await supabase.from("doctors").select("id").eq("user_id", userId).single()

  if (error && !error.message.includes("No rows found")) {
    throw error
  }

  return !!data
}

// Add this function to update an existing doctor profile
export async function updateDoctorProfile(userId: string, updates: any) {
  const { data, error } = await supabase.from("doctors").update(updates).eq("user_id", userId).select()

  if (error) throw error
  return data?.[0]
}

export async function getAllDoctors() {
  const { data, error } = await supabase.from("doctors").select(`
    id,
    license_number,
    specialization,
    hospital_id,
    user_id
  `)

  if (error) throw error

  // Get user data for each doctor
  if (data && data.length > 0) {
    const enhancedData = await Promise.all(
      data.map(async (doctor) => {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(doctor.user_id)
        if (userError) {
          console.error("Error fetching user data:", userError)
          return { ...doctor, users: null }
        }
        return { ...doctor, users: userData.user }
      }),
    )
    return enhancedData
  }

  return data || []
}

// Add the getDoctorPatients function
export async function getDoctorPatients(doctorId: string) {
  try {
    // First, fetch the patients data
    const { data: patients, error } = await supabase.from("patients").select("*").eq("doctor_id", doctorId)

    if (error) throw error

    // If there are patients, fetch user data for each patient
    if (patients && patients.length > 0) {
      const enhancedData = await Promise.all(
        patients.map(async (patient) => {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(patient.user_id)
          if (userError) {
            console.error("Error fetching user data:", userError)
            return { ...patient, users: null }
          }
          return { ...patient, users: userData.user }
        }),
      )
      return enhancedData
    }

    return patients || []
  } catch (error) {
    console.error("Error fetching doctor patients:", error)
    throw error
  }
}

// Patient-related functions
export async function getPatientProfile(userId: string) {
  const { data, error } = await supabase
    .from("patients")
    .select(`
    id,
    dob,
    blood_type,
    allergies,
    doctor_id,
    user_id
  `)
    .eq("user_id", userId)
    .single()

  if (error) throw error

  // Get user data separately
  if (data) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(data.user_id)
    if (userError) throw userError

    return {
      ...data,
      users: userData.user,
    }
  }

  return data
}

export async function getPatientPrescriptions(patientId: string) {
  const { data, error } = await supabase
    .from("prescriptions")
    .select(`
    id,
    status,
    notes,
    created_at,
    updated_at,
    doctor_id,
    medications (
      id,
      name,
      dosage,
      frequency,
      duration
    )
  `)
    .eq("patient_id", patientId)

  if (error) throw error

  // Get doctor data for each prescription
  if (data && data.length > 0) {
    const enhancedData = await Promise.all(
      data.map(async (prescription) => {
        // Get doctor data
        const { data: doctorData, error: doctorError } = await supabase
          .from("doctors")
          .select("user_id")
          .eq("id", prescription.doctor_id)
          .single()

        let doctor = null
        if (!doctorError && doctorData) {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(doctorData.user_id)
          if (!userError) {
            doctor = { id: prescription.doctor_id, users: userData.user }
          }
        }

        return {
          ...prescription,
          doctors: doctor,
        }
      }),
    )
    return enhancedData
  }

  return data || []
}

export async function getPatientHealthRecords(patientId: string) {
  const { data, error } = await supabase
    .from("health_records")
    .select(`
    id,
    visit_date,
    notes,
    diagnosis_name,
    diagnosis_description,
    diagnosis_severity,
    doctor_id,
    vital_signs (
      id,
      recorded_at,
      temperature,
      systolic,
      diastolic,
      notes,
      recorded_by
    )
  `)
    .eq("patient_id", patientId)

  if (error) throw error

  // Decrypt sensitive data and get doctor data for each health record
  if (data && data.length > 0) {
    const enhancedData = await Promise.all(
      data.map(async (record) => {
        // Decrypt sensitive fields
        const decryptedRecord = decryptObject(record, HEALTH_RECORD_ENCRYPTED_FIELDS)

        // Decrypt vital signs notes if present
        if (decryptedRecord.vital_signs && decryptedRecord.vital_signs.length > 0) {
          decryptedRecord.vital_signs = decryptedRecord.vital_signs.map((vs) =>
            decryptObject(vs, VITAL_SIGNS_ENCRYPTED_FIELDS),
          )
        }

        // Get doctor data
        const { data: doctorData, error: doctorError } = await supabase
          .from("doctors")
          .select("user_id")
          .eq("id", decryptedRecord.doctor_id)
          .single()

        let doctor = null
        if (!doctorError && doctorData) {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(doctorData.user_id)
          if (!userError) {
            doctor = { id: decryptedRecord.doctor_id, users: userData.user }
          }
        }

        // Get recorder data for vital signs
        const vitalSigns = decryptedRecord.vital_signs || []
        const enhancedVitalSigns = await Promise.all(
          vitalSigns.map(async (vs) => {
            if (!vs.recorded_by) return vs

            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(vs.recorded_by)
            if (userError) {
              return vs
            }
            return { ...vs, users: userData.user }
          }),
        )

        return {
          ...decryptedRecord,
          doctors: doctor,
          vital_signs: enhancedVitalSigns,
        }
      }),
    )
    return enhancedData
  }

  return data || []
}

// Nurse-related functions
export async function getNurseProfile(userId: string) {
  const { data, error } = await supabase
    .from("nurses")
    .select(`
    id,
    license_number,
    department,
    hospital_id,
    user_id
  `)
    .eq("user_id", userId)
    .single()

  if (error) throw error

  // Get user data separately
  if (data) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(data.user_id)
    if (userError) throw userError

    return {
      ...data,
      users: userData.user,
    }
  }

  return data
}

export async function getNursePatients(nurseId: string) {
  // In a real application, you would have a nurse_patients junction table
  // For now, we'll just return all patients as a placeholder
  const { data: patients, error } = await supabase
    .from("patients")
    .select(`
      id,
      blood_type,
      allergies,
      dob,
      user_id,
      doctor_id
    `)
    .limit(10)

  if (error) throw error

  // Get user data for each patient
  if (patients && patients.length > 0) {
    const enhancedData = await Promise.all(
      patients.map(async (patient) => {
        try {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(patient.user_id)
          if (userError) {
            console.error("Error fetching user data:", userError)
            return { ...patient, user: null }
          }
          return { ...patient, user: userData.user }
        } catch (err) {
          console.error("Error processing patient data:", err)
          return { ...patient, user: null }
        }
      }),
    )
    return enhancedData
  }

  return patients || []
}

// Add the getVitalSigns function
export async function getVitalSigns(filters = {}) {
  const query = supabase.from("vital_signs").select(`
    id,
    recorded_at,
    temperature,
    systolic,
    diastolic,
    notes,
    recorded_by,
    health_record:health_record_id (
      id,
      patient_id,
      patient:patient_id (
        id,
        user_id
      )
    )
  `)

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    query.eq(key, value)
  })

  const { data, error } = await query.order("recorded_at", { ascending: false })

  if (error) throw error

  // Get recorder data for each vital sign and patient data
  if (data && data.length > 0) {
    const enhancedData = await Promise.all(
      data.map(async (vs) => {
        // Get recorder data
        if (vs.recorded_by) {
          const { data: recorderData, error: recorderError } = await supabase.auth.admin.getUserById(vs.recorded_by)
          if (!recorderError) {
            vs.recorder = recorderData.user
          }
        }

        // Get patient data if available
        if (vs.health_record?.patient?.user_id) {
          const { data: patientData, error: patientError } = await supabase.auth.admin.getUserById(
            vs.health_record.patient.user_id,
          )
          if (!patientError) {
            vs.health_record.patient.user = patientData.user
          }
        }

        return vs
      }),
    )
    return enhancedData
  }

  return data || []
}

// Pharmacist-related functions
export async function getPharmacistProfile(userId: string) {
  const { data, error } = await supabase
    .from("pharmacists")
    .select(`
    id,
    license_number,
    pharmacy_id,
    user_id
  `)
    .eq("user_id", userId)
    .single()

  if (error) throw error

  // Get user data separately
  if (data) {
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(data.user_id)
    if (userError) throw userError

    return {
      ...data,
      users: userData.user,
    }
  }

  return data
}

export async function getPharmacyInventory(pharmacyId: string) {
  const { data, error } = await supabase.from("inventory_items").select("*").eq("pharmacy_id", pharmacyId)

  if (error) throw error
  return data || []
}

// Super Admin-related functions
export async function getSuperAdminProfile(userId: string) {
  // First check if the user has the super-admin role in user metadata
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError) throw userError

  if (userData?.user?.user_metadata?.role === "super-admin") {
    // If role is in metadata, try to get the super admin profile
    const { data, error } = await supabase
      .from("super_admins")
      .select(`
        id,
        access_level,
        managed_entities,
        user_id
      `)
      .eq("user_id", userId)
      .single()

    if (error && !error.message.includes("No rows found")) throw error

    // Get user data separately
    if (data) {
      const { data: adminUserData, error: adminUserError } = await supabase.auth.admin.getUserById(data.user_id)
      if (adminUserError) throw adminUserError

      return {
        ...data,
        users: adminUserData.user,
      }
    }

    return data
  }

  // Fallback to direct API call to bypass RLS
  try {
    const response = await fetch("/api/auth/get-super-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch super admin profile")
    }

    return await response.json()
  } catch (err) {
    console.error("Error fetching super admin profile:", err)
    throw err
  }
}

export async function createSuperAdmin(superAdmin: any) {
  const { data, error } = await supabase.from("super_admins").insert([superAdmin]).select()

  if (error) throw error
  return data?.[0]
}

export async function updateSuperAdmin(id: string, updates: any) {
  const { data, error } = await supabase.from("super_admins").update(updates).eq("id", id).select()

  if (error) throw error
  return data?.[0]
}

export async function getAllSuperAdmins() {
  const { data, error } = await supabase.from("super_admins").select(`
    id,
    access_level,
    managed_entities,
    user_id
  `)

  if (error) throw error

  // Get user data for each super admin
  if (data && data.length > 0) {
    const enhancedData = await Promise.all(
      data.map(async (admin) => {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(admin.user_id)
        if (userError) {
          console.error("Error fetching user data:", userError)
          return { ...admin, users: null }
        }
        return { ...admin, users: userData.user }
      }),
    )
    return enhancedData
  }

  return data || []
}

// Prescription-related functions
export async function getPrescriptions(filters = {}) {
  try {
    const query = supabase.from("prescriptions").select(`
      id,
      status,
      notes,
      created_at,
      updated_at,
      doctor_id,
      patient_id,
      medications (
        id,
        name,
        dosage,
        frequency,
        duration
      )
    `)

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query.eq(key, value)
    })

    const { data, error } = await query

    if (error) throw error

    // Decrypt sensitive data and enhance with doctor and patient data
    if (data && data.length > 0) {
      const enhancedData = await Promise.all(
        data.map(async (prescription) => {
          try {
            // Decrypt sensitive fields
            const decryptedPrescription = decryptObject(prescription, PRESCRIPTION_ENCRYPTED_FIELDS)

            // Get doctor data - simplified to avoid deep nesting
            let doctor = null
            if (decryptedPrescription.doctor_id) {
              const { data: doctorData, error: doctorError } = await supabase
                .from("doctors")
                .select("user_id")
                .eq("id", decryptedPrescription.doctor_id)
                .single()

              if (!doctorError && doctorData?.user_id) {
                const { data: userData, error: userError } = await supabase.auth.admin.getUserById(doctorData.user_id)
                if (!userError && userData?.user) {
                  // Only include essential user data to avoid circular references
                  doctor = {
                    id: decryptedPrescription.doctor_id,
                    users: {
                      id: userData.user.id,
                      email: userData.user.email,
                      user_metadata: userData.user.user_metadata,
                    },
                  }
                }
              }
            }

            // Get patient data - simplified to avoid deep nesting
            let patient = null
            if (decryptedPrescription.patient_id) {
              const { data: patientData, error: patientError } = await supabase
                .from("patients")
                .select("user_id")
                .eq("id", decryptedPrescription.patient_id)
                .single()

              if (!patientError && patientData?.user_id) {
                const { data: userData, error: userError } = await supabase.auth.admin.getUserById(patientData.user_id)
                if (!userError && userData?.user) {
                  // Only include essential user data to avoid circular references
                  patient = {
                    id: decryptedPrescription.patient_id,
                    users: {
                      id: userData.user.id,
                      email: userData.user.email,
                      user_metadata: userData.user.user_metadata,
                    },
                  }
                }
              }
            }

            return {
              ...decryptedPrescription,
              doctors: doctor,
              patients: patient,
            }
          } catch (err) {
            console.error("Error enhancing prescription data:", err)
            // Return the prescription without enhanced data if there's an error
            return prescription
          }
        }),
      )
      return enhancedData
    }

    return data || []
  } catch (error) {
    console.error("Error in getPrescriptions:", error)
    // Return empty array instead of throwing to prevent cascading errors
    return []
  }
}

// Add function to get prescription by ID
export async function getPrescriptionById(id: string) {
  try {
    const { data, error } = await supabase
      .from("prescriptions")
      .select(`
        id,
        status,
        notes,
        created_at,
        updated_at,
        doctor_id,
        patient_id,
        medications (
          id,
          name,
          dosage,
          frequency,
          duration
        )
      `)
      .eq("id", id)
      .single()

    if (error) throw error

    // Decrypt sensitive data and enhance with doctor and patient data
    if (data) {
      try {
        // Decrypt sensitive fields
        const decryptedPrescription = decryptObject(data, PRESCRIPTION_ENCRYPTED_FIELDS)

        // Get doctor data - simplified
        let doctor = null
        if (decryptedPrescription.doctor_id) {
          const { data: doctorData, error: doctorError } = await supabase
            .from("doctors")
            .select("user_id")
            .eq("id", decryptedPrescription.doctor_id)
            .single()

          if (!doctorError && doctorData?.user_id) {
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(doctorData.user_id)
            if (!userError && userData?.user) {
              doctor = {
                id: decryptedPrescription.doctor_id,
                users: {
                  id: userData.user.id,
                  email: userData.user.email,
                  user_metadata: userData.user.user_metadata,
                },
              }
            }
          }
        }

        // Get patient data - simplified
        let patient = null
        if (decryptedPrescription.patient_id) {
          const { data: patientData, error: patientError } = await supabase
            .from("patients")
            .select("user_id")
            .eq("id", decryptedPrescription.patient_id)
            .single()

          if (!patientError && patientData?.user_id) {
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(patientData.user_id)
            if (!userError && userData?.user) {
              patient = {
                id: decryptedPrescription.patient_id,
                users: {
                  id: userData.user.id,
                  email: userData.user.email,
                  user_metadata: userData.user.user_metadata,
                },
              }
            }
          }
        }

        return {
          ...decryptedPrescription,
          doctors: doctor,
          patients: patient,
        }
      } catch (err) {
        console.error("Error enhancing prescription data:", err)
        // Return the prescription without enhanced data if there's an error
        return data
      }
    }

    return data
  } catch (error) {
    console.error("Error in getPrescriptionById:", error)
    return null
  }
}

export async function createPrescription(prescription: any) {
  try {
    // Encrypt sensitive fields
    const encryptedPrescription = encryptObject(prescription, PRESCRIPTION_ENCRYPTED_FIELDS)

    const { data, error } = await supabase.from("prescriptions").insert(encryptedPrescription).select()
    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error("Error creating prescription:", error)
    throw error
  }
}

export async function updatePrescriptionStatus(id: string, status: "pending" | "filled" | "canceled") {
  const { data, error } = await supabase
    .from("prescriptions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()

  if (error) throw error
  return data?.[0]
}

// Health record-related functions
export async function getHealthRecords(filters = {}) {
  const query = supabase.from("health_records").select(`
  id,
  patient_id,
  doctor_id,
  visit_date,
  notes,
  diagnosis_name,
  diagnosis_description,
  diagnosis_severity,
  attachments,
  created_at,
  vital_signs (
    id,
    recorded_at,
    temperature,
    systolic,
    diastolic,
    notes,
    recorded_by
  )
`)

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    query.eq(key, value)
  })

  const { data, error } = await query

  if (error) throw error

  // Decrypt sensitive data and enhance with doctor and patient data
  if (data && data.length > 0) {
    const enhancedData = await Promise.all(
      data.map(async (record) => {
        // Decrypt sensitive fields
        const decryptedRecord = decryptObject(record, HEALTH_RECORD_ENCRYPTED_FIELDS)

        // Decrypt vital signs notes if present
        if (decryptedRecord.vital_signs && decryptedRecord.vital_signs.length > 0) {
          decryptedRecord.vital_signs = decryptedRecord.vital_signs.map((vs) =>
            decryptObject(vs, VITAL_SIGNS_ENCRYPTED_FIELDS),
          )
        }

        // Get doctor data
        const { data: doctorData, error: doctorError } = await supabase
          .from("doctors")
          .select("user_id")
          .eq("id", decryptedRecord.doctor_id)
          .single()

        let doctor = null
        if (!doctorError && doctorData) {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(doctorData.user_id)
          if (!userError) {
            doctor = { id: decryptedRecord.doctor_id, users: userData.user }
          }
        }

        // Get patient data
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("user_id")
          .eq("id", decryptedRecord.patient_id)
          .single()

        let patient = null
        if (!patientError && patientData) {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(patientData.user_id)
          if (!userError) {
            patient = { id: decryptedRecord.patient_id, users: userData.user }
          }
        }

        // Get recorder data for vital signs
        const vitalSigns = decryptedRecord.vital_signs || []
        const enhancedVitalSigns = await Promise.all(
          vitalSigns.map(async (vs) => {
            if (!vs.recorded_by) return vs

            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(vs.recorded_by)
            if (userError) {
              return vs
            }
            return { ...vs, users: userData.user }
          }),
        )

        return {
          ...decryptedRecord,
          doctors: doctor,
          patients: patient,
          vital_signs: enhancedVitalSigns,
        }
      }),
    )
    return enhancedData
  }

  return data || []
}

export async function createHealthRecord(recordData) {
  try {
    // Encrypt sensitive fields
    const encryptedData = encryptObject(recordData, HEALTH_RECORD_ENCRYPTED_FIELDS)

    const { error } = await supabase.from("health_records").insert(encryptedData)

    if (error) throw error

    return true
  } catch (error) {
    console.error("Error creating health record:", error)
    throw error
  }
}

export async function addVitalSigns(vitalSigns: any) {
  // Encrypt sensitive fields
  const encryptedVitalSigns = encryptObject(vitalSigns, VITAL_SIGNS_ENCRYPTED_FIELDS)

  const { data, error } = await supabase.from("vital_signs").insert([encryptedVitalSigns]).select()

  if (error) throw error
  return data?.[0]
}

// Appointment-related functions
export async function getAppointments(filters = {}) {
  const query = supabase.from("appointments").select(`
  id,
  date_time,
  status,
  notes,
  created_at,
  updated_at,
  doctor_id,
  patient_id
`)

  // Apply filters
  Object.entries(filters).forEach(([key, value]) => {
    query.eq(key, value)
  })

  const { data, error } = await query

  if (error) throw error

  // Enhance with doctor and patient data
  if (data && data.length > 0) {
    const enhancedData = await Promise.all(
      data.map(async (appointment) => {
        // Get doctor data
        const { data: doctorData, error: doctorError } = await supabase
          .from("doctors")
          .select("user_id")
          .eq("id", appointment.doctor_id)
          .single()

        let doctor = null
        if (!doctorError && doctorData) {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(doctorData.user_id)
          if (!userError) {
            doctor = { id: appointment.doctor_id, users: userData.user }
          }
        }

        // Get patient data
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select("user_id")
          .eq("id", appointment.patient_id)
          .single()

        let patient = null
        if (!patientError && patientData) {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(patientData.user_id)
          if (!userError) {
            patient = { id: appointment.patient_id, users: userData.user }
          }
        }

        return {
          ...appointment,
          doctors: doctor,
          patients: patient,
        }
      }),
    )
    return enhancedData
  }

  return data || []
}

export async function createAppointment(appointment: any) {
  try {
    const { data, error } = await supabase.from("appointments").insert(appointment).select()
    if (error) throw error
    return data?.[0]
  } catch (error) {
    console.error("Error creating appointment:", error)
    throw error
  }
}

export async function updateAppointmentStatus(id: string, status: "scheduled" | "completed" | "canceled") {
  const { data, error } = await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()

  if (error) throw error
  return data?.[0]
}

// Hospital and Pharmacy functions
export async function getHospitals() {
  const { data, error } = await supabase.from("hospitals").select("*")

  if (error) throw error
  return data || []
}

export async function getPharmacies() {
  const { data, error } = await supabase.from("pharmacies").select("*")

  if (error) throw error
  return data || []
}

export async function createHospital(hospital: any) {
  const { data, error } = await supabase.from("hospitals").insert([hospital]).select()

  if (error) throw error
  return data?.[0]
}

export async function updateHospital(id: string, updates: any) {
  const { data, error } = await supabase.from("hospitals").update(updates).eq("id", id).select()

  if (error) throw error
  return data?.[0]
}

export async function deleteHospital(id: string) {
  const { error } = await supabase.from("hospitals").delete().eq("id", id)

  if (error) throw error
  return true
}

export async function createPharmacy(pharmacy: any) {
  const { data, error } = await supabase.from("pharmacies").insert([pharmacy]).select()

  if (error) throw error
  return data?.[0]
}

export async function updatePharmacy(id: string, updates: any) {
  const { data, error } = await supabase.from("pharmacies").update(updates).eq("id", id).select()

  if (error) throw error
  return data?.[0]
}

export async function deletePharmacy(id: string) {
  const { error } = await supabase.from("pharmacies").delete().eq("id", id)

  if (error) throw error
  return true
}

// User management functions
export async function getAllUsers() {
  // This would typically be an admin-only function
  try {
    const { data, error } = await supabase.auth.admin.listUsers()
    if (error) throw error
    return data?.users || []
  } catch (err) {
    console.error("Error listing users:", err)
    // Fallback to API route if admin functions are not available
    const response = await fetch("/api/admin/users", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    if (!response.ok) {
      throw new Error("Failed to fetch users")
    }
    const data = await response.json()
    return data || []
  }
}

// Helper function to format user data from Supabase Auth
export function formatUserData(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.user_metadata?.name || "Unknown",
    role: user.user_metadata?.role || "Unknown",
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
  }
}
