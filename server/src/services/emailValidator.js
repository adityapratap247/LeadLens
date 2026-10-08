import dns from 'node:dns/promises';
import { EmailVerificationCache } from '../models/EmailVerificationCache.js';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates email syntax and checks DNS MX records for domain with MongoDB TTL caching
 * @param {string} email
 * @returns {Promise<{ isValid: boolean, hasMx: boolean, domain: string, cached: boolean }>}
 */
export async function verifyEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, hasMx: false, domain: '', cached: false };
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(cleanEmail)) {
    return { isValid: false, hasMx: false, domain: '', cached: false };
  }

  const parts = cleanEmail.split('@');
  const domain = parts[1]?.toLowerCase();
  if (!domain) {
    return { isValid: false, hasMx: false, domain: '', cached: false };
  }

  try {
    // 1. Check MongoDB TTL Cache first
    const cachedRecord = await EmailVerificationCache.findOne({ domain }).lean();
    if (cachedRecord) {
      return {
        isValid: cachedRecord.hasMx,
        hasMx: cachedRecord.hasMx,
        domain,
        cached: true,
      };
    }

    // 2. Perform DNS MX lookup with timeout
    const mxLookupPromise = dns.resolveMx(domain);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('DNS lookup timeout')), 2500)
    );

    let hasMx = false;
    let mxRecords = [];

    try {
      const records = await Promise.race([mxLookupPromise, timeoutPromise]);
      if (Array.isArray(records) && records.length > 0) {
        hasMx = true;
        mxRecords = records.map((r) => r.exchange);
      }
    } catch (dnsErr) {
      // If MX lookup fails, try A record lookup as SMTP fallback spec
      try {
        const aLookup = await Promise.race([
          dns.resolve4(domain),
          new Promise((_, reject) => setTimeout(() => reject(new Error('DNS timeout')), 1500)),
        ]);
        if (Array.isArray(aLookup) && aLookup.length > 0) {
          hasMx = true;
          mxRecords = ['A-record-fallback'];
        }
      } catch {
        hasMx = false;
      }
    }

    // 3. Cache result in MongoDB (TTL index will expire after 7 days)
    await EmailVerificationCache.findOneAndUpdate(
      { domain },
      {
        domain,
        hasMx,
        mxRecords,
        checkedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).catch((err) => console.warn('[EmailValidator] Cache write error:', err.message));

    return {
      isValid: hasMx,
      hasMx,
      domain,
      cached: false,
    };
  } catch (err) {
    console.warn(`[EmailValidator] Error verifying ${email}:`, err.message);
    return { isValid: true, hasMx: false, domain, cached: false };
  }
}

