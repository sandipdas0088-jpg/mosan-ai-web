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
              For account, subscription, payment, technical or general
              questions, please contact us using the information below.
            </p>

            <div className="mt-6 space-y-4 text-sm">
              <div>
                <p className="text-slate-500">Email</p>

                {/* IMPORTANT:
                    Replace the email below with your REAL support email
                    before submitting your website to Razorpay.
                */}
                <a
                  href="mailto:YOUR-REAL-SUPPORT-EMAIL@example.com"
                  className="break-all text-cyan-400 hover:text-cyan-300"
                >
                  YOUR-REAL-SUPPORT-EMAIL@example.com
                </a>
              </div>

              <div>
                <p className="text-slate-500">Phone</p>

                {/* IMPORTANT:
                    Replace this with your REAL support phone number.
                */}
                <p className="text-slate-200">
                  YOUR-REAL-SUPPORT-PHONE
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold text-white">
              Business Information
            </h2>

            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="text-slate-500">Service</p>
                <p className="text-slate-200">Mosan AI</p>
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

                {/* IMPORTANT:
                    Replace this with your REAL business/communication
                    address before submitting to Razorpay.
                */}
                <p className="text-slate-200">
                  YOUR-REAL-BUSINESS-ADDRESS
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
              <h3 className="font-medium text-white">Account & Login</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Contact us if you have problems creating, accessing or
                managing your Mosan AI account.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <h3 className="font-medium text-white">Subscription & Payment</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Contact us regarding Pro subscription activation, payment
                issues, duplicate payments or cancellation requests.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <h3 className="font-medium text-white">Technical Support</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Report technical problems affecting the Mosan AI service.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <h3 className="font-medium text-white">Privacy Requests</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Contact us regarding privacy, personal information or account
                data requests.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-cyan-900/50 bg-cyan-950/20 p-6">
          <h2 className="text-xl font-semibold text-white">
            Important Security Notice
          </h2>

          <p className="mt-3 leading-7 text-slate-300">
            Mosan AI support will never ask you for your UPI PIN, card PIN,
            CVV, banking password, OTP or other payment authentication
            credentials. Never share such information with anyone.
          </p>
        </section>

        <div className="mt-12 border-t border-slate-800 pt-6 text-sm text-slate-500">
          © 2026 Mosan AI. All rights reserved.
        </div>
      </div>
    </main>
  );
}