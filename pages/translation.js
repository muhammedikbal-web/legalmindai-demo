// pages/translation.js

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link'; // Navbar için Link'i ekledik

export default function Translation() {
  const [textToTranslate, setTextToTranslate] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Çeviri için kullanılacak prompt (backend'deki ile uyumlu)
  const translationPrompt = `
    Aşağıdaki İngilizce hukuki metni Türkçe'ye çevir.
    Çeviriyi yaparken hukuki terimlerin doğru ve yerleşik karşılıklarını kullanmaya özen göster.
    Çeviriyi sadece verilen metinle sınırlı tut, ek yorum veya açıklama yapma.
    
    Çevrilen metnin **kesinlikle** orijinal paragraf ve satır yapısını koru.
    Her paragrafın sonunda ve mantıklı olan her cümlenin sonunda mutlaka bir satır sonu (\\n karakteri) kullan.
    Her bir cümlenin veya cümleciklerin bitiminde **derhal** yeni satıra geçerek metnin okunabilirliğini en üst düzeye çıkar.
    `;

  const handleTranslate = async () => {
    setError('');
    setLoading(true);
    setTranslatedText('');

    if (!textToTranslate.trim()) {
      setError('Lütfen çevrilecek bir metin girin.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textToTranslate: textToTranslate,
          prompt: translationPrompt, // Güncel çeviri prompt'unu kullan
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Çeviri sırasında bir hata oluştu.');
        return;
      }

      // Sadece çevrilmiş metni ayarla, analizle ilgili bir şey beklemiyoruz
      setTranslatedText(data.translatedText);

    } catch (err) {
      console.error('İstek gönderilirken hata:', err);
      setError('Sunucuya bağlanırken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-800">
      <Head>
        <title>LegalMind AI - Hukuki Çeviri</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navbar */}
      <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
        <h1 className="text-xl font-bold text-blue-700">LegalMind AI</h1>
        <div className="space-x-6">
          <Link href="/contract" className="hover:text-blue-700 font-medium">Sözleşme Analizi</Link>
          <Link href="/translation" className="hover:text-blue-700 font-medium">Hukuki Çeviri</Link>
          <Link href="/blog" className="hover:text-blue-700 font-medium">Makaleler</Link>
          <Link href="/about" className="hover:text-blue-700 font-medium">Hakkımızda</Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-r from-purple-50 to-white">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto w-full">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:rotate-3 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
              Hukuki Metin Çevirisi
            </h1>
            <p className="text-gray-600 mb-8 text-center">
              İngilizce hukuki metinlerinizi doğru ve hızlı bir şekilde Türkçe'ye çevirin.
            </p>

            {/* Metin Giriş Alanı */}
            <div className="mb-6">
              <label htmlFor="textToTranslate" className="block text-gray-700 text-sm font-bold mb-2">
                Çevrilecek İngilizce Metin:
              </label>
              <textarea
                id="textToTranslate"
                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y min-h-[150px]"
                placeholder="Çevrilecek İngilizce metni buraya yapıştırın..."
                value={textToTranslate}
                onChange={(e) => setTextToTranslate(e.target.value)}
              ></textarea>
            </div>

            {/* Çevir Butonu */}
            <div className="flex justify-center">
              <button
                onClick={handleTranslate}
                className={`bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline transition duration-300 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? 'Çevriliyor...' : 'Metni Çevir'}
              </button>
            </div>

            {/* Hata Mesajı */}
            {error && (
              <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <p>{error}</p>
              </div>
            )}

            {/* Çeviri Sonucu */}
            {translatedText && (
              <div className="mt-6 p-4 border rounded-md bg-purple-50">
                <h3 className="text-xl font-semibold text-purple-800 mb-3">Çeviri Sonucu:</h3>
                <p className="text-gray-800 whitespace-pre-wrap">{translatedText}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-4 text-center text-sm text-gray-500 border-t">
        LegalMind AI © 2025 - Tüm hakları saklıdır.
      </footer>
    </div>
  );
}