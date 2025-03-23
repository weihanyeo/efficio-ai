"use client";
import React from 'react';
import { useRouter, usePathname } from "next/navigation";
import { Bot, Mail, Lock, Eye, EyeOff, ArrowRight, Github, Chrome, Terminal, Zap, Sparkles, Brain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const navigate = useRouter();
  const location = usePathname();
  const { signIn, signUp, user, onboardingCompleted } = useAuth();

  // Check for signup parameter in URL
  React.useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('signup') === 'true') {
      setIsLogin(false);
    }
  }, [location]);

  // Check for pending invite
  const pendingInvite = React.useMemo(() => {
    return localStorage.getItem('pendingInvite');
  }, []);

  const from = React.useMemo(() => {
    if (pendingInvite) {
      return `/invite/${pendingInvite}`;
    }
    return (location.state as any)?.from?.pathname || '/dashboard';
  }, [location.state, pendingInvite]);

  // Add effect to handle navigation after successful auth
  React.useEffect(() => {
    if (user) {
      // Clear pending invite from localStorage if it exists
      if (pendingInvite) {
        localStorage.removeItem('pendingInvite');
      }
      
      // For newly registered users (who haven't completed onboarding),
      // redirect to onboarding page
      if (!onboardingCompleted) {
        navigate.push('/onboarding', { replace: true });
      } else {
        // For existing users, redirect to dashboard or the requested page
        navigate.push(from, { replace: true });
      }
    }
  }, [user, from, navigate, pendingInvite, onboardingCompleted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
        // After signup, the user will be redirected to onboarding via the useEffect above
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-foreground flex">
      {/* Left Panel - Features */}
      <div className="flex-1 p-8 hidden lg:flex flex-col">
        <div className="flex items-center gap-3 mb-12">
          <Bot className="w-10 h-10 text-indigo-400" />
          <h1 className="text-3xl font-bold">Efficio.AI</h1>
        </div>

        <div className="flex-1 flex items-center">
          <div className="max-w-xl">
            <div className="relative">
              <div className="absolute -left-6 -top-6 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />
              <div className="absolute right-12 bottom-12 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
              <h2 className="text-4xl font-bold mb-4 leading-tight">
                Smart Issue Tracking<br />Made Simple
              </h2>
              <p className="text-xl text-gray-400 mb-12">
                Track issues intelligently with AI that understands your development workflow and helps your team stay productive.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {[
                {
                  icon: <Brain className="w-6 h-6 text-indigo-400" />,
                  title: 'Smart Tracking',
                  description: 'AI automatically categorizes and prioritizes issues.'
                },
                {
                  icon: <Terminal className="w-6 h-6 text-purple-400" />,
                  title: 'Code Integration',
                  description: 'Seamless GitHub and GitLab integration.'
                },
                {
                  icon: <Sparkles className="w-6 h-6 text-blue-400" />,
                  title: 'Team Collaboration',
                  description: 'Real-time updates and smart notifications.'
                },
                {
                  icon: <Zap className="w-6 h-6 text-yellow-400" />,
                  title: 'Progress Insights',
                  description: 'AI-powered analytics and team performance tracking.'
                }
              ].map((feature, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-secondary to-muted rounded-xl border border-border hover:border-[#464646] transition-colors">
                  <div className="p-2 bg-muted rounded-lg w-fit mb-3">
                    {feature.icon}
                  </div>
                  <h3 className="font-medium mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <p className="text-sm text-gray-500">Trusted by developers at</p>
          <div className="flex items-center gap-6 mt-4">
            {['Google', 'Microsoft', 'Amazon', 'Meta'].map((company) => (
              <span key={company} className="text-gray-400 font-medium">{company}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full max-w-md bg-muted p-12 flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent" />
        
        <div className="relative">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">
              {isLogin ? 'Welcome back!' : 'Create your account'}
            </h2>
            <p className="text-gray-400">
              {isLogin ? 'Sign in to continue to your workspace.' : 'Start your development journey with us.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="name@company.com"
                  required
                />
                <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-2.5 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted rounded-md transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 text-foreground rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-muted text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Github className="w-5 h-5" />
                <span className="text-sm">GitHub</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Chrome className="w-5 h-5" />
                <span className="text-sm">Google</span>
              </button>
            </div>
          </form>

          <p className="mt-8 text-sm text-gray-400 text-center">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {isLogin ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};