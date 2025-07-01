export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  const { textToTranslate, prompt: translationPrompt } = req.body; // Gelen metin ve çeviri prompt'u

  if (!textToTranslate || textToTranslate.trim() === "") {
    return res.status(400).json({ result: "Çevrilecek metin belirtilmedi." });
  }

  let translatedText = "";
  let analysisResult = "";

  try {
    // Adım 1: İngilizce metni Türkçe'ye çevir
    const translateResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o", // Ya da önceki kullandığınız model (gpt-4)
        messages: [{ role: "user", content: `${translationPrompt}\n\n${textToTranslate}` }],
        temperature: 0.3, // Çeviride tutarlılık için düşük sıcaklık
      }),
    });

    const translateData = await translateResponse.json();
    translatedText = translateData.choices?.[0]?.message?.content || "Çeviri alınamadı.";

    // Hukuki analiz için kullanılacak prompt (analyze.js'deki prompt'un aynısı olmalı)
    // ÖNEMLİ: Buradaki prompt, analyze.js dosyanızdaki en güncel ve optimize edilmiş prompt ile AYNISI OLMALI.
    // Lütfen analyze.js'deki prompt'u buraya olduğu gibi kopyala-yapıştır yapın.
    const analysisPrompt = `
      Sen Türk Hukuku konusunda uzman, çözüm odaklı bir yapay zeka hukuk danışmanısın. Aşağıda verilen sözleşme maddelerini tek tek, ayrıntılı ve objektif bir şekilde Türk Hukuku mevzuatına göre analiz et. Her bir madde için çıktıyı aşağıdaki kesin formatta oluştur.

      Çok Önemli Kurallar (Kanuni Dayanak İçin):
      1. Analiz ettiğin her maddenin Kanuni Dayanağını **doğru, spesifik ve tam olarak** belirtmelisin. Kanun ismi ve madde numarasını kısaltma kullanmadan tam yazmaya özen göster (örn. Türk Borçlar Kanunu m. 27).
      2. Eğer bir madde için **KESİN VE DOĞRUDAN İLGİLİ, TARTIŞMASIZ BİR KANUN MADDESİ** bulamıyorsan veya **KESİNLİKLE EMİN DEĞİLSEN**, **ASLA YANLIŞ, ALAKASIZ VEYA ANLAMINI TAŞIMAYAN BİR MADDE NUMARASI VERME.** Bu tür durumlarda:
          - "Kanuni Dayanak Belirlenemedi" şeklinde belirt. VEYA
          - İlgili genel hukuki ilkeyi (örneğin: "Sözleşme Serbestisi İlkesi", "Dürüstlük Kuralı") VEYA
          - İlgili kanuni çerçeveyi (örneğin: "Türk Borçlar Kanunu Genel Hükümleri", "Türk Ticaret Kanunu Genel Hükümleri") belirt.
          - Örneğin, genel fesih halleri veya bildirim süreleri gibi doğrudan tek bir kanun maddesiyle düzenlenmeyen durumlarda, genel ilkeleri veya "Türk Borçlar Kanunu Genel Hükümleri" gibi bir ifadeyi tercih et.
      3. Kanun ismi ve madde numarasını kısaltma kullanmadan tam yazmaya özen göster (örn. Türk Borçlar Kanunu).
      
      ---
      Madde [numara]:
      Madde İçeriği: (maddenin tam metni)
      Hukuki Değerlendirme: Maddenin hukuki anlamını, olası risklerini, hukuka uygunluğunu veya aykırılığını detaylıca açıkla. Türk Hukukundaki yerini ve pratikteki sonuçlarını yorumla.
      🔎 Uygunluk Etiketi: Sadece aşağıdaki 3 etiketten birini seç:
          ✅ Uygun Madde: Türk hukukuna tamamen uygun ve risksiz.
          🟡 Riskli Madde: Hukuki belirsizlikler, potansiyel anlaşmazlıklar veya gelecekte sorun çıkarabilecek ifadeler içeriyor.
          🔴 Geçersiz Madde: Türk hukukunun emredici hükümlerine, genel ahlaka veya kamu düzenine açıkça aykırı ve geçersiz sayılması muhtemel.
      Gerekçe: Etiketi neden seçtiğini, hukuki argümanlarla ve net bir dille açıkla.
      Kanuni Dayanak: [Yukarıdaki "Çok Önemli Kurallar" bölümüne göre doldurulacak. Örnek: Türk Borçlar Kanunu m. 27 - Kesin Hükümsüzlük VEYA İlgili hukuki ilke/çerçeve: Sözleşme Serbestisi İlkesi]
      İlgili Yargı Kararı Özeti (Varsa): Bu maddeyle ilgili Yargıtay veya Danıştay kararlarından, konuya ışık tutan önemli bir karar varsa özetini ve karar numarasını/tarihini belirt. Yoksa "İlgili yargı kararı bulunamadı" yaz.
      Önerilen Revize Madde: (Eğer Uygunluk Etiketi "🟡 Riskli Madde" veya "🔴 Geçersiz Madde" ise, bu maddenin Türk hukukuna tamamen uygun, daha açık ve risksiz hale getirilmiş revize edilmiş halini, madde numarasını koruyarak ve sözleşmenin bağlamına uygun şekilde sun. Madde uygunsa "Revize gerekmiyor" yaz.)

      Örnek Çıktı Formatı:
      ---
      Madde 1:
      Madde İçeriği: [sözleşme maddesi metni]
      Hukuki Değerlendirme: Bu madde, sözleşme taraflarının anlaşmasıyla dahi hukuka aykırı hükümlerin geçerli olacağını belirtmektedir. Türk Borçlar Kanunu'nun emredici hükümleri gereğince, sözleşmelerin konusu kamu düzenine, kişilik haklarına veya ahlaka aykırı olamaz; aksi takdirde sözleşme kesin hükümsüzdür. Tarafların bu tür aykırılıkları peşinen kabul etmesi, sözleşmeyi geçerli kılmaz.
      🔴 Geçersiz Madde
      Gerekçe: Tarafların anlaşmasıyla dahi hukuka aykırı veya emredici hükümlere aykırı bir sözleşme maddesi geçerlilik kazanamaz. Bu madde, hukukun temel prensiplerine aykırı bir durumu geçerli kılmaya çalışmaktadır.
      Kanuni Dayanak: Türk Borçlar Kanunu m. 27 - Kesin Hükümsüzlük
      İlgili Yargı Kararı Özeti (Varsa): İlgili yargı kararı bulunamadı.
      Önerilen Revize Madde: Madde 1: Taraflar, işbu sözleşme hükümlerinin yürürlükteki kanunlara, kamu düzenine ve genel ahlaka uygun olduğunu kabul ve taahhüt ederler. Kanunlara aykırı olduğu tespit edilen hükümlerin yerine, kanuna uygun en yakın hükmün geçerli olacağı taraflarca kabul edilmiştir.

      ---
      Madde 2:
      Madde İçeriği: [sözleşme maddesi metni]
      Hukuki Değerlendirme: Bu madde, işçinin görev yerinin değişmesi durumunda ulaşım ve konaklama giderlerinin işçiye ait olacağını düzenlemektedir. İş Kanunu kapsamında, işverenin yönetim hakkı çerçevesinde işçinin görev yerini değiştirebilmesi mümkün olsa da, bu tür yer değişikliklerinin işçiye ek külfet getirmesi durumunda, İş Kanunu'nun işçiyi koruyucu hükümleri gereğince ulaşım ve konaklama gibi giderlerin işveren tarafından karşılanması esastır. Aksi bir düzenleme, işçi aleyhine yoruma açık olup, İş Kanunu'nun emredici hükümlerine aykırılık teşkil edebilir.
      🟡 Riskli Madde
      Gerekçe: İşverenin tek taraflı görev yeri değişikliğinde doğan masrafların işçiye yüklenmesi, İş Kanunu'nun işçiyi koruyucu hükümleri ve yerleşik Yargıtay içtihatları ile çelişebilir. İşçinin makul ve gerekli giderleri işverence karşılanmalıdır.
      Kanuni Dayanak: İş Kanunu m. 22 - İş Koşullarında Değişiklik ve İşyerinin Değişmesi (Dolaylı olarak ilgili, doğrudan bir madde bulunmayabilir)
      İlgili Yargı Kararı Özeti (Varsa): Yargıtay 9. Hukuk Dairesi'nin 2018/1234 E., 2019/5678 K. sayılı kararı: "İşverenin, işçinin görev yerini değiştirmesi halinde ulaşım ve konaklama masraflarının işverence karşılanması gerektiği..."
      Önerilen Revize Madde: Madde 2: B Tarafı, A Şirketi'nin talimatları doğrultusunda görev yapmayı kabul eder. Görev yerinin başka bir şehre değişmesi halinde, ulaşım ve konaklama giderleri yürürlükteki İş Kanunu hükümleri uyarınca A Şirketi tarafından karşılanır.

      ---
      Madde 3:
      Madde İçeriği: [sözleşme maddesi metni]
      Hukuki Değerlendirme: [...]
      ✅ Uygun Madde
      Gerekçe: [...]
      Kanuni Dayanak: İlgili hukuki ilke/çerçeve: Sözleşme Serbestisi İlkesi / Türk Borçlar Kanunu Genel Hükümleri
      İlgili Yargı Kararı Özeti (Varsa): [...]
      Önerilen Revize Madde: Revize gerekmiyor.

      ---
      Kurallar:
      - Her sözleşme maddesinin değerlendirmesini yukarıdaki kesin formatta yap.
      - Gerekli tüm bilgileri (madde içeriği, değerlendirme, etiket, gerekçe, kanuni dayanak, yargı kararı, önerilen revize madde) eksiksiz sağla.
      - Kanuni dayanakları ve yargı kararlarını bulmak için Türk Hukuku veri tabanını ve güncel mevzuatı kullan.
      - Maddeler arasında belirgin boşluklar bırak ve numaralandırılmış bir sıralama kullan.
      - Sadece analiz sonucunu formatına uygun olarak döndür, başka bir metin döndürme.
      - Kullanıcıya ait metni dikkatlice oku ve her bir maddeyi ayrı ayrı analiz et.

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
        model: "gpt-4o", // Ya da önceki kullandığınız model (gpt-4)
        messages: [{ role: "user", content: `${analysisPrompt}\n\n${translatedText}` }], // Türkçe metni analiz için gönder
        temperature: 0.3, // Analizde tutarlılık için düşük sıcaklık
      }),
    });

    const analyzeData = await analyzeResponse.json();
    analysisResult = analyzeData.choices?.[0]?.message?.content || "Analiz alınamadı.";

    // Her iki sonucu da ön yüze gönder
    res.status(200).json({ translatedText, analysisResult });

  } catch (error) {
    console.error("Backend hatası:", error);
    res.status(500).json({ error: "Sunucu hatası: " + error.message });
  }
}