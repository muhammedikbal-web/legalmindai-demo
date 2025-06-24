import { OpenAIStream } from "../../utils/OpenAIStream";

export const config = {
  runtime: "edge",
};

const handler = async (req) => {
  const { prompt } = await req.json();

  const fullPrompt = `
Aşağıdaki sözleşme maddelerini madde madde analiz et. Her maddenin:

1. İçeriğini açıkla.
2. Türk hukukuna (özellikle Türk Borçlar Kanunu, Anayasa, İş Kanunu vb.) göre riskli veya geçersiz olup olmadığını değerlendir.
3. Risk varsa nedenini ve kanuni dayanağıyla birlikte belirt.

Ayrıca her maddenin sonuna aşağıdaki uygun etiketi ekle:

✅ Uygun Madde
🟡 Riskli Madde
🔴 Geçersiz Madde

Sözleşme:
${prompt}
`;

  const payload = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: fullPrompt }],
    temperature: 0.4,
    stream: true,
  };

  const stream = await OpenAIStream(payload);
  return new Response(stream);
};

export default handler;
