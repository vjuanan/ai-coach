'use client';

import React, { useState } from 'react';
import {
    BookOpen,
    Flame,
    Dumbbell,
    TrendingUp,
    User,
    ChevronDown,
    ChevronRight,
    Sparkles,
    Target,
    Clock,
    Layers,
    Zap,
    Brain
} from 'lucide-react';
import type { TrainingPrinciple, TrainingMethodology } from '@/lib/supabase/types';
import { MethodologySection } from './methodology-section';

interface KnowledgeContentProps {
    principles: TrainingPrinciple[];
    methodologies: TrainingMethodology[];
}

// Group by objective
// Group by objective
type ObjectiveType = 'crossfit' | 'strength' | 'hypertrophy';

const objectiveConfig: Record<ObjectiveType, {
    label: string;
    icon: React.ReactNode;
    gradient: string;
    bgClass: string;
    description: string;
}> = {
    'crossfit': {
        label: 'CrossFit / Performance Atlética',
        icon: <Flame size={24} />,
        gradient: 'from-[#FF416C] to-[#FF4B2B]',
        bgClass: 'bg-gradient-to-br from-[#FF416C]/10 to-[#FF4B2B]/10',
        description: 'Metodologías para atletas funcionales y de alto rendimiento'
    },
    'strength': {
        label: 'Fuerza / Powerlifting',
        icon: <Dumbbell size={24} />,
        gradient: 'from-[#2193b0] to-[#6dd5ed]',
        bgClass: 'bg-gradient-to-br from-[#2193b0]/10 to-[#6dd5ed]/10',
        description: 'Principios para maximizar la producción de fuerza'
    },
    'hypertrophy': {
        label: 'Hipertrofia / Estética',
        icon: <TrendingUp size={24} />,
        gradient: 'from-[#8A2387] via-[#E94057] to-[#F27121]',
        bgClass: 'bg-gradient-to-br from-[#8A2387]/10 via-[#E94057]/10 to-[#F27121]/10',
        description: 'Ciencia del crecimiento muscular y composición corporal'
    }
};

const categoryIcons: Record<string, React.ReactNode> = {
    'foundational_theory': <Brain size={18} />,
    'volume': <Layers size={18} />,
    'periodization': <Clock size={18} />,
    'intensity': <Zap size={18} />,
    'strength_protocol': <Target size={18} />,
    'progression': <TrendingUp size={18} />,
    'exercise_selection': <Dumbbell size={18} />,
};

