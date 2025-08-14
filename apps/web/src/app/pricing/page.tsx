import MarketingTopBar from "@/components/marketing/TopBar";

export default function PricingPage() {
  return (
    <div>
      <MarketingTopBar />
      <section className="container py-10">
        <h1 className="text-3xl font-semibold mb-6">Pricing</h1>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-5">
            <div className="text-lg font-medium mb-1">Trial</div>
            <div className="text-sm text-[var(--muted-foreground)] mb-4">Try Rivor with limited usage</div>
            <ul className="text-sm space-y-1 mb-4">
              <li>• 50 summaries/day</li>
              <li>• 1 seat</li>
            </ul>
            <button className="px-4 py-2 rounded-md border border-[var(--border)]">Start Trial</button>
          </div>
          <div className="card p-5 border-2" style={{ borderColor: "var(--rivor-teal)" }}>
            <div className="text-lg font-medium mb-1">Pro</div>
            <div className="text-sm text-[var(--muted-foreground)] mb-1">$200/seat/mo</div>
            <ul className="text-sm space-y-1 mb-4">
              <li>• Unlimited summaries</li>
              <li>• Unlimited seats</li>
              <li>• Priority support</li>
            </ul>
            <button className="px-4 py-2 rounded-md brand-gradient text-white">Checkout with Stripe</button>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-medium mb-3">FAQ</h2>
          <div className="space-y-2">
            <details className="card p-4">
              <summary className="cursor-pointer">How does billing work?</summary>
              <div className="text-sm text-[var(--muted-foreground)] mt-2">Per seat, per month. Cancel anytime.</div>
            </details>
            <details className="card p-4">
              <summary className="cursor-pointer">What about security?</summary>
              <div className="text-sm text-[var(--muted-foreground)] mt-2">KMS encryption, least-privilege scopes, audit logging.</div>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}


