// pages/translation.js

import React, { useState } from 'react';
import Head from 'next/head';

export default function Translation() {
  const [textToTranslate, setTextToTranslate] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [analysisResult, setAnalysisResult] = useState([]); // Başlangıçta boş bir dizi olarak ayarlandı
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Çeviri için kullanılacak varsayılan prompt
  const defaultTranslationPrompt = `
    Aşağıdaki İngilizce hukuki metni Türkçe'ye çevir. Çeviriyi yaparken hukuki terimlerin doğru ve yerleşik karşılıklarını kullanmaya özen göster. Çeviriyi sadece verilen metinle sınırlı tut, ek yorum veya açıklama yapma.
    `;

  const handleTranslate = async () => {
    setError(''); // Her yeni çeviride hataları temizle
    setLoading(true);
    setTranslatedText(''); // Önceki çeviriyi temizle
    setAnalysisResult([]); // Önceki analizi temizle

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          textToTranslate: textToTranslate,
          prompt: defaultTranslationPrompt, // Varsayılan çeviri prompt'unu kullan
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Çeviri veya analiz sırasında bir hata oluştu.');
        return;
      }

      setTranslatedText(data.translatedText);

      // Backend'den gelen analysisResult'ı güvenli bir şekilde işleyelim
      try {
        let parsedResult = data.analysisResult;

        // Eğer backend'den hala string gelirse, parse etmeye çalış
        if (typeof data.analysisResult === 'string') {
          parsedResult = JSON.parse(data.analysisResult);
        }

        // Eğer parse sonrası hala array değilse veya null/undefined ise boş array kullan.
        setAnalysisResult(Array.isArray(parsedResult) ? parsedResult : []);

      } catch (parseError) {
        console.error("Frontend'de analiz sonucu ayrıştırılırken hata:", parseError);
        setError("Analiz sonucu görüntülenirken bir hata oluştu. Lütfen backend çıktısını kontrol edin.");
        setAnalysisResult([]); // Hata durumunda boş array ata
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
    switch (label.trim()) { // Trim kullanarak boşlukları temizle
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

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <Head>
        <title>LegalMind AI - Hukuki Metin Analizi</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-purple-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:rotate-3 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
            LegalMind AI
          </h1>
          <p className="text-gray-600 mb-8 text-center">
            Hukuki metinlerinizi çevirin ve Türk Hukuku'na göre analiz edin.
          </p>

          {/* Metin Giriş Alanı */}
          <div className="mb-6">
            <label htmlFor="textToTranslate" className="block text-gray-700 text-sm font-bold mb-2">
              Çevrilecek İngilizce Metin:
            </label>
            <textarea
              id="textToTranslate"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline resize-y min-h-[150px]"
              placeholder="Sözleşme maddesini buraya yapıştırın..."
              value={textToTranslate}
              onChange={(e) => setTextToTranslate(e.target.value)}
            ></textarea>
          </div>

          {/* Çevir ve Analiz Et Butonu */}
          <div className="flex justify-center">
            <button
              onClick={handleTranslate}
              className={`bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline transition duration-300 ease-in-out ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'İşleniyor...' : 'Çevir ve Analiz Et'}
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

          {/* Hukuki Analiz Sonucu (Accordion Yapısı) */}
          {analysisResult.length > 0 && (
            <div className="mt-8 p-4 border rounded-md bg-white shadow-sm">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Hukuki Analiz Sonucu:</h3>
              {analysisResult.map((item, index) => {
                const { color, icon } = getLabelStyle(item.uygunlukEtiketi || ''); // Etiket yoksa varsayılan döndür

                return (
                  <details
                    key={index}
                    className="mb-4 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                  >
                    <summary className="flex items-center justify-between p-4 cursor-pointer bg-white hover:bg-gray-100 transition-colors duration-200">
                      <span className="font-bold text-lg text-gray-900">
                        {item.maddeNo ? `Madde ${item.maddeNo}:` : `Madde ${index + 1}:`} {item.maddeBaslik || 'Başlıksız Madde'}
                      </span>
                      <span className={`font-semibold ${color} flex items-center`}>
                        {icon} {item.uygunlukEtiketi || 'Etiket Bilgisi Yok'}
                      </span>
                    </summary>
                    <div className="p-4 border-t border-gray-200 bg-white text-gray-800 text-base leading-relaxed">
                      {item.maddeIcerigi && (
                        <p className="mb-2">
                          <strong className="text-purple-700">Madde İçeriği:</strong>{' '}
                          <span className="whitespace-pre-wrap">{item.maddeIcerigi}</span>
                        </p>
                      )}
                      {item.hukukiDegerlendirme && (
                        <p className="mb-2">
                          <strong className="text-purple-700">Hukuki Değerlendirme:</strong>{' '}
                          <span className="whitespace-pre-wrap">{item.hukukiDegerlendirme}</span>
                        </p>
                      )}
                      {item.gerekce && (
                        <p className="mb-2">
                          <strong className="text-purple-700">Gerekçe:</strong>{' '}
                          <span className="whitespace-pre-wrap">{item.gerekce}</span>
                        </p>
                      )}
                      {item.kanuniDayanak && (
                        <p className="mb-2">
                          <strong className="text-purple-700">Kanuni Dayanak:</strong>{' '}
                          <span className="whitespace-pre-wrap">{item.kanuniDayanak}</span>
                        </p>
                      )}
                      {item.yargiKarariOzeti && (
                        <p className="mb-2">
                          <strong className="text-purple-700">İlgili Yargı Kararı Özeti:</strong>{' '}
                          <span className="whitespace-pre-wrap">{item.yargiKarariOzeti}</span>
                        </p>
                      )}
                      {item.onerilenRevizeMadde && (
                        <p className="mb-2">
                          <strong className="text-purple-700">Önerilen Revize Madde:</strong>{' '}
                          <span className="whitespace-pre-wrap">{item.onerilenRevizeMadde}</span>
                        </p>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}