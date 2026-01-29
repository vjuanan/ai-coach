'use client';

import { AppShell } from '@/components/app-shell';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/actions';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewGymPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const location = formData.get('location') as string;

        try {
            await createClient({
                type: 'gym',
                name,
                details: { location }
            });

            router.push('/gyms'); // Assuming this route exists or we'll default to home/gyms view
        } catch (error) {
            console.error(error);
            alert('Error creating gym');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <AppShell title="New Gym">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/" className="cv-btn-ghost">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-cv-text-primary">Register New Gym</h1>
                </div>

                <div className="cv-card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-medium text-cv-text-secondary">Gym Name</label>
                            <input
                                id="name"
                                name="name"
                                required
                                className="w-full h-10 px-3 rounded-md bg-cv-bg-tertiary border border-cv-border text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50"
                                placeholder="e.g. Iron Paradise"
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="location" className="text-sm font-medium text-cv-text-secondary">Location</label>
                            <input
                                id="location"
                                name="location"
                                className="w-full h-10 px-3 rounded-md bg-cv-bg-tertiary border border-cv-border text-cv-text-primary focus:outline-none focus:ring-2 focus:ring-cv-accent/50"
                                placeholder="City or Address"
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="cv-btn-primary min-w-[120px]"
                            >
                                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                Save Gym
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppShell>
    );
}
