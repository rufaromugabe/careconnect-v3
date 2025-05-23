import { createClient } from '@supabase/supabase-js'
 
 const supabaseUrl ="https://aoynrckxchdkopwvqwdg.supabase.co"
 const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFveW5yY2t4Y2hka29wd3Zxd2RnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mzk2NjI4NCwiZXhwIjoyMDU5NTQyMjg0fQ.nbsDFvpR5LjyLqFxhe_ILe0ofdhUP7m20z7sTrVRTAw"
 const supabase = createClient(supabaseUrl, supabaseServiceKey)
 
 async function createInitialSuperAdmin() {
   try {
     // 1. Create a new user
     const { data: userData, error: userError } = await supabase.auth.admin.createUser({
       email: 'admin@care.com',
       password: '123456',
       email_confirm: true, // Auto-confirm the email
       user_metadata: {
         full_name: 'System Administrator',
         role: 'super-admin',
         profile_completed: true
       }
     })
     
     if (userError) throw userError
     console.log('User created:', userData.user.id)
     
     const userId = userData.user.id
     
     // 2. Create user role entry
     const { error: roleError } = await supabase
       .from('user_roles')
       .insert({
         user_id: userId,
         role: 'super-admin'
       })
     
     if (roleError) throw roleError
     
     // 3. Create super admin entry
     const { error: adminError } = await supabase
       .from('super_admins')
       .insert({
         user_id: userId,
         access_level: 'full',
         managed_entities: ['doctors', 'nurses', 'patients', 'pharmacists', 'pharmacies', 'hospitals']
       })
     
     if (adminError) throw adminError
     
     console.log('Super admin created successfully')
     return {
       email: 'admin@care.com',
       password: '123',
       userId: userId
     }
   } catch (error) {
     console.error('Error creating super admin:', error)
     throw error
   }
 }
 
 createInitialSuperAdmin()
   .then(credentials => console.log('Initial super admin created with credentials:', credentials))
   .catch(err => console.error('Failed to create initial super admin:', err))