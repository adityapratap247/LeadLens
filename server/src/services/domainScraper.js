import axios from 'axios';
import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';
import { normalizeDomain, calculateConfidence } from './leadNormalizer.js';
import { verifyEmail } from './emailValidator.js';

const USER_AGENT = 'CapraeLeadLensBot/1.0 (+https://capraeleadlens.com/bot; contact@capraeleadlens.com)';
const REQUEST_TIMEOUT_MS = 5000;

const axiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
  },
  maxRedirects: 4,
  validateStatus: (status) => status >= 200 && status < 400,
});

/**
 * Checks if crawling a specific path on domain is allowed by robots.txt
 */
async function isAllowedByRobots(domain, path = '/') {
  try {
    const robotsUrl = `https://${domain}/robots.txt`;
    const response = await axiosInstance.get(robotsUrl, { timeout: 3000 });
    const robots = robotsParser(robotsUrl, response.data);
    return robots.isAllowed(`https://${domain}${path}`, USER_AGENT);
  } catch (err) {
    // If robots.txt returns 404 or fails, RFC standard assumes crawling is allowed
    return true;
  }
}

/**
 * Safely fetches HTML content from a URL with timeout and robots check
 */
async function safeFetchHtml(url) {
  try {
    const response = await axiosInstance.get(url);
    return response.data;
  } catch (err) {
    // If https failed, try http fallback
    if (url.startsWith('https://')) {
      try {
        const httpUrl = url.replace('https://', 'http://');
        const fallbackRes = await axiosInstance.get(httpUrl);
        return fallbackRes.data;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Extracts metadata, emails, social links and contact heuristics from HTML
 */
function extractPageData(html, domain) {
  if (!html || typeof html !== 'string') {
    return { company: '', description: '', emails: [], socialLinks: [], contactName: '', title: '' };
  }

  const $ = cheerio.load(html);

  // 1. Company Name
  const ogSiteName = $('meta[property="og:site_name"]').attr('content');
  const titleText = $('title').text().split(/[-|–•]/)[0]?.trim();
  const h1Text = $('h1').first().text().trim();
  const company = ogSiteName || titleText || h1Text || domain.split('.')[0];

  // 2. Description
  const metaDesc = $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    $('p').first().text().slice(0, 300).trim();

  // 3. Emails from page text & mailto: links (never scraping third-party login walled URLs)
  const emails = new Set();
  $('a[href^="mailto:"]').each((_, el) => {
    const mailto = $(el).attr('href')?.replace(/^mailto:/i, '').split('?')[0]?.trim();
    if (mailto && mailto.includes('@') && !mailto.endsWith('.png') && !mailto.endsWith('.jpg')) {
      emails.add(mailto.toLowerCase());
    }
  });

  // Regex scan for domain emails in body text
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  const bodyText = $('body').text();
  const matches = bodyText.match(emailRegex) || [];
  for (const m of matches) {
    const clean = m.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
    if (clean.includes(domain) || emails.size < 2) {
      if (!clean.endsWith('.png') && !clean.endsWith('.jpg') && !clean.endsWith('.webp')) {
        emails.add(clean);
      }
    }
  }

  // 4. Social links (public company page social links only)
  const socialLinks = new Set();
  $('a[href*="twitter.com"], a[href*="x.com"], a[href*="linkedin.com/company"], a[href*="github.com"], a[href*="youtube.com"]').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !href.includes('/share') && !href.includes('/intent')) {
      socialLinks.add(href.trim());
    }
  });

  // 5. Contact Name & Title heuristics from public page
  let contactName = '';
  let title = '';
  $('[class*="team"], [class*="founder"], [class*="author"], [class*="bio"], [class*="leadership"]').each((_, el) => {
    if (!contactName) {
      const text = $(el).text().trim();
      if (text.length > 5 && text.length < 80) {
        const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length >= 2) {
          contactName = lines[0];
          title = lines[1];
        }
      }
    }
  });

  // 6. Industry heuristic
  let inferredIndustry = 'Technology';
  const fullText = (metaDesc + ' ' + bodyText.slice(0, 1000)).toLowerCase();
  if (fullText.includes('saas') || fullText.includes('software as a service')) inferredIndustry = 'SaaS';
  else if (fullText.includes('fintech') || fullText.includes('payment') || fullText.includes('banking')) inferredIndustry = 'Fintech';
  else if (fullText.includes('ai') || fullText.includes('artificial intelligence') || fullText.includes('machine learning')) inferredIndustry = 'AI/ML';
  else if (fullText.includes('health') || fullText.includes('medical') || fullText.includes('clinic')) inferredIndustry = 'Healthcare';
  else if (fullText.includes('ecommerce') || fullText.includes('retail') || fullText.includes('shop')) inferredIndustry = 'E-commerce';
  else if (fullText.includes('security') || fullText.includes('cyber') || fullText.includes('soc2')) inferredIndustry = 'Cybersecurity';
  else if (fullText.includes('cloud') || fullText.includes('devops') || fullText.includes('infrastructure')) inferredIndustry = 'Enterprise Software';

  return {
    company: company.slice(0, 80),
    description: (metaDesc || '').slice(0, 400),
    emails: Array.from(emails),
    socialLinks: Array.from(socialLinks),
    contactName: contactName.slice(0, 60),
    title: title.slice(0, 60),
    industry: inferredIndustry,
  };
}

