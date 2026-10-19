
"use client";

import { useEffect, useState } from "react";

type Topic = {
  id: string;
  title: string;
  description: string;
  content: string;
  image_url: string | null;
  icon: string;
  quiz_id: string | null;
  quiz_title: string | null;
  activity_id: string | null;
  activity_title: string | null;
  activity_instructions: string | null;
  drive_url: string | null;
};

type Question = {
  id: number;
  question: string;
  options: { value: string; label: string }[];
  correct_answer?: string;
  selected_answer?: string;
};

type Quiz = {
  quiz: { id: string; title: string };
  questions: Question[];
  alreadyAttempted: boolean;
  previousScore?: number;
  review?: Question[];
};

export default function Home() {
  const [role, setRole] = useState<"choose" | "student">("choose");
  const [name, setName] = useState("");
  const [student, setStudent] = useState<{
    id: number;
    full_name: string;
  } | null>(null);

  const [topics, setTopics] = useState<Topic[]>([]);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [tab, setTab] = useState("read");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadTopics() {
    try {
      const response = await fetch("/api/topics");

      if (response.ok) {
        const data = await response.json();
        setTopics(data.topics || []);
      }
    } catch {
      setMessage("Could not load topics. Please refresh the page.");
    }
  }

  useEffect(() => {
    void loadTopics();
  }, []);

  async function start(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/student/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not start.");
      }

      setStudent(data.student);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not start."
      );
    } finally {
      setBusy(false);
    }
  }

  async function openTab(selectedTab: string) {
  if (!topic || !student) return;

  setTab(selectedTab);
  setMessage("");
  setQuiz(null);
  setAnswers({});

  if (selectedTab === "quiz") {
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          topicId: topic.id,
        }),
      });

      const response = await fetch(
        `/api/topics/${encodeURIComponent(topic.id)}/quiz?studentId=${student.id}`
      );

      const responseText = await response.text();

let data: any;

