import LegalLayout, { LegalSection } from "../components/layout/LegalLayout";
import { Icon } from "../components/ui/Icon";

const Q_AND_A = [
  {
    q: "What is OwnStorage and how do I use it?",
    a: "OwnStorage is a modern cloud storage platform for personal and professional file management. You agree to use the service only for lawful purposes and in accordance with applicable laws. You must not store, transmit, or share illegal, harmful, malicious, or infringing content."
  },
  {
    q: "Who is eligible to create an account (Age Limit)?",
    a: "You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to create an account and agree to these Terms. Accounts created by unauthorized minors will be terminated upon discovery."
  },
  {
    q: "Who is responsible for my account security?",
    a: "You are responsible for maintaining the confidentiality of your account credentials (including passwords, two-factor authentication tokens, and session keys) and for all activities occurring under your account. Notify us immediately if you suspect unauthorized access."
  },
  {
    q: "What is my legal liability for content I upload (User Indemnification)?",
    a: "You retain full ownership of all files you upload. You agree to indemnify, defend, and hold harmless OwnStorage, its developer, and its operators from and against any third-party claims, liabilities, losses, damages, or legal expenses arising out of your content, your misuse of the platform, or your violation of third-party intellectual property or privacy rights."
  },
  {
    q: "How does OwnStorage handle copyright infringement and DMCA notices?",
    a: "OwnStorage respects intellectual property rights and complies with safe harbor notice-and-takedown procedures. If you believe material hosted on our service infringes your copyright, send a detailed takedown notice to contact@thatsubhambachar.pro specifying the copyrighted work and the exact share URL. We respond promptly and terminate accounts of repeat infringers."
  },
  {
    q: "Can public share links be suspended or revoked?",
    a: "Yes. OwnStorage reserves the right to immediately block, disable, or revoke any public share link or file access without prior notice if it is found to host malware, illegal material, phishing payloads, copyright-infringing content, or causes excessive network load."
  },
  {
    q: "Are there any warranties provided with the software?",
    a: "OwnStorage is provided \"AS IS\" and \"AS AVAILABLE\" without warranties of any kind, express or implied. We do not guarantee uninterrupted, secure, or error-free operation. Under no circumstances is OwnStorage liable for data loss, data corruption, or server downtime. You are strictly responsible for maintaining independent backups of all critical data."
  },
  {
    q: "How are self-hosted deployments governed?",
    a: "This instance of OwnStorage is a self-hosted deployment running on infrastructure configured independently by your server operator. The software author (Subham Bachar) provides the open-source codebase under the MIT License AS-IS, and bears zero responsibility or liability for server operation, data storage, user management, or uptime on this self-hosted instance."
  }
];

export default function TermsPage() {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <LegalLayout
      title="Terms and Conditions"
      lastUpdated={today}
      subtitle="Terms governing the use of this self-hosted instance of OwnStorage, provided as open-source software under the MIT License."
    >
      <div className="space-y-8">
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 leading-relaxed flex items-start gap-3">
          <Icon name="info" size={18} className="shrink-0 text-amber-500 mt-0.5" />
          <div>
            <strong className="font-bold block mb-0.5">Self-Hosted Deployment Notice:</strong>
            This application is operating in self-hosted mode under an open-source AS-IS license. Storage infrastructure, user authentication, and data retention on this deployment are managed independently by your server administrator.
          </div>
        </div>

        {Q_AND_A.map((item, i) => (
          <LegalSection key={item.q} num={String(i + 1).padStart(2, "0")} title={item.q}>
            <p>{item.a}</p>
          </LegalSection>
        ))}
      </div>
    </LegalLayout>
  );
}