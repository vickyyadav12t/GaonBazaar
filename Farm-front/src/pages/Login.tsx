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
import { toast } from '@/hooks/use-toast';
import { AnimateOnScroll } from '@/components/animations';
import { apiService } from '@/services/api';

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector((state) => state.language);
  
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const content = {
    en: {
      title: 'Welcome Back!',
      subtitle: 'Login to your account',
      phone: 'Phone Number',
      email: 'Email Address',
      password: 'Password',
      login: 'Login',
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
      password: 'पासवर्ड',
      login: 'लॉगिन',
      noAccount: 'खाता नहीं है?',
      register: 'अभी रजिस्टर करें',
      orContinue: 'या जारी रखें',
      demoAccounts: 'डेमो खाते',
    },
  };

  const t = content[currentLanguage];

  const handleLogin = async () => {
    if (loginMethod === 'phone' && !phone) {
      setError(
        currentLanguage === 'en'
          ? 'Please enter your phone number'
          : 'कृपया अपना फ़ोन नंबर दर्ज करें'
      );
      return;
    }

    if (loginMethod === 'email' && !email) {
      setError(
        currentLanguage === 'en'
          ? 'Please enter your email address'
          : 'कृपया अपना ईमेल पता दर्ज करें'
      );
      return;
    }

    if (!password) {
      setError(
        currentLanguage === 'en'
          ? 'Please enter your password'
          : 'कृपया अपना पासवर्ड दर्ज करें'
      );
      return;
    }

    const credentials: { phone?: string; email?: string; password: string } = {
      password,
    };

    if (loginMethod === 'phone') {
      credentials.phone = phone;
    } else {
      credentials.email = email;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiService.auth.login(credentials);
      const { user, token } = response.data || {};

      if (token) {
        localStorage.setItem('authToken', token);
      }

      if (!user) {
        throw new Error('User data not returned from server');
      }

      // Map backend user to frontend User shape (minimal for now)
      const mappedUser = {
        id: user._id || user.id,
        name: user.name,
        email: user.email || '',
        phone: user.phone,
        role: user.role,
        avatar: undefined,
        isVerified: user.kycStatus === 'approved',
        kycStatus: user.kycStatus || 'pending',
        location: {
          state: user.location?.state || '',
          district: user.location?.district || '',
          village: user.location?.village || '',
        },
        createdAt: user.createdAt || new Date().toISOString(),
      };

      dispatch(loginSuccess(mappedUser));

      if (mappedUser.role === 'farmer') {
        navigate('/farmer/dashboard');
      } else if (mappedUser.role === 'buyer') {
        navigate('/buyer/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      const message =
        err?.response?.data?.message || err?.message || 'Login failed';
      setError(message);
      toast({
        title: 'Login failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
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

                  <div>
                    <Label htmlFor="password" className={`text-sm font-semibold mb-2 block ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                      {t.password}
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder={
                          currentLanguage === 'en'
                            ? 'Enter your password'
                            : 'अपना पासवर्ड दर्ज करें'
                        }
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-2 focus:border-primary py-6 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button 
                    className="w-full btn-primary-gradient py-7 text-lg font-semibold hover:scale-105 transition-transform shadow-lg"
                    onClick={handleLogin}
                    disabled={
                      isLoading ||
                      (loginMethod === 'phone' ? !phone : !email) ||
                      !password
                    }
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        {currentLanguage === 'en' ? 'Processing...' : 'प्रोसेसिंग...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        {t.login}
                        <ArrowRight className="ml-2 w-5 h-5" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Error message */}
          {error && (
            <p className="text-center text-sm text-red-600 mt-4">
              {error}
            </p>
          )}

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
