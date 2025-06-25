
import { useState } from "react";

export default function ContractPage() {
  const [contractText, setContractText] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    setAnalysisResult("Analiz ediliyor, lütfen bekleyiniz...");

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contractText }),
    });

    const data = await response.json();
    setLoading(false);
    setAnalysisResult(data.result || "Cevap alınamadı.");
  };

  const renderResultCards = () => {
    if (!analysisResult || loading) return null;

    // Her maddeyi "Madde 1:" ile başlayan bloklara ayır
    const items = analysisResult.split(/(?=Madde \d+:)/g);

    return (
      <div className="mt-6 space-y-6">
        {items.map((item, index) => (
          <div
            key={index}
            className="bg-white border-l-4 border-blue-600 p-4 shadow rounded-xl whitespace-pre-line"
          >
            {item.trim()}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">Sözleşme Analizi</h1>
      <textarea
        className="w-full h-48 p-4 border rounded resize-none shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Sözleşme metnini buraya yapıştırın..."
        value={contractText}
        onChange={(e) => setContractText(e.target.value)}
      />
      <div className="text-center">
        <button
          onClick={handleAnalyze}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition-all"
        >
          {loading ? "Analiz Ediliyor..." : "Analiz Et"}
        </button>
      </div>

      {renderResultCards()}
    </div>
  );
}

