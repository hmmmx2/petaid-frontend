"use client";

import { useEffect, useState } from "react";
import s from "@/app/(app)/dashboard.module.css";
import { ApiError, api } from "@/lib/api";
import type { Quiz, QuizAttempt } from "@/lib/types";

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [active, setActive] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.quizzes().then(setQuizzes).catch((e) => setErr(asMsg(e)));
  }, []);

  function open(q: Quiz) {
    setActive(q);
    setAnswers(new Array(q.questions.length).fill(-1));
    setAttempt(null);
  }

  async function submit() {
    if (!active) return;
    if (answers.some((a) => a < 0)) {
      setErr("Please answer every question before submitting.");
      return;
    }
    setErr(null);
    try {
      const result = await api.submitQuiz(active.id, answers);
      setAttempt(result);
    } catch (e) {
      setErr(asMsg(e));
    }
  }

  return (
    <>
      <div className={s.mainTop}>
        <div>
          <div className={s.wTitle}>Take a Quiz</div>
          <div className={s.wSub}>
            Reinforce what you learned from PetAid resources before a real emergency
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 14 }}>
        <div>
          {quizzes.map((q) => (
            <button
              key={q.id}
              onClick={() => open(q)}
              style={{
                width: "100%",
                textAlign: "left",
                background: "var(--card)",
                border:
                  active?.id === q.id
                    ? "1.5px solid var(--coral)"
                    : "0.5px solid var(--border2)",
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{q.title}</div>
              <div style={{ fontSize: 11, color: "var(--t3)" }}>
                {q.questions.length} questions · pass {q.passing_score}%
              </div>
            </button>
          ))}
        </div>

        <div
          style={{
            background: "var(--card)",
            border: "0.5px solid var(--border2)",
            borderRadius: 12,
            padding: 18,
            minHeight: 200,
          }}
        >
          {!active ? (
            <Empty>Select a quiz on the left to begin.</Empty>
          ) : attempt ? (
            <Result attempt={attempt} reset={() => setAttempt(null)} />
          ) : (
            <>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 12 }}>
                {active.title}
              </div>
              {active.questions.map((q, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, marginBottom: 6 }}>
                    {i + 1}. {q.prompt}
                  </div>
                  {q.options.map((opt, j) => (
                    <label
                      key={j}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 0",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="radio"
                        name={`q-${i}`}
                        checked={answers[i] === j}
                        onChange={() => {
                          const next = [...answers];
                          next[i] = j;
                          setAnswers(next);
                        }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ))}
              {err && <div className="err">{err}</div>}
              <button onClick={submit} style={btn}>
                Submit answers
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Result({ attempt, reset }: { attempt: QuizAttempt; reset: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "30px 0" }}>
      <div style={{ fontSize: 11, color: "var(--t3)", textTransform: "uppercase", letterSpacing: 0.5 }}>
        Score
      </div>
      <div style={{ fontSize: 48, fontWeight: 600, color: attempt.passed ? "var(--teal)" : "var(--coral)" }}>
        {attempt.score_pct}%
      </div>
      <div style={{ fontSize: 13, color: "var(--t2)", marginBottom: 18 }}>
        {attempt.passed ? "Passed — well done!" : "Below passing score, try again."}
      </div>
      <button onClick={reset} style={btn}>
        Try again
      </button>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: "var(--t3)", padding: 16 }}>{children}</div>;
}

const btn: React.CSSProperties = {
  padding: "10px 18px",
  background: "var(--black)",
  color: "var(--ivory)",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 500,
};

function asMsg(e: unknown): string {
  return e instanceof ApiError ? e.message : "Failed";
}
