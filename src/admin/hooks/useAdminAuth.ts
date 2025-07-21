import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User } from '../types';

export const useAdminAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get current user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authUser) {
          console.log('No authenticated user');
          navigate('/');
          return;
        }

        // Get user data from our users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .single();

        if (userError || !userData) {
          console.log('User not found in database');
          navigate('/');
          return;
        }

        setUser(userData);

        // Check if user has admin role
        const { data: roles, error: rolesError } = await supabase
          .rpc('get_user_roles', { user_uuid: userData.id });

        if (rolesError) {
          console.error('Error checking roles:', rolesError);
          navigate('/');
          return;
        }

        const hasAdminRole = roles.some((role: any) => role.role_name === 'admin');
        setIsAdmin(hasAdminRole);

        if (!hasAdminRole) {
          console.log('User does not have admin role');
          navigate('/');
          return;
        }

      } catch (error) {
        console.error('Auth check error:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return {
    user,
    isAdmin,
    loading,
    signOut
  };
}; 