import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token')?.trim() || '', [searchParams]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({
        title: 'Invalid link',
        description: 'Open the reset link from your email, or ask an admin to send a new one.',
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
      toast({
        title: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsLoading(true);
      await apiService.auth.resetPassword({ token, password });
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
            <CardTitle className="text-xl break-words sm:text-2xl">Set new password</CardTitle>
          </div>
          <CardDescription>
            Choose a new password for your account. This link expires after 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-6 sm:px-6">
          {!token ? (
            <p className="text-sm text-muted-foreground mb-4">
              No reset token in the URL. Use the link from your email or request a new reset from an
              administrator.
            </p>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={!token}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={!token}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !token}>
              {isLoading ? 'Saving…' : 'Update password'}
            </Button>
          </form>
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

export default ResetPassword;
