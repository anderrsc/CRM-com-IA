import React, { useState } from 'react';
import { Eye, EyeOff, LogIn, AlertCircle, Sparkles, Shield, Zap, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useStore } from '../store/useStore';

export const Login: React.FC = () => {
  const { login } = useStore();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(loginId, password);
      if (!success) {
        setError('Login ou senha incorretos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Sparkles, text: 'IA para atendimento automatico' },
    { icon: Users, text: 'CRM completo e intuitivo' },
    { icon: Zap, text: 'Automacao de processos' },
    { icon: Shield, text: 'Seguranca e controle de acesso' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-red-500/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

        <div className="relative flex w-full flex-col justify-center items-center px-12 py-10 text-white">
          <div className="mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 via-red-500 to-red-500 rounded-lg flex items-center justify-center shadow-2xl shadow-red-500/30 animate-float">
              <span className="text-4xl font-bold">M</span>
            </div>
          </div>

          <h1 className="text-4xl font-bold mb-3 text-center">
            <span className="bg-gradient-to-r from-white via-red-200 to-red-200 bg-clip-text text-transparent">
              Marquinhos OS
            </span>
          </h1>
          <p className="text-lg leading-relaxed text-slate-300 mb-8 text-center max-w-lg">
            Sistema Inteligente de Gestao para Esquadrias, Aluminio, Vidros e Calhas
          </p>

          <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
            {features.map((feature, index) => (
              <div
                key={feature.text}
                className="flex min-h-16 items-center gap-3 p-3.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm animate-slideInUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="p-2 bg-gradient-to-br from-red-500/20 to-red-500/20 rounded-lg">
                  <feature.icon size={20} className="text-red-400" />
                </div>
                <span className="text-sm leading-snug text-slate-300">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-5 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 via-red-500 to-red-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-500/30">
              <span className="text-white text-3xl font-bold">M</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Marquinhos OS</h1>
            <p className="text-slate-400 text-sm">Sistema Inteligente de Gestao</p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl rounded-lg p-6 sm:p-7 border border-slate-700/50 shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta!</h2>
              <p className="text-slate-400">Entre com seu login e senha</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm animate-scaleIn">
                  <AlertCircle size={18} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Login
                </label>
                <input
                  type="text"
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  placeholder="Seu login"
                  required
                  className="h-11 w-full px-3.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="********"
                    required
                    className="h-11 w-full px-3.5 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                icon={<LogIn size={18} />}
                variant="gradient"
                fullWidth
                size="lg"
              >
                Entrar no Sistema
              </Button>
            </form>
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            (c) 2026 Marquinhos OS - Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
};
