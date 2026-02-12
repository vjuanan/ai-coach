import { Calendar, Check, Trash2, Edit2, MoreHorizontal, Square, CheckSquare, Download } from 'lucide-react';
import Link from 'next/link';

// Helper for formatted dates
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

interface ProgramType {
    id: string;
    name: string;
    status: string;
    created_at: string;
    updated_at: string;
    client: { id: string; name: string; type: 'athlete' | 'gym' } | null;
}

interface ProgramsTableProps {
    programs: ProgramType[];
    selectedPrograms: Set<string>;
    isSelectionMode: boolean;
    toggleSelection: (id: string, multi?: boolean) => void;
    selectAll: () => void;
    totalFiltered: number;
    promptDelete: (id: string) => void;
    onExport: (programId: string) => void;
    onAssign: (program: ProgramType) => void;
    CARD_GRADIENTS: string[];
    CARD_ICONS: any[];
}

export function ProgramsTable({
    programs,
    selectedPrograms,
    isSelectionMode,
    toggleSelection,
    selectAll,
    totalFiltered,
    promptDelete,
    onExport,
    onAssign,
    CARD_GRADIENTS,
    CARD_ICONS
}: ProgramsTableProps) {

    // Helper inside component to get same icon as grid
    const getCardStyle = (index: number) => {
        const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
        const Icon = CARD_ICONS[index % CARD_ICONS.length];
        return { gradient, Icon };
    };

    const isAllSelected = totalFiltered > 0 && selectedPrograms.size === totalFiltered;

    return (
        <div className="bg-white rounded-2xl border border-cv-border shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="py-2 px-6 w-12 text-center">
                                <button
                                    onClick={selectAll}
                                    className="text-gray-400 hover:text-cv-primary transition-colors flex items-center justify-center translate-y-0.5"
                                    title="Seleccionar todo"
                                >
                                    {isAllSelected ? <CheckSquare size={20} className="text-cv-primary" /> : <Square size={20} />}
                                </button>
                            </th>
                            <th className="py-3 px-6 text-xs font-semibold text-cv-text-tertiary uppercase tracking-wider">
                                Programa
                            </th>
                            <th className="py-3 px-6 text-xs font-semibold text-cv-text-tertiary uppercase tracking-wider">
                                Asignado a
                            </th>
                            <th className="py-3 px-6 text-xs font-semibold text-cv-text-tertiary uppercase tracking-wider">
                                Estado
                            </th>
                            <th className="py-3 px-6 text-xs font-semibold text-cv-text-tertiary uppercase tracking-wider hidden md:table-cell">
                                Creado
                            </th>
                            <th className="py-3 px-6 text-xs font-semibold text-cv-text-tertiary uppercase tracking-wider hidden md:table-cell">
                                Actualizado
                            </th>
                            <th className="py-3 px-6 w-32"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {programs.map((program, index) => {
                            const { gradient, Icon } = getCardStyle(index);
                            const isSelected = selectedPrograms.has(program.id);

                            return (
                                <tr
                                    key={program.id}
                                    onClick={() => toggleSelection(program.id)}
                                    className={`
                                        group hover:bg-gray-50/80 transition-colors cursor-pointer
                                        ${isSelected ? 'bg-cv-accent/5 hover:bg-cv-accent/10' : ''}
                                    `}
                                >
                                    {/* Selection Column */}
                                    <td className="py-3 px-6">
                                        <div className="flex items-center justify-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSelection(program.id);
                                                }}
                                                className={`
                                                    text-gray-300 transition-all duration-200 flex items-center justify-center
                                                    ${isSelected ? 'text-cv-primary' : 'hover:text-gray-400'}
                                                `}
                                            >
                                                {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                            </button>
                                        </div>
                                    </td>

                                    {/* Program Name */}
                                    <td className="py-4 px-6">
                                        <Link
                                            href={`/editor/${program.id}`}
                                            className="flex items-center gap-4 group/link"
                                        >
                                            <div className={`
                                                w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm
                                                bg-gradient-to-br ${gradient}
                                            `}>
                                                <Icon size={18} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-cv-text-primary group-hover/link:text-cv-accent transition-colors">
                                                    {program.name}
                                                </div>
                                                <div className="text-xs text-cv-text-tertiary hidden sm:block">
                                                    ID: {program.id.slice(0, 8)}...
                                                </div>
                                            </div>
                                        </Link>
                                    </td>

                                    {/* Assigned To */}
                                    <td className="py-4 px-6">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAssign(program);
                                            }}
                                            className={`text-sm font-medium px-2 py-1 rounded-md transition-colors ${program.client
                                                ? 'bg-cv-accent/10 text-cv-accent hover:bg-cv-accent/20'
                                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {program.client ? program.client.name : 'Sin asignar'}
                                        </button>
                                    </td>

                                    {/* Status (Mocked for now as logic wasn't fully visible, defaulting to Active) */}
                                    <td className="py-4 px-6">
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            Activo
                                        </span>
                                    </td>

                                    {/* Dates */}
                                    <td className="py-4 px-6 text-sm text-cv-text-secondary hidden md:table-cell whitespace-nowrap">
                                        {formatDate(program.created_at)}
                                    </td>
                                    <td className="py-4 px-6 text-sm text-cv-text-secondary hidden md:table-cell whitespace-nowrap">
                                        {formatDate(program.updated_at)}
                                    </td>

                                    {/* Actions */}
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onExport(program.id);
                                                }}
                                                className="p-2 text-cv-text-secondary hover:text-cv-accent hover:bg-orange-50 rounded-lg transition-all"
                                                title="Exportar"
                                            >
                                                <Download size={16} />
                                            </button>
                                            <Link
                                                href={`/editor/${program.id}`}
                                                className="p-2 text-cv-text-secondary hover:text-cv-primary hover:bg-gray-100 rounded-lg transition-all"
                                                title="Editar"
                                            >
                                                <Edit2 size={16} />
                                            </Link>
                                            <button
                                                onClick={() => promptDelete(program.id)}
                                                className="p-2 text-cv-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
