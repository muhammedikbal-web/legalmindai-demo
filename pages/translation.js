import { useState } from "react";

export default function TranslationPage() {
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [analysisResult, setAnalysisResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(""); // Hata mesajları için

  const handleTranslateAndAnalyze = async () => {
    if (!inputText.trim()) {
      setError("Lütfen çevrilecek metni girin.");
      return;
    }

    setLoading(true);
    setTranslatedText(data.translatedText);
try {
    // API'den gelen analysisResult'ın doğru bir array olduğundan emin olalım
    // Eğer API'den null veya undefined gelirse, boş bir array atarız.
    // Eğer hala bir string gelirse, parse etmeye çalışırız.
    let parsedResult = data.analysisResult;
    if (typeof data.analysisResult === 'string') {
        parsedResult = JSON.parse(data.analysisResult);
    }

    // Eğer parse sonrası hala array değilse veya null ise boş array kullan.
    setAnalysisResult(Array.isArray(parsedResult) ? parsedResult : []);

} catch (parseError) {
    console.error("Frontend'de analiz sonucu ayrıştırılırken hata:", parseError);
    setAnalysisResult([]); // Hata durumunda boş array ata
}
    setAnalysisResult(""); // Önceki analiz sonuçlarını temizle
    setError("");

    const translationPrompt = `
      You are an expert legal translator specializing in Turkish legal terminology. Your task is to accurately and precisely translate the following English service agreement, which is prepared in accordance with Turkish Law, into Turkish.

      Key Rules for Translation:
      - Maintain the original structure of the agreement, including article numbers, headings, and sub-sections.
      - Use precise and formal Turkish legal terminology. Do not use colloquial or informal language.
      - Ensure that the translated text accurately reflects the legal meaning and intent of the original English text under Turkish Law.
      - If a direct equivalent legal term does not exist, use the closest appropriate Turkish legal term or phrase, ensuring clarity.
      - Do not add any analysis, comments, or additional information. Only provide the translated text.

      Below is the Service Agreement to be translated:
      `;

    try {
      const res = await fetch("/api/translate", { // `/api/translate` endpoint'ine tek istek
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ textToTranslate: inputText, prompt: translationPrompt }),
      });

      const data = await res.json();

      if (res.ok) { // İstek başarılıysa
        setTranslatedText(data.translatedText); // Çevrilen metni al
        setAnalysisResult(data.analysisResult); // Analiz sonucunu al
      } else {
        setError(data.error || "Beklenmedik bir hata oluştu.");
      }
    } catch (err) {
      console.error(err);
      setError("Sunucuya bağlanırken bir hata oluştu.");
    }

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-purple-800">Hukuki Çeviri ve Otomatik Analiz</h1>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Lütfen çevirmek ve analiz etmek istediğiniz İngilizce sözleşme metnini buraya yapıştırın..."
        className="w-full h-60 p-4 border border-gray-300 rounded-xl shadow-inner focus:ring-2 focus:ring-purple-200 outline-none transition-all duration-200 mb-4 text-lg"
      ></textarea>

      <button
        onClick={handleTranslateAndAnalyze}
        disabled={loading || !inputText.trim()}
        className="bg-purple-600 text-white px-8 py-3 rounded-xl shadow-lg hover:bg-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
      >
        {loading ? "Çevriliyor ve Analiz Ediliyor..." : "Çevir ve Analiz Et"}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {loading && (
          <div className="mt-6 text-center text-purple-600 text-lg">
              Yükleniyor, lütfen bekleyiniz...
          </div>
      )}

      {!loading && translatedText && (
        <div className="mt-8 p-6 bg-white border border-gray-200 rounded-xl shadow-xl">
          <h2 className="text-2xl font-semibold mb-4 text-purple-700">Çeviri Sonucu:</h2>
          <pre className="whitespace-pre-wrap text-gray-800 text-base leading-relaxed">{translatedText}</pre>
        </div>
      )}

      {analysisResult.length > 0 && (
    <div className="mt-4 p-4 border rounded-md bg-gray-50">
        <h3 className="text-lg font-semibold mb-2">Hukuki Analiz Sonucu:</h3>
        {/* Geçici olarak, sadece analysisResult'ın string'e dönüştürülmüş halini gösterelim */}
        {/* Bu, array gelse de, string gelse de hata vermez. */}
        <pre>{JSON.stringify(analysisResult, null, 2)}</pre>
        {/* Veya daha basit: <pre>{String(analysisResult)}</pre> */}
    </div>
)}
  
