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
    // Modelden sadece madde madde ayrıştırılmış metin ve kısa bir değerlendirme isteyelim.
    // Detaylı JSON yapısını ve diğer bilgileri burada biz oluşturalım.
    const simplifiedAnalysisPrompt = `
      Aşağıdaki sözleşme metnini dikkatlice oku ve her bir maddeyi (başlık ve içeriğiyle birlikte) ayrı ayrı belirle.
      Her bir madde için, önce madde numarasını ve başlığını (varsa), ardından maddenin tam içeriğini yaz.
      Sonrasında, o maddenin Türk Hukuku'na göre kısa bir uygunluk değerlendirmesini yap ve uygunluk etiketini (✅ Uygun, 🟡 Riskli, 🔴 Geçersiz) belirt.
      
      Çıktın aşağıdaki formatta olsun. Her madde arasında boş bir satır bırak.
      
      Madde [Numara] - [Başlık]:
      [Maddenin Tam İçeriği]
      Değerlendirme: [Kısa Hukuki Değerlendirme]
      Etiket: [✅ Uygun Madde | 🟡 Riskli Madde | 🔴 Geçersiz Madde]
      
      Örnek:
      Madde 1 - Sözleşmenin Konusu:
      Taraf A, Ek-1'de tanımlandığı üzere, Taraf B'ye web sitesi tasarımı ve dijital danışmanlık hizmetleri sağlamayı kabul eder.
      Değerlendirme: Bu madde sözleşmenin konusunu açıkça belirtmektedir ve hukuken geçerlidir.
      Etiket: ✅ Uygun Madde
      
      Madde 2 - Süre:
      Bu Sözleşme, imza tarihinde yürürlüğe girecek ve 6 (altı) ay süreyle geçerli olacaktır.
      Değerlendirme: Sözleşmenin süresi net olarak belirlenmiştir, bu da sözleşme serbestisi ilkesi kapsamında uygundur.
      Etiket: ✅ Uygun Madde

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
            content: "Sen bir hukuk uzmanısın. Kullanıcının verdiği sözleşme metnini maddelere ayırarak, her bir madde için kısa bir hukuki uygunluk değerlendirmesi ve etiketini belirle. Çıktın, kullanıcının belirttiği formatta olmalı. Sadece çıktı formatına sadık kal."
          },
          { role: "user", content: simplifiedAnalysisPrompt }
        ],
        temperature: 0.1, // Çok düşük sıcaklık, çıktının formatına sadık kalması için
      }),
    });

    const dataFromModel = await responseFromModel.json();

    if (dataFromModel.error) {
      console.error("OpenAI API Hatası (analyze.js):", dataFromModel.error);
      return res.status(dataFromModel.error.status || 500).json({ error: dataFromModel.error.message || "OpenAI API'den analiz sırasında beklenmeyen bir hata alındı." });
    }

    const rawAnalysisText = dataFromModel.choices?.[0]?.message?.content || "";
    
    // BURAYA EKLE: Modelden gelen ham metni konsola yazdır 
    console.log("------------------------------------------");
    console.log("Modelden Gelen Ham Analiz Metni (rawAnalysisText):");
    console.log(rawAnalysisText);
    console.log("------------------------------------------");

    // Şimdi, modelden gelen basit metni bizim tarafımızdan istediğimiz JSON formatına ayrıştıralım
    // Bu RegEx, "Madde X - Başlık:" ile başlayan blokları yakalar.
    const articleBlocks = rawAnalysisText.split(/(?=^Madde \d+ - .*?:)/gm);
    
    // İlk eleman genellikle boş veya giriş metni olabilir, bu yüzden filtreleyelim
    const cleanedBlocks = articleBlocks.filter(block => block.trim().startsWith("Madde "));

    for (const block of cleanedBlocks) {
      const lines = block.trim().split('\n').map(line => line.trim());
      
      let maddeNo = "";
      let maddeBaslik = "";
      let maddeIcerigi = [];
      let hukukiDegerlendirme = "";
      let uygunlukEtiketi = "";
      
      let currentSection = ""; // 'content', 'evaluation', 'tag'
      
      for (const line of lines) {
        if (line.startsWith("Madde ")) {
          const match = line.match(/^Madde (\d+)(?: - (.*?))?:/);
          if (match) {
            maddeNo = parseInt(match[1]) || match[1]; // Sayıysa sayı, değilse string
            maddeBaslik = match[2] || "";
            currentSection = "content"; // Madde başladı, içerik bekliyoruz
            continue;
          }
        } else if (line.startsWith("Değerlendirme:")) {
          hukukiDegerlendirme = line.substring("Değerlendirme:".length).trim();
          currentSection = "evaluation";
          continue;
        } else if (line.startsWith("Etiket:")) {
          uygunlukEtiketi = line.substring("Etiket:".length).trim();
          currentSection = "tag";
          continue;
        }

        // Madde içeriği veya değerlendirme devamı
        if (currentSection === "content" && line !== "") {
          maddeIcerigi.push(line);
        } else if (currentSection === "evaluation" && line !== "" && !line.startsWith("Etiket:")) {
          hukukiDegerlendirme += ` ${line}`; // Değerlendirme birden fazla satır olabilir
        }
      }

      // Maddenin içeriğini ve diğer alanları düzeltelim (array'den string'e çevirme vb.)
      const fullMaddeIcerigi = maddeIcerigi.join('\n').trim(); // Satır sonlarıyla birleştir
      const cleanedHukukiDegerlendirme = hukukiDegerlendirme.replace(/^Değerlendirme:/, '').trim();

      // Örnek metinde olmayan ancak frontend'de beklenen varsayılan değerler
      // Bu kısımları GPT-4o'dan doğrudan almak yerine, burada varsayılan değerler verelim
      // veya gerekirse ayrı bir LLM çağrısı ile doldurabiliriz.
      const gerekce = cleanedHukukiDegerlendirme; // Basitlik için değerlendirmeyi gerekçe yapalım
      const kanuniDayanak = "Kanuni Dayanak Belirlenemedi"; // Varsayılan değer
      const yargiKarariOzeti = "İlgili yargı kararı bulunamadı."; // Varsayılan değer
      const onerilenRevizeMadde = (uygunlukEtiketi === "🟡 Riskli Madde" || uygunlukEtiketi === "🔴 Geçersiz Madde") 
                                ? "Modelden revize madde alınamadı. Manuel revize gerekli." // Model sadece kısa değerlendirme yaptığı için
                                : "Revize gerekmiyor.";

      analysisResult.push({
        maddeNo: maddeNo,
        maddeBaslik: maddeBaslik,
        maddeIcerigi: fullMaddeIcerigi,
        hukukiDegerlendirme: cleanedHukukiDegerlendirme,
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

   
    