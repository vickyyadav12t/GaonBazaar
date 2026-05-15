import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, MapPin, Phone, Shield, Upload, Check, AlertCircle, Edit } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { updateUser } from '@/store/slices/authSlice';
import { validateEmail, validatePhone, validateRequired, getValidationError } from '@/lib/validators';
import { mapApiUserToAuth } from '@/lib/mapAuthUser';
import { resolveBackendAssetUrl } from '@/lib/productImageUrl';
import type { KycDocType, KycDocumentItem } from '@/types';

const FarmerProfile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector((state) => state.language);
  const { user } = useAppSelector((state) => state.auth);

  const profileTab = searchParams.get('tab') === 'kyc' ? 'kyc' : 'profile';
  const setProfileTab = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === 'kyc') next.set('tab', 'kyc');
        else next.delete('tab');
        return next;
      },
      { replace: true }
    );
  };

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    farmSize: user?.farmSize || '',
    crops: user?.crops || '',
    village: user?.location?.village || '',
    district: user?.location?.district || '',
    state: user?.location?.state || '',
    bio: user?.bio || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const kycFileRef = useRef<HTMLInputElement>(null);
  const pendingKycTypeRef = useRef<KycDocType | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [kycUploading, setKycUploading] = useState(false);

  useEffect(() => {
    if (!user || isEditing) return;
    setProfile({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      farmSize: user.farmSize || '',
      crops: user.crops || '',
      village: user.location?.village || '',
      district: user.location?.district || '',
      state: user.location?.state || '',
      bio: user.bio || '',
    });
  }, [user, isEditing]);

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

    if (!validateRequired(profile.state) || !validateRequired(profile.district)) {
      if (!validateRequired(profile.state)) {
        newErrors.state =
          currentLanguage === 'en' ? 'State is required' : 'राज्य आवश्यक है';
      }
      if (!validateRequired(profile.district)) {
        newErrors.district =
          currentLanguage === 'en' ? 'District is required' : 'जिला आवश्यक है';
      }
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
        village: profile.village,
        farmSize: profile.farmSize.trim(),
        crops: profile.crops.trim(),
        bio: profile.bio.trim(),
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

  const findKycDoc = (t: KycDocType): KycDocumentItem | undefined =>
    user?.kycDocuments?.find((d) => d.docType === t);

  const startKycUpload = (docType: KycDocType) => {
    if (!user || user.kycStatus === 'approved') return;
    pendingKycTypeRef.current = docType;
    kycFileRef.current?.click();
  };

  const onKycFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const docType = pendingKycTypeRef.current;
    pendingKycTypeRef.current = null;
    if (!file || !docType || !user) return;

    const okMime = file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!okMime) {
      toast({
        title: currentLanguage === 'en' ? 'Invalid file' : 'अमान्य फ़ाइल',
        description:
          currentLanguage === 'en'
            ? 'Please upload a PDF or image (JPG, PNG).'
            : 'कृपया PDF या छवि (JPG, PNG) अपलोड करें।',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: currentLanguage === 'en' ? 'File too large' : 'फ़ाइल बहुत बड़ी',
        description:
          currentLanguage === 'en' ? 'Maximum size is 5MB per document.' : 'प्रति दस्तावेज़ अधिकतम 5MB।',
        variant: 'destructive',
      });
      return;
    }

    setKycUploading(true);
    try {
      const up = await apiService.uploads.uploadKycFile(file);
      const url = up.data?.url;
      if (!url) throw new Error('No URL returned');

      const res = await apiService.users.submitKycDocument({
        docType,
        fileUrl: url,
        originalName: file.name,
      });
      const updated = res.data?.user;
      if (updated) {
        dispatch(updateUser(mapApiUserToAuth(updated)));
      }

      toast({
        title: currentLanguage === 'en' ? 'Document submitted' : 'दस्तावेज़ जमा',
        description:
          currentLanguage === 'en'
            ? 'Your file was uploaded. An admin will review your KYC.'
            : 'आपकी फ़ाइल अपलोड हो गई। एडमिन केवाईसी की समीक्षा करेगा।',
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        (currentLanguage === 'en'
          ? 'Failed to upload document.'
          : 'दस्तावेज़ अपलोड करने में विफल।');
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setKycUploading(false);
    }
  };

  const kycDocBadge = (doc: KycDocumentItem | undefined) => {
    if (!doc) {
      return (
        <Badge variant="secondary" className="text-[#6f6552]">
          {currentLanguage === 'en' ? 'Not uploaded' : 'अपलोड नहीं'}
        </Badge>
      );
    }
    if (user?.kycStatus === 'approved' && doc.reviewStatus === 'approved') {
      return <Badge className="bg-[#eaf5ec] text-[#315f3b]">{currentLanguage === 'en' ? 'Verified' : 'सत्यापित'}</Badge>;
    }
    if (user?.kycStatus === 'rejected' || doc.reviewStatus === 'rejected') {
      return <Badge variant="destructive">{currentLanguage === 'en' ? 'Rejected' : 'अस्वीकृत'}</Badge>;
    }
    return <Badge className="bg-[#fff4dd] text-[#9a6b12]">{currentLanguage === 'en' ? 'Pending review' : 'समीक्षा लंबित'}</Badge>;
  };

  const canEditKyc = user?.kycStatus !== 'approved';

  const kycRows: {
    type: KycDocType;
    labelEn: string;
    labelHi: string;
    iconWrap: string;
    iconClass: string;
  }[] = [
    {
      type: 'aadhaar',
      labelEn: 'Aadhaar Card',
      labelHi: 'आधार कार्ड',
      iconWrap: 'bg-primary/10',
      iconClass: 'text-primary',
    },
    {
      type: 'kisan',
      labelEn: 'Kisan ID / PM-KISAN',
      labelHi: 'किसान आईडी / पीएम-किसान',
      iconWrap: 'bg-success/10',
      iconClass: 'text-success',
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-[linear-gradient(rgba(251,247,235,0.97),rgba(251,247,235,0.97)),linear-gradient(rgba(138,79,42,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(138,79,42,0.07)_1px,transparent_1px)] bg-[size:auto,24px_24px,24px_24px]">
        <div className="container mx-auto min-w-0 px-3 py-5 sm:px-4 sm:py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="rounded-lg border border-[#d7c7a8] bg-[#fffaf0] p-2 text-[#315f3b] transition hover:bg-[#f6eddc]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-[#2f3a2f]">
            {currentLanguage === 'en' ? 'My Profile' : 'मेरी प्रोफाइल'}
          </h1>
        </div>

        <Tabs value={profileTab} onValueChange={setProfileTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 border border-[#d7c7a8] bg-[#f4ead7] p-1">
            <TabsTrigger value="profile">
              {currentLanguage === 'en' ? 'Profile Details' : 'प्रोफाइल विवरण'}
            </TabsTrigger>
            <TabsTrigger value="kyc">
              {currentLanguage === 'en' ? 'KYC Documents' : 'केवाईसी दस्तावेज़'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Header */}
            <div className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-6 shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
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
                    alt={user?.name || 'Farmer'}
                    className="h-24 w-24 rounded-full border-4 border-[#e2d4b7] object-cover"
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
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-[#b68222] bg-[#d89b2b] text-[#2f2416] shadow-lg disabled:opacity-60"
                    title={currentLanguage === 'en' ? 'Change photo' : 'फोटो बदलें'}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold text-[#2f3a2f]">{user?.name}</h2>
                  <p className="mt-1 flex items-center justify-center gap-1 text-[#6f6552] sm:justify-start">
                    <MapPin className="w-4 h-4" />
                    {user?.location?.district}, {user?.location?.state}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {user?.kycStatus === 'approved' ? (
                      <Badge className="gap-1 bg-[#eaf5ec] text-[#315f3b]">
                        <Shield className="w-3 h-3" />
                        {currentLanguage === 'en' ? 'Verified Farmer' : 'सत्यापित किसान'}
                      </Badge>
                    ) : (
                      <Badge className="bg-[#fff4dd] text-[#9a6b12]">
                        {currentLanguage === 'en' ? 'Verification Pending' : 'सत्यापन लंबित'}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="sm:ml-auto">
                  <Button
                    variant={isEditing ? 'default' : 'outline'}
                    className={
                      isEditing
                        ? 'border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]'
                        : 'border-[#d7c7a8] bg-[#fffdf7] text-[#315f3b] hover:bg-[#f3ebdd] hover:text-[#315f3b]'
                    }
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

            {/* Profile Form */}
            <div className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-6 shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <h3 className="mb-4 font-semibold text-[#2f3a2f]">{currentLanguage === 'en' ? 'Personal Information' : 'व्यक्तिगत जानकारी'}</h3>
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#5c513f]">{currentLanguage === 'en' ? 'Full Name' : 'पूरा नाम'}</Label>
                    <Input
                      className="mt-2 border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={!isEditing}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-destructive">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-[#5c513f]">{currentLanguage === 'en' ? 'Phone' : 'फोन'}</Label>
                    <Input
                      className="mt-2 border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
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
                  <Label className="text-[#5c513f]">{currentLanguage === 'en' ? 'Email' : 'ईमेल'}</Label>
                  <Input
                    type="email"
                    className="mt-2 border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={!isEditing}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-destructive">{errors.email}</p>
                  )}
                </div>
                <div>
                  <Label className="text-[#5c513f]">{currentLanguage === 'en' ? 'About / Bio' : 'परिचय'}</Label>
                  <Textarea
                    className="mt-2 border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Farm Details */}
            <div className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-6 shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <h3 className="mb-4 font-semibold text-[#2f3a2f]">{currentLanguage === 'en' ? 'Farm Details' : 'खेत विवरण'}</h3>
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#5c513f]">{currentLanguage === 'en' ? 'Farm Size' : 'खेत का आकार'}</Label>
                    <Input
                      className="mt-2 border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                      value={profile.farmSize}
                      onChange={(e) => setProfile({ ...profile, farmSize: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label className="text-[#5c513f]">{currentLanguage === 'en' ? 'Main Crops' : 'मुख्य फसलें'}</Label>
                    <Input
                      className="mt-2 border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                      value={profile.crops}
                      onChange={(e) => setProfile({ ...profile, crops: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Wheat, Rice, Vegetables"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-[#5c513f]">{currentLanguage === 'en' ? 'Village' : 'गांव'}</Label>
                    <Input
                      className="mt-2 border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                      value={profile.village}
                      onChange={(e) => setProfile({ ...profile, village: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label className="text-[#5c513f]">{currentLanguage === 'en' ? 'District' : 'जिला'}</Label>
                    <Input
                      className="mt-2 border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
                      value={profile.district}
                      onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                      disabled={!isEditing}
                    />
                    {errors.district && (
                      <p className="mt-1 text-xs text-destructive">{errors.district}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-[#5c513f]">{currentLanguage === 'en' ? 'State' : 'राज्य'}</Label>
                    <Input
                      className="mt-2 border-[#d7c7a8] bg-[#fffdf7] text-[#2f3a2f] focus-visible:ring-[#315f3b]"
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
          </TabsContent>

          <TabsContent value="kyc" className="space-y-6">
            {/* KYC Status */}
            <div className="rounded-2xl border border-[#d7c7a8] bg-[#fffaf0] p-6 shadow-[0_16px_40px_rgba(95,70,40,0.08)]">
              <div className="flex items-center gap-3 mb-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${user?.kycStatus === 'approved' ? 'bg-[#eaf5ec]' : 'bg-[#fff4dd]'}`}>
                  {user?.kycStatus === 'approved' ? (
                    <Check className="w-6 h-6 text-[#315f3b]" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-[#d89b2b]" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-[#2f3a2f]">
                    {currentLanguage === 'en' ? 'KYC Status' : 'केवाईसी स्थिति'}
                  </h3>
                  <p className="text-sm text-[#6f6552]">
                    {user?.kycStatus === 'approved'
                      ? currentLanguage === 'en'
                        ? 'Your KYC is verified.'
                        : 'आपका केवाईसी सत्यापित है।'
                      : user?.kycStatus === 'rejected'
                        ? currentLanguage === 'en'
                          ? 'Your KYC was rejected. Upload new documents below to resubmit.'
                          : 'आपका केवाईसी अस्वीकृत हो गया। पुनः जमा करने के लिए नए दस्तावेज़ अपलोड करें।'
                        : currentLanguage === 'en'
                          ? 'Upload Aadhaar or Kisan ID (PDF or image, max 5MB). Admin will review before you are verified.'
                          : 'आधार या किसान ID अपलोड करें (PDF या छवि, अधिकतम 5MB)। सत्यापन से पहले एडमिन समीक्षा करेगा।'}
                  </p>
                </div>
              </div>

              <input
                ref={kycFileRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={onKycFileChange}
              />

              <div className="space-y-4">
                {kycRows.map((row) => {
                  const doc = findKycDoc(row.type);
                  const label = currentLanguage === 'en' ? row.labelEn : row.labelHi;
                  return (
                    <div
                      key={row.type}
                      className="flex flex-col gap-3 rounded-xl border border-[#e2d4b7] bg-[#fffdf7] p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${row.iconWrap}`}
                        >
                          <Shield className={`w-5 h-5 ${row.iconClass}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#2f3a2f]">{label}</p>
                          {doc?.originalName && (
                            <p className="truncate text-xs text-[#6f6552]">{doc.originalName}</p>
                          )}
                          {doc?.fileUrl && (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-[#315f3b]"
                            >
                              {currentLanguage === 'en' ? 'View file' : 'फ़ाइल देखें'}
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {kycDocBadge(doc)}
                        {canEditKyc && (
                          <Button
                            size="sm"
                            className="border border-[#b68222] bg-[#d89b2b] text-[#2f2416] hover:bg-[#c88d22]"
                            disabled={kycUploading}
                            onClick={() => startKycUpload(row.type)}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            {doc
                              ? currentLanguage === 'en'
                                ? 'Replace'
                                : 'बदलें'
                              : currentLanguage === 'en'
                                ? 'Upload'
                                : 'अपलोड'}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-4 text-xs text-[#6f6552]">
                {currentLanguage === 'en'
                  ? '* Approval needs at least one of Aadhaar or Kisan ID. You will be notified when your KYC is approved or rejected.'
                  : '* स्वीकृति के लिए आधार या किसान ID में से कम से कम एक आवश्यक है। केवाईसी पर निर्णय होने पर सूचना मिलेगी।'}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </Layout>
  );
};

export default FarmerProfile;
