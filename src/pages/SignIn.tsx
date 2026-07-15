import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api/auth';
import { cookieService } from '@/lib/utils/cookies';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import Badge from '@/components/Badge';
import RotatingText from '@/components/RotatingText';

const SignIn = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    gmail: cookieService.getRememberEmail() || '',
    password: '',
  });

  const [errors, setErrors] = useState({
    gmail: '',
    password: '',
  });

  const isBusy = isLoading || isGoogleLoading;

  const validateForm = () => {
    const newErrors = {
      gmail: '',
      password: '',
    };

    if (!formData.gmail.trim()) {
      newErrors.gmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.gmail)) {
      newErrors.gmail = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast({
        variant: 'destructive',
        title: 'Google sign-in failed',
        description: 'No credential received from Google. Please try again.',
      });
      return;
    }

    setIsGoogleLoading(true);
    try {
      const response = await authAPI.signInWithGoogle(credentialResponse.credential);

      // Refresh auth context
      await checkSession();

      toast({
        title: 'Welcome back!',
        description: response.message || 'Signed in with Google successfully',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Google sign-in error',
        description: error instanceof Error ? error.message : 'Failed to sign in with Google',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast({
      variant: 'destructive',
      title: 'Google sign-in failed',
      description: 'Something went wrong while connecting to Google. Please try again.',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.signIn({
        ...formData,
        rememberMe
      });
      
      if (rememberMe) {
        cookieService.setRememberEmail(formData.gmail);
      } else {
        cookieService.clearRememberEmail();
      }
      
      // Refresh auth context
      await checkSession();

      toast({
        title: 'Welcome back!',
        description: response.message || 'Signed in successfully',
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign in',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 px-4 py-10 flex items-center">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-6xl mx-auto grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-center">
        {/* Left hero section */}
        <section
          aria-labelledby="auth-hero-heading"
          className="space-y-8"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <AnnouncementBanner />
              <Badge text="Combinator" icon="Y" />
            </div>

            <div className="space-y-4">
              <h1
                id="auth-hero-heading"
                className="text-4xl sm:text-5xl lg:text-6xl leading-tight tracking-tight"
              >
                <span className="block text-foreground font-light">
                  AI Multi-Agent Operator
                </span>
                <span className="block mt-2 text-foreground font-bold">
                  To automate workflows that{' '}
                  <RotatingText
                    words={['optimize.', 'scale.', 'deliver.']}
                    interval={2800}
                  />
                </span>
              </h1>

              <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
                Deploy autonomous agents that coordinate, execute, and complete business
                operations end-to-end — without human overhead.
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Secure, JWT-based authentication</span>
            </div>
            <div className="h-px w-8 bg-border" />
            <span>Sign in to access your operator dashboard.</span>
          </div>
        </section>

        {/* Right auth card */}
        <section
          aria-label="Sign in"
          className="flex justify-end"
        >
          <Card className="relative w-full max-w-md overflow-hidden backdrop-blur-sm bg-card/95 shadow-2xl border-border/50">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-3xl font-bold tracking-tight">Welcome back</CardTitle>
              <CardDescription className="text-base">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Google at top */}
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-muted/70 via-background to-muted/70 p-[1px] shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-card/95 px-4 py-3 sm:flex-row sm:justify-between">
                    <div className="text-center sm:text-left space-y-0.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        Instant access
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        Continue with Google
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        shape="pill"
                        theme="outline"
                        size="medium"
                        width="200"
                        useOneTap={false}
                      />
                    </div>
                  </div>
                </div>
                <div className="relative flex items-center justify-center">
                  <span className="h-px w-full bg-border" />
                  <span className="px-3 text-xs text-muted-foreground bg-card relative">
                    or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gmail">Email</Label>
              <Input
                id="gmail"
                name="gmail"
                type="email"
                placeholder="john@example.com"
                value={formData.gmail}
                onChange={handleChange}
                disabled={isBusy}
                className={errors.gmail ? 'border-destructive' : ''}
              />
              {errors.gmail && (
                <p className="text-sm text-destructive">{errors.gmail}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="#"
                  className="text-sm text-primary hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    toast({
                      title: 'Coming soon',
                      description: 'Password reset feature will be available soon',
                    });
                  }}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isBusy}
                className={errors.password ? 'border-destructive' : ''}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </label>
            </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-gray-600 via-gray-400 to-gray-300 hover:from-gray-700 hover:via-gray-500 hover:to-gray-400 text-white font-semibold shadow-lg"
                disabled={isBusy}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              Don't have an account?{' '}
              <Link
                to="/sign-up"
                className="font-semibold text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>

          {isBusy && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
              <div className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">
                {isGoogleLoading ? 'Connecting to Google…' : 'Signing you in…'}
              </p>
            </div>
          )}
        </Card>
        </section>
      </div>
    </div>
  );
};

export default SignIn;
