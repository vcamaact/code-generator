import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-red-500 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-white">
                AI Code Generator
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            <a
              href="#"
              className="px-3 py-2 rounded-md text-sm font-medium text-white hover:text-white bg-green-500 hover:bg-green-700"
            >
              Inicio
            </a>
            <a
              href="#features"
              className="px-3 py-2 rounded-md text-sm font-medium text-white hover:text-white bg-green-500 hover:bg-green-700"
            >
              Características
            </a>
            <a
              href="#how-it-works"
              className="px-3 py-2 rounded-md text-sm font-medium text-white hover:text-white bg-green-500 hover:bg-green-700"
            >
              Cómo funciona
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
