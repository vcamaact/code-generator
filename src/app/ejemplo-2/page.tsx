'use client';

export default function Ejemplo2() {
  const items = [
    'Primer elemento',
    'Segundo elemento',
    'Tercer elemento',
    'Cuarto elemento',
    'Quinto elemento'
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Ejemplo 2: Lista de Elementos</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Lista de Tareas</h2>
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="p-3 bg-gray-50 rounded hover:bg-gray-100">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
