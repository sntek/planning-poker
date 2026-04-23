import { useState } from "react";

interface NamePromptProps {
  onSubmit: (name: string) => void;
}

export function NamePrompt({ onSubmit }: NamePromptProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) onSubmit(name.trim());
  };

  return (
    <div className="bg-white/90 backdrop-blur rounded-3xl shadow-xl p-8 sm:p-10 border-2 border-white">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg animate-wiggle">
          <span className="text-4xl">👋</span>
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-800 mb-2">
          Welcome, friend!
        </h2>
        <p className="text-slate-600">
          What should your teammates call you?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Wizard Gandalf"
          maxLength={40}
          className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:border-violet-400 focus:ring-4 focus:ring-violet-100 outline-none transition-all text-lg"
          autoFocus
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full px-6 py-4 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500 text-white font-display font-bold text-lg rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Let&rsquo;s go! ✨
        </button>
      </form>
    </div>
  );
}
