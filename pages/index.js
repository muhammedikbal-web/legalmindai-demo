
  
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="bg-[#0F172A] text-white py-6 shadow-md">
        <div className="container mx-auto px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">LegalMind AI</h1>
          <nav className="space-x-6 text-sm md:text-base">
           <Link href="/contract">
  <button className="bg-blue-600 text-white px-6 py-2 rounded-xl mt-6 shadow hover:bg-blue-700 transition-all duration-300">
    Hemen Analiz Et
  </button>
</Link>

            <Link href="/translation">Hukuki Çeviri</Link>
            <Link href="/blog">Makaleler</Link>
            <Link href="/about">Hakkımızda</Link>
          </nav>
        </div>
      </header>

      <section className="text-center py-24 px-6 bg-gradient-to-br from-blue-50 to-white">
        <h2 className="text-4xl font-bold mb-4">Hukuk ve Teknolojinin Kesişim Noktası</h2>
        <p className="text-lg text-gray-700 mb-6 max-w-2xl mx-auto">
          LegalMind AI, sözleşme analizleri ve yapay zeka destekli hukuk hizmetleriyle yeni nesil hukuk platformudur.
        </p>
        <Link href="/analyze">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition">
            Hemen Analiz Et
          </button>
        </Link>
      </section>

      <footer className="bg-[#0F172A] text-white text-center text-sm py-4">
        <p>LegalMind AI &copy; 2025 - Tüm hakları saklıdır.</p>
      </footer>
    </main>
  );
}
