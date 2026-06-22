import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-emerald-600">
              EchoLodge
            </Link>
          </div>
          <div className="flex space-x-6">
            <Link href="/" className="text-gray-600 hover:text-emerald-600 font-medium">Home</Link>
            <Link href="/about" className="text-gray-600 hover:text-emerald-600 font-medium">About</Link>
            <Link href="/dashboard" className="text-gray-600 hover:text-emerald-600 font-medium">Dashboard</Link>
            <Link href="/login" className="text-gray-600 hover:text-emerald-600 font-medium">Login</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}