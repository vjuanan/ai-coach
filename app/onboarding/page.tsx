
'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Dumbbell, UserCog, ChevronRight, ChevronLeft, Calendar, Ruler, Weight, Target, MapPin, Clock, Activity, AlertCircle, MessageSquare, Camera, Upload, Check } from 'lucide-react';

// --- Step Components ---

const Step0RoleSelection = ({ onSelect, isLoading }: { onSelect: (role: 'coach' | 'athlete') => void, isLoading: boolean }) => (
    <div className="space-y-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold text-gray-900">Bienvenido a AI Coach</h1>
        <p className="text-gray-500">¿Cómo quieres usar la plataforma?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <button
                disabled={isLoading}
                onClick={() => onSelect('athlete')}
                className="group p-8 border-2 border-gray-100 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left flex flex-col gap-4 disabled:opacity-50"
            >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <Dumbbell />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-gray-900">Soy Atleta</h3>
                    <p className="text-sm text-gray-500">Quiero ver mis rutinas y registrar mi progreso.</p>
                </div>
            </button>
            <button
                disabled={isLoading}
                onClick={() => onSelect('coach')}
                className="group p-8 border-2 border-gray-100 rounded-2xl hover:border-purple-500 hover:bg-purple-50 transition-all text-left flex flex-col gap-4 disabled:opacity-50"
            >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                    <UserCog />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-gray-900">Soy Coach</h3>
                    <p className="text-sm text-gray-500">Quiero gestionar atletas y crear programas.</p>
                </div>
            </button>
        </div>
    </div>
);

// Helper for Inputs
const InputLabel = ({ icon: Icon, label }: { icon: any, label: string }) => (
    <div className="flex items-center gap-2 mb-4 text-gray-900 font-semibold">
        <Icon className="w-5 h-5 text-blue-600" />
        <span>{label}</span>
    </div>
);

// --- Wizard Steps ---

