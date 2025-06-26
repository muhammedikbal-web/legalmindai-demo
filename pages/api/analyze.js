export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  const { contractText } = req.body;

  if (!contractText || contractText.trim() === "") {
    return res.status(400).json({ result: "Sözleşme metni belirtilmedi." });
  }

  const prompt = `
Aşağıda verilen sözleşme maddelerini tek tek analiz et. Her bir madde için çıktıyı şu formatta oluştur:

---
Madde [numara]:
Madde İçeriği: (maddenin tam metni)
Hukuki Değerlendirme: Maddenin anlamını ve yaratabileceği sorunları açıkla.
🔎 Uygunluk Etiketi: Sadece birini seç:
   ✅ Uygun Madde
   🟡 Riskli Madde
   🔴 Geçersiz Madde
Gerekçe: Kısa ama net şekilde neden böyle olduğunu açıklayın.
Kanuni Dayanak: Aşağıdaki kanunlardan ilgili olanı ve madde numarasını net şekilde belirt:
- Türk Borçlar Kanunu (TBK)
- İş Kanunu
- Anayasa
- Türk Medeni Kanunu (TMK)
- Türk Ticaret Kanunu (TTK)
- Tüketicinin Korunması Hakkında Kanun
- Türk Ceza Kanunu (TCK)

Örnek:
---
Madde 1:
Madde İçeriği: [metin]
Hukuki Değerlendirme: [...]
🔴 Geçersiz Madde
Gerekçe: [...]
Kanuni Dayanak: İş Kanunu m. 41 - Fazla Çalışma

---
Kurallar:
- Her maddenin değerlendirmesini bu formatta yap.
- Gereksiz tekrar yapma.
- Sadece analiz et, öneri verme.
- Maddeler arasında boşluk bırak ve sıralı yaz.

Analiz edilecek sözleşme metni:
`;


   const fullPrompt = `${prompt}\n\n${contractText}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: fullPrompt }],
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    const result = data.choices?.[0]?.message?.content || "Cevap alınamadı.";
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: "Sunucu hatası: " + error.message });
  }
}
