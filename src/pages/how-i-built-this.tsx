import Link from 'next/link'
import UserMenu from '../components/UserMenu'

const FEATURES = [
  { title: 'Full URLA 2020 Wizard', desc: '10-step form, co-borrower support, auto-save, field-level validation' },
  { title: 'MISMO v3.4 Export', desc: 'JSON and XML export for LOS integration' },
  { title: 'URLA PDF Export', desc: 'Fannie Mae Form 1003 layout, ready to print or file' },
  { title: '3-Role Auth System', desc: 'Borrower, Caseworker, and Supervisor with JWT sessions' },
  { title: 'Caseworker Workbench', desc: 'Claim queue, in-progress tracking, assignment management' },
  { title: 'Supervisor Portal', desc: 'Underwriting panel, application review, team oversight' },
  { title: 'Analytics Dashboard', desc: 'Charts, funnel metrics, volume trends, approval rates' },
  { title: 'Mock Integrations', desc: 'Credit pull, income verification, AVM, and pricing engine' },
  { title: 'Pre-Qualification Calculator', desc: 'Instant affordability estimate before a full application' },
  { title: 'Loan Comparison Tool', desc: 'Side-by-side comparison of loan scenarios' },
  { title: 'Plaid-Style Bank Linking', desc: 'Mock OAuth bank linking flow with manual fallback' },
  { title: 'Address Autocomplete', desc: 'Google Places integration with graceful fallback' },
  { title: '50-Record Seed Data', desc: 'Synthetic borrowers and applications for demo realism' },
  { title: '377+ Unit Tests', desc: 'Schema validation, business logic, API route coverage' },
]

