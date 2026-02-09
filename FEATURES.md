# MortMortgage — Product Overview

> A modern mortgage platform that simplifies the home financing journey for borrowers while giving lenders powerful tools to make faster, smarter decisions.

---
## A feature summary
Completed Features (23)

Full URLA 2020 JSON Schema (10 sections)
10-step application wizard with auto-save
Application CRUD API
MISMO v3.4 JSON/XML export
Admin portal with status management
Form validation (DTI/LTV warnings)
Authentication (NextAuth, 4-tier role hierarchy)
Document upload (PDF/JPG/PNG)
Modern UI design (Tailwind)
Mock integrations (credit, income, AVM, pricing)
URLA PDF export
Admin underwriting panel
351 unit tests
Borrower dashboard
Pre-qualification calculator
Admin analytics with charts
Loan comparison tool
Address autocomplete (Google Places)
Plaid bank/income verification
Co-borrower support
Property map with comparables (Leaflet)
AI document OCR (Claude + Tesseract fallback)
Signature pad component
Caseworker queues & supervisor dashboards


## For Home Buyers

### Know What You Can Afford — Instantly

Our **Pre-Qualification Calculator** gives you a clear picture of your home buying power in seconds. Simply enter your income, debts, and down payment amount to see:

- Your maximum purchase price
- Estimated monthly payments
- Whether you're likely to qualify

No credit check required. No commitment. Just clarity.

### A Guided Application Experience

Applying for a mortgage doesn't have to be overwhelming. Our **10-step application wizard** walks you through every section of the Uniform Residential Loan Application (URLA 2020) with:

- **Smart address lookup** — Start typing and we'll find your address
- **Automatic saving** — Your progress is saved as you go, so you can complete it at your own pace
- **Clear progress tracking** — Always know where you are and what's left
- **Built-in validation** — Catch errors before submission, not after
- **Co-borrower support** — Applying with a spouse or partner? We've got you covered

### Connect Your Bank for Faster Verification

Skip the paperwork. Link your bank account through Plaid to instantly verify your income and assets. It's secure, fast, and means fewer documents to track down.

### Compare Your Options

Not sure which loan is right for you? Our **Loan Comparison Tool** lets you compare up to three scenarios side-by-side:

- 15-year vs. 30-year terms
- Different down payment amounts
- See total interest paid over the life of the loan
- Understand the true cost of each option

Make confident decisions with clear, visual comparisons.

### Your Personal Dashboard

Track all your applications in one place. See status updates, continue where you left off, and know exactly where you stand in the process.

---

## For Lenders & Administrators

### A Complete View of Every Application

The **Admin Portal** puts everything you need at your fingertips:

- All applications in one centralized dashboard
- Filter by status, search by borrower name
- Quick access to application details
- Status management from draft through approval

### Underwriting Tools That Save Time

Make informed decisions faster with integrated verification tools:

**Credit Analysis**
- Pull tri-bureau credit reports with a single click
- View credit scores from all three bureaus
- See detailed tradelines, utilization rates, and collections
- Clear risk indicators at a glance

**Income Verification**
- Verify employment and income instantly
- Compare stated income against verified amounts
- Flag discrepancies automatically

**Property Valuation**
- Automated valuation model (AVM) results
- Comparable sales from the area
- Market trend data
- Confidence scoring

**Loan Pricing**
- Multiple rate scenarios
- Complete payment breakdowns
- Fee estimates and closing costs
- Points and APR comparisons

### Qualification at a Glance

Every application displays a clear qualification summary showing:

- Credit score with risk assessment
- Debt-to-income ratio
- Loan-to-value ratio
- Estimated monthly payment
- Overall qualification status

No more hunting through pages of data to understand an applicant's profile.

### Analytics That Drive Decisions

The **Analytics Dashboard** gives you visibility into your pipeline:

- Application volume over time
- Approval rates
- Average loan amounts
- Breakdown by loan type and property type
- Recent activity feed

Spot trends, identify bottlenecks, and optimize your operations.

### Caseworker Queues — Work Smarter, Not Harder

Assign applications to caseworkers and give each one a focused **personal workbench**:

- **Smart queue sorting** — Urgent priorities and overdue SLAs float to the top automatically
- **Priority badges** — Color-coded urgent/high/normal/low indicators so nothing gets missed
- **SLA tracking** — At-a-glance overdue (red), at-risk (yellow), and on-track (green) status
- **Personal stats** — Queue size, completed this month, average days to decision, approval rate
- **Completion history** — Track every decision with outcome and processing time

Caseworkers open their queue in the morning and know exactly what to work on first.

### Supervisor Dashboards — Team Visibility at Scale

Supervisors get a bird's-eye view of the entire operation:

**Workload Distribution**
- Visual bar chart showing each caseworker's active queue size
- Color-coded capacity indicators (green/yellow/red) to spot overloaded team members

**Risk Analysis**
- LTV and DTI stacked bar charts showing approval vs. denial rates by range
- Quickly identify where risk is concentrated in your portfolio

**Performance Trends**
- 6-month multi-line chart tracking completed applications per caseworker
- Spot performance patterns and seasonal trends

**Team Management**
- Auto-assign unassigned applications with one click (round-robin balancing)
- Reassign cases between caseworkers as workloads shift
- Activate or deactivate caseworkers
- Full assignment audit trail — who assigned what, when, and why

### Industry-Standard Exports

Seamlessly integrate with your existing systems:

- **MISMO v3.4** export in JSON or XML format for LOS integration
- **URLA PDF** generation with proper SSN masking
- All data mapped to industry standards

---

## Built for Compliance

MortMortgage is designed around the **URLA 2020** standard, ensuring:

- All required fields and sections are captured
- HMDA-compliant demographic collection
- Declaration questions match regulatory requirements
- Proper handling of sensitive information

---

## Security & Privacy

- Secure authentication with 4-tier role-based access (Borrower, Caseworker, Admin, Supervisor)
- Document uploads validated for type and size
- Sensitive data (SSN) masked in exports
- Bank connections through Plaid's secure infrastructure

---

## Why MortMortgage?

| Challenge | Our Solution |
|-----------|--------------|
| Borrowers abandon complex applications | Guided wizard with auto-save and clear progress |
| Manual income/asset verification takes days | Instant verification through Plaid integration |
| Underwriters juggle multiple systems | All verification tools in one panel |
| Difficult to compare loan options | Side-by-side comparison tool |
| Integration with existing LOS | MISMO v3.4 export ready |
| Compliance concerns | Built on URLA 2020 standards |
| Uneven caseworker workloads | Auto-assign with round-robin balancing |
| No visibility into team performance | Supervisor dashboard with workload and trend charts |
| Applications falling through the cracks | Priority queues with SLA tracking and overdue alerts |

---

## Ready to Modernize Your Mortgage Process?

MortMortgage brings together everything borrowers, caseworkers, and supervisors need in one streamlined platform. From the first "Can I afford this?" question through caseworker assignment to final underwriting decisions, we make the mortgage process clearer, faster, and more transparent for everyone involved.

---

*MortMortgage — Simplifying the path to homeownership.*
