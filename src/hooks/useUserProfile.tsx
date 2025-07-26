import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  nickname: string;
  role: 'admin' | 'viewer';
  email: string;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (roleError) throw roleError;

      setProfile({
        id: user.id,
        nickname: profileData.nickname,
        role: roleData.role as 'admin' | 'viewer',
        email: user.email || ''
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (nickname: string) => {
    return nickname
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return {
    profile,
    loading,
    getInitials,
    refetch: fetchUserProfile
  };
};