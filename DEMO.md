# Caprae LeadLens — 2-Minute Video Demo Script

> **Product Name:** Caprae LeadLens  
> **One-Line Pitch:** "A lead list that learns what a good lead means for your team in about a dozen clicks."

---

## ⏱️ Video Outline (120 Seconds Total)

| Time | Section | Visual Screen | Spoken Script |
|---|---|---|---|
| **0:00 - 0:15** | **The Problem** | Camera or Title Card with Caprae LeadLens logo | "Lead scraping is now a commodity—every SDR can pull 10,000 domains in seconds. But 90% of them are junk, decision makers are missing, and static filters fail to capture what a winning account actually looks like for *your* team. Sales teams waste dozens of hours every week manually sorting and qualifying bad leads." |
| **0:15 - 0:40** | **Lead Ingestion & Deduplication** | Screen recording: Click **"Load Sample Data (200 Leads)"**, switch to CSV upload & Paste Domains tab | "Enter **Caprae LeadLens**. It ingests leads three ways: instantly with 200 realistic sample accounts, via SaaSquatch-style CSV upload, or by pasting up to 20 domains for live, robots.txt-compliant enrichment. Notice how exact domain deduplication keeps the richest contact records and verifies DNS MX records on the fly with MongoDB TTL caching." |
| **0:40 - 1:00** | **ICP Scoring & Transparent Breakdown** | Expand row #1 and row #5 on the table to show badges and `+25 Industry fit`, `+20 Seniority match` | "Every lead is scored on a normalized 0 to 100 scale against your Ideal Customer Profile. But unlike black-box AI tools, LeadLens provides 100% transparent score breakdowns—like `+25 Industry fit` and `+20 Decision maker seniority`—along with confidence flags based on email deliverability." |
| **1:00 - 1:30** | **The Standout Feature: Self-Tuning Scorer** | Click **Thumbs Up** on high-match SaaS/AI leads and **Thumbs Down** on low-match/wrong accounts (~10 to 12 votes). Watch the "What the Model Learned" bar chart and lead table re-order | "Here is the magic: the self-tuning scorer. When your sales rep clicks Thumbs Up or Thumbs Down, a hand-written online perceptron algorithm calculates the prediction error and updates feature weights in real time. Look at the 'What the Model Learned' panel: in just 10 to 12 clicks, the model learns our exact preferences, adjusts feature weights, and dynamically re-ranks the entire list." |
| **1:30 - 1:45** | **Export & Workflow Handoff** | Click **"Export Ranked CSV"** and open the downloaded CSV | "With one click, export the prioritized and verified lead list straight into your CRM or cold email sequencer, complete with rank, score, confidence, and audit breakdown tags." |
| **1:45 - 2:00** | **Tech Stack & Tradeoff** | Architecture slide / Summary slide | "Under the hood: Node.js, Express, MongoDB Atlas with TTL caching, Vite React, and zero external ML dependencies. **Key Tradeoff:** We chose exact domain deduplication over fuzzy company matching to ensure zero false merges and sub-millisecond deduplication speed. Thank you!" |

---

## 🎬 Recording Checklist & Pro-Tips

1. **Browser Resolution:** Set display scaling to 100% and browser to 1920x1080 (1080p).
2. **Setup:**
   - Launch backend: `npm start` in `/server`
   - Launch frontend: `npm run dev` in `/client` (open `http://localhost:5173`)
3. **Demo Sequence:**
   - [ ] Click **"Load Sample Data (200 Leads)"**
   - [ ] Point out the top-ranked accounts, score badges (green 80+, yellow 50-79, red <50), and confidence pills.
   - [ ] Expand 1 or 2 rows to show the transparent score breakdowns.
   - [ ] Vote thumbs up on 6 SaaS/AI leads and thumbs down on 6 non-target leads.
   - [ ] Show the **"What the Model Learned"** bar chart shifting and the change history log updating.
   - [ ] Click **"Export Ranked CSV"** to demonstrate clean CSV delivery.

