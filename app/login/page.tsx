'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Dumbbell } from 'lucide-react';
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
                throw new Error(result.error);
            }

            // Success - Redirect happens in client to avoid hydration issues, 
            // but cookie is already set by server action!
            router.push('/');
            router.refresh(); // Ensure strict refresh to pick up new cookies/headers
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-cv-bg-primary p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-cv-accent rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cv-accent/20">
                        <Dumbbell className="text-white" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-cv-text-primary text-center">
                        AI Coach
                    </h2>
                    <p className="text-cv-text-tertiary mt-2 text-center">
                        Plataforma de Programación Inteligente
                    </p>
                </div>

                <div className="cv-card shadow-xl border border-cv-bg-border/50">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm md:text-base">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-cv-text-secondary">
                                Correo Electrónico
                            </label>
                            <input
                                name="email"
                                type="email"
                                className="w-full px-4 py-3 bg-cv-bg-tertiary border border-cv-bg-border rounded-xl text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50 transition-all placeholder:text-cv-text-tertiary"
                                placeholder="coach@ejemplo.com"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-cv-text-secondary">
                                    Contraseña
                                </label>
                                <a
                                    href="/auth/forgot-password"
                                    className="text-sm text-cv-accent hover:text-cv-accent-hover transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                            <input
                                name="password"
                                type="password"
                                className="w-full px-4 py-3 bg-cv-bg-tertiary border border-cv-bg-border rounded-xl text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50 transition-all placeholder:text-cv-text-tertiary"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-cv-accent hover:bg-cv-accent-hover text-white font-semibold rounded-xl transition-all shadow-lg shadow-cv-accent/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Entrando...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>

                        <div className="text-center mt-4">
                            <p className="text-sm text-cv-text-tertiary">
                                ¿No tienes cuenta?{' '}
                                <a
                                    href="/auth/signup"
                                    className="text-cv-accent hover:text-cv-accent-hover font-medium transition-colors"
                                >
                                    Registrarse
                                </a>
                            </p>
                        </div>
                    </form>
                </div>

                <p className="text-center text-sm text-cv-text-tertiary">
                    Acceso restringido a entrenadores autorizados.
                </p>
            </div>
        </div>
    );
}
