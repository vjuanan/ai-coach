'use client';

import { Topbar } from '@/components/app-shell/Topbar';
import { GlobalCreateButton } from '@/components/app-shell/GlobalCreateButton';
import { useState, useEffect } from 'react';
import { useEscapeKey } from '@/hooks/use-escape-key';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Dumbbell,
    Trash2,
    Loader2,
    AlertTriangle,
    Flame,
    Target,
    Zap,
    LayoutGrid,
    List
} from 'lucide-react';
import {
    getPrograms,
    deleteProgram,
    deletePrograms,
    getClients
} from '@/lib/actions';
import { ProgramsGrid } from './ProgramsGrid';
import { ProgramsTable } from './ProgramsTable';

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

// Paleta de gradientes vibrantes para las cards
const CARD_GRADIENTS = [
    'from-[#667eea] to-[#764ba2]',       // Púrpura vibrante
    'from-[#f093fb] to-[#f5576c]',       // Rosa/Fucsia
    'from-[#4facfe] to-[#00f2fe]',       // Azul cielo
    'from-[#43e97b] to-[#38f9d7]',       // Verde turquesa
    'from-[#fa709a] to-[#fee140]',       // Rosa a amarillo
    'from-[#a8edea] to-[#fed6e3]',       // Pastel suave
    'from-[#ff9a9e] to-[#fecfef]',       // Rosa pastel
    'from-[#ffecd2] to-[#fcb69f]',       // Durazno
    'from-[#667eea] to-[#f093fb]',       // Púrpura a rosa
    'from-[#5ee7df] to-[#b490ca]',       // Turquesa a lavanda
];

const CARD_ICONS = [Dumbbell, Flame, Target, Zap];

export default function ProgramsPage() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

    // View Mode State
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // State for Delete Modal
    const [programToDelete, setProgramToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // State for Multi-select
    const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set());
    const isSelectionMode = selectedPrograms.size > 0;

    useEscapeKey(() => !isDeleting && setProgramToDelete(null), !!programToDelete);

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

    function promptDelete(id: string) {
        setProgramToDelete(id);
    }

    function toggleSelection(id: string) {
        const newSelected = new Set(selectedPrograms);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedPrograms(newSelected);
    }

    function selectAll() {
        if (selectedPrograms.size === filteredPrograms.length) {
            setSelectedPrograms(new Set());
        } else {
            setSelectedPrograms(new Set(filteredPrograms.map(p => p.id)));
        }
    }

    async function confirmDelete() {
        // If we have a single program to delete (via trash icon)
        if (programToDelete && !isSelectionMode) {
            setIsDeleting(true);
            try {
                await deleteProgram(programToDelete);
                await fetchPrograms();
            } catch (error) {
                console.error('Delete failed', error);
                alert('Error al eliminar el programa');
            } finally {
                setIsDeleting(false);
                setProgramToDelete(null);
            }
            return;
        }

        // Bulk delete
        if (isSelectionMode) {
            setIsDeleting(true);
            try {
                await deletePrograms(Array.from(selectedPrograms));
                await fetchPrograms();
                setSelectedPrograms(new Set());
            } catch (error) {
                console.error('Bulk delete failed', error);
                alert('Error al eliminar los programas seleccionados');
            } finally {
                setIsDeleting(false);
            }
        }
    }

    const filteredPrograms = programs.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (

        <>
            <Topbar
                title="Programas"
                actions={
                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex items-center p-1 bg-gray-100 rounded-lg mr-2">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid'
                                    ? 'bg-white text-cv-text-primary shadow-sm'
                                    : 'text-cv-text-tertiary hover:text-cv-text-secondary'
                                    }`}
                                title="Vista Cuadrícula"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-1.5 rounded-md transition-all ${viewMode === 'table'
                                    ? 'bg-white text-cv-text-primary shadow-sm'
                                    : 'text-cv-text-tertiary hover:text-cv-text-secondary'
                                    }`}
                                title="Vista Lista"
                            >
                                <List size={18} />
                            </button>
                        </div>

                        {isSelectionMode ? (
                            <button
                                onClick={() => setProgramToDelete('BULK')} // Open confirmation modal correctly
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors flex items-center justify-center relative group"
                                title="Eliminar selección"
                            >
                                <Trash2 size={18} />
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white font-medium">
                                    {selectedPrograms.size}
                                </span>
                            </button>
                        ) : (
                            <GlobalCreateButton />
                        )}
                    </div>
                }
            />
            <div className="max-w-6xl mx-auto px-4 md:px-0">
                {/* Programs Grid/Table */}
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
                    <div className="space-y-4">
                        {/* Batch Selection Header - Only show in Grid Mode or if mostly needed, 
                            but Table handles selection internally well. 
                            Let's keep the "Select All" button specific to the view or global.
                            Actually, Table usually has a select all in the header. Grid has it here.
                        */}
                        <div className="flex justify-end mb-4 h-6">
                            {filteredPrograms.length > 0 && viewMode === 'grid' && (
                                <button
                                    onClick={selectAll}
                                    className="text-sm text-cv-text-secondary hover:text-cv-text-primary transition-colors"
                                >
                                    {selectedPrograms.size === filteredPrograms.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
                                </button>
                            )}
                        </div>

                        {viewMode === 'grid' ? (
                            <ProgramsGrid
                                programs={filteredPrograms}
                                selectedPrograms={selectedPrograms}
                                isSelectionMode={isSelectionMode}
                                toggleSelection={toggleSelection}
                                promptDelete={promptDelete}
                                CARD_GRADIENTS={CARD_GRADIENTS}
                                CARD_ICONS={CARD_ICONS}
                            />
                        ) : (
                            <ProgramsTable
                                programs={filteredPrograms}
                                selectedPrograms={selectedPrograms}
                                isSelectionMode={isSelectionMode}
                                toggleSelection={toggleSelection}
                                selectAll={selectAll}
                                totalFiltered={filteredPrograms.length}
                                promptDelete={promptDelete}
                                CARD_GRADIENTS={CARD_GRADIENTS}
                                CARD_ICONS={CARD_ICONS}
                            />
                        )}

                        {/* Delete Confirmation Modal */}
                        {(programToDelete || (isDeleting && isSelectionMode)) && (
                            <>
                                <div className="cv-overlay" onClick={() => !isDeleting && setProgramToDelete(null)} />
                                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-cv-bg-secondary border border-cv-border rounded-xl p-6 z-50 shadow-cv-lg">
                                    <div className="flex flex-col items-center text-center space-y-4">
                                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                                            <AlertTriangle size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-cv-text-primary">
                                                {isSelectionMode ? `¿Eliminar ${selectedPrograms.size} programas?` : '¿Eliminar programa?'}
                                            </h3>
                                            <p className="text-sm text-cv-text-secondary mt-1">
                                                Esta acción no se puede deshacer. Se perderán todos los datos.
                                            </p>
                                        </div>
                                        <div className="flex gap-3 w-full mt-2">
                                            <button
                                                onClick={() => {
                                                    setProgramToDelete(null);
                                                    setIsDeleting(false);
                                                }}
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
                )}
            </div>
        </>
    );
}
