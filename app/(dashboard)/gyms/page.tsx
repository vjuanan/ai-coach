// Force rebuild: unified MAS only - 2026-02-02-1115
'use client';

import { Topbar } from '@/components/app-shell/Topbar';
import { useState, useEffect } from 'react';
import { useEscapeKey } from '@/hooks/use-escape-key';
import { useRouter, useSearchParams } from 'next/navigation';
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
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedGyms, setSelectedGyms] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

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

    useEscapeKey(() => setShowAddModal(false), showAddModal);

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

    function toggleSelect(id: string) {
        setSelectedGyms(prev => {
            if (prev.includes(id)) {
                return prev.filter(p => p !== id);
            }
            return [...prev, id];
        });
    }

    async function handleBulkDelete() {
        if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedGyms.length} gimnasios seleccionados? Esta acción es irreversible.`)) return;

        setIsDeleting(true);
        try {
            await Promise.all(selectedGyms.map(id => deleteClient(id)));
            setSelectedGyms([]);
            fetchGyms();
        } catch (e) {
            console.error('Error deleting gyms:', e);
            alert('Hubo un error al eliminar algunos gimnasios');
        }
        setIsDeleting(false);
    }

    const filteredGyms = gyms.filter(g =>
        g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.details?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g as any).email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <Topbar
                title="Gimnasios"
                actions={
                    <>
                        {selectedGyms.length > 0 ? (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-cv-text-secondary mr-2">
                                    {selectedGyms.length} seleccionados
                                </span>
                                <button
                                    onClick={handleBulkDelete}
                                    className="bg-red-500/10 text-red-500 hover:bg-red-500/20 px-3 py-1.5 rounded-md flex items-center gap-2 text-sm font-medium transition-colors"
                                >
                                    <Trash2 size={16} />
                                    Eliminar Selección
                                </button>
                                <button
                                    onClick={() => setSelectedGyms([])}
                                    className="cv-btn-ghost px-3 py-1.5 text-sm"
                                >
                                    Cancelar
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="bg-slate-100 px-3 py-1.5 rounded-md flex items-center gap-2">
                                    <Building2 className="text-cv-text-secondary" size={16} />
                                    <span className="font-mono font-bold text-cv-text-primary text-sm">{filteredGyms.length}</span>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="cv-btn-primary flex items-center justify-center w-10 h-10 p-0"
                                    title="Añadir Gimnasio"
                                >
                                    <Plus size={20} />
                                </button>
                            </>
                        )}
                    </>
                }
            />
            <div className="max-w-6xl mx-auto">

                {filteredGyms.length > 0 && (
                    <div className="mb-4 flex items-center justify-end px-1">
                        <button
                            onClick={() => {
                                if (selectedGyms.length === filteredGyms.length) {
                                    setSelectedGyms([]);
                                } else {
                                    setSelectedGyms(filteredGyms.map(g => g.id));
                                }
                            }}
                            className="text-sm text-cv-text-secondary hover:text-cv-text-primary transition-colors flex items-center gap-2"
                        >
                            <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${selectedGyms.length === filteredGyms.length ? 'bg-cv-text-primary border-cv-text-primary text-white' : 'border-cv-border'}`}>
                                {selectedGyms.length === filteredGyms.length && <Plus size={10} className="transform rotate-45" />}
                            </div>
                            {selectedGyms.length === filteredGyms.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                        </button>
                    </div>
                )}

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
                        {filteredGyms.map((gym) => {
                            const isSelected = selectedGyms.includes(gym.id);
                            return (
                                <div
                                    key={gym.id}
                                    className={`cv-card group cursor-pointer transition-all relative ${isSelected ? 'ring-2 ring-cv-accent border-cv-accent' : 'hover:border-cv-accent/50'}`}
                                    onClick={() => {
                                        if (selectedGyms.length > 0) {
                                            toggleSelect(gym.id);
                                        } else {
                                            router.push(`/gyms/${gym.id}`);
                                        }
                                    }}
                                >
                                    <div className="absolute top-3 right-3 z-10">
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSelect(gym.id);
                                            }}
                                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-cv-accent border-cv-accent text-white' : 'bg-white/50 border-cv-border hover:border-cv-accent'}`}
                                        >
                                            {isSelected && <Plus size={12} className="transform rotate-45" />}
                                        </div>
                                    </div>

                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                                            <Building2 size={24} />
                                        </div>
                                    </div>
                                    <h3 className="font-semibold text-cv-text-primary">{gym.name}</h3>
                                    {(gym as any).email && (
                                        <p className="text-sm text-cv-text-tertiary flex items-center gap-1 mt-1 truncate">
                                            <Building2 size={12} className="shrink-0" />
                                            {(gym as any).email}
                                        </p>
                                    )}
                                    <div className="mt-4 pt-3 border-t border-cv-border">
                                        <span className="cv-badge bg-purple-500/15 text-purple-400">Gimnasio</span>
                                    </div>
                                </div>
                            );
                        })}
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
        </>
    );
}
