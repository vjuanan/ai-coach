// Force rebuild - deployment sync 2026-01-30
'use client';

import { AppShell } from '@/components/app-shell';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    // Enhanced Gym Form State
    const [formData, setFormData] = useState({
        name: '',
        ownerName: '',
        location: '',
        memberCount: '',
        equipment: {
            rig: false,
            sleds: false,
            skiErgs: false,
            assaultBikes: false,
            rowers: false,
            pool: false
        }
    });
    const [isAdding, setIsAdding] = useState(false);

    const router = useRouter();

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
        if (!formData.name.trim()) return;
        setIsAdding(true);

        try {
            await createClient({
                type: 'gym',
                name: formData.name,
                details: {
                    ownerName: formData.ownerName,
                    location: formData.location,
                    memberCount: formData.memberCount ? parseInt(formData.memberCount) : null,
                    equipment: formData.equipment
                }
            });

            setFormData({
                name: '',
                ownerName: '',
                location: '',
                memberCount: '',
                equipment: {
                    rig: false,
                    sleds: false,
                    skiErgs: false,
                    assaultBikes: false,
                    rowers: false,
                    pool: false
                }
            });
            setShowAddModal(false);
            fetchGyms();
        } catch (e) {
            alert('Error al añadir gimnasio');
        }
        setIsAdding(false);
    }

    async function handleDelete(e: React.MouseEvent, id: string) {
        e.stopPropagation(); // Prevent navigation when clicking delete
        if (!confirm('¿Estás seguro de que quieres eliminar este gimnasio?')) return;
        await deleteClient(id);
        fetchGyms();
    }

    const filteredGyms = gyms.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AppShell
            title="Gimnasios"
            actions={
                <button
                    onClick={() => setShowAddModal(true)}
                    className="cv-btn-primary"
                >
                    <Plus size={18} />
                    Añadir Gimnasio
                </button>
            }
        >
            <div className="max-w-6xl mx-auto">
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
                            <div
                                key={gym.id}
                                className="cv-card group cursor-pointer hover:border-cv-accent/50 transition-all"
                                onClick={() => router.push(`/gyms/${gym.id}`)}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                                        <Building2 size={24} />
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(e, gym.id)}
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
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-cv-bg-secondary border border-cv-border rounded-lg p-6 z-50 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-cv-text-primary">Nuevo Gimnasio / Cliente B2B</h2>
                                <button onClick={() => setShowAddModal(false)} className="cv-btn-ghost p-1">
                                    <Trash2 size={18} className="text-cv-text-tertiary" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Gym Info */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Nombre del Gimnasio *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="CrossFit Downtown"
                                        className="cv-input"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Ubicación</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                                        placeholder="Madrid, España"
                                        className="cv-input"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">Propietario / Contacto</label>
                                        <input
                                            type="text"
                                            value={formData.ownerName}
                                            onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                                            placeholder="Juan Pérez"
                                            className="cv-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">Miembros (aprox)</label>
                                        <input
                                            type="number"
                                            value={formData.memberCount}
                                            onChange={(e) => setFormData(prev => ({ ...prev, memberCount: e.target.value }))}
                                            placeholder="150"
                                            className="cv-input"
                                        />
                                    </div>
                                </div>

                                {/* Equipment Config */}
                                <div className="border-t border-cv-border pt-4 mt-4">
                                    <label className="block text-sm font-medium text-cv-text-primary mb-3">Equipamiento Disponible</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: 'rig', label: 'Rack / Estructura' },
                                            { key: 'sleds', label: 'Trineos / Prowlers' },
                                            { key: 'skiErgs', label: 'SkiErgs' },
                                            { key: 'assaultBikes', label: 'Assault Bikes / Echo' },
                                            { key: 'rowers', label: 'Remos (C2)' },
                                            { key: 'pool', label: 'Piscina' }
                                        ].map((item) => (
                                            <label key={item.key} className="flex items-center gap-2 p-2 rounded-md bg-cv-bg-tertiary border border-cv-border cursor-pointer hover:bg-slate-700/50 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.equipment[item.key as keyof typeof formData.equipment]}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        equipment: { ...prev.equipment, [item.key]: e.target.checked }
                                                    }))}
                                                    className="w-4 h-4 rounded border-cv-border text-cv-accent focus:ring-cv-accent bg-transparent"
                                                />
                                                <span className="text-sm text-cv-text-secondary">{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
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
                                    disabled={!formData.name.trim() || isAdding}
                                    className="cv-btn-primary flex-1"
                                >
                                    {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Guardar Gimnasio
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppShell>
    );
}
