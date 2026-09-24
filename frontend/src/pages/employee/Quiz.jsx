import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, CircleCheck } from "../../components/Icons";
import { Card, Badge, Button } from "../../components/UI";
import { quizQuestions } from "../../data/mock";
import { useLanguage } from "../../contexts/LanguageContext";

// Tỷ lệ đúng tối thiểu để đạt
const PASS_RATIO = 2 / 3;

export default function Quiz() {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [done, setDone] = useState(false);
  const { t, pick } = useLanguage();
  const q = quizQuestions[index];
  const selected = answers[q.id];
  const sourceLabel = question => `${question.source} · ${t("page_abbr")}${question.sourceRef.page}`;

  if (done) {
    // Tính điểm thật từ câu trả lời thay vì hard-code "2 / 3"
    const correctCount = quizQuestions.filter(x => answers[x.id] === x.answer).length;
    const passed = correctCount / quizQuestions.length >= PASS_RATIO;
    return (
      <div className="quiz-result">
        <Card>
          <div className="result-icon"><CircleCheck size={34} /></div>
          <span className="eyebrow">{t("quiz_completed")}</span>
          <h1>{t("quiz_score", { c: correctCount, n: quizQuestions.length })}</h1>
          <p>{passed ? t("quiz_passed_desc") : t("quiz_failed_desc")}</p>
          <div className="result-list">
            {quizQuestions.map((x, i) => (
              <div key={x.id}>
                <strong>{i + 1}. {pick(x, "question")}</strong>
                <Badge tone={answers[x.id] === x.answer ? "green" : "red"}>{answers[x.id] === x.answer ? t("correct") : t("review_label")}</Badge>
              </div>
            ))}
          </div>
          <Button onClick={() => { setDone(false); setIndex(0); setAnswers({}); }}>{t("retake_quiz")}</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="quiz-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("knowledge_check")}</span>
          <h1>{t("quiz_name")}</h1>
          <p>{t("question_of", { i: index + 1, n: quizQuestions.length })}</p>
        </div>
        <Badge tone="purple">{t("source_grounded")}</Badge>
      </div>
      <div className="quiz-progress">
        <span>{t("progress_label")}</span>
        <div>{quizQuestions.map((_, i) => <i className={i <= index ? "active" : ""} key={i} />)}</div>
      </div>
      <Card className="question-card">
        <span className="question-number">{t("question_label", { n: String(index + 1).padStart(2, "0") })}</span>
        <h2>{pick(q, "question")}</h2>
        <div className="options">
          {pick(q, "options").map((o, i) => (
            <button className={`option ${selected === i ? "selected" : ""}`} onClick={() => setAnswers({ ...answers, [q.id]: i })} key={o}>
              <span>{String.fromCharCode(65 + i)}</span>{o}
            </button>
          ))}
        </div>
        <div className="question-source"><FileText size={15} /><span>{t("answer_source")} <strong>{sourceLabel(q)}</strong></span></div>
      </Card>
      <div className="quiz-nav">
        <Button variant="secondary" disabled={index === 0} onClick={() => setIndex(index - 1)} icon={<ChevronLeft size={16} />}>{t("previous")}</Button>
        <Button disabled={selected === undefined} onClick={() => index === quizQuestions.length - 1 ? setDone(true) : setIndex(index + 1)}>
          {index === quizQuestions.length - 1 ? t("finish_quiz") : t("next_question")} <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
