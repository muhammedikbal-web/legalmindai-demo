export default async function handler(req, res) {
  try {
    const { text } = req.body;
    const apiKey = process.env.OPENAI_API_KEY;

    const completion = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Sen deneyimli bir Türk avukatsın. Gönderilen sözleşme metnini Türk hukukuna göre analiz edip madde madde özetle." },
          { role: "user", content: text }
        ]
      })
    });

    const data = await completion.json();

    if (data.error) {
      return res.status(500).json({ result: `API Hatası: ${data.error.message}` });
    }

    const message = data.choices?.[0]?.message?.content || "Model cevap vermedi.";
    res.status(200).json({ result: message });

  } catch (error) {
    res.status(500).json({ result: `Sunucu Hatası: ${error.message}` });
  }
}
