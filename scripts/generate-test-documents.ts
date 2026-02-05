/**
 * Generate synthetic test document images for OCR testing
 *
 * Usage: npx ts-node scripts/generate-test-documents.ts
 *
 * Creates realistic-looking W2, paystub, and bank statement images
 * with known values for testing OCR accuracy.
 */

import { createCanvas, registerFont } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';

// Output directory
const FIXTURES_DIR = path.join(__dirname, '..', 'src', 'fixtures', 'documents');

// Ensure directory exists
if (!fs.existsSync(FIXTURES_DIR)) {
  fs.mkdirSync(FIXTURES_DIR, { recursive: true });
}

/**
 * Expected extraction values - use these in tests to verify OCR accuracy
 */
export const EXPECTED_VALUES = {
  w2: {
    taxYear: 2025,
    employerName: 'Acme Corporation',
    employerEIN: '12-3456789',
    employerAddress: '123 Business Ave, Austin, TX 78701',
    employeeName: 'John Michael Smith',
    employeeSSN: '1234', // Last 4 only
    wagesTipsCompensation: 85000.00,
    federalIncomeTaxWithheld: 12750.00,
    socialSecurityWages: 85000.00,
    socialSecurityTaxWithheld: 5270.00,
    medicareWages: 85000.00,
    medicareTaxWithheld: 1232.50,
  },
  paystub: {
    employerName: 'TechStart Inc',
    employeeName: 'Jane Doe',
    employeeId: 'EMP-78945',
    payPeriodStart: '01/01/2026',
    payPeriodEnd: '01/15/2026',
    payDate: '01/20/2026',
    grossPay: 4166.67,
    federalTax: 625.00,
    stateTax: 208.33,
    socialSecurity: 258.33,
    medicare: 60.42,
    healthInsurance: 150.00,
    retirement401k: 208.33,
    netPay: 2656.26,
    ytdGross: 4166.67,
    ytdNet: 2656.26,
  },
  bankStatement: {
    institutionName: 'First National Bank',
    accountHolder: 'John Smith',
    accountType: 'Checking',
    accountNumberLast4: '7890',
    statementPeriodStart: '01/01/2026',
    statementPeriodEnd: '01/31/2026',
    beginningBalance: 5432.10,
    totalDeposits: 8500.00,
    totalWithdrawals: 6200.00,
    endingBalance: 7732.10,
  },
};

// Save expected values as JSON for tests
fs.writeFileSync(
  path.join(FIXTURES_DIR, 'expected-values.json'),
  JSON.stringify(EXPECTED_VALUES, null, 2)
);

/**
 * Generate W-2 Tax Form Image
 */
