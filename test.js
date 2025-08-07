import { createClient } from '@supabase/supabase-js'

// Dán thông tin thật vào đây
const supabaseUrl = 'https://zhpyxxynfgzarbxmkscf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpocHl4eHluZmd6YXJieG1rc2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MzM1ODMsImV4cCI6MjA3MDEwOTU4M30.YdWDWCIhHjELLeeb6dQ_cA8kOm4rehqv3yIw8S7WFK0'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  const { data, error } = await supabase.from('admin_users').select('*')

  if (error) {
    console.error('❌ Lỗi kết nối Supabase:', error.message)
  } else {
    console.log('✅ Kết nối thành công. Dữ liệu:', data)
  }
}

testConnection()
