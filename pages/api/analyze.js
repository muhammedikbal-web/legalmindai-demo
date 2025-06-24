// pages/api/analyze.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  const { contractText } = req.body;

  if (!contractText || contractText.trim().length === 0) {
    return res.status(400).json({ result: "Sözleşme metni belirtilmedi." });
  }

  const prompt = `Aşağıdaki sözleşme maddelerini madde madde analiz et. Her maddenin:

- İçeriğini açıkla,
- Türk hukukuna (özellikle Türk Borçlar Kanunu, Anayasa, İş Kanunu vb.) göre riskli veya geçersiz olup olmadığını değerlendir,
- Risk varsa nedenini ve kanuni dayanağıyla birlikte belirt.

🟡 Riskli Madde  
🔴 Geçersiz Madde  
✅ Uygun Madde

Metin:
${contractText}

Analiz:
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      const result = data.choices[0].message.content;
      return res.status(200).json({ result });
    } else {
      return res.status(500).json({ result: "Cevap alınamadı." });
    }

  } catch (error) {
    console.error("API Hatası:", error);
    return res.status(500).json({ result: "Sunucu hatası oluştu." });
  }
}


 