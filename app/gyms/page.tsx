'use client';

import { AppShell } from '@/components/app-shell';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
    Plus,
    Search,
    Building2,
    Trash2,
    Loader2
} from 'lucide-react';
import {
    getClients,
    createClient,
    deleteClient
} from '@/lib/actions';

interface Gym {
    id: string;
    name: string;
    logo_url: string | null;
    details: any;
    created_at: string;
}

export default function GymsPage() {
    const [gyms, setGyms] = useState<Gym[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newGymName, setNewGymName] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchGyms();
    }, []);

    async function fetchGyms() {
        setIsLoading(true);
        const data = await getClients('gym');
        if (data) {
            setGyms(data);
        }
        setIsLoading(false);
    }

    async function addGym() {
        if (!newGymName.trim()) return;
        setIsAdding(true);

        try {
            await createClient({
                type: 'gym',
                name: newGymName,
            });

            setNewGymName('');
            setShowAddModal(false);
            fetchGyms();
        } catch (e) {
            alert('Error al añadir gimnasio');
        }
        setIsAdding(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de que quieres eliminar este gimnasio?')) return;
        await deleteClient(id);
        fetchGyms();
    }

    const filteredGyms = gyms.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AppShell title="Gimnasios">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-cv-text-primary">Gimnasios</h1>
                        <p className="text-cv-text-secondary">Gestiona tus gimnasios clientes</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="cv-btn-primary"
                    >
                        <Plus size={18} />
                        Añadir Gimnasio
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar gimnasios..."
                        className="cv-input pl-10"
                    />
                </div>

                {/* Gyms Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-cv-accent" size={32} />
                    </div>
                ) : filteredGyms.length === 0 ? (
                    <div className="text-center py-12">
                        <Building2 size={48} className="mx-auto text-cv-text-tertiary mb-4" />
                        <p className="text-cv-text-secondary">No hay gimnasios aún</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="cv-btn-primary mt-4"
                        >
                            <Plus size={18} />
                            Añade tu primer gimnasio
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {filteredGyms.map((gym) => (
                            <div key={gym.id} className="cv-card group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                                        <Building2 size={24} />
                                    </div>
                                    <button
                                        onClick={() => handleDelete(gym.id)}
                                        className="cv-btn-ghost p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-400"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <h3 className="font-semibold text-cv-text-primary">{gym.name}</h3>
                                <div className="mt-4 pt-3 border-t border-cv-border">
                                    <span className="cv-badge bg-purple-500/15 text-purple-400">Gimnasio</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Modal */}
                {showAddModal && (
                    <>
                        <div className="cv-overlay" onClick={() => setShowAddModal(false)} />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-cv-bg-secondary border border-cv-border rounded-xl p-6 z-50">
                            <h2 className="text-xl font-semibold text-cv-text-primary mb-4">Añadir Gimnasio</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Nombre del Gimnasio *</label>
                                    <input
                                        type="text"
                                        value={newGymName}
                                        onChange={(e) => setNewGymName(e.target.value)}
                                        placeholder="CrossFit Downtown"
                                        className="cv-input"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="cv-btn-secondary flex-1"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={addGym}
                                    disabled={!newGymName.trim() || isAdding}
                                    className="cv-btn-primary flex-1"
                                >
                                    {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Añadir Gimnasio
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppShell>
    );
}