function generateW2(): void {
  const width = 800;
  const height = 600;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // Title
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('W-2 Wage and Tax Statement', 200, 50);
  ctx.font = '16px Arial';
  ctx.fillText(`Tax Year ${EXPECTED_VALUES.w2.taxYear}`, 350, 75);

  // Draw boxes
  const v = EXPECTED_VALUES.w2;

  // Left column - Employer info
  ctx.font = 'bold 12px Arial';
  ctx.fillText('a Control number', 30, 110);
  ctx.font = '14px Arial';
  ctx.fillText('22-0001234', 30, 128);

  ctx.font = 'bold 12px Arial';
  ctx.fillText('b Employer identification number (EIN)', 30, 160);
  ctx.font = '14px Arial';
  ctx.fillText(v.employerEIN, 30, 178);

  ctx.font = 'bold 12px Arial';
  ctx.fillText('c Employer name, address, and ZIP code', 30, 210);
  ctx.font = '14px Arial';
  ctx.fillText(v.employerName, 30, 228);
  ctx.fillText(v.employerAddress, 30, 246);

  // Employee info
  ctx.font = 'bold 12px Arial';
  ctx.fillText('e Employee name', 30, 290);
  ctx.font = '14px Arial';
  ctx.fillText(v.employeeName, 30, 308);

  ctx.font = 'bold 12px Arial';
  ctx.fillText('d Employee SSN', 30, 340);
  ctx.font = '14px Arial';
  ctx.fillText(`***-**-${v.employeeSSN}`, 30, 358);

  // Right column - Wage boxes
  const boxStartX = 420;
  const boxWidth = 170;
  const boxHeight = 50;

  // Box 1 - Wages
  ctx.strokeRect(boxStartX, 100, boxWidth, boxHeight);
  ctx.font = 'bold 10px Arial';
  ctx.fillText('1 Wages, tips, other compensation', boxStartX + 5, 115);
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`$${v.wagesTipsCompensation.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, boxStartX + 5, 140);

  // Box 2 - Federal tax
  ctx.strokeRect(boxStartX + boxWidth + 10, 100, boxWidth, boxHeight);
  ctx.font = 'bold 10px Arial';
  ctx.fillText('2 Federal income tax withheld', boxStartX + boxWidth + 15, 115);
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`$${v.federalIncomeTaxWithheld.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, boxStartX + boxWidth + 15, 140);

  // Box 3 - Social Security wages
  ctx.strokeRect(boxStartX, 160, boxWidth, boxHeight);
  ctx.font = 'bold 10px Arial';
  ctx.fillText('3 Social security wages', boxStartX + 5, 175);
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`$${v.socialSecurityWages.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, boxStartX + 5, 200);

  // Box 4 - Social Security tax
  ctx.strokeRect(boxStartX + boxWidth + 10, 160, boxWidth, boxHeight);
  ctx.font = 'bold 10px Arial';
  ctx.fillText('4 Social security tax withheld', boxStartX + boxWidth + 15, 175);
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`$${v.socialSecurityTaxWithheld.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, boxStartX + boxWidth + 15, 200);

  // Box 5 - Medicare wages
  ctx.strokeRect(boxStartX, 220, boxWidth, boxHeight);
  ctx.font = 'bold 10px Arial';
  ctx.fillText('5 Medicare wages and tips', boxStartX + 5, 235);
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`$${v.medicareWages.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, boxStartX + 5, 260);

  // Box 6 - Medicare tax
  ctx.strokeRect(boxStartX + boxWidth + 10, 220, boxWidth, boxHeight);
  ctx.font = 'bold 10px Arial';
  ctx.fillText('6 Medicare tax withheld', boxStartX + boxWidth + 15, 235);
  ctx.font = 'bold 16px Arial';
  ctx.fillText(`$${v.medicareTaxWithheld.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, boxStartX + boxWidth + 15, 260);

  // Footer
  ctx.font = '10px Arial';
  ctx.fillText('Form W-2 - Department of the Treasury - Internal Revenue Service', 250, height - 30);

  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(FIXTURES_DIR, 'sample-w2.png'), buffer);
  console.log('✓ Generated sample-w2.png');
}

/**
 * Generate Paystub Image
 */
