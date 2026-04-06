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
import { toggleLanguage, setLanguage } from '@/store/slices/languageSlice';
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
          (currentLanguage === 'en'
            ? 'Failed to load profile.'
            : 'प्रोफ़ाइल लोड करने में विफल।');
        toast({
          title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
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
          title:
            currentLanguage === 'en'
              ? 'Settings Saved'
              : 'सेटिंग्स सहेजी गईं',
          description:
            currentLanguage === 'en'
              ? 'Your account settings have been updated.'
              : 'आपकी खाता सेटिंग्स अपडेट की गई हैं।',
        });
      } catch (error: any) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Failed to update account settings.'
            : 'खाता सेटिंग्स अपडेट करने में विफल।');
        toast({
          title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
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
          title:
            currentLanguage === 'en'
              ? 'Settings Saved'
              : 'सेटिंग्स सहेजी गईं',
          description:
            currentLanguage === 'en'
              ? 'Your notification preferences have been updated.'
              : 'आपकी सूचना सेटिंग्स अपडेट की गई हैं।',
        });
      } catch (error: unknown) {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (error instanceof Error ? error.message : '') ||
          (currentLanguage === 'en'
            ? 'Failed to save notification settings.'
            : 'सूचना सेटिंग्स सहेजने में विफल।');
        toast({
          title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
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
        title: currentLanguage === 'en' ? 'Settings Saved' : 'सेटिंग्स सहेजी गईं',
        description: currentLanguage === 'en' 
          ? `Your ${section} settings have been updated.`
          : `आपकी ${section} सेटिंग्स अपडेट की गई हैं।`,
      });
    }, 1000);
  };

  const handleChangePassword = () => {
    if (settings.newPassword !== settings.confirmPassword) {
      toast({
        title: currentLanguage === 'en' ? 'Password Mismatch' : 'पासवर्ड मेल नहीं खाता',
        description: currentLanguage === 'en' 
          ? 'New password and confirm password do not match.'
          : 'नया पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।',
        variant: 'destructive',
      });
      return;
    }

    if (settings.newPassword.length < 8) {
      toast({
        title: currentLanguage === 'en' ? 'Password Too Short' : 'पासवर्ड बहुत छोटा',
        description: currentLanguage === 'en' 
          ? 'Password must be at least 8 characters long.'
          : 'पासवर्ड कम से कम 8 वर्ण लंबा होना चाहिए।',
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
        title: currentLanguage === 'en' ? 'Invalid file' : 'अमान्य फ़ाइल',
        description:
          currentLanguage === 'en'
            ? 'Please choose an image (JPEG, PNG, WebP, or GIF).'
            : 'कृपया एक छवि चुनें।',
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
        title: currentLanguage === 'en' ? 'Photo updated' : 'फोटो अपडेट',
        description:
          currentLanguage === 'en'
            ? 'Your profile picture has been saved.'
            : 'आपकी प्रोफ़ाइल फोटो सहेजी गई।',
      });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error)?.message ||
        (currentLanguage === 'en' ? 'Upload failed.' : 'अपलोड विफल।');
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
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
        title: currentLanguage === 'en' ? 'Photo removed' : 'फोटो हटाई गई',
        description:
          currentLanguage === 'en'
            ? 'Your profile picture was cleared.'
            : 'आपकी प्रोफ़ाइल फोटो हटा दी गई।',
      });
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (currentLanguage === 'en' ? 'Could not remove photo.' : 'फोटो नहीं हटा सके।');
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
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
      title: currentLanguage === 'en' ? 'Account Deleted' : 'खाता हटा दिया गया',
      description: currentLanguage === 'en' 
        ? 'Your account has been deleted successfully.'
        : 'आपका खाता सफलतापूर्वक हटा दिया गया है।',
    });
  };

  const content = {
    en: {
      title: 'Settings',
      subtitle: 'Manage your account settings and preferences',
      account: 'Account',
      notifications: 'Notifications',
      privacy: 'Privacy',
      security: 'Security',
      language: 'Language',
      profileInfo: 'Profile Information',
      name: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      save: 'Save Changes',
      emailNotif: 'Email Notifications',
      pushNotif: 'Push Notifications',
      orderUpdates: 'Order Updates',
      messageNotif: 'Message Notifications',
      reviewNotif: 'Review Notifications',
      promoEmails: 'Promotional Emails',
      profileVisibility: 'Profile Visibility',
      public: 'Public',
      private: 'Private',
      showPhone: 'Show Phone Number',
      showLocation: 'Show Location',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      deleteAccount: 'Delete Account',
      deleteWarning: 'Are you sure you want to delete your account?',
      deleteDescription: 'This action cannot be undone. All your data will be permanently deleted.',
      cancel: 'Cancel',
      delete: 'Delete',
      english: 'English',
      hindi: 'Hindi',
      logOut: 'Log out',
      logOutHint: 'Sign out on this device. You can sign in again anytime.',
      profilePhoto: 'Profile photo',
      uploadPhoto: 'Upload photo',
      removePhoto: 'Remove photo',
      photoHint: 'JPG, PNG, WebP or GIF. Max 2 MB.',
      promoHint:
        'When off, you will not be included in admin announcement broadcasts in the app. Order and account messages are not affected.',
    },
    hi: {
      title: 'सेटिंग्स',
      subtitle: 'अपनी खाता सेटिंग्स और प्राथमिकताएं प्रबंधित करें',
      account: 'खाता',
      notifications: 'सूचनाएं',
      privacy: 'गोपनीयता',
      security: 'सुरक्षा',
      language: 'भाषा',
      profileInfo: 'प्रोफ़ाइल जानकारी',
      name: 'पूरा नाम',
      email: 'ईमेल पता',
      phone: 'फोन नंबर',
      save: 'परिवर्तन सहेजें',
      emailNotif: 'ईमेल सूचनाएं',
      pushNotif: 'पुश सूचनाएं',
      orderUpdates: 'ऑर्डर अपडेट',
      messageNotif: 'संदेश सूचनाएं',
      reviewNotif: 'समीक्षा सूचनाएं',
      promoEmails: 'प्रचार ईमेल',
      profileVisibility: 'प्रोफ़ाइल दृश्यता',
      public: 'सार्वजनिक',
      private: 'निजी',
      showPhone: 'फोन नंबर दिखाएं',
      showLocation: 'स्थान दिखाएं',
      changePassword: 'पासवर्ड बदलें',
      currentPassword: 'वर्तमान पासवर्ड',
      newPassword: 'नया पासवर्ड',
      confirmPassword: 'पासवर्ड की पुष्टि करें',
      deleteAccount: 'खाता हटाएं',
      deleteWarning: 'क्या आप वाकई अपना खाता हटाना चाहते हैं?',
      deleteDescription: 'यह क्रिया पूर्ववत नहीं की जा सकती। आपका सभी डेटा स्थायी रूप से हटा दिया जाएगा।',
      cancel: 'रद्द करें',
      delete: 'हटाएं',
      english: 'अंग्रेजी',
      hindi: 'हिंदी',
      logOut: 'लॉग आउट',
      logOutHint: 'इस डिवाइस से साइन आउट करें। आप कभी भी फिर से लॉग इन कर सकते हैं।',
      profilePhoto: 'प्रोफ़ाइल फोटो',
      uploadPhoto: 'फोटो अपलोड करें',
      removePhoto: 'फोटो हटाएं',
      photoHint: 'JPG, PNG, WebP या GIF। अधिकतम 2 MB।',
      promoHint:
        'बंद होने पर ऐप में व्यवस्थापक की घोषणा प्रसारण सूचनाओं में आप शामिल नहीं होंगे। ऑर्डर और खाता संबंधी संदेश पर असर नहीं पड़ता।',
    },
  };

  const t = content[currentLanguage];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
              {t.title}
            </h1>
            <p className={`text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
              {t.subtitle}
            </p>
          </div>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{t.account}</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">{t.notifications}</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">{t.privacy}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">{t.security}</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.profileInfo}</CardTitle>
                <CardDescription>
                  {currentLanguage === 'en' 
                    ? 'Update your profile information' 
                    : 'अपनी प्रोफ़ाइल जानकारी अपडेट करें'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-2">
                  <div className="relative shrink-0">
                    <img
                      src={displayAvatarUrl}
                      alt=""
                      className="h-24 w-24 rounded-full object-cover border-2 border-border bg-muted"
                    />
                    {avatarUploading && (
                      <div className="absolute inset-0 rounded-full bg-background/70 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 flex-1 min-w-0">
                    <Label>{t.profilePhoto}</Label>
                    <p className="text-xs text-muted-foreground">{t.photoHint}</p>
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
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        {t.uploadPhoto}
                      </Button>
                      {user?.avatar?.trim() ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
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
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t.email}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t.phone}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1.5"
                  />
                </div>
                <Button 
                  onClick={() => handleSave('account')} 
                  disabled={isSaving}
                  className="btn-primary-gradient"
                >
                  {isSaving ? (
                    <span className="animate-pulse">{currentLanguage === 'en' ? 'Saving...' : 'सहेजा जा रहा है...'}</span>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {t.language}
                </CardTitle>
                <CardDescription>
                  {currentLanguage === 'en' 
                    ? 'Choose your preferred language' 
                    : 'अपनी पसंदीदा भाषा चुनें'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select 
                  value={currentLanguage} 
                  onValueChange={(value: 'en' | 'hi') => dispatch(setLanguage(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">{t.english}</SelectItem>
                    <SelectItem value="hi">{t.hindi}</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LogOut className="w-5 h-5" />
                  {t.logOut}
                </CardTitle>
                <CardDescription>{t.logOutHint}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button type="button" variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  {t.logOut}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.notifications}</CardTitle>
                <CardDescription>
                  {currentLanguage === 'en' 
                    ? 'Manage your notification preferences' 
                    : 'अपनी सूचना प्राथमिकताएं प्रबंधित करें'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t.emailNotif}</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentLanguage === 'en'
                        ? 'Order and account emails go to the address in Profile. The server must have SMTP configured (not only this toggle).'
                        : 'ऑर्डर और खाता ईमेल प्रोफ़ाइल में दिए ईमेल पर जाते हैं। सर्वर पर SMTP सेट होना चाहिए (केवल यह स्विच पर्याप्त नहीं)।'}
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      {currentLanguage === 'en' 
                        ? 'Receive push notifications in browser' 
                        : 'ब्राउज़र में पुश सूचनाएं प्राप्त करें'}
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      {currentLanguage === 'en' 
                        ? 'Get notified about order status changes' 
                        : 'ऑर्डर स्थिति परिवर्तन के बारे में सूचना प्राप्त करें'}
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      {currentLanguage === 'en' 
                        ? 'Notifications for new messages' 
                        : 'नए संदेशों के लिए सूचनाएं'}
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      {currentLanguage === 'en' 
                        ? 'Notifications for new reviews' 
                        : 'नई समीक्षाओं के लिए सूचनाएं'}
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      {currentLanguage === 'en' 
                        ? 'Receive promotional emails and offers' 
                        : 'प्रचार ईमेल और ऑफ़र प्राप्त करें'}
                    </p>
                    <p className={`text-xs text-muted-foreground pt-1 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
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
                  className="btn-primary-gradient mt-4"
                >
                  {isSaving ? (
                    <span className="animate-pulse">{currentLanguage === 'en' ? 'Saving...' : 'सहेजा जा रहा है...'}</span>
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
            <Card>
              <CardHeader>
                <CardTitle>{t.privacy}</CardTitle>
                <CardDescription>
                  {currentLanguage === 'en' 
                    ? 'Control your privacy settings' 
                    : 'अपनी गोपनीयता सेटिंग्स नियंत्रित करें'}
                </CardDescription>
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
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">{t.public}</SelectItem>
                      <SelectItem value="private">{t.private}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-2">
                    {currentLanguage === 'en' 
                      ? 'Control who can see your profile information' 
                      : 'नियंत्रित करें कि आपकी प्रोफ़ाइल जानकारी कौन देख सकता है'}
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t.showPhone}</Label>
                    <p className="text-sm text-muted-foreground">
                      {currentLanguage === 'en' 
                        ? 'Show your phone number on your profile' 
                        : 'अपने प्रोफ़ाइल पर अपना फोन नंबर दिखाएं'}
                    </p>
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
                    <p className="text-sm text-muted-foreground">
                      {currentLanguage === 'en' 
                        ? 'Show your location on your profile' 
                        : 'अपने प्रोफ़ाइल पर अपना स्थान दिखाएं'}
                    </p>
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
                  className="btn-primary-gradient mt-4"
                >
                  {isSaving ? (
                    <span className="animate-pulse">{currentLanguage === 'en' ? 'Saving...' : 'सहेजा जा रहा है...'}</span>
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
            <Card>
              <CardHeader>
                <CardTitle>{t.changePassword}</CardTitle>
                <CardDescription>
                  {currentLanguage === 'en' 
                    ? 'Update your password to keep your account secure' 
                    : 'अपना खाता सुरक्षित रखने के लिए अपना पासवर्ड अपडेट करें'}
                </CardDescription>
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
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {currentLanguage === 'en' 
                      ? 'Password must be at least 8 characters' 
                      : 'पासवर्ड कम से कम 8 वर्ण होना चाहिए'}
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={settings.confirmPassword}
                      onChange={(e) => setSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  onClick={handleChangePassword} 
                  disabled={isSaving}
                  className="btn-primary-gradient"
                >
                  {isSaving ? (
                    <span className="animate-pulse">{currentLanguage === 'en' ? 'Saving...' : 'सहेजा जा रहा है...'}</span>
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
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">{t.deleteAccount}</CardTitle>
                <CardDescription>
                  {currentLanguage === 'en' 
                    ? 'Permanently delete your account and all associated data' 
                    : 'अपना खाता और सभी संबद्ध डेटा स्थायी रूप से हटाएं'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t.deleteAccount}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
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
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
    </Layout>
  );
};

export default Settings;







