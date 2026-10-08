import React, { useState, useEffect } from 'react';
import { Target, Users, MapPin, Award, Key, RefreshCw, CheckCircle2, Sliders } from 'lucide-react';

const SUGGESTED_INDUSTRIES = ['SaaS', 'Fintech', 'AI/ML', 'Enterprise Software', 'Cybersecurity', 'Healthcare', 'E-commerce', 'Logistics'];
const SUGGESTED_REGIONS = ['North America', 'United States', 'Europe', 'United Kingdom', 'APAC', 'Remote', 'LATAM'];
const SUGGESTED_SENIORITIES = ['C-level', 'VP', 'Director', 'Founder', 'Head of', 'Manager'];
const SUGGESTED_KEYWORDS = ['b2b', 'enterprise', 'ai', 'cloud', 'security', 'analytics', 'automation', 'growth'];

export default function IcpSidebar({ icp, onSaveIcp, isSaving }) {
  const [formData, setFormData] = useState({
    targetIndustries: [],
    companySize: { min: 20, max: 500 },
    targetRegions: [],
    targetSeniority: [],
    targetKeywords: [],
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (icp) {
      setFormData({
        targetIndustries: icp.targetIndustries || [],
        companySize: {
          min: icp.companySize?.min ?? 20,
          max: icp.companySize?.max ?? 500,
        },
        targetRegions: icp.targetRegions || [],
        targetSeniority: icp.targetSeniority || [],
        targetKeywords: icp.targetKeywords || [],
      });
    }
  }, [icp]);

  const toggleItem = (field, value) => {
    setFormData((prev) => {
      const current = prev[field] || [];
      const exists = current.includes(value);
      return {
        ...prev,
        [field]: exists ? current.filter((x) => x !== value) : [...current, value],
      };
    });
  };

  const handleSizeChange = (type, val) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setFormData((prev) => ({
      ...prev,
      companySize: {
        ...prev.companySize,
        [type]: num,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSaveIcp(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white tracking-wide uppercase">
            Ideal Customer Profile (ICP)
          </h2>
        </div>
        <Sliders className="w-3.5 h-3.5 text-slate-500" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Target Industries */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <Target className="w-3.5 h-3.5 text-indigo-400" />
            Target Industries
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_INDUSTRIES.map((ind) => {
              const active = formData.targetIndustries.includes(ind);
              return (
                <button
                  type="button"
                  key={ind}
                  onClick={() => toggleItem('targetIndustries', ind)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/50'
                  }`}
                >
                  {ind}
                </button>
              );
            })}
          </div>
        </div>

        {/* Company Size Range */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            Company Size (Employees)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Min Employees</span>
              <input
                type="number"
                min="0"
                value={formData.companySize.min}
                onChange={(e) => handleSizeChange('min', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Max Employees</span>
              <input
                type="number"
                min="1"
                value={formData.companySize.max}
                onChange={(e) => handleSizeChange('max', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Target Seniority */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Decision Maker Seniority
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_SENIORITIES.map((sen) => {
              const active = formData.targetSeniority.includes(sen);
              return (
                <button
                  type="button"
                  key={sen}
                  onClick={() => toggleItem('targetSeniority', sen)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    active
                      ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-400/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/50'
                  }`}
                >
                  {sen}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Regions */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            Target Regions
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_REGIONS.map((reg) => {
              const active = formData.targetRegions.includes(reg);
              return (
                <button
                  type="button"
                  key={reg}
                  onClick={() => toggleItem('targetRegions', reg)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    active
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/50'
                  }`}
                >
                  {reg}
                </button>
              );
            })}
          </div>
        </div>

        {/* Keywords */}
        <div>
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 mb-2">
            <Key className="w-3.5 h-3.5 text-purple-400" />
            Key Strategic Keywords
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_KEYWORDS.map((kw) => {
              const active = formData.targetKeywords.includes(kw);
              return (
                <button
                  type="button"
                  key={kw}
                  onClick={() => toggleItem('targetKeywords', kw)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                    active
                      ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400/30'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700/50'
                  }`}
                >
                  #{kw}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <button
          type="submit"
          disabled={isSaving}
          className="mt-2 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 active:scale-98 shadow-md shadow-indigo-600/20 border border-indigo-400/20 transition-all disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Re-scoring Leads...
            </>
          ) : savedSuccess ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              ICP Saved & Leads Re-scored!
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Apply ICP & Re-score
            </>
          )}
        </button>
      </form>
    </div>
  );
}

