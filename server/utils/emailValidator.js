import dns from 'dns/promises';

/**
 * Validates that an email address has valid format and that its domain
 * actually exists and has mail servers (MX/A records) in DNS.
 * 
 * @param {string} email 
 * @returns {Promise<{valid: boolean, error?: string, email?: string}>}
 */
export async function validateEmailExists(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email address is required.' };
  }

  const trimmed = email.trim().toLowerCase();

  // Standard RFC email syntax validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email address format (e.g. user@example.com).' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { valid: false, error: 'Invalid email address structure.' };
  }

  const domain = parts[1];

  // Perform real DNS MX record resolution to check domain existence
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) {
      return { valid: true, email: trimmed };
    }
  } catch (mxErr) {
    // If MX lookup fails, fall back to checking A records for the domain
    try {
      const records = await dns.resolve(domain);
      if (records && records.length > 0) {
        return { valid: true, email: trimmed };
      }
    } catch (aErr) {
      return {
        valid: false,
        error: `The email domain "${domain}" does not exist or has no active mail server.`
      };
    }
  }

  return {
    valid: false,
    error: `The email domain "${domain}" does not exist or cannot receive mail.`
  };
}
