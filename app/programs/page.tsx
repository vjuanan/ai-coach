'use client';

import { AppShell } from '@/components/app-shell';
import { GlobalCreateButton } from '@/components/app-shell/GlobalCreateButton';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

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

    // Create logic moved to GlobalCreateButton

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
        <AppShell
            title="Programas"
            actions={<GlobalCreateButton />}
        >
            <div className="max-w-6xl mx-auto">
                {/* Search removed - using global Topbar search */}

                {/* Programs List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-cv-accent" size={32} />
                    </div>
                ) : filteredPrograms.length === 0 ? (
                    <div className="text-center py-12">
                        <Dumbbell size={48} className="mx-auto text-cv-text-tertiary mb-4" />
                        <p className="text-cv-text-secondary">Aún no hay programas</p>
                        <div className="mt-4 flex justify-center">
                            <GlobalCreateButton />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredPrograms.map((program) => (
                            <Link
                                key={program.id}
                                href={`/editor/${program.id}`}
                                className="cv-card flex items-center justify-between group hover:border-cv-accent transition-all cursor-pointer block"
                            >
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
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            promptDelete(program.id);
                                        }}
                                        className="cv-btn-ghost p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors relative z-10"
                                        title="Eliminar Programa"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="cv-btn-secondary pointer-events-none">
                                        <Edit2 size={16} />
                                        Editar
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Add Modal removed - consolidated into GlobalCreateButton */}

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
