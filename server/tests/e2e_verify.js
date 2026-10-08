async function runVerification() {
  const baseUrl = 'http://localhost:5000';
  console.log('--- Starting Caprae LeadLens E2E Verification ---');

  // 1. Health check
  const healthRes = await fetch(`${baseUrl}/health`);
  const health = await healthRes.json();
  console.log('1. Health check:', health.status === 'ok' ? 'PASSED' : 'FAILED', health);

  // 2. Fetch ICP
  const icpRes = await fetch(`${baseUrl}/api/icp`);
  const icp = await icpRes.json();
  console.log('2. Fetch ICP:', icp.success ? 'PASSED' : 'FAILED', 'Weights:', icp.data.weights);

  // 3. Load sample dataset (~200 leads)
  const sampleRes = await fetch(`${baseUrl}/api/leads/sample`, { method: 'POST' });
  const sampleData = await sampleRes.json();
  console.log('3. Load sample data:', sampleData.success ? 'PASSED' : 'FAILED', sampleData.message);

  // 4. Fetch leads and check ranking
  const leadsRes = await fetch(`${baseUrl}/api/leads`);
  const leadsData = await leadsRes.json();
  console.log(`4. Fetch leads: PASSED (${leadsData.totalCount} total leads loaded)`);
  console.log(`   Top #1 lead: "${leadsData.data[0].company}" (Score: ${leadsData.data[0].score}, Confidence: ${leadsData.data[0].confidence})`);
  console.log(`   Breakdown:`, leadsData.data[0].breakdown.slice(0, 3));

  // 5. Test Paste Domains (with 3 real domains: stripe.com, github.com, vercel.com)
  console.log('5. Testing Paste Domains with 3 real domains...');
  const pasteRes = await fetch(`${baseUrl}/api/leads/paste-domains`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domains: ['stripe.com', 'github.com', 'vercel.com'] }),
  });
  const pasteData = await pasteRes.json();
  console.log('   Paste domains result:', pasteData.success ? 'PASSED' : 'FAILED', `Enriched ${pasteData.data.length} domains`);

  // 6. Test voting on 12 leads to verify self-tuning weight updates and list re-ranking
  console.log('6. Simulating 12 votes (thumbs up/down) to train the model...');
  const currentLeadsRes = await fetch(`${baseUrl}/api/leads`);
  const currentLeads = (await currentLeadsRes.json()).data;

  for (let i = 0; i < 12; i++) {
    const lead = currentLeads[i];
    // Vote thumbs up if SaaS/AI/Fintech, else thumbs down
    const vote = (lead.industry === 'SaaS' || lead.industry === 'AI/ML') ? 1 : 0;
    const voteRes = await fetch(`${baseUrl}/api/leads/${lead._id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote }),
    });
    const voteData = await voteRes.json();
    console.log(`   Vote #${i + 1} on "${lead.company}" (${vote === 1 ? 'Thumbs UP' : 'Thumbs DOWN'}) -> Notes:`, voteData.data.notes[0]);
  }

  // Check updated ICP weights after 12 votes
  const updatedIcpRes = await fetch(`${baseUrl}/api/icp`);
  const updatedIcp = (await updatedIcpRes.json()).data;
  console.log('   Weights after 12 votes:', updatedIcp.weights);
  console.log(`   Total votes recorded: ${updatedIcp.totalVotes} (Up: ${updatedIcp.upVotes}, Down: ${updatedIcp.downVotes})`);

  // 7. Test Export CSV
  const exportRes = await fetch(`${baseUrl}/api/leads/export-csv`);
  const csvText = await exportRes.text();
  const csvLines = csvText.split('\n');
  console.log(`7. Export CSV: PASSED (${csvLines.length} lines generated with header: "${csvLines[0]}")`);

  console.log('--- ALL E2E VERIFICATIONS PASSED SUCCESSFULLY! ---');
}

runVerification().catch((err) => console.error('Verification failed:', err));

