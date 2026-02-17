import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Phone, ArrowRight, Mail, Shield, Sparkles, TrendingUp, Users, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { loginSuccess } from '@/store/slices/authSlice';
import { mockFarmers, mockBuyers } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';
import { AnimateOnScroll } from '@/components/animations';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector((state) => state.language);
  
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const content = {
    en: {
      title: 'Welcome Back!',
      subtitle: 'Login to your account',
      phone: 'Phone Number',
      email: 'Email Address',
      otp: 'Enter OTP',
      sendOtp: 'Send OTP',
      verifyOtp: 'Verify & Login',
      noAccount: "Don't have an account?",
      register: 'Register Now',
      orContinue: 'Or continue with',
      demoAccounts: 'Demo Accounts',
    },
    hi: {
      title: 'वापस स्वागत है!',
      subtitle: 'अपने खाते में लॉगिन करें',
      phone: 'फ़ोन नंबर',
      email: 'ईमेल पता',
      otp: 'OTP दर्ज करें',
      sendOtp: 'OTP भेजें',
      verifyOtp: 'सत्यापित करें और लॉगिन करें',
      noAccount: 'खाता नहीं है?',
      register: 'अभी रजिस्टर करें',
      orContinue: 'या जारी रखें',
      demoAccounts: 'डेमो खाते',
    },
  };

  const t = content[currentLanguage];

  const handleSendOtp = () => {
    setIsLoading(true);
    // Simulate OTP sending
    setTimeout(() => {
      setShowOtp(true);
      setIsLoading(false);
      toast({
        title: 'OTP Sent',
        description: 'A verification code has been sent to your phone.',
      });
    }, 1000);
  };

  const handleLogin = () => {
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      // For demo, login as first farmer
      dispatch(loginSuccess(mockFarmers[0]));
      setIsLoading(false);
      navigate('/farmer/dashboard');
    }, 1000);
  };

  const handleDemoLogin = (role: 'farmer' | 'buyer' | 'admin') => {
    setIsLoading(true);
    setTimeout(() => {
      if (role === 'farmer') {
        dispatch(loginSuccess(mockFarmers[0]));
        navigate('/farmer/dashboard');
      } else if (role === 'buyer') {
        dispatch(loginSuccess(mockBuyers[0]));
        navigate('/buyer/dashboard');
      } else {
        // Admin mock user
        dispatch(loginSuccess({
          id: 'admin-1',
          name: 'Admin User',
          email: 'admin@example.com',
          phone: '+91 98765 00000',
          role: 'admin',
          isVerified: true,
          kycStatus: 'approved',
          location: { state: 'Delhi', district: 'New Delhi' },
          createdAt: '2024-01-01',
        }));
        navigate('/admin/dashboard');
      }
      setIsLoading(false);
    }, 500);
  };

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
            <Shield className="w-4 h-4" />
            <span className="text-sm font-semibold">Secure Login</span>
          </div>
          <h2 className="text-5xl font-extrabold mb-6 leading-tight">
            {currentLanguage === 'en' 
              ? 'Empowering Farmers, Connecting Markets'
              : 'किसानों को सशक्त बनाना, बाजारों को जोड़ना'}
          </h2>
          <p className="text-xl opacity-95 leading-relaxed">
            {currentLanguage === 'en'
              ? 'Join thousands of farmers who have increased their income by selling directly to buyers.'
              : 'हजारों किसानों से जुड़ें जिन्होंने सीधे खरीदारों को बेचकर अपनी आय बढ़ाई है।'}
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="text-3xl font-bold mb-1">3,200+</div>
            <div className="text-sm opacity-90 flex items-center gap-1">
              <Users className="w-4 h-4" />
              {currentLanguage === 'en' ? 'Farmers' : 'किसान'}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="text-3xl font-bold mb-1">15,000+</div>
            <div className="text-sm opacity-90 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              {currentLanguage === 'en' ? 'Deals' : 'सौदे'}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
            <div className="text-3xl font-bold mb-1">₹4.5Cr+</div>
            <div className="text-sm opacity-90 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              {currentLanguage === 'en' ? 'Saved' : 'बचत'}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
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

          <AnimateOnScroll animation="slide-up" delay={0.1}>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {currentLanguage === 'en' ? 'Secure Login' : 'सुरक्षित लॉगिन'}
                </span>
              </div>
              <h1 className={`text-4xl md:text-5xl font-extrabold text-foreground mb-3 ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.title}
              </h1>
              <p className={`text-lg text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                {t.subtitle}
              </p>
            </div>
          </AnimateOnScroll>

          {/* Login Method Toggle */}
          <AnimateOnScroll animation="slide-up" delay={0.2}>
            <Card className="mb-6 border-2">
              <CardContent className="p-2">
                <div className="flex rounded-lg bg-muted p-1">
                  <button
                    onClick={() => setLoginMethod('phone')}
                    className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      loginMethod === 'phone' 
                        ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Phone className="w-4 h-4" />
                    Phone
                  </button>
                  <button
                    onClick={() => setLoginMethod('email')}
                    className={`flex-1 py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      loginMethod === 'email' 
                        ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </button>
                </div>
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Login Form */}
          <AnimateOnScroll animation="slide-up" delay={0.3}>
            <Card className="border-2 shadow-lg mb-6">
              <CardContent className="p-6">
                <div className="space-y-5">
                  {loginMethod === 'phone' ? (
                    <div>
                      <Label htmlFor="phone" className={`text-sm font-semibold mb-2 block ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                        {t.phone}
                      </Label>
                      <div className="flex gap-2">
                        <div className="flex items-center px-4 bg-muted rounded-xl border-2 border-input font-medium">
                          <span className="text-sm text-foreground">+91</span>
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="flex-1 border-2 focus:border-primary py-6"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="email" className={`text-sm font-semibold mb-2 block ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                        {t.email}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-2 focus:border-primary py-6"
                      />
                    </div>
                  )}

                  {showOtp && (
                    <div className="animate-slide-up">
                      <Label htmlFor="otp" className={`text-sm font-semibold mb-2 block ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                        {t.otp}
                      </Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        className="text-center text-2xl tracking-widest border-2 focus:border-primary py-6 font-bold"
                      />
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        {currentLanguage === 'en' 
                          ? 'Enter the 6-digit code sent to your phone'
                          : 'अपने फोन पर भेजा गया 6 अंकों का कोड दर्ज करें'}
                      </p>
                    </div>
                  )}

                  <Button 
                    className="w-full btn-primary-gradient py-7 text-lg font-semibold hover:scale-105 transition-transform shadow-lg"
                    onClick={showOtp ? handleLogin : handleSendOtp}
                    disabled={isLoading || (loginMethod === 'phone' ? !phone : !email)}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        {currentLanguage === 'en' ? 'Processing...' : 'प्रोसेसिंग...'}
                      </>
                    ) : showOtp ? (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {t.verifyOtp}
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    ) : (
                      <>
                        {loginMethod === 'phone' ? <Phone className="w-5 h-5 mr-2" /> : <Mail className="w-5 h-5 mr-2" />}
                        {t.sendOtp}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Demo Accounts */}
          <AnimateOnScroll animation="slide-up" delay={0.4}>
            <div className="mt-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <Badge variant="secondary" className="px-4 py-1">
                    <span className={currentLanguage === 'hi' ? 'font-hindi' : ''}>
                      {t.demoAccounts}
                    </span>
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card 
                  className="cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-primary/50"
                  onClick={() => handleDemoLogin('farmer')}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-4xl mb-2">🧑‍🌾</div>
                    <p className="font-semibold text-sm">Farmer</p>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-primary/50"
                  onClick={() => handleDemoLogin('buyer')}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-4xl mb-2">🛒</div>
                    <p className="font-semibold text-sm">Buyer</p>
                  </CardContent>
                </Card>
                <Card 
                  className="cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 hover:border-primary/50"
                  onClick={() => handleDemoLogin('admin')}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-4xl mb-2">👨‍💼</div>
                    <p className="font-semibold text-sm">Admin</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </AnimateOnScroll>

          {/* Register Link */}
          <AnimateOnScroll animation="fade-in" delay={0.5}>
            <p className={`text-center mt-8 text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
              {t.noAccount}{' '}
              <Link to="/register" className="text-primary font-semibold hover:underline hover:text-primary/80 transition-colors">
                {t.register}
              </Link>
            </p>
          </AnimateOnScroll>
        </div>
      </div>
    </div>
  );
};

export default Login;
