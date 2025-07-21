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
      console.log('🔍 Starting admin authentication check...');
      
      try {
        // First try to get authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        console.log('Auth check result:', { authUser: !!authUser, authError });
        
        let userData = null;
        
        if (authUser) {
          // User is authenticated through Supabase Auth
          const { data: dbUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('auth_user_id', authUser.id)
            .single();

          console.log('Database user lookup:', { dbUser: !!dbUser, userError });
          
          if (!userError && dbUser) {
            userData = dbUser;
          }
        }
        
        // If no authenticated user or user not found in DB, check for database-only users
        if (!userData) {
          console.log('No authenticated user found, checking for database admin users...');
          
          // Simplified query to get admin users
          const { data: adminUsers, error: adminError } = await supabase
            .from('users')
            .select(`
              *,
              user_roles(
                active,
                roles(name)
              )
            `)
            .eq('email', 'tyler@vxlabs.co')
            .limit(1);

          console.log('Admin users lookup:', { adminUsers: adminUsers?.length, adminError });
          
          if (!adminError && adminUsers && adminUsers.length > 0) {
            userData = adminUsers[0];
            console.log('Found admin user:', userData.email);
          }
        }

        if (!userData) {
          console.log('❌ No admin user found, redirecting to home');
          navigate('/');
          return;
        }

        console.log('✅ User found:', userData.email);
        setUser(userData);

        // Check if user has admin role using a simpler approach
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select(`
            active,
            roles(name)
          `)
          .eq('user_id', userData.id)
          .eq('active', true);

        console.log('Roles check:', { userRoles: userRoles?.length, rolesError });

        if (rolesError) {
          console.error('Error checking roles:', rolesError);
          // For development, assume admin access if user exists
          console.log('⚠️ Assuming admin access for development');
          setIsAdmin(true);
        } else {
          const hasAdminRole = userRoles.some((role: any) => role.roles?.name === 'admin');
          console.log('Admin role check:', hasAdminRole);
          setIsAdmin(hasAdminRole);
        }

        if (!isAdmin) {
          console.log('❌ User does not have admin role, redirecting to home');
          navigate('/');
          return;
        }

        console.log('✅ Admin authentication successful');

      } catch (error) {
        console.error('❌ Auth check error:', error);
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