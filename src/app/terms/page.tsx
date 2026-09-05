import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { FileText, ArrowLeft, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Terms of Service - Citradhara",
  description: "Terms and conditions of using Citradhara.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#090a0f] text-[#f3f4f6]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-amber-400 transition mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Terms of Service</h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Last updated: September 5, 2026 • Citradhara
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1f2230] bg-[#10121a] p-6 sm:p-8 space-y-8 text-sm leading-relaxed text-zinc-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Agreement to Terms</h2>
            <p>
              By accessing or using <strong>Citradhara</strong> (accessible at{" "}
              <a href="https://citradhara.vercel.app" className="text-amber-400 underline">
                https://citradhara.vercel.app
              </a>
              ), you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Use of Service</h2>
            <p>
              Citradhara is a client application providing a distraction-free, mindful viewer for educational, creative, and productive video content. You agree not to misuse our service, attempt unauthorized access, or disrupt the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Third-Party Content & YouTube API</h2>
            <p>
              Citradhara connects to YouTube API Services. Video content displayed via embedded players belongs to their respective content creators and copyright holders. By using Citradhara, you also acknowledge and agree to comply with the{" "}
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 underline"
              >
                YouTube Terms of Service
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. User Accounts and Contributions</h2>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials and for any comments or interactions posted from your account. Offensive, abusive, or spam comments are prohibited and may result in account termination.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Disclaimer & Limitation of Liability</h2>
            <p>
              Citradhara is provided &quot;as is&quot; without warranties of any kind. We do not guarantee uninterrupted availability and are not liable for any damages arising out of your use of the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Contact Information</h2>
            <p>
              For any questions regarding these Terms, please contact Harsh Joshi at{" "}
              <a href="mailto:harshjoshi041104@gmail.com" className="text-amber-400 hover:underline">
                harshjoshi041104@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
