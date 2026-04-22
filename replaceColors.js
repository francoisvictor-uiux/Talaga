const fs = require('fs');
const path = require('path');

const files = [
  'src/app/pages/CashierPage.tsx',
  'src/app/pages/AccountsPage.tsx',
  'src/app/pages/accounts/ChartOfAccounts.tsx',
  'src/app/pages/accounts/JournalBook.tsx',
  'src/app/pages/accounts/AccountSettings.tsx',
  'src/app/pages/accounts/Reports.tsx',
  'src/app/pages/accounts/QuickEntryModal.tsx',
];

files.forEach(file => {
  const fullPath = path.resolve('d:/Francois/Talaga', file);
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  let text = fs.readFileSync(fullPath, 'utf8');
  
  // Replace Tailwind arbitrary values
  text = text.replace(/bg-\[#1a6b3c\]/g, 'accent-bg');
  text = text.replace(/text-\[#1a6b3c\]/g, 'accent-text');
  text = text.replace(/border-\[#1a6b3c\]/g, 'accent-border');
  text = text.replace(/ring-\[#1a6b3c\]/g, 'accent-ring');
  text = text.replace(/bg-\[#145730\]/g, 'opacity-90');
  
  // Replace inline hex values with the css variable syntax
  text = text.replace(/'#1a6b3c'/g, '"var(--primary)"');
  text = text.replace(/"#1a6b3c"/g, '"var(--primary)"');
  
  // Catch any remaining direct tailwind brackets and turn them to css vars
  text = text.replace(/\[#1a6b3c\]/g, '[var(--primary)]');
  text = text.replace(/\[#145730\]/g, '[var(--primary)]');

  fs.writeFileSync(fullPath, text, 'utf8');
  console.log(`Updated ${file}`);
});
