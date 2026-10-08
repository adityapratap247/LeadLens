import React, { useState } from 'react';
import { Database, UploadCloud, Globe, Sparkles, FileSpreadsheet, Loader2, CheckCircle, Info, Download } from 'lucide-react';

export default function LeadInputArea({
  onLoadSample,
  onUploadCsv,
  onPasteDomains,
  isLoadingSample,
  isUploadingCsv,
  isPastingDomains,
}) {
  const [activeTab, setActiveTab] = useState('sample');
  const [pastedText, setPastedText] = useState('stripe.com\nopenai.com\ngithub.com\nlinear.app\nvercel.com');
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pasteCountMsg, setPasteCountMsg] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleCsvSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    await onUploadCsv(selectedFile);
    setSelectedFile(null);
  };

  const handlePasteSubmit = async (e) => {
    e.preventDefault();
    const domains = pastedText
      .split(/[\n,;]+/)
      .map((d) => d.trim())
      .filter((d) => d.length > 3 && d.includes('.'));

    if (domains.length === 0) {
      setPasteCountMsg('Please enter at least one valid domain.');
      return;
    }
    setPasteCountMsg(`Scraping and analyzing ${Math.min(20, domains.length)} domains...`);
    await onPasteDomains(domains.slice(0, 20));
    setPasteCountMsg('');
  };

  const downloadSampleCsv = () => {
    const sampleHeaders = 'Company,Domain,Industry,Employee Count,Location,Contact Name,Title,Email,Description\n';
    const sampleRows = [
      'ScaleGrid IO,scalegrid.io,SaaS,120,San Francisco CA,Sarah Connor,Chief Technology Officer,sarah@scalegrid.io,Managed database cloud control plane.',
      'NexusAI Labs,nexusai.tech,AI/ML,45,Austin TX,Alex Rivera,Founder & CEO,alex@nexusai.tech,Generative AI enterprise copilot platform.',
      'FinLayer Corp,finlayer.com,Fintech,230,New York NY,Rachel Zane,VP of Engineering,rachel@finlayer.com,Real-time treasury settlement engine.',
      'CyberPulse Security,cyberpulse.sec,Cybersecurity,85,Boston MA,David Miller,CISO,david@cyberpulse.sec,Continuous SOC2 compliance automation.'
    ].join('\n');

    const blob = new Blob([sampleHeaders + sampleRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leadlens-sample-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
      {/* Tabs Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('sample')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sample'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            1. Sample Dataset (~200)
          </button>

          <button
            onClick={() => setActiveTab('csv')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'csv'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            2. CSV Upload
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'paste'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            3. Paste Domains (Live Scraper)
          </button>
        </div>

        <span className="text-[11px] text-slate-500 hidden sm:block">Input & deduplication engine</span>
      </div>

      {/* Tab 1: Sample Data */}
      {activeTab === 'sample' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/30 border border-indigo-500/20">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sm font-bold text-white">Instant Demo Dataset</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                Ready Out-Of-The-Box
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Load ~200 realistic B2B tech leads with pre-populated company info, decision maker titles, locations, and verified business emails.
            </p>
          </div>

          <button
            onClick={onLoadSample}
            disabled={isLoadingSample}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            {isLoadingSample ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading Sample Leads...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Load Sample Data (200 Leads)
              </>
            )}
          </button>
        </div>
      )}

      {/* Tab 2: CSV Upload */}
      {activeTab === 'csv' && (
        <form onSubmit={handleCsvSubmit} className="space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                setSelectedFile(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
              dragOver
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
            }`}
          >
            <input
              type="file"
              id="csv-file-input"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center gap-2">
              <FileSpreadsheet className="w-8 h-8 text-indigo-400" />
              <div className="text-xs font-semibold text-white">
                {selectedFile ? selectedFile.name : 'Click to select or drag & drop a SaaSquatch CSV export'}
              </div>
              <p className="text-[11px] text-slate-500">
                Supports columns: company, domain, industry, employee count, location, contact name, title, email
              </p>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <button
              type="button"
              onClick={downloadSampleCsv}
              className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download template CSV file
            </button>

            <button
              type="submit"
              disabled={!selectedFile || isUploadingCsv}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 transition-all shadow-md shadow-indigo-600/20"
            >
              {isUploadingCsv ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Processing & Scoring CSV...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  Upload & Deduplicate
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Tab 3: Paste Domains */}
      {activeTab === 'paste' && (
        <form onSubmit={handlePasteSubmit} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5 text-xs text-slate-400">
              <span>Paste company domains (one per line, up to 20 domains):</span>
              <span className="text-[11px] text-indigo-400 flex items-center gap-1">
                <Info className="w-3 h-3" /> Respects robots.txt & 5s timeouts
              </span>
            </div>
            <textarea
              rows={4}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="stripe.com&#10;openai.com&#10;github.com"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 placeholder:text-slate-600"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 text-[11px]">
              {pasteCountMsg || 'Fetches public meta tags, about/contact snippets, emails, and social links.'}
            </span>

            <button
              type="submit"
              disabled={isPastingDomains}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 transition-all shadow-md shadow-indigo-600/20"
            >
              {isPastingDomains ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Politely Scraping Domains...
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  Scrape & Enrich Leads
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

