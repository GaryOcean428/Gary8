import React, { useState } from 'react';
import { useUserProfile, UserProfile } from '../hooks/useUserProfile';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';
import { Badge } from './ui/Badge';
import { User, Edit, Save, Settings, Shield, AlertCircle, Check } from 'lucide-react';

export function UserProfileComponent() {
  const { profile, isLoading, updateProfile, isDevUser, isAdmin } = useUserProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    if (!profile) return;
    
    setFormData({
      display_name: profile.display_name,
      bio: profile.bio,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData) return;
    
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center flex-col text-center p-6">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Profile Not Found</h3>
            <p className="text-muted-foreground">We couldn't find your user profile. Please try signing out and back in.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">User Profile</CardTitle>
          {isDevUser && (
            <Badge variant="primary" className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Developer Access</span>
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            
            <div>
              {isEditing ? (
                <div className="space-y-2">
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
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    />
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          </div>
          
          {/* About Section */}
          <div>
            <h4 className="text-sm font-medium mb-2">About</h4>
            {isEditing ? (
              <textarea
                id="bio"
                name="bio"
                value={formData.bio || ''}
                onChange={handleChange}
                className="w-full rounded-md border border-input bg-background px-3 py-2 h-24"
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-muted-foreground">
                {profile.bio || 'No bio provided.'}
              </p>
            )}
          </div>
          
          {/* Account Details */}
          <div>
            <h4 className="text-sm font-medium mb-2">Account Details</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span>{profile.role}</span>
              </div>
              {isDevUser && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Developer Access</span>
                  <span className="text-success flex items-center">
                    <Check className="w-4 h-4 mr-1" /> Enabled
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since</span>
                <span>{new Date(profile.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {isEditing ? (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              leftIcon={isSaving ? undefined : <Save className="w-4 h-4" />}
              isLoading={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              leftIcon={<Edit className="w-4 h-4" />}
              onClick={handleEdit}
            >
              Edit Profile
            </Button>
            <Button 
              variant="secondary" 
              leftIcon={<Settings className="w-4 h-4" />}
              onClick={() => window.location.hash = '#/settings'}
            >
              Settings
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}