import { useState } from 'react';

export default function Home() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input }),
    });
    const data = await response.json();
    setResult(data.result);
    setLoading(false);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>LegalMind AI Demo</h1>
      <textarea
        rows={10}
        cols={80}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Sözleşme metnini buraya yapıştırın..."
      />
      <br />
      <button onClick={analyze} disabled={loading}>
        {loading ? 'Analiz ediliyor...' : 'Analiz Et'}
      </button>
      <pre>{result}</pre>
    </div>
  );
}