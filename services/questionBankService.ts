import { generateContent } from './geminiService';
import { QuestionBankQuestion, QuestionBankQuestionType } from '../types';

export interface QuestionBankConfig {
  subject: string;
  grade: number;
  unit: string;
  topic?: string;
  difficulty: number;
  questionCounts: {
    multiple_choice?: number;
    true_false?: number;
    open_ended?: number;
    matching?: number;
  };
}

export async function generateQuestionBank(config: QuestionBankConfig): Promise<QuestionBankQuestion[]> {
  const { subject, grade, unit, topic, difficulty, questionCounts } = config;

  const totalQuestions = Object.values(questionCounts).reduce((sum, count) => sum + (count || 0), 0);

  const questionTypeDescriptions: string[] = [];
  if (questionCounts.multiple_choice) {
    questionTypeDescriptions.push(`${questionCounts.multiple_choice} adet çoktan seçmeli (4 şık)`);
  }
  if (questionCounts.true_false) {
    questionTypeDescriptions.push(`${questionCounts.true_false} adet doğru/yanlış`);
  }
  if (questionCounts.open_ended) {
    questionTypeDescriptions.push(`${questionCounts.open_ended} adet açık uçlu`);
  }
  if (questionCounts.matching) {
    questionTypeDescriptions.push(`${questionCounts.matching} adet eşleştirme (5 eşleştirme çifti)`);
  }

  const difficultyText = ['Çok Kolay', 'Kolay', 'Orta', 'Zor', 'Çok Zor'][difficulty - 1];

  const prompt = `Sen bir ${grade}. sınıf ${subject} öğretmenisin. Aşağıdaki kriterlere göre bir soru bankası oluştur:

Ders: ${subject}
Sınıf: ${grade}
Ünite: ${unit}
${topic ? `Konu: ${topic}` : ''}
Zorluk Seviyesi: ${difficulty}/5 (${difficultyText})

Oluşturulacak sorular:
${questionTypeDescriptions.join('\n')}

ÖNEMLI KURALLAR:
1. Her soru ${grade}. sınıf müfredat seviyesinde olmalı
2. Sorular net ve anlaşılır Türkçe ile yazılmalı
3. Çoktan seçmeli sorularda şıklar dengeli zorlukte olmalı
4. Açık uçlu sorularda örnek cevap ve değerlendirme kriterleri ver
5. Eşleştirme sorularında 5 çift olmalı
6. Her soruya zorluk seviyesi (1-5) ve puan ver

Lütfen aşağıdaki JSON formatında döndür:

{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Soru metni burada",
      "difficulty": ${difficulty},
      "points": 4,
      "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
      "correct_answer": "B şıkkı",
      "explanation": "Doğru cevap B çünkü..."
    },
    {
      "id": "q2",
      "type": "true_false",
      "question": "Doğru/Yanlış soru metni",
      "difficulty": ${difficulty},
      "points": 2,
      "correct_answer": "Doğru",
      "explanation": "Açıklama..."
    },
    {
      "id": "q3",
      "type": "open_ended",
      "question": "Açık uçlu soru metni",
      "difficulty": ${difficulty},
      "points": 10,
      "model_answer": "Örnek cevap burada",
      "rubric": ["Kriter 1", "Kriter 2", "Kriter 3"],
      "explanation": "Değerlendirme notları"
    },
    {
      "id": "q4",
      "type": "matching",
      "question": "Eşleştirme soru metni",
      "difficulty": ${difficulty},
      "points": 5,
      "left_items": ["Sol 1", "Sol 2", "Sol 3", "Sol 4", "Sol 5"],
      "right_items": ["Sağ A", "Sağ B", "Sağ C", "Sağ D", "Sağ E"],
      "correct_pairs": {
        "Sol 1": "Sağ A",
        "Sol 2": "Sağ B",
        "Sol 3": "Sağ C",
        "Sol 4": "Sağ D",
        "Sol 5": "Sağ E"
      },
      "explanation": "Eşleştirme açıklaması"
    }
  ]
}

SADECE JSON döndür, başka metin ekleme!`;

  try {
    const response = await generateContent(prompt);

    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonText);
    return parsed.questions || [];
  } catch (error) {
    console.error('Error generating question bank:', error);
    throw new Error('Soru bankası oluşturulamadı. Lütfen tekrar deneyin.');
  }
}

export async function extractQuestionsFromPDF(pdfText: string, subject: string, grade: number, unit: string): Promise<QuestionBankQuestion[]> {
  const prompt = `Sen bir eğitim uzmanısın. Aşağıdaki metin bir PDF testinden alınmıştır. Lütfen bu testteki TÜM soruları, şıkları ve doğru cevapları tespit et.

PDF İçeriği:
${pdfText}

Test Bilgileri:
Ders: ${subject}
Sınıf: ${grade}
Ünite: ${unit}

ÖNEMLI:
1. Her sorunun tipini belirle (çoktan seçmeli, doğru/yanlış, açık uçlu, eşleştirme)
2. Doğru cevapları tespit et (eğer belirtilmişse)
3. Her soruya zorluk seviyesi (1-5) ve puan ver
4. Soru numaralarını koru

JSON formatında döndür:

{
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice",
      "question": "Soru metni",
      "difficulty": 3,
      "points": 4,
      "options": ["A", "B", "C", "D"],
      "correct_answer": "B",
      "explanation": "Açıklama (varsa)"
    }
  ]
}

SADECE JSON döndür!`;

  try {
    const response = await generateContent(prompt);

    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const parsed = JSON.parse(jsonText);
    return parsed.questions || [];
  } catch (error) {
    console.error('Error extracting questions from PDF:', error);
    throw new Error('PDF\'den sorular çıkarılamadı. Lütfen tekrar deneyin.');
  }
}

