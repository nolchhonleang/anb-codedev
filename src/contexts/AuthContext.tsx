import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from "react";
import { User, Session, UserResponse, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  full_name: string | null;
  bio: string | null;
  website: string | null;
  github: string | null;
  twitter: string | null;
  linkedin: string | null;
  preferred_language: string | null;
  theme: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isEmailVerified: boolean;
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  resendVerification: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch user profile from database
  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If profiles table doesn't exist, create a mock profile
        if (error.code === 'PGRST116' || error.code === 'PGRST205' || error.message.includes('Could not find the table') || error.message.includes('schema cache')) {
          console.warn('Profiles table not found. Using mock profile. Please run the database setup script.');
          const mockProfile: UserProfile = {
            id: userId,
            email: 'user@example.com',
            name: 'User',
            full_name: 'User',
            bio: null,
            website: null,
            github: null,
            twitter: null,
            linkedin: null,
            preferred_language: 'en',
            theme: 'system',
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          setProfile(mockProfile);
          return mockProfile;
        }
        // Don't throw error, just log it and return null
        console.warn('Profile fetch error:', error);
        return null;
      }
      
      setProfile(data);
      return data;
    } catch (error) {
      console.warn('Error fetching user profile:', error);
      // Create mock profile as fallback
      const mockProfile: UserProfile = {
        id: userId,
        email: 'user@example.com',
        name: 'User',
        full_name: 'User',
        bio: null,
        website: null,
        github: null,
        twitter: null,
        linkedin: null,
        preferred_language: 'en',
        theme: 'system',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(mockProfile);
      return mockProfile;
    }
  }, []);

  // Update user profile in database
  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('User not authenticated') };
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      setProfile(data);
      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: error as Error };
    }
  };

  // Handle auth state changes
  useEffect(() => {
    console.log('AuthProvider: Setting up auth state listener');
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    let subscription: { unsubscribe: () => void } | null = null;

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      console.log(`Auth state changed: ${event}`, { 
        hasSession: !!session,
        userId: session?.user?.id 
      });
      
      if (!mounted) return;
      
      try {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          console.log('Auth state change: Fetching profile for user', currentUser.id);
          await fetchUserProfile(currentUser.id);
        } else {
          console.log('Auth state change: No user, setting profile to null');
          setProfile(null);
        }
      } catch (error) {
        console.error('Error in auth state change handler:', error);
        if (mounted) {
          setProfile(null);
        }
      } finally {
        if (mounted) {
          console.log('Auth state change handling complete');
          setIsLoading(false);
        }
      }
    };

    // Initialize auth state
    const initAuth = async () => {
      console.log('AuthProvider: Initializing auth...');
      
      // Safety timeout to prevent infinite loading
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.warn('Auth initialization timeout reached, forcing state update');
          setIsLoading(false);
        }
      }, 3000); // 3 second timeout
      
      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          throw error;
        }

        if (!mounted) return;
        
        console.log('Initial session check:', session ? 'Session found' : 'No active session');
        
        // Set up auth state change listener
        const { data } = supabase.auth.onAuthStateChange(handleAuthStateChange);
        subscription = { unsubscribe: data.subscription.unsubscribe };
        
        // Initial state setup
        if (session?.user) {
          console.log('Initial user found, loading profile...');
          await handleAuthStateChange('INITIAL_SESSION', session);
        } else {
          console.log('No initial user, setting empty state');
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
      } finally {
        if (mounted) {
          clearTimeout(timeoutId);
        }
      }
    };

    // Start auth initialization
    initAuth();
    
    // Cleanup function
    return () => {
      console.log('AuthProvider: Cleaning up auth listener');
      mounted = false;
      clearTimeout(timeoutId);
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchUserProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: name,
        },
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      // Always reset local state, even if there was an error
      setUser(null);
      setProfile(null);
      setSession(null);
      
      if (error) throw error;
      
      toast({
        title: "Signed out",
        description: "You've been successfully signed out",
      });
      
      // Force a hard navigation to the auth page
      window.location.href = '/auth';
      
      return { error: null };
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: error?.message || 'Failed to sign out',
        variant: "destructive",
      });
      return { error };
    }
  }, [toast]);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  }, []);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    return await updateUserProfile(updates);
  }, [updateUserProfile]);

  const resendVerification = useCallback(async () => {
    if (!user?.email) {
      return { error: new Error('No user email found') };
    }
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    });
    
    return { error: error ? new Error(error.message) : null };
  }, [user?.email]);

  const isEmailVerified = user?.email_confirmed_at != null;

  const value = useMemo(() => ({
    user,
    profile,
    session,
    isLoading,
    isEmailVerified,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    resendVerification,
  }), [user, profile, session, isLoading, isEmailVerified, signIn, signUp, signOut, resetPassword, updateProfile, resendVerification]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
