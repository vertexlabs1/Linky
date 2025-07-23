import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useAdminCheck = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        // Get current auth user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Get user from database
        const { data: dbUser, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', authUser.id)
          .single();

        if (userError || !dbUser) {
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        // Check if user has admin role using is_admin boolean
        const { data: userWithAdmin, error: adminError } = await supabase
          .from('users')
          .select('is_admin')
          .eq('id', dbUser.id)
          .single();

        if (adminError) {
          console.error('Error checking admin status:', adminError);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setIsAdmin(userWithAdmin?.is_admin === true);
        setLoading(false);

      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, []);

  return { isAdmin, loading };
};
