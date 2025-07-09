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
    // Modelden sadece her maddeyi ve temel etiketini isteyelim.
    // Detayları (gerekçe, kanuni dayanak vs.) şimdilik boş bırakacağız.
    const ultraSimplifiedAnalysisPrompt = `
      Aşağıdaki sözleşme metnini dikkatlice oku. Her bir "Madde X" veya benzeri ifadeyi (örn. "Madde 1", "Madde 2", "Giriş", "Taraflar" gibi) ayrı bir sözleşme maddesi olarak tanımla.
      
      Her bir madde için, önce madde numarasını ve başlığını (varsa) veya genel bir tanımlayıcıyı yaz (örn: "Giriş" veya "Taraflar").
      Hemen ardından, maddenin Türk Hukuku'na göre genel uygunluk etiketini belirt.
      
      Çıktı formatı aşağıdaki gibi olsun. Her madde için yeni bir satıra geç:
      
      Madde [Numara/Adı] - Uygunluk Etiketi: [✅ Uygun Madde | 🟡 Riskli Madde | 🔴 Geçersiz Madde]

      Örnek:
      Taraflar - Uygunluk Etiketi: ✅ Uygun Madde
      Madde 1 - Sözleşmenin Konusu - Uygunluk Etiketi: ✅ Uygun Madde
      Madde 3 - Ödeme Koşulları - Uygunluk Etiketi: 🔴 Geçersiz Madde
      
      Analiz edilecek sözleşme metni:
      ${contractText}
      `;

    const responseFromModel = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // En güncel model
        messages: [
          {
            role: "system",
            content: "Sen bir Türk Hukuku uzmanısın. Kullanıcının verdiği sözleşme metnini madde madde ayır ve her maddenin başlığı/numarası ile birlikte uygunluk etiketini belirt. Sadece istenen formatta, kısa ve net çıktı ver. Başka hiçbir şey ekleme."
          },
          { role: "user", content: ultraSimplifiedAnalysisPrompt }
        ],
        temperature: 0.1, // Düşük sıcaklık format tutarlılığı için
      }),
    });

    const dataFromModel = await responseFromModel.json();

    if (dataFromModel.error) {
      console.error("OpenAI API Hatası (analyze.js):", dataFromModel.error);
      return res.status(dataFromModel.error.status || 500).json({ error: dataFromModel.error.message || "OpenAI API'den analiz sırasında beklenmeyen bir hata alındı." });
    }

    const rawAnalysisText = dataFromModel.choices?.[0]?.message?.content || "";

    // Modelden gelen ham metni konsola yazdır (hala kalsın)
    console.log("------------------------------------------");
    console.log("Modelden Gelen Ham Analiz Metni (rawAnalysisText):");
    console.log(rawAnalysisText);
    console.log("------------------------------------------");

    // Şimdi, modelden gelen basit metni bizim tarafımızdan istediğimiz JSON formatına ayrıştıralım
    const lines = rawAnalysisText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    for (const line of lines) {
      const match = line.match(/^(.*?)(?: - Uygunluk Etiketi: (.+))?$/);
      if (match) {
        const fullMaddeInfo = match[1].trim();
        const uygunlukEtiketi = match[2] ? match[2].trim() : "❓ Etiket Bilgisi Yok";

        let maddeNo = "";
        let maddeBaslik = "";

        const maddeMatch = fullMaddeInfo.match(/^(?:Madde\s*([\d.]+)\s*-\s*)?(.*)$/i);
        if (maddeMatch) {
            maddeNo = maddeMatch[1] || "";
            maddeBaslik = maddeMatch[2] || fullMaddeInfo; // Eğer başlık yoksa tüm satırı başlık yap
        } else {
            maddeBaslik = fullMaddeInfo; // Madde formatına uymuyorsa, tüm satırı başlık yap
        }

        // Örnek metin için Madde No'yu ve Başlığı ayırma
        if (fullMaddeInfo.startsWith("Taraflar")) {
            maddeNo = "Giriş";
            maddeBaslik = "Taraflar";
        } else if (fullMaddeInfo.startsWith("Madde")) {
            const numMatch = fullMaddeInfo.match(/^Madde\s*([\d.]+)/i);
            if (numMatch) {
                maddeNo = numMatch[1];
                maddeBaslik = fullMaddeInfo.substring(numMatch[0].length).replace(/^-/, '').trim();
            } else {
                maddeBaslik = fullMaddeInfo;
            }
        } else {
            maddeBaslik = fullMaddeInfo; // Diğer durumlarda tüm info'yu başlık yap
        }


        // Diğer alanlar şimdilik boş veya varsayılan değerde olacak
        const maddeIcerigi = "Metin içeriği modelden alınmadı."; // Modelden içerik istemiyoruz şimdilik
        const hukukiDegerlendirme = "Detaylı değerlendirme için modelden bilgi alınmadı.";
        const gerekce = hukukiDegerlendirme;
        const kanuniDayanak = "Belirlenemedi";
        const yargiKarariOzeti = "Bulunamadı.";
        const onerilenRevizeMadde = (uygunlukEtiketi.includes("Riskli") || uygunlukEtiketi.includes("Geçersiz")) 
                                    ? "Revize madde modelden alınmadı." 
                                    : "Revize gerekmiyor.";

        analysisResult.push({
          maddeNo: isNaN(parseInt(maddeNo)) ? maddeNo : parseInt(maddeNo),
          maddeBaslik: maddeBaslik,
          maddeIcerigi: maddeIcerigi,
          hukukiDegerlendirme: hukukiDegerlendirme,
          uygunlukEtiketi: uygunlukEtiketi,
          gerekce: gerekce,
          kanuniDayanak: kanuniDayanak,
          yargiKarariOzeti: yargiKarariOzeti,
          onerilenRevizeMadde: onerilenRevizeMadde,
        });
      } else {
          console.warn("Beklenmeyen satır formatı:", line);
      }
    }

    res.status(200).json({ analysisResult });

  } catch (error) {
    console.error("Genel sunucu hatası (analyze.js):", error);
    res.status(500).json({ error: "Sunucu hatası: " + error.message });
  }
}