function PrincipleCard({ principle }: { principle: TrainingPrinciple }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const content = principle.content as Record<string, unknown>;

    const categoryLabel = principle.category
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return (
        <div
            className="bg-white rounded-lg border border-cv-border/60 hover:border-cv-border transition-all duration-150 overflow-hidden"
        >
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50/40 transition-colors"
            >
                <div className="flex-shrink-0 w-8 h-8 rounded-md bg-cv-bg-tertiary flex items-center justify-center text-cv-accent">
                    {categoryIcons[principle.category] || <BookOpen size={16} />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-medium text-cv-accent">
                            {categoryLabel}
                        </span>
                    </div>
                    <h4 className="font-medium text-cv-text-primary text-sm leading-tight">
                        {principle.title}
                    </h4>
                    {typeof content.summary === 'string' && (
                        <p className="text-xs text-cv-text-secondary mt-0.5 line-clamp-1">
                            {String(content.summary)}
                        </p>
                    )}
                </div>

                <div className="flex-shrink-0 text-cv-text-tertiary">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-cv-border/50 bg-gray-50/20">
                    <div className="pt-3 space-y-3">
                        {/* Main Content - Render based on structure */}
                        {renderContentSection(content)}

                        {/* Decision Framework */}
                        {principle.decision_framework && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles size={16} className="text-amber-600" />
                                    <span className="font-medium text-amber-800 text-sm">
                                        Framework de Decisión
                                    </span>
                                </div>
                                <p className="text-sm text-amber-900">
                                    {principle.decision_framework}
                                </p>
                            </div>
                        )}

                        {/* Context Factors */}
                        {principle.context_factors && principle.context_factors.length > 0 && (
                            <div>
                                <span className="text-xs font-medium text-cv-text-tertiary uppercase tracking-wide">
                                    Factores a Considerar
                                </span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {principle.context_factors.map((factor, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2.5 py-1 bg-cv-bg-tertiary text-cv-text-secondary text-xs rounded-full"
                                        >
                                            {factor}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {principle.tags && principle.tags.length > 0 && (
                            <div className="pt-3 border-t border-cv-border">
                                <div className="flex flex-wrap gap-1.5">
                                    {principle.tags.map((tag, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-0.5 bg-cv-accent/10 text-cv-accent text-xs rounded font-medium"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function renderContentSection(content: Record<string, unknown>) {
    const elements: React.ReactNode[] = [];

    // Handle adaptations (Andy Galpin's 9 adaptations)
    if (content.adaptations && Array.isArray(content.adaptations)) {
        elements.push(
            <div key="adaptations" className="space-y-2">
                <span className="text-xs font-medium text-cv-text-tertiary uppercase tracking-wide">
                    Adaptaciones
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {(content.adaptations as Array<{ order: number; name: string; description: string }>).map((adapt) => (
                        <div
                            key={adapt.order}
                            className="flex items-start gap-2 p-3 bg-white rounded-lg border border-cv-border"
                        >
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cv-accent text-white text-xs font-bold flex items-center justify-center">
                                {adapt.order}
                            </span>
                            <div>
                                <p className="font-medium text-sm text-cv-text-primary">{adapt.name}</p>
                                <p className="text-xs text-cv-text-secondary mt-0.5">{adapt.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Handle protocol (3-5 protocol)
    if (content.protocol && typeof content.protocol === 'object') {
        const protocol = content.protocol as Record<string, string>;
        elements.push(
            <div key="protocol" className="space-y-2">
                <span className="text-xs font-medium text-cv-text-tertiary uppercase tracking-wide">
                    Protocolo
                </span>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(protocol).map(([key, value]) => (
                        <div key={key} className="bg-white rounded-lg border border-cv-border p-3 text-center">
                            <p className="text-2xl font-bold text-cv-accent">{value}</p>
                            <p className="text-xs text-cv-text-secondary capitalize mt-1">
                                {key === 'rest' ? 'Descanso' : key === 'exercises' ? 'Ejercicios' : key === 'sets' ? 'Series' : key === 'reps' ? 'Reps' : key}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Handle landmarks (MEV, MAV, MRV)
    if (content.landmarks && typeof content.landmarks === 'object') {
        const landmarks = content.landmarks as Record<string, { name: string; range?: string; definition?: string; use?: string; use_case?: string }>;
        elements.push(
            <div key="landmarks" className="space-y-2">
                <span className="text-xs font-medium text-cv-text-tertiary uppercase tracking-wide">
                    Volume Landmarks
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(landmarks).map(([key, landmark]) => (
                        <div key={key} className="bg-white rounded-lg border border-cv-border p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="px-2 py-1 bg-cv-accent text-white text-xs font-bold rounded">
                                    {key}
                                </span>
                                <span className="font-medium text-cv-text-primary">{landmark.name}</span>
                            </div>
                            {(landmark.range || landmark.definition) && (
                                <p className="text-sm text-cv-text-secondary">
                                    {landmark.range && <span className="font-medium">{landmark.range}</span>}
                                    {landmark.definition && ` - ${landmark.definition}`}
                                </p>
                            )}
                            {(landmark.use || landmark.use_case) && (
                                <p className="text-xs text-cv-text-tertiary mt-2 italic">
                                    Uso: {landmark.use || landmark.use_case}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Handle strategies (periodization)
    if (content.strategies && typeof content.strategies === 'object') {
        const strategies = content.strategies as Record<string, { description: string; best_for?: string; pros?: string[]; cons?: string[] }>;
        elements.push(
            <div key="strategies" className="space-y-2">
                <span className="text-xs font-medium text-cv-text-tertiary uppercase tracking-wide">
                    Estrategias
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(strategies).map(([key, strategy]) => (
                        <div key={key} className="bg-white rounded-lg border border-cv-border p-4">
                            <h5 className="font-semibold text-cv-text-primary capitalize mb-2">{key}</h5>
                            <p className="text-sm text-cv-text-secondary">{strategy.description}</p>
                            {strategy.best_for && (
                                <p className="text-xs text-cv-accent mt-2 font-medium">
                                    Mejor para: {strategy.best_for}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Handle principles (7 principles of strength)
    if (content.principles && Array.isArray(content.principles)) {
        elements.push(
            <div key="principles-list" className="space-y-2">
                <span className="text-xs font-medium text-cv-text-tertiary uppercase tracking-wide">
                    Principios
                </span>
                <div className="space-y-2">
                    {(content.principles as Array<{ name: string; description: string; application?: string }>).map((p, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-cv-border">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-cv-accent/10 text-cv-accent font-bold flex items-center justify-center text-sm">
                                {idx + 1}
                            </span>
                            <div>
                                <p className="font-medium text-cv-text-primary">{p.name}</p>
                                <p className="text-sm text-cv-text-secondary mt-0.5">{p.description}</p>
                                {p.application && (
                                    <p className="text-xs text-cv-accent mt-1 italic">→ {p.application}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Handle blocks (periodization blocks)
    if (content.blocks && Array.isArray(content.blocks)) {
        elements.push(
            <div key="blocks" className="space-y-2">
                <span className="text-xs font-medium text-cv-text-tertiary uppercase tracking-wide">
                    Bloques de Periodización
                </span>
                <div className="flex flex-col md:flex-row gap-3">
                    {(content.blocks as Array<{ name: string; duration?: string; intensity?: string; reps?: string; goal?: string; goals?: string[] }>).map((block, idx) => (
                        <div key={idx} className="flex-1 bg-white rounded-lg border border-cv-border p-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-cv-accent"></div>
                            <h5 className="font-semibold text-cv-text-primary mb-2">{block.name}</h5>
                            <div className="space-y-1 text-sm text-cv-text-secondary">
                                {block.duration && <p>⏱️ {block.duration}</p>}
                                {block.intensity && <p>💪 {block.intensity}</p>}
                                {block.reps && <p>🔢 {block.reps} reps</p>}
                                {block.goal && <p className="text-xs text-cv-accent mt-2">Meta: {block.goal}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Handle structure (mesocycle weeks)
    if (content.structure && typeof content.structure === 'object') {
        const structure = content.structure as { duration?: string; weeks?: Array<{ week: number; volume: string; RIR: string; note: string }> };
        if (structure.weeks && Array.isArray(structure.weeks)) {
            elements.push(
                <div key="structure" className="space-y-2">
                    <span className="text-xs font-medium text-cv-text-tertiary uppercase tracking-wide">
                        Estructura del Mesociclo {structure.duration && `(${structure.duration})`}
                    </span>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-cv-bg-tertiary">
                                    <th className="px-3 py-2 text-left font-medium text-cv-text-secondary">Semana</th>
                                    <th className="px-3 py-2 text-left font-medium text-cv-text-secondary">Volumen</th>
                                    <th className="px-3 py-2 text-left font-medium text-cv-text-secondary">RIR</th>
                                    <th className="px-3 py-2 text-left font-medium text-cv-text-secondary">Nota</th>
                                </tr>
                            </thead>
                            <tbody>
                                {structure.weeks.map((week) => (
                                    <tr key={week.week} className="border-b border-cv-border">
                                        <td className="px-3 py-2 font-medium">Semana {week.week}</td>
                                        <td className="px-3 py-2">{week.volume}</td>
                                        <td className="px-3 py-2">
                                            <span className="px-2 py-0.5 bg-cv-accent/10 text-cv-accent rounded text-xs font-medium">
                                                RIR {week.RIR}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-cv-text-secondary">{week.note}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }
    }

    // Rationale or application
    if (content.rationale) {
        elements.push(
            <div key="rationale" className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">{content.rationale as string}</p>
            </div>
        );
    }

    if (content.application) {
        elements.push(
            <div key="application" className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-xs font-medium text-green-700 mb-1">Aplicación</p>
                <p className="text-sm text-green-900">{content.application as string}</p>
            </div>
        );
    }

    if (content.key_insight) {
        elements.push(
            <div key="insight" className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className="text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">Insight Clave</span>
                </div>
                <p className="text-sm text-purple-900">{content.key_insight as string}</p>
            </div>
        );
    }

    return elements.length > 0 ? <div className="space-y-4">{elements}</div> : null;
}

export function KnowledgeContent({ principles, methodologies }: KnowledgeContentProps) {
    const [activeTab, setActiveTab] = useState<'principles' | 'methodologies'>('principles');

    // Principles Logic
    const [selectedObjective, setSelectedObjective] = useState<ObjectiveType | 'all'>('all');
    const [selectedAuthor, setSelectedAuthor] = useState<string | 'all'>('all');

    // Get unique authors
    const authors = Array.from(new Set(principles.map(p => p.author)));

    // Group principles by objective
    const groupedByObjective = principles.reduce((acc, principle) => {
        const obj = principle.objective as ObjectiveType;
        if (!acc[obj]) acc[obj] = [];
        acc[obj].push(principle);
        return acc;
    }, {} as Record<ObjectiveType, TrainingPrinciple[]>);

    // Filter principles
    const filteredPrinciples = principles.filter(p => {
        if (selectedObjective !== 'all' && p.objective !== selectedObjective) return false;
        if (selectedAuthor !== 'all' && p.author !== selectedAuthor) return false;
        return true;
    });

    // Stats
    const totalPrinciples = principles.length;
    const totalMethodologies = methodologies.length;

    return (
        <div className="space-y-6">
            {/* Main Tabs */}
            <div className="flex items-center justify-between">
                <div className="flex p-1 bg-cv-bg-tertiary rounded-lg">
                    <button
                        onClick={() => setActiveTab('principles')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'principles'
                                ? 'bg-white text-cv-text-primary shadow-sm'
                                : 'text-cv-text-secondary hover:text-cv-text-primary'
                            }`}
                    >
                        Principios ({totalPrinciples})
                    </button>
                    <button
                        onClick={() => setActiveTab('methodologies')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'methodologies'
                                ? 'bg-white text-cv-text-primary shadow-sm'
                                : 'text-cv-text-secondary hover:text-cv-text-primary'
                            }`}
                    >
                        Metodologías ({totalMethodologies})
                    </button>
                </div>
            </div>

            {activeTab === 'principles' ? (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    {/* Stats & Filters Row */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Stats - Compact inline */}
                        <div className="flex flex-wrap gap-3">
                            <div className="flex items-center gap-2 bg-white rounded-lg border border-cv-border/60 px-3 py-2">
                                <div className="w-7 h-7 rounded-md bg-purple-50 flex items-center justify-center">
                                    <User className="text-purple-500" size={14} />
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-semibold text-cv-text-primary">{authors.length}</span>
                                    <span className="text-xs text-cv-text-secondary">Expertos</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-white rounded-lg border border-cv-border/60 px-3 py-2">
                                <div className="w-7 h-7 rounded-md bg-amber-50 flex items-center justify-center">
                                    <Layers className="text-amber-500" size={14} />
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-lg font-semibold text-cv-text-primary">
                                        {Array.from(new Set(principles.map(p => p.category))).length}
                                    </span>
                                    <span className="text-xs text-cv-text-secondary">Categorías</span>
                                </div>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedObjective}
                                onChange={(e) => setSelectedObjective(e.target.value as ObjectiveType | 'all')}
                                className="px-3 py-1.5 rounded-md border border-cv-border/60 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-cv-accent/30"
                            >
                                <option value="all">Todos los objetivos</option>
                                {Object.entries(objectiveConfig).map(([key, config]) => (
                                    <option key={key} value={key}>{config.label}</option>
                                ))}
                            </select>
                            <select
                                value={selectedAuthor}
                                onChange={(e) => setSelectedAuthor(e.target.value)}
                                className="px-3 py-1.5 rounded-md border border-cv-border/60 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-cv-accent/30"
                            >
                                <option value="all">Todos los expertos</option>
                                {Array.from(authors).map(author => (
                                    <option key={author} value={author}>{author}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Content by Objective */}
                    {selectedObjective === 'all' ? (
                        // Show all grouped by objective
                        Object.entries(objectiveConfig).map(([objectiveKey, config]) => {
                            const objectivePrinciples = (groupedByObjective[objectiveKey as ObjectiveType] || [])
                                .filter(p => selectedAuthor === 'all' || p.author === selectedAuthor);

                            if (objectivePrinciples.length === 0) return null;

                            return (
                                <div key={objectiveKey} className="space-y-2">
                                    {/* Objective Header - Compact */}
                                    <div className={`rounded-lg px-3 py-2.5 ${config.bgClass}`}>
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${config.gradient} text-white flex items-center justify-center`}>
                                                {React.cloneElement(config.icon as React.ReactElement, { size: 16 })}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-semibold text-cv-text-primary">{config.label}</h3>
                                                <p className="text-[11px] text-cv-text-secondary truncate">{config.description}</p>
                                            </div>
                                            <span className="text-[10px] font-medium text-cv-text-tertiary bg-white/70 px-2 py-0.5 rounded-full">
                                                {objectivePrinciples.length}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Principles */}
                                    <div className="space-y-1.5 pl-3 border-l border-cv-border/50">
                                        {objectivePrinciples.map(principle => (
                                            <PrincipleCard key={principle.id} principle={principle} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        // Show filtered
                        <div className="space-y-1.5">
                            {filteredPrinciples.map(principle => (
                                <PrincipleCard key={principle.id} principle={principle} />
                            ))}
                        </div>
                    )}

                    {filteredPrinciples.length === 0 && (
                        <div className="text-center py-12 bg-cv-bg-secondary rounded-xl">
                            <BookOpen className="mx-auto text-cv-text-tertiary mb-3" size={48} />
                            <p className="text-cv-text-secondary">No hay principios que coincidan con los filtros seleccionados.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="animate-in fade-in zoom-in-95 duration-200">
                    <MethodologySection methodologies={methodologies} />
                </div>
            )}
        </div>
    );
}
