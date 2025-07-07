// pages/api/analyze.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  const { contractText } = req.body;

  if (!contractText || contractText.trim() === "") {
    return res.status(400).json({ error: "Sözleşme metni belirtilmedi." });
  }

  let analysisResult = [];

  try {
    const analysisPrompt = `
      Sen çok yetenekli, Türk Hukuku konusunda uzman ve çözüm odaklı bir yapay zeka hukuk danışmanısın.
      Aşağıda sana verilen sözleşme metnini dikkatlice oku. Metindeki her bir "Madde X" (örneğin "Madde 1", "Madde 2" gibi) ifadesini ayrı bir sözleşme maddesi olarak tanımla.
      
      Her bir tespit ettiğin sözleşme maddesini tek tek, ayrıntılı ve objektif bir şekilde Türk Hukuku mevzuatına göre analiz et.
      
      Analiz sonucunu, her bir maddenin aşağıdaki kesin JSON objesi formatında olduğu bir JSON dizisi (array) olarak döndür.
      
      **Çok Önemli Çıktı Kuralları:**
      1. Çıktın, **sadece ve sadece geçerli bir JSON dizisi olmalı.** JSON dışında hiçbir ekstra metin, açıklama, başlık veya giriş/çıkış cümlesi ekleme.
      2. JSON içindeki tüm metin alanları (yani "maddeIcerigi", "hukukiDegerlendirme", "gerekce", "yargiKarariOzeti", "onerilenRevizeMadde"), **okunabilirliği artırmak için içerisinde mantıklı ve doğal satır sonları (\\n karakteri) içermeli.**
      3. **Tüm maddeler analiz edilmeli:** Metinde kaç madde varsa (Madde 1'den sona kadar), her biri için ayrı bir JSON objesi oluşturulmalı ve bu dizinin içinde yer almalı. Asla sadece ilk maddeyi analiz etme.
      4. "maddeNo" alanı için, metindeki madde numarasını kullan. Eğer belirli bir madde numarası yoksa, içeriğe göre uygun bir tanımlayıcı kullanabilirsin (örneğin "Giriş", "Tanımlar" gibi).
      5. "Kanuni Dayanak" için: Doğru, spesifik ve tam kanun maddesi (örn: Türk Borçlar Kanunu m. 27). Eğer kesin ve doğrudan ilgili bir kanun maddesi bulamıyorsan veya emin değilsen, asla yanlış veya alakasız bir madde numarası verme. Bunun yerine:
         - "Kanuni Dayanak Belirlenemedi" şeklinde belirt. VEYA
         - İlgili genel hukuki ilkeyi (örneğin: "Sözleşme Serbestisi İlkesi", "Dürüstlük Kuralı") VEYA
         - İlgili kanuni çerçeveyi (örneğin: "Türk Borçlar Kanunu Genel Hükümleri", "Türk Ticaret Kanunu Genel Hükümleri") belirt.
      6. "Uygunluk Etiketi" için sadece bu 3 etiketten birini kullan: "✅ Uygun Madde", "🟡 Riskli Madde", "🔴 Geçersiz Madde".

      **JSON Objesi Yapısı (Her madde için bir obje dizisi olarak):**
      [
        {
          "maddeNo": [madde numarası veya tanımlayıcı, örn: 1],
          "maddeBaslik": [varsa maddenin başlığı, yoksa boş string],
          "maddeIcerigi": [maddenin tam metni ve içinde satır sonları olmalı],
          "hukukiDegerlendirme": [Detaylı hukuki değerlendirme ve içinde satır sonları olmalı],
          "uygunlukEtiketi": ["✅ Uygun Madde"],
          "gerekce": [Etiketi neden seçtiğini, hukuki argümanlarla ve içinde satır sonları olmalı],
          "kanuniDayanak": [İlgili Kanun/Madde veya "Kanuni Dayanak Belirlenemedi"],
          "yargiKarariOzeti": [İlgili Yargıtay/Danıştay kararı özeti ve numarası/tarihi. Yoksa "İlgili yargı kararı bulunamadı." ve içinde satır sonları olmalı],
          "onerilenRevizeMadde": [Riskli veya Geçersiz ise Türk hukukuna uygun revize edilmiş madde metni. Uygunsa "Revize gerekmiyor." ve içinde satır sonları olmalı]
        }
        // ... Diğer maddeler de bu formatta devam edecek
      ]

      Analiz edilecek sözleşme metni:
      ${contractText}
      `;

    const analyzeResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // En güncel ve yetenekli model
        messages: [
          {
            role: "system",
            content: "Senin görevin, kullanıcının verdiği sözleşme metnini maddelere ayırarak, her bir maddeyi Türk Hukuku'na göre detaylıca analiz etmek ve çıktıyı kesinlikle belirtilen JSON formatında, hiçbir ek karakter veya metin olmadan döndürmektir. JSON içindeki tüm metin alanlarında satır sonları için \\n kullan."
          },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.2, // Tutarlı JSON çıktısı için düşük sıcaklık
        response_format: { type: "json_object" } // KRİTİK: Modelden JSON obje döndürmesini istiyoruz
      }),
    });

    const data = await analyzeResponse.json();

    if (data.error) {
      console.error("OpenAI API Hatası:", data.error);
      return res.status(data.error.status || 500).json({ error: data.error.message || "OpenAI API'den beklenmeyen bir hata alındı." });
    }

    let rawAnalysisContent = data.choices?.[0]?.message?.content;
    let finalAnalysisResult = []; // API'den gelecek analysisResult için yeni değişken

    try {
        if (typeof rawAnalysisContent === 'string') {
            finalAnalysisResult = JSON.parse(rawAnalysisContent);
        } else if (typeof rawAnalysisContent === 'object' && rawAnalysisContent !== null) {
            finalAnalysisResult = rawAnalysisContent;
        } else {
            console.warn("Modelden gelen analiz sonucu beklenen formatta değil (boş/tanımsız):", rawAnalysisContent);
        }

        // Güvenlik kontrolü: Eğer analysisResult dizi değilse veya boşsa, boş dizi ata
        if (!Array.isArray(finalAnalysisResult)) {
            if (typeof finalAnalysisResult === 'object' && finalAnalysisResult !== null && Object.keys(finalAnalysisResult).length > 0) {
                finalAnalysisResult = [finalAnalysisResult]; 
            } else {
                finalAnalysisResult = [];
            }
        }

    } catch (parseError) {
        console.error("Analiz sonucu JSON olarak ayrıştırılamadı veya işlenirken hata:", parseError);
        return res.status(500).json({ error: "Analiz yanıtı işlenirken bir sorun oluştu." });
    }
    
    // Yalnızca analiz sonucunu döndür
    res.status(200).json({ analysisResult: finalAnalysisResult });

  } catch (error) {
    console.error("Genel sunucu hatası:", error);
    res.status(500).json({ error: "Sunucu hatası: " + error.message });
  }
}