try {
  data = JSON.parse(responseText);
} catch {
  throw new Error(
    `Quiz API returned invalid data. HTTP status: ${response.status}`
  );
}

      if (!response.ok) {
        throw new Error(data.error || "Could not load quiz.");
      }

      setQuiz(data);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load quiz."
      );
    }
  }
}

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!topic || !student || !quiz || busy) return;

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          topicId: topic.id,
          answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not submit quiz.");
      }

      setQuiz({
        ...quiz,
        alreadyAttempted: true,
        previousScore: data.scorePercentage,
        review: data.review,
      });

      setMessage(
        `Score: ${data.correctAnswers}/${data.totalQuestions} ` +
          `(${data.scorePercentage}%). This quiz cannot be retaken.`
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not submit quiz."
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirmActivity() {
    if (!student || !topic?.activity_id) return;

    try {
      const response = await fetch("/api/activities/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          activityId: topic.activity_id,
        }),
      });

      const data = await response.json();

      setMessage(
        response.ok
          ? "Submission confirmation recorded."
          : data.error || "Could not confirm."
      );
    } catch {
      setMessage("Could not confirm activity submission.");
    }
  }

  // Role selection screen
  if (!student && role === "choose") {
    return (
      <main className="container flex min-h-screen items-center justify-center py-10">
        <section className="panel w-full max-w-2xl p-8 md:p-10">
          <div className="mb-5 inline-flex rounded-2xl bg-[var(--lilac)] p-4 text-3xl">
            💬
          </div>

          <p className="text-sm font-bold uppercase tracking-wider text-[var(--purple)]">
            Welcome to
          </p>

          <h1 className="my-2 text-3xl font-bold">
            Urban Bendang Innovators
          </h1>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => {
                setRole("student");
                setMessage("");
              }}
              className="rounded-2xl border border-[var(--line)] bg-[var(--lilac)] p-6 text-left transition hover:-translate-y-1"
            >
              <span className="text-4xl">🎓</span>
              <h2 className="mt-4 text-xl font-bold">
                Enter as Student
              </h2>
              <p className="mt-2 text-sm">
                Read topics, complete quizzes and submit activities.
              </p>
              <span className="mt-5 inline-block font-bold">
                Continue as student →
              </span>
            </button>

            <a
              href="/teacher/login"
              className="rounded-2xl border border-[var(--line)] bg-[var(--peach)] p-6 text-left transition hover:-translate-y-1"
            >
              <span className="text-4xl">👩‍🏫</span>
              <h2 className="mt-4 text-xl font-bold">
                Enter as Teacher
              </h2>
              <p className="mt-2 text-sm">
                Manage learning topics, quizzes, activities and student reports.
              </p>
              <span className="mt-5 inline-block font-bold">
                Teacher login →
              </span>
            </a>
          </div>
        </section>
      </main>
    );
  }

  // Student entry screen
  if (!student) {
    return (
      <main className="container flex min-h-screen items-center justify-center py-10">
        <section className="panel w-full max-w-lg p-8">
          <button
            className="secondary mb-5"
            onClick={() => {
              setRole("choose");
              setMessage("");
            }}
          >
            ← Back to role selection
          </button>

          <div className="mb-5 inline-flex rounded-2xl bg-[var(--lilac)] p-4 text-3xl">
            🎓
          </div>

          <p className="text-sm font-bold uppercase tracking-wider text-[var(--purple)]">
            Student access
          </p>

          <h1 className="my-2 text-3xl font-bold">Ready to learn?</h1>

          <p className="muted mb-7">
            Enter your full name to open the learning topics.
          </p>

          <form onSubmit={start} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                className="field"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={150}
              />
            </div>

            {message && (
              <p className="text-sm text-red-700">{message}</p>
            )}

            <button className="btn w-full" disabled={busy}>
              {busy ? "Please wait…" : "Start learning →"}
            </button>
          </form>

          <p className="muted mt-5 text-xs">
            Name-only entry does not verify identity.
          </p>
        </section>
      </main>
    );
  }

  // Student learning screen
  return (
    <main className="container py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase text-[var(--purple)]">
            Urban Bendang Innovators
          </p>
          <h1 className="text-3xl font-bold">
            Hello, {student.full_name} 👋
          </h1>
          <p className="muted mt-2">
            Learn a topic, take its quiz and complete the activity.
          </p>
        </div>

        <a className="secondary" href="/teacher/login">
          Teacher login
        </a>
      </header>

      {!topic ? (
        <>
          <h2 className="mb-4 text-xl font-bold">Your topics</h2>

          {!topics.length ? (
            <section className="panel p-8 text-center">
              <h3 className="font-bold">No published topics yet</h3>
              <p className="muted mt-2">
                Your teacher will publish lessons here.
              </p>
            </section>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setTopic(item);
                    setTab("read");
                    setQuiz(null);
                    setAnswers({});
                    setMessage("");
                  }}
                  className="panel p-6 text-left transition hover:-translate-y-1"
                >
                  <div
                    className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${
                      index % 3 === 0
                        ? "bg-[var(--lilac)]"
                        : index % 3 === 1
                          ? "bg-[var(--peach)]"
                          : "bg-[var(--mint)]"
                    }`}
                  >
                    {item.icon || "📘"}
                  </div>

                  <h3 className="text-lg font-bold">{item.title}</h3>
                  <p className="muted mt-2">{item.description}</p>

                  <span className="mt-5 inline-block font-bold text-[var(--purple)]">
                    Open topic →
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <section className="panel p-6 md:p-8">
          <button
            className="secondary mb-5"
            onClick={() => {
              setTopic(null);
              setQuiz(null);
              setAnswers({});
              setMessage("");
            }}
          >
            ← All topics
          </button>

          <h2 className="text-2xl font-bold">
            {topic.icon} {topic.title}
          </h2>

          <p className="muted mt-2 mb-6">{topic.description}</p>

          <div className="mb-6 flex flex-wrap gap-2">
            {[
              ["read", "📖 Read"],
              ["quiz", "🧠 Quiz"],
              ["activity", "✍️ Activity"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={tab === value ? "btn" : "secondary"}
                onClick={() => void openTab(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Reading section */}
          {tab === "read" && (
            <article className="whitespace-pre-wrap leading-7">
              {topic.content || "Lesson content has not been added yet."}

              {topic.image_url && (
                <p>
                  <a
                    className="font-bold text-[var(--purple)] underline"
                    href={topic.image_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open lesson resource ↗
                  </a>
                </p>
              )}

              <p className="muted mt-4 text-sm">
                Reading is marked complete when you open this topic’s quiz.
              </p>
            </article>
          )}

          {/* Quiz section */}
          {tab === "quiz" && (
            !topic.quiz_id ? (
              <p className="muted">No quiz is set up yet.</p>
            ) : !quiz ? (
              <p className="muted">Loading quiz…</p>
            ) : quiz.alreadyAttempted ? (
              <div className="space-y-5">
                <div className="rounded-2xl bg-[var(--mint)] p-5">
                  <h3 className="text-xl font-bold">Quiz Review</h3>

                  <p className="mt-2">
                    You have completed this quiz. You cannot retake it.
                  </p>

                  <p className="mt-2 font-bold">
                    Recorded score: {quiz.previousScore ?? 0}%
                  </p>
                </div>

                {(quiz.review || []).length === 0 ? (
                  <p className="muted rounded-xl border border-[var(--line)] p-4">
                    Your quiz review is not available. If you submitted this
                    quiz before the review feature was added, your previous
                    answers may not have been saved.
                  </p>
                ) : (
                  (quiz.review || []).map((question, index) => {
                    const selectedOption = question.options.find(
                      (option) =>
                        option.value === question.selected_answer
                    );

                    const correctOption = question.options.find(
                      (option) =>
                        option.value === question.correct_answer
                    );

                    const isCorrect =
                      question.selected_answer === question.correct_answer;

                    return (
                      <article
                        key={question.id}
                        className="rounded-2xl border border-[var(--line)] p-5"
                      >
                        <h4 className="font-bold">
                          {index + 1}. {question.question}
                        </h4>

                        <div className="mt-4 space-y-3">
                          <div className="rounded-xl bg-[var(--lilac)] p-3">
                            <p className="text-sm font-semibold">
                              Your answer
                            </p>
                            <p className="mt-1">
                              {selectedOption?.label ||
                                "No answer submitted"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-green-500 p-3">
                            <p className="text-sm font-semibold text-green-700">
                              Correct answer
                            </p>
                            <p className="mt-1">
                              {correctOption?.label ||
                                question.correct_answer ||
                                "Not available"}
                            </p>
                          </div>

                          <p
                            className={
                              isCorrect
                                ? "font-semibold text-green-700"
                                : "font-semibold text-red-600"
                            }
                          >
                            {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                          </p>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-6">
                <h3 className="text-xl font-bold">{quiz.quiz.title}</h3>

                {quiz.questions.map((question, index) => (
                  <fieldset
                    key={question.id}
                    className="rounded-2xl border border-[var(--line)] p-4"
                  >
                    <legend className="px-2 font-bold">
                      {index + 1}. {question.question}
                    </legend>

                    <div className="mt-3 space-y-2">
                      {question.options.map((option) => (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-center gap-3 rounded-xl bg-[#fcfaff] p-3"
                        >
                          <input
                            type="radio"
                            name={String(question.id)}
                            value={option.value}
                            checked={
                              answers[String(question.id)] === option.value
                            }
                            onChange={() =>
                              setAnswers((previous) => ({
                                ...previous,
                                [String(question.id)]: option.value,
                              }))
                            }
                            required
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ))}

                <button className="btn" disabled={busy}>
                  {busy ? "Submitting…" : "Submit quiz once"}
                </button>
              </form>
            )
          )}

          {/* Activity section */}
          {tab === "activity" && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">
                {topic.activity_title || "Topic activity"}
              </h3>

              <p className="whitespace-pre-wrap leading-7">
                {topic.activity_instructions ||
                  "Activity instructions have not been added."}
              </p>

              {topic.drive_url && (
                <a
                  className="btn inline-block"
                  href={topic.drive_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Google Drive activity ↗
                </a>
              )}

              <div>
                <button
                  className="secondary"
                  onClick={() => void confirmActivity()}
                >
                  I have submitted
                </button>
              </div>

              <p className="muted text-sm">
                Confirmation does not verify the file upload.
              </p>
            </div>
          )}

          {message && (
            <p className="mt-5 rounded-xl bg-[var(--lilac)] p-4 text-sm font-semibold">
              {message}
            </p>
          )}
        </section>
      )}

      <footer className="muted mt-8 text-center text-xs">
        Urban Bendang Innovators · Learning space
      </footer>
    </main>
  );
}
