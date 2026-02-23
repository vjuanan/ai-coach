'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Mail, CheckCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (!fullName.trim()) {
            setError('Por favor ingresa tu nombre completo');
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            setIsLoading(false);
            return;
        }

        try {
            const { data: emailExists, error: rpcError } = await supabase.rpc('check_email_exists', {
                email_input: email.toLowerCase().trim()
            });

            if (rpcError) {
                console.error('Email check RPC error:', rpcError);
                setError('Error al verificar el email. Por favor, intenta más tarde.');
                setIsLoading(false);
                return;
            }

            if (emailExists) {
                setError('Este correo electrónico ya está registrado. Por favor, inicia sesión.');
                setIsLoading(false);
                return;
            }

            const { error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `https://aicoach.epnstore.com.ar/auth/callback`,
                    data: {
                        full_name: fullName,
                    }
                },
            });

            if (signUpError) throw signUpError;

            setSuccess(true);

        } catch (err: any) {
            setError(err.message || 'Error al registrarse');
        } finally {
            setIsLoading(false);
        }
    };

    // Success state - show email confirmation message
    if (success) {
        return (
            <div className="relative min-h-screen w-full overflow-hidden font-sans flex items-center justify-center">
                {/* Video Background */}
                <div className="absolute inset-0 z-0">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        className="h-full w-full object-cover"
                        poster="/images/HeroPic.png"
                    >
                        <source src="/login-bg.mp4" type="video/mp4" />
                        <source src="https://cdn.coverr.co/videos/coverr-crossfit-rope-climb-5353/1080p.mp4" type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                </div>

                <div className="relative z-10 w-full max-w-md px-4 animate-in fade-in zoom-in-95 duration-700 slide-in-from-bottom-4">
                    <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-3xl p-8 shadow-2xl ring-1 ring-white/5 text-center space-y-6">
                        <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="text-green-400" size={40} />
                            </div>
                            <h2 className="text-3xl font-bold text-white">
                                ¡Revisa tu Email!
                            </h2>
                            <p className="text-gray-300 mt-4 max-w-sm">
                                Te hemos enviado un correo de confirmación a <strong className="text-white">{email}</strong>.
                                Haz clic en el enlace para activar tu cuenta.
                            </p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <Mail className="mx-auto text-cv-accent mb-4" size={32} />
                            <p className="text-sm text-gray-300">
                                Una vez que confirmes tu email, serás redirigido automáticamente para completar tu perfil.
                            </p>
                        </div>
                        <Link href="/login" className="text-cv-accent hover:text-emerald-300 text-sm font-medium transition-colors">
                            Volver a Iniciar Sesión
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden font-sans flex items-center justify-center">
            {/* Video Background */}
            <div className="absolute inset-0 z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    className="h-full w-full object-cover"
                    poster="/images/HeroPic.png"
                >
                    <source src="/login-bg.mp4" type="video/mp4" />
                    <source src="https://cdn.coverr.co/videos/coverr-crossfit-rope-climb-5353/1080p.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md px-4 animate-in fade-in zoom-in-95 duration-700 slide-in-from-bottom-4">

                {/* Brand */}
                <div className="flex flex-col items-center mb-8">
                    <div className="text-center space-y-1">
                        <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-lg">
                            Crear Cuenta
                        </h1>
                        <p className="text-gray-300 font-medium tracking-wide text-sm bg-white/10 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm inline-block">
                            ÚNETE A AI COACH
                        </p>
                    </div>
                </div>

                {/* Glass Card */}
                <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-3xl p-8 shadow-2xl ring-1 ring-white/5">
                    <form onSubmit={handleSignUp} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-100 animate-in fade-in slide-in-from-top-2 backdrop-blur-sm">
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider ml-1">
                                    Nombre Completo / Razón Social
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:bg-white/10 focus:border-cv-accent/50 focus:ring-1 focus:ring-cv-accent/50 transition-all duration-300"
                                    placeholder="Ej: Juan Pérez"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider ml-1">
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:bg-white/10 focus:border-cv-accent/50 focus:ring-1 focus:ring-cv-accent/50 transition-all duration-300"
                                    placeholder="usuario@ejemplo.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider ml-1">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:bg-white/10 focus:border-cv-accent/50 focus:ring-1 focus:ring-cv-accent/50 transition-all duration-300"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider ml-1">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:bg-white/10 focus:border-cv-accent/50 focus:ring-1 focus:ring-cv-accent/50 transition-all duration-300"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cv-accent to-emerald-600 p-[1px] focus:outline-none focus:ring-2 focus:ring-cv-accent focus:ring-offset-2 focus:ring-offset-gray-900"
                            >
                                <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#E2E8F0_0%,#50a773_50%,#E2E8F0_100%)] opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                                <span className="relative flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900/50 px-4 py-3.5 text-base font-bold text-white transition-all duration-200 hover:bg-transparent backdrop-blur-sm">
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={20} />
                                            REGISTRANDO...
                                        </>
                                    ) : (
                                        <>
                                            CREAR CUENTA
                                            <ChevronRight size={18} className="opacity-70 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                                {/* Shimmer Effect */}
                                {!isLoading && (
                                    <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent z-20 pointer-events-none" />
                                )}
                            </button>
                        </div>

                        <div className="text-center mt-6">
                            <p className="text-sm text-gray-400">
                                ¿Ya tienes una cuenta?{' '}
                                <Link href="/login" className="text-cv-accent hover:text-emerald-300 font-semibold transition-colors">
                                    Iniciar Sesión
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-widest opacity-60">
                        Protected by AI Coach Platform © 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
