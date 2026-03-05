'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Crown, AlertCircle, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { useSiteContent } from '@/hooks/useSiteContent';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const { signUp, signInWithGoogle, user } = useAuth();
  const { content } = useSiteContent();
  const router = useRouter();

  // Redirect when user is authenticated (handles return from Google redirect)
  useEffect(() => {
    if (user) {
      router.push('/user/dashboard');
    }
  }, [user, router]);

  const passwordStrength = password.length >= 8 ? (password.match(/[A-Z]/) && password.match(/[0-9]/) ? 'strong' : 'medium') : 'weak';
  const strengthColors = { weak: 'bg-red-400', medium: 'bg-yellow-400', strong: 'bg-green-400' };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      await signUp(email, password, name);
      toast.success('Account created! Welcome to Nilkanth Fashions 🎉');
      // useEffect handles redirect when user state updates
    } catch (err: any) {
      const msg = err.code === 'auth/email-already-in-use' ? 'This email is already registered' : err.code === 'auth/weak-password' ? 'Password is too weak' : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      // onAuthStateChanged fires → useEffect redirects to dashboard
    } catch {
      setError('Google sign-up failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex w-1/2 relative">
        <Image src={content.registerImage || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=900&q=80'} alt="Fashion" fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12">
          <Crown className="w-16 h-16 mb-6 text-rose-300" />
          <h2 className="text-4xl font-bold text-center mb-4" style={{ fontFamily: 'var(--font-playfair)' }}>Join Nilkanth Fashions</h2>
          <p className="text-white/70 text-center text-lg max-w-sm">Create your account and start your custom fashion journey</p>
          <div className="mt-8 space-y-3">
            {['Save your measurements for future orders', 'Track all your custom orders', 'Access exclusive designs', 'Receive personalized recommendations'].map(b => (
              <div key={b} className="flex items-center gap-3 text-white/80"><Check className="w-5 h-5 text-rose-300 shrink-0" />{b}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center"><Crown className="w-5 h-5 text-white" /></div>
            <span className="text-xl font-bold">Nilkanth Fashions</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-500 mb-8">Start your custom fashion journey today</p>

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-6 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />{error}
            </div>
          )}

          <button onClick={handleGoogleRegister} disabled={googleLoading} className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all mb-6 disabled:opacity-60">
            {googleLoading ? <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" /> : <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>}
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="px-4 bg-gray-50 text-gray-400 text-sm">or create with email</span></div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name" className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800 bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800 bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 8 characters" className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-300 text-gray-800 bg-white" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {['weak', 'medium', 'strong'].map((level, i) => <div key={level} className={`flex-1 h-1 rounded-full ${i <= ['weak', 'medium', 'strong'].indexOf(passwordStrength) ? strengthColors[passwordStrength] : 'bg-gray-200'}`} />)}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">{passwordStrength} password</div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required placeholder="Repeat password" className={`w-full pl-12 pr-4 py-3.5 border rounded-xl focus:outline-none focus:ring-2 text-gray-800 bg-white ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-rose-300'}`} />
                {confirmPassword && password === confirmPassword && <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />}
              </div>
            </div>

            <div className="text-xs text-gray-400 pt-1">By creating an account, you agree to our <Link href="/terms" className="text-rose-600 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-rose-600 hover:underline">Privacy Policy</Link>.</div>

            <Button type="submit" loading={loading} fullWidth size="lg">Create Account</Button>
          </form>

          <p className="mt-6 text-center text-gray-500 text-sm">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-rose-600 font-semibold hover:text-rose-700">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
