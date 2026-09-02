import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, FileText, Sparkles } from "lucide-react";

const sections = [
  {
    title: "1. About these Terms",
    content: (
      <>
        <p>
          These Terms of Use ("Terms") govern your access to and use of Kri8,
          including the Kri8 website, mobile applications, workspace, AI
          features, community features, and related services (collectively, the
          "Services").
        </p>
        <p>
          By creating an account, accessing, or using the Services, you agree
          to these Terms. If you do not agree, do not use Kri8.
        </p>
        <p>
          <strong>Operator:</strong> Kri8. The operator's full legal entity name
          and legal-notices contact should be inserted here before launch.
        </p>
      </>
    ),
  },
  {
    title: "2. Eligibility and your account",
    content: (
      <>
        <p>
          You must be legally able to enter into these Terms. Kri8 is intended
          for users aged 18 and over unless a parent or legal guardian
          authorizes use where applicable law allows it.
        </p>
        <p>
          You must provide accurate account information, keep your login
          credentials secure, and promptly tell us if you believe your account
          has been accessed without permission. You are responsible for
          activity carried out through your account.
        </p>
      </>
    ),
  },
  {
    title: "3. The Kri8 Services and AI features",
    content: (
      <>
        <p>
          Kri8 helps you capture, organize, develop, analyze, and share ideas.
          Features may include idea workspaces, media uploads, community
          sharing, trends, exports, and AI-generated summaries, suggestions,
          categories, or other insights.
        </p>
        <p>
          AI-generated output can be inaccurate, incomplete, outdated, biased,
          or unsuitable for your circumstances. It is provided for
          informational and creative purposes only and is not legal, financial,
          tax, medical, investment, business, or other professional advice.
        </p>
        <p>
          You are responsible for reviewing output before relying on it. Kri8
          does not guarantee that an idea is original, protectable by
          intellectual-property law, commercially viable, legally compliant, or
          free from third-party rights.
        </p>
      </>
    ),
  },
  {
    title: "4. Ideas, submissions, and confidentiality",
    content: (
      <>
        <p>
          You retain ownership of the original content and other intellectual
          property rights that you lawfully own in content you submit to Kri8
          ("User Content"). This does not mean that every idea, concept, fact,
          or suggestion is legally protectable.
        </p>
        <p>
          Submitting an idea to Kri8 does not create a confidential, fiduciary,
          investor, partnership, employment, or agency relationship. Kri8 does
          not promise that your submissions are confidential or that Kri8 or
          another user will not independently develop a similar idea.
        </p>
        <p>
          Do not submit trade secrets or information you are not authorized to
          share unless you understand the risks and have the necessary
          permissions or a separate written confidentiality agreement.
        </p>
      </>
    ),
  },
  {
    title: "5. Permission to operate Kri8",
    content: (
      <>
        <p>
          You grant Kri8 a worldwide, non-exclusive, royalty-free license to
          host, store, back up, reproduce, process, adapt, format, and display
          your User Content only as reasonably necessary to provide, secure,
          maintain, support, and improve the Services.
        </p>
        <p>
          This includes processing text, images, audio, video, and other media
          through the features you choose to use. Kri8 may use aggregated or
          de-identified information to understand usage, measure performance,
          improve the Services, and develop new features.
        </p>
        <p>
          Kri8 will not use your private, identifiable idea submissions for
          public marketing without appropriate permission. If you choose to
          publish or share User Content publicly, you understand that other
          people may view, copy, save, or redistribute it.
        </p>
      </>
    ),
  },
  {
    title: "6. Your responsibilities for User Content",
    content: (
      <>
        <p>
          You are responsible for your User Content and for confirming that you
          have all rights, permissions, and consents needed to upload, process,
          store, or share it through Kri8.
        </p>
        <p>
          This includes permission to use another person's name, image, voice,
          recording, personal information, copyrighted work, confidential
          material, or trademark. You must not upload content that violates a
          contract, law, court order, or another person's rights.
        </p>
      </>
    ),
  },
  {
    title: "7. Acceptable use",
    content: (
      <>
        <p>You may not use Kri8 to:</p>
        <ul>
          <li>break the law, commit fraud, or facilitate harm;</li>
          <li>harass, threaten, exploit, impersonate, or target another person;</li>
          <li>infringe intellectual-property, privacy, publicity, or other rights;</li>
          <li>upload malware, malicious code, or content designed to compromise security;</li>
          <li>scrape, crawl, reverse engineer, decompile, or bypass access controls;</li>
          <li>create spam, fake accounts, or misleading commercial activity; or</li>
          <li>attempt to access another user's account, data, or private workspace.</li>
        </ul>
      </>
    ),
  },
  {
    title: "8. Community content and moderation",
    content: (
      <>
        <p>
          If you use community or sharing features, you are responsible for
          what you publish. Kri8 may, but is not required to, review, restrict,
          or remove content that violates these Terms, creates risk, or is
          otherwise inappropriate for the Services.
        </p>
        <p>
          Kri8 may use automated tools and human review to enforce these rules,
          investigate reports, protect users, and maintain platform security.
          We may suspend or restrict access while investigating suspected
          violations.
        </p>
      </>
    ),
  },
  {
    title: "9. Kri8 intellectual property",
    content: (
      <>
        <p>
          Kri8 and its licensors own the Services, including the Kri8 name,
          logos, software, interface, designs, templates, documentation,
          workflows, and underlying technology. Except for the limited right
          to use the Services under these Terms, no ownership rights are
          transferred to you.
        </p>
        <p>
          If you send Kri8 feedback, suggestions, or feature requests, Kri8
          may use and incorporate them without restriction, payment, or
          attribution.
        </p>
      </>
    ),
  },
  {
    title: "10. Availability, changes, and experimental features",
    content: (
      <>
        <p>
          Kri8 may change, pause, or discontinue features, including beta or
          experimental features. We do not guarantee that the Services will
          always be available, uninterrupted, error-free, or that User Content
          will never be lost. Keep independent copies of important content.
        </p>
        <p>
          Kri8 may update these Terms from time to time. We will provide
          reasonable notice of material changes where required by law. Your
          continued use after the effective date means you accept the updated
          Terms.
        </p>
      </>
    ),
  },
  {
    title: "11. Paid features, subscriptions, and refunds",
    content: (
      <>
        <p>
          If Kri8 offers paid plans or subscriptions, the applicable checkout
          page will identify the price, billing interval, renewal terms, taxes,
          and any usage limits. Unless stated otherwise, subscriptions renew
          until canceled.
        </p>
        <p>
          You may cancel through the method shown at purchase. Refunds are
          governed by the applicable purchase terms and mandatory consumer
          rights. Mobile subscriptions may also be subject to Apple App Store
          or Google Play billing rules.
        </p>
      </>
    ),
  },
  {
    title: "12. Suspension and termination",
    content: (
      <>
        <p>
          You may stop using Kri8 or request account deletion at any time.
          Kri8 may suspend, restrict, or terminate access for a violation of
          these Terms, unlawful or harmful activity, security risk, non-payment,
          or operational reasons.
        </p>
        <p>
          After deletion or termination, we may retain limited information as
          needed for backups, legal obligations, fraud prevention, dispute
          resolution, or legitimate business records. Content already shared
          publicly may remain in copies made by other users.
        </p>
      </>
    ),
  },
  {
    title: "13. Third-party services and links",
    content: (
      <>
        <p>
          Kri8 may rely on third parties for authentication, hosting, storage,
          AI processing, analytics, notifications, payments, and app
          distribution. Third-party services may have their own terms and
          privacy policies. Kri8 is not responsible for a third party's
          independent acts, content, policies, or outages.
        </p>
      </>
    ),
  },
  {
    title: "14. Disclaimers and limits on liability",
    content: (
      <>
        <p>
          To the fullest extent permitted by law, the Services are provided on
          an "as available" basis without warranties that they will meet your
          requirements, produce a particular result, or be uninterrupted or
          error-free.
        </p>
        <p>
          To the fullest extent permitted by law, Kri8 will not be responsible
          for indirect, incidental, special, consequential, exemplary, or
          punitive losses, including lost profits, opportunities, revenue,
          business, data, or reputation arising from your use of or reliance on
          the Services or AI output.
        </p>
        <p>
          Kri8's total liability for claims relating to the Services will be
          limited to the amount you paid Kri8 during the twelve months before
          the event giving rise to the claim, or the minimum amount permitted
          by applicable law if you paid nothing. Nothing in these Terms limits
          liability that cannot legally be limited.
        </p>
      </>
    ),
  },
  {
    title: "15. Indemnity",
    content: (
      <>
        <p>
          To the extent permitted by law, you agree to defend, indemnify, and
          hold Kri8 and its people harmless from claims, losses, liabilities,
          and expenses arising from your User Content, your breach of these
          Terms, your unlawful use of the Services, or your infringement of
          another person's rights.
        </p>
      </>
    ),
  },
  {
    title: "16. Governing law and contact",
    content: (
      <>
        <p>
          The governing law, venue, dispute-resolution process, and legal
          notices contact for Kri8 should be completed by the Kri8 operator
          before these Terms are published as final.
        </p>
        <p>
          If you have a question about these Terms or want to report a
          violation, use the official support or legal contact published by
          Kri8.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  useEffect(() => {
    const splash = document.getElementById("kri8-splash");
    if (splash && !splash.classList.contains("fade-out")) {
      splash.classList.add("fade-out");
      window.setTimeout(() => splash.remove(), 500);
    }
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#0d1117] text-white">
      <header className="border-b border-white/10 bg-[#0d1117]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-slate-300 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Kri8
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
              <span className="text-[10px] font-black tracking-tighter text-[#1a1f35]">kri8</span>
            </div>
            <span className="font-bold tracking-tight">kri8</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
        <div className="mb-10 flex items-start gap-4">
          <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#d4af37]/15 text-[#f3cd57]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#f3cd57]">
              Legal
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Terms of Use
            </h1>
            <p className="mt-3 text-sm text-slate-400">
              Last updated: September 2, 2026
            </p>
          </div>
        </div>

        <div className="mb-10 flex gap-3 rounded-2xl border border-[#d4af37]/25 bg-[#d4af37]/10 p-4 text-sm leading-6 text-[#f5df9a]">
          <Sparkles className="mt-1 h-4 w-4 shrink-0" />
          <p>
            These Terms are a product draft for review. Replace the operator,
            legal entity, contact, governing-law, and dispute-resolution
            placeholders and have qualified counsel review them before launch.
          </p>
        </div>

        <div className="space-y-9 text-[15px] leading-7 text-slate-300">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-lg font-semibold text-white">
                {section.title}
              </h2>
              <div className="space-y-3 [&_strong]:text-slate-100 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-14 border-t border-white/10 pt-6 text-sm text-slate-500">
          <Link href="/" className="text-[#f3cd57] transition-colors hover:text-white">
            Return to Kri8
          </Link>
        </footer>
      </main>
    </div>
  );
}