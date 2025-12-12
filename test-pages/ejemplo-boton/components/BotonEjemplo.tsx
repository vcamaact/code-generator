'use client';

import { useState } from 'react';

export default function BotonEjemplo() {
  const [contador, setContador] = useState(0);
  const [mensaje, setMensaje] = useState('');

  const manejarClick = () => {
    const nuevoContador = contador + 1;
    setContador(nuevoContador);
    
    if (nuevoContador % 5 === 0) {
      setMensaje(`¡Has hecho clic ${nuevoContador} veces!`);
    } else {
      setMensaje('');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Componente de Ejemplo</h2>
      
      <button
        onClick={manejarClick}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      >
        Haz clic aquí ({contador})
      </button>
      
      {mensaje && (
        <div className="p-3 bg-green-100 text-green-700 rounded">
          {mensaje}
        </div>
      )}
      
      <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
        <p className="font-medium">¿Cómo usar este componente?</p>
        <ol className="list-decimal pl-5 mt-2 space-y-1">
          <li>Haz clic en el botón para incrementar el contador</li>
          <li>Cada 5 clics verás un mensaje especial</li>
          <li>¡Pruébalo tú mismo!</li>
        </ol>
      </div>
    </div>
  );
}
