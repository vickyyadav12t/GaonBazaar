import { useEffect, useState } from 'react';
import { useGoogleOAuthButtonWidth } from '@/hooks/useGoogleOAuthButtonWidth';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Phone, ArrowRight, Mail, Shield, CheckCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppDispatch, useAppSelector } from '@/hooks/useRedux';
import { loginSuccess } from '@/store/slices/authSlice';
import { toast } from '@/hooks/use-toast';
import { AnimateOnScroll } from '@/components/animations';
import { apiService, setAuthToken } from '@/services/api';
import { mapApiUserToAuth } from '@/lib/mapAuthUser';
import { ROUTES } from '@/constants';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const { currentLanguage } = useAppSelector((state) => state.language);

  useEffect(() => {
    if (searchParams.get('suspended') !== '1') return;
    toast({
      title: 'Account suspended',
      description:
        'Your account is suspended or your session was ended. Contact support if this is unexpected.',
      variant: 'destructive',
    });
    const next = new URLSearchParams(searchParams);
    next.delete('suspended');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);
  
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const googleEnabled = Boolean(googleClientId);
  const googleBtnWidth = useGoogleOAuthButtonWidth(40);

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
      googleFailed: 'Google sign-in failed',
      googleContinue: 'Continue with Google',
      googleNotConfiguredTitle: 'Google sign-in unavailable',
      googleNotConfiguredDesc: 'Use email or phone to sign in, or try again later.',
      forgotPassword: 'Forgot password?',
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
      googleFailed: 'Google साइन-इन विफल',
      googleContinue: 'Google से जारी रखें',
      googleNotConfiguredTitle: 'Google साइन-इन उपलब्ध नहीं',
      googleNotConfiguredDesc: 'ईमेल या फोन से साइन इन करें, या बाद में कोशिश करें।',
      forgotPassword: 'पासवर्ड भूल गए?',
    },
  };

  const t = content[currentLanguage];

  const GoogleGlyph = () => (
    <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  const completeAuth = (user: unknown, token?: string) => {
    if (token) {
      setAuthToken(token);
    }
    if (!user || typeof user !== 'object') {
      throw new Error('User data not returned from server');
    }
    const mappedUser = mapApiUserToAuth(user as Record<string, unknown>);
    dispatch(loginSuccess(mappedUser));
    const from = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
    if (
      from?.pathname &&
      typeof from.pathname === 'string' &&
      from.pathname.startsWith('/') &&
      from.pathname !== '/login'
    ) {
      navigate(`${from.pathname}${from.search || ''}`, { replace: true });
      return;
    }
    if (mappedUser.role === 'farmer') {
      navigate('/farmer/dashboard');
    } else if (mappedUser.role === 'buyer') {
      navigate('/buyer/dashboard');
    } else {
      navigate(ROUTES.ADMIN_DASHBOARD);
    }
  };

  const handleGoogleSuccess = async (credential?: string | null) => {
    if (!credential) {
      toast({
        title: t.googleFailed,
        description:
          currentLanguage === 'en'
            ? 'No credential returned from Google.'
            : 'Google से कोई क्रेडेंशियल नहीं मिला।',
        variant: 'destructive',
      });
      return;
    }
    try {
      setGoogleLoading(true);
      setError(null);
      const response = await apiService.auth.googleLogin({ credential });
      const { user, token } = response.data || {};
      completeAuth(user, token);
    } catch (err: unknown) {
      console.error(err);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        (currentLanguage === 'en' ? 'Google sign-in failed' : 'Google साइन-इन विफल');
      setError(message);
      toast({
        title: t.googleFailed,
        description: message,
        variant: 'destructive',
      });
    } finally {
      setGoogleLoading(false);
    }
  };

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
      completeAuth(user, token);
    } catch (err: any) {
      console.error(err);
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message;
      const message =
        status === 429
          ? currentLanguage === 'en'
            ? 'Too many requests. Please wait a few minutes and try again.'
            : 'बहुत अधिक अनुरोध। कुछ मिनट प्रतीक्षा करें और फिर कोशिश करें।'
          : serverMsg || err?.message || 'Login failed';
      setError(message);
      toast({
        title:
          status === 429
            ? currentLanguage === 'en'
              ? 'Please wait'
              : 'कृपया प्रतीक्षा करें'
            : 'Login failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background">
      {/* Left Side - Branding */}
      <div className="relative hidden flex-col justify-start gap-12 overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:w-1/2">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 100% 0%, hsl(0 0% 100% / 0.25), transparent 50%), radial-gradient(ellipse 50% 45% at 0% 100%, hsl(var(--gold) / 0.12), transparent 45%)',
          }}
          aria-hidden
        />

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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Shield className="h-4 w-4 text-gold" />
            <span className="text-sm font-medium">Secure Login</span>
          </div>
          <h2 className="font-heading mb-6 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            {currentLanguage === 'en' 
              ? 'Empowering Farmers, Connecting Markets'
              : 'किसानों को सशक्त बनाना, बाजारों को जोड़ना'}
          </h2>
          <p className="text-lg leading-relaxed text-primary-foreground/90 md:text-xl">
            {currentLanguage === 'en'
              ? 'Join thousands of farmers who have increased their income by selling directly to buyers.'
              : 'हजारों किसानों से जुड़ें जिन्होंने सीधे खरीदारों को बेचकर अपनी आय बढ़ाई है।'}
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex min-w-0 flex-1 items-center justify-center p-4 sm:p-6 lg:p-12">
        <div className="mx-auto w-full min-w-0 max-w-md">
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

          <AnimateOnScroll animation="slide-up" delay={0.1}>
            <div className="mb-8 text-center sm:mb-10">
              <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-primary">
                  {currentLanguage === 'en' ? 'Secure Login' : 'सुरक्षित लॉगिन'}
                </span>
              </div>
              <h1
                className={`mb-3 text-3xl font-extrabold text-foreground sm:text-4xl md:text-5xl ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
              >
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
                    type="button"
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all duration-300 sm:gap-2 sm:py-3 sm:text-sm ${
                      loginMethod === 'phone'
                        ? 'bg-primary text-primary-foreground shadow-lg sm:scale-105'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Phone className="h-4 w-4 shrink-0" />
                    Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginMethod('email')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-semibold transition-all duration-300 sm:gap-2 sm:py-3 sm:text-sm ${
                      loginMethod === 'email'
                        ? 'bg-primary text-primary-foreground shadow-lg sm:scale-105'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Mail className="h-4 w-4 shrink-0" />
                    Email
                  </button>
                </div>
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Login Form */}
          <AnimateOnScroll animation="slide-up" delay={0.3}>
            <Card className="border-2 shadow-lg mb-6">
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-5">
                  {loginMethod === 'phone' ? (
                    <div>
                      <Label htmlFor="phone" className={`text-sm font-semibold mb-2 block ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}>
                        {t.phone}
                      </Label>
                      <div className="flex min-w-0 gap-2">
                        <div className="flex shrink-0 items-center rounded-xl border-2 border-input bg-muted px-3 font-medium sm:px-4">
                          <span className="text-sm text-foreground">+91</span>
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="98765 43210"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="min-w-0 flex-1 border-2 py-5 focus:border-primary sm:py-6"
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
                        className="border-2 py-5 focus:border-primary sm:py-6"
                      />
                    </div>
                  )}

                  <div>
                    <div className="mb-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
                      <Label
                        htmlFor="password"
                        className={`text-sm font-semibold block ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                      >
                        {t.password}
                      </Label>
                      <Link
                        to="/forgot-password"
                        className={`self-start text-sm font-medium text-primary hover:underline sm:self-auto ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                      >
                        {t.forgotPassword}
                      </Link>
                    </div>
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
                        className="border-2 py-5 pr-12 focus:border-primary sm:py-6"
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
                    className="w-full py-6 text-base font-semibold shadow-lg transition-transform btn-primary-gradient sm:py-7 sm:text-lg sm:hover:scale-[1.02]"
                    onClick={handleLogin}
                    disabled={
                      isLoading ||
                      googleLoading ||
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

          {/* Google sign-in — below password login */}
          <AnimateOnScroll animation="slide-up" delay={0.35}>
            <Card className="mt-6 border-2 shadow-md">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <p
                  className={`text-center text-sm font-medium text-muted-foreground ${currentLanguage === 'hi' ? 'font-hindi' : ''}`}
                >
                  {t.orContinue}
                </p>
                <div className="flex min-h-[44px] w-full flex-col items-center justify-center">
                  {googleLoading ? (
                    <div className="flex items-center justify-center gap-2 py-3 text-muted-foreground text-sm">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      {currentLanguage === 'en' ? 'Signing in…' : 'साइन इन…'}
                    </div>
                  ) : googleEnabled ? (
                    <div className="mx-auto flex w-full max-w-full justify-center overflow-x-hidden">
                      <GoogleLogin
                        onSuccess={(res) => void handleGoogleSuccess(res.credential)}
                        onError={() =>
                          toast({
                            title: t.googleFailed,
                            description:
                              currentLanguage === 'en'
                                ? 'Try again or use email or phone.'
                                : 'पुनः प्रयास करें या ईमेल/फोन से लॉगिन करें।',
                            variant: 'destructive',
                          })
                        }
                        text="continue_with"
                        shape="rectangular"
                        size="large"
                        width={googleBtnWidth}
                        locale={currentLanguage === 'hi' ? 'hi' : 'en'}
                      />
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-12 w-full max-w-sm text-base font-medium border-2 bg-card hover:bg-muted/60 sm:max-w-md"
                      onClick={() =>
                        toast({
                          title: t.googleNotConfiguredTitle,
                          description: t.googleNotConfiguredDesc,
                        })
                      }
                    >
                      <GoogleGlyph />
                      {t.googleContinue}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimateOnScroll>

          {/* Error message */}
          {error && (
            <p className="mt-4 break-words px-1 text-center text-sm text-red-600">{error}</p>
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
