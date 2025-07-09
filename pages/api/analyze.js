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
    // Yeni Yaklaşım: Modelden her maddeyi "###Madde X###" ile ayırarak vermesini isteyeceğiz.
    // Analiz detaylarını her madde bloğunun içine daha basit formatta isteyeceğiz.
    const newSimplifiedAnalysisPrompt = `
      Aşağıdaki sözleşme metnini dikkatlice oku. Her bir "Madde X" veya benzeri ifadeyi (örn. "Madde 1", "Madde 2", "Giriş" gibi) ayrı bir sözleşme maddesi olarak tanımla.
      
      Her bir madde için, önce maddeyi aşağıdaki özel formatta ayır: "###Madde [Numara/Adı]###".
      Ardından, maddenin tam içeriğini yaz.
      Sonrasında, o madde için Türk Hukuku'na göre bir hukuki değerlendirme, uygunluk etiketi ve varsa önerilen revize maddeyi aşağıdaki anahtar kelimelerle belirt:
      
      Hukuki Değerlendirme: [Kısa ve öz hukuki değerlendirme]
      Uygunluk Etiketi: [✅ Uygun Madde | 🟡 Riskli Madde | 🔴 Geçersiz Madde]
      Önerilen Revize Madde: [Riskli veya Geçersiz ise uygun revize edilmiş madde metni. Uygunsa "Revize gerekmiyor."]

      **Çok Önemli Kurallar:**
      1. Çıktı, sadece analiz metnini içermeli. JSON veya başka bir format kullanma.
      2. Her maddenin başında mutlaka "###Madde [Numara/Adı]###" ayırıcı etiketini kullan.
      3. Her anahtar kelime (Hukuki Değerlendirme, Uygunluk Etiketi, Önerilen Revize Madde) yeni bir satırda başlasın.
      4. Eğer bir madde başlığı yoksa, "Madde [Numara]###" şeklinde bırak. Örneğin: "###Madde 1###".

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
            content: "Sen bir Türk Hukuku uzmanı yapay zekasın. Görevin, kullanıcının verdiği sözleşme metnini, her maddeyi '###Madde X###' formatıyla ayırarak ve her maddenin altında belirtilen anahtar kelimelerle hukuki değerlendirme, uygunluk etiketi ve revize maddeyi sağlamaktır. Sadece istenen formatta, net ve açıklayıcı metin çıktısı ver. Başka hiçbir şey ekleme."
          },
          { role: "user", content: newSimplifiedAnalysisPrompt }
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

    // BURAYA EKLE: Modelden gelen ham metni konsola yazdır (hala kalsın)
    console.log("------------------------------------------");
    console.log("Modelden Gelen Ham Analiz Metni (rawAnalysisText):");
    console.log(rawAnalysisText);
    console.log("------------------------------------------");

    // Modelden gelen metni "###Madde X###" ayracına göre parçalayalım
    const articleBlocks = rawAnalysisText.split(/(?=###Madde\s(?:[\d.]+)(?:.*?)\s?###)/g);
    
    // İlk eleman genellikle boş veya giriş metni olabilir, bu yüzden filtreleyelim
    const cleanedBlocks = articleBlocks.filter(block => block.trim().startsWith("###Madde "));

    for (const block of cleanedBlocks) {
      let maddeNo = "";
      let maddeBaslik = "";
      let maddeIcerigi = "";
      let hukukiDegerlendirme = "";
      let uygunlukEtiketi = "";
      let onerilenRevizeMadde = "";

      const lines = block.trim().split('\n').map(line => line.trim());
      
      // İlk satır madde başlığı ve numarasını içeriyor olmalı
      const firstLine = lines.shift(); // İlk satırı al ve diziden çıkar
      const maddeMatch = firstLine.match(/###Madde\s([\d.]+)(?: - (.*?))?###/);

      if (maddeMatch) {
        maddeNo = maddeMatch[1] || "";
        maddeBaslik = maddeMatch[2] || "";
      } else {
        // Eğer format beklenenden farklıysa, burayı atla veya hata logla
        console.warn("Madde başlığı formatı beklenenden farklı:", firstLine);
        continue; 
      }

      // Geri kalan satırları ayrıştır
      let currentContent = [];
      for (const line of lines) {
        if (line.startsWith("Hukuki Değerlendirme:")) {
          hukukiDegerlendirme = line.substring("Hukuki Değerlendirme:".length).trim();
          currentContent = []; // İçerik kısmı bitti
        } else if (line.startsWith("Uygunluk Etiketi:")) {
          uygunlukEtiketi = line.substring("Uygunluk Etiketi:".length).trim();
          currentContent = [];
        } else if (line.startsWith("Önerilen Revize Madde:")) {
          onerilenRevizeMadde = line.substring("Önerilen Revize Madde:".length).trim();
          currentContent = [];
        } else {
          // Eğer anahtar kelimelerden biri değilse ve madde içeriği bekleniyorsa
          currentContent.push(line);
        }
      }
      maddeIcerigi = currentContent.join('\n').trim();

      // Ek alanlar için varsayılan değerler
      const gerekce = hukukiDegerlendirme; // Geçici olarak değerlendirmeyi gerekçe yapalım
      const kanuniDayanak = "Kanuni Dayanak Belirlenemedi"; 
      const yargiKarariOzeti = "İlgili yargı kararı bulunamadı."; 

      analysisResult.push({
        maddeNo: isNaN(parseInt(maddeNo)) ? maddeNo : parseInt(maddeNo), // Sayıya çevir, değilse string bırak
        maddeBaslik: maddeBaslik,
        maddeIcerigi: maddeIcerigi,
        hukukiDegerlendirme: hukukiDegerlendirme,
        uygunlukEtiketi: uygunlukEtiketi,
        gerekce: gerekce,
        kanuniDayanak: kanuniDayanak,
        yargiKarariOzeti: yargiKarariOzeti,
        onerilenRevizeMadde: onerilenRevizeMadde,
      });
    }

    res.status(200).json({ analysisResult });

  } catch (error) {
    console.error("Genel sunucu hatası (analyze.js):", error);
    res.status(500).json({ error: "Sunucu hatası: " + error.message });
  }
}