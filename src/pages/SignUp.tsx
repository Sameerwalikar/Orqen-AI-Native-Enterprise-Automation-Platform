import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { authAPI } from '@/lib/api/auth';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import Badge from '@/components/Badge';
import RotatingText from '@/components/RotatingText';

const SignUp = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { checkSession } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    gmail: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    firstName: '',
    gmail: '',
    password: '',
  });

  const isBusy = isLoading || isGoogleLoading;

  const validateForm = () => {
    const newErrors = {
      firstName: '',
      gmail: '',
      password: '',
    };

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.gmail.trim()) {
      newErrors.gmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.gmail)) {
      newErrors.gmail = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast({
        variant: 'destructive',
        title: 'Google sign up failed',
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
        title: 'Welcome!',
        description: response.message || 'Signed up with Google successfully',
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 800);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Google sign up error',
        description: error instanceof Error ? error.message : 'Failed to sign up with Google',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast({
      variant: 'destructive',
      title: 'Google sign up failed',
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
      const response = await authAPI.signUp(formData);
      
      // Refresh auth context
      await checkSession();

      toast({
        title: 'Success!',
        description: response.message || 'Account created successfully',
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create account',
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
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-6xl mx-auto grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-center">
        {/* Left hero section */}
        <section
          aria-labelledby="auth-signup-hero-heading"
          className="space-y-8"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <AnnouncementBanner />
              <Badge text="Combinator" icon="Y" />
            </div>

            <div className="space-y-4">
              <h1
                id="auth-signup-hero-heading"
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
                Spin up an account to orchestrate agents that run workflows for you —  from intake to delivery  with complete visibility and control.
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4 text-xs sm:text-sm text-muted-foreground pt-2">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Fast onboarding. No credit card required.</span>
            </div>
            <div className="h-px w-8 bg-border" />
            <span>Sign up to unlock your personal dashboard.</span>
          </div>
        </section>

        {/* Right auth card */}
        <section
          aria-label="Create account"
          className="flex justify-end"
        >
          <Card className="relative w-full max-w-md overflow-hidden backdrop-blur-sm bg-card/95 shadow-2xl border-border/50">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-3xl font-bold tracking-tight">Create an account</CardTitle>
              <CardDescription className="text-base">
                Enter your details to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Google at top */}
              <div className="space-y-3">
                <div className="rounded-2xl border border-border/60 bg-gradient-to-r from-muted/70 via-background to-muted/70 p-[1px] shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col items-center gap-3 rounded-2xl bg-card/95 px-4 py-3 sm:flex-row sm:justify-between">
                    <div className="text-center sm:text-left space-y-0.5">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                        Fast onboarding
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        Sign up with Google
                      </p>
                    </div>
                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        text="signup_with"
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
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                disabled={isBusy}
                className={errors.firstName ? 'border-destructive' : ''}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName}</p>
              )}
            </div>

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
              <Label htmlFor="password">Password</Label>
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

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-gray-600 via-gray-400 to-gray-300 hover:from-gray-700 hover:via-gray-500 hover:to-gray-400 text-white font-semibold shadow-lg"
                disabled={isBusy}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account..
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link
                to="/sign-in"
                className="font-semibold text-primary hover:underline"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>

          {isBusy && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm">
              <div className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">
                {isGoogleLoading ? 'Connecting to Google…' : 'Creating your account…'}
              </p>
            </div>
          )}
        </Card>
        </section>
      </div>
    </div>
  );
};

export default SignUp;