function generatePaystub(): void {
  const width = 800;
  const height = 700;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Header background
  ctx.fillStyle = '#1a365d';
  ctx.fillRect(0, 0, width, 80);

  const v = EXPECTED_VALUES.paystub;

  // Company name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Arial';
  ctx.fillText(v.employerName, 30, 50);

  // Pay Statement title
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('EARNINGS STATEMENT', 30, 115);

  // Employee info section
  ctx.font = 'bold 12px Arial';
  ctx.fillText('Employee:', 30, 150);
  ctx.font = '14px Arial';
  ctx.fillText(v.employeeName, 100, 150);

  ctx.font = 'bold 12px Arial';
  ctx.fillText('Employee ID:', 30, 170);
  ctx.font = '14px Arial';
  ctx.fillText(v.employeeId, 120, 170);

  // Pay period info
  ctx.font = 'bold 12px Arial';
  ctx.fillText('Pay Period:', 400, 150);
  ctx.font = '14px Arial';
  ctx.fillText(`${v.payPeriodStart} - ${v.payPeriodEnd}`, 480, 150);

  ctx.font = 'bold 12px Arial';
  ctx.fillText('Pay Date:', 400, 170);
  ctx.font = '14px Arial';
  ctx.fillText(v.payDate, 480, 170);

  // Divider
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(30, 190);
  ctx.lineTo(width - 30, 190);
  ctx.stroke();

  // Earnings section
  ctx.fillStyle = '#1a365d';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('EARNINGS', 30, 220);

  ctx.fillStyle = '#000000';
  ctx.font = '12px Arial';

  // Table header
  ctx.fillText('Description', 30, 245);
  ctx.fillText('Hours', 300, 245);
  ctx.fillText('Rate', 380, 245);
  ctx.fillText('Current', 480, 245);
  ctx.fillText('YTD', 580, 245);

  // Regular pay
  ctx.fillText('Regular Pay', 30, 270);
  ctx.fillText('80.00', 300, 270);
  ctx.fillText('$52.08', 380, 270);
  ctx.font = 'bold 12px Arial';
  ctx.fillText(`$${v.grossPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 480, 270);
  ctx.fillText(`$${v.ytdGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 580, 270);

  // Gross pay line
  ctx.font = 'bold 14px Arial';
  ctx.fillText('Gross Pay:', 30, 310);
  ctx.fillText(`$${v.grossPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 480, 310);
  ctx.fillText(`$${v.ytdGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 580, 310);

  // Divider
  ctx.beginPath();
  ctx.moveTo(30, 330);
  ctx.lineTo(width - 30, 330);
  ctx.stroke();

  // Deductions section
  ctx.fillStyle = '#1a365d';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('DEDUCTIONS', 30, 360);

  ctx.fillStyle = '#000000';
  ctx.font = '12px Arial';

  let y = 390;
  const deductions = [
    ['Federal Income Tax', v.federalTax],
    ['State Income Tax', v.stateTax],
    ['Social Security', v.socialSecurity],
    ['Medicare', v.medicare],
    ['Health Insurance', v.healthInsurance],
    ['401(k) Contribution', v.retirement401k],
  ];

  for (const [name, amount] of deductions) {
    ctx.fillText(name as string, 30, y);
    ctx.fillText(`$${(amount as number).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 480, y);
    y += 25;
  }

  // Total deductions
  const totalDeductions = v.grossPay - v.netPay;
  ctx.font = 'bold 12px Arial';
  ctx.fillText('Total Deductions:', 30, y + 10);
  ctx.fillText(`$${totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 480, y + 10);

  // Divider
  ctx.beginPath();
  ctx.moveTo(30, y + 30);
  ctx.lineTo(width - 30, y + 30);
  ctx.stroke();

  // Net pay section - highlighted
  ctx.fillStyle = '#e6f3ff';
  ctx.fillRect(30, y + 40, width - 60, 50);

  ctx.fillStyle = '#1a365d';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('NET PAY:', 50, y + 72);
  ctx.font = 'bold 24px Arial';
  ctx.fillText(`$${v.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 480, y + 75);

  // YTD Net
  ctx.font = '12px Arial';
  ctx.fillStyle = '#666666';
  ctx.fillText(`YTD Net: $${v.ytdNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 580, y + 75);

  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(FIXTURES_DIR, 'sample-paystub.png'), buffer);
  console.log('✓ Generated sample-paystub.png');
}

/**
 * Generate Bank Statement Image
 */
function generateBankStatement(): void {
  const width = 800;
  const height = 700;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  const v = EXPECTED_VALUES.bankStatement;

  // Bank header
  ctx.fillStyle = '#0a4d2e';
  ctx.fillRect(0, 0, width, 100);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Arial';
  ctx.fillText(v.institutionName, 30, 50);
  ctx.font = '16px Arial';
  ctx.fillText('Member FDIC', 30, 75);

  // Statement title
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 20px Arial';
  ctx.fillText('ACCOUNT STATEMENT', 30, 140);

  // Account info box
  ctx.strokeStyle = '#cccccc';
  ctx.strokeRect(30, 160, 350, 100);

  ctx.font = 'bold 12px Arial';
  ctx.fillText('Account Holder:', 45, 185);
  ctx.font = '14px Arial';
  ctx.fillText(v.accountHolder, 150, 185);

  ctx.font = 'bold 12px Arial';
  ctx.fillText('Account Type:', 45, 210);
  ctx.font = '14px Arial';
  ctx.fillText(v.accountType, 150, 210);

  ctx.font = 'bold 12px Arial';
  ctx.fillText('Account Number:', 45, 235);
  ctx.font = '14px Arial';
  ctx.fillText(`****${v.accountNumberLast4}`, 160, 235);

  // Statement period box
  ctx.strokeRect(420, 160, 350, 100);

  ctx.font = 'bold 12px Arial';
  ctx.fillText('Statement Period:', 435, 185);
  ctx.font = '14px Arial';
  ctx.fillText(`${v.statementPeriodStart} - ${v.statementPeriodEnd}`, 435, 210);

  // Account summary section
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#0a4d2e';
  ctx.fillText('ACCOUNT SUMMARY', 30, 300);

  // Summary boxes
  const boxY = 320;
  const boxWidth = 170;
  const boxHeight = 80;

  // Beginning Balance
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(30, boxY, boxWidth, boxHeight);
  ctx.fillStyle = '#000000';
  ctx.font = '12px Arial';
  ctx.fillText('Beginning Balance', 45, boxY + 25);
  ctx.font = 'bold 18px Arial';
  ctx.fillText(`$${v.beginningBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 45, boxY + 55);

  // Deposits
  ctx.fillStyle = '#e8f5e9';
  ctx.fillRect(220, boxY, boxWidth, boxHeight);
  ctx.fillStyle = '#2e7d32';
  ctx.font = '12px Arial';
  ctx.fillText('Total Deposits', 235, boxY + 25);
  ctx.font = 'bold 18px Arial';
  ctx.fillText(`+$${v.totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 235, boxY + 55);

  // Withdrawals
  ctx.fillStyle = '#ffebee';
  ctx.fillRect(410, boxY, boxWidth, boxHeight);
  ctx.fillStyle = '#c62828';
  ctx.font = '12px Arial';
  ctx.fillText('Total Withdrawals', 425, boxY + 25);
  ctx.font = 'bold 18px Arial';
  ctx.fillText(`-$${v.totalWithdrawals.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 425, boxY + 55);

  // Ending Balance
  ctx.fillStyle = '#e3f2fd';
  ctx.fillRect(600, boxY, boxWidth, boxHeight);
  ctx.fillStyle = '#1565c0';
  ctx.font = '12px Arial';
  ctx.fillText('Ending Balance', 615, boxY + 25);
  ctx.font = 'bold 18px Arial';
  ctx.fillText(`$${v.endingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 615, boxY + 55);

  // Transaction history header
  ctx.fillStyle = '#0a4d2e';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('TRANSACTION HISTORY', 30, 450);

  // Table header
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(30, 465, width - 60, 30);

  ctx.fillStyle = '#000000';
  ctx.font = 'bold 12px Arial';
  ctx.fillText('Date', 45, 485);
  ctx.fillText('Description', 150, 485);
  ctx.fillText('Withdrawals', 480, 485);
  ctx.fillText('Deposits', 580, 485);
  ctx.fillText('Balance', 680, 485);

  // Sample transactions
  ctx.font = '11px Arial';
  const transactions = [
    ['01/02/2026', 'Direct Deposit - Payroll', '', '$4,250.00', '$9,682.10'],
    ['01/05/2026', 'Online Transfer Out', '$1,500.00', '', '$8,182.10'],
    ['01/10/2026', 'Check #1234', '$800.00', '', '$7,382.10'],
    ['01/15/2026', 'Direct Deposit - Payroll', '', '$4,250.00', '$11,632.10'],
    ['01/20/2026', 'Mortgage Payment', '$2,100.00', '', '$9,532.10'],
    ['01/25/2026', 'Utility Payment - Electric', '$150.00', '', '$9,382.10'],
    ['01/28/2026', 'ATM Withdrawal', '$200.00', '', '$9,182.10'],
    ['01/31/2026', 'Monthly Service Fee', '$10.00', '', '$9,172.10'],
  ];

  let ty = 515;
  for (const [date, desc, withdrawal, deposit, balance] of transactions) {
    ctx.fillText(date, 45, ty);
    ctx.fillText(desc, 150, ty);
    if (withdrawal) {
      ctx.fillStyle = '#c62828';
      ctx.fillText(withdrawal, 480, ty);
      ctx.fillStyle = '#000000';
    }
    if (deposit) {
      ctx.fillStyle = '#2e7d32';
      ctx.fillText(deposit, 580, ty);
      ctx.fillStyle = '#000000';
    }
    ctx.fillText(balance, 680, ty);
    ty += 22;
  }

  // Footer
  ctx.fillStyle = '#666666';
  ctx.font = '10px Arial';
  ctx.fillText('This statement is provided for your records. Please review all transactions carefully.', 30, height - 30);

  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(FIXTURES_DIR, 'sample-bank-statement.png'), buffer);
  console.log('✓ Generated sample-bank-statement.png');
}

/**
 * Generate a driver's license / ID image
 */
function generateDriversLicense(): void {
  const width = 600;
  const height = 380;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background gradient
  ctx.fillStyle = '#1e3a5f';
  ctx.fillRect(0, 0, width, height);

  // Lighter top section
  ctx.fillStyle = '#2c5282';
  ctx.fillRect(0, 0, width, 80);

  // State header
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial';
  ctx.fillText('STATE OF TEXAS', 200, 35);
  ctx.font = '14px Arial';
  ctx.fillText("DRIVER'S LICENSE", 245, 55);

  // Photo placeholder
  ctx.fillStyle = '#cccccc';
  ctx.fillRect(30, 100, 150, 180);
  ctx.fillStyle = '#999999';
  ctx.font = '12px Arial';
  ctx.fillText('PHOTO', 85, 195);

  // Info section
  ctx.fillStyle = '#ffffff';
  const info = [
    ['DL', 'TX12345678'],
    ['NAME', 'SMITH, JOHN MICHAEL'],
    ['DOB', '03/15/1985'],
    ['ADDRESS', '456 Oak Street'],
    ['', 'Austin, TX 78701'],
    ['ISSUED', '01/15/2024'],
    ['EXPIRES', '03/15/2030'],
    ['CLASS', 'C'],
  ];

  let y = 115;
  for (const [label, value] of info) {
    if (label) {
      ctx.font = 'bold 10px Arial';
      ctx.fillStyle = '#90cdf4';
      ctx.fillText(label, 200, y);
    }
    ctx.font = '14px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(value, 200, y + (label ? 15 : 0));
    y += label ? 30 : 15;
  }

  // Barcode placeholder
  ctx.fillStyle = '#000000';
  ctx.fillRect(30, 300, 540, 50);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 50; i++) {
    const x = 35 + i * 10 + Math.random() * 5;
    const w = 2 + Math.random() * 4;
    ctx.fillRect(x, 305, w, 40);
  }

  // Save
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(FIXTURES_DIR, 'sample-drivers-license.png'), buffer);
  console.log('✓ Generated sample-drivers-license.png');
}

// Run generators
console.log('\nGenerating test document images...\n');
generateW2();
generatePaystub();
generateBankStatement();
generateDriversLicense();

console.log(`\n✓ All images saved to: ${FIXTURES_DIR}`);
console.log('✓ Expected values saved to: expected-values.json\n');
