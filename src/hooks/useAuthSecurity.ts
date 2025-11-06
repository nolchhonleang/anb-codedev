import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { passwordPolicy } from '@/config/security';

/**
 * Custom hook for authentication and authorization security
 */
export const useAuthSecurity = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [inactiveTime, setInactiveTime] = useState(0);
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  // Check if user has required role
  const hasRole = useCallback((requiredRole: string): boolean => {
    if (!user) return false;
    return user.roles?.includes(requiredRole) || false;
  }, [user]);

  // Check if user has any of the required roles
  const hasAnyRole = useCallback((roles: string[]): boolean => {
    if (!user) return false;
    return roles.some(role => user.roles?.includes(role));
  }, [user]);

  // Validate password strength
  const validatePassword = (password: string): { isValid: boolean; message?: string } => {
    if (password.length < passwordPolicy.minLength) {
      return {
        isValid: false,
        message: `Password must be at least ${passwordPolicy.minLength} characters long`
      };
    }

    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one uppercase letter'
      };
    }

    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one lowercase letter'
      };
    }

    if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one number'
      };
    }

    if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return {
        isValid: false,
        message: 'Password must contain at least one special character'
      };
    }

    // Add zxcvbn or similar for password strength check if needed
    // const result = zxcvbn(password);
    // if (result.score < passwordPolicy.minStrength) {
    //   return {
    //     isValid: false,
    //     message: 'Password is too weak. Please choose a stronger password.'
    //   };
    // }

    return { isValid: true };
  };

  // Handle user inactivity
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      setInactiveTime(0);
      
      inactivityTimer = setTimeout(() => {
        // Logout user after inactivity
        if (user) {
          logout();
          navigate('/login', { state: { sessionExpired: true } });
        }
      }, INACTIVITY_TIMEOUT);
    };

    // Set up event listeners
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // Initial timer setup
    resetTimer();

    // Clean up
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [user, logout, navigate]);

  // Check if the current route is accessible by the user
  const isRouteAccessible = useCallback((requiredRoles?: string[]): boolean => {
    if (!user) return false;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return hasAnyRole(requiredRoles);
  }, [user, hasAnyRole]);

  return {
    hasRole,
    hasAnyRole,
    validatePassword,
    isRouteAccessible,
    inactiveTime,
    INACTIVITY_TIMEOUT
  };
};

export default useAuthSecurity;
