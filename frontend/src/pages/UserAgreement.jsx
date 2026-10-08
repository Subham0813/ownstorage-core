import LegalLayout, { LegalSection } from "../components/layout/LegalLayout";

const SECTIONS = [
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
  {
    title: "Open-Source & Self-Hosted Software Terms",
    intro: "This instance runs open-source software provided under the MIT License AS-IS, without warranty of any kind. The software author (Subham Bachar) is not responsible for hosting, storage costs, privacy compliance, or uptime on self-hosted instances. All server operations are the sole responsibility of your instance administrator.",
  },
];

export default function UserAgreement() {
  return (
    <LegalLayout
      title="User Agreement"
      lastUpdated="October 12, 2026"
      subtitle="Agreement outlining the rules for using this self-hosted instance of OwnStorage."
    >
      <div className="space-y-8">
        {SECTIONS.map((s, i) => (
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