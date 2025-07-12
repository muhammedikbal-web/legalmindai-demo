// pages/contract.js

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link'; // Navbar için Link'i ekledik

// Accordion bileşeni
const Accordion = ({ children }) => {
  const [openItem, setOpenItem] = useState(null);

  const toggleItem = (index) => {
    setOpenItem(openItem === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {React.Children.map(children, (child, index) => {
        return React.cloneElement(child, {
          isOpen: openItem === index,
          toggle: () => toggleItem(index),
          index: index, // child'a index prop'unu ekledik
        });
      })}
    </div>
  );
};

// AccordionItem bileşeni
const AccordionItem = ({ title, content, isOpen, toggle, status, index }) => {
  let statusColor = '';
  switch (status) {
    case 'Uygun':
      statusColor = 'text-green-600';
      break;
    case 'Riskli':
      statusColor = 'text-yellow-600';
      break;
    case 'Geçersiz':
      statusColor = 'text-red-600';
      break;
    default:
      statusColor = 'text-gray-600';
  }

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm">
      <button
        className="flex justify-between items-center w-full p-4 text-left font-medium text-lg text-gray-800 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 transition duration-150 ease-in-out rounded-lg"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${index}`}
      >
        <span className="flex-1">
          {title} <span className={`text-sm font-semibold ${statusColor}`}>({status})</span>
        </span>
        <svg
          className={`w-6 h-6 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && (
        <div id={`accordion-content-${index}`} className="p-4 pt-0 text-gray-700 bg-white">
          <div className="prose max-w-none">
            {content.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ContractAnalysis() {
  const [contractText, setContractText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeContract = async () => {
    setError('');
    setLoading(true);
    setAnalysisResult(null);

    if (!contractText.trim()) {
      setError('Lütfen analiz edilecek bir sözleşme metni girin.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractText }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Analiz sırasında bir hata oluştu.');
        return;
      }

      // API'den gelen sonucu doğru formatta set ediyoruz
      // API'den gelen data.analysisResult'ın bir dizi halinde olması bekleniyor
      setAnalysisResult(data.analysisResult);

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
        <title>LegalMind AI - Sözleşme Analizi</title>
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
      <main className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-r from-blue-50 to-white">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto w-full">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:rotate-3 sm:rounded-3xl"></div>
          <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
              Sözleşme Analizi
            </h1>
            <p className="text-gray-600 mb-8 text-center">
              Yapay zeka destekli LegalMind AI ile hukuki belgelerinizi hızlıca analiz edin.
            </p>

            {/* Metin Giriş Alanı */}
            <div className="mb-6">
              <label htmlFor="contractText" className="block text-gray-700 text-sm font-bold mb-2">
                Sözleşme Metni:
              </label>
              <textarea
                id="contractText"
                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y min-h-[200px]"
                placeholder="Sözleşme metnini buraya yapıştırın..."
                value={contractText}
                onChange={(e) => setContractText(e.target.value)}
              ></textarea>
            </div>

            {/* Analiz Butonu */}
            <div className="flex justify-center">
              <button
                onClick={analyzeContract}
                className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline transition duration-300 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                {loading ? 'Analiz Ediliyor...' : 'Sözleşmeyi Analiz Et'}
              </button>
            </div>

            {/* Hata Mesajı */}
            {error && (
              <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <p>{error}</p>
              </div>
            )}

            {/* Analiz Sonucu (Accordion içinde) */}
            {analysisResult && (
              <div className="mt-8">
                <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center">
                  Hukuki Analiz Sonucu:
                </h3>
                <Accordion>
                  {analysisResult.map((item, index) => (
                    <AccordionItem
                      key={index}
                      title={item.title}
                      content={item.explanation}
                      status={item.status} // API'den gelen status'ü AccordionItem'a iletiyoruz
                    />
                  ))}
                </Accordion>
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