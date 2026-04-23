import { useState } from "react";

export function NamePrompt({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [name, setName] = useState("");

  return (
    <div className="mt-16 bg-white rounded-3xl shadow-sm border border-gray-200 p-8 sm:p-10">
      <div className="mb-8">
        <h2 className="text-2xl font-display font-semibold text-gray-900 mb-1">
          What's your name?
        </h2>
        <p className="text-gray-500 text-sm">Your teammates will see this during voting.</p>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSubmit(name.trim()); }}
        className="space-y-3"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={40}
          autoFocus
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 outline-none transition-all text-gray-900 placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
