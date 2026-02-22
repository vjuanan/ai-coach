'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Dumbbell, AlertCircle, ChevronRight } from 'lucide-react';
import { login } from '@/app/auth/actions';



export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);

        try {
            const result = await login(formData);

            if (result.error) {
                if (result.error.includes('Invalid login credentials')) {
                    throw new Error('Credenciales incorrectas. Verifique su correo y clave.');
                }
                throw new Error(result.error);
            }

            if (result.needsOnboarding) {
                router.push('/onboarding');
            } else {
                router.push('/');
            }
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
            setIsLoading(false);
        }
    };

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
                    {/* Primary: Local Video (User should upload this) */}
                    <source src="/login-bg.mp4" type="video/mp4" />
                    {/* Fallback: Reliable placeholder if local file is missing */}
                    <source src="https://cdn.coverr.co/videos/coverr-crossfit-rope-climb-5353/1080p.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-md px-4 animate-in fade-in zoom-in-95 duration-700 slide-in-from-bottom-4">

                {/* Logo & Brand */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cv-accent to-emerald-500 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-20 h-20 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl ring-1 ring-white/20">
                            <img
                                src="/images/logo-white.png"
                                alt="AI Coach Logo"
                                className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                            />
                        </div>
                    </div>
                    <div className="mt-6 text-center space-y-1">
                        <h1 className="text-4xl font-bold text-white tracking-tight drop-shadow-lg">
                            AI Coach
                        </h1>
                        <p className="text-gray-300 font-medium tracking-wide text-sm bg-white/10 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm inline-block">
                            PLATAFORMA DE ÉLITE
                        </p>
                    </div>
                </div>

                {/* Glass Card */}
                <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-3xl p-8 shadow-2xl ring-1 ring-white/5">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-100 animate-in fade-in slide-in-from-top-2 backdrop-blur-sm">
                                <AlertCircle size={20} className="shrink-0 text-red-400" />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider ml-1">
                                    Correo Electrónico
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:bg-white/10 focus:border-cv-accent/50 focus:ring-1 focus:ring-cv-accent/50 transition-all duration-300"
                                    placeholder="coach@ejemplo.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center ml-1">
                                    <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                                        Contraseña
                                    </label>
                                    <a
                                        href="/auth/forgot-password"
                                        className="text-xs text-cv-accent hover:text-emerald-300 transition-colors font-medium"
                                    >
                                        Recuperar acceso
                                    </a>
                                </div>
                                <input
                                    name="password"
                                    type="password"
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
                                            AUTENTICANDO...
                                        </>
                                    ) : (
                                        <>
                                            INGRESAR AL SISTEMA
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
                                ¿Nuevo?{' '}
                                <a
                                    href="/auth/signup"
                                    className="text-cv-accent hover:text-emerald-300 font-semibold transition-colors"
                                >
                                    Registrate
                                </a>
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
        </div >
    );
}


