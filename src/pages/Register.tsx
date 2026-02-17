import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Upload, CheckCircle, Shield, Sparkles, MapPin, User, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { loginSuccess } from '@/store/slices/authSlice';
import { toast } from '@/hooks/use-toast';
import { UserRole } from '@/types';
import { AnimateOnScroll } from '@/components/animations';

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const { currentLanguage } = useAppSelector((state) => state.language);
  
  const initialRole = (searchParams.get('role') as UserRole) || 'farmer';
  
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    state: '',
    district: '',
    village: '',
    // Farmer specific
    farmSize: '',
    crops: '',
    aadhaarNumber: '',
    kisanId: '',
    // Buyer specific
    businessName: '',
    businessType: 'retailer',
  });
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [kycUploaded, setKycUploaded] = useState(false);

  const content = {
    en: {
      title: 'Create Account',
      step1: 'Choose Role',
      step2: 'Basic Info',
      step3: 'Location',
      step4: 'Verification',
      farmer: 'Farmer',
      farmerDesc: 'Sell your produce directly',
      buyer: 'Buyer / Retailer',
      buyerDesc: 'Buy fresh from farmers',
      next: 'Next',
      back: 'Back',
      register: 'Complete Registration',
      hasAccount: 'Already have an account?',
      login: 'Login',
    },
    hi: {
      title: 'खाता बनाएं',
      step1: 'भूमिका चुनें',
      step2: 'बुनियादी जानकारी',
      step3: 'स्थान',
      step4: 'सत्यापन',
      farmer: 'किसान',
      farmerDesc: 'अपनी उपज सीधे बेचें',
      buyer: 'खरीदार / रिटेलर',
      buyerDesc: 'किसानों से ताज़ा खरीदें',
      next: 'आगे',
      back: 'पीछे',
      register: 'पंजीकरण पूरा करें',
      hasAccount: 'पहले से खाता है?',
      login: 'लॉगिन',
    },
  };

  const t = content[currentLanguage];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleRegister();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleRegister = () => {
    setIsLoading(true);
    setTimeout(() => {
      const user = {
        id: `${role}-new`,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: role,
        isVerified: false,
        kycStatus: 'pending' as const,
        location: {
          state: formData.state,
          district: formData.district,
          village: formData.village,
        },
        createdAt: new Date().toISOString(),
      };
      
      dispatch(loginSuccess(user));
      toast({
        title: 'Registration Successful!',
        description: 'Your account has been created. KYC verification is pending.',
      });
      
      if (role === 'farmer') {
        navigate('/farmer/dashboard');
      } else {
        navigate('/buyer/dashboard');
      }
      setIsLoading(false);
    }, 1500);
  };

  const handleFileUpload = () => {
    setKycUploaded(true);
    toast({
      title: 'Document Uploaded',
      description: 'Your KYC document has been uploaded for verification.',
    });
  };

  const states = [
    'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan',
    'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal',
  ];

  const stepIcons = [
    { icon: User, label: currentLanguage === 'en' ? 'Role' : 'भूमिका' },
    { icon: User, label: currentLanguage === 'en' ? 'Info' : 'जानकारी' },
    { icon: MapPin, label: currentLanguage === 'en' ? 'Location' : 'स्थान' },
    { icon: Shield, label: currentLanguage === 'en' ? 'Verify' : 'सत्यापन' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary-dark text-primary-foreground p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.08%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-40" />
        
        {/* Floating Elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-secondary/20 rounded-full blur-2xl" />
        <div className="absolute bottom-40 left-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 mb-12 group">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform border border-white/30">
              <span className="text-3xl">🌾</span>
            </div>
            <div>
              <h1 className="font-bold text-2xl">Direct Access</h1>
              <p className="text-sm opacity-90">for Farmers</p>
            </div>
          </Link>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2 rounded-full mb-6 border border-white/20">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {currentLanguage === 'en' ? 'Join Our Community' : 'हमारे समुदाय में शामिल हों'}
            </span>
          </div>
          <h2 className="text-5xl font-extrabold mb-6 leading-tight">
            {role === 'farmer' 
              ? (currentLanguage === 'en' ? 'Start Selling Today' : 'आज ही बेचना शुरू करें')
              : (currentLanguage === 'en' ? 'Source Fresh Produce' : 'ताज़ा उपज प्राप्त करें')}
          </h2>
          <p className="text-xl opacity-95 leading-relaxed">
            {role === 'farmer'
              ? (currentLanguage === 'en' 
                  ? 'List your crops, connect with buyers, and get fair prices without middlemen.'
                  : 'अपनी फसलों को सूचीबद्ध करें, खरीदारों से जुड़ें, और बिचौलियों के बिना उचित कीमत पाएं।')
              : (currentLanguage === 'en'
                  ? 'Connect directly with verified farmers and get quality produce at competitive prices.'
                  : 'सत्यापित किसानों से सीधे जुड़ें और प्रतिस्पर्धी कीमतों पर गुणवत्ता वाली उपज प्राप्त करें।')}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            {[1, 2, 3, 4].map((s) => {
              const StepIcon = stepIcons[s - 1].icon;
              return (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-medium transition-all duration-300 ${
                    s === step 
                      ? 'bg-secondary text-secondary-foreground shadow-lg scale-110' 
                      : s < step 
                        ? 'bg-white/30 text-primary-foreground' 
                        : 'bg-white/10 text-primary-foreground/50'
                  }`}>
                    {s < step ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <>
                        <StepIcon className="w-5 h-5 mb-1" />
                        <span className="text-xs">{s}</span>
                      </>
                    )}
                  </div>
                  {s < 4 && (
                    <div className={`h-1 flex-1 rounded-full transition-all ${
                      s < step ? 'bg-white/30' : 'bg-white/10'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Side - Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <AnimateOnScroll animation="fade-in">
            <div className="lg:hidden mb-8 text-center">
              <Link to="/" className="inline-flex items-center gap-2 group">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-2xl">🌾</span>
                </div>
                <span className="font-bold text-xl">Direct Access</span>
              </Link>
            </div>
          </AnimateOnScroll>

          {/* Mobile Progress */}
          <AnimateOnScroll animation="slide-up" delay={0.1}>
            <div className="lg:hidden mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4].map((s) => {
                  const StepIcon = stepIcons[s - 1].icon;
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        s === step 
                          ? 'bg-primary text-primary-foreground shadow-lg scale-110' 
                          : s < step 
                            ? 'bg-primary/30 text-primary' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {s < step ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <StepIcon className="w-5 h-5" />
                        )}
                      </div>
                      {s < 4 && (
                        <div className={`w-8 h-1 rounded-full ${
                          s < step ? 'bg-primary' : 'bg-border'
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll animation="slide-up" delay={0.2}>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {currentLanguage === 'en' ? 'Step' : 'चरण'} {step} {currentLanguage === 'en' ? 'of' : 'का'} 4
                </span>
              </div>
              <h1 className={`text-4xl md:text-5xl font-extrabold text-foreground mb-3 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.title}
              </h1>
              <p className={`text-lg text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {step === 1 && t.step1}
                {step === 2 && t.step2}
                {step === 3 && t.step3}
                {step === 4 && t.step4}
              </p>
            </div>
          </AnimateOnScroll>

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <AnimateOnScroll animation="fade-in">
              <div className="space-y-4">
                <Card 
                  className={`cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 ${
                    role === 'farmer' 
                      ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setRole('farmer')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">🧑‍🌾</div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-xl mb-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                          {t.farmer}
                        </h3>
                        <p className={`text-sm text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                          {t.farmerDesc}
                        </p>
                      </div>
                      {role === 'farmer' && (
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 ${
                    role === 'buyer' 
                      ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setRole('buyer')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="text-5xl">🛒</div>
                      <div className="flex-1">
                        <h3 className={`font-bold text-xl mb-2 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                          {t.buyer}
                        </h3>
                        <p className={`text-sm text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                          {t.buyerDesc}
                        </p>
                      </div>
                      {role === 'buyer' && (
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AnimateOnScroll>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <AnimateOnScroll animation="fade-in">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="name" className="text-sm font-semibold mb-2 block">
                        {currentLanguage === 'en' ? 'Full Name' : 'पूरा नाम'}
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder={currentLanguage === 'en' ? 'Enter your full name' : 'अपना पूरा नाम दर्ज करें'}
                        value={formData.name}
                        onChange={handleInputChange}
                        className="border-2 focus:border-primary py-6"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-semibold mb-2 block">
                        {currentLanguage === 'en' ? 'Phone Number' : 'फ़ोन नंबर'}
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex items-center px-4 bg-muted rounded-xl border-2 border-input font-medium">
                          <span className="text-sm text-foreground">+91</span>
                        </div>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="98765 43210"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="flex-1 border-2 focus:border-primary py-6"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-semibold mb-2 block">
                        {currentLanguage === 'en' ? 'Email (Optional)' : 'ईमेल (वैकल्पिक)'}
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="border-2 focus:border-primary py-6"
                      />
                    </div>
                    {role === 'buyer' && (
                      <>
                        <div>
                          <Label htmlFor="businessName" className="text-sm font-semibold mb-2 block">
                            {currentLanguage === 'en' ? 'Business Name' : 'व्यवसाय का नाम'}
                          </Label>
                          <Input
                            id="businessName"
                            name="businessName"
                            placeholder={currentLanguage === 'en' ? 'Your business name' : 'अपना व्यवसाय नाम'}
                            value={formData.businessName}
                            onChange={handleInputChange}
                            className="border-2 focus:border-primary py-6"
                          />
                        </div>
                        <div>
                          <Label htmlFor="businessType" className="text-sm font-semibold mb-2 block">
                            {currentLanguage === 'en' ? 'Business Type' : 'व्यवसाय प्रकार'}
                          </Label>
                          <select
                            id="businessType"
                            name="businessType"
                            value={formData.businessType}
                            onChange={handleInputChange}
                            className="w-full px-4 py-6 bg-background border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                          >
                            <option value="retailer">Retailer</option>
                            <option value="wholesaler">Wholesaler</option>
                            <option value="processor">Food Processor</option>
                            <option value="individual">Individual Buyer</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          )}

          {/* Step 3: Location */}
          {step === 3 && (
            <AnimateOnScroll animation="fade-in">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="state" className="text-sm font-semibold mb-2 block">
                        {currentLanguage === 'en' ? 'State' : 'राज्य'}
                      </Label>
                      <select
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-6 bg-background border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      >
                        <option value="">{currentLanguage === 'en' ? 'Select State' : 'राज्य चुनें'}</option>
                        {states.map((state) => (
                          <option key={state} value={state}>{state}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="district" className="text-sm font-semibold mb-2 block">
                        {currentLanguage === 'en' ? 'District' : 'जिला'}
                      </Label>
                      <Input
                        id="district"
                        name="district"
                        placeholder={currentLanguage === 'en' ? 'Enter your district' : 'अपना जिला दर्ज करें'}
                        value={formData.district}
                        onChange={handleInputChange}
                        className="border-2 focus:border-primary py-6"
                      />
                    </div>
                    {role === 'farmer' && (
                      <>
                        <div>
                          <Label htmlFor="village" className="text-sm font-semibold mb-2 block">
                            {currentLanguage === 'en' ? 'Village (Optional)' : 'गाँव (वैकल्पिक)'}
                          </Label>
                          <Input
                            id="village"
                            name="village"
                            placeholder={currentLanguage === 'en' ? 'Enter your village' : 'अपना गाँव दर्ज करें'}
                            value={formData.village}
                            onChange={handleInputChange}
                            className="border-2 focus:border-primary py-6"
                          />
                        </div>
                        <div>
                          <Label htmlFor="farmSize" className="text-sm font-semibold mb-2 block">
                            {currentLanguage === 'en' ? 'Farm Size' : 'खेत का आकार'}
                          </Label>
                          <Input
                            id="farmSize"
                            name="farmSize"
                            placeholder={currentLanguage === 'en' ? 'e.g., 5 acres' : 'उदाहरण: 5 एकड़'}
                            value={formData.farmSize}
                            onChange={handleInputChange}
                            className="border-2 focus:border-primary py-6"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          )}

          {/* Step 4: KYC Verification */}
          {step === 4 && (
            <AnimateOnScroll animation="fade-in">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="otp" className="text-sm font-semibold mb-2 block">
                        {currentLanguage === 'en' ? 'Verify Phone Number' : 'फ़ोन नंबर सत्यापित करें'}
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder={currentLanguage === 'en' ? 'Enter 6-digit OTP' : '6 अंकों का OTP दर्ज करें'}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        className="text-center text-2xl tracking-widest border-2 focus:border-primary py-6 font-bold"
                      />
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {currentLanguage === 'en' 
                          ? `OTP sent to +91 ${formData.phone}`
                          : `OTP +91 ${formData.phone} पर भेजा गया`}
                      </p>
                    </div>

                    {role === 'farmer' && (
                      <div className="pt-6 border-t border-border">
                        <Label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          {currentLanguage === 'en' ? 'Upload KYC Document' : 'KYC दस्तावेज़ अपलोड करें'}
                        </Label>
                        <p className="text-xs text-muted-foreground mb-4">
                          {currentLanguage === 'en' 
                            ? 'Upload Aadhaar Card or Kisan ID for verification'
                            : 'सत्यापन के लिए आधार कार्ड या किसान ID अपलोड करें'}
                        </p>
                        
                        <div 
                          onClick={handleFileUpload}
                          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 hover:scale-105 ${
                            kycUploaded 
                              ? 'border-success bg-gradient-to-br from-success/10 to-success/5' 
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          {kycUploaded ? (
                            <div className="text-success">
                              <CheckCircle className="w-16 h-16 mx-auto mb-3" />
                              <p className="font-semibold text-lg mb-1">
                                {currentLanguage === 'en' ? 'Document Uploaded' : 'दस्तावेज़ अपलोड हो गया'}
                              </p>
                              <p className="text-sm">
                                {currentLanguage === 'en' ? 'Pending verification' : 'सत्यापन लंबित'}
                              </p>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-16 h-16 mx-auto mb-3 text-muted-foreground" />
                              <p className="font-semibold text-lg mb-1">
                                {currentLanguage === 'en' ? 'Click to upload' : 'अपलोड करने के लिए क्लिक करें'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                PNG, JPG, PDF up to 5MB
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>
          )}

          {/* Navigation Buttons */}
          <AnimateOnScroll animation="slide-up" delay={0.3}>
            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <Button 
                  variant="outline" 
                  onClick={handleBack} 
                  className="flex-1 py-6 border-2 hover:bg-muted"
                  disabled={isLoading}
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  {t.back}
                </Button>
              )}
              <Button 
                onClick={handleNext} 
                disabled={isLoading}
                className="flex-1 btn-primary-gradient py-7 text-lg font-semibold hover:scale-105 transition-transform shadow-lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    {currentLanguage === 'en' ? 'Processing...' : 'प्रोसेसिंग...'}
                  </>
                ) : step === 4 ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {t.register}
                  </>
                ) : (
                  <>
                    {t.next}
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </AnimateOnScroll>

          {/* Login Link */}
          <AnimateOnScroll animation="fade-in" delay={0.4}>
            <p className={`text-center mt-8 text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
              {t.hasAccount}{' '}
              <Link to="/login" className="text-primary font-semibold hover:underline hover:text-primary/80 transition-colors">
                {t.login}
              </Link>
            </p>
          </AnimateOnScroll>
        </div>
      </div>
    </div>
  );
};

export default Register;
