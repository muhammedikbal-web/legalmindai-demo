import { useState } from "react";

export default function ContractPage() {
  const [contractText, setContractText] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");

  const handleAnalyze = async () => {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contractText }),
    });

    const data = await response.json();
    setAnalysisResult(data.result || "Cevap alınamadı.");
  };

  const renderResultCards = () => {
    if (!analysisResult) return null;

    const paragraphs = analysisResult.split("\n\n");

    return (
      <div className="mt-6 space-y-4">
        {paragraphs.map((para, index) => (
          <div
            key={index}
            className="bg-white border-l-4 border-blue-600 p-4 shadow rounded-xl"
          >
            <p className="text-gray-800 whitespace-pre-line">{para}</p>
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
          Analiz Et
        </button>
      </div>

      {renderResultCards()}
    </div>
  );
}
