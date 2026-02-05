'use client';

import { AppShell } from '@/components/app-shell';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, getClients } from '@/lib/actions';
import { ArrowLeft, Save, Loader2, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function NewAthletePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [gyms, setGyms] = useState<any[]>([]);

    useEffect(() => {
        // Fetch gyms for dropdown
        getClients('gym').then(data => setGyms(data || []));
    }, []);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const notes = formData.get('notes') as string;
        const gymId = formData.get('gym_id') as string;

        try {
            await createClient({
                type: 'athlete',
                name,
                email,
                gym_id: gymId === 'none' ? undefined : gymId,
                details: { notes }
            });

            router.push('/athletes');
        } catch (error) {
            console.error(error);
            alert('Error creating athlete');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AppShell title="New Athlete">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/athletes" className="cv-btn-ghost">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-cv-text-primary">Registrar Nuevo Atleta</h1>
                </div>

                <div className="cv-card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-cv-text-secondary">Nombre Completo</label>
                            <input
                                id="name"
                                name="name"
                                required
                                className="w-full h-10 px-3 rounded-md bg-cv-bg-tertiary border border-cv-border text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50"
                                placeholder="Ej. Juan Perez"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-cv-text-secondary">Email (Opcional)</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="w-full h-10 px-3 rounded-md bg-cv-bg-tertiary border border-cv-border text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50"
                                placeholder="juan@example.com"
                            />
                        </div>

                        {/* Gym Selection */}
                        <div className="space-y-2">
                            <label htmlFor="gym_id" className="text-sm font-medium text-cv-text-secondary flex items-center gap-2">
                                <Building2 size={16} />
                                Asignar a Box / Gimnasio
                            </label>
                            <select
                                id="gym_id"
                                name="gym_id"
                                className="w-full h-10 px-3 rounded-md bg-cv-bg-tertiary border border-cv-border text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50 appearance-none"
                            >
                                <option value="none">Sin asignación (Atleta Independiente)</option>
                                {gyms.map(gym => (
                                    <option key={gym.id} value={gym.id}>
                                        {gym.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-cv-text-tertiary">
                                El atleta tendrá acceso a los programas asignados a este gimnasio.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="notes" className="text-sm font-medium text-cv-text-secondary">Notas</label>
                            <textarea
                                id="notes"
                                name="notes"
                                rows={4}
                                className="w-full p-3 rounded-md bg-cv-bg-tertiary border border-cv-border text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50"
                                placeholder="Objetivos, restricciones, etc."
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="cv-btn-primary min-w-[120px]"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Guardar Atleta
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppShell>
    );
}
