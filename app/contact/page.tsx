export const metadata = {
  title: "Contact Us | Mosan AI",
  description: "Contact Mosan AI support",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8">
        <div className="mb-10">
          <a
            href="/"
            className="text-sm text-cyan-400 transition hover:text-cyan-300"
          >
            ← Back to Mosan AI
          </a>

          <h1 className="mt-6 text-4xl font-bold tracking-tight">
            Contact Us
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            We are here to help with Mosan AI.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">
              Customer Support
            </h2>

            <p className="mt-3 leading-7 text-slate-300">
              If you have questions about your account, subscription,
              payment, AI prompt generation, or any technical issue,
              please contact our support team.
            </p>

            <div className="mt-6">
              <p className="text-sm text-slate-500">
                Support Email
              </p>

              <a
                href="mailto:mosan.contact@gmail.com"
                className="mt-2 inline-block text-cyan-400 hover:text-cyan-300"
              >
                mosan.contact@gmail.com
              </a>
            </div>

            <div className="mt-5">
              <p className="text-sm text-slate-500">
                Support Phone
              </p>

              <a
                href="tel:+919064405103"
                className="mt-2 inline-block text-cyan-400 hover:text-cyan-300"
              >
                +91 90644 05103
              </a>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">
              Mosan AI
            </h2>

            <div className="mt-5 space-y-5 text-sm">
              <div>
                <p className="text-slate-500">Service</p>

                <p className="text-slate-200">
                  AI Prompt Generator
                </p>
              </div>

              <div>
                <p className="text-slate-500">Website</p>

                <a
                  href="https://mosan-ai-web.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-cyan-400 hover:text-cyan-300"
                >
                  https://mosan-ai-web.vercel.app/
                </a>
              </div>

              <div>
                <p className="text-slate-500">Business Address</p>

                <p className="mt-2 leading-6 text-slate-200">
                  RAMPURHAT, BIRBHUM
                  <br />
                  PIN - 731224
                  <br />
                  WEST BENGAL, INDIA
                </p>
              </div>

              <div>
                <p className="text-slate-500">Service Type</p>

                <p className="text-slate-200">
                  Digital AI-powered software service
                </p>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold text-white">
            Support Topics
          </h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <h3 className="font-medium text-white">
                Account & Login
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Contact support if you have problems creating, accessing,
                or managing your Mosan AI account.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <h3 className="font-medium text-white">
                Subscription & Payment
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Contact support regarding Pro subscription activation,
                payment issues, duplicate payments, or cancellation
                requests.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <h3 className="font-medium text-white">
                Technical Support
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Report technical problems affecting the Mosan AI service.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <h3 className="font-medium text-white">
                Privacy Requests
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Contact support regarding privacy, personal information,
                or account data requests.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-cyan-900/50 bg-cyan-950/20 p-6">
          <h2 className="text-xl font-semibold text-white">
            Payment & Security
          </h2>

          <p className="mt-3 leading-7 text-slate-300">
            Mosan AI will never ask you to provide your UPI PIN, card PIN,
            CVV, banking password, OTP, or other payment authentication
            credentials through customer support.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold text-white">
            Policies
          </h2>

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <a
              href="/privacy-policy"
              className="text-cyan-400 hover:text-cyan-300"
            >
              Privacy Policy
            </a>

            <a
              href="/terms"
              className="text-cyan-400 hover:text-cyan-300"
            >
              Terms & Conditions
            </a>

            <a
              href="/refund-cancellation"
              className="text-cyan-400 hover:text-cyan-300"
            >
              Refund & Cancellation Policy
            </a>
          </div>
        </section>

        <div className="mt-12 border-t border-slate-800 pt-6 text-sm text-slate-500">
          © 2026 Mosan AI. All rights reserved.
        </div>
      </div>
    </main>
  );
}