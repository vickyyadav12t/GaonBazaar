import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Bell,
  Globe,
  Shield,
  Lock,
  CreditCard,
  Trash2,
  Save,
  Eye,
  EyeOff,
  LogOut,
  Camera,
  Loader2,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { setLanguage } from '@/store/slices/languageSlice';
import type { Language } from '@/types';
import { getSettingsStrings } from '@/i18n/locales/settingsLocales';
import { LANGUAGES } from '@/lib/i18n';
import { enHi, scriptFontClass } from '@/lib/i18n';
import { logout, updateUser } from '@/store/slices/authSlice';
import { clearCart } from '@/store/slices/cartSlice';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { apiService } from '@/services/api';
import { clearAuthToken } from '@/services/api';
import { mapApiUserToAuth } from '@/lib/mapAuthUser';
import type { NotificationPreferences } from '@/types';

function prefsFromUser(np: NotificationPreferences | undefined) {
  return {
    emailNotifications: np?.emailNotifications ?? true,
    pushNotifications: np?.pushNotifications ?? true,
    orderUpdates: np?.orderUpdates ?? true,
    messageNotifications: np?.messageNotifications ?? true,
    reviewNotifications: np?.reviewNotifications ?? true,
    promotionalEmails: np?.promotionalEmails ?? false,
  };
}

