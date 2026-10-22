"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import AuthModal from "./components/AuthModal";
import { supabase } from "./lib/supabase";

interface GeneratedResult {
  success: boolean;
  message?: string;
  prompt?: string;
}
interface PromptHistory {
  id: string;
  idea: string;
  generated_prompt: string;
  content_type: string | null;
  style: string | null;
  language: string | null;
  prompt_length: string | null;
  created_at: string;
}

export default function Home() {
  // =========================================================
  // USER AUTHENTICATION STATE
  // =========================================================

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  // =========================================================
// SUBSCRIPTION STATE
// =========================================================

const [subscriptionPlan, setSubscriptionPlan] = useState("free");
const [subscriptionStatus, setSubscriptionStatus] = useState("inactive");
const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);
const [hasSubscriptionRecord, setHasSubscriptionRecord] = useState(false);
const [subscriptionChecked, setSubscriptionChecked] = useState(false);

const isProActive =
  subscriptionPlan === "pro" &&
  subscriptionStatus === "active" &&
  !!subscriptionExpiry &&
  new Date(subscriptionExpiry).getTime() > Date.now();

  // =========================================================
  // PROMPT GENERATOR STATE
  // =========================================================

  const [idea, setIdea] = useState("");
  const [contentType, setContentType] = useState("Image");
  const [style, setStyle] = useState("Cinematic");
  const [language, setLanguage] = useState("English");
  const [promptLength, setPromptLength] = useState("Detailed");

  // =========================================================
  // GENERATED RESULT STATE
  // =========================================================

  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [promptHistory, setPromptHistory] = useState<PromptHistory[]>([]);
const [showHistory, setShowHistory] = useState(false);

  // IMAGE GENERATION STATE
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [imagesRemaining, setImagesRemaining] = useState<number | null>(null);
  const [trialPaymentLoading, setTrialPaymentLoading] = useState(false);
const [trialImagesRemainingToday, setTrialImagesRemainingToday] = useState<number | null>(null);
const [trialImagesRemainingTotal, setTrialImagesRemainingTotal] = useState<number | null>(null);

const [historyLoading, setHistoryLoading] = useState(false);

  // =========================================================
  // CHECK CURRENT SUPABASE USER
  // =========================================================

  useEffect(() => {
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
// =========================================================
// BUY ₹1 IMAGE TRIAL — 7 DAYS, NO AUTO RENEWAL
// =========================================================

const buyImageTrial = async () => {
  if (!userEmail) {
    setShowAuthModal(true);
    return;
  }

  setTrialPaymentLoading(true);
  setImageError("");

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setShowAuthModal(true);
      throw new Error("Please log in again.");
    }

    // CREATE ₹1 TRIAL ORDER
    const orderResponse = await fetch(
      "https://mosan-ai-backend.onrender.com/api/create-image-trial-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    const orderData = await orderResponse.json();

    if (!orderResponse.ok || !orderData.success) {
      throw new Error(
        orderData.message || "Could not create Image Trial order."
      );
    }

    // LOAD RAZORPAY CHECKOUT
    if (!(window as any).Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const existingScript = document.querySelector(
          'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        ) as HTMLScriptElement | null;

        if (existingScript) {
          existingScript.addEventListener("load", () => resolve(), { once: true });
          existingScript.addEventListener("error", () => reject(new Error("Razorpay failed to load.")), { once: true });

          if ((window as any).Razorpay) resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Razorpay failed to load."));
        document.body.appendChild(script);
      });
    }

    if (!(window as any).Razorpay) {
      throw new Error("Razorpay Checkout is unavailable. Please refresh.");
    }

    const razorpay = new (window as any).Razorpay({
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.order_id,
      name: "Mosan AI",
      description: "₹1 Image Trial — 7 Days, Up to 50 Images",
      prefill: {
        email: session.user.email || userEmail,
      },
      notes: {
        product: "Mosan AI Image Trial",
        payment_type: "image_trial",
      },
      theme: {
        color: "#9333ea",
      },

      handler: async (paymentResponse: any) => {
        try {
          const {
            data: { session: currentSession },
          } = await supabase.auth.getSession();

          if (!currentSession?.access_token) {
            throw new Error("Please log in again to verify payment.");
          }

          const verifyResponse = await fetch(
            "https://mosan-ai-backend.onrender.com/api/verify-image-trial-payment",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${currentSession.access_token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            }
          );

          const verifyData = await verifyResponse.json();

          if (!verifyResponse.ok || !verifyData.success) {
            throw new Error(
              verifyData.message ||
                "Payment verification failed. Please contact support."
            );
          }

          alert(
            "Image Trial activated! You can generate up to 10 images per day, with a maximum of 50 images over 7 days."
          );

          window.location.reload();
        } catch (err) {
          setImageError(
            err instanceof Error
              ? err.message
              : "Payment verification failed. Please contact support."
          );
        } finally {
          setTrialPaymentLoading(false);
        }
      },
    });

    razorpay.on("payment.failed", (response: any) => {
      setImageError(
        response?.error?.description || "Payment failed. Please try again."
      );
      setTrialPaymentLoading(false);
    });

    razorpay.open();
  } catch (err) {
    setImageError(
      err instanceof Error
        ? err.message
        : "Could not start Image Trial payment."
    );
    setTrialPaymentLoading(false);
  }
};
  // GENERATE IMAGE (PRO ONLY, 30 PER MONTH)
  const generateImage = async () => {
    if (!userEmail) {
      setShowAuthModal(true);
      return;
    }

    

    if (!imagePrompt.trim()) {
      setImageError("Please enter an image description.");
      return;
    }

    setImageLoading(true);
    setImageError("");
    setGeneratedImage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setShowAuthModal(true);
        throw new Error("Please log in again.");
      }

      const response = await fetch(
        "https://mosan-ai-backend.onrender.com/api/generate-image",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ prompt: imagePrompt.trim() }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Image generation failed.");
      }

      setGeneratedImage(data.image);
      setImagesRemaining(data.images_remaining ?? null);
