'use client';

import { useState } from 'react';
import { updateAthleteProfile } from '@/lib/actions';

export default function DiagsPage() {
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [clientId, setClientId] = useState('');

    const runTest = async () => {
        setLoading(true);
        try {
            const data = {
                oneRmStats: { snatch: 100, cnj: 100, backSquat: 100 }, // Simple test payload
                testTimestamp: new Date().toISOString()
            };

            console.log('Running test with clientId:', clientId);
            const res = await updateAthleteProfile(clientId, data);
            setResult(res);
        } catch (err: any) {
            console.error('Test failed:', err);
            setResult({ error: err.message, stack: err.stack });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Diagnostics: Save Functionality</h1>

            <div className="mb-4">
                <label className="block mb-2">Client ID (UUID)</label>
                <input
                    className="border p-2 w-full rounded text-black"
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    placeholder="e.g. 507f9436-6655-45db-9c5d-39107f453f59"
                />
            </div>

            <button
                onClick={runTest}
                disabled={loading || !clientId}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
                {loading ? 'Running...' : 'Run Update Test'}
            </button>

            {result && (
                <div className="mt-8 p-4 bg-gray-100 rounded border overflow-auto">
                    <h3 className="font-bold mb-2 text-black">Result:</h3>
                    <pre className="text-sm text-black whitespace-pre-wrap">
                        {JSON.stringify(result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
