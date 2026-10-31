export const metadata = {
  title: "Refund & Cancellation Policy | Mosan AI",
  description: "Refund and Cancellation Policy for Mosan AI",
};

export default function RefundCancellationPage() {
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
            Refund & Cancellation Policy
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            Last updated: October 11, 2026
          </p>
        </div>

        <div className="space-y-8 leading-7 text-slate-300">
          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              1. Overview
            </h2>

            <p>
              This Refund & Cancellation Policy explains the rules applicable
              to Mosan AI Pro subscriptions and payments.
            </p>

            <p className="mt-3">
              By purchasing a Mosan AI Pro subscription, you acknowledge that
              you have read and accepted this policy.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              2. Pro Subscription
            </h2>

            <p>
              The ₹1 Image Trial is a separate one-time purchase that provides
              image generation for 7 days, limited to 10 images per day and
              50 images in total. It does not activate or extend Pro access.
            </p>
            <p className="mt-3">
              Mosan AI Pro is a separate one-time payment of ₹199 for 30 days.
              Pro may be renewed manually for another 30-day period at ₹199.
            </p>
            <p className="mt-3">
              Payments do not automatically renew. Pro access expires at
              the end of the paid 30-day period unless the user manually
              makes another payment. Mosan AI will not automatically charge
              ₹199 for the next period.
            </p>
          </section>

                    <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              3. Cancellation and Expiry
            </h2>

            <p>
              Mosan AI Pro purchases are one-time payments and do not
              automatically renew. You do not need to cancel a recurring
              subscription to prevent future charges.
            </p>

            <p className="mt-3">
              You can use Pro until the end of your paid 30-day period.
              After that, Pro access expires unless you manually renew.
              Refund requests remain subject to this policy and applicable law.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              4. Refund Eligibility
            </h2>

            <p>
              Because Mosan AI Pro is a digital subscription service that
              provides access to software features, payments for a completed
              billing period are generally non-refundable once the service has
              been successfully activated.
            </p>

            <p className="mt-3">
              However, a refund may be considered in the following situations:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                A duplicate payment was charged for the same subscription.
              </li>
              <li>
                A payment was successfully charged but the Pro subscription
                was not activated due to a technical issue attributable to
                Mosan AI.
              </li>
              <li>
                A transaction was processed incorrectly and the issue cannot
                reasonably be resolved by correcting the subscription status.
              </li>
              <li>
                A refund is required under applicable law or by the applicable
                payment provider.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              5. Refund Request Period
            </h2>

            <p>
              Refund requests should normally be submitted within 7 days of
              the relevant payment.
            </p>

            <p className="mt-3">
              Requests submitted after this period may still be reviewed where
              required by applicable law or where exceptional circumstances
              justify review.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              6. How to Request a Refund
            </h2>

            <p>
              To request a refund, contact Mosan AI through our Contact page
              and provide:
            </p>

            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Your registered Mosan AI email address.</li>
              <li>The approximate date of payment.</li>
              <li>The payment or subscription reference, if available.</li>
              <li>A brief explanation of the refund request.</li>
            </ul>

            <p className="mt-3">
              Never send your UPI PIN, card PIN, CVV, password or other
              payment authentication credentials when requesting support.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              7. Refund Processing
            </h2>

            <p>
              If a refund is approved, we will initiate the refund through the
              applicable payment processing system.
            </p>

            <p className="mt-3">
              The time required for the refunded amount to appear in your
              account may depend on the payment provider, bank or payment
              method used for the original transaction.
            </p>

            <p className="mt-3">
              Where applicable, refunds will generally be made to the original
              payment method.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              8. Failed or Interrupted Payments
            </h2>

            <p>
              If your account is debited but the Mosan AI Pro subscription is
              not activated, please contact us with the transaction details.
            </p>

            <p className="mt-3">
              We will verify the transaction and, where appropriate, activate
              the subscription or process a refund according to the applicable
              payment status.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              9. Changes to This Policy
            </h2>

            <p>
              We may update this Refund & Cancellation Policy from time to
              time. The latest version will be published on this page with an
              updated date.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-2xl font-semibold text-white">
              10. Contact
            </h2>

            <p>
              For refund or cancellation questions, please contact Mosan AI
              using the contact details provided on our Contact page.
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-6 text-sm text-slate-500">
          © 2026 Mosan AI. All rights reserved.
        </div>
      </div>
    </main>
  );
}