setTrialImagesRemainingToday(data.images_remaining_today ?? null);
setTrialImagesRemainingTotal(data.images_remaining_total ?? null);
    } catch (err) {
      setImageError(
        err instanceof Error ? err.message : "Image generation failed."
      );
    } finally {
      setImageLoading(false);
    }
  };

  // =========================================================
  // GET CURRENT USER
  // =========================================================

 const checkUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) {
    setUserEmail(user.email);

    // -------------------------------------------------------
    // CHECK USER SUBSCRIPTION
    // -------------------------------------------------------

    const { data: subscription, error } = await supabase
      .from("subscriptions")
            .select("plan, status, expires_at")
      .eq("user_id", user.id)
      .eq("plan", "pro")
      .eq("status", "active")
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Subscription check error:", error);

      setSubscriptionPlan("free");
      setSubscriptionStatus("inactive");

      return;
    }

    if (subscription) {
      setSubscriptionPlan(subscription.plan || "free");
      setSubscriptionStatus(subscription.status || "inactive");
      setSubscriptionExpiry(subscription.expires_at || null);
      setHasSubscriptionRecord(true);
    } else {
      setSubscriptionPlan("free");
      setSubscriptionStatus("inactive");
      setSubscriptionExpiry(null);
      setHasSubscriptionRecord(false);
    }

    setSubscriptionChecked(true);
  } else {
    setUserEmail(null);
    setSubscriptionPlan("free");
    setSubscriptionStatus("inactive");
  }
};

  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return;
    }

    setUserEmail(null);
    setGeneratedPrompt("");
    setError("");
  };

  // =========================================================
  // CONNECT TO PYTHON BACKEND
  // =========================================================
