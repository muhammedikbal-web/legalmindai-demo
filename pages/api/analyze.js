export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Sadece POST isteği destekleniyor.", { status: 405 });
  }

  const { input } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return new Response("API anahtarı eksik.", { status: 500 });
  }

  const prompt = `
Aşağıdaki sözleşme maddelerini madde madde analiz et. Her madde için:

1. İçeriğini açıkla,
2. Türk hukukuna (özellikle Türk Borçlar Kanunu, Anayasa, İş Kanunu vb.) göre riskli veya geçersiz olup olmadığını değerlendir,
3. Risk varsa nedenini ve ilgili kanuni dayanağı belirt,
4. Şu etiketlerden birini ver:
   - 🟡 Riskli Madde
   - 🔴 Geçersiz Madde
   - ✅ Uygun Madde

Sözleşme metni:
${input}
`;

  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.4,
    }),
  });

  const data = await completion.json();

  if (!data.choices || !data.choices[0]) {
    return new Response(JSON.stringify({ result: "Cevap alınamadı." }), {
      status: 200,
    });
  }

  const result = data.choices[0].message.content;
  return new Response(JSON.stringify({ result }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
