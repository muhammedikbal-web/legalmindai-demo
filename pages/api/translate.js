// pages/api/translate.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  const { textToTranslate } = req.body;

  if (!textToTranslate || textToTranslate.trim() === "") {
    return res.status(400).json({ error: "Çevrilecek metin belirtilmedi." });
  }

  let translatedText = "";
  let analysisResult = [];

  try {
    // Adım 1: İngilizce metni Türkçe'ye çevir
    const translationPrompt = `
      Aşağıdaki İngilizce hukuki metni Türkçe'ye çevir.
      Çeviriyi yaparken hukuki terimlerin doğru ve yerleşik karşılıklarını kullanmaya özen göster.
      Çeviriyi sadece verilen metinle sınırlı tut, ek yorum veya açıklama yapma.
      Çevrilen metnin orijinal paragraf ve satır yapısını koruyarak, okunabilirliği artırmak için metin içinde **mantıklı ve doğal satır sonları (\\n karakteri) kullan.** Her paragrafın veya anlam bütünlüğü olan cümlenin sonuna \\n koyarak çıktıyı formatla.
      `;

    const translateResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: `${translationPrompt}\n\n${textToTranslate}` }],
        temperature: 0.3,
      }),
    });

    const translateData = await translateResponse.json();

    if (translateData.error) {
      console.error("OpenAI API Çeviri Hatası:", translateData.error);
      return res.status(translateData.error.status || 500).json({ error: translateData.error.message || "OpenAI API'den çeviri sırasında beklenmeyen bir hata alındı." });
    }

    translatedText = translateData.choices?.[0]?.message?.content || "Çeviri alınamadı.";

    // Adım 2: Çevrilen Türkçe metni analyze.js'ye göndererek analiz et
    const analyzeApiUrl = process.env.NODE_ENV === 'production'
      ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}/api/analyze`
      : `http://localhost:3000/api/analyze`;

    const analyzeResponse = await fetch(analyzeApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contractText: translatedText }),
    });

    const analyzeData = await analyzeResponse.json();

    if (!analyzeResponse.ok) {
      console.error("Analyze API Hatası:", analyzeData.error);
      return res.status(analyzeResponse.status).json({ error: analyzeData.error || "Analiz API'sinden bir hata alındı." });
    }

    analysisResult = Array.isArray(analyzeData.analysisResult) ? analyzeData.analysisResult : [];

    res.status(200).json({ translatedText, analysisResult });

  } catch (error) {
    console.error("Genel sunucu hatası (translate.js):", error);
    res.status(500).json({ error: "Sunucu hatası: " + error.message });
  }
}