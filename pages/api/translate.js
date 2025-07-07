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
        model: "gpt-4o",
        messages: [{ role: "user", content: `${translationPrompt}\n\n${textToTranslate}` }],
        temperature: 0.3,
      }),
    });

    const translateData = await translateResponse.json();
    translatedText = translateData.choices?.[0]?.message?.content || "Çeviri alınamadı.";

    // Hukuki analiz için kullanılacak prompt
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

      Kurallar:
      - Her sözleşme maddesinin değerlendirmesini yukarıdaki kesin formatta yap.
      - Gerekli tüm bilgileri (madde içeriği, değerlendirme, etiket, gerekçe, kanuni dayanak, yargı kararı, önerilen revize madde) eksiksiz sağla.
      - Kanuni dayanakları ve yargı kararlarını bulmak için Türk Hukuku veri tabanını ve güncel mevzuatı kullan.
      - Sadece analiz sonucunu **JSON formatında** döndür, başka hiçbir metin (açıklama, giriş/çıkış cümlesi vb.) içermemelidir.
      - JSON çıktısı şu anahtarları içermelidir: "maddeNo", "maddeIcerigi", "hukukiDegerlendirme", "uygunlukEtiketi", "gerekce", "kanuniDayanak", "yargiKarariOzeti", "onerilenRevizeMadde".

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
            content: "Verilen metni analiz et ve çıktıyı istenen JSON formatında sağla. JSON çıktısı dışında başka bir metin döndürme."
          },
          { role: "user", content: `${analysisPrompt}\n\n${translatedText}` }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" } // Burası kritik: Modelden doğrudan JSON döndürmesini istiyoruz
      }),
    });

    const analyzeData = await analyzeResponse.json();

    // Modelin doğrudan JSON döndürmesini istediğimiz için, 'content' içinde bir JSON stringi bekliyoruz.
    // Ancak bazen model dışarıya metin ekleyebilir veya JSON'ı eksik verebilir.
    // Bu yüzden bir 'try-catch' bloğu ile güvenli parse işlemi yapalım.
    try {
        // Modelin response_format: { type: "json_object" } ile döndüğü yer burasıdır.
        // analysisResult artık doğrudan bir JSON objesi olacak.
        analysisResult = analyzeData.choices?.[0]?.message?.content;

        // Bazen model JSON.parse ile parse edilemeyecek ek karakterler döndürebilir.
        // Bu yüzden güvenli bir parse işlemi yapıyoruz.
        // Gelen content string ise ve parse edilebilirse kullanırız, değilse boş bırakırız.
        if (typeof analysisResult === 'string') {
            analysisResult = JSON.parse(analysisResult);
        } else {
            // Eğer doğrudan JSON objesi olarak geldiyse (ki modelin hedefi bu),
            // zaten parse etmeye gerek yok.
            // Eğer boş veya tanımsız geldiyse, boş bir dizi atayalım.
            analysisResult = analysisResult || [];
        }

    } catch (parseError) {
        console.error("Analiz sonucu JSON olarak ayrıştırılamadı:", parseError);
        // Hata durumunda boş bir array dönerek frontend'in çökmesini engelleriz.
        analysisResult = [];
    }
    
    // Her iki sonucu da ön yüze gönder
    res.status(200).json({ translatedText, analysisResult });

  } catch (error) {
    console.error("Backend hatası:", error);
    res.status(500).json({ error: "Sunucu hatası: " + error.message });
  }
}