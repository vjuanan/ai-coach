'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Dumbbell, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
            });

            if (error) throw error;

            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Error al enviar el correo de recuperación');
        } finally {
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
                        Recuperar Contraseña
                    </h2>
                    <p className="text-cv-text-tertiary mt-2 text-center">
                        Te enviaremos un enlace para restablecerla
                    </p>
                </div>

                <div className="cv-card shadow-xl border border-cv-bg-border/50">
                    {success ? (
                        <div className="text-center space-y-4 py-4">
                            <div className="flex justify-center">
                                <CheckCircle2 className="text-green-500 w-16 h-16" />
                            </div>
                            <h3 className="text-xl font-semibold text-cv-text-primary">
                                ¡Correo enviado!
                            </h3>
                            <p className="text-cv-text-secondary">
                                Revisa tu bandeja de entrada en <strong>{email}</strong> para continuar con el proceso.
                            </p>
                            <Link
                                href="/login"
                                className="inline-block mt-4 text-cv-accent hover:text-cv-accent-hover font-medium transition-colors"
                            >
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
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
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-cv-bg-tertiary border border-cv-bg-border rounded-xl text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50 transition-all placeholder:text-cv-text-tertiary"
                                    placeholder="coach@ejemplo.com"
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
                                        Enviando...
                                    </>
                                ) : (
                                    'Enviar enlace'
                                )}
                            </button>

                            <div className="text-center pt-2">
                                <Link
                                    href="/login"
                                    className="inline-flex items-center text-sm text-cv-text-secondary hover:text-cv-text-primary transition-colors"
                                >
                                    <ArrowLeft size={16} className="mr-1" />
                                    Volver al inicio de sesión
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
