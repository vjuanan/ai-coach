'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

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
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Error al actualizar la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cv-bg-primary p-4">
                <div className="w-full max-w-md bg-cv-card border border-cv-bg-border/50 rounded-2xl shadow-xl p-8 text-center space-y-4">
                    <div className="flex justify-center">
                        <CheckCircle2 className="text-green-500 w-16 h-16" />
                    </div>
                    <h2 className="text-2xl font-bold text-cv-text-primary">
                        ¡Contraseña Actualizada!
                    </h2>
                    <p className="text-cv-text-secondary">
                        Tu contraseña ha sido restablecida correctamente. Serás redirigido al inicio de sesión en unos segundos...
                    </p>
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full py-3 px-4 bg-cv-accent hover:bg-cv-accent-hover text-white font-semibold rounded-xl transition-all shadow-lg shadow-cv-accent/20"
                    >
                        Ir al inicio de sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-cv-bg-primary p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-cv-accent rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-cv-accent/20">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-cv-text-primary text-center">
                        Nueva Contraseña
                    </h2>
                    <p className="text-cv-text-tertiary mt-2 text-center">
                        Ingresa tu nueva contraseña para acceder a tu cuenta
                    </p>
                </div>

                <div className="cv-card shadow-xl border border-cv-bg-border/50">
                    <form onSubmit={handleUpdatePassword} className="space-y-6">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm md:text-base">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-cv-text-secondary">
                                    Nueva Contraseña
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-cv-bg-tertiary border border-cv-bg-border rounded-xl text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50 transition-all placeholder:text-cv-text-tertiary pr-10"
                                        placeholder="Min. 6 caracteres"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-cv-text-tertiary hover:text-cv-text-secondary transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
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
                                    placeholder="Repite la contraseña"
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
                                    Actualizando...
                                </>
                            ) : (
                                'Actualizar Contraseña'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
