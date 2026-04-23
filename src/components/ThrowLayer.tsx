import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../api";

type ActiveThrow = {
  id: string;
  emoji: string;
  to: string;
};

interface ThrowLayerProps {
  roomId: string;
}

export function ThrowLayer({ roomId }: ThrowLayerProps) {
  const [throws, setThrows] = useState<ActiveThrow[]>([]);

  useEffect(() => {
    const unsub = api().subscribe(`room:${roomId}`, (event) => {
      if (event.type !== "throw") return;
      const id = crypto.randomUUID();
      setThrows((t) => [...t, { id, emoji: event.emoji, to: event.to }]);
    });
    return unsub;
  }, [roomId]);

  const removeThrow = (id: string) => {
    setThrows((t) => t.filter((x) => x.id !== id));
  };

  return createPortal(
    <div
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden
    >
      {throws.map((t) => (
        <ThrowAnimation key={t.id} emoji={t.emoji} to={t.to} onDone={() => removeThrow(t.id)} />
      ))}
    </div>,
    document.body,
  );
}

function ThrowAnimation({
  emoji,
  to,
  onDone,
}: {
  emoji: string;
  to: string;
  onDone: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Find target by attribute (robust against any username characters)
    const allChips = document.querySelectorAll("[data-user-chip]");
    const target = Array.from(allChips).find(
      (el) => el.getAttribute("data-user-chip") === to,
    );
    let targetX: number, targetY: number;
    if (target) {
      const rect = target.getBoundingClientRect();
      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
      // Small pulse on the target chip
      target.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.15)" },
          { transform: "scale(1)" },
        ],
        { duration: 350, easing: "ease-out" },
      );
    } else {
      targetX = window.innerWidth / 2;
      targetY = window.innerHeight / 2;
    }

    // Random starting edge
    const sides = ["left", "right", "top"] as const;
    const side = sides[Math.floor(Math.random() * sides.length)];
    let startX: number;
    let startY: number;
    if (side === "left") {
      startX = -60;
      startY = targetY + (Math.random() - 0.5) * 200;
    } else if (side === "right") {
      startX = window.innerWidth + 60;
      startY = targetY + (Math.random() - 0.5) * 200;
    } else {
      startX = targetX + (Math.random() - 0.5) * 200;
      startY = -60;
    }

    // Bounce point (opposite direction from travel)
    const dirX = Math.sign(targetX - startX) || 1;
    const dirY = Math.sign(targetY - startY) || 1;
    const bounceX = targetX - dirX * (30 + Math.random() * 30);
    const bounceY = targetY - dirY * (20 + Math.random() * 20) - 25;

    // Final rest on "the table" (below viewport)
    const fallX = bounceX + (Math.random() - 0.5) * 80;
    const fallY = window.innerHeight + 120;

    // Rotation
    const startRot = Math.random() * 360;
    const hitRot = startRot + 480 + Math.random() * 240;
    const bounceRot = hitRot + 120;
    const fallRot = bounceRot + 720 + Math.random() * 720;

    const animation = el.animate(
      [
        {
          transform: `translate(${startX}px, ${startY}px) rotate(${startRot}deg) scale(0.85)`,
          opacity: 1,
          offset: 0,
          easing: "cubic-bezier(0.3, 0.1, 0.4, 1)",
        },
        {
          transform: `translate(${targetX}px, ${targetY}px) rotate(${hitRot}deg) scale(1.35)`,
          opacity: 1,
          offset: 0.3,
          easing: "ease-out",
        },
        {
          transform: `translate(${bounceX}px, ${bounceY}px) rotate(${bounceRot}deg) scale(1)`,
          opacity: 1,
          offset: 0.45,
          easing: "ease-in",
        },
        {
          transform: `translate(${fallX}px, ${fallY}px) rotate(${fallRot}deg) scale(0.9)`,
          opacity: 0,
          offset: 1,
          easing: "cubic-bezier(0.5, 0, 0.9, 1)",
        },
      ],
      {
        duration: 1800,
        fill: "forwards",
      },
    );

    animation.onfinish = onDone;
    animation.oncancel = onDone;

    return () => {
      animation.cancel();
    };
  }, [emoji, to, onDone]);

  return (
    <div
      ref={ref}
      className="absolute top-0 left-0 text-4xl select-none"
      style={{
        willChange: "transform, opacity",
        transform: "translate(-200px, -200px)",
        filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.2))",
      }}
    >
      {emoji}
    </div>
  );
}
