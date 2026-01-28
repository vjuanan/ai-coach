'use client';

import { AppShell } from '@/components/app-shell';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Search,
    Dumbbell,
    Trash2,
    Loader2,
    ArrowRight,
    Edit2,
    AlertTriangle,
    X
} from 'lucide-react';
import Link from 'next/link';
import {
    getPrograms,
    createProgram,
    deleteProgram,
    getClients
} from '@/lib/actions';

interface Program {
    id: string;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
}

interface Client {
    id: string;
    name: string;
    type: 'athlete' | 'gym';
}

export default function ProgramsPage() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Enhanced Form State
    const [formData, setFormData] = useState({
        name: '',
        clientId: '',
        focus: '',
        duration: 4,
        startDate: ''
    });

    // New State for Delete Modal
    const [programToDelete, setProgramToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const router = useRouter();

    useEffect(() => {
        fetchPrograms();
        fetchClients();
    }, []);

    async function fetchPrograms() {
        setIsLoading(true);
        const data = await getPrograms();
        if (data) setPrograms(data as any);
        setIsLoading(false);
    }

    async function fetchClients() {
        const [athletes, gyms] = await Promise.all([
            getClients('athlete'),
            getClients('gym')
        ]);
        setClients([...(athletes || []), ...(gyms || [])] as Client[]);
    }

    function resetForm() {
        setFormData({
            name: '',
            clientId: '',
            focus: '',
            duration: 4,
            startDate: ''
        });
    }

    async function handleCreateProgram() {
        if (!formData.name.trim()) return;
        setIsCreating(true);

        try {
            const program = await createProgram(
                formData.name,
                formData.clientId || null,
                formData.focus || undefined,
                formData.duration || 4
            );
            if (program) {
                resetForm();
                setShowAddModal(false);
                router.push(`/editor/${program.id}`);
            }
        } catch (e) {
            console.error('Error creating program:', e);
            alert('Error al crear el programa. Verifica tu conexión.');
            setIsCreating(false);
        }
    }

    function promptDelete(id: string) {
        setProgramToDelete(id);
    }

    async function confirmDelete() {
        if (!programToDelete) return;
        setIsDeleting(true);
        try {
            await deleteProgram(programToDelete);
            await fetchPrograms(); // Refresh list to ensure UI updates
        } catch (error) {
            console.error('Delete failed', error);
            alert('Error al eliminar el programa');
        } finally {
            setIsDeleting(false);
            setProgramToDelete(null);
        }
    }

    const filteredPrograms = programs.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AppShell title="Programas">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-cv-text-primary">Programas</h1>
                        <p className="text-cv-text-secondary">Tus programas de entrenamiento y mesociclos</p>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="cv-btn-primary"
                    >
                        <Plus size={18} />
                        Nuevo Programa
                    </button>
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-cv-text-tertiary" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar programas..."
                        className="cv-input pl-10"
                    />
                </div>

                {/* Programs List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-cv-accent" size={32} />
                    </div>
                ) : filteredPrograms.length === 0 ? (
                    <div className="text-center py-12">
                        <Dumbbell size={48} className="mx-auto text-cv-text-tertiary mb-4" />
                        <p className="text-cv-text-secondary">Aún no hay programas</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="cv-btn-primary mt-4"
                        >
                            <Plus size={18} />
                            Crea tu primer programa
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredPrograms.map((program) => (
                            <div key={program.id} className="cv-card flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-lg bg-cv-accent-muted flex items-center justify-center">
                                        <Dumbbell size={20} className="text-cv-accent" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-cv-text-primary">{program.name}</h3>
                                        <p className="text-sm text-cv-text-tertiary">
                                            Act. {new Date(program.updated_at).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`cv-badge ${program.status === 'active' ? 'cv-badge-success' : 'cv-badge-warning'}`}>
                                        {program.status}
                                    </span>
                                    <button
                                        onClick={() => promptDelete(program.id)}
                                        className="cv-btn-ghost p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                        title="Eliminar Programa"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <Link
                                        href={`/editor/${program.id}`}
                                        className="cv-btn-secondary"
                                    >
                                        <Edit2 size={16} />
                                        Editar
                                    </Link>
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
                                <h2 className="text-xl font-semibold text-cv-text-primary">Nuevo Programa</h2>
                                <button onClick={() => setShowAddModal(false)} className="cv-btn-ghost p-1">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Program Name */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Nombre del Programa *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="Ej: Winter Strength Cycle"
                                        className="cv-input"
                                        autoFocus
                                    />
                                </div>

                                {/* Assigned Client Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Asignar a (Opcional)</label>
                                    <select
                                        value={formData.clientId}
                                        onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                                        className="cv-input"
                                    >
                                        <option value="">Sin asignar</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>
                                                {client.name} ({client.type === 'athlete' ? 'Atleta' : 'Gimnasio'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Mesocycle Focus */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Enfoque del Mesociclo</label>
                                    <input
                                        type="text"
                                        value={formData.focus}
                                        onChange={(e) => setFormData(prev => ({ ...prev, focus: e.target.value }))}
                                        placeholder="Ej: Hypertrophy + Gymnastics Volume"
                                        className="cv-input"
                                    />
                                </div>

                                {/* Duration & Start Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">Duración (Semanas)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="16"
                                            value={formData.duration}
                                            onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 4 }))}
                                            className="cv-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-cv-text-secondary mb-2">Fecha de Inicio</label>
                                        <input
                                            type="date"
                                            value={formData.startDate}
                                            onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                            className="cv-input"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => { resetForm(); setShowAddModal(false); }}
                                    className="cv-btn-secondary flex-1"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateProgram}
                                    disabled={!formData.name.trim() || isCreating}
                                    className="cv-btn-primary flex-1"
                                >
                                    {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Crear Programa
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Delete Confirmation Modal */}
                {programToDelete && (
                    <>
                        <div className="cv-overlay" onClick={() => !isDeleting && setProgramToDelete(null)} />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-cv-bg-secondary border border-cv-border rounded-xl p-6 z-50 shadow-cv-lg">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-cv-text-primary">¿Eliminar programa?</h3>
                                    <p className="text-sm text-cv-text-secondary mt-1">
                                        Esta acción no se puede deshacer. Se perderán todos los datos del programa.
                                    </p>
                                </div>
                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setProgramToDelete(null)}
                                        disabled={isDeleting}
                                        className="cv-btn-secondary flex-1"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={isDeleting}
                                        className="cv-btn bg-red-500 hover:bg-red-600 text-white flex-1 transition-colors"
                                    >
                                        {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Sí, Eliminar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AppShell>
    );
}
