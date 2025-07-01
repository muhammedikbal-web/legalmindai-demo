export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  const { textToTranslate, prompt } = req.body; // Gelen metni ve prompt'u alıyoruz

  if (!textToTranslate || textToTranslate.trim() === "") {
    return res.status(400).json({ result: "Çevrilecek metin belirtilmedi." });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4", // Veya daha uygun bir model seçimi yapabiliriz
        messages: [{ role: "user", content: prompt }], // Kullanıcının gönderdiği prompt'u kullanıyoruz
        temperature: 0.3, // Çeviride tutarlılık için düşük sıcaklık
      }),
    });

    const data = await response.json();

    const result = data.choices?.[0]?.message?.content || "Çeviri alınamadı.";
    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ error: "Sunucu hatası: " + error.message });
  }
}