export async function evaluateOpenEndedAnswer(
  question: string,
  studentAnswer: string,
  modelAnswer: string,
  rubric: string[]
): Promise<{ score: number; feedback: string; strengths: string[]; improvements: string[] }> {
  const prompt = `Sen bir ${question} sorusunu değerlendiren öğretmensin.

SORU: ${question}

ÖRNEK CEVAP:
${modelAnswer}

ÖĞRENCİ CEVABI:
${studentAnswer}

DEĞERLENDİRME KRİTERLERİ:
${rubric.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Lütfen öğrenci cevabını değerlendir ve JSON formatında döndür:

{
  "score": 0-100 arası puan,
  "feedback": "Genel değerlendirme",
  "strengths": ["Güçlü yön 1", "Güçlü yön 2"],
  "improvements": ["Geliştirilmesi gereken 1", "Geliştirilmesi gereken 2"]
}

SADECE JSON döndür!`;

  try {
    const response = await generateContent(prompt);

    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return {
      score: 0,
      feedback: 'Değerlendirme yapılamadı.',
      strengths: [],
      improvements: []
    };
  }
}

export function calculateScore(questions: QuestionBankQuestion[], answers: Record<string, any>): { score: number; totalCorrect: number } {
  const totalQuestions = questions.length;
  const pointsPerQuestion = totalQuestions > 0 ? 100 / totalQuestions : 0;

  let earnedPoints = 0;
  let totalCorrect = 0;

  console.log('=== CALCULATE SCORE (100 puan sistemi) ===');
  console.log('Toplam Soru:', totalQuestions);
  console.log('Her Soru:', pointsPerQuestion.toFixed(2), 'puan');
  console.log('Cevaplanan:', Object.keys(answers).length);

  questions.forEach((question, idx) => {
    const answer = answers[question.id];

    console.log(`\nSoru ${idx + 1} [${question.type}]: ${pointsPerQuestion.toFixed(2)} puan`);

    if (!answer) {
      console.log('  → Cevaplanmadı: 0 puan');
      return;
    }

    if (question.type === 'multiple_choice' || question.type === 'true_false') {
      const isCorrect = answer === question.correct_answer;
      console.log(`  Cevap: "${answer}"`);
      console.log(`  Doğru: "${question.correct_answer}"`);
      console.log(`  Eşleşme: ${isCorrect}`);

      if (isCorrect) {
        earnedPoints += pointsPerQuestion;
        totalCorrect++;
        console.log(`  → DOĞRU: +${pointsPerQuestion.toFixed(2)} puan`);
      } else {
        console.log(`  → YANLIŞ: 0 puan`);
      }
    } else if (question.type === 'matching') {
      const correctPairs = question.correct_pairs || {};
      const userPairs = answer as Record<string, string>;
      let correctCount = 0;

      Object.keys(correctPairs).forEach(key => {
        if (userPairs[key] === correctPairs[key]) {
          correctCount++;
        }
      });

      const pairScore = (correctCount / Object.keys(correctPairs).length) * pointsPerQuestion;
      earnedPoints += pairScore;

      if (correctCount === Object.keys(correctPairs).length) {
        totalCorrect++;
        console.log(`  → TAM DOĞRU: ${correctCount}/${Object.keys(correctPairs).length} = +${pairScore.toFixed(2)} puan`);
      } else {
        console.log(`  → KISMEN DOĞRU: ${correctCount}/${Object.keys(correctPairs).length} = +${pairScore.toFixed(2)} puan`);
      }
    } else if (question.type === 'open_ended') {
      if (question.aiEvaluation && typeof question.aiEvaluation === 'object') {
        const aiScore = question.aiEvaluation.score || 0;
        const pts = (aiScore / 100) * pointsPerQuestion;
        earnedPoints += pts;
        if (aiScore >= 50) totalCorrect++;
        console.log(`  → AI DEĞERLENDİRME: ${aiScore}/100 = +${pts.toFixed(2)} puan`);
      } else if (typeof answer === 'string' && answer.trim().length > 0) {
        const pts = pointsPerQuestion * 0.5;
        earnedPoints += pts;
        console.log(`  → DEĞERLENDİRİLMEDİ (kısmi): +${pts.toFixed(2)} puan`);
      } else {
        console.log(`  → CEVAPLANMADI: 0 puan`);
      }
    }
  });

  const score = Math.round(earnedPoints);

  console.log('\n=== SONUÇ ===');
  console.log(`Kazanılan: ${earnedPoints.toFixed(2)} puan`);
  console.log(`Final Skor: ${score}/100`);
  console.log(`Doğru Sayısı: ${totalCorrect}/${totalQuestions}`);

  return { score, totalCorrect };
}
