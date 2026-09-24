"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getLesson, lessonsByGame } from "@/lib/content/lessons";
import { Md } from "@/components/learn/md";
import { DemoBoard, TryBoard } from "@/components/learn/LessonBoard";

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const lesson = getLesson(id);
  const [completed, setCompleted] = useState(false);
  if (!lesson) notFound();

  const siblings = lessonsByGame(lesson.game);
  const idx = siblings.findIndex((l) => l.id === id);
  const next = siblings[idx + 1];

  const markDone = async () => {
    setCompleted(true);
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
        <Link href="/hoc" className="text-[13px] font-medium text-ink-2 transition-colors hover:text-ink">← Giáo trình</Link>
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

        <div className="mt-12 flex items-center justify-between border-t border-line-2 pt-8">
          <button
            onClick={markDone}
            className={`rounded-xl px-6 py-3 text-[14px] font-semibold transition-all duration-150 active:scale-[0.97] ${completed ? "border border-vermilion text-vermilion" : "bg-vermilion text-accent-ink hover:-translate-y-0.5"}`}
          >
            {completed ? "✓ Đã hoàn thành" : "Đánh dấu hoàn thành"}
          </button>
          {next && (
            <Link href={`/hoc/${next.id}`} className="text-[14px] font-semibold text-vermilion underline-offset-4 hover:underline">
              Bài tiếp: {next.title} →
            </Link>
          )}
        </div>
      </article>
    </main>
  );
}
