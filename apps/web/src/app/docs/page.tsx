export default function DocsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <section id="setup">
        <h1>Docs</h1>
        <p>MDX-like content layout. Add your guides here.</p>
      </section>
      <section id="oauth-scopes">
        <h2>OAuth Scopes</h2>
        <p>Least-privilege scopes for Gmail/Outlook and Calendar.</p>
      </section>
      <section id="kms">
        <h2>KMS</h2>
        <p>Per-org DEKs, rotations, and audit trails.</p>
      </section>
      <section id="webhooks">
        <h2>Webhooks</h2>
        <p>Inbox change notifications and calendar events.</p>
      </section>
      <section id="limits">
        <h2>Limits</h2>
        <p>Summaries/day, retention, and rate limits.</p>
      </section>
      <section id="changelog">
        <h2>Changelog</h2>
        <p>What’s new in Rivor.</p>
      </section>
    </article>
  );
}


