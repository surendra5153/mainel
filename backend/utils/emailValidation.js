const validator = require('validator');
const dns = require('dns');
const disposableDomains = require('disposable-email-domains');

/**
 * Validates an email address for format, disposable domain, and MX records.
 * @param {string} email
 * @returns {Promise<{isValid: boolean, error: string|null}>}
 */
async function validateEmailStrict(email) {
    if (!email || typeof email !== 'string') {
        return { isValid: false, error: 'Email is required' };
    }

    // 1. Syntax Check
    if (!validator.isEmail(email)) {
        return { isValid: false, error: 'Invalid email format' };
    }

    const domain = email.split('@')[1].toLowerCase();

    // 2. Disposable Email Check
    // disposable-email-domains exports an array of domains
    // We can also use a Set for faster lookup if the array is huge, but array includes is fine for now or build a set.
    // The package exports an array directly.
    const isDisposable = disposableDomains.includes(domain);
    if (isDisposable) {
        return { isValid: false, error: 'Disposable/temporary email providers are not allowed' };
    }

    // 3. MX Record Check
    try {
        const addresses = await new Promise((resolve, reject) => {
            dns.resolveMx(domain, (err, addresses) => {
                if (err) return reject(err);
                resolve(addresses);
            });
        });

        if (!addresses || addresses.length === 0) {
            return { isValid: false, error: 'Email domain does not exist or has no mail server' };
        }
    } catch (err) {
        // If ENOTFOUND or similar, domain is invalid
        if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') {
            return { isValid: false, error: 'Email domain lookup failed' };
        }
        // For other DNS errors, we might want to be lenient or strict.
        // Let's be semi-strict but log it.
        console.error(`MX lookup error for ${domain}:`, err);
        return { isValid: false, error: 'Could not verify email domain' };
    }

    return { isValid: true, error: null };
}

module.exports = { validateEmailStrict };
