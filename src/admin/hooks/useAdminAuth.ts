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
        // First try to get authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        let userData = null;
        
        if (authUser) {
          // User is authenticated through Supabase Auth
          const { data: dbUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', authUser.id)
            .single();

          if (!userError && dbUser) {
            userData = dbUser;
          }
        }
        
        // If no authenticated user or user not found in DB, check for database-only users
        if (!userData) {
          // For now, allow access to admin portal for development
          // In production, you might want to implement a different auth mechanism
          console.log('No authenticated user found, allowing admin access for development');
          
          // Get the first admin user from the database
          const { data: adminUsers, error: adminError } = await supabase
            .from('users')
            .select(`
              *,
              user_roles!inner(
                active,
                roles!inner(name)
              )
            `)
            .eq('user_roles.active', true)
            .eq('user_roles.roles.name', 'admin')
            .limit(1);

          if (!adminError && adminUsers && adminUsers.length > 0) {
            userData = adminUsers[0];
          }
        }

        if (!userData) {
          console.log('No admin user found');
          navigate('/');
          return;
        }

        setUser(userData);

        // Check if user has admin role
        const { data: roles, error: rolesError } = await supabase
          .rpc('get_user_roles', { user_uuid: userData.id });

        if (rolesError) {
          console.error('Error checking roles:', rolesError);
          // For development, assume admin access if user exists
          setIsAdmin(true);
        } else {
          const hasAdminRole = roles.some((role: any) => role.role_name === 'admin');
          setIsAdmin(hasAdminRole);
        }

        if (!isAdmin) {
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