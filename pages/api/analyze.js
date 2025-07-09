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
    // Yeni Yaklaşım: Modelden her maddeyi "###MADDE BAŞLANGICI###" ile ayırarak vermesini isteyeceğiz.
    // Analiz detaylarını her madde bloğunun içine daha basit formatta isteyeceğiz.
    const newSimplifiedAnalysisPrompt = `
      Sen çok yetenekli, Türk Hukuku konusunda uzman ve çözüm odaklı bir yapay zeka hukuk danışmanısın.
      Aşağıdaki sözleşme metnini dikkatlice oku. Metindeki her bir "Madde X" (örn. "Madde 1", "Madde 2", "Giriş", "Taraflar" gibi) ifadesini ayrı bir sözleşme maddesi olarak tanımla.
      
      Her bir tespit ettiğin sözleşme maddesini tek tek, ayrıntılı ve objektif bir şekilde Türk Hukuku mevzuatına göre analiz et.
      
      Çıktı formatı için aşağıdaki kesin kurallara uy:
      1. Her maddenin başında özel bir ayırıcı etiket kullan: "###MADDE BAŞLANGICI###". Bu etiketin hemen ardından madde numarasını ve başlığını (varsa) yaz. Örnek: "###MADDE BAŞLANGICI### Madde 1 - Sözleşmenin Konusu". Eğer madde numarası veya başlığı yoksa, "###MADDE BAŞLANGICI### [İçerik Tanımlayıcı]" şeklinde genel bir tanımlayıcı kullan (örn: "###MADDE BAŞLANGICI### Taraflar", "###MADDE BAŞLANGICI### Giriş"). Madde başlığını mutlaka doğru ve orijinal metindeki haliyle al.
      2. Madde içeriği, ayırıcı etiketin hemen altında başlasın ve maddenin tam metnini içersin.
      3. Her maddenin analiz detayları, madde içeriğinden sonra aşağıdaki anahtar kelimelerle belirtilsin. Lütfen bu bilgileri **detaylı ve açıklayıcı** olarak doldur:
         - Hukuki Değerlendirme: [Detaylı hukuki değerlendirme. Okunabilirliği artırmak için içinde mantıklı satır sonları (\\n) kullan.]
         - Uygunluk Etiketi: [✅ Uygun Madde | 🟡 Riskli Madde | 🔴 Geçersiz Madde]
         - Gerekçe: [Etiketi neden seçtiğini, hukuki argümanlarla detaylı açıkla. İçinde mantıklı satır sonları (\\n) kullan.]
         - Kanuni Dayanak: [Doğru, spesifik ve tam kanun maddesi (örn: Türk Borçlar Kanunu m. 27). Eğer kesin ve doğrudan ilgili bir kanun maddesi bulamıyorsan veya emin değilsen: "Belirlenemedi" yaz.]
         - Yargı Kararı Özeti: [İlgili Yargıtay/Danıştay kararı özeti ve numarası/tarihi. Yoksa "İlgili yargı kararı bulunamadı." yaz. İçinde mantıklı satır sonları (\\n) kullan.]
         - Önerilen Revize Madde: [Riskli veya Geçersiz ise Türk hukukuna uygun revize edilmiş madde metni. Uygunsa "Revize gerekmiyor." yaz. İçinde mantıklı satır sonları (\\n) kullan.]

      **Çıktı Kuralları Özeti (Çok Önemli):**
      * JSON formatı kullanma, sadece metin çıktısı ver.
      * Her maddeyi "###MADDE BAŞLANGICI###" etiketiyle ayır ve bu etiketi takiben maddenin numarasını ve tam başlığını/adını ekle.
      * Tüm alanları (Değerlendirme, Gerekçe, Yargı Kararı Özeti, Revize Madde) **detaylı** bir şekilde doldur ve içinde **satır sonları (\\n)** kullan.
      * Sadece analiz sonucunu ver, ek giriş/çıkış cümleleri kullanma.

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
            content: "Sen bir Türk Hukuku uzmanı yapay zekasın. Kullanıcının verdiği sözleşme metnini, her maddeyi '###MADDE BAŞLANGICI###' etiketiyle ayırarak ve her maddenin altında belirtilen anahtar kelimelerle detaylı hukuki değerlendirme, uygunluk etiketi, gerekçe, kanuni dayanak, yargı kararı özeti ve revize maddeyi sağlamaktır. Sadece istenen formatta, net ve açıklayıcı metin çıktısı ver. Tüm açıklama alanlarında satır sonu (\\n) karakterleri kullan."
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

    // Modelden gelen ham metni konsola yazdır (hala kalsın)
    console.log("------------------------------------------");
    console.log("Modelden Gelen Ham Analiz Metni (rawAnalysisText):");
    console.log(rawAnalysisText);
    console.log("------------------------------------------");

    // Modelden gelen metni "###MADDE BAŞLANGICI###" ayracına göre parçalayalım
    const articleBlocks = rawAnalysisText.split(/(?=###MADDE BAŞLANGICI###)/g);
    
    // İlk eleman genellikle boş veya giriş metni olabilir, bu yüzden filtreleyelim
    const cleanedBlocks = articleBlocks.filter(block => block.trim().startsWith("###MADDE BAŞLANGICI###"));

    for (const block of cleanedBlocks) {
      let maddeNo = "";
      let maddeBaslik = "";
      let maddeIcerigi = "";
      let hukukiDegerlendirme = "";
      let uygunlukEtiketi = "";
      let gerekce = "";
      let kanuniDayanak = "";
      let yargiKarariOzeti = "";
      let onerilenRevizeMadde = "";

      const lines = block.trim().split('\n').map(line => line.trim());
      
      let currentSection = 'meta'; // 'meta', 'content', 'hukuki', 'etiket', 'gerekce', 'kanuni', 'yargi', 'revize'
      let tempMaddeIcerigiLines = []; // Madde içeriğini toplamak için geçici dizi

      // İlk satır madde başlığı ve numarasını içeriyor olmalı
      const firstLine = lines.shift(); // İlk satırı al ve diziden çıkar
      const maddeMatch = firstLine.match(/###MADDE BAŞLANGICI###\s*(?:Madde\s*([\d.]+))?(?:\s*[-–]?\s*(.*))?/i); // "-" veya "–" karakterini yakala
      
      if (maddeMatch) {
          maddeNo = maddeMatch[1] || ""; // Sayı varsa
          maddeBaslik = maddeMatch[2] || (maddeNo ? "" : firstLine.replace(/###MADDE BAŞLANGICI###\s*/i, '')); // Başlık yoksa tüm satırı al (etiketsiz)
      } else {
          // Eğer madde formatı beklenenden farklıysa, tüm etiketsiz satırı başlık olarak al
          maddeBaslik = firstLine.replace(/###MADDE BAŞLANGICI###\s*/i, '');
          maddeNo = "Giriş" // Bu tarz maddeler için bir varsayılan no
      }
      
      // Özellikle "HİZMET SÖZLEŞMESİ" veya "Taraflar" gibi giriş maddelerini ele alalım
      if (maddeBaslik.includes("HİZMET SÖZLEŞMESİ") && !maddeNo) {
          maddeNo = "Giriş";
          maddeBaslik = "Hizmet Sözleşmesi Giriş";
      } else if (maddeBaslik.includes("Taraflar") && !maddeNo) {
          maddeNo = "Giriş";
          maddeBaslik = "Taraflar";
      }


      for (const line of lines) {
        if (line.startsWith("Hukuki Değerlendirme:")) {
          hukukiDegerlendirme = line.substring("Hukuki Değerlendirme:".length).trim();
          currentSection = 'hukuki';
        } else if (line.startsWith("Uygunluk Etiketi:")) {
          uygunlukEtiketi = line.substring("Uygunluk Etiketi:".length).trim();
          currentSection = 'etiket';
        } else if (line.startsWith("Gerekçe:")) {
          gerekce = line.substring("Gerekçe:".length).trim();
          currentSection = 'gerekce';
        } else if (line.startsWith("Kanuni Dayanak:")) {
          kanuniDayanak = line.substring("Kanuni Dayanak:".length).trim();
          currentSection = 'kanuni';
        } else if (line.startsWith("Yargı Kararı Özeti:")) {
          yargiKarariOzeti = line.substring("Yargı Kararı Özeti:".length).trim();
          currentSection = 'yargi';
        } else if (line.startsWith("Önerilen Revize Madde:")) {
          onerilenRevizeMadde = line.substring("Önerilen Revize Madde:".length).trim();
          currentSection = 'revize';
        } else {
          // Önceki bölümün devamı olarak ekle
          switch (currentSection) {
            case 'content':
              tempMaddeIcerigiLines.push(line);
              break;
            case 'hukuki':
              hukukiDegerlendirme += `\n${line}`;
              break;
            case 'gerekce':
              gerekce += `\n${line}`;
              break;
            case 'yargi':
              yargiKarariOzeti += `\n${line}`;
              break;
            case 'revize':
              onerilenRevizeMadde += `\n${line}`;
              break;
            // 'etiket' tek satırlık olmalı, ekleme yapma
          }
        }
      }
      
      maddeIcerigi = tempMaddeIcerigiLines.join('\n').trim();

      analysisResult.push({
        maddeNo: isNaN(parseInt(maddeNo)) ? maddeNo : maddeNo, // Sayıya çevir, değilse string bırak
        maddeBaslik: maddeBaslik.replace(/^-/, '').trim(), // Baştaki tireyi temizle
        maddeIcerigi: maddeIcerigi,
        hukukiDegerlendirme: hukukiDegerlendirme.trim(),
        uygunlukEtiketi: uygunlukEtiketi.trim(),
        gerekce: gerekce.trim(),
        kanuniDayanak: kanuniDayanak.trim(),
        yargiKarariOzeti: yargiKarariOzeti.trim(),
        onerilenRevizeMadde: onerilenRevizeMadde.trim(),
      });
    }

    res.status(200).json({ analysisResult });

  } catch (error) {
    console.error("Genel sunucu hatası (analyze.js):", error);
    res.status(500).json({ error: "Sunucu hatası: " + error.message });
  }
}