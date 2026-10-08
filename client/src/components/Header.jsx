import React from 'react';
import { Sparkles, Download, Trash2, Database, ShieldCheck } from 'lucide-react';
import { getExportCsvUrl } from '../services/api';

export default function Header({ totalLeads, onClear, isClearing }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand & Pitch */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Caprae LeadLens
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  MVP v1.0
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              A lead list that learns what a good lead means for your team in about a dozen clicks.
            </p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>MongoDB Atlas</span>
            <span className="text-slate-500">|</span>
            <span className="font-semibold text-white">{totalLeads} Leads</span>
          </div>

          <a
            href={getExportCsvUrl()}
            download
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all shadow-sm ${
              totalLeads > 0
                ? 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
            onClick={(e) => {
              if (totalLeads === 0) e.preventDefault();
            }}
          >
            <Download className="w-3.5 h-3.5" />
            Export Ranked CSV
          </a>

          {totalLeads > 0 && (
            <button
              onClick={onClear}
              disabled={isClearing}
              title="Clear all leads"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all text-xs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

