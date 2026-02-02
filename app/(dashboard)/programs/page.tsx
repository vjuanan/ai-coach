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
    Edit2,
    AlertTriangle,
    Flame,
    Target,
    Zap,
    Calendar
} from 'lucide-react';
import Link from 'next/link';
import {
    getPrograms,
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

    // State for Delete Modal
    const [programToDelete, setProgramToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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

    async function confirmDelete() {
        if (!programToDelete) return;
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
    }

    const filteredPrograms = programs.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Función para obtener gradiente e ícono basado en índice
    const getCardStyle = (index: number) => {
        const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
        const Icon = CARD_ICONS[index % CARD_ICONS.length];
        return { gradient, Icon };
    };

    return (

        <>
            <Topbar
                title="Programas"
                actions={<GlobalCreateButton />}
            />
            <div className="max-w-6xl mx-auto">
                {/* Programs Grid */}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredPrograms.map((program, index) => {
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

                            return (
                                <div
                                    key={program.id}
                                    className={`
                                        group relative overflow-hidden rounded-2xl
                                        bg-gradient-to-br ${gradient}
                                        transition-all duration-300 
                                        shadow-lg hover:shadow-2xl hover:-translate-y-2
                                        cursor-pointer
                                    `}
                                >
                                    {/* Overlay sutil para hover */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />

                                    {/* Efecto de brillo */}
                                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <Link href={`/editor/${program.id}`} className="relative z-10 block p-6">
                                        {/* Header con ícono */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
                                                <Icon size={28} />
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        promptDelete(program.id);
                                                    }}
                                                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-500/80 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-all duration-200"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                                                    <Edit2 size={18} />
                                                </div>
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
                                                <div className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium text-white">
                                                    Editar →
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
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
        </>
    );
}
