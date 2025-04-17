import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../../hooks/useUserProfile';
import { Shield, User, Save, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { useToast } from '../../shared/hooks/useToast';

export function UserProfileSettings() {
  const { profile, isLoading, updateProfile, isDevUser, isAdmin } = useUserProfile();
  const [formData, setFormData] = useState<{
    display_name?: string | null;
    bio?: string | null;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name,
        bio: profile.bio,
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    setIsSaving(true);
    try {
      await updateProfile(formData);
      addToast({
        type: 'success',
        message: 'Profile updated successfully',
        duration: 3000
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'An error occurred while updating your profile',
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">Profile not found. Please try signing out and back in.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">User Profile</h2>
        </div>
        
        {isDevUser && (
          <Badge variant="primary" animation="pulse" className="px-3 py-1">
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            Developer Access
          </Badge>
        )}
        {isAdmin && !isDevUser && (
          <Badge variant="secondary">
            Admin
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        
        <CardContent>
          <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold">{profile.display_name || 'Anonymous User'}</h3>
                {isAdmin && (
                  <div className="flex items-center mt-1">
                    <Badge variant={isDevUser ? 'secondary' : 'outline'} className="mr-2">
                      {profile.role}
                    </Badge>
                    {profile.is_dev_user && (
                      <Badge variant="success" animation="pulse">
                        <Check className="w-3 h-3 mr-1" />
                        Platform Access
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label htmlFor="display_name" className="block text-sm font-medium mb-1">
                Display Name
              </label>
              <input
                id="display_name"
                name="display_name"
                type="text"
                value={formData.display_name || ''}
                onChange={handleChange}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium mb-1">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                value={formData.bio || ''}
                onChange={handleChange}
                className="block w-full rounded-md border border-input bg-background px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Tell us about yourself..."
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Brief description about yourself.
              </p>
            </div>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-end">
          <Button
            type="submit"
            form="profile-form"
            disabled={isSaving || !formData.display_name}
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        
        <CardContent>
          <dl className="divide-y divide-border">
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-muted-foreground">User ID</dt>
              <dd className="text-sm col-span-2 font-mono text-xs bg-muted p-1 rounded overflow-auto">
                {profile.id}
              </dd>
            </div>
            
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-muted-foreground">Role</dt>
              <dd className="text-sm col-span-2">
                <span className={`inline-flex items-center ${
                  profile.role === 'admin' ? 'text-success' : 
                  profile.role === 'dev' ? 'text-primary' : ''
                }`}>
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  {isDevUser && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Developer
                    </Badge>
                  )}
                </span>
              </dd>
            </div>
            
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-muted-foreground">Member Since</dt>
              <dd className="text-sm col-span-2">
                {new Date(profile.created_at).toLocaleDateString(undefined, { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </dd>
            </div>
            
            <div className="py-3 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-muted-foreground">Last Updated</dt>
              <dd className="text-sm col-span-2">
                {new Date(profile.updated_at).toLocaleDateString(undefined, { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}