import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Users,
  MapPin,
  Building2,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export default function LeadTable({
  leads,
  totalCount,
  filteredCount,
  filters,
  onFilterChange,
  onVote,
  votingLeadId,
  isLoading,
}) {
  const [expandedLeadId, setExpandedLeadId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedLeadId((prev) => (prev === id ? null : id));
  };

  const getScoreBadge = (score) => {
    if (score >= 80) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ring-emerald-500/20';
    } else if (score >= 50) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30 ring-amber-500/20';
    } else {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30 ring-rose-500/20';
    }
  };

  const getConfidenceBadge = (confidence) => {
    switch (confidence) {
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ShieldCheck className="w-3 h-3 text-blue-400" />
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
            <ShieldAlert className="w-3 h-3 text-slate-400" />
            Low
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl shadow-xl flex flex-col overflow-hidden">
      {/* Search & Filter Toolbar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company, title, email..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto text-xs">
          {/* Min Score Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500">Min Score:</span>
            <select
              value={filters.scoreMin ?? ''}
              onChange={(e) => onFilterChange('scoreMin', e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-white">All Scores</option>
              <option value="80" className="bg-slate-900 text-white">80+ (Top ICP)</option>
              <option value="60" className="bg-slate-900 text-white">60+ (Good Fit)</option>
              <option value="40" className="bg-slate-900 text-white">40+ (Moderate)</option>
            </select>
          </div>

          {/* Confidence Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500">Confidence:</span>
            <select
              value={filters.confidence || 'all'}
              onChange={(e) => onFilterChange('confidence', e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Confidence</option>
              <option value="High" className="bg-slate-900 text-white">High</option>
              <option value="Medium" className="bg-slate-900 text-white">Medium</option>
              <option value="Low" className="bg-slate-900 text-white">Low</option>
            </select>
          </div>

          {/* Region Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500">Region:</span>
            <select
              value={filters.region || 'all'}
              onChange={(e) => onFilterChange('region', e.target.value)}
              className="bg-transparent text-white text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Regions</option>
              <option value="North America" className="bg-slate-900 text-white">North America</option>
              <option value="Europe" className="bg-slate-900 text-white">Europe</option>
              <option value="APAC" className="bg-slate-900 text-white">APAC</option>
              <option value="Remote" className="bg-slate-900 text-white">Remote</option>
              <option value="LATAM" className="bg-slate-900 text-white">LATAM</option>
            </select>
          </div>

          <span className="text-[11px] text-slate-400 font-mono pl-1">
            Showing <strong className="text-white">{filteredCount}</strong> of {totalCount}
          </span>
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto min-h-[320px]">
        {leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3 border border-indigo-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">No Leads Found</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              Click &quot;Load Sample Data&quot;, upload a SaaSquatch CSV, or paste domains above to begin scoring and training your model.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-14 text-center">Rank</th>
                <th className="py-3 px-3 w-20 text-center">Score</th>
                <th className="py-3 px-4">Company & Domain</th>
                <th className="py-3 px-4">Decision Maker</th>
                <th className="py-3 px-4">Industry / Size</th>
                <th className="py-3 px-3 text-center">Confidence</th>
                <th className="py-3 px-4 text-center w-28">Vote (Train)</th>
                <th className="py-3 px-3 w-10 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leads.map((lead, index) => {
                const isExpanded = expandedLeadId === lead._id;
                const isVoting = votingLeadId === lead._id;

                return (
                  <React.Fragment key={lead._id || lead.domain || index}>
                    <tr
                      className={`hover:bg-slate-800/40 transition-colors ${
                        lead.userVote === 1
                          ? 'bg-emerald-950/10'
                          : lead.userVote === 0
                          ? 'bg-rose-950/10'
                          : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md ${
                            index === 0
                              ? 'bg-amber-400 text-slate-950'
                              : index === 1
                              ? 'bg-slate-300 text-slate-950'
                              : index === 2
                              ? 'bg-amber-700 text-white'
                              : 'text-slate-400 bg-slate-950 border border-slate-800'
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="py-3 px-3 text-center">
                        <div
                          className={`inline-flex items-center justify-center font-mono font-bold text-xs px-2 py-0.5 rounded-lg border shadow-xs ${getScoreBadge(
                            lead.score
                          )}`}
                        >
                          {lead.score}
                        </div>
                      </td>

                      {/* Company & Domain */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-xs">{lead.company}</span>
                          <a
                            href={`https://${lead.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1 truncate max-w-[180px]"
                          >
                            {lead.domain}
                            <ExternalLink className="w-2.5 h-2.5 inline shrink-0" />
                          </a>
                        </div>
                      </td>

                      {/* Contact & Title */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200 text-xs">
                            {lead.contactName || <span className="text-slate-500 italic">Not found</span>}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {lead.title || 'Decision Maker'}
                          </span>
                        </div>
                      </td>

                      {/* Industry & Size */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-300">{lead.industry || 'Tech'}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {lead.employeeCount ? `${lead.employeeCount} employees` : 'Unknown size'}
                          </span>
                        </div>
                      </td>

                      {/* Confidence */}
                      <td className="py-3 px-3 text-center">
                        {getConfidenceBadge(lead.confidence)}
                      </td>

                      {/* Vote (Self-tuning online feedback) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onVote(lead._id, 1)}
                            disabled={isVoting}
                            title="Thumbs Up (Model will increase weights for matched features)"
                            className={`p-1.5 rounded-lg border text-xs transition-all ${
                              lead.userVote === 1
                                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/30'
                                : 'bg-slate-950 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 border-slate-800'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onVote(lead._id, 0)}
                            disabled={isVoting}
                            title="Thumbs Down (Model will penalize weights for this profile)"
                            className={`p-1.5 rounded-lg border text-xs transition-all ${
                              lead.userVote === 0
                                ? 'bg-rose-600 text-white border-rose-500 shadow-sm shadow-rose-500/30'
                                : 'bg-slate-950 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border-slate-800'
                            }`}
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Expand Button */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => toggleExpand(lead._id)}
                          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable Breakdown Drawer */}
                    {isExpanded && (
                      <tr className="bg-slate-950/80 border-b border-slate-800/80">
                        <td colSpan={8} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            {/* Score Breakdown */}
                            <div className="space-y-2 md:col-span-2">
                              <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                Exact Scoring Breakdown (Normalized 0-100)
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {lead.breakdown && lead.breakdown.length > 0 ? (
                                  lead.breakdown.map((item, bIdx) => {
                                    const isPositive = item.startsWith('+') && !item.includes('+0');
                                    return (
                                      <span
                                        key={bIdx}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-medium border ${
                                          isPositive
                                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                            : 'bg-slate-900 text-slate-500 border-slate-800'
                                        }`}
                                      >
                                        {item}
                                      </span>
                                    );
                                  })
                                ) : (
                                  <span className="text-slate-500 italic">No breakdown available</span>
                                )}
                              </div>

                              {lead.description && (
                                <p className="text-slate-400 text-xs mt-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                                  <strong className="text-slate-300">Company Bio: </strong>
                                  {lead.description}
                                </p>
                              )}
                            </div>

                            {/* Contact & Verification Status */}
                            <div className="space-y-2 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                              <span className="font-bold text-slate-300 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                                <Mail className="w-3.5 h-3.5 text-blue-400" />
                                Contact & Enrichment
                              </span>

                              <div className="space-y-1 text-slate-300 text-[11px]">
                                <div>
                                  <span className="text-slate-500">Email: </span>
                                  <span className="font-mono text-white">{lead.email || 'None'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">MX DNS Check: </span>
                                  {lead.emailVerified ? (
                                    <span className="text-emerald-400 font-semibold">Valid MX records</span>
                                  ) : (
                                    <span className="text-slate-500">Unverified / No MX</span>
                                  )}
                                </div>
                                <div>
                                  <span className="text-slate-500">Location: </span>
                                  <span>{lead.location || lead.region || 'Unknown'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Source: </span>
                                  <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                                    {lead.source}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

