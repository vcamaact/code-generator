'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Inicio', path: '/' },
    { name: 'Code Modifier', path: '/code-modifier' },
    { name: 'Ejemplo 1', path: '/ejemplo-1' },
    { name: 'Ejemplo 2', path: '/ejemplo-2' },
    { name: 'Ejemplo 3', path: '/ejemplo-3' },
  ];

  return (
    <nav className="bg-red-500 shadow-sm mb-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${pathname === item.path
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-white hover:border-gray-300 hover:text-gray-200'
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}