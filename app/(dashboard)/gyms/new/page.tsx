'use client';

import { Topbar } from '@/components/app-shell/Topbar';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, getEquipmentCatalog } from '@/lib/actions';
import { ArrowLeft, Save, Loader2, Upload, CheckSquare, Square, ChevronDown, ChevronRight, Info } from 'lucide-react';
import Link from 'next/link';
import type { EquipmentCatalog } from '@/lib/supabase/types';

interface InventoryItem {
    id: string;
    quantity: number;
    details?: string;
}

export default function NewGymPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [catalog, setCatalog] = useState<EquipmentCatalog[]>([]);
    const [inventory, setInventory] = useState<Record<string, InventoryItem>>({});

    const [limitations, setLimitations] = useState({
        spacePerClient: 0,
        runningArea: false,
        notes: ''
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Cardio': true,
        'Barras': true,
        'Mancuernas': false,
        'Kettlebells': false,
        'Discos': false
    });

    useEffect(() => {
        const fetchCatalog = async () => {
            const data = await getEquipmentCatalog();
            setCatalog(data);
        };
        fetchCatalog();
    }, []);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleCategory = (cat: string) => {
        setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
    };

    const toggleItem = (item: EquipmentCatalog) => {
        setInventory(prev => {
            const next = { ...prev };
            if (next[item.id]) {
                delete next[item.id];
            } else {
                next[item.id] = {
                    id: item.id,
                    quantity: 1
                };
            }
            return next;
        });
    };

    const updateItemQuantity = (id: string, qty: number) => {
        setInventory(prev => ({
            ...prev,
            [id]: { ...prev[id], quantity: qty }
        }));
    };

    const toggleAllInCategory = (categoryMembers: EquipmentCatalog[]) => {
        const allSelected = categoryMembers.every(item => inventory[item.id]);

        setInventory(prev => {
            const next = { ...prev };
            categoryMembers.forEach(item => {
                if (allSelected) {
                    delete next[item.id];
                } else if (!next[item.id]) {
                    next[item.id] = { id: item.id, quantity: 1 };
                }
            });
            return next;
        });
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const location = formData.get('location') as string;
        const owner = formData.get('owner') as string;
        const members = formData.get('members') as string;

        try {
            await createClient({
                type: 'gym',
                name,
                details: {
                    location,
                    owner,
                    members,
                    logo_url: logoPreview,
                    limitations,
                    inventory
                }
            });

            router.push('/gyms');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Error creating gym');
        } finally {
            setIsLoading(false);
        }
    }

    const groupedCatalog = catalog.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, EquipmentCatalog[]>);

    return (
        <>
            <Topbar
                title="Registrar Nuevo Gimnasio / Cliente B2B"
                actions={
                    <Link href="/gyms" className="cv-btn-ghost">
                        <ArrowLeft size={20} />
                        <span className="ml-2">Volver</span>
                    </Link>
                }
            />
            <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-6">

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* 1. Basic Info & Logo */}
                    <div className="cv-card p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center gap-4">
                            <div
                                className="w-32 h-32 rounded-full bg-cv-bg-tertiary border-2 border-dashed border-cv-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-cv-accent transition-colors relative"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-center text-cv-text-secondary">
                                        <Upload size={24} className="mx-auto mb-2" />
                                        <span className="text-xs">Subir Logo</span>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleLogoChange}
                            />
                        </div>

                        <div className="md:col-span-2 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-cv-text-secondary">Nombre del Gimnasio *</label>
                                    <input name="name" required className="cv-input w-full" placeholder="Ej. Iron Paradise" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-cv-text-secondary">Ubicación</label>
                                    <input name="location" className="cv-input w-full" placeholder="Ciudad o Dirección" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-cv-text-secondary">Propietario / Contacto</label>
                                    <input name="owner" className="cv-input w-full" placeholder="Nombre completo" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-cv-text-secondary">Miembros (aprox)</label>
                                    <input name="members" type="number" className="cv-input w-full" placeholder="100" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 2. Limitations */}
                    <div className="cv-card p-6 space-y-6">
                        <h2 className="text-lg font-semibold text-cv-text-primary flex items-center gap-2">
                            <Info size={18} /> Limitaciones y Espacio
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-cv-text-secondary">Espacio Físico Disponible (m² por cliente en hora pico)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="cv-input w-full pr-10"
                                        placeholder="Ej. 3"
                                        value={limitations.spacePerClient || ''}
                                        onChange={e => setLimitations(prev => ({ ...prev, spacePerClient: Number(e.target.value) }))}
                                    />
                                    <span className="absolute right-3 top-2.5 text-cv-text-muted text-sm">m²/p</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-cv-text-secondary">Entorno Exterior</label>
                                <div className="flex items-center gap-4 h-10">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-cv-border text-cv-accent focus:ring-cv-accent"
                                            checked={limitations.runningArea}
                                            onChange={e => setLimitations(prev => ({ ...prev, runningArea: e.target.checked }))}
                                        />
                                        <span className="text-cv-text-primary">Apto para correr alrededor</span>
                                    </label>
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-cv-text-secondary">Otras Limitaciones / Notas</label>
                                <textarea
                                    className="cv-input w-full h-24 pt-2 resize-none"
                                    placeholder="Restricciones de ruido, horarios, falta de ventilación, etc."
                                    value={limitations.notes}
                                    onChange={e => setLimitations(prev => ({ ...prev, notes: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. Equipment Inventory */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-cv-text-primary pl-1">Biblioteca de Equipamiento</h2>

                        {Object.entries(groupedCatalog).map(([category, items]) => (
                            <div key={category} className="cv-card overflow-hidden">
                                <div className="flex items-center justify-between p-4 bg-cv-bg-secondary hover:bg-cv-bg-tertiary transition-colors">
                                    <button
                                        type="button"
                                        onClick={() => toggleCategory(category)}
                                        className="flex-1 flex items-center justify-between"
                                    >
                                        <span className="font-semibold text-cv-text-primary">{category}</span>
                                        {expandedCategories[category] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                    </button>

                                    {/* Select All shortcut */}
                                    {expandedCategories[category] && (
                                        <button
                                            type="button"
                                            onClick={() => toggleAllInCategory(items)}
                                            className="ml-4 text-xs text-cv-accent hover:underline hidden sm:block"
                                        >
                                            Seleccionar Todos
                                        </button>
                                    )}
                                </div>

                                {expandedCategories[category] && (
                                    <div className="p-4 bg-cv-bg-primary border-t border-cv-border grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in slide-in-from-top-1">
                                        {items.map(item => {
                                            const isSelected = !!inventory[item.id];
                                            const itemData = inventory[item.id];

                                            return (
                                                <div key={item.id} className={`p-3 rounded-md border transition-all ${isSelected ? 'bg-cv-bg-secondary border-cv-accent/50 shadow-sm' : 'bg-transparent border-cv-border border-dashed opacity-80 hover:opacity-100 hover:border-gray-400'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleItem(item)}
                                                            className={`flex-shrink-0 transition-colors ${isSelected ? 'text-cv-accent' : 'text-cv-text-muted hover:text-cv-text-primary'}`}
                                                        >
                                                            {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                                        </button>

                                                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 overflow-hidden">
                                                            <span className={`text-sm font-medium truncate ${isSelected ? 'text-cv-text-primary' : 'text-cv-text-secondary'}`} title={item.name}>
                                                                {item.name}
                                                            </span>

                                                            {isSelected && (
                                                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                                                    <span className="text-xs text-cv-text-secondary whitespace-nowrap">Cant:</span>
                                                                    <input
                                                                        type="number"
                                                                        min={1}
                                                                        value={itemData.quantity}
                                                                        onChange={(e) => updateItemQuantity(item.id, Number(e.target.value))}
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        className="w-16 h-7 px-1 rounded bg-cv-bg-tertiary border border-cv-border text-center text-sm focus:ring-1 focus:ring-cv-accent focus:outline-none"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-6 border-t border-cv-border">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="cv-btn-primary min-w-[200px] h-12 text-base shadow-cv-accent hover:shadow-cv-accent-lg transition-all"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Guardar Gimnasio Completo
                        </button>
                    </div>

                </form>
            </div>
        </AppShell >
    );
}
