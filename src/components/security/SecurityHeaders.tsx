import { Helmet, HelmetProvider } from 'react-helmet-async';
import { helmetConfig } from '@/config/security';

interface SecurityHeadersProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export const SecurityHeaders = ({
  children,
  title = 'A&B CodeDev',
  description = 'AI-powered development tools for modern developers',
}: SecurityHeadersProps) => {
  return (
    <HelmetProvider>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        
        {/* Security Headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=()" />
        
        {/* CSP Header - Configured in helmetConfig */}
        <meta
          httpEquiv="Content-Security-Policy"
          content={
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https: http:; " +
            "connect-src 'self' " + (process.env.REACT_APP_API_URL || '') + "; " +
            "font-src 'self'; " +
            "object-src 'none'; " +
            "media-src 'self'; " +
            "frame-src 'none';"
          }
        />
        
        {/* Other security headers */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta name="theme-color" content="#ffffff" />
      </Helmet>
      {children}
    </HelmetProvider>
  );
};

export default SecurityHeaders;
