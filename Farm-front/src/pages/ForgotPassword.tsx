import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { getApiErrorMessage } from '@/lib/apiErrors';

type Step = 'email' | 'code';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({
        title: 'Invalid email',
        description: 'Enter the email address on your account.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsLoading(true);
      await apiService.auth.forgotPassword({ email: trimmed });
      toast({
        title: 'Check your email',
        description:
          'If an account exists, we sent a 6-digit code. It expires in 10 minutes.',
      });
      setStep('code');
    } catch (err: unknown) {
      const message = getApiErrorMessage(err, 'Could not send the code.');
      toast({ title: 'Request failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = otp.replace(/\D/g, '');
    if (digits.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Enter the 6-digit code from your email.',
        variant: 'destructive',
      });
      return;
    }
    if (password.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Use at least 6 characters.',
        variant: 'destructive',
      });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    try {
      setIsLoading(true);
      await apiService.auth.resetPasswordWithOtp({
        email: email.trim(),
        otp: digits,
        password,
      });
      toast({
        title: 'Password updated',
        description: 'You can sign in with your new password.',
      });
      navigate('/login', { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Could not reset password.';
      toast({ title: 'Reset failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center overflow-x-hidden bg-gradient-to-b from-background to-muted/30 p-3 sm:p-4">
      <Card className="w-full min-w-0 max-w-md border-2 shadow-lg">
        <CardHeader className="space-y-1 px-4 pt-6 sm:px-6">
          <div className="mb-2 flex items-start gap-2 text-primary sm:items-center">
            <KeyRound className="mt-0.5 h-6 w-6 shrink-0 sm:mt-0" />
            <CardTitle className="text-xl break-words sm:text-2xl">
              {step === 'email' ? 'Forgot password' : 'Enter code & new password'}
            </CardTitle>
          </div>
          <CardDescription>
            {step === 'email'
              ? 'We will email you a one-time code to reset your password.'
              : `We sent a code to ${email.trim() || 'your email'}. Enter it below with your new password.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-6 sm:px-6">
          {step === 'email' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fp-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fp-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending…' : 'Send verification code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fp-otp">6-digit code</Label>
                <Input
                  id="fp-otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-lg tracking-[0.4em] font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fp-new">New password</Label>
                <Input
                  id="fp-new"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fp-confirm">Confirm password</Label>
                <Input
                  id="fp-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Saving…' : 'Update password'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={isLoading}
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    await apiService.auth.forgotPassword({ email: email.trim() });
                    toast({
                      title: 'Code sent again',
                      description: 'Check your inbox for a new 6-digit code.',
                    });
                  } catch (err: unknown) {
                    const message =
                      (err as { response?: { data?: { message?: string } } })?.response?.data
                        ?.message || 'Could not resend.';
                    toast({
                      title: 'Resend failed',
                      description: message,
                      variant: 'destructive',
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }}
              >
                Resend code
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isLoading}
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setPassword('');
                  setConfirm('');
                }}
              >
                Use a different email
              </Button>
            </form>
          )}
          <Button variant="ghost" className="w-full mt-4" asChild>
            <Link to="/login">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to login
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;
