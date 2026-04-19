import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, MapPin, Phone, Shield, Building, Edit, Check } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { fetchAllOrdersForCurrentUser } from '@/lib/fetchAllPaginated';
import { updateUser } from '@/store/slices/authSlice';
import { validateEmail, validatePhone, validateRequired, getValidationError } from '@/lib/validators';
import { mapApiUserToAuth } from '@/lib/mapAuthUser';
import { resolveBackendAssetUrl } from '@/lib/productImageUrl';
import { mapApiOrderToOrder } from '@/lib/mapOrderFromApi';
import type { BuyerBusinessType } from '@/types';

const BuyerProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user } = useAppSelector((state) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    businessName: '',
    businessType: 'retailer',
    district: user?.location?.district || '',
    state: user?.location?.state || '',
    address: '',
    gstNumber: '',
  });

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    uniqueFarmers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const backendOrders = await fetchAllOrdersForCurrentUser();
        const orders = backendOrders.map((o: any) => mapApiOrderToOrder(o));
        const totalOrders = orders.length;
        const totalSpent = orders
          .filter((o) => o.paymentStatus === 'paid')
          .reduce((sum, o) => sum + o.totalAmount, 0);
        const uniqueFarmers = new Set(orders.map((o) => o.farmerId)).size;

        setStats({ totalOrders, totalSpent, uniqueFarmers });
      } catch {
        // Keep defaults if stats fail to load.
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  useEffect(() => {
    if (!user || isEditing) return;
    setProfile({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      businessName: user.businessName || '',
      businessType: (user.businessType as BuyerBusinessType) || 'retailer',
      district: user.location?.district || '',
      state: user.location?.state || '',
      address: user.businessAddress || '',
      gstNumber: user.gstNumber || '',
    });
  }, [user, isEditing]);

  const validateProfile = () => {
    const newErrors: Record<string, string> = {};

    if (!validateRequired(profile.name)) {
      newErrors.name = getValidationError('name' as any, 'required');
    }

    if (!validateRequired(profile.phone) || !validatePhone(profile.phone)) {
      newErrors.phone = !validateRequired(profile.phone)
        ? getValidationError('phone', 'required')
        : getValidationError('phone', 'invalid');
    }

    if (profile.email && !validateEmail(profile.email)) {
      newErrors.email = getValidationError('email', 'invalid');
    }

    if (!validateRequired(profile.district) || !validateRequired(profile.state)) {
      if (!validateRequired(profile.district)) {
        newErrors.district =
          currentLanguage === 'en' ? 'District is required' : 'जिला आवश्यक है';
      }
      if (!validateRequired(profile.state)) {
        newErrors.state =
          currentLanguage === 'en' ? 'State is required' : 'राज्य आवश्यक है';
      }
    }

    if (!validateRequired(profile.businessName)) {
      newErrors.businessName =
        currentLanguage === 'en'
          ? 'Business name is required'
          : 'व्यापार का नाम आवश्यक है';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!user) return;

    if (!validateProfile()) {
      toast({
        title: currentLanguage === 'en' ? 'Please fix the errors' : 'कृपया त्रुटियाँ सुधारें',
        description:
          currentLanguage === 'en'
            ? 'Some fields are missing or invalid.'
            : 'कुछ फ़ील्ड गायब हैं या अमान्य हैं।',
        variant: 'destructive',
      });
      return;
    }

    try {
      const payload = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        state: profile.state,
        district: profile.district,
        village: user.location?.village,
        businessName: profile.businessName,
        businessType: profile.businessType,
        gstNumber: profile.gstNumber.trim(),
        businessAddress: profile.address.trim(),
      };

      const response = await apiService.users.updateProfile(payload);
      const updatedUser = response.data?.user;

      if (updatedUser) {
        dispatch(updateUser(mapApiUserToAuth(updatedUser)));
      }

      setIsEditing(false);
      toast({
        title: currentLanguage === 'en' ? 'Profile Updated' : 'प्रोफाइल अपडेट',
        description:
          currentLanguage === 'en'
            ? 'Your changes have been saved.'
            : 'आपके बदलाव सहेजे गए।',
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        (currentLanguage === 'en'
          ? 'Failed to update profile.'
          : 'प्रोफाइल अपडेट करने में विफल।');
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const avatarDisplayUrl = user?.avatar
    ? resolveBackendAssetUrl(user.avatar)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&size=256`;

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: currentLanguage === 'en' ? 'Invalid file' : 'अमान्य फ़ाइल',
        description:
          currentLanguage === 'en' ? 'Please choose an image file.' : 'कृपया एक छवि फ़ाइल चुनें।',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: currentLanguage === 'en' ? 'File too large' : 'फ़ाइल बहुत बड़ी',
        description:
          currentLanguage === 'en' ? 'Maximum size is 2MB.' : 'अधिकतम आकार 2MB है।',
        variant: 'destructive',
      });
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const up = await apiService.uploads.uploadAvatar(file);
      const url = up.data?.url;
      if (!url) throw new Error('No URL returned');

      const response = await apiService.users.updateProfile({ avatar: url });
      const updatedUser = response.data?.user;
      if (updatedUser) {
        dispatch(updateUser(mapApiUserToAuth(updatedUser)));
      } else {
        dispatch(updateUser({ avatar: url }));
      }

      toast({
        title: currentLanguage === 'en' ? 'Photo updated' : 'फोटो अपडेट',
        description:
          currentLanguage === 'en'
            ? 'Your profile picture was saved.'
            : 'आपकी प्रोफाइल फोटो सहेजी गई।',
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        (currentLanguage === 'en'
          ? 'Failed to update profile photo.'
          : 'प्रोफाइल फोटो अपडेट करने में विफल।');
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-muted rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">
            {currentLanguage === 'en' ? 'My Profile' : 'मेरी प्रोफाइल'}
          </h1>
        </div>

        {/* Profile Header */}
        <div className="card-elevated p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />
              <img
                src={avatarDisplayUrl}
                alt={user?.name || 'Buyer'}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.onerror = null;
                  el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&size=256`;
                }}
              />
              <button
                type="button"
                disabled={isUploadingAvatar}
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg disabled:opacity-60"
                title={currentLanguage === 'en' ? 'Change photo' : 'फोटो बदलें'}
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-primary font-medium">{profile.businessName}</p>
              <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {profile.district}, {profile.state}
              </p>
              <div className="flex items-center gap-2 mt-2">
                {user?.kycStatus === 'approved' ? (
                  <Badge className="bg-success/10 text-success gap-1">
                    <Shield className="w-3 h-3" />
                    {currentLanguage === 'en' ? 'Verified Buyer' : 'सत्यापित खरीदार'}
                  </Badge>
                ) : (
                  <Badge className="bg-warning/10 text-warning">
                    {currentLanguage === 'en' ? 'Verification Pending' : 'सत्यापन लंबित'}
                  </Badge>
                )}
                <Badge variant="outline" className="capitalize">{profile.businessType}</Badge>
              </div>
            </div>
            <div className="sm:ml-auto">
              <Button
                variant={isEditing ? 'default' : 'outline'}
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              >
                {isEditing ? (
                  <><Check className="w-4 h-4 mr-2" /> {currentLanguage === 'en' ? 'Save' : 'सहेजें'}</>
                ) : (
                  <><Edit className="w-4 h-4 mr-2" /> {currentLanguage === 'en' ? 'Edit' : 'संपादित करें'}</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card-elevated p-4 text-center">
            <p className="text-3xl font-bold text-primary">{stats.totalOrders}</p>
            <p className="text-sm text-muted-foreground">
              {currentLanguage === 'en' ? 'Orders' : 'ऑर्डर'}
            </p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-3xl font-bold text-success">₹{stats.totalSpent.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">
              {currentLanguage === 'en' ? 'Total Spent' : 'कुल खर्च'}
            </p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-3xl font-bold text-warning">{stats.uniqueFarmers}</p>
            <p className="text-sm text-muted-foreground">
              {currentLanguage === 'en' ? 'Farmers' : 'किसान'}
            </p>
          </div>
        </div>

        {/* Profile Form */}
        <div className="card-elevated p-6 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5" />
            {currentLanguage === 'en' ? 'Personal Information' : 'व्यक्तिगत जानकारी'}
          </h3>
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{currentLanguage === 'en' ? 'Full Name' : 'पूरा नाम'}</Label>
                <Input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  disabled={!isEditing}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-destructive">{errors.name}</p>
                )}
              </div>
              <div>
                <Label>{currentLanguage === 'en' ? 'Phone' : 'फोन'}</Label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={!isEditing}
                />
                {errors.phone && (
                  <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
                )}
              </div>
            </div>
            <div>
              <Label>{currentLanguage === 'en' ? 'Email' : 'ईमेल'}</Label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={!isEditing}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="card-elevated p-6 mb-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Building className="w-5 h-5" />
            {currentLanguage === 'en' ? 'Business Details' : 'व्यापार विवरण'}
          </h3>
          <div className="grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{currentLanguage === 'en' ? 'Business Name' : 'व्यापार का नाम'}</Label>
                <Input
                  value={profile.businessName}
                  onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                  disabled={!isEditing}
                />
                {errors.businessName && (
                  <p className="mt-1 text-xs text-destructive">{errors.businessName}</p>
                )}
              </div>
              <div>
                <Label>{currentLanguage === 'en' ? 'Business Type' : 'व्यापार का प्रकार'}</Label>
                <Select
                  value={profile.businessType}
                  onValueChange={(value) => setProfile({ ...profile, businessType: value as any })}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retailer">{currentLanguage === 'en' ? 'Retailer' : 'खुदरा विक्रेता'}</SelectItem>
                    <SelectItem value="wholesaler">{currentLanguage === 'en' ? 'Wholesaler' : 'थोक विक्रेता'}</SelectItem>
                    <SelectItem value="processor">{currentLanguage === 'en' ? 'Processor' : 'प्रोसेसर'}</SelectItem>
                    <SelectItem value="individual">{currentLanguage === 'en' ? 'Individual' : 'व्यक्तिगत'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>{currentLanguage === 'en' ? 'GST Number' : 'जीएसटी नंबर'}</Label>
              <Input
                value={profile.gstNumber}
                onChange={(e) => setProfile({ ...profile, gstNumber: e.target.value })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card-elevated p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {currentLanguage === 'en' ? 'Business Address' : 'व्यापार का पता'}
          </h3>
          <div className="grid gap-4">
            <div>
              <Label>{currentLanguage === 'en' ? 'Address' : 'पता'}</Label>
              <Input
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                disabled={!isEditing}
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>{currentLanguage === 'en' ? 'District' : 'जिला'}</Label>
                <Input
                  value={profile.district}
                  onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                  disabled={!isEditing}
                />
                {errors.district && (
                  <p className="mt-1 text-xs text-destructive">{errors.district}</p>
                )}
              </div>
              <div>
                <Label>{currentLanguage === 'en' ? 'State' : 'राज्य'}</Label>
                <Input
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  disabled={!isEditing}
                />
                {errors.state && (
                  <p className="mt-1 text-xs text-destructive">{errors.state}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BuyerProfile;
