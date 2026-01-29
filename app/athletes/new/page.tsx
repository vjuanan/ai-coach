'use client';

import { AppShell } from '@/components/app-shell';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/actions'; // We'll need to export this or ensuring it's available
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewAthletePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const notes = formData.get('notes') as string;

        try {
            await createClient({
                type: 'athlete',
                name,
                email,
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
                    <h1 className="text-2xl font-bold text-cv-text-primary">Register New Athlete</h1>
                </div>

                <div className="cv-card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-cv-text-secondary">Full Name</label>
                            <input
                                id="name"
                                name="name"
                                required
                                className="w-full h-10 px-3 rounded-md bg-cv-bg-tertiary border border-cv-border text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50"
                                placeholder="e.g. Juan Perez"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-medium text-cv-text-secondary">Email (Optional)</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="w-full h-10 px-3 rounded-md bg-cv-bg-tertiary border border-cv-border text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50"
                                placeholder="juan@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="notes" className="text-sm font-medium text-cv-text-secondary">Notes</label>
                            <textarea
                                id="notes"
                                name="notes"
                                rows={4}
                                className="w-full p-3 rounded-md bg-cv-bg-tertiary border border-cv-border text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50"
                                placeholder="Goals, restrictions, etc."
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="cv-btn-primary min-w-[120px]"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Save Athlete
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppShell>
    );
}
