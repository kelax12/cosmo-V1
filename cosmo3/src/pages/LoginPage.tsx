import React, { useState, useCallback, memo } from 'react';
import { useAuth } from '@/features/auth';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Play, LogIn, Mail } from 'lucide-react';

// Google Icon SVG component
const GoogleIcon = memo(() => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
));
GoogleIcon.displayName = 'GoogleIcon';

// Input component réutilisable
interface InputFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  testId: string;
  required?: boolean;
}

const InputField = memo<InputFieldProps>(({ label, type, value, onChange, placeholder, testId, required = true }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
      placeholder={placeholder}
      required={required}
      data-testid={testId}
    />
  </div>
));
InputField.displayName = 'InputField';

// Divider component
const Divider = memo<{ text: string }>(({ text }) => (
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-slate-700"></div>
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="px-4 bg-slate-900 text-slate-500">{text}</span>
    </div>
  </div>
));
Divider.displayName = 'Divider';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginAsDemo, loginWithGoogle, isSupabaseConfigured } = useAuth();
  const navigate = useNavigate();

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { success, error } = await login(email, password);
      if (!success) {
        toast.error(error || 'Erreur lors de la connexion');
      } else {
        toast.success('Connexion réussie !');
        navigate('/dashboard');
      }
    } catch {
      toast.error('Une erreur inattendue est survenue');
    } finally {
      setLoading(false);
    }
  }, [email, password, login, navigate]);

  const handleDemoLogin = useCallback(() => {
    loginAsDemo();
    toast.success('Bienvenue en mode Demo !');
    navigate('/dashboard');
  }, [loginAsDemo, navigate]);

  const handleGoogleLogin = useCallback(async () => {
    if (!isSupabaseConfigured) {
      toast.error('Configurez Supabase pour utiliser Google');
      return;
    }
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      toast.error('Erreur lors de la connexion Google');
      setGoogleLoading(false);
    }
  }, [isSupabaseConfigured, loginWithGoogle]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" data-testid="login-page">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Bon retour</h1>
        <p className="text-slate-400 text-center mb-8">Connectez-vous à votre espace Cosmo</p>
        
        {/* Demo Mode Button */}
        <button
          onClick={handleDemoLogin}
          className="w-full mb-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
          data-testid="demo-login-button"
        >
          <Play size={20} />
          Essayer en mode Demo
        </button>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading || !isSupabaseConfigured}
          className="w-full mb-4 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="google-login-button"
        >
          <GoogleIcon />
          {googleLoading ? 'Connexion...' : 'Continuer avec Google'}
        </button>

        {!isSupabaseConfigured && (
          <div className="mb-4 p-3 bg-amber-900/20 border border-amber-700/50 rounded-xl">
            <p className="text-amber-300 text-xs text-center">
              ⚠️ Supabase non configuré. Mode Demo disponible.
            </p>
          </div>
        )}

        <Divider text="ou avec email" />
        
        <form onSubmit={handleLogin} className="space-y-4" data-testid="login-form">
          <InputField
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="votre@email.com"
            testId="login-email-input"
          />
          <InputField
            label="Mot de passe"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            testId="login-password-input"
          />
          
          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            data-testid="login-submit-button"
          >
            <LogIn size={20} />
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-slate-400 text-sm">
          Pas encore de compte ?{' '}
          <Link to="/signup" className="text-blue-400 hover:text-blue-300 font-medium" data-testid="login-signup-link">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
};

export default memo(LoginPage);