const handleUpgrade = async () => {
  if (!userEmail) {
    setShowAuthModal(true);
    return;
  }

  try {
    // =========================================================
    // GET CURRENT SUPABASE USER
    // =========================================================

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      alert("Please login again before upgrading to Pro.");
      return;
    }

    // =========================================================
    // CREATE ONE-TIME PRO ORDER
    // FIRST PURCHASE = ₹1
    // RENEWAL = ₹199
    // NO AUTOMATIC RECURRING PAYMENT
    // =========================================================

    const response = await fetch(
      "https://mosan-ai-backend.onrender.com/api/create-pro-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
        }),
      }
    );

    const data = await response.json();

    console.log("CREATE PRO ORDER RESPONSE:", data);

    if (!response.ok || !data.success) {
      alert(
        data.message ||
          "Could not create the Pro payment order."
      );
      return;
    }

    // =========================================================
    // LOAD RAZORPAY CHECKOUT
    // =========================================================

    if (!(window as any).Razorpay) {
      const script = document.createElement("script");

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.async = true;

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();

        script.onerror = () =>
          reject(
            new Error(
              "Razorpay Checkout failed to load."
            )
          );

        document.body.appendChild(script);
      });
    }

    if (!(window as any).Razorpay) {
      alert(
        "Razorpay Checkout is not loaded. Please refresh the page."
      );
      return;
    }

    // =========================================================
    // PAYMENT TYPE
    // =========================================================

    const isLaunchOffer =
      data.payment_type === "launch";

    const description = isLaunchOffer
      ? "Mosan AI Pro - ₹1 Launch Offer (30 Days)"
      : "Mosan AI Pro - ₹199 Manual Renewal (30 Days)";

    // =========================================================
    // RAZORPAY CHECKOUT OPTIONS
    // =========================================================

    const options = {
      key: data.key_id,

      amount: data.amount,

      currency: data.currency,

      order_id: data.order_id,

      name: "Mosan AI",

      description: description,

      prefill: {
        email: user.email || userEmail,
      },

      notes: {
        product: "Mosan AI Pro",
        payment_type: data.payment_type,
      },

      theme: {
        color: "#06b6d4",
      },

      handler: async function (paymentResponse: any) {
        try {
          // =====================================================
          // VERIFY ONE-TIME PAYMENT ON BACKEND
          // =====================================================

          const verifyResponse = await fetch(
            "https://mosan-ai-backend.onrender.com/api/verify-pro-payment",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                razorpay_payment_id:
                  paymentResponse.razorpay_payment_id,

                razorpay_order_id:
                  paymentResponse.razorpay_order_id,

                razorpay_signature:
                  paymentResponse.razorpay_signature,

                user_id: user.id,
              }),
            }
          );

          const verifyData =
            await verifyResponse.json();

          console.log(
            "VERIFY PRO PAYMENT RESPONSE:",
            verifyData
          );

          // =====================================================
          // SUCCESS
          // =====================================================

          if (
            verifyResponse.ok &&
            verifyData.success
          ) {
            alert(
              isLaunchOffer
                ? "🎉 Pro activated successfully for 30 days!"
                : "🎉 Pro renewed successfully for another 30 days!"
            );

            window.location.reload();
            return;
          }

          // =====================================================
          // VERIFICATION FAILED
          // =====================================================

          alert(
            verifyData.message ||
              "Payment successful, but Pro activation failed. Please contact support."
          );
        } catch (error) {
          console.error(
            "Pro payment verification error:",
            error
          );

          alert(
            "Payment successful, but Pro activation failed. Please contact support."
          );
        }
      },
    };

    // =========================================================
    // OPEN RAZORPAY CHECKOUT
    // =========================================================

    const razorpay =
      new (window as any).Razorpay(options);

    razorpay.on(
      "payment.failed",
      function (response: any) {
        console.error(
          "Razorpay payment failed:",
          response
        );

        alert(
          response?.error?.description ||
            "Payment failed. Please try again."
        );
      }
    );

    razorpay.open();
  } catch (error) {
    console.error(
      "Upgrade error:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Could not connect to the payment server. Please try again."
    );
  }
};
  const generatePrompt = async () => {
    // ---------------------------------------------------------
    // LOGIN REQUIRED
    // ---------------------------------------------------------

    if (!userEmail) {
      setShowAuthModal(true);
      return;
    }

    // ---------------------------------------------------------
    // IDEA VALIDATION
    // ---------------------------------------------------------

    if (!idea.trim()) {
      setError("Please enter your idea first.");
      return;
    }
    // ---------------------------------------------------------
// CHECK PRO / FREE PLAN
// ---------------------------------------------------------

// ---------------------------------------------------------
// CHECK PRO / FREE PLAN + EXPIRY
// ---------------------------------------------------------

let isProUser = false;

try {
  const currentUser = await supabase.auth.getUser();
  const currentUserId = currentUser.data.user?.id;

  if (!currentUserId) {
    setError("User session not found. Please login again.");
    return;
  }

  const { data: subscription, error: subscriptionError } =
    await supabase
      .from("subscriptions")
      .select("status, plan, expires_at, auto_renew")
      .eq("user_id", currentUserId)
      .maybeSingle();

  if (subscriptionError) {
    console.error(
      "Subscription check error:",
      subscriptionError
    );
  } else {
    // -------------------------------------------------------
    // PRO IS ACTIVE ONLY WHEN:
    // 1. status = active
    // 2. plan = pro
    // 3. expires_at is either missing (old record)
    //    OR expires_at is still in the future
    // -------------------------------------------------------

    if (
      subscription?.status === "active" &&
      subscription?.plan === "pro"
    ) {
      if (subscription.expires_at) {
        const expiryTime = new Date(
          subscription.expires_at
        ).getTime();

        const currentTime = Date.now();

        isProUser = expiryTime > currentTime;
      } else {
        // Existing old Pro account without expiry date
        isProUser = false;
      }
    }
  }

  // -------------------------------------------------------
  // EXPIRED PRO USER
  // -------------------------------------------------------

  if (
    subscription?.status === "active" &&
    subscription?.plan === "pro" &&
    subscription?.expires_at
  ) {
    const expiryTime = new Date(
      subscription.expires_at
    ).getTime();

    if (expiryTime <= Date.now()) {
      console.log(
        "Mosan AI Pro subscription has expired."
      );

      isProUser = false;
    }
  }

  // -------------------------------------------------------
  // FREE USER → CHECK 3 DAILY GENERATIONS
  // -------------------------------------------------------

  if (!isProUser) {
    const { data, error: usageError } =
      await supabase.rpc("use_free_generation");

    if (usageError) {
      console.error(
        "Generation limit error:",
        usageError
      );

      setError(
        "Could not check your daily generation limit."
      );

      return;
    }

    if (!data?.allowed) {
      setError(
        "You have reached your 3 free prompt generations for today. Please try again tomorrow."
      );

      return;
    }
  }

  // -------------------------------------------------------
  // PRO USER → NO DAILY LIMIT
  // -------------------------------------------------------

  if (isProUser) {
    console.log(
      "Mosan AI Pro user detected — unlimited generation enabled."
    );
  }

} catch (error) {
  console.error(
    "Subscription / generation check failed:",
    error
  );

  setError(
    "Could not check your subscription status."
  );

  return;
}    // ---------------------------------------------------------
    // START LOADING
    // ---------------------------------------------------------

    setLoading(true);
    setError("");
    setGeneratedPrompt("");

    try {
      // -------------------------------------------------------
      // SEND REQUEST TO PYTHON FASTAPI BACKEND
      // -------------------------------------------------------

      const response = await fetch(
        "https://mosan-ai-backend.onrender.com/api/test-generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
  idea: idea,
  content_type: contentType,
  style: style,
  language: language,
  prompt_length: promptLength,
  user_id: (await supabase.auth.getUser()).data.user?.id,
}),
        }
      );

      // -------------------------------------------------------
      // CHECK BACKEND RESPONSE
      // -------------------------------------------------------

      if (!response.ok) {
        throw new Error("Backend request failed.");
      }

      // -------------------------------------------------------
      // CONVERT RESPONSE TO JSON
      // -------------------------------------------------------

      const data: GeneratedResult = await response.json();

      // -------------------------------------------------------
      // CHECK SUCCESS
      // -------------------------------------------------------

      if (!data.success) {
        setError(data.message || "Something went wrong.");
        return; 
      }

      // -------------------------------------------------------
      // SHOW GENERATED PROMPT
      // -------------------------------------------------------

      setGeneratedPrompt(data.prompt || "");
    } catch (err) {
      console.error(err);

      setError(
        "Backend connection failed. Please make sure the Python backend is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // COPY PROMPT
  // =========================================================

  const copyPrompt = async () => {
    if (!generatedPrompt) {
      return;
    }

    try {
      await navigator.clipboard.writeText(generatedPrompt);

      alert("Prompt copied successfully!");
    } catch {
      alert("Unable to copy prompt.");
    }
  };
    // =========================================================
  // SAVE PROMPT
  // =========================================================

  const savePrompt = async () => {
    if (!generatedPrompt) {
      setError("Please generate a prompt first.");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setShowAuthModal(true);
        return;
      }

      const { error } = await supabase
        .from("prompt_history")
        .insert({
          user_id: user.id,
          idea: idea,
          generated_prompt: generatedPrompt,
          content_type: contentType,
          style: style,
          language: language,
          prompt_length: promptLength,
        });

      if (error) {
  console.error("SAVE PROMPT ERROR");
  console.error("message:", error.message);
  console.error("details:", error.details);
  console.error("hint:", error.hint);
  console.error("code:", error.code);

  setError(
    `Save failed: ${error.message || error.details || "Unknown Supabase error"}`
  );

  return;
}

      setError("");
      alert("Prompt saved successfully!");
    } catch (error) {
      console.error("Save prompt error:", error);
      setError("Something went wrong while saving the prompt.");
    }
  };
  // =========================================================
// LOAD PROMPT HISTORY
// =========================================================

const loadPromptHistory = async () => {
  setHistoryLoading(true);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const { data, error } = await supabase
      .from("prompt_history")
      .select(
        "id, idea, generated_prompt, content_type, style, language, prompt_length, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("History load error:", error);
      setError("Could not load prompt history.");
      return;
    }

    setPromptHistory(data ?? []);
  } catch (error) {
    console.error("History load error:", error);
    setError("Something went wrong while loading history.");
  } finally {
    setHistoryLoading(false);
  }
};
// =========================================================
// DELETE PROMPT
// =========================================================

