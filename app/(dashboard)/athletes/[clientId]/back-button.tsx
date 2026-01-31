'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function BackButton() {
    const router = useRouter();
    return (
        <button onClick={() => router.back()} className="cv-btn-ghost">
            <ArrowLeft size={18} className="mr-2" /> Volver
        </button>
    );
}