export default function OnboardingPage() {
    const router = useRouter();
    const supabase = createClient();
    const [step, setStep] = useState(0);
    const [role, setRole] = useState<'coach' | 'athlete' | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        birth_date: '',
        height: 170, // cm
        weight: 70.0, // kg
        main_goal: 'hypertrophy',
        training_place: 'gym',
        equipment_list: [] as string[],
        days_per_week: 3,
        minutes_per_session: 60,
        experience_level: 'beginner',
        injuries: '',
        training_preferences: '',
        whatsapp_number: '',
        avatar_url: ''
    });

    const updateField = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Save to DB
    const saveProgress = async (currentStepData: Partial<typeof formData>) => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Simple update: Send the current state
            const { error } = await supabase
                .from('profiles')
                .update(currentStepData)
                .eq('id', user.id);

            if (error) throw error;
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRoleSelect = async (selectedRole: 'coach' | 'athlete') => {
        setIsLoading(true);
        setRole(selectedRole);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('profiles').update({ role: selectedRole }).eq('id', user.id);
            }
            if (selectedRole === 'coach') {
                router.push('/');
            } else {
                setStep(1);
            }
        } catch (e) { console.error(e) }
        setIsLoading(false);
    };

    const nextStep = async () => {
        await saveProgress(formData);
        if (step === 11) {
            router.push('/athlete/dashboard');
        } else {
            setStep(s => s + 1);
        }
    };

    const prevStep = () => setStep(s => s - 1);

    // Render Steps
    const renderStep = () => {
        switch (step) {
            case 1: // Birth Date
                return (
                    <div>
                        <InputLabel icon={Calendar} label="¿Cuándo naciste?" />
                        <input
                            type="date"
                            className="w-full p-4 text-xl border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            value={formData.birth_date}
                            onChange={(e) => updateField('birth_date', e.target.value)}
                        />
                    </div>
                );
            case 2: // Height
                return (
                    <div>
                        <InputLabel icon={Ruler} label="¿Cuánto mides (cm)?" />
                        <div className="flex items-center gap-4">
                            <input
                                type="range" min="120" max="220"
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                value={formData.height}
                                onChange={(e) => updateField('height', parseInt(e.target.value))}
                            />
                            <span className="text-3xl font-bold w-24 text-center">{formData.height} cm</span>
                        </div>
                    </div>
                );
            case 3: // Weight
                return (
                    <div>
                        <InputLabel icon={Weight} label="¿Cuánto pesas (kg)?" />
                        <div className="flex justify-center items-center gap-8">
                            <button onClick={() => updateField('weight', formData.weight - 0.5)} className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-xl font-bold">-</button>
                            <div className="text-center">
                                <span className="text-4xl font-bold text-blue-600">{formData.weight.toFixed(1)}</span>
                                <span className="text-gray-400 ml-2">kg</span>
                            </div>
                            <button onClick={() => updateField('weight', formData.weight + 0.5)} className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 text-xl font-bold">+</button>
                        </div>
                    </div>
                );
            case 4: // Goal
                return (
                    <div>
                        <InputLabel icon={Target} label="¿Cuál es tu objetivo principal?" />
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'hypertrophy', label: '💪 Ganar Masa Muscular' },
                                { id: 'fat_loss', label: '🔥 Perder Grasa' },
                                { id: 'performance', label: '⚡ Mejorar Rendimiento' },
                                { id: 'maintenance', label: '🧘 Salud y Mantenimiento' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => updateField('main_goal', opt.id)}
                                    className={`p-4 rounded-xl text-left border-2 transition-all ${formData.main_goal === opt.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:bg-gray-50'}`}
                                >
                                    <span className="font-medium text-lg">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 5: // Place
                return (
                    <div>
                        <InputLabel icon={MapPin} label="¿Dónde entrenas?" />
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'gym', label: 'Gimnasio' },
                                { id: 'crossfit', label: 'Box CrossFit' },
                                { id: 'home', label: 'En Casa' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => updateField('training_place', opt.id)}
                                    className={`p-4 rounded-xl text-center border-2 transition-all ${formData.training_place === opt.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:bg-gray-50'}`}
                                >
                                    <span className="font-medium">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 6: // Equipment (Conditional)
                if (formData.training_place !== 'home') {
                    return (
                        <div className="text-center py-12">
                            <Check className="w-16 h-16 text-green-500 mx-auto mb-4" />
                            <h3 className="text-xl font-medium">No necesitas registrar equipo</h3>
                            <p className="text-gray-500">Al entrenar en {formData.training_place === 'gym' ? 'Gimnasio' : 'Box'}, asumimos que tienes el equipo necesario.</p>
                        </div>
                    );
                }
                return (
                    <div>
                        <InputLabel icon={Dumbbell} label="¿Qué equipo tienes en casa?" />
                        <textarea
                            className="w-full p-4 border-2 border-gray-200 rounded-xl h-32"
                            placeholder="Ej: Mancuernas de 10kg, Barra, Banda elástica..."
                            value={formData.equipment_list.join(', ')}
                            onChange={(e) => updateField('equipment_list', e.target.value.split(','))}
                        />
                        <p className="text-xs text-gray-400 mt-2">Separa los items por comas</p>
                    </div>
                );
            case 7: // Availability
                return (
                    <div>
                        <InputLabel icon={Clock} label="Disponibilidad Semanal" />
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Días por semana: <strong className="text-gray-900">{formData.days_per_week}</strong></label>
                                <input
                                    type="range" min="1" max="7"
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                    value={formData.days_per_week}
                                    onChange={(e) => updateField('days_per_week', parseInt(e.target.value))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-500 mb-2">Minutos por sesión: <strong className="text-gray-900">{formData.minutes_per_session}</strong></label>
                                <div className="flex gap-2">
                                    {[30, 45, 60, 90, 120].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => updateField('minutes_per_session', m)}
                                            className={`px-4 py-2 rounded-lg text-sm border transition-all ${formData.minutes_per_session === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            {m}m
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 8: // Experience
                return (
                    <div>
                        <InputLabel icon={Activity} label="Nivel de Experiencia" />
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'beginner', label: 'Principiante', desc: 'Menos de 6 meses entrenando' },
                                { id: 'intermediate', label: 'Intermedio', desc: '6 meses a 2 años constante' },
                                { id: 'advanced', label: 'Avanzado', desc: '+2 años de entrenamiento serio' }
                            ].map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => updateField('experience_level', opt.id)}
                                    className={`p-4 rounded-xl text-left border-2 transition-all ${formData.experience_level === opt.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-100 hover:bg-gray-50'}`}
                                >
                                    <span className="font-bold block">{opt.label}</span>
                                    <span className="text-sm opacity-75">{opt.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 9: // Details (Injuries)
                return (
                    <div className="space-y-6">
                        <div>
                            <InputLabel icon={AlertCircle} label="¿Tienes lesiones?" />
                            <textarea
                                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 h-24"
                                placeholder="Describe lesiones o molestias actuales. Deja vacío si no tienes."
                                value={formData.injuries}
                                onChange={(e) => updateField('injuries', e.target.value)}
                            />
                        </div>
                        <div>
                            <InputLabel icon={MessageSquare} label="Preferencias / Comentarios" />
                            <textarea
                                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 h-24"
                                placeholder="Ej: No me gusta correr, prefiero ejercicios con barra..."
                                value={formData.training_preferences}
                                onChange={(e) => updateField('training_preferences', e.target.value)}
                            />
                        </div>
                    </div>
                );
            case 10: // WhatsApp
                return (
                    <div>
                        <InputLabel icon={MessageSquare} label="Tu WhatsApp" />
                        <p className="text-sm text-gray-500 mb-4">Para estar en contacto con tu coach.</p>
                        <input
                            type="tel"
                            className="w-full p-4 text-xl border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                            placeholder="+54 9 11 1234 5678"
                            value={formData.whatsapp_number}
                            onChange={(e) => updateField('whatsapp_number', e.target.value)}
                        />
                    </div>
                );
            case 11: // Avatar
                return (
                    <div className="text-center">
                        <InputLabel icon={Camera} label="Foto de Perfil" />
                        <div className="w-32 h-32 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center border-4 border-dashed border-gray-200">
                            <Upload className="text-gray-400 w-8 h-8" />
                        </div>
                        <p className="text-gray-500 mb-6">Sube tu mejor foto (Opcional)</p>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto w-full">
                {step === 0 ? (
                    <Step0RoleSelection onSelect={handleRoleSelect} isLoading={isLoading} />
                ) : (
                    <div className="space-y-8 animate-in zoom-in-95 duration-300">
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${((step - 1) / 10) * 100}%` }}
                            ></div>
                        </div>
                        <div className="text-right text-xs text-gray-400 font-medium">Paso {step} de 11</div>

                        {/* Card */}
                        <div className="bg-white shadow-xl shadow-blue-900/5 rounded-3xl p-8 border border-white min-h-[400px] flex flex-col relative overflow-hidden">
                            <div className="flex-1">
                                {renderStep()}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex justify-between mt-8 pt-8 border-t border-gray-50">
                                <button
                                    onClick={prevStep}
                                    className="flex items-center gap-2 text-gray-400 hover:text-gray-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <ChevronLeft size={20} /> Atrás
                                </button>
                                <button
                                    onClick={nextStep}
                                    disabled={isLoading}
                                    className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? 'Guardando...' : step === 11 ? 'Finalizar' : 'Siguiente'}
                                    {!isLoading && <ChevronRight size={20} />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
