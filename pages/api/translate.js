// pages/api/translate.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  const { textToTranslate, prompt: translationPrompt } = req.body;

  if (!textToTranslate || textToTranslate.trim() === "") {
    return res.status(400).json({ result: "Çevrilecek metin belirtilmedi." });
  }

  let translatedText = "";
  let analysisResult = [];

  try {
    // Adım 1: İngilizce metni Türkçe'ye çevir
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
    translatedText = translateData.choices?.[0]?.message?.content || "Çeviri alınamadı.";

    // Hukuki analiz için kullanılacak prompt (En son ve en agresif hali)
    const analysisPrompt = `
      Sen, sözleşme maddelerini Türk Hukuku'na göre detaylıca analiz eden bir uzmansın.
      Aşağıdaki sözleşme metnini her bir "Madde X" veya benzeri ifadeyi ayrı bir madde olarak kabul ederek **tek tek ve tam metinleriyle analiz et.**
      Analiz sonucunu, her bir maddenin aşağıdaki kesin JSON objesi formatında olduğu bir JSON dizisi (array) olarak döndür.
      
      **Çok Önemli Kurallar:**
      1. Çıktı, **sadece ve sadece geçerli bir JSON dizisi olmalı.** JSON dışında hiçbir harf, sayı, kelime, cümle, başlık veya açıklama ekleme.
      2. JSON içindeki tüm metin alanları (maddeIcerigi, hukukiDegerlendirme, gerekce, yargiKarariOzeti, onerilenRevizeMadde), **mantıklı ve okunabilir satır sonları (\\n) içermeli.** Bu, metinlerin daha düzgün görünmesini sağlayacak.
      3. Her maddeyi ayrı bir JSON objesi olarak işle. Metindeki tüm maddeler JSON çıktısında yer almalı.
      4. Kanuni Dayanak için: Doğru, spesifik ve tam kanun maddesi (örn: Türk Borçlar Kanunu m. 27). Emin değilsen "Kanuni Dayanak Belirlenemedi" veya ilgili hukuki ilke (örn: Sözleşme Serbestisi İlkesi) kullan. Asla yanlış madde verme.
      5. Uygunluk Etiketi için sadece: "✅ Uygun Madde", "🟡 Riskli Madde", "🔴 Geçersiz Madde" etiketlerinden birini kullan.

      **JSON Objesi Yapısı:**
      {
        "maddeNo": [madde numarası, örn: 1 veya string olarak "Hizmet Sözleşmesi"],
        "maddeBaslik": [varsa maddenin başlığı, yoksa boş string],
        "maddeIcerigi": [maddenin tam metni ve içinde satır sonları olmalı],
        "hukukiDegerlendirme": [Detaylı hukuki değerlendirme ve içinde satır sonları olmalı],
        "uygunlukEtiketi": ["✅ Uygun Madde", "🟡 Riskli Madde", "🔴 Geçersiz Madde" etiketlerinden biri],
        "gerekce": [Gerekçe ve içinde satır sonları olmalı],
        "kanuniDayanak": [İlgili Kanun/Madde (örn: Türk Borçlar Kanunu m. 27), veya "Kanuni Dayanak Belirlenemedi" veya "Sözleşme Serbestisi İlkesi" gibi genel ilkeler],
        "yargiKarariOzeti": [İlgili Yargıtay/Danıştay kararı özeti ve numarası/tarihi. Yoksa "İlgili yargı kararı bulunamadı." ve içinde satır sonları olmalı],
        "onerilenRevizeMadde": [Riskli veya Geçersiz ise Türk hukukuna uygun revize edilmiş madde metni. Uygunsa "Revize gerekmiyor." ve içinde satır sonları olmalı]
      }

      Analiz edilecek sözleşme metni:
      `;

    // Adım 2: Çevrilen Türkçe metni analiz et
    const analyzeResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Senin görevin, kullanıcının verdiği sözleşme metnini maddelere ayırarak, her bir maddeyi Türk Hukuku'na göre detaylıca analiz etmek ve çıktıyı kesinlikle belirtilen JSON formatında, hiçbir ek karakter veya metin olmadan döndürmektir."
          },
          { role: "user", content: `${analysisPrompt}\n${translatedText}` }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
    });

    const analyzeData = await analyzeResponse.json();

    try {
        let rawAnalysisContent = analyzeData.choices?.[0]?.message?.content;

        if (typeof rawAnalysisContent === 'string') {
            analysisResult = JSON.parse(rawAnalysisContent);
        } else if (typeof rawAnalysisContent === 'object' && rawAnalysisContent !== null) {
            analysisResult = rawAnalysisContent;
        } else {
            analysisResult = [];
            console.warn("Modelden gelen analiz sonucu beklenen formatta değil (boş/tanımsız):", rawAnalysisContent);
        }

        // Gelen JSON'un bir dizi olduğundan emin olalım.
        // Eğer model tek bir obje döndürürse, onu diziye saralım.
        if (!Array.isArray(analysisResult)) {
            if (typeof analysisResult === 'object' && analysisResult !== null && Object.keys(analysisResult).length > 0) {
                analysisResult = [analysisResult];
            } else {
                analysisResult = [];
            }
        }

    } catch (parseError) {
        console.error("Analiz sonucu ayrıştırılırken veya işlenirken hata:", parseError);
        analysisResult = [];
    }
    
    res.status(200).json({ translatedText, analysisResult });

  } catch (error) {
    console.error("Backend genel hata:", error);
    res.status(500).json({ error: "Sunucu hatası: " + error.message });
  }
}