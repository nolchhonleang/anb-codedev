import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Camera, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Form validation schema
const profileSchema = z.object({
  name: z.string()
    .min(2, { message: 'Name must be at least 2 characters' })
    .max(50, { message: 'Name must be less than 50 characters' })
    .regex(/^[a-zA-Z\s'-]+$/, { message: 'Name can only contain letters, spaces, hyphens, and apostrophes' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional()
}).superRefine((data, ctx) => {
  // Only validate passwords if any password field is filled
  if (data.currentPassword || data.newPassword || data.confirmPassword) {
    if (!data.currentPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Current password is required to change password',
        path: ['currentPassword']
      });
    }

    if (data.newPassword) {
      // Enhanced password requirements
      if (data.newPassword.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must be at least 8 characters long',
          path: ['newPassword']
        });
      }

      if (!/(?=.*[a-z])/.test(data.newPassword)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must contain at least one lowercase letter',
          path: ['newPassword']
        });
      }

      if (!/(?=.*[A-Z])/.test(data.newPassword)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must contain at least one uppercase letter',
          path: ['newPassword']
        });
      }

      if (!/(?=.*\d)/.test(data.newPassword)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must contain at least one number',
          path: ['newPassword']
        });
      }

      if (!/(?=.*[@$!%*?&])/.test(data.newPassword)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Password must contain at least one special character (@$!%*?&)',
          path: ['newPassword']
        });
      }

      if (data.newPassword === data.currentPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'New password must be different from current password',
          path: ['newPassword']
        });
      }

      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Passwords don't match",
          path: ['confirmPassword']
        });
      }
    }
  }
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    control, 
    handleSubmit, 
    formState: { errors, isDirty }, 
    reset,
    watch
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
      different: password !== currentPassword && password.length > 0
    };

    score = Object.values(checks).filter(Boolean).length;
    return { score, checks };
  };

  const passwordStrength = newPassword ? getPasswordStrength(newPassword) : { score: 0, checks: {} };

  // Get user initials for avatar
  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase();
    }
    return email ? email[0].toUpperCase() : 'U';
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Set initial avatar preview
  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      setAvatarPreview(user.user_metadata.avatar_url);
    }
  }, [user]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('name, avatar_url')
        .eq('id', user.id)
        .single();
      if (!error && data) {
        reset({
          name: data.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
          email: user?.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        if (data.avatar_url) setAvatarPreview(data.avatar_url);
      }
    };
    loadProfile();
  }, [user?.id]);

  // Upload avatar to storage
  const uploadAvatar = async (file: File, userId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  // Handle form submission
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      setIsLoading(true);
      setIsEditing(true);

      // 1. Upload avatar first if there's a new one
      let newAvatarUrl: string | undefined;
      if (avatarFile && user?.id) {
        try {
          newAvatarUrl = await uploadAvatar(avatarFile, user.id);
          setAvatarPreview(newAvatarUrl);
        } catch (error) {
          console.error('Error uploading avatar:', error);
          throw new Error('Failed to upload avatar. Please try again.');
        }
      }

      // 2. Update auth and profile in parallel
      const updates = [
        supabase.auth.updateUser({
          data: {
            full_name: data.name,
            ...(newAvatarUrl ? { avatar_url: newAvatarUrl } : {})
          }
        }),
        supabase.from('profiles').upsert({
          id: user!.id,
          email: user!.email || '',
          name: data.name,
          ...(newAvatarUrl ? { avatar_url: newAvatarUrl } : {}),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
      ];

      // 3. Execute all updates
      const [authRes, profileRes] = await Promise.all(updates);

      if (authRes.error) throw authRes.error;
      if (profileRes.error) throw profileRes.error;

      // 4. Update password if needed
      if (data.newPassword && data.confirmPassword) {
        const { error: updateError } = await supabase.auth.updateUser({
          password: data.newPassword
        });
        if (updateError) throw updateError;
        toast.success('Password updated successfully');
      }

      // 5. Refresh user data
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        await updateProfile(updatedUser);
      }

      // 6. Show success and redirect
      toast.success('Profile updated successfully');
      
      // Small delay to ensure toast is visible before redirect
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  // Handle cancel button click
  const handleCancel = () => {
    reset({
      name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setAvatarPreview(user?.user_metadata?.avatar_url || '');
    setAvatarFile(null);
    setIsEditing(false);
  };

  // Show loading state while user data is being fetched
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Profile Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-2 border-primary/20">
                  <AvatarImage src={avatarPreview} alt="Profile" />
                  <AvatarFallback className="text-xl">
                    {getUserInitials(
                      user?.user_metadata?.full_name || user?.email?.split('@')[0],
                      user?.email
                    )}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full hover:bg-primary/90 transition-colors"
                  aria-label="Change profile picture"
                >
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/jpg"
                    className="hidden"
                  />
                </button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Click on the camera icon to change your profile picture (max 5MB)
              </p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="name"
                          placeholder="Enter your full name"
                          {...field}
                          className="mt-1"
                        />
                      )}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="mt-1 bg-muted"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Contact support to change your email address
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="password" className="space-y-6 pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Controller
                      name="currentPassword"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="currentPassword"
                          type="password"
                          placeholder="Enter your current password"
                          className="mt-1"
                          {...field}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Controller
                      name="newPassword"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="Enter a new password"
                          className="mt-1"
                          {...field}
                        />
                      )}
                    />
                    {errors.newPassword && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.newPassword.message}
                      </p>
                    )}

                    {/* Password Strength Indicator */}
                    {newPassword && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                passwordStrength.score <= 2 ? 'bg-red-500' :
                                passwordStrength.score <= 4 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${
                            passwordStrength.score <= 2 ? 'text-red-500' :
                            passwordStrength.score <= 4 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {passwordStrength.score <= 2 ? 'Weak' :
                             passwordStrength.score <= 4 ? 'Medium' : 'Strong'}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className={`flex items-center gap-2 ${passwordStrength.checks.length ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.checks.length ? 'bg-green-500' : 'bg-gray-300'}`} />
                            At least 8 characters
                          </div>
                          <div className={`flex items-center gap-2 ${passwordStrength.checks.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.checks.lowercase ? 'bg-green-500' : 'bg-gray-300'}`} />
                            One lowercase letter
                          </div>
                          <div className={`flex items-center gap-2 ${passwordStrength.checks.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.checks.uppercase ? 'bg-green-500' : 'bg-gray-300'}`} />
                            One uppercase letter
                          </div>
                          <div className={`flex items-center gap-2 ${passwordStrength.checks.number ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.checks.number ? 'bg-green-500' : 'bg-gray-300'}`} />
                            One number
                          </div>
                          <div className={`flex items-center gap-2 ${passwordStrength.checks.special ? 'text-green-600' : 'text-gray-400'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.checks.special ? 'bg-green-500' : 'bg-gray-300'}`} />
                            One special character (@$!%*?&)
                          </div>
                          {currentPassword && (
                            <div className={`flex items-center gap-2 ${passwordStrength.checks.different ? 'text-green-600' : 'text-red-500'}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${passwordStrength.checks.different ? 'bg-green-500' : 'bg-red-400'}`} />
                              Different from current password
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!newPassword && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Password must meet all security requirements
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Controller
                      name="confirmPassword"
                      control={control}
                      render={({ field }) => (
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm your new password"
                          className="mt-1"
                          {...field}
                        />
                      )}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || (!isDirty && !avatarFile && !newPassword)}
                className="min-w-32"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;