// pages/api/analyze.js

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { contractText } = req.body;

  if (!contractText) {
    return res.status(400).json({ error: 'Sözleşme metni sağlanmadı.' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // veya kullandığınız model (gpt-4o en son ve en iyi olabilir)
      messages: [
        {
          role: "system",
          content: `
            You are a highly specialized AI legal assistant. Your task is to analyze the provided Turkish contract text and identify key clauses, potential risks, and their legal implications.
            
            Strictly follow the JSON output format provided below. Do not include any additional text, explanations, or formatting outside of the JSON.
            
            For each identified clause, provide:
            - **title**: A concise title for the clause (e.g., "Sözleşmenin Konusu", "Fesih Koşulları").
            - **explanation**: A detailed explanation of the clause, its legal meaning, and potential implications in Turkish.
            - **status**: Categorize the clause's legal standing as one of the following: "Uygun" (Compliant/Appropriate), "Riskli" (Risky), or "Geçersiz" (Invalid). **Strictly use one of these three Turkish words.**
            
            The output MUST be a JSON array of objects, where each object represents an analyzed clause.
            
            Example JSON Structure:
            [
              {
                "title": "Sözleşmenin Geçerliliği",
                "explanation": "Bu sözleşmenin geçerliliği için tarafların imzasının bulunup bulunmadığına dikkat edilmelidir. Geçerli bir imza olmadan sözleşme hukuki sonuç doğurmaz.",
                "status": "Riskli"
              },
              {
                "title": "İş Yeri Değişikliği ve Masraflar",
                "explanation": "Sözleşmede iş yeri değişikliğinin nasıl yapılacağı ve bununla ilgili masrafların kim tarafından karşılanacağına dair net bir hüküm bulunmamaktadır. Bu durum gelecekte ihtilaflara yol açabilir.",
                "status": "Riskli"
              }
            ]
          `,
        },
        {
          role: "user",
          content: contractText,
        },
      ],
      temperature: 0.7, // Düşük tutuculuk, daha iyi format takibi için artırıldı
      response_format: { type: "json_object" }, // JSON çıktısı bekleniyor
    });

    // Modelin çıktısı doğrudan bir JSON string'i olacağı için parse etmemiz gerekiyor
    const rawAnalysisResult = completion.choices[0]?.message?.content;
    const analysisResult = JSON.parse(rawAnalysisResult); // JSON string'ini JavaScript objesine dönüştürüyoruz

    if (!Array.isArray(analysisResult)) {
        throw new Error('API yanıtı beklenen JSON dizisi formatında değil.');
    }

    res.status(200).json({ analysisResult });

  } catch (error) {
    console.error('OpenAI API Hatası:', error);
    // Hatanın detaylarını loglayalım
    if (error.response) {
      console.error('API Yanıt Durumu:', error.response.status);
      console.error('API Yanıt Verisi:', error.response.data);
      res.status(error.response.status).json({ error: error.response.data.error.message || 'API Hatası' });
    } else if (error instanceof SyntaxError) {
        console.error('JSON Parse Hatası:', error.message);
        res.status(500).json({ error: 'API\'den gelen yanıt geçerli bir JSON değil. Lütfen tekrar deneyin.' });
    }
    else {
      res.status(500).json({ error: 'Analiz hizmetiyle iletişim kurulamadı veya beklenmedik bir hata oluştu.' });
    }
  }
}