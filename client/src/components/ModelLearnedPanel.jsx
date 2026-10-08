import React from 'react';
import { BrainCircuit, ThumbsUp, ThumbsDown, RotateCcw, TrendingUp, History, Sparkles } from 'lucide-react';

const FEATURE_META = {
  industryMatch: { label: 'Industry Fit', color: 'from-indigo-500 to-indigo-600', text: 'text-indigo-400' },
  sizeMatch: { label: 'Company Size', color: 'from-blue-500 to-blue-600', text: 'text-blue-400' },
  regionMatch: { label: 'Target Region', color: 'from-emerald-500 to-emerald-600', text: 'text-emerald-400' },
  seniorityMatch: { label: 'Seniority Level', color: 'from-amber-500 to-amber-600', text: 'text-amber-400' },
  keywordMatch: { label: 'Keyword Match', color: 'from-purple-500 to-purple-600', text: 'text-purple-400' },
  emailVerified: { label: 'Email Verified', color: 'from-teal-500 to-teal-600', text: 'text-teal-400' },
};

export default function ModelLearnedPanel({ icp, onResetWeights, isResetting }) {
  const weights = icp?.weights || {};
  const history = icp?.changeHistory || [];
  const totalVotes = icp?.totalVotes || 0;
  const upVotes = icp?.upVotes || 0;
  const downVotes = icp?.downVotes || 0;

  // Max weight scale for progress bars (0 to 50 scale)
  const MAX_SCALE = 50;

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 animate-pulse">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
              What The Model Learned
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            </h2>
            <p className="text-[11px] text-slate-400">Self-tuning perceptron weights</p>
          </div>
        </div>

        <button
          onClick={onResetWeights}
          disabled={isResetting || totalVotes === 0}
          title="Reset learned weights to factory default"
          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700/60 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
          Reset
        </button>
      </div>

      {/* Vote Summary Card */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-center">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Votes</span>
          <span className="text-base font-bold text-white">{totalVotes}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-emerald-400/80 flex items-center justify-center gap-1">
            <ThumbsUp className="w-2.5 h-2.5" /> Upvotes
          </span>
          <span className="text-base font-bold text-emerald-400">{upVotes}</span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-rose-400/80 flex items-center justify-center gap-1">
            <ThumbsDown className="w-2.5 h-2.5" /> Downvotes
          </span>
          <span className="text-base font-bold text-rose-400">{downVotes}</span>
        </div>
      </div>

      {/* Visual Weight Bars */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
          <span>Active Feature Weight</span>
          <span className="text-[10px] text-slate-500">Value (0-50)</span>
        </div>

        {Object.entries(FEATURE_META).map(([key, meta]) => {
          const val = Number(weights[key]) || 0;
          const pct = Math.min(100, Math.max(0, (val / MAX_SCALE) * 100));

          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-300">{meta.label}</span>
                <span className={`font-mono font-bold ${meta.text}`}>{val} pts</span>
              </div>
              <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${meta.color} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Learned Change Feed */}
      <div className="border-t border-slate-800 pt-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span>Recent Learning Log</span>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2 pr-1 text-xs">
          {history.length === 0 ? (
            <div className="py-4 text-center text-slate-500 text-[11px] bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
              No votes yet. Give thumbs up/down on leads to train the model.
            </div>
          ) : (
            history.slice(0, 8).map((entry, idx) => (
              <div
                key={idx}
                className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 flex flex-col gap-1 text-[11px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold">
                    {entry.vote === 1 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                        <ThumbsUp className="w-3 h-3" /> Upvote
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                        <ThumbsDown className="w-3 h-3" /> Downvote
                      </span>
                    )}
                    <span className="text-slate-300 truncate max-w-[120px]">
                      {entry.company || entry.leadDomain}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                {entry.notes && entry.notes.length > 0 && (
                  <div className="space-y-0.5 text-slate-400">
                    {entry.notes.map((note, nIdx) => (
                      <div key={nIdx} className="flex items-start gap-1">
                        <span className="text-purple-400">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

