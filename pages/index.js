import Head from 'next/head'
import { useState } from 'react'

export default function Home() {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');

  const analyze = async () => {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    setResult(data.result);
  }

  return (
    <div style={{ padding: 40 }}>
      <Head>
        <title>LegalMind AI Demo</title>
      </Head>
      <h1>LegalMind AI - Sözleşme Analizi</h1>
      <textarea value={text} onChange={e => setText(e.target.value)} rows={10} cols={80} />
      <br />
      <button onClick={analyze}>Analiz Et</button>
      <h3>Sonuç:</h3>
      <pre>{result}</pre>
    </div>
  );
}
