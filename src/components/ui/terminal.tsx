import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface TerminalProps {
  commands: string[];
  outputs?: Record<number, string[]>;
  typingSpeed?: number;
  delayBetweenCommands?: number;
  className?: string;
}

type Line =
  | { type: "prompt"; text: string; commandIndex: number }
  | { type: "output"; text: string; commandIndex: number };

export function Terminal({
  commands,
  outputs = {},
  typingSpeed = 45,
  delayBetweenCommands = 1000,
  className,
}: TerminalProps) {
  const [lines, setLines] = useState<Line[]>([]);
  const [commandIndex, setCommandIndex] = useState(0);
  const [typedLength, setTypedLength] = useState(0);
  const [phase, setPhase] = useState<"typing" | "output" | "pause">("typing");
  const [outputIndex, setOutputIndex] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== "typing") return;
    const command = commands[commandIndex];
    if (!command) return;

    if (typedLength === 0 && lines.every((line) => line.commandIndex !== commandIndex)) {
      setLines((prev) => [...prev, { type: "prompt", text: "", commandIndex }]);
    }

    if (typedLength < command.length) {
      const timeout = window.setTimeout(() => setTypedLength((value) => value + 1), typingSpeed);
      return () => window.clearTimeout(timeout);
    }

    setLines((prev) =>
      prev.map((line) =>
        line.type === "prompt" && line.commandIndex === commandIndex
          ? { ...line, text: command }
          : line,
      ),
    );
    setPhase("output");
    setOutputIndex(0);
  }, [commandIndex, commands, lines, phase, typedLength, typingSpeed]);

  useEffect(() => {
    if (phase !== "output") return;
    const outputLines = outputs[commandIndex] ?? [];
    if (outputIndex < outputLines.length) {
      const timeout = window.setTimeout(() => {
        setLines((prev) => [
          ...prev,
          { type: "output", text: outputLines[outputIndex], commandIndex },
        ]);
        setOutputIndex((value) => value + 1);
      }, 180);
      return () => window.clearTimeout(timeout);
    }

    const timeout = window.setTimeout(() => {
      const nextIndex = commandIndex + 1;
      if (nextIndex >= commands.length) {
        setPhase("pause");
        return;
      }
      setCommandIndex(nextIndex);
      setTypedLength(0);
      setPhase("typing");
    }, delayBetweenCommands);

    return () => window.clearTimeout(timeout);
  }, [commandIndex, commands.length, delayBetweenCommands, outputIndex, outputs, phase]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [lines, typedLength]);

  const activeCommand = commands[commandIndex] ?? "";
  const activePartial = activeCommand.slice(0, typedLength);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[rgba(27,23,27,.12)] bg-[#181618] shadow-[0_28px_60px_rgba(20,16,19,.22)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#5c575c]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#7a7479]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#989398]" />
        <span className="ml-3 text-[10px] font-medium tracking-[0.14em] text-[#6f6a6f] uppercase">
          orqen — workspace
        </span>
      </div>
      <div ref={bodyRef} className="max-h-[320px] overflow-y-auto px-5 py-5 font-mono text-[12px] leading-[1.85]">
        {lines.map((line, index) =>
          line.type === "prompt" ? (
            <div key={`prompt-${index}`} className="flex flex-wrap gap-x-2 text-[#b8b2b8]">
              <span className="text-[#7f797f]">→</span>
              <span className="text-[#ddd6dc]">{line.text}</span>
            </div>
          ) : (
            <div key={`output-${index}`} className="pl-4 text-[#8f898f]">
              {line.text}
            </div>
          ),
        )}
        {phase === "typing" && (
          <div className="flex flex-wrap gap-x-2 text-[#b8b2b8]">
            <span className="text-[#7f797f]">→</span>
            <span className="text-[#ddd6dc]">
              {activePartial}
              <span className="ml-px inline-block h-[13px] w-[7px] translate-y-[2px] animate-pulse bg-[#c4bec3]" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
