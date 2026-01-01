import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, ArrowLeft, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { signInWithEmail, signUpWithEmail, isFirebaseInitialized, getFirebaseInitError } from '@/lib/firebase';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const NGOLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: 'Error', description: 'Please enter organization email', variant: 'destructive' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    try {
      setLoading(true);
      await authApi.sendOtp(normalizedEmail);
      setOtpSent(true);
      toast({
        title: 'OTP Sent',
        description: 'Please check your organization email for the 6-digit verification code.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      toast({ title: 'Error', description: 'Please enter the OTP', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      let customToken;

      const normalizedEmail = email.trim().toLowerCase();
      if (isSignUp) {
        if (!password || !orgName || !city || !area) {
          toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
          return;
        }

        const result = (await authApi.registerWithOtp({
          email: normalizedEmail,
          otp,
          password,
          role: 'ngo',
          metadata: { organization_name: orgName, city, area }
        })) as any;
        customToken = result.custom_token;
      } else {
        const result = (await authApi.loginWithOtp(normalizedEmail, otp)) as any;
        customToken = result.custom_token;
      }

      if (customToken) {
        const { signInWithCustomToken } = await import('@/lib/firebase');
        await signInWithCustomToken(customToken);

        toast({
          title: isSignUp ? 'Account created!' : 'Welcome back!',
          description: `Signed in as ${email}`,
        });
        navigate('/ngo-dashboard');
      }
    } catch (error: any) {
      console.error('NGO auth error:', error);
      toast({
        title: 'Authentication Failed',
        description: error.message || 'Verification failed. Please check your OTP.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container py-12">
        <div className="max-w-md mx-auto">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <Card variant="elevated">
            <CardHeader className="text-center">
              <Users className="mx-auto h-8 w-8 text-success" />
              <CardTitle>NGO / Institution Login</CardTitle>
              <CardDescription>Manage book distribution</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={otpSent ? handleVerifyAndAuth : handleSendOtp} className="space-y-4">
                {!otpSent ? (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Organization Email</label>
                      <Input
                        type="email"
                        placeholder="e.g., contact@hopefoundation.org"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="success"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        'Send Verification OTP'
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="bg-success/5 p-3 rounded-lg border border-success/10">
                      <p className="text-xs text-center text-muted-foreground">
                        OTP sent to <span className="font-medium text-foreground">{email}</span>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="ml-2 text-primary hover:underline"
                        >
                          Change
                        </button>
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Enter OTP</label>
                      <Input
                        placeholder="6-digit code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        disabled={loading}
                        required
                        maxLength={6}
                        className="text-center text-lg tracking-widest font-bold"
                      />
                    </div>

                    {isSignUp && (
                      <>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Organization Name</label>
                          <Input
                            placeholder="e.g., Hope Foundation"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            disabled={loading}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">City</label>
                            <Input
                              placeholder="e.g., Mumbai"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                              disabled={loading}
                              required
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">Area</label>
                            <Input
                              placeholder="e.g., Andheri West"
                              value={area}
                              onChange={(e) => setArea(e.target.value)}
                              disabled={loading}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Create Password</label>
                          <Input
                            type="password"
                            placeholder="Min. 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                          />
                        </div>
                      </>
                    )}

                    <Button
                      type="submit"
                      variant="success"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        isSignUp ? 'Verify & Create Account' : 'Verify & Login'
                      )}
                    </Button>
                  </>
                )}
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setPassword('');
                  }}
                  className="text-sm text-primary hover:underline"
                  disabled={loading}
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NGOLogin;
