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

        // Check if user has admin role
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select(`
            active,
            roles(name)
          `)
          .eq('user_id', dbUser.id)
          .eq('active', true);

        if (rolesError) {
          console.error('Error checking roles:', rolesError);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        const hasAdminRole = userRoles.some((ur: any) => 
          ur.active && ur.roles?.name === 'admin'
        );

        setIsAdmin(hasAdminRole);
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