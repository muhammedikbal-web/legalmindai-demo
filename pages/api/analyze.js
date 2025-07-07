// pages/api/analyze.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  const { contractText } = req.body;

  if (!contractText || contractText.trim() === "") {
    return res.status(400).json({ error: "Sözleşme metni belirtilmedi." }); // Hata mesajı formatını tutarlı yapalım
  }

  let analysisResult = []; // Başlangıçta boş bir dizi olarak ayarlandı

  try {
    // Hukuki analiz için kullanılacak prompt
    const prompt = `
      Sen Türk Hukuku konusunda uzman, çözüm odaklı bir yapay zeka hukuk danışmanısın.
      Aşağıda verilen sözleşme metnindeki her bir "Madde X" veya benzeri ifadeyi ayrı bir madde olarak kabul ederek tek tek ve tam metinleriyle analiz et.
      Analiz sonucunu, her bir maddenin aşağıdaki kesin JSON objesi formatında olduğu bir JSON dizisi (array) olarak döndür.
      
      **Çok Önemli Kurallar:**
      1. Çıktı, **sadece ve sadece geçerli bir JSON dizisi olmalı.** JSON dışında hiçbir harf, sayı, kelime, cümle, başlık veya açıklama ekleme.
      2. JSON içindeki tüm metin alanları ("maddeIcerigi", "hukukiDegerlendirme", "gerekce", "yargiKarariOzeti", "onerilenRevizeMadde"), **mantıklı ve okunabilir satır sonları (\\n) içermeli.** Bu, metinlerin daha düzgün görünmesini sağlayacak.
      3. Her maddeyi ayrı bir JSON objesi olarak işle. Metindeki tüm maddeler JSON çıktısında yer almalı.
      4. Kanuni Dayanak için: Doğru, spesifik ve tam kanun maddesi (örn: Türk Borçlar Kanunu m. 27). Emin değilsen "Kanuni Dayanak Belirlenemedi" veya ilgili hukuki ilke (örn: Sözleşme Serbestisi İlkesi) kullan. Asla yanlış madde verme.
      5. Uygunluk Etiketi için sadece: "✅ Uygun Madde", "🟡 Riskli Madde", "🔴 Geçersiz Madde" etiketlerinden birini kullan.

      **JSON Objesi Yapısı (Her madde için bir obje):**
      [
        {
          "maddeNo": [madde numarası, örn: 1 veya string olarak "Giriş"],
          "maddeBaslik": [varsa maddenin başlığı, yoksa boş string],
          "maddeIcerigi": [maddenin tam metni ve içinde satır sonları olmalı],
          "hukukiDegerlendirme": [Detaylı hukuki değerlendirme ve içinde satır sonları olmalı],
          "uygunlukEtiketi": ["✅ Uygun Madde"],
          "gerekce": [Gerekçe ve içinde satır sonları olmalı],
          "kanuniDayanak": [İlgili Kanun/Madde (örn: Türk Borçlar Kanunu m. 27), veya "Kanuni Dayanak Belirlenemedi"],
          "yargiKarariOzeti": [İlgili Yargıtay/Danıştay kararı özeti ve numarası/tarihi. Yoksa "İlgili yargı kararı bulunamadı." ve içinde satır sonları olmalı],
          "onerilenRevizeMadde": [Riskli veya Geçersiz ise Türk hukukuna uygun revize edilmiş madde metni. Uygunsa "Revize gerekmiyor." ve içinde satır sonları olmalı]
        },
        // Diğer maddeler buraya gelecek
      ]

      Analiz edilecek sözleşme metni:
      `;

    const fullPrompt = `${prompt}\n\n${contractText}`;

    const analyzeResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // Daha yeni ve iyi performanslı model
        messages: [
          {
            role: "system",
            content: "Senin görevin, kullanıcının verdiği sözleşme metnini maddelere ayırarak, her bir maddeyi Türk Hukuku'na göre detaylıca analiz etmek ve çıktıyı kesinlikle belirtilen JSON formatında, hiçbir ek karakter veya metin olmadan döndürmektir."
          },
          { role: "user", content: fullPrompt }
        ],
        temperature: 0.2, // Tutarlı JSON çıktısı için düşük sıcaklık
        response_format: { type: "json_object" } // KRİTİK: Modelden JSON obje döndürmesini istiyoruz
      }),
    });

    const data = await analyzeResponse.json();

    // Modelin direkt JSON obje döndürmesi beklendiği için data.choices[0].message.content
    // zaten parse edilmiş bir JS objesi/array'i olmalı.
    // Ancak yine de hata ihtimaline karşı kontrol edelim.
    let rawAnalysisContent = data.choices?.[0]?.message?.content;

    try {
        if (typeof rawAnalysisContent === 'string') {
            // Nadiren de olsa model hala string döndürebilir, bu durumda parse etmeyi deneyelim.
            analysisResult = JSON.parse(rawAnalysisContent);
        } else if (typeof rawAnalysisContent === 'object' && rawAnalysisContent !== null) {
            // Çoğu durumda buraya düşmeli, doğrudan obje olarak gelmeli.
            analysisResult = rawAnalysisContent;
        } else {
            // Eğer boş veya tanımsız geldiyse, boş bir dizi ata.
            analysisResult = [];
            console.warn("Modelden gelen analiz sonucu beklenen formatta değil (boş/tanımsız):", rawAnalysisContent);
        }

        // Gelen JSON'un bir dizi olduğundan emin olalım.
        // Eğer tek bir obje geldiyse (bazen model öyle dönebiliyor), onu bir diziye saralım.
        if (!Array.isArray(analysisResult)) {
            if (typeof analysisResult === 'object' && analysisResult !== null && Object.keys(analysisResult).length > 0) {
                // Eğer tek bir madde analizi objesi geldiyse, onu diziye dönüştür.
                analysisResult = [analysisResult]; 
            } else {
                analysisResult = []; // Hala bir dizi değilse, boş dizi ata
            }
        }

    } catch (parseError) {
        console.error("Analiz sonucu JSON olarak ayrıştırılamadı veya işlenirken hata:", parseError);
        analysisResult = []; // Hata durumunda boş array ata
    }
    
    // Frontend'in beklediği formatta analysisResult'ı gönder
    res.status(200).json({ analysisResult });

  } catch (error) {
    console.error("Backend genel hata:", error);
    res.status(500).json({ error: "Sunucu hatası: " + error.message });
  }
}