const Settings = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user } = useAppSelector((state) => state.auth);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [settings, setSettings] = useState({
    // Account Settings
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    
    // Notification Settings (defaults match server)
    ...prefsFromUser(user?.notificationPreferences),
    
    // Privacy Settings
    profileVisibility: 'public',
    showPhoneNumber: false,
    showLocation: true,
    
    // Security
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const t = getSettingsStrings(currentLanguage);

  // Load latest profile from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiService.users.getProfile();
        const backendUser = response.data?.user;
        if (!backendUser) return;

        const mapped = mapApiUserToAuth(backendUser);
        dispatch(updateUser(mapped));
        setSettings((prev) => ({
          ...prev,
          name: mapped.name,
          email: mapped.email,
          phone: mapped.phone,
          ...prefsFromUser(mapped.notificationPreferences),
        }));
      } catch (error: any) {
        // 401s are already handled globally – only show other errors
        const message =
          error?.response?.data?.message ||
          error?.message ||
          enHi(currentLanguage, 'Failed to load profile.', 'प्रोफ़ाइल लोड करने में विफल।');
        toast({
          title: enHi(currentLanguage, 'Error', 'त्रुटि'),
          description: message,
          variant: 'destructive',
        });
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, currentLanguage, dispatch, toast]);

  const handleSave = async (section: string) => {
    // Account section: persist to backend
    if (section === 'account') {
      try {
        setIsSaving(true);
        const payload = {
          name: settings.name,
          email: settings.email,
          phone: settings.phone,
        };
        const response = await apiService.users.updateProfile(payload);
        const backendUser = response.data?.user;

        if (backendUser) {
          const mapped = mapApiUserToAuth(backendUser);
          dispatch(updateUser(mapped));
        }

        toast({
          title: enHi(currentLanguage, 'Settings Saved', 'सेटिंग्स सहेजी गईं'),
          description: enHi(
            currentLanguage,
            'Your account settings have been updated.',
            'आपकी खाता सेटिंग्स अपडेट की गई हैं।',
          ),
        });
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          enHi(
            currentLanguage,
            'Failed to update account settings.',
            'खाता सेटिंग्स अपडेट करने में विफल।',
          );
        toast({
          title: enHi(currentLanguage, 'Error', 'त्रुटि'),
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (section === 'notifications') {
      try {
        setIsSaving(true);
        const notificationPreferences: NotificationPreferences = {
          emailNotifications: settings.emailNotifications,
          pushNotifications: settings.pushNotifications,
          orderUpdates: settings.orderUpdates,
          messageNotifications: settings.messageNotifications,
          reviewNotifications: settings.reviewNotifications,
          promotionalEmails: settings.promotionalEmails,
        };
        const response = await apiService.users.updateProfile({ notificationPreferences });
        const backendUser = response.data?.user;
        if (backendUser) {
          const mapped = mapApiUserToAuth(backendUser);
          dispatch(updateUser(mapped));
          setSettings((prev) => ({
            ...prev,
            ...prefsFromUser(mapped.notificationPreferences),
          }));
        }
        toast({
          title: enHi(currentLanguage, 'Settings Saved', 'सेटिंग्स सहेजी गईं'),
          description: enHi(
            currentLanguage,
            'Your notification preferences have been updated.',
            'आपकी सूचना सेटिंग्स अपडेट की गई हैं।',
          ),
        });
      } catch (error: unknown) {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (error instanceof Error ? error.message : '') ||
          enHi(
            currentLanguage,
            'Failed to save notification settings.',
            'सूचना सेटिंग्स सहेजने में विफल।',
          );
        toast({
          title: enHi(currentLanguage, 'Error', 'त्रुटि'),
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Other sections: keep existing local-only behaviour
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: enHi(currentLanguage, 'Settings Saved', 'सेटिंग्स सहेजी गईं'),
        description: enHi(
          currentLanguage,
          `Your ${section} settings have been updated.`,
          `आपकी ${section} सेटिंग्स अपडेट की गई हैं।`,
        ),
      });
    }, 1000);
  };

  const handleChangePassword = () => {
    if (settings.newPassword !== settings.confirmPassword) {
      toast({
        title: enHi(currentLanguage, 'Password Mismatch', 'पासवर्ड मेल नहीं खाता'),
        description: enHi(
          currentLanguage,
          'New password and confirm password do not match.',
          'नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।',
        ),
        variant: 'destructive',
      });
      return;
    }

    if (settings.newPassword.length < 8) {
      toast({
        title: enHi(currentLanguage, 'Password Too Short', 'पासवर्ड बहुत छोटा'),
        description: enHi(
          currentLanguage,
          'Password must be at least 8 characters long.',
          'पासवर्ड कम से कम 8 वर्ण लंबा होना चाहिए।',
        ),
        variant: 'destructive',
      });
      return;
    }

    handleSave('security');
    setSettings(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
  };

  const displayAvatarUrl =
    user?.avatar?.trim() ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=random`;

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({
        title: enHi(currentLanguage, 'Invalid file', 'अमान्य फ़ाइल'),
        description: enHi(
          currentLanguage,
          'Please choose an image (JPEG, PNG, WebP, or GIF).',
          'कृपया एक छवि चुनें।',
        ),
        variant: 'destructive',
      });
      return;
    }
    try {
      setAvatarUploading(true);
      const uploadRes = await apiService.uploads.uploadAvatar(file);
      const url = uploadRes.data?.url;
      if (!url) throw new Error('No URL returned');

      const updateRes = await apiService.users.updateProfile({ avatar: url });
      const backendUser = updateRes.data?.user;
      if (backendUser) {
        dispatch(updateUser(mapApiUserToAuth(backendUser)));
      } else {
        const profileRes = await apiService.users.getProfile();
        const u = profileRes.data?.user;
        if (u) dispatch(updateUser(mapApiUserToAuth(u)));
      }

      toast({
        title: enHi(currentLanguage, 'Photo updated', 'फोटो अपडेट'),
        description: enHi(
          currentLanguage,
          'Your profile picture has been saved.',
          'आपकी प्रोफ़ाइल फोटो सहेजी गई।',
        ),
      });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error)?.message ||
        enHi(currentLanguage, 'Upload failed.', 'अपलोड विफल।');
      toast({
        title: enHi(currentLanguage, 'Error', 'त्रुटि'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!user?.avatar?.trim()) return;
    try {
      setAvatarUploading(true);
      const updateRes = await apiService.users.updateProfile({ avatar: '' });
      const backendUser = updateRes.data?.user;
      if (backendUser) {
        dispatch(updateUser(mapApiUserToAuth(backendUser)));
      } else {
        const profileRes = await apiService.users.getProfile();
        const u = profileRes.data?.user;
        if (u) dispatch(updateUser(mapApiUserToAuth(u)));
      }
      toast({
        title: enHi(currentLanguage, 'Photo removed', 'फोटो हटाई गई'),
        description: enHi(
          currentLanguage,
          'Your profile picture was cleared.',
          'आपकी प्रोफ़ाइल फोटो हटा दी गई।',
        ),
      });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        enHi(currentLanguage, 'Could not remove photo.', 'फोटो नहीं हटा सके।');
      toast({
        title: enHi(currentLanguage, 'Error', 'त्रुटि'),
        description: message,
        variant: 'destructive',
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    dispatch(clearCart());
    dispatch(logout());
    navigate('/login');
  };

  const handleDeleteAccount = () => {
    clearAuthToken();
    dispatch(clearCart());
    dispatch(logout());
    navigate('/');
    toast({
      title: enHi(currentLanguage, 'Account Deleted', 'खाता हटा दिया गया'),
      description: enHi(
        currentLanguage,
        'Your account has been deleted successfully.',
        'आपका खाता सफलतापूर्वक हटा दिया गया है।',
      ),
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#f6f1e7] bg-[linear-gradient(rgba(138,79,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(138,79,42,0.05)_1px,transparent_1px)] bg-[size:24px_24px]">
      <div className="container mx-auto min-w-0 max-w-4xl px-3 py-5 sm:px-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-[#d7c7a8] bg-[#fffaf0] p-2 text-[#315f3b] transition hover:bg-[#f6eddc]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-2xl font-bold text-[#2f3a2f] ${scriptFontClass(currentLanguage)}`}>
              {t.title}
            </h1>
            <p className={`text-[#6f6552] ${scriptFontClass(currentLanguage)}`}>
              {t.subtitle}
            </p>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 border border-[#d7c7a8] bg-[#f4ead7] p-1">
            <TabsTrigger value="account" className="flex items-center gap-2 text-[#6c5a3d] data-[state=active]:bg-[#fffaf0] data-[state=active]:text-[#315f3b]">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{t.account}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2 text-[#6c5a3d] data-[state=active]:bg-[#fffaf0] data-[state=active]:text-[#315f3b]">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">{t.notifications}</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2 text-[#6c5a3d] data-[state=active]:bg-[#fffaf0] data-[state=active]:text-[#315f3b]">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">{t.privacy}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 text-[#6c5a3d] data-[state=active]:bg-[#fffaf0] data-[state=active]:text-[#315f3b]">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">{t.security}</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <CardHeader>
                <CardTitle className="text-[#2f3a2f]">{t.profileInfo}</CardTitle>
                <CardDescription className="text-[#6f6552]">{t.profileInfoDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-2">
                  <div className="relative shrink-0">
                    <img
                      src={displayAvatarUrl}
                      alt=""
                      className="h-24 w-24 rounded-full border-2 border-[#d7c7a8] bg-[#f3ebdd] object-cover"
                    />
                    {avatarUploading && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-[#fffaf0]/80">
                        <Loader2 className="h-8 w-8 animate-spin text-[#315f3b]" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <Label>{t.profilePhoto}</Label>
                    <p className="text-xs text-[#6f6552]">{t.photoHint}</p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={avatarFileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        onChange={(ev) => void handleAvatarFileChange(ev)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={avatarUploading}
                        onClick={() => avatarFileRef.current?.click()}
                        className="border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {t.uploadPhoto}
                      </Button>
                      {user?.avatar?.trim() ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-[#8a4f2a] hover:bg-[#f6e5dc] hover:text-[#8a4f2a]"
                          disabled={avatarUploading}
                          onClick={() => void handleRemoveAvatar()}
                        >
                          {t.removePhoto}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label htmlFor="name">{t.name}</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1.5 border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1.5 border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t.phone}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1.5 border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                  />
                </div>
                <Button 
                  onClick={() => handleSave('account')} 
                  disabled={isSaving}
                  className="border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]"
                >
                  {isSaving ? (
                    <span className="animate-pulse">{enHi(currentLanguage, 'Saving...', 'सहेजा जा रहा है...')}</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {t.save}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Language Settings */}
            <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#2f3a2f]">
                  <Globe className="w-5 h-5" />
                  {t.language}
                </CardTitle>
                <CardDescription className="text-[#6f6552]">{t.chooseLanguage}</CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={currentLanguage}
                  onValueChange={(value) => dispatch(setLanguage(value as Language))}
                >
                  <SelectTrigger className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.code} value={l.code}>
                        {l.native}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#2f3a2f]">
                  <LogOut className="w-5 h-5" />
                  {t.logOut}
                </CardTitle>
                <CardDescription className="text-[#6f6552]">{t.logOutHint}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" variant="outline" onClick={handleLogout} className="gap-2 border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]">
                  <LogOut className="w-4 h-4" />
                  {t.logOut}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <CardHeader>
                <CardTitle className="text-[#2f3a2f]">{t.notifications}</CardTitle>
                <CardDescription className="text-[#6f6552]">{t.notificationsTabDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t.emailNotif}</Label>
                    <p className="text-sm text-[#6f6552]">{t.emailNotifHelp}</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, emailNotifications: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t.pushNotif}</Label>
                    <p className="text-sm text-[#6f6552]">{t.pushNotifHelp}</p>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, pushNotifications: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t.orderUpdates}</Label>
                    <p className="text-sm text-[#6f6552]">{t.orderUpdatesHelp}</p>
                  </div>
                  <Switch
                    checked={settings.orderUpdates}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, orderUpdates: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t.messageNotif}</Label>
                    <p className="text-sm text-[#6f6552]">{t.messageNotifHelp}</p>
                  </div>
                  <Switch
                    checked={settings.messageNotifications}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, messageNotifications: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t.reviewNotif}</Label>
                    <p className="text-sm text-[#6f6552]">{t.reviewNotifHelp}</p>
                  </div>
                  <Switch
                    checked={settings.reviewNotifications}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, reviewNotifications: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <Label>{t.promoEmails}</Label>
                    <p className="text-sm text-[#6f6552]">{t.promoNotifHelp}</p>
                    <p className={`pt-1 text-xs text-[#6f6552] ${scriptFontClass(currentLanguage)}`}>
                      {t.promoHint}
                    </p>
                  </div>
                  <Switch
                    className="shrink-0"
                    checked={settings.promotionalEmails}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, promotionalEmails: checked }))
                    }
                  />
                </div>

                <Button 
                  onClick={() => handleSave('notifications')} 
                  disabled={isSaving}
                  className="mt-4 border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]"
                >
                  {isSaving ? (
                    <span className="animate-pulse">{enHi(currentLanguage, 'Saving...', 'सहेजा जा रहा है...')}</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {t.save}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <CardHeader>
                <CardTitle className="text-[#2f3a2f]">{t.privacy}</CardTitle>
                <CardDescription className="text-[#6f6552]">{t.privacyTabDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>{t.profileVisibility}</Label>
                  <Select
                    value={settings.profileVisibility}
                    onValueChange={(value) => 
                      setSettings(prev => ({ ...prev, profileVisibility: value }))
                    }
                    className="mt-1.5"
                  >
                    <SelectTrigger className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">{t.public}</SelectItem>
                      <SelectItem value="private">{t.private}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-sm text-[#6f6552]">{t.visibilityHelp}</p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t.showPhone}</Label>
                    <p className="text-sm text-[#6f6552]">{t.showPhoneHelp}</p>
                  </div>
                  <Switch
                    checked={settings.showPhoneNumber}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, showPhoneNumber: checked }))
                    }
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t.showLocation}</Label>
                    <p className="text-sm text-[#6f6552]">{t.showLocationHelp}</p>
                  </div>
                  <Switch
                    checked={settings.showLocation}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, showLocation: checked }))
                    }
                  />
                </div>

                <Button 
                  onClick={() => handleSave('privacy')} 
                  disabled={isSaving}
                  className="mt-4 border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]"
                >
                  {isSaving ? (
                    <span className="animate-pulse">{enHi(currentLanguage, 'Saving...', 'सहेजा जा रहा है...')}</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {t.save}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border-[#d7c7a8] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <CardHeader>
                <CardTitle className="text-[#2f3a2f]">{t.changePassword}</CardTitle>
                <CardDescription className="text-[#6f6552]">{t.securityTabDesc}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">{t.currentPassword}</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={settings.currentPassword}
                      onChange={(e) => setSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b816f] hover:text-[#2f3a2f]"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">{t.newPassword}</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={settings.newPassword}
                      onChange={(e) => setSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b816f] hover:text-[#2f3a2f]"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-[#6f6552]">{t.passwordLengthHint}</p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={settings.confirmPassword}
                      onChange={(e) => setSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b816f] hover:text-[#2f3a2f]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  onClick={handleChangePassword} 
                  disabled={isSaving}
                  className="border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]"
                >
                  {isSaving ? (
                    <span className="animate-pulse">{enHi(currentLanguage, 'Saving...', 'सहेजा जा रहा है...')}</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      {t.changePassword}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-[#d8b0a0] bg-[#fffaf0] shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <CardHeader>
                <CardTitle className="text-[#8a4f2a]">{t.deleteAccount}</CardTitle>
                <CardDescription className="text-[#6f6552]">{t.deleteZoneDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="bg-[#8a4f2a] text-[#fffaf0] hover:bg-[#784223]">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t.deleteAccount}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-[#d7c7a8] bg-[#fffaf0]">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t.deleteWarning}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t.deleteDescription}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-[#8a4f2a] text-[#fffaf0] hover:bg-[#784223]"
                      >
                        {t.delete}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </Layout>
  );
};

export default Settings;






