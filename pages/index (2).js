import { useState } from 'react';

export default function Home() {
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysis(null);

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text })
    });

    const data = await response.json();
    setAnalysis(data.analysis || "Analiz yapılamadı.");
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1>LegalMind AI – Sözleşme Analiz Paneli</h1>
      <textarea
        placeholder="Sözleşme metnini buraya yapıştırın..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        style={{ width: "100%", marginTop: 10 }}
      />
      <button onClick={handleAnalyze} disabled={loading || !text} style={{ marginTop: 10 }}>
        {loading ? "Analiz ediliyor..." : "Analiz Et"}
      </button>
      {analysis && (
        <div style={{ backgroundColor: '#f0f0f0', padding: 15, marginTop: 20 }}>
          <pre>{analysis}</pre>
        </div>
      )}
    </div>
  );
}