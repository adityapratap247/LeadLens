import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import IcpSidebar from './components/IcpSidebar';
import ModelLearnedPanel from './components/ModelLearnedPanel';
import LeadInputArea from './components/LeadInputArea';
import LeadTable from './components/LeadTable';
import Toast from './components/Toast';
import {
  fetchIcp,
  updateIcpApi,
  resetWeightsApi,
  fetchLeads,
  loadSampleDataApi,
  uploadCsvApi,
  pasteDomainsApi,
  voteLeadApi,
  clearLeadsApi,
} from './services/api';

export default function App() {
  const [icp, setIcp] = useState(null);
  const [leads, setLeads] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    scoreMin: '',
    confidence: 'all',
    region: 'all',
    search: '',
  });

  // Action Loading States
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isSavingIcp, setIsSavingIcp] = useState(false);
  const [isResettingWeights, setIsResettingWeights] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [isPastingDomains, setIsPastingDomains] = useState(false);
  const [votingLeadId, setVotingLeadId] = useState(null);
  const [isClearing, setIsClearing] = useState(false);

  // Notifications
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4000);
  };

  // Load ICP
  const loadIcpData = useCallback(async () => {
    try {
      const data = await fetchIcp();
      setIcp(data);
    } catch (err) {
      showToast(`Failed to load ICP: ${err.message}`, 'error');
    }
  }, []);

  // Load Leads with current filters
  const loadLeadsData = useCallback(async () => {
    setIsLoadingLeads(true);
    try {
      const res = await fetchLeads(filters);
      setLeads(res.leads);
      setTotalCount(res.totalCount);
      setFilteredCount(res.filteredCount);
    } catch (err) {
      showToast(`Failed to load leads: ${err.message}`, 'error');
    } finally {
      setIsLoadingLeads(false);
    }
  }, [filters]);

  useEffect(() => {
    loadIcpData();
  }, [loadIcpData]);

  useEffect(() => {
    loadLeadsData();
  }, [loadLeadsData]);

  // Handler: Save ICP
  const handleSaveIcp = async (icpFormData) => {
    setIsSavingIcp(true);
    try {
      const updated = await updateIcpApi(icpFormData);
      setIcp(updated);
      await loadLeadsData();
      showToast('ICP updated & all leads re-scored!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingIcp(false);
    }
  };

  // Handler: Reset learned weights
  const handleResetWeights = async () => {
    setIsResettingWeights(true);
    try {
      const updated = await resetWeightsApi();
      setIcp(updated);
      await loadLeadsData();
      showToast('Model weights reset to default!', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsResettingWeights(false);
    }
  };

  // Handler: Load Sample Data
  const handleLoadSample = async () => {
    setIsLoadingSample(true);
    try {
      const res = await loadSampleDataApi();
      await loadIcpData();
      await loadLeadsData();
      showToast(res.message || 'Sample leads loaded!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Handler: Upload CSV
  const handleUploadCsv = async (file) => {
    setIsUploadingCsv(true);
    try {
      const res = await uploadCsvApi(file);
      await loadIcpData();
      await loadLeadsData();
      showToast(res.message || 'CSV uploaded and deduplicated successfully!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsUploadingCsv(false);
    }
  };

  // Handler: Paste Domains
  const handlePasteDomains = async (domains) => {
    setIsPastingDomains(true);
    try {
      const res = await pasteDomainsApi(domains);
      await loadIcpData();
      await loadLeadsData();
      showToast(res.message || 'Domains scraped and enriched!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsPastingDomains(false);
    }
  };

  // Handler: Online feedback vote (Self-tuning perceptron update)
  const handleVote = async (leadId, vote) => {
    setVotingLeadId(leadId);
    try {
      const result = await voteLeadApi(leadId, vote);
      setIcp(result.icp);
      await loadLeadsData();

      const noteText = result.notes && result.notes[0] ? ` — ${result.notes[0]}` : '';
      showToast(`Vote recorded${noteText}`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setVotingLeadId(null);
    }
  };

  // Handler: Clear all leads
  const handleClearLeads = async () => {
    if (!window.confirm('Are you sure you want to clear all leads?')) return;
    setIsClearing(true);
    try {
      await clearLeadsApi();
      await loadLeadsData();
      showToast('All leads cleared.', 'info');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsClearing(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <Header
        totalLeads={totalCount}
        onClear={handleClearLeads}
        isClearing={isClearing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (Sidebar: ICP & Learned Model): 4 cols */}
          <div className="lg:col-span-4 space-y-6">
            <IcpSidebar
              icp={icp}
              onSaveIcp={handleSaveIcp}
              isSaving={isSavingIcp}
            />

            <ModelLearnedPanel
              icp={icp}
              onResetWeights={handleResetWeights}
              isResetting={isResettingWeights}
            />
          </div>

          {/* Right Column (Input, Filters, Table): 8 cols */}
          <div className="lg:col-span-8 space-y-6">
            <LeadInputArea
              onLoadSample={handleLoadSample}
              onUploadCsv={handleUploadCsv}
              onPasteDomains={handlePasteDomains}
              isLoadingSample={isLoadingSample}
              isUploadingCsv={isUploadingCsv}
              isPastingDomains={isPastingDomains}
            />

            <LeadTable
              leads={leads}
              totalCount={totalCount}
              filteredCount={filteredCount}
              filters={filters}
              onFilterChange={handleFilterChange}
              onVote={handleVote}
              votingLeadId={votingLeadId}
              isLoading={isLoadingLeads}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Caprae LeadLens &copy; {new Date().getFullYear()} — Intelligent Self-Tuning Lead Prioritization Engine</span>
          <span className="text-[11px] text-slate-600">Built with Node.js, Express, MongoDB Atlas, and React (Vite)</span>
        </div>
      </footer>

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
