const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'frontend', 'src', 'App.js');
let appJsCode = fs.readFileSync(targetFile, 'utf8');

console.log("Starting Tailwind CSS Migration to Light/Dark Mode...");

// The unified mapping to smartly convert static deep-dark Tailwind to dynamic Light/Dark mode.
const colorMap = [
    // Main Backgrounds
    { search: /\bbg-\[#0a0a0a\]\b/g, replace: 'bg-[#f0f2f5] dark:bg-[#0a0a0a]' },
    { search: /\bbg-\[#111b21\]\b/g, replace: 'bg-white dark:bg-[#111b21]' },
    { search: /\bbg-\[#202c33\]\b/g, replace: 'bg-[#f0f2f5] dark:bg-[#202c33]' },
    { search: /\bbg-\[#222e35\]\b/g, replace: 'bg-[#f0f2f5] dark:bg-[#222e35]' },
    { search: /\bbg-\[#2a3942\]\b/g, replace: 'bg-[#f0f2f5] dark:bg-[#2a3942]' },
    // Chat Bubbles + Highlights
    { search: /\bbg-\[#005c4b\]\b/g, replace: 'bg-[#d9fdd3] dark:bg-[#005c4b]' },
    { search: /\bbg-green-900\b/g, replace: 'bg-[#d9fdd3] dark:bg-green-900' },
    { search: /\bbg-green-800\b/g, replace: 'bg-[#d9fdd3] dark:bg-green-800' },
    // Hover States
    { search: /\bhover:bg-\[#202c33\]\b/g, replace: 'hover:bg-gray-100 dark:hover:bg-[#202c33]' },
    { search: /\bhover:bg-\[#2a3942\]\b/g, replace: 'hover:bg-gray-200 dark:hover:bg-[#2a3942]' },
    { search: /\bhover:bg-\[#374248\]\b/g, replace: 'hover:bg-gray-300 dark:hover:bg-[#374248]' },

    // Text Colors
    // Be careful with text-white, some things (like primary buttons) ALWAYS need to be white.
    // However, general body text needs to swap.
    { search: /\btext-white\b/g, replace: 'text-[#111b21] dark:text-white' },
    { search: /\btext-gray-300\b/g, replace: 'text-gray-700 dark:text-gray-300' },
    { search: /\btext-gray-400\b/g, replace: 'text-[#54656f] dark:text-gray-400' },
    { search: /\btext-\[#aebac1\]\b/g, replace: 'text-[#54656f] dark:text-[#aebac1]' },
    { search: /\btext-\[#8696a0\]\b/g, replace: 'text-[#54656f] dark:text-[#8696a0]' },
    { search: /\btext-\[#e9edef\]\b/g, replace: 'text-[#111b21] dark:text-[#e9edef]' },
    { search: /\btext-\[#d1d7db\]\b/g, replace: 'text-[#3b4a54] dark:text-[#d1d7db]' },

    // Border Colors
    { search: /\bborder-gray-700\b/g, replace: 'border-gray-300 dark:border-gray-700' },
    { search: /\bborder-gray-800\b/g, replace: 'border-gray-300 dark:border-gray-800' },
    { search: /\bborder-\[#202c33\]\b/g, replace: 'border-gray-200 dark:border-[#202c33]' },
    { search: /\bborder-\[#2a3942\]\b/g, replace: 'border-gray-300 dark:border-[#2a3942]' },
    { search: /\bborder-\[#8696a0\]\b/g, replace: 'border-gray-400 dark:border-[#8696a0]' }
];

let replacedCode = appJsCode;
let totalReplacements = 0;

for (const rule of colorMap) {
    const matches = replacedCode.match(rule.search);
    if (matches) {
        totalReplacements += matches.length;
        replacedCode = replacedCode.replace(rule.search, rule.replace);
        console.log(`Replaced ${matches.length} instances of ${rule.search}`);
    }
}

// Exception Handling: There are specific primary green buttons (like the chat send button)
// where `text-[#111b21] dark:text-white` (which replaced `text-white`) makes the icon black on a green button in light mode.
// We must revert those specific contexts back to pure text-white.
const revertRules = [
    { search: /\bbg-green-500 text-\[#111b21\] dark:text-white\b/g, replace: 'bg-green-500 text-white' },
    { search: /\bbg-green-600 text-\[#111b21\] dark:text-white\b/g, replace: 'bg-green-600 text-white' },
    // Also, inside App's main div, we need to inject the `dark` class conditionally if the theme is dark.
    {
        search: /<div className="flex h-screen bg-\[#f0f2f5\] dark:bg-\[#0a0a0a\]/g,
        replace: '<div className={`${theme === \'dark\' ? \'dark\' : \'\'} flex h-screen bg-[#f0f2f5] dark:bg-[#0a0a0a]'
    }
];

for (const rule of revertRules) {
    const matches = replacedCode.match(rule.search);
    if (matches) {
        replacedCode = replacedCode.replace(rule.search, rule.replace);
        console.log(`Reverted ${matches.length} specific contexts for ${rule.search}`);
    }
}

// Save the migrated code
fs.writeFileSync(targetFile, replacedCode, 'utf8');

console.log(`\nMigration completed successfully. Performed roughly ${totalReplacements} structural CSS updates.`);
