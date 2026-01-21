const { validateEmailStrict } = require('../utils/emailValidation');

async function test() {
    console.log("Starting Email Validation Test...");

    const cases = [
        { email: "chiranth@gmail.com", expect: true, desc: "Valid Gmail" },
        { email: "invalid-email-format", expect: false, desc: "Invalid Syntax" },
        { email: "test@mailinator.com", expect: false, desc: "Disposable (Mailinator)" },
        { email: "test@yopmail.com", expect: false, desc: "Disposable (Yopmail)" },
        { email: "user@domainthatdoesnotexist123456789.com", expect: false, desc: "Non-existent Domain" }
    ];

    let passedCount = 0;

    for (const c of cases) {
        try {
            console.log(`Testing: ${c.email} (${c.desc})...`);
            const { isValid, error } = await validateEmailStrict(c.email);
            const passed = isValid === c.expect;
            if (passed) passedCount++;

            console.log(`> Result: ${isValid ? 'Valid' : 'Invalid'} - ${error || 'OK'}`);
            console.log(`> Status: ${passed ? '✅ PASS' : '❌ FAIL'}\n`);
        } catch (e) {
            console.error(`> [ERROR] ${c.email}:`, e);
        }
    }

    console.log(`Summary: ${passedCount}/${cases.length} tests passed.`);
}

test();
