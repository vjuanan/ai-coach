'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Dumbbell, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    // Role is defaulted to 'athlete' in the database trigger if missing, 
    // but we can also be explicit here or just let the Onboarding handle the final role choice.
    // However, we MUST NOT allow 'gym' creation without onboarding.
    // So default is 'athlete'.
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
            // Check if email is already registered - call RPC directly from client
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
                        // role: 'athlete' // REMOVED: Default to NULL to force onboarding trigger
                    }
                },
            });

            if (signUpError) throw signUpError;

            // Show success message - user needs to confirm email
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
            <div className="min-h-screen flex items-center justify-center bg-cv-bg-primary p-4">
                <div className="w-full max-w-md space-y-8 text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="text-green-500" size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-cv-text-primary">
                            ¡Revisa tu Email!
                        </h2>
                        <p className="text-cv-text-tertiary mt-4 max-w-sm">
                            Te hemos enviado un correo de confirmación a <strong className="text-cv-text-primary">{email}</strong>.
                            Haz clic en el enlace para activar tu cuenta.
                        </p>
                    </div>
                    <div className="cv-card p-6 bg-cv-bg-secondary border border-cv-border">
                        <Mail className="mx-auto text-cv-accent mb-4" size={32} />
                        <p className="text-sm text-cv-text-secondary">
                            Una vez que confirmes tu email, serás redirigido automáticamente para completar tu perfil.
                        </p>
                    </div>
                    <Link href="/login" className="text-cv-accent hover:underline text-sm">
                        Volver a Iniciar Sesión
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-cv-bg-primary p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-cv-accent rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cv-accent/20">
                        <Dumbbell className="text-white" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-cv-text-primary text-center">
                        Crear Cuenta
                    </h2>
                    <p className="text-cv-text-tertiary mt-2 text-center">
                        Únete a AI Coach y potencia tus entrenamientos
                    </p>
                </div>

                <div className="cv-card shadow-xl border border-cv-bg-border/50">
                    <form onSubmit={handleSignUp} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm md:text-base">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-cv-text-secondary">
                                    Nombre Completo / Razón Social
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 py-3 bg-cv-bg-tertiary border border-cv-bg-border rounded-xl text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50 transition-all placeholder:text-cv-text-tertiary"
                                    placeholder="Ej: Juan Pérez"
                                    required
                                />
                            </div>

                            {/* Removed Role selection UI */}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-cv-text-secondary">
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-cv-bg-tertiary border border-cv-bg-border rounded-xl text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50 transition-all placeholder:text-cv-text-tertiary"
                                    placeholder="usuario@ejemplo.com"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-cv-text-secondary">
                                    Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-cv-bg-tertiary border border-cv-bg-border rounded-xl text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50 transition-all placeholder:text-cv-text-tertiary"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-cv-text-secondary">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-cv-bg-tertiary border border-cv-bg-border rounded-xl text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50 transition-all placeholder:text-cv-text-tertiary"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-cv-accent hover:bg-cv-accent-hover text-white font-semibold rounded-xl transition-all shadow-lg shadow-cv-accent/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Registrando...
                                </>
                            ) : (
                                'Registrarse'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-cv-text-tertiary">
                            ¿Ya tienes una cuenta?{' '}
                            <Link href="/login" className="text-cv-accent hover:text-cv-accent-hover font-medium">
                                Iniciar Sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
