import { useState } from "react";

export default function ContractPage() {
  const [contractText, setContractText] = useState("");
  const [analysisResult, setAnalysisResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!contractText.trim()) return;
    setLoading(true);
    setAnalysisResult(""); // önceki sonucu temizle
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contractText }),
      });

      const data = await response.json();
      setAnalysisResult(data.result || "Cevap alınamadı.");
    } catch (error) {
      setAnalysisResult("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const renderResultCards = () => {
    if (!analysisResult) return null;

    const maddeler = analysisResult
      .split(/---+/)
      .map((block) => block.trim())
      .filter((block) => block);

    return (
      <div className="mt-6 space-y-6">
        {maddeler.map((madde, index) => {
          const isGeçersiz = madde.includes("🔴");
          const isRiskli = madde.includes("🟡");
          const isUygun = madde.includes("✅");

          const borderColor = isGeçersiz
            ? "border-red-600"
            : isRiskli
            ? "border-yellow-500"
            : "border-green-600";

          return (
            <div
              key={index}
              className={`bg-white border-l-4 ${borderColor} p-4 shadow-md rounded-xl whitespace-pre-line`}
            >
              <p className="text-gray-800">{madde}</p>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center text-blue-700">
        Sözleşme Analizi
      </h1>

      <textarea
        className="w-full h-48 p-4 border rounded resize-none shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
        placeholder="Sözleşme metnini buraya yapıştırın..."
        value={contractText}
        onChange={(e) => setContractText(e.target.value)}
      />

      <div className="text-center mt-4">
        <button
          onClick={handleAnalyze}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition-all"
        >
          Analiz Et
        </button>
      </div>

      {loading && (
        <p className="mt-4 text-center text-blue-600 font-medium animate-pulse">
          🔄 Analiz ediliyor, lütfen bekleyiniz...
        </p>
      )}

      {renderResultCards()}
    </div>
  );
}

