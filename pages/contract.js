// pages/contract.js

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link'; // Navbar için Link'i ekledik

export default function ContractPage() {
  const [inputText, setInputText] = useState('');
  const [analysisResult, setAnalysisResult] = useState([]); // Array olarak bekliyoruz
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeAccordion, setActiveAccordion] = useState(null); // Akordiyonun açık/kapalı durumu için

  const handleAnalyze = async () => {
    setError('');
    setAnalysisResult([]); // Her yeni analizde önceki sonuçları temizle
    setActiveAccordion(null); // Akordiyonları kapat
    setLoading(true);

    if (!inputText.trim()) {
      setError('Lütfen analiz etmek istediğiniz sözleşme metnini girin.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractText: inputText }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Analiz sırasında bir hata oluştu.');
        return;
      }

      // API'den gelen veriyi doğrudan set ediyoruz, çünkü zaten JSON array olarak geliyor
      // Önemli: API'den gelen yanıtın yapısı { analysisResult: [...] } şeklinde olmalı
      if (data.analysisResult && Array.isArray(data.analysisResult)) {
        setAnalysisResult(data.analysisResult);
      } else {
        setError('Beklenmeyen analiz sonucu formatı. Lütfen API çıktısını kontrol edin.');
        setAnalysisResult([]);
      }

    } catch (err) {
      console.error('İstek gönderilirken hata:', err);
      setError('Sunucuya bağlanırken bir sorun oluştu. Lütfen daha sonra tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Madde uygunluk etiketine göre renk ve ikon döndüren yardımcı fonksiyon
  const getLabelStyle = (label) => {
    switch (label.trim()) {
      case '✅ Uygun Madde':
        return { color: 'text-green-600', icon: '✅' };
      case '🟡 Riskli Madde':
        return { color: 'text-yellow-600', icon: '🟡' };
      case '🔴 Geçersiz Madde':
        return { color: 'text-red-600', icon: '🔴' };
      default:
        return { color: 'text-gray-700', icon: '❓' };
    }
  };

  // Akordiyon açma/kapama işlevi
  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
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
              Sözleşme metinlerinizi Türk Hukuku'na göre detaylı bir şekilde analiz edin.
            </p>

            {/* Metin Giriş Alanı */}
            <div className="mb-6">
              <label htmlFor="inputText" className="block text-gray-700 text-sm font-bold mb-2">
                Analiz Edilecek Sözleşme Metni:
              </label>
              <textarea
                id="inputText"
                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y min-h-[200px]"
                placeholder="Sözleşme metnini buraya yapıştırın..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              ></textarea>
            </div>

            {/* Analiz Et Butonu */}
            <div className="flex justify-center">
              <button
                onClick={handleAnalyze}
                className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline transition duration-300 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading || !inputText.trim()}
              >
                {loading ? 'Analiz Ediliyor...' : 'Analiz Et'}
              </button>
            </div>

            {/* Hata Mesajı */}
            {error && (
              <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <p>{error}</p>
              </div>
            )}

            {/* Hukuki Analiz Sonucu (Accordion Yapısı) */}
            {analysisResult.length > 0 && (
              <div className="mt-8 p-4 border rounded-md bg-white shadow-sm">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Hukuki Analiz Sonucu:</h3>
                {analysisResult.map((item, index) => {
                  const { color, icon } = getLabelStyle(item.uygunlukEtiketi || '');

                  return (
                    <div
                      key={index}
                      className="mb-4 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                    >
                      <button
                        className="flex items-center justify-between w-full p-4 cursor-pointer bg-white hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
                        onClick={() => toggleAccordion(index)}
                      >
                        <span className="font-bold text-lg text-gray-900 text-left">
                          {item.maddeNo ? `Madde ${item.maddeNo}:` : `Madde ${index + 1}:`}{' '}
                          {item.maddeBaslik || 'Başlıksız Madde'}
                        </span>
                        <span className={`font-semibold ${color} flex items-center`}>
                          {icon} {item.uygunlukEtiketi || 'Etiket Bilgisi Yok'}
                        </span>
                      </button>
                      {activeAccordion === index && (
                        <div className="p-4 border-t border-gray-200 bg-white text-gray-800 text-base leading-relaxed">
                          {item.maddeIcerigi && (
                            <p className="mb-2">
                              <strong className="text-blue-700">Madde İçeriği:</strong>{' '}
                              <span className="whitespace-pre-wrap">{item.maddeIcerigi}</span>
                            </p>
                          )}
                          {item.hukukiDegerlendirme && (
                            <p className="mb-2">
                              <strong className="text-blue-700">Hukuki Değerlendirme:</strong>{' '}
                              <span className="whitespace-pre-wrap">{item.hukukiDegerlendirme}</span>
                            </p>
                          )}
                          {item.gerekce && (
                            <p className="mb-2">
                              <strong className="text-blue-700">Gerekçe:</strong>{' '}
                              <span className="whitespace-pre-wrap">{item.gerekce}</span>
                            </p>
                          )}
                          {item.kanuniDayanak && (
                            <p className="mb-2">
                              <strong className="text-blue-700">Kanuni Dayanak:</strong>{' '}
                              <span className="whitespace-pre-wrap">{item.kanuniDayanak}</span>
                            </p>
                          )}
                          {item.yargiKarariOzeti && (
                            <p className="mb-2">
                              <strong className="text-blue-700">İlgili Yargı Kararı Özeti:</strong>{' '}
                              <span className="whitespace-pre-wrap">{item.yargiKarariOzeti}</span>
                            </p>
                          )}
                          {item.onerilenRevizeMadde && (
                            <p className="mb-2">
                              <strong className="text-blue-700">Önerilen Revize Madde:</strong>{' '}
                              <span className="whitespace-pre-wrap">{item.onerilenRevizeMadde}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
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