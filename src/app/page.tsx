// Modified by Groq AI

'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Error al generar el código');
      }

      const data = await response.json();
      setResult(data.code || 'Código generado con éxito');
    } catch (err) {
      setError('Error al procesar la solicitud');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Code Generator</h1>
          <p className="text-gray-600">
            Describe la funcionalidad que necesitas y generaremos el código por ti
          </p>
        </header>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                Describe lo que necesitas
              </label>
              <textarea
                id="prompt"
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Ej: Crea un botón que muestre un mensaje de alerta al hacer clic"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${
                  isLoading || !prompt.trim()
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Generando...' : 'Generar Código'}
              </button>
            </div>
          </form>
        </div>

        {(result || error) && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {error ? 'Error' : 'Resultado'}
            </h2>
            
            {error ? (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                  {result}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
