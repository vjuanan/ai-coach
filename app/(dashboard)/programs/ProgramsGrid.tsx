import { Calendar, Check, Trash2, Dumbbell, Flame, Target, Zap, Download } from 'lucide-react';
import Link from 'next/link';
// import { Program } from '@/lib/types'; // Removed to fix build error

// Note: I will define the interfaces here for now to avoid circular deps or complex refactors, 
// but ideally they should be in lib/types
interface ProgramType {
    id: string;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
    client: { id: string; name: string; type: 'athlete' | 'gym' } | null;
}

interface ProgramsGridProps {
    programs: ProgramType[];
    selectedPrograms: Set<string>;
    isSelectionMode: boolean;
    toggleSelection: (id: string) => void;
    promptDelete: (id: string) => void;
    onExport: (programId: string) => void;
    onAssign: (program: ProgramType) => void;
    CARD_GRADIENTS: string[];
    CARD_ICONS: any[];
}

export function ProgramsGrid({
    programs,
    selectedPrograms,
    isSelectionMode,
    toggleSelection,
    promptDelete,
    onExport,
    onAssign,
    CARD_GRADIENTS,
    CARD_ICONS
}: ProgramsGridProps) {

    // Helper inside component
    const getCardStyle = (index: number) => {
        const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
        const Icon = CARD_ICONS[index % CARD_ICONS.length];
        return { gradient, Icon };
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program, index) => {
                const { gradient, Icon } = getCardStyle(index);
                const createdDate = new Date(program.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });
                const updatedDate = new Date(program.updated_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short'
                });

                const isSelected = selectedPrograms.has(program.id);

                return (
                    <div
                        key={program.id}
                        onClick={() => isSelectionMode && toggleSelection(program.id)}
                        className={`
                            group relative overflow-hidden rounded-2xl
                            bg-gradient-to-br ${gradient}
                            transition-all duration-300 
                            shadow-lg hover:shadow-2xl hover:-translate-y-2
                            cursor-pointer
                            ${isSelected ? 'ring-4 ring-offset-2 ring-offset-[#0f1115] ring-cv-primary scale-[0.98]' : ''}
                        `}
                    >
                        {/* Overlay sutil para hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />

                        {/* Efecto de brillo */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Selection Checkbox */}
                        <div
                            className={`absolute top-4 right-4 z-20 transition-all duration-200 ${isSelectionMode || isSelected ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
                                }`}
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSelection(program.id);
                                }}
                                className={`
                                    group w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-all duration-200 border-2
                                    ${isSelected
                                        ? 'bg-white border-white text-cv-primary shadow-lg'
                                        : 'bg-black/10 border-white/30 text-transparent hover:bg-white hover:border-white hover:text-cv-primary'
                                    }
                                `}
                            >
                                <Check size={16} strokeWidth={3} className={`transition-opacity duration-200 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
                            </button>
                        </div>

                        <Link
                            href={isSelectionMode ? '#' : `/editor/${program.id}`}
                            onClick={(e) => isSelectionMode && e.preventDefault()}
                            className="relative z-10 block p-6"
                        >
                            {/* Header con ícono */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
                                    <Icon size={28} />
                                </div>
                            </div>

                            {/* Título */}
                            <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                                {program.name}
                            </h3>

                            {/* Información de fechas */}
                            <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
                                <Calendar size={14} />
                                <span>Creado {createdDate}</span>
                            </div>

                            {/* Footer con última actualización */}
                            <div className="pt-4 border-t border-white/20">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/70">
                                        Actualizado {updatedDate}
                                    </span>
                                    <div className="flex gap-2">
                                        {!isSelectionMode && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onExport(program.id);
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-cv-accent/80 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all duration-200"
                                                    title="Exportar"
                                                >
                                                    <Download size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        promptDelete(program.id);
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/80 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all duration-200"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        onAssign(program);
                                                    }}
                                                    className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-xs font-medium text-white flex items-center transition-all duration-200"
                                                    title="Asignar"
                                                >
                                                    {program.client ? (
                                                        <span className="truncate max-w-[80px]">{program.client.name}</span>
                                                    ) : (
                                                        "Asignar"
                                                    )}
                                                </button>
                                                <Link
                                                    href={`/editor/${program.id}`}
                                                    className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-xs font-medium text-white flex items-center transition-all duration-200"
                                                >
                                                    Editar →
                                                </Link>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                );
            })}
        </div>
    );
}
