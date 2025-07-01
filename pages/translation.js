import { useState } from "react"; // useState hook'unu ekliyoruz

export default function TranslationPage() {
  const [inputText, setInputText] = useState(""); // Kullanıcının gireceği İngilizce metin
  const [translatedText, setTranslatedText] = useState(""); // Çevrilmiş Türkçe metin
  const [loading, setLoading] = useState(false); // Yüklenme durumu için

  const handleTranslate = async () => {
    if (!inputText.trim()) return; // Metin boşsa işlem yapma

    setLoading(true); // Yükleniyor durumunu başlat

    // Çeviri prompt'umuz
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

    const fullTranslationPrompt = `${translationPrompt}\n\n${inputText}`; // Prompt ile kullanıcı metnini birleştir

    try {
      // /api/translate endpoint'ine istek göndereceğiz.
      // Henüz bu endpoint'i oluşturmadık, ama backend'de böyle bir endpoint olacağını varsayıyoruz.
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ textToTranslate: inputText, prompt: fullTranslationPrompt }),
      });

      const data = await res.json();
      setTranslatedText(data.result || "Çeviri alınamadı."); // Sonucu state'e kaydet
    } catch (err) {
      console.error(err);
      setTranslatedText("Çeviri sırasında bir hata oluştu."); // Hata durumunu yönet
    }

    setLoading(false); // Yükleniyor durumunu bitir
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Hukuki Çeviri</h1>

      <textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Lütfen çevirmek istediğiniz İngilizce sözleşme metnini buraya yapıştırın..."
        className="w-full h-60 p-4 border border-gray-300 rounded-xl shadow mb-4"
      ></textarea>

      <button
        onClick={handleTranslate}
        disabled={loading || !inputText.trim()}
        className="bg-purple-600 text-white px-6 py-2 rounded-xl shadow hover:bg-purple-700 transition-all duration-300 disabled:opacity-50"
      >
        {loading ? "Çevriliyor..." : "Çevir"}
      </button>

      {translatedText && (
        <div className="mt-6 p-4 bg-white border border-gray-300 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-2">Çeviri Sonucu:</h2>
          <pre className="whitespace-pre-wrap text-gray-800">{translatedText}</pre>
        </div>
      )}
    </div>
  );
}