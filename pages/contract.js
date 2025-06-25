import { useState } from "react";

export default function ContractPage() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contractText: inputText }),
      });

      const data = await res.json();
      setResult(data.result || "Cevap alınamadı.");
    } catch (err) {
      console.error(err);
      setResult("Bir hata oluştu.");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Sözleşme Analizi</h1>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Lütfen analiz etmek istediğiniz sözleşme metnini buraya yapıştırın..."
        className="w-full h-60 p-4 border border-gray-300 rounded-xl shadow mb-4"
      ></textarea>

      <button
        onClick={handleAnalyze}
        disabled={loading || !inputText.trim()}
        className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow hover:bg-blue-700 transition-all duration-300 disabled:opacity-50"
      >
        {loading ? "Analiz Ediliyor..." : "Analiz Et"}
      </button>

      {result && (
        <div className="mt-6 p-4 bg-white border border-gray-300 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">Analiz Sonucu:</h2>
          <pre className="whitespace-pre-wrap text-gray-800">{result}</pre>
        </div>
      )}
    </div>
  );
}

