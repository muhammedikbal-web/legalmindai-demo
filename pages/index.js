import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleUpload = (e) => {
    setFile(e.target.files[0]);
  };

  const handleAnalyze = () => {
    setResult({
      title: "Madde 8 – Ceza Koşulu",
      risk: "🟡 Orta Risk",
      explanation: "Gecikme cezası kısa süreli gecikme için yüksek olabilir. TBK m. 179-182 gereği mahkeme indirimi uygulanabilir.",
      suggestion: "Ceza oranı %5'e çekilmeli, süre uzatılabilir."
    });
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>LegalMind AI – Sözleşme Analiz Paneli</h1>
      <input type="file" accept=".docx,.pdf" onChange={handleUpload} />
      <button onClick={handleAnalyze} disabled={!file} style={{ marginTop: 10 }}>
        Analiz Et
      </button>
      {result && (
        <div style={{ backgroundColor: '#fffbe6', padding: 15, marginTop: 20 }}>
          <h2>🔍 {result.title}</h2>
          <p><strong>Risk Durumu:</strong> {result.risk}</p>
          <p><strong>Açıklama:</strong> {result.explanation}</p>
          <p><strong>Öneri:</strong> {result.suggestion}</p>
        </div>
      )}
    </div>
  );
}