export default function HowIBuiltThis() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-xl font-bold text-gray-900">MortMortgage</span>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            One Weekend. One Friend.
            <span className="block text-primary-200">One Full System.</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto">
            A demo of what AI-orchestrated development can do — and what that means for software delivery.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-[60px] overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#f9fafb"/>
          </svg>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">

        {/* Section 1 — Twenty Years Ago */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Twenty Years Ago</h2>
          <div className="prose prose-lg text-gray-600 space-y-4">
            <p>
              Earlier in my career I worked on a contract underwriting system — a multi-role platform that processed
              mortgage applications through a structured workflow: borrowers submitted data, caseworkers reviewed it,
              and supervisors made underwriting decisions. The system handled document collection, role-based access
              control, status tracking, and integration with external data sources and underwriting and credit systems.
            </p>
            <p>
              It was a large team. The project took a long time. The budget was material. That was the cost of
              building enterprise software in that era — and honestly, it wasn&apos;t unreasonable given the tooling
              and processes available at the time.
            </p>
            <p>
              The implied question: what does that same scope cost in time and money today?
            </p>
          </div>
        </section>

        {/* Section 2 — The Question */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">The Question</h2>
          <div className="prose prose-lg text-gray-600 space-y-4">
            <p>
              Could I build it faster today? I wanted to find out — not as a theoretical exercise, but as a genuine
              experiment with a real deliverable.
            </p>
            <p>
              &ldquo;One friend&rdquo; means exactly that: one human collaborator. We used{' '}
              <a href="https://brightmeld.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 font-medium underline">
                BrightMeld
              </a>
              {' '}as our primary development tool — an AI-orchestrated development platform that coordinates
              multiple AI agents working in parallel. The constraint was one weekend of effort.
            </p>
          </div>
        </section>

        {/* Section 3 — Step 1: Requirements */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Step 1: Expressing Requirements</h2>
          <div className="prose prose-lg text-gray-600 space-y-4">
            <p>
              The first task was writing a detailed specification document — structured like a real enterprise RFP.
              Not a vague prompt, but a complete requirements document covering user roles, data standards,
              integration points, compliance targets, and acceptance criteria.
            </p>
            <p>
              The scope included: three user roles with distinct workflows, full URLA 2020 form compliance
              (10-step wizard), MISMO v3.4 data export, seven mock third-party integrations, a caseworker claim
              queue, a supervisor underwriting panel, an analytics dashboard, and cloud deployment.
            </p>
            <p>
              Writing the requirements document took hours, not days. The discipline of specifying clearly —
              before writing a single line of code — is what made the rest possible.
            </p>
          </div>
          <div className="mt-8 bg-primary-50 border border-primary-200 rounded-xl p-6">
            <p className="text-primary-800 font-medium">
              The full RFP specified 12 acceptance criteria covering authentication, data standards compliance,
              underwriting simulations, and cloud deployment.
            </p>
          </div>
        </section>

        {/* Section 4 — Step 2: BrightMeld */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Step 2: The BrightMeld Process</h2>
          <div className="prose prose-lg text-gray-600 space-y-4 mb-8">
            <p>
              <a href="https://brightmeld.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 font-medium underline">
                BrightMeld
              </a>
              {' '}is an AI-orchestrated development platform. Instead of a single AI assistant answering questions
              one at a time, BrightMeld runs multiple specialized agents in parallel — each focused on a different
              part of the system — while maintaining human approval gates throughout.
            </p>
            <p>
              The contrast with traditional sequential development is stark: where a team of engineers would
              typically work through a backlog one feature at a time, BrightMeld&apos;s agents work concurrently
              across the codebase.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { layer: 'Spark', desc: 'Translates the requirements document into detailed technical specifications and task decomposition.' },
              { layer: 'Forge', desc: 'Seven AI agents working in parallel — frontend, backend, schema, tests, integrations, auth, and deployment.' },
              { layer: 'Lens', desc: 'Adversarial QA layer: OWASP scanning, coverage scoring, edge-case testing, and regression checks.' },
              { layer: 'Pulse', desc: 'Real-time transparency dashboard showing agent activity, decisions, and progress across all tracks.' },
            ].map(({ layer, desc }) => (
              <div key={layer} className="card p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <span className="text-primary-700 font-bold text-sm">{layer[0]}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{layer}</h3>
                </div>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5 — What Got Built */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What Got Built</h2>
          <p className="text-lg text-gray-600 mb-8">
            Every item below was delivered in the single weekend sprint and is live in this demo.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map(({ title, desc }) => (
              <div key={title} className="card p-5 flex items-start gap-3">
                <div className="w-5 h-5 mt-0.5 flex-shrink-0 text-primary-600">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6 — What Comes Next */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What Comes Next?</h2>
          <div className="prose prose-lg text-gray-600 space-y-4 mb-10">
            <p>
              Is this application ready for release? Of course not — it was purposefully built as a prototype and MVP
              with no expectation of commercial use. Before anything real could ship, the tech stack would need
              rethinking, every access point would need hardening, and the code would need validation for robustness
              and scale. None of that work makes sense until there&apos;s a real business model behind it — something
              people actually want to pay for, not just something fun to build.
            </p>
            <p>
              The more interesting question is: what <em>should</em> you go after?
            </p>
            <p>
              I recently looked at a mid-sized enterprise&apos;s SaaS CRM and found that over a third of the defined
              entities had zero records, and more than 40% of the attributes on entities that <em>did</em> have
              records were null. The reuse and speed-to-deploy that SaaS provides is real — but that emptiness points
              to a lot of waste. You&apos;re paying for a platform shaped around someone else&apos;s model of your business.
            </p>
            <p>
              Without wanting to pile onto the Saas&shy;pocalypse discourse, there&apos;s a genuine argument that the
              pendulum is swinging back toward bespoke. If AI-orchestrated development can compress a months-long
              engagement into a weekend sprint, the calculus changes. Better fit, lower ongoing cost, no licensing
              creep — if done right. The &ldquo;if done right&rdquo; still matters enormously. But the cost of getting
              there just dropped.
            </p>
          </div>
        </section>

        {/* Section 7 — Try It Yourself */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Try It Yourself</h2>
          <div className="card p-8 bg-gradient-to-br from-primary-50 to-white border border-primary-100">
            <p className="text-gray-600 mb-6">
              Sign in using any of the demo accounts below. Each role shows a different part of the system.
              No real data please — this is a demonstration environment.
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary-200">
                    <th className="text-left py-2 pr-6 text-gray-500 font-medium">Role</th>
                    <th className="text-left py-2 pr-6 text-gray-500 font-medium">Email</th>
                    <th className="text-left py-2 pr-6 text-gray-500 font-medium">Password</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Starting page</th>
                  </tr>
                </thead>
                <tbody className="font-mono divide-y divide-gray-100">
                  <tr>
                    <td className="py-2 pr-6 text-gray-700 font-sans font-medium">Borrower</td>
                    <td className="py-2 pr-6">borrower@demo.com</td>
                    <td className="py-2 pr-6">demo123</td>
                    <td className="py-2 font-sans"><Link href="/dashboard" className="text-primary-600 hover:underline">/dashboard</Link></td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-6 text-gray-700 font-sans font-medium">Supervisor</td>
                    <td className="py-2 pr-6">supervisor@demo.com</td>
                    <td className="py-2 pr-6">demo123</td>
                    <td className="py-2 font-sans"><Link href="/admin" className="text-primary-600 hover:underline">/admin</Link></td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-6 text-gray-700 font-sans font-medium">Caseworker 1</td>
                    <td className="py-2 pr-6">caseworker1@demo.com</td>
                    <td className="py-2 pr-6">demo123</td>
                    <td className="py-2 font-sans"><Link href="/caseworker" className="text-primary-600 hover:underline">/caseworker</Link></td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-6 text-gray-700 font-sans font-medium">Caseworker 2</td>
                    <td className="py-2 pr-6">caseworker2@demo.com</td>
                    <td className="py-2 pr-6">demo123</td>
                    <td className="py-2 font-sans"><Link href="/caseworker" className="text-primary-600 hover:underline">/caseworker</Link></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/auth/signin" className="btn btn-primary">
                Sign In to Explore
              </Link>
              <Link href="/" className="btn btn-secondary">
                Back to Home
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Do not enter real personal or financial data. All records are synthetic and for demonstration only.
            </p>
          </div>
        </section>

      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-400 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-white font-semibold">MortMortgage</span>
            </Link>
            <p className="text-sm">
              Demo application. All data is synthetic for presentation purposes only.
            </p>
            <a href="https://brightmeld.com" target="_blank" rel="noopener noreferrer" className="text-sm text-primary-400 hover:text-primary-300">
              Built with BrightMeld
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
