"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSupabaseAuthContext } from './supabase-auth-context';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface AppUser {
  id: string;
  email: string;
  role: AppRole;
}

interface AppAuthContextType {
  user: AppUser | null;
  role: AppRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isForeman: boolean;
  isUser: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
}

const AppAuthContext = createContext<AppAuthContextType | undefined>(undefined);

export function AppAuthProvider({ children }: { children: ReactNode }) {
  const { user: supabaseUser, loading: supabaseLoading } = useSupabaseAuthContext();
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUserRole() {
      if (!supabaseUser) {
        setAppUser(null);
        setLoading(false);
        return;
      }

      try {
        // Get user role from user_roles table
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', supabaseUser.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned, which is OK for new users
          console.error('Error fetching user role:', error);
        }

        const role: AppRole = data?.role || 'user'; // Default to 'user' if no role found

        setAppUser({
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          role,
        });
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setAppUser(null);
      } finally {
        setLoading(false);
      }
    }

    if (!supabaseLoading) {
      fetchUserRole();
    }
  }, [supabaseUser, supabaseLoading, supabase]);

  const hasRole = (role: AppRole): boolean => {
    return appUser?.role === role;
  };

  const hasAnyRole = (roles: AppRole[]): boolean => {
    return appUser ? roles.includes(appUser.role) : false;
  };

  const value: AppAuthContextType = {
    user: appUser,
    role: appUser?.role || null,
    isLoading: loading || supabaseLoading,
    isAdmin: appUser?.role === 'admin',
    isForeman: appUser?.role === 'foreman',
    isUser: appUser?.role === 'user',
    hasRole,
    hasAnyRole,
  };

  return (
    <AppAuthContext.Provider value={value}>
      {children}
    </AppAuthContext.Provider>
  );
}

export function useAppAuth() {
  const context = useContext(AppAuthContext);
  if (context === undefined) {
    throw new Error('useAppAuth must be used within an AppAuthProvider');
  }
  return context;
}

