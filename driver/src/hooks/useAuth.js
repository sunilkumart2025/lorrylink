import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store/useStore';
import i18n from '../i18n';

export const useAuth = () => {
  const { setUser, setLanguage, setSession } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    // Use maybeSingle() to avoid 406 when profile row doesn't exist yet
    const { data } = await supabase
      .from('profiles')
      .select('id, role, name, email, home_city')
      .eq('id', userId)
      .maybeSingle();

    if (data) {
      setUser(data);
      if (data.preferred_language) {
        i18n.changeLanguage(data.preferred_language);
        setLanguage(data.preferred_language);
      }
    } else {
      // Profile doesn't exist — auto-create.
      // Get the auth user to extract email/name
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const email = authUser?.email || authUser?.phone || '';
      const name = authUser?.user_metadata?.full_name || email.split('@')[0] || 'Driver';

      const { data: newProfile } = await supabase
        .from('profiles')
        .insert([{ id: userId, role: 'driver', name, email }])
        .select()
        .single();

      if (newProfile) {
        setUser(newProfile);
      } else {
        // Fallback to in-memory so the app still works
        setUser({ id: userId, role: 'driver', name, email });
      }
    }
    setLoading(false);
  };

  const signInWithOtp = async (phone) => {
    return await supabase.auth.signInWithOtp({ phone });
  };

  const signInWithEmail = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUpWithEmail = async (email, password, phone, metadata) => {
    // Note: If email confirmation is ON in Supabase, session will be null.
    // Handling this in the UI by checking for the 'user' object.
    return await supabase.auth.signUp({ 
      email, 
      password, 
      options: { 
        data: { 
          phone,
          full_name: metadata.name,
          ...metadata 
        } 
      } 
    });
  };

  const verifyOtp = async (phone, token) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) throw error;
      return { data, error: null };
    } catch (err) {
      console.error("OTP Verification Error:", err.message);
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    return await supabase.auth.signOut();
  };

  return { loading, signInWithOtp, signInWithEmail, signUpWithEmail, verifyOtp, signOut };
};
