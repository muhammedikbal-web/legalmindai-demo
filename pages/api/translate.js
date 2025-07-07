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
  let analysisResult = []; // analysisResult'ı başlangıçta boş dizi yapalım

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

    // Hukuki analiz için kullanılacak prompt (Markdown biçimlendirmeleri kaldırıldı)
    const analysisPrompt = `
      Aşağıdaki sözleşme metnindeki her bir maddeyi ayrı ayrı analiz ederek, Türk Hukuku mevzuatına göre uygunluğunu, risklerini veya geçersizliğini değerlendir.
      Her bir madde için aşağıdaki JSON objesi formatında bir çıktı oluştur ve tüm bu objeleri bir JSON dizisi (array) içine al.
      Sadece JSON çıktısı döndür, JSON dışında hiçbir açıklama, giriş veya çıkış cümlesi ekleme.

      JSON Objesi Yapısı:
      {
        "maddeNo": [madde numarası, örn: 1],
        "maddeBaslik": [varsa maddenin başlığı, yoksa boş string],
        "maddeIcerigi": [maddenin tam metni],
        "hukukiDegerlendirme": [Maddenin hukuki anlamını, olası risklerini, hukuka uygunluğunu veya aykırılığını detaylıca açıkla. Türk Hukukundaki yerini ve pratikteki sonuçlarını yorumla.],
        "uygunlukEtiketi": ["✅ Uygun Madde", "🟡 Riskli Madde", "🔴 Geçersiz Madde" etiketlerinden biri],
        "gerekce": [Etiketi neden seçtiğini, hukuki argümanlarla ve net bir dille açıkla.],
        "kanuniDayanak": [İlgili Kanun/Madde (örn: Türk Borçlar Kanunu m. 27), veya "Kanuni Dayanak Belirlenemedi" veya "Sözleşme Serbestisi İlkesi" gibi genel ilkeler],
        "yargiKarariOzeti": [İlgili Yargıtay/Danıştay kararı özeti ve numarası/tarihi. Yoksa "İlgili yargı kararı bulunamadı."],
        "onerilenRevizeMadde": [Riskli veya Geçersiz ise Türk hukukuna uygun revize edilmiş madde metni. Uygunsa "Revize gerekmiyor."]
      }

      Önemli Kurallar:
      1. Kanuni dayanakları doğru, spesifik ve tam olarak belirt. Emin değilsen genel ilke veya "Kanuni Dayanak Belirlenemedi" kullan.
      2. uygunlukEtiketi için yalnızca yukarıdaki 3 etiketi kullan.
      3. Çıktının tamamen geçerli bir JSON dizisi olduğundan emin ol.
      4. Analiz edilecek metin:
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
            content: "Sen bir hukuk uzmanısın. Kullanıcının verdiği sözleşme metnini maddelere ayırarak, her bir maddeyi Türk Hukuku'na göre detaylıca analiz et. Çıktıyı kesinlikle belirtilen JSON formatında ve sadece JSON olarak ver. JSON dışına hiçbir karakter veya metin ekleme."
          },
          { role: "user", content: `${analysisPrompt}\n${translatedText}` } // Prompt ile metni birleştir
        ],
        temperature: 0.2, // Analizde daha tutarlı ve kesin yanıtlar için sıcaklığı biraz daha düşürdük
        response_format: { type: "json_object" } // Modelden doğrudan JSON objesi istiyoruz
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