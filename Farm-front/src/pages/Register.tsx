import { useRef, useState } from 'react';
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
import { apiService, setAuthToken } from '@/services/api';
import { mapApiUserToAuth } from '@/lib/mapAuthUser';
import { validateEmail, validatePhone } from '@/lib/validators';
import { getApiErrorMessage } from '@/lib/apiErrors';
import { ROUTES } from '@/constants';

const MAX_KYC_BYTES = 5 * 1024 * 1024;

function isAllowedKycFile(file: File): boolean {
  const okType =
    file.type === 'application/pdf' ||
    file.type === 'image/png' ||
    file.type === 'image/jpeg' ||
    file.type === 'image/jpg';
  if (okType) return true;
  const lower = file.name.toLowerCase();
  return lower.endsWith('.pdf') || lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg');
}

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
    password: '',
    confirmPassword: '',
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
  const [isLoading, setIsLoading] = useState(false);
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycDocType, setKycDocType] = useState<'aadhaar' | 'kisan'>('aadhaar');
  const [emailVerificationCode, setEmailVerificationCode] = useState('');
  const kycInputRef = useRef<HTMLInputElement>(null);

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
      emailRequired: 'Email is required',
      emailInvalid: 'Please enter a valid email address',
      phoneInvalid: 'Enter a valid 10-digit Indian mobile number',
      codeSent: 'Verification code sent',
      codeSentDesc: 'Check your inbox for a 6-digit code (expires in 10 minutes).',
      emailCodeLabel: 'Email verification code',
      emailCodeHint: 'Enter the 6-digit code we sent to your email.',
      resendCode: 'Resend code',
      codeRequired: 'Enter the 6-digit code from your email',
      locationRequired: 'Please select state and district',
      kycRequired: 'Upload your KYC document (Aadhaar or Kisan ID) to create a farmer account.',
      kycInvalid: 'Use a PNG, JPG, or PDF file only.',
      kycTooLarge: 'File must be 5MB or smaller.',
      kycDocTypeLabel: 'Document type',
      kycAadhaar: 'Aadhaar card',
      kycKisan: 'Kisan ID',
      kycSelected: 'Selected file',
      buyerWelcome: 'Your account has been created.',
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
      emailRequired: 'ईमेल आवश्यक है',
      emailInvalid: 'कृपया वैध ईमेल दर्ज करें',
      phoneInvalid: 'वैध 10 अंकों का मोबाइल नंबर दर्ज करें',
      codeSent: 'सत्यापन कोड भेजा गया',
      codeSentDesc: 'अपना इनबॉक्स देखें — 6 अंकों का कोड (10 मिनट में समाप्त)।',
      emailCodeLabel: 'ईमेल सत्यापन कोड',
      emailCodeHint: 'ईमेल पर भेजा गया 6 अंकों का कोड दर्ज करें।',
      resendCode: 'कोड फिर भेजें',
      codeRequired: 'ईमेल से 6 अंकों का कोड दर्ज करें',
      locationRequired: 'कृपया राज्य और जिला चुनें',
      kycRequired: 'किसान खाता बनाने के लिए KYC दस्तावेज़ (आधार या किसान ID) अपलोड करें।',
      kycInvalid: 'केवल PNG, JPG या PDF उपयोग करें।',
      kycTooLarge: 'फ़ाइल 5MB से छोटी होनी चाहिए।',
      kycDocTypeLabel: 'दस्तावेज़ प्रकार',
      kycAadhaar: 'आधार कार्ड',
      kycKisan: 'किसान ID',
      kycSelected: 'चयनित फ़ाइल',
      buyerWelcome: 'आपका खाता बन गया है।',
    },
  };

  const t = content[currentLanguage];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (
        !formData.name?.trim() ||
        !formData.phone?.trim() ||
        !formData.email?.trim() ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        toast({
          title: currentLanguage === 'en' ? 'Missing details' : 'जानकारी अधूरी है',
          description:
            currentLanguage === 'en'
              ? 'Please fill in name, phone, email, and password.'
              : 'कृपया नाम, फ़ोन, ईमेल और पासवर्ड भरें।',
          variant: 'destructive',
        });
        return;
      }
      if (!validateEmail(formData.email.trim())) {
        toast({
          title: currentLanguage === 'en' ? 'Invalid email' : 'अमान्य ईमेल',
          description: t.emailInvalid,
          variant: 'destructive',
        });
        return;
      }
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (!validatePhone(phoneDigits)) {
        toast({
          title: currentLanguage === 'en' ? 'Invalid phone' : 'अमान्य फ़ोन',
          description: t.phoneInvalid,
          variant: 'destructive',
        });
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: currentLanguage === 'en' ? 'Passwords do not match' : 'पासवर्ड मेल नहीं खा रहे हैं',
          variant: 'destructive',
        });
        return;
      }
      try {
        setIsLoading(true);
        await apiService.auth.sendRegistrationEmailCode({ email: formData.email.trim() });
        toast({
          title: t.codeSent,
          description: t.codeSentDesc,
        });
        setEmailVerificationCode('');
        setStep(3);
      } catch (error: unknown) {
        const message = getApiErrorMessage(
          error,
          currentLanguage === 'en'
            ? 'Could not send verification email.'
            : 'सत्यापन ईमेल नहीं भेजा जा सका।'
        );
        toast({
          title: currentLanguage === 'en' ? 'Email not sent' : 'ईमेल नहीं भेजा गया',
          description: message,
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (step === 3) {
      if (!formData.state?.trim() || !formData.district?.trim()) {
        toast({
          title: currentLanguage === 'en' ? 'Location required' : 'स्थान आवश्यक',
          description: t.locationRequired,
          variant: 'destructive',
        });
        return;
      }
      setStep(4);
      return;
    }

    if (step === 4) {
      handleRegister();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleRegister = async () => {
    const digits = emailVerificationCode.replace(/\D/g, '');
    if (digits.length !== 6) {
      toast({
        title: currentLanguage === 'en' ? 'Verification code' : 'सत्यापन कोड',
        description: t.codeRequired,
        variant: 'destructive',
      });
      return;
    }

    if (!formData.name || !formData.phone || !formData.email?.trim() || !formData.password) {
      toast({
        title: currentLanguage === 'en' ? 'Missing details' : 'जानकारी अधूरी है',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: currentLanguage === 'en' ? 'Passwords do not match' : 'पासवर्ड मेल नहीं खा रहे हैं',
        variant: 'destructive',
      });
      return;
    }

    if (role === 'farmer') {
      if (!kycFile) {
        toast({
          title: currentLanguage === 'en' ? 'KYC required' : 'KYC आवश्यक',
          description: t.kycRequired,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setIsLoading(true);

      let response;
      if (role === 'farmer' && kycFile) {
        const fd = new FormData();
        fd.append('name', formData.name.trim());
        fd.append('phone', formData.phone.replace(/\D/g, ''));
        fd.append('email', formData.email.trim());
        fd.append('password', formData.password);
        fd.append('emailVerificationCode', digits);
        fd.append('role', 'farmer');
        fd.append('state', formData.state);
        fd.append('district', formData.district);
        fd.append('village', formData.village || '');
        fd.append('farmSize', formData.farmSize || '');
        fd.append('crops', formData.crops || '');
        fd.append('aadhaarNumber', formData.aadhaarNumber || '');
        fd.append('kisanId', formData.kisanId || '');
        fd.append('kycDocType', kycDocType);
        fd.append('kycFile', kycFile);
        response = await apiService.auth.registerWithKycForm(fd);
      } else {
        const payload = {
          name: formData.name,
          phone: formData.phone.replace(/\D/g, ''),
          email: formData.email.trim(),
          password: formData.password,
          emailVerificationCode: digits,
          role,
          state: formData.state,
          district: formData.district,
          village: formData.village,
          farmSize: formData.farmSize,
          crops: formData.crops,
          aadhaarNumber: formData.aadhaarNumber,
          kisanId: formData.kisanId,
          businessName: formData.businessName,
          businessType: formData.businessType,
        };
        response = await apiService.auth.register(payload as any);
      }
      const { user, token } = response.data || {};

      if (token) {
        setAuthToken(token);
      }

      if (!user) {
        throw new Error('User data not returned from server');
      }

      const mappedUser = mapApiUserToAuth(user);
      dispatch(loginSuccess(mappedUser));
      toast({
        title: currentLanguage === 'en' ? 'Registration Successful!' : 'पंजीकरण सफल!',
        description:
          mappedUser.role === 'farmer'
            ? currentLanguage === 'en'
              ? 'Your account has been created. Admin KYC review is pending.'
              : 'आपका खाता बन गया है। KYC प्रशासक समीक्षा लंबित है।'
            : t.buyerWelcome,
      });

      if (mappedUser.role === 'farmer') {
        navigate('/farmer/dashboard');
      } else if (mappedUser.role === 'buyer') {
        navigate('/buyer/dashboard');
      } else {
        navigate(ROUTES.ADMIN_DASHBOARD);
      }
    } catch (error: any) {
      console.error(error);
      toast({
        title: currentLanguage === 'en' ? 'Registration failed' : 'पंजीकरण विफल',
        description:
          error?.response?.data?.message ||
          error?.message ||
          (currentLanguage === 'en'
            ? 'Something went wrong. Please try again.'
            : 'कुछ गलत हो गया। कृपया पुनः प्रयास करें।'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onKycInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > MAX_KYC_BYTES) {
      toast({
        title: currentLanguage === 'en' ? 'File too large' : 'फ़ाइल बहुत बड़ी',
        description: t.kycTooLarge,
        variant: 'destructive',
      });
      setKycFile(null);
      return;
    }
    if (!isAllowedKycFile(file)) {
      toast({
        title: currentLanguage === 'en' ? 'Invalid file' : 'अमान्य फ़ाइल',
        description: t.kycInvalid,
        variant: 'destructive',
      });
      setKycFile(null);
      return;
    }
    setKycFile(file);
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
        
        <div className="relative z-10 isolate">
          <Link to="/" className="mb-12 block group" aria-label="GaonBazaar home">
            <img
              src={`${import.meta.env.BASE_URL}assets/logo.png`}
              alt="GaonBazaar"
              className="h-[40px] w-auto max-w-[min(400px,92vw)] shrink-0 object-contain block m-0 p-0 align-middle border-0 bg-transparent group-hover:opacity-95 transition-opacity"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
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
              <Link to="/" className="mx-auto flex max-w-[min(320px,90vw)] justify-center group" aria-label="GaonBazaar home">
                <img
                  src={`${import.meta.env.BASE_URL}assets/logo.png`}
                  alt="GaonBazaar"
                  className="h-[40px] w-auto max-w-[min(320px,90vw)] shrink-0 object-contain block m-0 p-0 align-middle border-0 bg-transparent group-hover:scale-[1.02] transition-transform"
                />
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
                        {currentLanguage === 'en' ? 'Email' : 'ईमेल'}
                        <span className="text-destructive ml-0.5">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="border-2 focus:border-primary py-6"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        {currentLanguage === 'en'
                          ? 'We will send a verification code to this address.'
                          : 'हम इस पते पर सत्यापन कोड भेजेंगे।'}
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="password" className="text-sm font-semibold mb-2 block">
                        {currentLanguage === 'en' ? 'Password' : 'पासवर्ड'}
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder={
                          currentLanguage === 'en'
                            ? 'Create a strong password'
                            : 'एक मजबूत पासवर्ड बनाएं'
                        }
                        value={formData.password}
                        onChange={handleInputChange}
                        className="border-2 focus:border-primary py-6"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold mb-2 block">
                        {currentLanguage === 'en' ? 'Confirm Password' : 'पासवर्ड की पुष्टि करें'}
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        placeholder={
                          currentLanguage === 'en'
                            ? 'Re-enter your password'
                            : 'अपना पासवर्ड फिर से दर्ज करें'
                        }
                        value={formData.confirmPassword}
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

          {/* Step 4: Email OTP + optional farmer KYC */}
          {step === 4 && (
            <AnimateOnScroll animation="fade-in">
              <Card className="border-2 shadow-lg">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email-otp" className="text-sm font-semibold block">
                        {t.emailCodeLabel}
                        <span className="text-destructive ml-0.5">*</span>
                      </Label>
                      <p className="text-xs text-muted-foreground">{t.emailCodeHint}</p>
                      <Input
                        id="email-otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="000000"
                        value={emailVerificationCode}
                        onChange={(e) =>
                          setEmailVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        className="text-center text-lg tracking-[0.35em] font-mono border-2 focus:border-primary py-6"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full"
                        disabled={isLoading || !formData.email?.trim()}
                        onClick={async () => {
                          try {
                            setIsLoading(true);
                            await apiService.auth.sendRegistrationEmailCode({
                              email: formData.email.trim(),
                            });
                            toast({ title: t.codeSent, description: t.codeSentDesc });
                          } catch (error: unknown) {
                            const message =
                              (error as { response?: { data?: { message?: string } } })?.response
                                ?.data?.message || 'Could not resend.';
                            toast({
                              title: currentLanguage === 'en' ? 'Resend failed' : 'पुनः भेजना विफल',
                              description: message,
                              variant: 'destructive',
                            });
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                      >
                        {t.resendCode}
                      </Button>
                    </div>
                    {role === 'farmer' && (
                      <div className="pt-6 border-t border-border space-y-4">
                        <div>
                          <Label htmlFor="kyc-doc-type" className="text-sm font-semibold mb-2 block">
                            {t.kycDocTypeLabel}
                            <span className="text-destructive ml-0.5">*</span>
                          </Label>
                          <select
                            id="kyc-doc-type"
                            value={kycDocType}
                            onChange={(e) =>
                              setKycDocType(e.target.value === 'kisan' ? 'kisan' : 'aadhaar')
                            }
                            className="w-full px-4 py-4 bg-background border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                          >
                            <option value="aadhaar">{t.kycAadhaar}</option>
                            <option value="kisan">{t.kycKisan}</option>
                          </select>
                        </div>
                        <div>
                          <Label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            {currentLanguage === 'en' ? 'Upload KYC Document' : 'KYC दस्तावेज़ अपलोड करें'}
                            <span className="text-destructive">*</span>
                          </Label>
                          <p className="text-xs text-muted-foreground mb-3">
                            {currentLanguage === 'en'
                              ? 'Aadhaar or Kisan ID — PNG, JPG, or PDF, max 5MB. Required to create your account.'
                              : 'आधार या किसान ID — PNG, JPG या PDF, अधिकतम 5MB। खाता बनाने के लिए आवश्यक।'}
                          </p>
                          <input
                            ref={kycInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,application/pdf,.pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={onKycInputChange}
                          />
                          <button
                            type="button"
                            onClick={() => kycInputRef.current?.click()}
                            className={`w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
                              kycFile
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-muted/50'
                            }`}
                          >
                            {kycFile ? (
                              <div className="text-foreground">
                                <CheckCircle className="w-14 h-14 mx-auto mb-3 text-primary" />
                                <p className="font-semibold text-lg mb-1">
                                  {currentLanguage === 'en' ? 'Ready to submit' : 'जमा करने के लिए तैयार'}
                                </p>
                                <p className="text-sm text-muted-foreground break-all px-2">
                                  {t.kycSelected}: {kycFile.name}
                                </p>
                                <p className="text-xs text-primary mt-3 font-medium">
                                  {currentLanguage === 'en' ? 'Tap to choose a different file' : 'दूसरी फ़ाइल चुनने के लिए टैप करें'}
                                </p>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-16 h-16 mx-auto mb-3 text-muted-foreground" />
                                <p className="font-semibold text-lg mb-1">
                                  {currentLanguage === 'en' ? 'Click to upload' : 'अपलोड करने के लिए क्लिक करें'}
                                </p>
                                <p className="text-sm text-muted-foreground">PNG, JPG, PDF up to 5MB</p>
                              </>
                            )}
                          </button>
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
