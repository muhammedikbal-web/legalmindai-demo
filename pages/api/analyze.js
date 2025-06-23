export default async function handler(req, res) {
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
      messages: [{ role: "user", content: `Bu sözleşmeyi analiz et ve özetle:

${text}` }]
    })
  });

  const data = await completion.json();
  const message = data.choices?.[0]?.message?.content || "Cevap alınamadı.";
  res.status(200).json({ result: message });
}
