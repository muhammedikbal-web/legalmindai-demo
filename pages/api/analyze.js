export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  const { contractText } = req.body;

  if (!contractText || contractText.trim() === "") {
    return res.status(400).json({ result: "Sözleşme metni belirtilmedi." });
  }

  const prompt = `
Aşağıda verilen sözleşme maddelerini tek tek analiz et. Her bir madde için sırasıyla şu şekilde çıktı ver:

1. Madde İçeriği: (maddenin kendisini yaz)
2. Hukuki Değerlendirme: Maddenin anlamını açıkla.
3. Uygunluk Etiketi: Bu madde Türk hukukuna göre uygun mu, riskli mi, yoksa geçersiz mi? Sadece birini seç ve başına simgesini koy:
   ✅ Uygun Madde
   🟡 Riskli Madde
   🔴 Geçersiz Madde
4. Gerekçe: Neden böyle olduğunu açıkla.
5. Kanuni Dayanak: Türk Borçlar Kanunu, Anayasa, İş Kanunu gibi mevzuatlardan ilgili maddeyi belirt (örn: “TBK m. 26 - Ahlaka aykırılık”).

Örnek format:
---
Madde 1:
Madde İçeriği: [metin]
Hukuki Değerlendirme: [...]
🟡 Riskli Madde
Gerekçe: [...]
Kanuni Dayanak: Türk Borçlar Kanunu m. [...]
---
Açıklamalar sade, net ve anlaşılır olmalıdır. Gereksiz tekrar ya da genel ifadeler kullanma. 
Sadece analiz et ve çıktıyı yukarıdaki formatta oluştur.
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
