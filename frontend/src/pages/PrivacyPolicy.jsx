import LegalLayout, { LegalSection } from "../components/layout/LegalLayout";
import { isSaaS, isSelfHosted } from "../utils/appMode";
import { Icon } from "../components/ui/Icon";

const UNIVERSAL_SECTIONS = [
  {
    title: "Information We Collect",
    intro: "We collect minimal information necessary to deliver cloud storage functionality. This includes:",
    list: [
      <><strong>Account Details:</strong> Name, email address, password hash, and authentication metadata when you register or sign in via Google/GitHub OAuth.</>,
      <><strong>Files & Metadata:</strong> Files uploaded to your vault, file sizes, MIME types, directory structures, and public link parameters.</>,
      <><strong>System & Usage Telemetry:</strong> Bandwidth usage counters, active device sessions, IP timestamps, and error logs for platform security.</>,
    ],
  },
  {
    title: "How Information is Used",
    intro: "Collected data is used strictly to operate the storage service:",
    list: [
      <>To authenticate access and manage encryption key security.</>,
      <>To enforce storage quotas, bandwidth windows, and user agreement policies.</>,
      <>To process subscription transactions (on managed SaaS) and generate payment receipts.</>,
      <>To send transactional emails (OTP codes, password reset links, security alerts).</>,
    ],
  },
  {
    title: "Data Encryption & Security Architecture",
    intro: "Security is built into OwnStorage from the ground up:",
    list: [
      <>Data in transit is protected using TLS 1.3 / SSL encryption.</>,
      <>File access URLs are generated as cryptographically signed, short-lived presigned URLs to prevent unauthorized hotlinking.</>,
      <>Self-hosted deployments store data on storage infrastructure configured directly by your server administrator.</>,
    ],
  },
  {
    title: "Your Rights & Data Portability",
    intro: "You retain 100% ownership of your files. You can download, modify, or permanently delete your files at any time from your dashboard. Account deletion permanently purges active storage records, subject to standard automated cleanup cycles.",
  },
];

const SAAS_SECTIONS = [
  {
    title: "Cloud Infrastructure & Sub-Processors",
    intro: "For the official managed cloud instance, we utilize industry-standard sub-processors to process data securely:",
    list: [
      <><strong>Object Storage:</strong> Backblaze B2 & Cloudflare R2 (encrypted object storage at rest).</>,
      <><strong>Payment Gateway:</strong> Razorpay Software Private Limited (PCI-DSS compliant payment processing).</>,
      <><strong>Third-Party OAuth:</strong> Google Identity Services & GitHub OAuth (authentication & Google Drive import integration).</>,
    ],
  },
  {
    title: "Support & Grievance Redressal Desk",
    intro: "In accordance with the Indian Information Technology Act 2000 & Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules 2021, the contact details for support, privacy queries, and grievance redressal are provided below:",
    list: [
      <><strong>Support & Grievance Contact:</strong> Subham Bachar (Founder & Sole Proprietor, trading as "OwnStorage")</>,
      <><strong>Email Address:</strong> <a href="mailto:contact@thatsubhambachar.pro" className="text-blue-600 dark:text-blue-400 hover:underline">contact@thatsubhambachar.pro</a></>,
      <><strong>Location:</strong> West Bengal, India</>,
      <><strong>Resolution SLA:</strong> Acknowledgement within 24 hours; full resolution within 15 business days.</>,
    ],
  },
];

const SELF_HOSTED_SECTIONS = [
  {
    title: "Self-Hosted Instance Data Governance",
    intro: "On this self-hosted deployment of OwnStorage, all data collection, database records, and file storage are managed independently by your server operator. The software author (Subham Bachar) has no access to your data, files, or server credentials on self-hosted instances.",
  },
];

export default function PrivacyPolicy() {
  const sections = [
    ...UNIVERSAL_SECTIONS,
    ...(isSaaS ? SAAS_SECTIONS : SELF_HOSTED_SECTIONS),
  ];

  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="October 12, 2026"
      subtitle={
        isSelfHosted
          ? "Privacy guidelines for this self-hosted deployment of OwnStorage."
          : "Your privacy matters to us. Here's how the official OwnStorage cloud service collects, protects, and handles your information."
      }
    >
      <div className="space-y-8">
        {isSelfHosted && (
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 leading-relaxed flex items-start gap-3">
            <Icon name="info" size={18} className="shrink-0 text-blue-500 mt-0.5" />
            <div>
              <strong className="font-bold block mb-0.5">Self-Hosted Privacy Notice:</strong>
              Data on this server is processed locally by your self-hosted application instance. No personal data or uploaded files are transmitted to the open-source software author.
            </div>
          </div>
        )}

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

