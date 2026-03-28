import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testSignup() {
  const email = 'ram_test_' + Math.floor(Math.random() * 1000) + '@gmail.com';
  const password = 'password123';

  console.log(`Testing signup with email: ${email}`);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        phone: '+919876543210',
        full_name: 'Test Ram'
      }
    }
  });

  if (error) {
    console.error("❌ Signup Failed:", error.message, error.status);
    if (error.message.includes("invalid")) {
      console.log("💡 Suggestion: Check if 'Email Provider' is enabled in your Supabase Auth dashboard.");
    }
  } else {
    console.log("✅ Signup Triggered Success! User ID:", data.user?.id);
    console.log("Note: If session is null, check for email confirmation requirement.");
  }
}

testSignup();
