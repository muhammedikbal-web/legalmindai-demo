
import { OpenAIStream } from "../../utils/OpenAIStream";

export const config = {
  runtime: "edge",
};

const handler = async (req) => {
  const { contractText } = await req.json();

  const prompt = `Aşağıda yer alan sözleşme maddelerini madde madde analiz et.

Her madde için:

1. Maddenin anlamını ve taraflara yüklediği yükümlülükleri açıkla.
2. Maddenin Türk hukukuna (özellikle Türk Borçlar Kanunu, Anayasa, İş Kanunu, Tüketici Kanunu gibi temel düzenlemelere) göre geçerli olup olmadığını değerlendir.
3. Maddenin içinde ciddi bir eşitsizlik, tek taraflılık, genel işlem koşullarına aykırılık, kanuna aykırı feragat ya da kamu düzenine aykırılık varsa bunu belirt.
4. Eğer madde hukuki risk barındırıyorsa "🟡 Riskli Madde" olarak etiketle ve nedenini açıkla.
5. Eğer madde Türk hukukuna açıkça aykırıysa "🔴 Geçersiz Madde" olarak etiketle ve ilgili kanun hükmünü belirt.
6. Eğer madde uygun ve geçerliyse "✅ Uygun Madde" olarak etiketle.

Cevabı çok teknik değil, kullanıcıların da anlayacağı açıklıkta yaz. Her madde için ayrı ayrı değerlendir ve etiketlemeyi açıkça yaz.

Sözleşme metni:
${contractText}`;

  const payload = {
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Bir hukuk uzmanı gibi davran.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.2,
    stream: true,
  };

  const stream = await OpenAIStream(payload);
  return new Response(stream);
};

export default handler;
