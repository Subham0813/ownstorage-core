import LegalLayout, { LegalSection } from "../components/layout/LegalLayout";
import { isSaaS, isSelfHosted } from "../utils/appMode";

const UNIVERSAL_SECTIONS = [
  {
    title: "Acceptance of Terms & Age Capacity",
    intro: "By registering an account or accessing OwnStorage, you affirm that you are at least 18 years of age (or the legal age of majority in your jurisdiction) and have the full legal capacity to enter into a binding agreement. If you do not agree or are an unauthorized minor, you may not use our services.",
  },
  {
    title: "Account Responsibilities",
    intro: "You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized access.",
    list: [
      <>You must provide accurate registration details.</>,
      <>You may not share or sell your account credentials to third parties.</>,
      <>You are responsible for keeping independent backups of all uploaded files.</>,
    ],
  },
  {
    title: "Acceptable Use Policy",
    intro: "You agree not to use the platform for any unlawful, prohibited, or harmful activities. Prohibited activities include:",
    list: [
      <>Uploading, sharing, or storing content that infringes on copyright, trademark, or privacy rights.</>,
      <>Distributing malware, viruses, phishing payloads, or executable exploits.</>,
      <>Engaging in hotlinking, automated scraping, denial-of-service, or network disruption.</>,
    ],
  },
  {
    title: "User Indemnification & Liability Shield",
    intro: "You agree to indemnify, defend, and hold harmless OwnStorage, its software author, and its operators from and against any third-party claims, legal proceedings, damages, losses, or expenses (including reasonable attorney fees) arising out of content you upload, your platform usage, or your breach of this agreement.",
  },
];

const SAAS_SECTIONS = [
  {
    title: "Payments, Refunds and Data Responsibility",
    intro: "Paid subscriptions are provided by Subham Bachar, sole proprietor, trading as \"OwnStorage\". All payments for paid plans are final and non-refundable once confirmed: cancelling stops future renewal charges at the end of your prepaid period, but amounts already paid are never refunded or prorated, and we never issue refunds. Your data belongs to you and you are solely responsible for it. For accounts on the managed OwnStorage cloud service, files are stored on Backblaze B2 and Cloudflare R2 object storage. We are responsible for payments and billing, not for your data, and we are not liable for any loss of, or damage to, your data however caused. You agree to maintain your own backups of anything you cannot afford to lose.",
  },
  {
    title: "Dispute Resolution",
    intro: "Any disputes arising out of or related to this agreement shall be resolved through binding arbitration, in accordance with the rules of the governing jurisdiction, rather than in court.",
  },
];

const SELF_HOSTED_SECTIONS = [
  {
    title: "Open-Source & Self-Hosted Software Terms",
    intro: "This instance runs open-source software provided under the MIT License AS-IS, without warranty of any kind. The software author (Subham Bachar) is not responsible for hosting, storage costs, privacy compliance, or uptime on self-hosted instances. All server operations are the sole responsibility of your instance administrator.",
  },
];

export default function UserAgreement() {
  const sections = [
    ...UNIVERSAL_SECTIONS,
    ...(isSaaS ? SAAS_SECTIONS : SELF_HOSTED_SECTIONS),
  ];

  return (
    <LegalLayout
      title="User Agreement"
      lastUpdated="October 12, 2026"
      subtitle={
        isSelfHosted
          ? "Agreement outlining the rules for using this self-hosted instance of OwnStorage."
          : "This agreement outlines the rules you agree to when using the official OwnStorage cloud service."
      }
    >
      <div className="space-y-8">
        {sections.map((s, i) => (
          <LegalSection key={s.title} num={i + 1} title={s.title}>
            <p>{s.intro}</p>
            {s.list && (
              <ul className="list-disc pl-5 space-y-2 marker:text-blue-400 dark:marker:text-blue-500">
                {s.list.map((li, j) => (
                  <li key={j}>{li}</li>
                ))}
              </ul>
            )}
          </LegalSection>
        ))}
      </div>
    </LegalLayout>
  );
}

