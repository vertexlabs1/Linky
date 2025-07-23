import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { User } from '../types';

export const useAdminAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔍 Starting admin authentication check...');
      
      try {
        // First try to get authenticated user
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        
        console.log('Auth check result:', { authUser: !!authUser, authError });
        
        if (!authUser) {
          console.log('❌ No authenticated user, showing login form');
          setShowLogin(true);
          setLoading(false);
          return;
        }

        // User is authenticated, check if they exist in our users table
        const { data: dbUser, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', authUser.id)
          .single();

        console.log('Database user lookup:', { dbUser: !!dbUser, userError });
        
        if (userError || !dbUser) {
          console.log('❌ User not found in database, showing login form');
          setShowLogin(true);
          setLoading(false);
          return;
        }

        console.log('✅ User found:', dbUser.email);
        setUser(dbUser);

        // Check if user has admin role using is_admin boolean
        console.log('Admin check:', { is_admin: dbUser.is_admin });
        
        if (!dbUser.is_admin) {
          console.log('❌ User does not have admin role, showing login form');
          setShowLogin(true);
          setLoading(false);
          return;
        }

        setIsAdmin(true);
        setShowLogin(false);
        console.log('✅ Admin authentication successful');

      } catch (error) {
        console.error('❌ Auth check error:', error);
        setShowLogin(true);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
    setShowLogin(true);
  };

  return {
    user,
    isAdmin,
    loading,
    showLogin,
    signOut
  };
};
