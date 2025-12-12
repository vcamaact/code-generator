import BotonEjemplo from './components/BotonEjemplo';

export default function PaginaEjemplo() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Página de Prueba
          </h1>
          <p className="text-gray-600">
            Este es un ejemplo de un componente generado con IA
          </p>
        </div>
        
        <div className="space-y-8">
          <BotonEjemplo />
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Código del Componente</h2>
            <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto text-sm">
              {`'use client';

import { useState } from 'react';

export default function BotonEjemplo() {
  const [contador, setContador] = useState(0);
  const [mensaje, setMensaje] = useState('');

  const manejarClick = () => {
    const nuevoContador = contador + 1;
    setContador(nuevoContador);
    
    if (nuevoContador % 5 === 0) {
      setMensaje(\`¡Has hecho clic \${nuevoContador} veces!\`);
    } else {
      setMensaje('');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Componente de Ejemplo</h2>
      
      <button
        onClick={manejarClick}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Haz clic aquí ({\${contador}})
      </button>
      
      {mensaje && (
        <div className="p-3 bg-green-100 text-green-700 rounded">
          {mensaje}
        </div>
      )}
    </div>
  );
}`}
            </pre>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h2 className="text-xl font-semibold mb-3 text-blue-800">¿Cómo probar este ejemplo?</h2>
            <ol className="list-decimal pl-5 space-y-2 text-blue-900">
              <li>Haz clic en el botón para ver cómo aumenta el contador</li>
              <li>Cada 5 clics aparecerá un mensaje especial</li>
              <li>El contador se reinicia al actualizar la página</li>
              <li>Puedes copiar el código y usarlo en tu proyecto</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
