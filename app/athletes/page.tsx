'use client';

import { AppShell } from '@/components/app-shell';
import { useState, useEffect } from 'react';
import { useEscapeKey } from '@/hooks/use-escape-key';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    getClients,
    createClient,
    deleteClient
} from '@/lib/actions';
import {
    Plus,
    Search,
    MoreHorizontal,
    Mail,
    Phone,
    Edit2,
    Trash2,
    User,
    Loader2,
    AlertTriangle,
    X
} from 'lucide-react';

interface Athlete {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    details: any;
    created_at: string;
}

export default function AthletesPage() {
    const [athletes, setAthletes] = useState<Athlete[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

    const [showAddModal, setShowAddModal] = useState(false);

    // Enhanced Form State with Full Athlete Profile
    const [formData, setFormData] = useState({
        type: 'athlete' as 'athlete' | 'gym',
        name: '',
        email: '',
        dob: '',
        height: '',
        weight: '',
        gender: 'male' as 'male' | 'female' | 'other',
        level: 'RX',
        goal: '',
        injuries: '',
        // Benchmarks (1RM in kg)
        snatch: '',
        cnj: '',
        backSquat: '',
        deadlift: '',
        frontSquat: '',
        cleanPull: '',
        franTime: ''  // in seconds
    });
    const [isAdding, setIsAdding] = useState(false);

    // Alert Modal State
    const [athleteToDelete, setAthleteToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEscapeKey(() => setShowAddModal(false), showAddModal);
    useEscapeKey(() => !isDeleting && setAthleteToDelete(null), !!athleteToDelete);

    useEffect(() => {
        fetchAthletes();
    }, []);

    async function fetchAthletes() {
        setIsLoading(true);
        const data = await getClients('athlete');
        if (data) setAthletes(data);
        setIsLoading(false);
    }

    function resetForm() {
        setFormData({
            type: 'athlete',
            name: '',
            email: '',
            dob: '',
            height: '',
            weight: '',
            gender: 'male',
            level: 'RX',
            goal: '',
            injuries: '',
            snatch: '',
            cnj: '',
            backSquat: '',
            deadlift: '',
            frontSquat: '',
            cleanPull: '',
            franTime: ''
        });
    }

    async function addAthlete() {
        if (!formData.name.trim()) return;
        setIsAdding(true);

        try {
            const details = {
                // Physical Profile
                dob: formData.dob || null,
                height: formData.height ? parseInt(formData.height) : null,
                weight: formData.weight ? parseInt(formData.weight) : null,
                gender: formData.gender,
                // Training
                level: formData.level,
                goal: formData.goal,
                injuries: formData.injuries,
                // Benchmarks (1RM in kg)
                oneRmStats: {
                    snatch: formData.snatch ? parseInt(formData.snatch) : null,
                    cnj: formData.cnj ? parseInt(formData.cnj) : null,
                    backSquat: formData.backSquat ? parseInt(formData.backSquat) : null,
                    deadlift: formData.deadlift ? parseInt(formData.deadlift) : null,
                    frontSquat: formData.frontSquat ? parseInt(formData.frontSquat) : null,
                    cleanPull: formData.cleanPull ? parseInt(formData.cleanPull) : null
                },
                // Metcon Benchmarks
                franTime: formData.franTime ? parseInt(formData.franTime) : null  // seconds
            };

            await createClient({
                type: formData.type,
                name: formData.name,
                email: formData.email || undefined,
                details
            });

            resetForm();
            setShowAddModal(false);
            fetchAthletes();
        } catch (e) {
            console.error('Error adding athlete:', e);
            alert('Error al añadir atleta. Verifica tu conexión.');
        }
        setIsAdding(false);
    }

    function promptDelete(e: React.MouseEvent, id: string) {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();
        setAthleteToDelete(id);
    }

    async function confirmDelete() {
        if (!athleteToDelete) return;
        setIsDeleting(true);
        try {
            await deleteClient(athleteToDelete);
            await fetchAthletes();
        } catch (e) {
            console.error(e);
            alert('Error al eliminar atleta');
        } finally {
            setIsDeleting(false);
            setAthleteToDelete(null);
        }
    }

    const filteredAthletes = athletes.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AppShell
            title="Atletas"
            prefixActions={
                <button
                    onClick={() => setShowAddModal(true)}
                    className="cv-btn-secondary p-1.5 h-9 w-9 flex items-center justify-center bg-transparent border-0 ring-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Añadir Atleta"
                >
                    <Plus size={20} className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors" />
                </button>
            }
        >
            <div className="max-w-6xl mx-auto">
                {/* Search removed - using global Topbar search */}

                {/* Athletes Grid */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-cv-accent" size={32} />
                    </div>
                ) : filteredAthletes.length === 0 ? (
                    <div className="text-center py-12">
                        <User size={48} className="mx-auto text-cv-text-tertiary mb-4" />
                        <p className="text-cv-text-secondary">No hay atletas aún</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="cv-btn-primary mt-4"
                        >
                            <Plus size={18} />
                            Añade tu primer atleta
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {filteredAthletes.map((athlete) => (
                            <Link
                                key={athlete.id}
                                href={`/athletes/${athlete.id}`}
                                className="cv-card group relative block hover:border-cv-accent/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-12 h-12 rounded-full bg-cv-accent-muted flex items-center justify-center text-cv-accent font-bold text-lg">
                                        {athlete.name.charAt(0).toUpperCase()}
                                    </div>
                                    <button
                                        onClick={(e) => promptDelete(e, athlete.id)}
                                        className="cv-btn-ghost p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:bg-red-500/10 z-10 relative"
                                        title="Eliminar Atleta"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <h3 className="font-semibold text-cv-text-primary">{athlete.name}</h3>
                                {athlete.email && (
                                    <p className="text-sm text-cv-text-tertiary flex items-center gap-1 mt-1">
                                        <Mail size={12} />
                                        {athlete.email}
                                    </p>
                                )}
                                <div className="mt-4 pt-3 border-t border-cv-border">
                                    <span className="cv-badge-accent">Atleta</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Add Modal */}
                {showAddModal && (
                    <>
                        <div className="cv-overlay" onClick={() => setShowAddModal(false)} />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-cv-bg-secondary border border-cv-border rounded-lg p-6 z-50 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-cv-text-primary">Nuevo Atleta / Cliente</h2>
                                <button onClick={() => setShowAddModal(false)} className="cv-btn-ghost p-1">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Type Toggle */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Tipo</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, type: 'athlete' }))}
                                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${formData.type === 'athlete' ? 'bg-cv-accent text-slate-900' : 'bg-cv-bg-tertiary text-cv-text-secondary'}`}
                                        >
                                            Atleta Individual
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, type: 'gym' }))}
                                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${formData.type === 'gym' ? 'bg-cv-accent text-slate-900' : 'bg-cv-bg-tertiary text-cv-text-secondary'}`}
                                        >
                                            Gimnasio / Box
                                        </button>
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Nombre *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="John Doe"
                                        className="cv-input"
                                        autoFocus
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Correo</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        placeholder="john@example.com"
                                        className="cv-input"
                                    />
                                </div>

                                {/* Physical Profile Section */}
                                <div className="border-t border-cv-border pt-4 mt-4">
                                    <label className="block text-sm font-medium text-cv-text-primary mb-3">Perfil Físico</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs text-cv-text-tertiary mb-1">Fecha Nac.</label>
                                            <input
                                                type="date"
                                                value={formData.dob}
                                                onChange={(e) => setFormData(prev => ({ ...prev, dob: e.target.value }))}
                                                className="cv-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-cv-text-tertiary mb-1">Género</label>
                                            <select
                                                value={formData.gender}
                                                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value as any }))}
                                                className="cv-input"
                                            >
                                                <option value="male">Masculino</option>
                                                <option value="female">Femenino</option>
                                                <option value="other">Otro</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-cv-text-tertiary mb-1">Altura (cm)</label>
                                            <input
                                                type="number"
                                                value={formData.height}
                                                onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                                                placeholder="175"
                                                className="cv-input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-cv-text-tertiary mb-1">Peso (kg)</label>
                                            <input
                                                type="number"
                                                value={formData.weight}
                                                onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                                                placeholder="75"
                                                className="cv-input"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Level Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Nivel</label>
                                    <select
                                        value={formData.level}
                                        onChange={(e) => setFormData(prev => ({ ...prev, level: e.target.value }))}
                                        className="cv-input"
                                    >
                                        <option value="Scaled">Scaled</option>
                                        <option value="RX">RX</option>
                                        <option value="Elite">Elite</option>
                                        <option value="Master">Master</option>
                                    </select>
                                </div>

                                {/* Goal */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Objetivo Principal</label>
                                    <input
                                        type="text"
                                        value={formData.goal}
                                        onChange={(e) => setFormData(prev => ({ ...prev, goal: e.target.value }))}
                                        placeholder="Ej: Competition Prep, Strength Bias..."
                                        className="cv-input"
                                    />
                                </div>

                                {/* Injuries/Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-cv-text-secondary mb-2">Lesiones / Limitaciones</label>
                                    <textarea
                                        value={formData.injuries}
                                        onChange={(e) => setFormData(prev => ({ ...prev, injuries: e.target.value }))}
                                        placeholder="Ej: Shoulder impingement, bajo movilidad de tobillo..."
                                        rows={2}
                                        className="cv-input resize-none"
                                    />
                                </div>

                                {/* Benchmarks Section */}
                                <div className="border-t border-cv-border pt-4 mt-4">
                                    <label className="block text-sm font-medium text-cv-text-primary mb-3">Benchmarks (1RM en kg)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input
                                            type="number"
                                            value={formData.snatch}
                                            onChange={(e) => setFormData(prev => ({ ...prev, snatch: e.target.value }))}
                                            placeholder="Snatch"
                                            className="cv-input text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={formData.cnj}
                                            onChange={(e) => setFormData(prev => ({ ...prev, cnj: e.target.value }))}
                                            placeholder="C&J"
                                            className="cv-input text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={formData.backSquat}
                                            onChange={(e) => setFormData(prev => ({ ...prev, backSquat: e.target.value }))}
                                            placeholder="Back Squat"
                                            className="cv-input text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={formData.frontSquat}
                                            onChange={(e) => setFormData(prev => ({ ...prev, frontSquat: e.target.value }))}
                                            placeholder="Front Squat"
                                            className="cv-input text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={formData.deadlift}
                                            onChange={(e) => setFormData(prev => ({ ...prev, deadlift: e.target.value }))}
                                            placeholder="Deadlift"
                                            className="cv-input text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={formData.cleanPull}
                                            onChange={(e) => setFormData(prev => ({ ...prev, cleanPull: e.target.value }))}
                                            placeholder="Clean Pull"
                                            className="cv-input text-sm"
                                        />
                                    </div>
                                    <div className="mt-2">
                                        <label className="block text-xs text-cv-text-tertiary mb-1">Fran Time (segundos)</label>
                                        <input
                                            type="number"
                                            value={formData.franTime}
                                            onChange={(e) => setFormData(prev => ({ ...prev, franTime: e.target.value }))}
                                            placeholder="Ej: 180 (= 3:00)"
                                            className="cv-input text-sm"
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
                                    onClick={addAthlete}
                                    disabled={!formData.name.trim() || isAdding}
                                    className="cv-btn-primary flex-1"
                                >
                                    {isAdding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Delete Confirmation Modal */}
                {athleteToDelete && (
                    <>
                        <div className="cv-overlay" onClick={() => !isDeleting && setAthleteToDelete(null)} />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-cv-bg-secondary border border-cv-border rounded-xl p-6 z-50 shadow-cv-lg">
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-cv-text-primary">¿Eliminar atleta?</h3>
                                    <p className="text-sm text-cv-text-secondary mt-1">
                                        Se eliminará al atleta y todo su historial de asignaciones.
                                    </p>
                                </div>
                                <div className="flex gap-3 w-full mt-2">
                                    <button
                                        onClick={() => setAthleteToDelete(null)}
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
