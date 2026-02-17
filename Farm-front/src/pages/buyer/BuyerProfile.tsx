import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, MapPin, Phone, Mail, Shield, Building, ShoppingBag, Edit, Check } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { updateUser } from '@/store/slices/authSlice';

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

  const handleSave = async () => {
    if (!user) return;

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
              <img
                src={user?.avatar}
                alt={user?.name || 'Buyer'}
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
              />
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg">
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
                <Badge variant="outline" className="capitalize">{buyer.businessType}</Badge>
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
            <p className="text-3xl font-bold text-primary">{buyer.totalOrders}</p>
            <p className="text-sm text-muted-foreground">
              {currentLanguage === 'en' ? 'Orders' : 'ऑर्डर'}
            </p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-3xl font-bold text-success">₹4.5L</p>
            <p className="text-sm text-muted-foreground">
              {currentLanguage === 'en' ? 'Total Spent' : 'कुल खर्च'}
            </p>
          </div>
          <div className="card-elevated p-4 text-center">
            <p className="text-3xl font-bold text-warning">12</p>
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
      </div>
    </Layout>
  );
};

export default BuyerProfile;
