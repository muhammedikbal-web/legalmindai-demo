export default async function handler(req, res) {
  const { text } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API key missing' });
  }

  const prompt = `Aşağıdaki sözleşme metnini Türk hukuku bağlamında analiz et ve önemli maddeleri açıkla:\n\n${text}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await response.json();
  res.status(200).json({ result: data.choices?.[0]?.message?.content || 'Yanıt alınamadı.' });
}