/**
 * Scrape a single domain with polite behavior and graceful fallback
 */
export async function scrapeDomain(rawDomain) {
  const domain = normalizeDomain(rawDomain);
  if (!domain) {
    return null;
  }

  const fallbackLead = {
    company: domain.split('.')[0].toUpperCase(),
    domain,
    industry: 'Unknown',
    employeeCount: 0,
    location: '',
    region: 'Other',
    contactName: '',
    title: '',
    email: '',
    description: `Domain ${domain} (Unreachable or restricted by robots.txt)`,
    socialLinks: [],
    source: 'paste',
    confidence: 'Low',
    emailVerified: false,
  };

  try {
    const isAllowed = await isAllowedByRobots(domain, '/');
    if (!isAllowed) {
      console.log(`[Scraper] Disallowed by robots.txt for domain: ${domain}`);
      return fallbackLead;
    }

    // 1. Fetch homepage
    const homeHtml = await safeFetchHtml(`https://${domain}`);
    if (!homeHtml) {
      return fallbackLead;
    }

    const homeData = extractPageData(homeHtml, domain);

    // 2. Fetch About / Contact subpage if available
    let aboutHtml = null;
    const aboutAllowed = await isAllowedByRobots(domain, '/about');
    if (aboutAllowed) {
      aboutHtml = await safeFetchHtml(`https://${domain}/about`);
    }

    let contactHtml = null;
    if (!aboutHtml) {
      const contactAllowed = await isAllowedByRobots(domain, '/contact');
      if (contactAllowed) {
        contactHtml = await safeFetchHtml(`https://${domain}/contact`);
      }
    }

    const subpageData = extractPageData(aboutHtml || contactHtml, domain);

    const mergedEmails = Array.from(new Set([...homeData.emails, ...subpageData.emails]));
    const primaryEmail = mergedEmails[0] || '';
    const socialLinks = Array.from(new Set([...homeData.socialLinks, ...subpageData.socialLinks]));

    let emailVerified = false;
    if (primaryEmail) {
      const verification = await verifyEmail(primaryEmail);
      emailVerified = verification.isValid;
    }

    const lead = {
      company: homeData.company || domain.split('.')[0],
      domain,
      industry: homeData.industry || subpageData.industry || 'Technology',
      employeeCount: 0,
      location: '',
      region: 'Other',
      contactName: subpageData.contactName || homeData.contactName || '',
      title: subpageData.title || homeData.title || '',
      email: primaryEmail,
      description: homeData.description || subpageData.description || `Enriched data for ${domain}`,
      socialLinks,
      source: 'paste',
      emailVerified,
    };

    lead.confidence = calculateConfidence(lead);
    return lead;
  } catch (err) {
    console.warn(`[Scraper] Graceful failure for ${domain}:`, err.message);
    return fallbackLead;
  }
}

/**
 * Concurrency-limited batch domain scraper for pasted domains (max 20 domains, concurrency of 3)
 */
export async function scrapeDomainsBatch(domainList, concurrency = 3) {
  const domains = Array.from(
    new Set(
      domainList
        .map(normalizeDomain)
        .filter(Boolean)
        .slice(0, 20)
    )
  );

  const results = [];
  for (let i = 0; i < domains.length; i += concurrency) {
    const chunk = domains.slice(i, i + concurrency);
    const chunkPromises = chunk.map((d) => scrapeDomain(d));
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults.filter(Boolean));
  }

  return results;
}

