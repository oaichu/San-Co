"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getLesson, lessonsByGame } from "@/lib/content/lessons";
import { Md } from "@/components/learn/md";
import { DemoBoard, TryBoard } from "@/components/learn/LessonBoard";

const LS_KEY = "san-co-lessons-done";

function saveLocal(id: string) {
  try {
    const arr = new Set(JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as string[]);
    arr.add(id);
    localStorage.setItem(LS_KEY, JSON.stringify([...arr]));
  } catch { /* localStorage có thể bị tắt */ }
}

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const lesson = getLesson(id);
  const [completed, setCompleted] = useState(false);
  if (!lesson) notFound();

  const siblings = lessonsByGame(lesson.game);
  const idx = siblings.findIndex((l) => l.id === id);
  const prev = siblings[idx - 1];
  const next = siblings[idx + 1];

  const markDone = async () => {
    setCompleted(true);
    saveLocal(id);
    fetch("/api/lesson/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: id }),
    }).catch(() => {});
  };

  return (
    <main className="relative min-h-screen">
      <Nav />
      <article className="mx-auto max-w-[720px] px-5 pb-24 pt-[104px]">
        <Link href="/hoc" className="inline-flex min-h-[44px] items-center gap-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:text-ink">
          <ArrowLeft size={15} /> Giáo trình
        </Link>
        <h1 className="mt-4 font-display text-[clamp(30px,4.5vw,46px)] font-bold leading-[1.1] tracking-[-0.025em]">{lesson.title}</h1>
        <p className="mt-2 text-[15px] text-ink-2">{lesson.sub}</p>
        <div className="tabular mt-3 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-3">
          Bài {idx + 1}/{siblings.length}
        </div>

        <div className="mt-8 border-t border-line-2 pt-8">
          {lesson.blocks.map((b, i) => {
            if (b.t === "text") return <Md key={i} text={b.md} />;
            if (b.t === "demo") return <DemoBoard key={i} game={lesson.game} setup={b.setup} moves={b.moves} note={b.note} />;
            return <TryBoard key={i} game={lesson.game} setup={b.setup} solution={b.solution} hint={b.hint} prompt={b.prompt} onSolved={markDone} />;
          })}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line-2 pt-8">
          {prev ? (
            <Link href={`/hoc/${prev.id}`} className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-semibold text-ink-2 underline-offset-4 hover:text-ink hover:underline">
              <ArrowLeft size={15} /> Bài trước: {prev.title}
            </Link>
          ) : <span />}
          <button
            onClick={markDone}
            className={`flex min-h-[46px] items-center gap-2 rounded-xl px-6 text-[14px] font-semibold transition-all duration-150 active:scale-[0.97] ${completed ? "border border-vermilion text-vermilion" : "bg-vermilion text-accent-ink hover:-translate-y-0.5"}`}
          >
            {completed && <Check size={15} />}
            {completed ? "Đã hoàn thành" : "Đánh dấu hoàn thành"}
          </button>
          {next ? (
            <Link href={`/hoc/${next.id}`} className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] font-semibold text-vermilion underline-offset-4 hover:underline">
              Bài tiếp: {next.title} <ArrowRight size={15} />
            </Link>
          ) : <span />}
        </div>
      </article>
    </main>
  );
}
