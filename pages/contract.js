import { useState } from "react";

export default function ContractPage() {
  const [contractText, setContractText] = useState("");
  const [analysisResult, setAnalysisResult] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysisResult([]);

    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contractText }),
    });

    const data = await response.json();
    setIsLoading(false);
    setAnalysisResult(data.result || []);
  };

  const renderResultCards = () => {
    if (!analysisResult.length) return null;

    return (
      <div className="mt-6 space-y-4">
        {analysisResult.map((item, index) => {
          const { madde, durum, gerekce, açıklama } = item;
          const cardColor = durum === "Riskli" ? "bg-red-100" : durum === "Uygun" ? "bg-green-100" : "bg-yellow-100";

          return (
            <div
              key={index}
              className={`p-4 shadow rounded-xl ${cardColor} border-l-4 ${durum === "Riskli" ? "border-red-600" : durum === "Uygun" ? "border-green-600" : "border-yellow-600"}`}
            >
              <h2 className="text-blue-700 font-bold mb-2">{madde}</h2>
              <p className="text-gray-800 font-semibold">{durum}</p>
              <p className="text-gray-600">{gerekce}</p>
              <p className="text-gray-800 whitespace-pre-line mt-2">{açıklama}</p>
            </div>
          );
        })}
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
          disabled={isLoading}
        >
          {isLoading ? "Analiz ediliyor..." : "Analiz Et"}
        </button>
      </div>

      {isLoading && (
        <p className="mt-4 text-center text-blue-600 font-medium animate-pulse">
          Lütfen bekleyin, sözleşme analiz ediliyor...
        </p>
      )}

      {renderResultCards()}
    </div>
  );
}
