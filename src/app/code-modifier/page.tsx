'use client';

import { useState } from 'react';
import { CheckCircleIcon, XCircleIcon, CodeBracketIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ModificationResult {
    file: string;
    explanation: string;
}

interface ApiResponse {
    success: boolean;
    branch: string;
    filesModified: string[];
    modifications: ModificationResult[];
    commitHash?: string;
    pushed?: boolean;
    analysis: {
        intent: string;
        changes: string;
    };
    error?: string;
}

export default function CodeModifierPage() {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ApiResponse | null>(null);
    const [error, setError] = useState('');
    const [autoCommit, setAutoCommit] = useState(true);
    const [autoPush, setAutoPush] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await fetch('/api/code-modify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    autoCommit,
                    autoPush,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al modificar el código');
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Error al procesar la solicitud');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <header className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <CodeBracketIcon className="w-12 h-12 text-indigo-600" />
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Code Modifier AI
                        </h1>
                    </div>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Describe los cambios que necesitas y la IA modificará tu código automáticamente,
                        creando una rama, commiteando y pusheando los cambios.
                    </p>
                </header>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="prompt" className="block text-sm font-semibold text-gray-700 mb-3">
                                Describe los cambios que necesitas
                            </label>
                            <textarea
                                id="prompt"
                                rows={6}
                                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 resize-none"
                                placeholder="Ej: Agrega un nuevo componente Button en src/components que tenga variantes primary, secondary y outline. Debe tener props para size (small, medium, large) y disabled."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex gap-6 items-center p-4 bg-gray-50 rounded-xl">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={autoCommit}
                                    onChange={(e) => setAutoCommit(e.target.checked)}
                                    disabled={isLoading}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                                    Auto-commit
                                </span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={autoPush}
                                    onChange={(e) => setAutoPush(e.target.checked)}
                                    disabled={isLoading || !autoCommit}
                                    className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                                />
                                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                                    Auto-push
                                </span>
                            </label>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading || !prompt.trim()}
                                className={`px-8 py-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center gap-2 shadow-lg ${isLoading || !prompt.trim()
                                        ? 'bg-indigo-400 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transform hover:-translate-y-0.5'
                                    }`}
                            >
                                {isLoading ? (
                                    <>
                                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <CodeBracketIcon className="w-5 h-5" />
                                        Modificar Código
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-start gap-3">
                            <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-900 mb-1">Error</h3>
                                <p className="text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
                        {/* Success Header */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
                            <div className="flex items-start gap-3">
                                <CheckCircleIcon className="w-8 h-8 text-green-600 flex-shrink-0" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-green-900 mb-2">
                                        ¡Cambios aplicados con éxito!
                                    </h3>
                                    <p className="text-green-700 mb-4">{result.analysis.intent}</p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-white/60 rounded-lg p-3">
                                            <p className="text-xs font-medium text-gray-500 mb-1">Rama creada</p>
                                            <p className="font-mono text-sm text-gray-900 break-all">{result.branch}</p>
                                        </div>

                                        {result.commitHash && (
                                            <div className="bg-white/60 rounded-lg p-3">
                                                <p className="text-xs font-medium text-gray-500 mb-1">Commit</p>
                                                <p className="font-mono text-sm text-gray-900">{result.commitHash.substring(0, 8)}</p>
                                            </div>
                                        )}

                                        <div className="bg-white/60 rounded-lg p-3">
                                            <p className="text-xs font-medium text-gray-500 mb-1">Estado Push</p>
                                            <p className={`text-sm font-semibold ${result.pushed ? 'text-green-600' : 'text-orange-600'}`}>
                                                {result.pushed ? '✓ Pusheado' : '× No pusheado'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Files Modified */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                Archivos Modificados ({result.filesModified.length})
                            </h3>

                            <div className="space-y-3">
                                {result.modifications.map((mod, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100"
                                    >
                                        <div className="flex items-start gap-3">
                                            <CodeBracketIcon className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-mono text-sm font-semibold text-indigo-900 mb-1 break-all">
                                                    {mod.file}
                                                </p>
                                                <p className="text-sm text-gray-700">{mod.explanation}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Analysis Details */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900 mb-3">Análisis de Cambios</h3>
                            <p className="text-gray-700 leading-relaxed">{result.analysis.changes}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
