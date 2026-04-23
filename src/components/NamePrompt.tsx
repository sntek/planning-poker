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
    <div className="bg-emerald-900/80 backdrop-blur rounded-3xl shadow-2xl p-8 sm:p-10 border border-emerald-700/60">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg animate-wiggle">
          <span className="text-4xl">👋</span>
        </div>
        <h2 className="text-3xl font-display font-bold text-amber-300 mb-2">
          Welcome to the table!
        </h2>
        <p className="text-emerald-300/80">
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
          className="w-full px-5 py-4 rounded-2xl bg-emerald-950/70 border-2 border-emerald-700 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/20 outline-none transition-all text-lg text-amber-100 placeholder:text-emerald-600"
          autoFocus
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full px-6 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-emerald-950 font-display font-bold text-lg rounded-2xl hover:scale-[1.02] active:scale-95 transition-transform shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Take a seat ✨
        </button>
      </form>
    </div>
  );
}
