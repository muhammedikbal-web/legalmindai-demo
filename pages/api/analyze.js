export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Yalnızca POST istekleri desteklenir." });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: "Metin içeriği eksik." });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Sen Türk hukukuna göre analiz yapan uzman bir hukuk danışmanısın. Kullanıcıdan gelen sözleşme metnini incele, riskli maddeleri tespit et ve şu formatta detaylı cevap ver: \n1. Madde Başlığı,\n2. Risk Derecesi (Düşük/Orta/Yüksek),\n3. Açıklama (neden riskli?),\n4. Öneri (nasıl düzeltilmeli?).\nYalnızca önemli maddeleri özetle."
          },
          {
            role: "user",
            content: text
          }
        ],
        temperature: 0.4
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ message: "OpenAI API hatası", error: data });
    }

    const analysis = data.choices[0].message.content;

    return res.status(200).json({ analysis });
  } catch (error) {
    return res.status(500).json({ message: "Sunucu hatası", error: error.message });
  }
}