export default function Ejemplo1() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Ejemplo 1: Contador</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-700 mb-4">
          Este es un ejemplo de un contador simple. Haz clic en el botón para incrementar el contador.
        </p>
        <div className="flex items-center space-x-4">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Incrementar
          </button>
          <span className="text-xl font-semibold">0</span>
        </div>
      </div>
    </div>
  );
}