const deletePrompt = async (promptId: string) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this prompt?"
  );

  if (!confirmed) {
    return;
  }

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const { error } = await supabase
      .from("prompt_history")
      .delete()
      .eq("id", promptId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Delete prompt error:", error);
      setError("Could not delete this prompt.");
      return;
    }

    setPromptHistory((currentHistory) =>
      currentHistory.filter((item) => item.id !== promptId)
    );

    setError("");
  } catch (error) {
    console.error("Delete prompt error:", error);
    setError("Something went wrong while deleting the prompt.");
  }
};

  // =========================================================
  // CLEAR ALL
  // =========================================================

  const clearAll = () => {
    setIdea("");
    setGeneratedPrompt("");
    setError("");
  };

  // =========================================================
  // OPEN LOGIN
  // =========================================================

  const openLogin = () => {
    setShowAuthModal(true);
  };

  // =========================================================
  // CLOSE LOGIN
  // =========================================================

  const closeLogin = () => {
    setShowAuthModal(false);
  };

  // =========================================================
  // AFTER LOGIN / SIGNUP
  // =========================================================

  const handleAuthSuccess = async () => {
    await checkUser();
  };

  // =========================================================
  // PAGE UI
  // =========================================================

  return (
    <main className="min-h-screen bg-[#050816] text-white">
            <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Mosan AI",
            alternateName: "Mosan AI Prompt Generator",
            url: "https://mosan-ai-web.vercel.app/",
          }),
        }}
      />
      {showHistory && (
  <section className="mx-auto max-w-7xl px-6 py-10">

    <div className="mb-8 flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-bold">
          Prompt History
        </h2>

        <p className="mt-2 text-sm text-gray-400">
          Your saved AI prompts
        </p>
      </div>

      <button
        onClick={() => setShowHistory(false)}
        className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
      >
        Back to Generator
      </button>
    </div>

    {historyLoading ? (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-gray-400">
        Loading history...
      </div>
    ) : promptHistory.length === 0 ? (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
        <div className="mb-4 text-5xl">📝</div>

        <h3 className="text-lg font-semibold text-gray-300">
          No saved prompts yet
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          Generate and save your first AI prompt.
        </p>
      </div>
    ) : (
      <div className="space-y-4">
        {promptHistory.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">
                  {new Date(item.created_at).toLocaleString()}
                </p>

                <h3 className="mt-2 font-semibold text-white">
                  {item.idea}
                </h3>
                <button
  onClick={() => deletePrompt(item.id)}
  className="mt-3 rounded-lg border border-red-400/20 px-3 py-1.5 text-xs text-red-300 transition hover:bg-red-400/10"
>
  Delete
</button>
              </div>

              <span className="rounded-lg border border-white/10 px-3 py-1 text-xs text-gray-400">
                {item.content_type || "Prompt"}
              </span>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-300">
              {item.generated_prompt}
            </p>
          </div>
        ))}
      </div>
    )}
  </section>
)}

      {/* =====================================================
          NAVBAR
      ====================================================== */}

      <nav className="border-b border-white/10 bg-[#050816]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          {/* BRAND */}

          <div className="text-2xl font-bold tracking-tight">
            <span className="text-cyan-400">Mosan</span> AI
          </div>

          {/* DESKTOP NAVIGATION */}

          <div className="hidden items-center gap-8 md:flex">

            <a
              href="#generator"
              className="text-sm text-gray-300 transition hover:text-white"
            >
              Generator
            </a>

            <a
              href="#features"
              className="text-sm text-gray-300 transition hover:text-white"
            >
              Features
            </a>

            <a
              href="#pricing"
              className="text-sm text-gray-300 transition hover:text-white"
            >
              Pricing
            </a>
            <button
  onClick={() => {
    if (!userEmail) {
      setShowAuthModal(true);
      return;
    }

    setShowHistory(true);
    loadPromptHistory();
  }}
  className="text-sm text-gray-300 transition hover:text-white"
