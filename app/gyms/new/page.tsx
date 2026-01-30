'use client';

import { AppShell } from '@/components/app-shell';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient, getEquipmentCatalog } from '@/lib/actions';
import { ArrowLeft, Save, Loader2, Upload, Plus, Trash2, CheckSquare, Square, ChevronDown, ChevronRight, Info } from 'lucide-react';
import Link from 'next/link';
import type { EquipmentCatalog } from '@/lib/supabase/types';

interface InventoryItem {
    id: string;
    quantity: number;
    details?: string; // For general notes
    variants?: { weight: string; quantity: number }[]; // For measurable items
}

export default function NewGymPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [catalog, setCatalog] = useState<EquipmentCatalog[]>([]);
    const [inventory, setInventory] = useState<Record<string, InventoryItem>>({});

    // Limitations State
    const [limitations, setLimitations] = useState({
        spacePerClient: 0,
        runningArea: false,
        notes: ''
    });

    // Logo State
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Accordion State
    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        'Cardio': true,
        'Strength': true,
        'Gymnastics': false,
        'Accessories': false
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
                    quantity: 1,
                    variants: item.is_weight_measurable ? [{ weight: '', quantity: 1 }] : undefined
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

    const addVariant = (id: string) => {
        setInventory(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                variants: [...(prev[id].variants || []), { weight: '', quantity: 1 }]
            }
        }));
    };

    const updateVariant = (itemId: string, index: number, field: 'weight' | 'quantity', value: string | number) => {
        setInventory(prev => {
            const variants = [...(prev[itemId].variants || [])];
            variants[index] = { ...variants[index], [field]: value } as any;
            return {
                ...prev,
                [itemId]: { ...prev[itemId], variants }
            };
        });
    };

    const removeVariant = (itemId: string, index: number) => {
        setInventory(prev => {
            const variants = [...(prev[itemId].variants || [])];
            variants.splice(index, 1);
            return {
                ...prev,
                [itemId]: { ...prev[itemId], variants }
            };
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
                    logo_url: logoPreview, // Saving base64 for MVP
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

    // Group catalog
    const groupedCatalog = catalog.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, EquipmentCatalog[]>);

    return (
        <AppShell title="Nuevo Gimnasio">
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
                <div className="flex items-center gap-4">
                    <Link href="/" className="cv-btn-ghost">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-2xl font-bold text-cv-text-primary">Registrar Nuevo Gimnasio / Cliente B2B</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* 1. Basic Info & Logo */}
                    <div className="cv-card p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Logo Upload */}
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

                        {/* Basic Fields */}
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
                                <button
                                    type="button"
                                    onClick={() => toggleCategory(category)}
                                    className="w-full flex items-center justify-between p-4 bg-cv-bg-secondary hover:bg-cv-bg-tertiary transition-colors"
                                >
                                    <span className="font-semibold text-cv-text-primary">{category}</span>
                                    {expandedCategories[category] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                </button>

                                {expandedCategories[category] && (
                                    <div className="p-4 space-y-4 border-t border-cv-border animate-in slide-in-from-top-2">
                                        {items.map(item => {
                                            const isSelected = !!inventory[item.id];
                                            const itemData = inventory[item.id];

                                            return (
                                                <div key={item.id} className={`p-4 rounded-lg border transition-all ${isSelected ? 'bg-cv-bg-secondary border-cv-accent/50' : 'bg-transparent border-cv-border border-dashed opacity-75'}`}>
                                                    <div className="flex items-start gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleItem(item)}
                                                            className={`mt-1 flex-shrink-0 transition-colors ${isSelected ? 'text-cv-accent' : 'text-cv-text-muted hover:text-cv-text-primary'}`}
                                                        >
                                                            {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                                        </button>

                                                        <div className="flex-1 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <span className={`font-medium ${isSelected ? 'text-cv-text-primary' : 'text-cv-text-secondary'}`}>
                                                                    {item.name}
                                                                </span>
                                                            </div>

                                                            {isSelected && (
                                                                <div className="animate-in fade-in space-y-3">
                                                                    {!item.is_weight_measurable ? (
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-sm text-cv-text-secondary">Cantidad:</span>
                                                                            <input
                                                                                type="number"
                                                                                min={1}
                                                                                value={itemData.quantity}
                                                                                onChange={(e) => updateItemQuantity(item.id, Number(e.target.value))}
                                                                                className="w-20 h-8 px-2 rounded bg-cv-bg-primary border border-cv-border text-center text-sm"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {itemData.variants?.map((variant, idx) => (
                                                                                <div key={idx} className="flex items-center gap-2">
                                                                                    <input
                                                                                        placeholder="Peso (ej. 15kg)"
                                                                                        className="w-32 h-8 px-2 rounded bg-cv-bg-primary border border-cv-border text-sm"
                                                                                        value={variant.weight}
                                                                                        onChange={e => updateVariant(item.id, idx, 'weight', e.target.value)}
                                                                                    />
                                                                                    <span className="text-sm text-cv-text-secondary">x</span>
                                                                                    <input
                                                                                        type="number"
                                                                                        placeholder="Cant."
                                                                                        className="w-20 h-8 px-2 rounded bg-cv-bg-primary border border-cv-border text-center text-sm"
                                                                                        value={variant.quantity}
                                                                                        onChange={e => updateVariant(item.id, idx, 'quantity', Number(e.target.value))}
                                                                                    />
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => removeVariant(item.id, idx)}
                                                                                        className="text-red-400 hover:text-red-300 p-1"
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            ))}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => addVariant(item.id)}
                                                                                className="text-xs text-cv-accent hover:underline flex items-center gap-1"
                                                                            >
                                                                                <Plus size={12} /> Agregar variante de peso
                                                                            </button>
                                                                        </div>
                                                                    )}
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
        </AppShell>
    );
}
