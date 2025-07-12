// pages/api/translate.js

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { textToTranslate, prompt } = req.body;

  if (!textToTranslate) {
    return res.status(400).json({ error: 'Çevrilecek metin sağlanmadı.' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // veya kullandığınız model
      messages: [
        {
          role: "system",
          content: `
            You are a highly skilled legal translator. Your task is to translate the given English legal text into Turkish.
            
            RULES FOR TRANSLATION:
            1. Maintain the **exact original paragraph and line break structure**. Do not combine paragraphs or introduce new line breaks unless they exist in the original.
            2. Ensure **correct and established legal terminology** is used for Turkish equivalents.
            3. Translate **only the provided text**. Do not add any extra comments, explanations, or introductory/concluding remarks.
            4. Preserve the numbering and formatting (like "Madde 1 - Konu") precisely as they appear in the source text.
            5. Pay close attention to punctuation and spacing to replicate the original layout as accurately as possible.
            
            Example for line breaks:
            Original:
            Article 1 - Subject
            This Agreement defines...
            
            Translated:
            Madde 1 - Konu
            Bu Sözleşme tanımlar...

            Original:
            Party A agrees to provide...
            Service includes:
            - Design
            - Consulting
            
            Translated:
            Taraf A sağlamayı kabul eder...
            Hizmet şunları içerir:
            - Tasarım
            - Danışmanlık
            
            Crucially, **do not inject extra newline characters like "\\n" unless they are explicitly present or implied by paragraph breaks in the source text.**
            The goal is a direct, accurate, and visually identical translation in terms of layout.
          `, // <-- PROMPT BURADA GÜNCELLENDİ
        },
        {
          role: "user",
          content: textToTranslate,
        },
      ],
      temperature: 0.2, // Daha düşük sıcaklık ile daha tutarlı çıktılar almayı hedefliyoruz
      response_format: { type: "text" }, // Metin çıktısı bekliyoruz
    });

    const translatedText = completion.choices[0]?.message?.content || "";

    res.status(200).json({ translatedText });

  } catch (error) {
    console.error('OpenAI API Hatası:', error);
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json({ error: error.response.data.error.message });
    } else {
      res.status(500).json({ error: 'Çeviri hizmetiyle iletişim kurulamadı.' });
    }
  }
}