>
  History
</button>

          </div>

          {/* AUTH AREA */}

          {!userEmail ? (
            <button
              onClick={openLogin}
              className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium transition hover:bg-white/10"
            >
              Login / Sign Up
            </button>
          ) : (
            <div className="flex items-center gap-3">

              <div className="hidden max-w-[220px] text-right sm:block">
                <p className="truncate text-sm text-gray-300">
                  {userEmail}
                </p>

                <p
  className={`text-xs ${
    subscriptionPlan === "pro" && subscriptionStatus === "active"
      ? "text-green-400"
      : "text-cyan-400"
  }`}
>
  {subscriptionPlan === "pro" && subscriptionStatus === "active"
    ? "Pro Plan"
    : "Free Plan"}
</p>
              </div>

              <button
                onClick={handleLogout}
                className="rounded-xl border border-red-400/20 px-5 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-400/10"
              >
                Logout
              </button>

            </div>
          )}

        </div>
      </nav>

      {/* =====================================================
          HERO SECTION
      ====================================================== */}

      <section className="px-6 pb-16 pt-20 text-center">

        <div className="mx-auto max-w-4xl">

          <div className="mb-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-300">
            AI Prompt Generator
          </div>

          <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
            Create Better
            <span className="text-cyan-400"> AI Prompts </span>
            in Seconds
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-400">
            Turn your simple idea into a professional, detailed AI prompt
            using Mosan AI.
          </p>

          {/* HERO CTA */}

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">

            <a
              href="#generator"
              className="rounded-xl bg-cyan-500 px-6 py-3 font-bold text-black transition hover:bg-cyan-400"
            >
              Start Creating
            </a>

            {!userEmail && (
              <button
                onClick={openLogin}
                className="rounded-xl border border-white/10 px-6 py-3 font-medium text-gray-300 transition hover:bg-white/10"
              >
                Create Free Account
              </button>
            )}

          </div>

        </div>

      </section>

      {/* =====================================================
          GENERATOR SECTION
      ====================================================== */}

      <section
        id="generator"
        className="px-6 pb-20"
      >

        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">

          {/* =================================================
              LEFT SIDE
          ================================================== */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">

            <div className="mb-6">

              <h2 className="text-2xl font-bold">
                Prompt Generator
              </h2>

              <p className="mt-2 text-sm text-gray-400">
                Describe what you want to create.
              </p>

            </div>

            {/* IDEA */}

            <label className="mb-2 block text-sm font-medium text-gray-300">
              Your Idea
            </label>

            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Example: A futuristic Indian city at sunset..."
              className="h-36 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none transition placeholder:text-gray-600 focus:border-cyan-400/50"
            />

            {/* OPTIONS */}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              {/* CONTENT TYPE */}

              <div>

                <label className="mb-2 block text-sm text-gray-400">
                  Content Type
                </label>

                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-white outline-none"
                >
                  <option>Image</option>
                  <option>Video</option>
                  <option>Text</option>
                  <option>Story</option>
                  <option>Advertisement</option>
                  <option>Social Media</option>
                </select>

              </div>

              {/* STYLE */}

              <div>

                <label className="mb-2 block text-sm text-gray-400">
                  Style
                </label>

                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-white outline-none"
                >
                  <option>Cinematic</option>
                  <option>Realistic</option>
                  <option>Professional</option>
                  <option>Creative</option>
                  <option>Minimal</option>
                  <option>Luxury</option>
                </select>

              </div>

              {/* LANGUAGE */}

              <div>

                <label className="mb-2 block text-sm text-gray-400">
                  Language
                </label>

                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-white outline-none"
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Bengali</option>
                  <option>Hinglish</option>
                </select>

              </div>

              {/* PROMPT LENGTH */}

              <div>

                <label className="mb-2 block text-sm text-gray-400">
                  Prompt Length
                </label>

                <select
                  value={promptLength}
                  onChange={(e) => setPromptLength(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0b1020] px-4 py-3 text-white outline-none"
                >
                  <option>Short</option>
                  <option>Detailed</option>
                  <option>Very Detailed</option>
                </select>

              </div>

            </div>

            {/* FREE LIMIT */}

            <div className="mt-6 rounded-xl border border-cyan-400/10 bg-cyan-400/5 p-4">

              <div className="flex items-center justify-between">

                <span className="text-sm text-gray-400">
                  Free generations
                </span>

                <span className="font-semibold text-cyan-400">
                  3 / day
                </span>

              </div>

            </div>

            {/* LOGIN STATUS */}

            {!userEmail && (
              <div className="mt-4 rounded-xl border border-yellow-400/10 bg-yellow-400/5 p-4 text-sm text-yellow-300">
                Please login or create a free account before generating a
                prompt.
              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* BUTTONS */}

            <div className="mt-6 flex gap-3">

              <button
                onClick={generatePrompt}
                disabled={loading}
                className="flex-1 rounded-xl bg-cyan-500 px-6 py-3.5 font-bold text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate Prompt"}
              </button>

              <button
                onClick={clearAll}
                className="rounded-xl border border-white/10 px-6 py-3.5 font-medium text-gray-300 transition hover:bg-white/10"
              >
                Clear
              </button>

            </div>

          </div>

          {/* =================================================
              RIGHT SIDE
          ================================================== */}

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">

            <div className="mb-6 flex items-center justify-between">

              <div>

                <h2 className="text-2xl font-bold">
                  Generated Prompt
                </h2>

                <p className="mt-2 text-sm text-gray-400">
                  Your AI-ready prompt will appear here.
                </p>

              </div>

              {generatedPrompt && (
                <button
                  onClick={copyPrompt}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
                >
                  Copy
                </button>
              )}
              {generatedPrompt && (
  <button
    onClick={savePrompt}
    className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
  >
    Save Prompt
  </button>
)}
              {generatedPrompt && (
  <button
    onClick={generatePrompt}
    className="rounded-xl border border-white/10 px-4 py-2 text-sm transition hover:bg-white/10"
  >
    Regenerate
  </button>
)}

            </div>

            <div className="min-h-[420px] rounded-2xl border border-white/10 bg-black/30 p-5">

              {generatedPrompt ? (

                <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-gray-200">
                  {generatedPrompt}
                </pre>

              ) : (

                <div className="flex min-h-[380px] items-center justify-center text-center">

                  <div>

                    <div className="mb-4 text-5xl">
                      ✨
                    </div>

                    <h3 className="text-lg font-semibold text-gray-300">
                      Your generated prompt will appear here
                    </h3>

                    <p className="mt-2 max-w-sm text-sm text-gray-500">
                      Enter an idea on the left and click Generate Prompt.
                    </p>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      </section>
      {/* MOSAN AI IMAGE GENERATOR */}
      <section
        id="image-generator"
        className="border-t border-white/10 px-6 py-16"
      >
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <h2 className="text-2xl font-bold">
            AI Image Generator
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Generate AI images with Pro or unlock a one-time 7-day Image Trial.
          </p>

          {!isProActive && (
  <div className="mt-4 rounded-xl border border-purple-400/20 bg-purple-400/5 p-4">
    <p className="text-sm text-purple-200">
      Try AI Image Generation for ₹1 — one-time payment, 7 days,
      up to 10 images per day and 50 images total. No automatic renewal.
    </p>

    <button
      type="button"
      onClick={buyImageTrial}
      disabled={trialPaymentLoading}
      className="mt-4 w-full rounded-xl bg-purple-600 px-5 py-3 font-bold text-white transition hover:bg-purple-500 disabled:opacity-50"
    >
      {trialPaymentLoading ? "Processing..." : "Unlock Image Trial — ₹1"}
    </button>
  </div>
)}

          <textarea
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
            placeholder="Describe the image you want to create..."
            className="mt-5 w-full rounded-xl border border-white/10 bg-[#050816] p-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={4}
            maxLength={2000}
          />

          <button
            type="button"
            onClick={generateImage}
            disabled={imageLoading}
            className="mt-4 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {imageLoading ? "Generating Image..." : "Generate Image"}
          </button>

         {imagesRemaining !== null && (
  <p className="mt-3 text-sm text-gray-400">
    Images remaining this month: {imagesRemaining}
  </p>
)}

{trialImagesRemainingToday !== null && (
  <p className="mt-3 text-sm text-gray-400">
    Trial images remaining today: {trialImagesRemainingToday}
  </p>
)}

{trialImagesRemainingTotal !== null && (
  <p className="mt-1 text-sm text-gray-400">
    Trial images remaining overall: {trialImagesRemainingTotal}
  </p>
)}

          {imageError && (
            <p className="mt-3 text-sm text-red-400">
              {imageError}
            </p>
          )}

          {generatedImage && (
            <div className="mt-6">
              <img
                src={generatedImage}
                alt="AI generated image"
                className="w-full rounded-xl border border-white/10"
              />

              <a
                href={generatedImage}
                download="mosan-ai-image.png"
                className="mt-4 inline-block rounded-xl border border-white/20 px-5 py-3 font-medium transition hover:bg-white/10"
              >
                Download Image
              </a>
            </div>
          )}
        </div>
      </section>
      {/* =====================================================
          FEATURES SECTION
      ====================================================== */}

      <section
        id="features"
        className="border-t border-white/10 px-6 py-20"
      >

        <div className="mx-auto max-w-7xl">

          <div className="mb-12 text-center">

            <h2 className="text-3xl font-bold">
              Why Mosan AI?
            </h2>

            <p className="mt-3 text-gray-400">
              Everything you need to create better AI prompts.
            </p>

          </div>

          <div className="grid gap-6 md:grid-cols-3">

            <FeatureCard
              icon="⚡"
              title="Fast Generation"
              description="Turn simple ideas into structured AI prompts quickly."
            />

            <FeatureCard
              icon="🎯"
              title="Better Results"
              description="Create clearer prompts with detailed instructions."
            />

            <FeatureCard
              icon="✍️"
              title="Creator Friendly"
              description="Create prompts for images, videos, stories, advertisements, and social media."
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          ADDITIONAL FEATURES
      ====================================================== */}

      <section className="px-6 pb-20">

        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-2 lg:grid-cols-4">

          <MiniFeature
            icon="🔐"
            title="Secure Account"
            description="Your Mosan AI account is protected with Supabase authentication."
          />

          <MiniFeature
            icon="☁️"
            title="Cloud Account"
            description="Your account can be used from different supported devices."
          />

          <MiniFeature
            icon="🚀"
            title="AI Ready"
            description="The website is connected to the Python backend architecture."
          />

          <MiniFeature
            icon="💳"
            title="Pro Plan"
description="Get 30 days of Pro access and renew manually at ₹199 when your plan expires."
          />

        </div>

      </section>

      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}

      <section className="border-t border-white/10 px-6 py-20">

        <div className="mx-auto max-w-6xl">

          <div className="mb-12 text-center">

            <h2 className="text-3xl font-bold">
              How Mosan AI Works
            </h2>

            <p className="mt-3 text-gray-400">
              Simple steps from idea to AI-ready prompt.
            </p>

          </div>

          <div className="grid gap-6 md:grid-cols-3">

            <StepCard
              number="01"
              title="Enter Your Idea"
              description="Tell Mosan AI what you want to create."
            />

            <StepCard
              number="02"
              title="Choose Options"
              description="Select content type, style, language and prompt length."
            />

            <StepCard
              number="03"
              title="Generate"
              description="Mosan AI sends your request to the backend and returns the result."
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          PRICING SECTION
      ====================================================== */}

      <section
        id="pricing"
        className="border-t border-white/10 px-6 py-20"
      >

        <div className="mx-auto max-w-5xl">

          <div className="mb-12 text-center">

            <h2 className="text-3xl font-bold">
              Simple Pricing
            </h2>

            <p className="mt-3 text-gray-400">
              Start free and upgrade when you need more.
            </p>

          </div>

                    <div className="grid gap-6 md:grid-cols-3">

            {/* =====================================================
                FREE PLAN
            ====================================================== */}

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <h3 className="text-xl font-bold">
                Free
              </h3>

              <div className="mt-4 text-4xl font-extrabold">
                ₹0
              </div>

              <p className="mt-2 text-gray-400">
                Forever free
              </p>

              <ul className="mt-8 space-y-4 text-sm text-gray-300">
                <li>
                  ✓ 3 generations per day
                </li>

                <li>
                  ✓ Basic prompt generation
                </li>

                <li>
                  ✓ Website access
                </li>

            
              </ul>

              <button
                disabled
                className="mt-8 w-full rounded-xl border border-white/10 py-3 font-medium text-gray-400"
              >
                Current Plan
              </button>
            </div>


            {/* =====================================================
                PRO PLAN
            ====================================================== */}

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">
                  Pro
                </h3>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-gray-300">
                  STANDARD
                </span>
              </div>

              <div className="mt-4 text-4xl font-extrabold">
                ₹199

                <span className="text-base font-normal text-gray-400">
  / 30 days
                
                </span>
              </div>

              <p className="mt-2 text-gray-400">
                Standard Pro renewal price
              </p>

              <ul className="mt-8 space-y-4 text-sm text-gray-300">
                <li>
                  ✓ Unlimited prompt generation
                </li>

                <li>
                  ✓ Advanced prompts
                </li>

                <li>
                ✓ Website access
                </li>

                

                <li>
                  ✓ Manual renewal
                </li>
              </ul>

              <div className="mt-8 w-full rounded-xl border border-white/10 py-3 text-center text-sm font-medium text-gray-400">
                Standard Price: ₹199 / 30 Days
              </div>
            </div>


            {/* =====================================================
                LIMITED TIME OFFER
            ====================================================== */}

            <div className="rounded-3xl border border-cyan-400/40 bg-cyan-400/10 p-8 shadow-xl shadow-cyan-500/10">

              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-white">
                  Limited Time Offer
                </h3>

                <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-bold text-black">
       LAUNCH OFFER ONLY ₹1           
                </span>
              </div>

              <div className="mt-5">
                <div className="text-sm text-gray-500 line-through">
                  ₹199 / 30 Days
                </div>

                <div className="mt-1 text-5xl font-extrabold text-cyan-300">
                  ₹1
                </div>

                <div className="mt-2 text-sm font-medium text-gray-300">
                  for the first 7 days
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-gray-300">
                Get Mosan AI Pro for just ₹1 for your first 7 days.
              </p>

              <ul className="mt-8 space-y-4 text-sm text-gray-200">
                <li>
                  ✓ Unlimited prompt generation
                </li>

                <li>
                  ✓ Advanced prompts
                </li>

                <li>
                  ✓ Website access
                </li>

                

                <li>
                  ✓ No automatic renewal
                </li>

                <li>
                  ✓ Renew manually at ₹199
✓ 30 AI image generations per 30 days
                </li>
              </ul>

              <button
                onClick={() => {
                  if (!userEmail) {
                    setShowAuthModal(true);
                    return;
                  }

                  handleUpgrade();
                }}
                className="mt-8 w-full rounded-xl bg-cyan-500 py-3.5 font-bold text-black transition hover:bg-cyan-400"
              >
             {!userEmail
  ? "Get Launch Offer — ₹1"
  : !subscriptionChecked
  ? "Checking plan..."
  : isProActive
  ? "Pro Active"
  : hasSubscriptionRecord
  ? "Renew Pro — ₹199"
  : "Get Launch Offer — ₹1"}
              </button>

              <p className="mt-4 text-center text-xs leading-5 text-gray-400">
                One-time payment. No automatic ₹199 charge.
              </p>
            </div>

          </div>
          {/* Android App Coming Soon */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-7 text-center">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">📱</span>
              <h3 className="text-xl font-bold text-white">
                Mosan AI Android App — Coming Soon
              </h3>
            </div>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-400">
              We&apos;re working on the Mosan AI Android app. For now, enjoy Mosan AI on our website.
            </p>
          </div>
        </div>

      </section>

      {/* =====================================================
          FAQ / INFORMATION
      ====================================================== */}

      <section className="px-6 pb-20">

        <div className="mx-auto max-w-4xl">

          <div className="mb-10 text-center">

            <h2 className="text-3xl font-bold">
              About Mosan AI
            </h2>

            <p className="mt-3 text-gray-400">
              Built for creators who want better AI results.
            </p>

          </div>

          <div className="space-y-4">

            <InfoCard
              title="Can I use Mosan AI on different devices?"
              description="Yes. You can sign in to your Mosan AI account from a supported browser on your devices."
            />

            <InfoCard
              title="How does the free limit work?"
              description="Free accounts can generate up to 3 prompts per day on the website. Your account's daily usage is checked before generation."
            />

            <InfoCard
              title="What is the Pro price?"
              description="Launch Offer: ₹1 for the first 7 days of full Pro access. Manual renewal: ₹199 for 30 days. No automatic renewal."
            />

            <InfoCard
              title="Is the AI API key exposed in my browser?"
              description="No. Prompt generation runs through Mosan AI's secure backend, and the AI provider API key is not exposed in the website code."
            />

          </div>

        </div>

      </section>

      {/* =====================================================
          FINAL CTA
      ====================================================== */}

      <section className="border-t border-white/10 px-6 py-20 text-center">

        <div className="mx-auto max-w-3xl">

          <div className="mb-5 text-4xl">
            🚀
          </div>

          <h2 className="text-3xl font-bold sm:text-4xl">
            Start Creating Better Prompts
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Create your free Mosan AI account and turn your ideas into
            structured AI prompts.
          </p>

          <div className="mt-8">

            <button
              onClick={() => {
                if (userEmail) {
                  document
                    .getElementById("generator")
                    ?.scrollIntoView({
                      behavior: "smooth",
                    });

                  return;
                }

                setShowAuthModal(true);
              }}
              className="rounded-xl bg-cyan-500 px-7 py-3.5 font-bold text-black transition hover:bg-cyan-400"
            >
              {userEmail ? "Open Generator" : "Create Free Account"}
            </button>

          </div>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-white/10 px-6 py-8">

        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-gray-500 md:flex-row">

          <div>
            © 2026 Mosan AI. All rights reserved.
          </div>

          <div>
            Create smarter. Create faster.
          </div>

        </div>

      </footer>

      {/* =====================================================
          AUTH MODAL
      ====================================================== */}

      {showAuthModal && (
        <AuthModal
          onClose={closeLogin}
          onSuccess={handleAuthSuccess}
        />
      )}

    </main>
  );
}

// =========================================================
// FEATURE CARD
// =========================================================

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-cyan-400/20">

      <div className="text-3xl">
        {icon}
      </div>

      <h3 className="mt-5 text-lg font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-gray-400">
        {description}
      </p>

    </div>
  );
}

// =========================================================
// MINI FEATURE
// =========================================================

function MiniFeature({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">

      <div className="text-2xl">
        {icon}
      </div>

      <h3 className="mt-4 font-bold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-gray-500">
        {description}
      </p>

    </div>
  );
}

// =========================================================
// STEP CARD
// =========================================================

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

      <div className="text-sm font-bold text-cyan-400">
        {number}
      </div>

      <h3 className="mt-4 text-xl font-bold">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-gray-400">
        {description}
      </p>

    </div>
  );
}

// =========================================================
// INFORMATION CARD
// =========================================================

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">

      <h3 className="font-bold text-gray-200">
        {title}
      </h3>

      <p className="mt-3 text-sm leading-6 text-gray-400">
        {description}
      </p>

    </div>
  );
}