import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, MapPin, Phone, Mail, Shield, Upload, Check, AlertCircle, Edit } from 'lucide-react';
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

const FarmerProfile = () => {
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
    farmSize: '',
    crops: '',
    village: user?.location?.village || '',
    district: user?.location?.district || '',
    state: user?.location?.state || '',
    bio:
      'Experienced farmer with over 15 years of farming. Specialized in organic farming methods.',
  });

  const [kycDocuments, setKycDocuments] = useState({
    aadhaar: { uploaded: false, verified: user?.kycStatus === 'approved', fileName: '' },
    kisan: { uploaded: false, verified: false, fileName: '' },
    bank: { uploaded: false, verified: false, fileName: '' },
  });

  const handleSave = async () => {
    if (!user) return;

    try {
      const payload = {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        state: profile.state,
        district: profile.district,
        village: profile.village,
        farmSize: profile.farmSize,
        crops: profile.crops,
      };

      const response = await apiService.users.updateProfile(payload);
      const updatedUser = response.data?.user;

      if (updatedUser) {
        dispatch(updateUser(updatedUser));
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

  const handleKycUpload = async (docType: string) => {
    try {
      await apiService.users.uploadKYC(new File([], 'placeholder'));

      setKycDocuments((prev) => ({
        ...prev,
        [docType]: {
          uploaded: true,
          verified: false,
          fileName: `${docType}_doc.pdf`,
        },
      }));

      toast({
        title: currentLanguage === 'en' ? 'Document Uploaded' : 'दस्तावेज़ अपलोड',
        description:
          currentLanguage === 'en'
            ? 'Your document is under review.'
            : 'आपका दस्तावेज़ समीक्षाधीन है।',
      });
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        (currentLanguage === 'en'
          ? 'Failed to upload KYC.'
          : 'केवाईसी अपलोड करने में विफल।');
      toast({
        title: currentLanguage === 'en' ? 'Error' : 'त्रुटि',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const getKycStatusBadge = (doc: { uploaded: boolean; verified: boolean }) => {
    if (doc.verified) return <Badge className="bg-success/10 text-success">Verified</Badge>;
    if (doc.uploaded) return <Badge className="bg-warning/10 text-warning">Pending</Badge>;
    return <Badge className="bg-muted text-muted-foreground">Not Uploaded</Badge>;
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

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">
              {currentLanguage === 'en' ? 'Profile Details' : 'प्रोफाइल विवरण'}
            </TabsTrigger>
            <TabsTrigger value="kyc">
              {currentLanguage === 'en' ? 'KYC Documents' : 'केवाईसी दस्तावेज़'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Header */}
            <div className="card-elevated p-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative">
                  <img
                    src={user?.avatar}
                    alt={user?.name || 'Farmer'}
                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
                  />
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl font-bold">{user?.name}</h2>
                  <p className="text-muted-foreground flex items-center justify-center sm:justify-start gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {user?.location?.district}, {user?.location?.state}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {user?.kycStatus === 'approved' ? (
                      <Badge className="bg-success/10 text-success gap-1">
                        <Shield className="w-3 h-3" />
                        {currentLanguage === 'en' ? 'Verified Farmer' : 'सत्यापित किसान'}
                      </Badge>
                    ) : (
                      <Badge className="bg-warning/10 text-warning">
                        {currentLanguage === 'en' ? 'Verification Pending' : 'सत्यापन लंबित'}
                      </Badge>
                    )}
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

            {/* Profile Form */}
            <div className="card-elevated p-6">
              <h3 className="font-semibold mb-4">{currentLanguage === 'en' ? 'Personal Information' : 'व्यक्तिगत जानकारी'}</h3>
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Full Name' : 'पूरा नाम'}</Label>
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Phone' : 'फोन'}</Label>
                    <Input
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={!isEditing}
                    />
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
                </div>
                <div>
                  <Label>{currentLanguage === 'en' ? 'About / Bio' : 'परिचय'}</Label>
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Farm Details */}
            <div className="card-elevated p-6">
              <h3 className="font-semibold mb-4">{currentLanguage === 'en' ? 'Farm Details' : 'खेत विवरण'}</h3>
              <div className="grid gap-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Farm Size' : 'खेत का आकार'}</Label>
                    <Input
                      value={profile.farmSize}
                      onChange={(e) => setProfile({ ...profile, farmSize: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Main Crops' : 'मुख्य फसलें'}</Label>
                    <Input
                      value={profile.crops}
                      onChange={(e) => setProfile({ ...profile, crops: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Wheat, Rice, Vegetables"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label>{currentLanguage === 'en' ? 'Village' : 'गांव'}</Label>
                    <Input
                      value={profile.village}
                      onChange={(e) => setProfile({ ...profile, village: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>{currentLanguage === 'en' ? 'District' : 'जिला'}</Label>
                    <Input
                      value={profile.district}
                      onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div>
                    <Label>{currentLanguage === 'en' ? 'State' : 'राज्य'}</Label>
                    <Input
                      value={profile.state}
                      onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="kyc" className="space-y-6">
            {/* KYC Status */}
            <div className="card-elevated p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${user?.kycStatus === 'approved' ? 'bg-success/10' : 'bg-warning/10'}`}>
                  {user?.kycStatus === 'approved' ? (
                    <Check className="w-6 h-6 text-success" />
                  ) : (
                    <AlertCircle className="w-6 h-6 text-warning" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">
                    {currentLanguage === 'en' ? 'KYC Status' : 'केवाईसी स्थिति'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {user?.kycStatus === 'approved' 
                      ? (currentLanguage === 'en' ? 'Your KYC is verified' : 'आपका केवाईसी सत्यापित है')
                      : (currentLanguage === 'en' ? 'Complete your KYC to start selling' : 'बेचना शुरू करने के लिए अपना केवाईसी पूरा करें')}
                  </p>
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-4">
                {/* Aadhaar */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{currentLanguage === 'en' ? 'Aadhaar Card' : 'आधार कार्ड'}</p>
                      {kycDocuments.aadhaar.uploaded && (
                        <p className="text-xs text-muted-foreground">{kycDocuments.aadhaar.fileName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getKycStatusBadge(kycDocuments.aadhaar)}
                    {!kycDocuments.aadhaar.uploaded && (
                      <Button size="sm" onClick={() => handleKycUpload('aadhaar')}>
                        <Upload className="w-4 h-4 mr-1" /> Upload
                      </Button>
                    )}
                  </div>
                </div>

                {/* Kisan ID */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">{currentLanguage === 'en' ? 'Kisan ID / PM-KISAN' : 'किसान आईडी / पीएम-किसान'}</p>
                      {kycDocuments.kisan.uploaded && (
                        <p className="text-xs text-muted-foreground">{kycDocuments.kisan.fileName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getKycStatusBadge(kycDocuments.kisan)}
                    {!kycDocuments.kisan.uploaded && (
                      <Button size="sm" onClick={() => handleKycUpload('kisan')}>
                        <Upload className="w-4 h-4 mr-1" /> Upload
                      </Button>
                    )}
                  </div>
                </div>

                {/* Bank Details */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">{currentLanguage === 'en' ? 'Bank Passbook / Statement' : 'बैंक पासबुक / स्टेटमेंट'}</p>
                      {kycDocuments.bank.uploaded && (
                        <p className="text-xs text-muted-foreground">{kycDocuments.bank.fileName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getKycStatusBadge(kycDocuments.bank)}
                    {!kycDocuments.bank.uploaded && (
                      <Button size="sm" onClick={() => handleKycUpload('bank')}>
                        <Upload className="w-4 h-4 mr-1" /> Upload
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                {currentLanguage === 'en' 
                  ? '* Documents are verified within 24-48 hours. You will receive a notification once approved.'
                  : '* दस्तावेज़ 24-48 घंटों के भीतर सत्यापित हो जाते हैं। स्वीकृत होने पर आपको सूचना मिलेगी।'}
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default FarmerProfile;
