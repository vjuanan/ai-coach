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
    List,
    Download
} from 'lucide-react';
import {
    getPrograms,
    deleteProgram,
    deletePrograms,
    getClients
} from '@/lib/actions';
import { ProgramsGrid } from './ProgramsGrid';
import { ProgramsTable } from './ProgramsTable';
import { ProgramAssignmentModal } from '@/components/programs/ProgramAssignmentModal';
import { ProgramCardExporter } from '@/components/export/ProgramCardExporter';

interface Program {
    id: string;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
    client: { id: string; name: string; type: 'athlete' | 'gym' } | null;
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

    // State for Export
    const [exportPrograms, setExportPrograms] = useState<Program[]>([]);
    const [isExportOpen, setIsExportOpen] = useState(false);

    // State for Assignment Modal
    const [programToAssign, setProgramToAssign] = useState<Program | null>(null);

    useEscapeKey(() => {
        if (!isDeleting && !programToAssign) {
            setProgramToAssign(null);
            setProgramToDelete(null);
        }
    }, !!programToAssign || !!programToDelete);

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

    // Export handler - single program
    function handleExport(programId: string) {
        const program = programs.find(p => p.id === programId);
        if (program) {
            setExportPrograms([program]);
            setIsExportOpen(true);
        }
    }

    // Export handler - bulk (selected programs) - limit to 10
    function handleBulkExport() {
        if (selectedPrograms.size > 10) {
            alert('Solo puedes exportar hasta 10 programas a la vez.');
            return;
        }
        const toExport = programs.filter(p => selectedPrograms.has(p.id));
        if (toExport.length > 0) {
            setExportPrograms(toExport);
            setIsExportOpen(true);
        }
    }

    async function confirmDelete() {
        // If we have a single program to delete (via trash icon)
        if (programToDelete && !isSelectionMode) {
            setIsDeleting(true);
            try {
                const result = await deleteProgram(programToDelete);
                if (!result.success) {
                    console.error('Delete failed:', result.error);
                    alert(`Error al eliminar el programa: ${result.error}`);
                } else {
                    await fetchPrograms();
                }
            } catch (error: any) {
                console.error('Delete unexpected error', error);
                alert(`Error al eliminar el programa: ${error.message || 'Error de red'}`);
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
                const result = await deletePrograms(Array.from(selectedPrograms));
                if (!result.success) {
                    console.error('Bulk delete failed:', result.error);
                    alert(`Error al eliminar los programas: ${result.error}`);
                } else {
                    await fetchPrograms();
                    setSelectedPrograms(new Set());
                }
            } catch (error: any) {
                console.error('Bulk delete unexpected error', error);
                alert(`Error al eliminar los programas: ${error.message || 'Error de red'}`);
            } finally {
                setIsDeleting(false);
            }
        }
    }

    const filteredPrograms = programs.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    function handleAssign(program: Program) {
        setProgramToAssign(program);
    }

    async function handleAssignmentSuccess(clientId: string | null, clientName: string | null, clientType: 'athlete' | 'gym' | null) {
        console.log('Assignment Success (Optimistic):', { clientId, clientName, clientType, programToAssign });

        // Optimistic update: immediately update the programs state locally
        if (programToAssign) {
            setPrograms(prev => prev.map(p => {
                if (p.id === programToAssign.id) {
                    return {
                        ...p,
                        client: clientId ? { id: clientId, name: clientName || '', type: clientType || 'athlete' } : null
                    };
                }
                return p;
            }));
        }
        setProgramToAssign(null);
        // Background refresh to sync with server
        fetchPrograms();
    }

    return (

        <>
            <Topbar
                title="Programas (v2)"
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
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleBulkExport}
                                    className="p-2 bg-orange-50 hover:bg-orange-100 text-cv-accent rounded-lg transition-colors flex items-center justify-center relative group"
                                    title="Exportar selección"
                                >
                                    <Download size={18} />
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cv-accent text-[10px] text-white font-medium">
                                        {selectedPrograms.size}
                                    </span>
                                </button>
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
                            </div>
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
                                onExport={handleExport}
                                onAssign={handleAssign}
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
                                onExport={handleExport}
                                onAssign={handleAssign}
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

            {/* Export Modal */}
            <ProgramCardExporter
                isOpen={isExportOpen}
                onClose={() => {
                    setIsExportOpen(false);
                    setExportPrograms([]);
                }}
                programs={exportPrograms}
            />

            {/* Assignment Modal */}
            {programToAssign && (
                <ProgramAssignmentModal
                    isOpen={!!programToAssign}
                    onClose={() => setProgramToAssign(null)}
                    programId={programToAssign.id}
                    currentClientId={programToAssign.client ? programToAssign.client.id : null}
                    initialClientType={programToAssign.client ? programToAssign.client.type : null}
                    onAssignSuccess={handleAssignmentSuccess}
                />
            )}
        </>
    );
}
// force deploy
