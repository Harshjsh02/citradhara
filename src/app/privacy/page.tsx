import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { ShieldCheck, ArrowLeft, ExternalLink } from "lucide-react";

export const metadata = {
  title: "Privacy Policy - Citradhara",
  description: "Privacy Policy and Data Protection practices for Citradhara.",
};

export default function PrivacyPolicyPage() {
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
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Privacy Policy</h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Last updated: September 5, 2026 • Citradhara
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1f2230] bg-[#10121a] p-6 sm:p-8 space-y-8 text-sm leading-relaxed text-zinc-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Introduction</h2>
            <p>
              Welcome to <strong>Citradhara</strong> (accessible from{" "}
              <a href="https://citradhara.vercel.app" className="text-amber-400 underline">
                https://citradhara.vercel.app
              </a>
              ). Citradhara is a distraction-free, mindful video streaming and curation platform. We respect your privacy and are committed to protecting your personal data.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Information We Collect</h2>
            <p>We only collect the minimum amount of data required to provide our service:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li>
                <strong className="text-zinc-200">Google Account Profile:</strong> When you choose to sign in with Google, we receive your basic public profile information (name, email address, and profile picture avatar) provided by Google Identity.
              </li>
              <li>
                <strong className="text-zinc-200">YouTube Subscriptions (Optional):</strong> If you explicitly grant read-only permission, Citradhara accesses your subscribed YouTube channels solely to display your personalized feed without algorithmic recommendations. We do not modify, post, or delete any data on your YouTube channel.
              </li>
              <li>
                <strong className="text-zinc-200">Local Watch Preferences:</strong> Your watch history, liked videos, and watch later lists are stored primarily in your browser&apos;s local storage for your convenience.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
              <li>To authenticate you and keep you signed in to Citradhara.</li>
              <li>To allow you to comment in Citradhara community discussions.</li>
              <li>To curate and display your video feed based on your preferred productivity categories.</li>
              <li>We <strong>never sell, rent, or monetize</strong> your personal information or viewing data with third-party advertisers.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. YouTube API Services Compliance</h2>
            <p>
              Citradhara utilizes YouTube API Services to retrieve public video content, comments, and channels. By using Citradhara, you agree to be bound by the:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#272a3b] bg-[#141624] px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-amber-500/50 transition"
              >
                <span>YouTube Terms of Service</span>
                <ExternalLink className="h-3 w-3 text-amber-400" />
              </a>
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#272a3b] bg-[#141624] px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-amber-500/50 transition"
              >
                <span>Google Privacy Policy</span>
                <ExternalLink className="h-3 w-3 text-amber-400" />
              </a>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Revoking Access & Data Deletion</h2>
            <p>
              You can revoke Citradhara&apos;s access to your Google account data at any time via the{" "}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 underline font-medium"
              >
                Google Security Settings page
              </a>
              .
            </p>
            <p>
              If you wish to delete your Citradhara user account and associated comments from our database, please contact us at{" "}
              <strong className="text-white">harshjoshi041104@gmail.com</strong>, and we will fulfill your request promptly.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Contact Us</h2>
            <p>
              If you have any questions or suggestions regarding this Privacy Policy, feel free to reach out to the developer at:
            </p>
            <p className="font-semibold text-white">
              Harsh Joshi •{" "}
              <a href="mailto:harshjoshi041104@gmail.com" className="text-amber-400 hover:underline">
                harshjoshi041104@gmail.com
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
