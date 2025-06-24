import { useState } from 'react';

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setAnalysisResult("⚠️ Lütfen analiz edilecek bir sözleşme metni girin.");
      return;
    }

    setLoading(true);
    setAnalysisResult("⏳ Analiz ediliyor...");

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: inputText })
      });

      const data = await response.json();

      if (data.result) {
        setAnalysisResult(data.result);
      } else if (data.error) {
        setAnalysisResult("⚠️ Hata: " + data.error);
      } else {
        setAnalysisResult("⚠️ Beklenmeyen bir durum oluştu.");
      }
    } catch (error) {
      setAnalysisResult("⚠️ İstek gönderilirken bir hata oluştu: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>📄 LegalMind AI - Sözleşme Analizi</h1>
      <textarea
        rows={10}
        style={{ width: '100%', padding: '1rem', fontSize: '16px', marginBottom: '1rem' }}
        placeholder="Lütfen analiz etmek istediğiniz sözleşme metnini buraya yapıştırın..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />
      <button
        onClick={handleAnalyze}
        style={{
          padding: '1rem 2rem',
          fontSize: '16px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        disabled={loading}
      >
        {loading ? "Analiz Ediliyor..." : "Analiz Et"}
      </button>
      <pre style={{ whiteSpace: 'pre-wrap', marginTop: '2rem', background: '#f4f4f4', padding: '1rem', borderRadius: '4px' }}>
        {analysisResult}
      </pre>
    </div>
  );
}
