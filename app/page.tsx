"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import AuthModal from "./components/AuthModal";
import { supabase } from "./lib/supabase";

interface GeneratedResult {
  success: boolean;
  message?: string;
  prompt?: string;
  answer?: string;
}
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
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
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [contentType, setContentType] = useState("Image");
  const [style, setStyle] = useState("Cinematic");
  const [language, setLanguage] = useState("English");
  const [promptLength, setPromptLength] = useState("Detailed");

  // =========================================================
  // GENERATED RESULT STATE
  // =========================================================
const startVoiceInput = () => {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    setError(
      "Voice input is not supported in this browser. Please try Google Chrome or Microsoft Edge."
    );
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = voiceLanguage;
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    setIsListening(true);
    setError("");
  };

  recognition.onresult = (event: any) => {
    const transcript = event.results?.[0]?.[0]?.transcript?.trim();

    if (transcript) {
      setIdea((previous: string) =>
        previous ? `${previous} ${transcript}` : transcript
      );
    }
  };

  recognition.onerror = (event: any) => {
    if (event.error === "not-allowed") {
      setError("Please allow microphone access in your browser.");
    } else {
      setError("Voice recognition failed. Please try again.");
    }
  };

  recognition.onend = () => {
    setIsListening(false);
  };

  try {
    recognition.start();
  } catch {
    setIsListening(false);
    setError("Could not start voice input. Please try again.");
  }
};
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [generationMode, setGenerationMode] = useState<"prompt" | "answer">("answer");
  const [isListening, setIsListening] = useState(false);
const [voiceLanguage, setVoiceLanguage] = useState("en-IN");
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

    // CREATE Γé╣1 TRIAL ORDER
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
      description: "Γé╣1 Image Trial ΓÇö 7 Days, Up to 50 Images",
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
          // If signature verification or the browser connection was interrupted,
          // ask the backend to confirm the captured payment directly with Razorpay.
          try {
            const {
              data: { session: recoverySession },
            } = await supabase.auth.getSession();

            if (!recoverySession?.access_token) {
              throw new Error("Please log in again to recover your payment.");
            }

            const recoveryResponse = await fetch(
              "https://mosan-ai-backend.onrender.com/api/recover-image-trial-payment",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${recoverySession.access_token}`,
                },
                body: JSON.stringify({
                  razorpay_order_id: paymentResponse.razorpay_order_id,
                  razorpay_payment_id: paymentResponse.razorpay_payment_id,
                }),
              }
            );
            const recoveryData = await recoveryResponse.json();

            if (!recoveryResponse.ok || !recoveryData.success) {
              throw new Error(
                recoveryData.message ||
                  "Payment could not be recovered. Please contact support before paying again."
              );
            }

            alert(
              "Image Trial payment recovered and activated! You can generate up to 10 images per day, with a maximum of 50 images over 7 days."
            );
            window.location.reload();
          } catch (recoveryError) {
            setImageError(
              recoveryError instanceof Error
                ? recoveryError.message
                : "Payment verification failed. If money was deducted, contact support before paying again."
            );
          }
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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!user?.id || !session?.access_token) {
      alert("Please login again before upgrading to Pro.");
      return;
    }

    // =========================================================
    // CREATE ONE-TIME PRO ORDER
    // FIRST PRO PURCHASE = ₹199
    // MANUAL RENEWAL = ₹199
    // NO AUTOMATIC RECURRING PAYMENT
    // =========================================================

    const response = await fetch(
      "https://mosan-ai-backend.onrender.com/api/create-pro-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
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
      data.payment_type === "pro";

    const description = isLaunchOffer
      ? "Mosan AI Pro - ₹199 (30 Days)"
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
                "Authorization": `Bearer ${session.access_token}`,
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
  const generatePrompt = async (requestText?: string) => {
  const userRequest = (requestText ?? idea).trim();
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

    if (!userRequest) {
  setError("Please enter your message first.");
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

  // Daily free quota is consumed atomically by the authenticated backend.
  // The browser only displays subscription status; it does not spend quota.

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

    setChatMessages((previous) => [
      ...previous,
      { role: "user", content: userRequest },
    ]);

    try {
      // -------------------------------------------------------
      // SEND REQUEST TO PYTHON FASTAPI BACKEND
      // -------------------------------------------------------

      const {
        data: { session: chatSession },
      } = await supabase.auth.getSession();

      if (!chatSession?.access_token) {
        setShowAuthModal(true);
        return;
      }

      const response = await fetch(
  "https://mosan-ai-backend.onrender.com/api/direct-answer",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${chatSession.access_token}`,
    },
    body: JSON.stringify({
      idea: userRequest,
      content_type: contentType,
      style,
      language,
      prompt_length: promptLength,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      messages: chatMessages.slice(-12),
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

      const answerText = data.answer || data.prompt || "";

setGeneratedPrompt(answerText);

setChatMessages((previous) => [
  ...previous,
  { role: "assistant", content: answerText },
]);

setIdea("");
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

      const lastUserIdea =
        [...chatMessages].reverse().find((message) => message.role === "user")?.content || idea;

      const { error } = await supabase
        .from("prompt_history")
        .insert({
          user_id: user.id,
          idea: lastUserIdea,
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
    setError("");
    setChatMessages([]);
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

      <section id="generator" className="relative z-10 -my-8 border-y border-[#e2dcf0] bg-gradient-to-b from-[#f0ecfb] via-[#f4f1fc] to-[#edf4fb] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
  <div className="mx-auto w-full max-w-5xl">
    <div className="overflow-hidden rounded-3xl border border-[#ddd5ef] bg-[#f7f4fc] text-slate-900 shadow-xl shadow-[#51427a]/10">
      <header className="border-b border-[#e2dbef] bg-gradient-to-r from-[#eee9fb] via-[#e9e7f9] to-[#e3f3f7] px-5 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 text-lg font-extrabold text-white shadow-md">M</div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Mosan AI</h2>
            <p className="mt-1 text-sm text-slate-600">One chat. Everything you need.</p>
          </div>
        </div>
      </header>

      <div id="mosan-chat-messages" role="log" aria-live="polite" className="min-h-[280px] max-h-[56vh] space-y-5 overflow-y-auto bg-[#ece8f7] p-4 sm:p-7">
        {chatMessages.length === 0 && !generatedPrompt && !generatedImage && (
          <div className="flex min-h-[200px] flex-col items-center justify-center px-3 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-100 to-purple-200 text-xl font-extrabold text-purple-700">M</div>
            <h3 className="text-lg font-semibold text-slate-900">What can I help you with?</h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">Write a story, ask a question, create a prompt, translate text, or continue a conversation.</p>
            <p className="mt-3 text-sm text-slate-500">For example: "Write a Bengali emotional love story."</p>
          </div>
        )}

        {chatMessages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "user" ? (
              <div className="max-w-[92%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md border border-[#c9dff2] bg-[#dceaf8] px-4 py-3 text-sm leading-7 text-slate-800 sm:max-w-[82%]">{message.content}</div>
            ) : (
              <div className="w-full max-w-[98%] rounded-2xl rounded-tl-md border border-[#ded7ed] bg-[#f8f5fd] p-4 shadow-sm sm:p-5">
                <div className="mb-3 flex items-center gap-2 border-b border-[#e8e1f2] pb-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e5ddf8] text-sm font-bold text-purple-800">M</span>
                  <strong className="text-sm text-slate-900">Mosan's Response</strong>
                </div>
                <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">{message.content}</div>
                {message.content === generatedPrompt && (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e8e1f2] pt-3">
                    <button type="button" onClick={copyPrompt} className="rounded-lg border border-[#dcd5ea] bg-[#f0ecf8] px-3 py-2 text-sm text-slate-700 transition hover:bg-[#e8e2f5]">Copy</button>
                    <button type="button" onClick={savePrompt} className="rounded-lg border border-[#dcd5ea] bg-[#f0ecf8] px-3 py-2 text-sm text-slate-700 transition hover:bg-[#e8e2f5]">Save</button>
                    <button type="button" disabled={loading} onClick={() => generatePrompt([...chatMessages].slice(0, index + 1).reverse().find((item) => item.role === "user")?.content)} className="rounded-lg border border-[#dcd5ea] bg-[#f0ecf8] px-3 py-2 text-sm text-slate-700 transition hover:bg-[#e8e2f5] disabled:opacity-50">Regenerate</button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {generatedPrompt && !chatMessages.some((message) => message.role === "assistant" && message.content === generatedPrompt) && (
          <div className="flex justify-start">
            <div className="w-full max-w-[98%] rounded-2xl rounded-tl-md border border-[#ded7ed] bg-[#f8f5fd] p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center gap-2 border-b border-[#e8e1f2] pb-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e5ddf8] text-sm font-bold text-purple-800">M</span><strong className="text-sm text-slate-900">Mosan's Response</strong></div>
              <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-800">{generatedPrompt}</div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e8e1f2] pt-3">
                <button type="button" onClick={copyPrompt} className="rounded-lg border border-[#dcd5ea] bg-[#f0ecf8] px-3 py-2 text-sm text-slate-700 transition hover:bg-[#e8e2f5]">Copy</button>
                <button type="button" onClick={savePrompt} className="rounded-lg border border-[#dcd5ea] bg-[#f0ecf8] px-3 py-2 text-sm text-slate-700 transition hover:bg-[#e8e2f5]">Save</button>
              </div>
            </div>
          </div>
        )}

        {loading && <div className="flex justify-start"><div className="rounded-2xl border border-[#ddd5ef] bg-[#f8f5fd] px-4 py-3 text-sm text-slate-600 shadow-sm">Mosan AI is thinking...</div></div>}

        {generatedImage && (
          <div className="flex justify-start">
            <div className="w-full max-w-[98%] rounded-2xl border border-[#ded7ed] bg-[#f8f5fd] p-4 shadow-sm sm:p-5">
              <h3 className="mb-3 font-semibold text-slate-900">Created Image</h3>
              <img src={generatedImage} alt="Mosan AI generated image" className="w-full rounded-xl border border-[#e3dced]" />
              <a href={generatedImage} download="mosan-ai-image.png" className="mt-4 inline-flex rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-500">Download Image</a>
            </div>
          </div>
        )}
        <div id="mosan-chat-bottom" />
      </div>

      <div className="border-t border-[#e0d9ee] bg-[#f3effa] p-4 sm:p-6">
        {error && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {!userEmail && <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Please log in or create a free account before sending a message.</div>}

        <textarea value={idea} onChange={(e) => setIdea(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (!loading) void generatePrompt(); } }} placeholder="Ask anything or continue your conversation..." className="min-h-[100px] w-full resize-y rounded-2xl border border-[#d9d4e7] bg-[#faf8ff] p-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <select id="voice-language" aria-label="Voice input language" title="Voice input language" value={voiceLanguage} onChange={(e) => setVoiceLanguage(e.target.value)} className="max-w-[125px] rounded-xl border border-[#d9d4e7] bg-[#f8f5fd] px-2 py-2 text-xs text-slate-700 outline-none focus:border-cyan-500">
              <option value="en-IN">English</option><option value="bn-IN">Bengali</option><option value="hi-IN">Hindi</option><option value="as-IN">Assamese</option><option value="or-IN">Odia</option><option value="mr-IN">Marathi</option><option value="gu-IN">Gujarati</option><option value="ta-IN">Tamil</option><option value="te-IN">Telugu</option><option value="kn-IN">Kannada</option><option value="ml-IN">Malayalam</option><option value="pa-IN">Punjabi</option><option value="ur-IN">Urdu</option>
            </select>
            <button type="button" onClick={startVoiceInput} disabled={isListening || loading} aria-label={isListening ? "Listening" : "Voice input"} title={isListening ? "Listening" : "Voice input"} className={`flex h-10 w-10 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${isListening ? "border-cyan-500 bg-cyan-100 text-cyan-800" : "border-[#c8ddec] bg-[#e4f3f8] text-cyan-800 hover:bg-[#d7edf5]"}`}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><path d="M12 17v5" /><path d="M8 22h8" /></svg>
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden text-xs text-slate-500 sm:inline">Enter to send; Shift + Enter for a new line</span>
            <button type="button" onClick={clearAll} className="rounded-xl border border-[#d9d4e7] bg-[#f8f5fd] px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-[#ece7f7]">Clear chat</button>
            <button type="button" onClick={() => generatePrompt()} disabled={loading || !idea.trim()} className="rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50">{loading ? "Thinking..." : "Send Message"}</button>
          </div>
        </div>

        <details id="image-generator" open={Boolean(generatedImage || imageError)} className="mt-4 rounded-2xl border border-[#d9d0ef] bg-[#ebe6f8] p-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-purple-900">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
            <span>Create Image</span>
            <span className="ml-auto text-xs font-normal text-purple-700">Open image tools</span>
          </summary>
          <div className="mt-4">
            <label htmlFor="image-prompt-inline" className="mb-2 block text-sm font-medium text-slate-700">Describe the image</label>
            <textarea id="image-prompt-inline" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Describe the image you want to create..." rows={3} maxLength={2000} className="w-full resize-y rounded-xl border border-[#d9d4e7] bg-[#faf8ff] p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100" />
            <button type="button" onClick={generateImage} disabled={imageLoading || !imagePrompt.trim()} className="mt-3 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50">{imageLoading ? "Generating image..." : "Generate Image"}</button>
            {imageError && <p className="mt-3 text-sm text-red-700">{imageError}</p>}
            {imagesRemaining !== null && <p className="mt-2 text-sm text-slate-600">Images remaining this month: {imagesRemaining}</p>}
            {trialImagesRemainingToday !== null && <p className="mt-1 text-sm text-slate-600">Trial images remaining today: {trialImagesRemainingToday}</p>}
            {trialImagesRemainingTotal !== null && <p className="mt-1 text-sm text-slate-600">Trial images remaining overall: {trialImagesRemainingTotal}</p>}
          </div>
        </details>
      </div>
    </div>
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
description="Pro includes 30 days of access with manual renewal at ₹199. No automatic renewal."
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

              <button type="button" onClick={() => handleUpgrade()} className="mt-8 w-full rounded-xl bg-cyan-500 py-3.5 font-bold text-black transition hover:bg-cyan-400">
                Buy Pro — ₹199 / 30 Days
              </button>
              <p className="mt-3 text-center text-xs text-gray-400">One-time payment. Manual renewal only. No auto-renewal.</p>
            </div>


            {/* =====================================================
                LIMITED TIME OFFER
            ====================================================== */}

            <div className="rounded-3xl border border-cyan-400/40 bg-cyan-400/10 p-8 shadow-xl shadow-cyan-500/10">

              <div className="flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold text-white">
                  ₹1 Image Trial
                </h3>

                <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-bold text-black">
       SEPARATE IMAGE TRIAL           
                </span>
              </div>

              <div className="mt-5">
  <div className="mt-1 text-5xl font-extrabold text-cyan-300">
    ₹1
  </div>

                <div className="mt-2 text-sm font-medium text-gray-300">
                  Image generation for 7 days
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-gray-300">
                Get image generation for 7 days. This does not activate Pro.
              </p>

              <ul className="mt-8 space-y-4 text-sm text-gray-200">
                <li>✓ Up to 10 images per day</li>
                <li>✓ Maximum 50 images over 7 days</li>
                <li>✓ One-time image trial</li>
                <li>✓ No automatic renewal</li>
                <li>✓ Pro is purchased separately for ₹199 / 30 days</li>
                </ul>

              <button
                onClick={() => {
                  if (!userEmail) {
                    setShowAuthModal(true);
                    return;
                  }

                  void buyImageTrial();
                }}
                className="mt-8 w-full rounded-xl bg-cyan-500 py-3.5 font-bold text-black transition hover:bg-cyan-400"
              >
             {!userEmail
  ? "Buy ₹1 Image Trial"
  : !subscriptionChecked
  ? "Checking plan..."
  : isProActive
  ? "Pro Active"
  : "Buy ₹1 Image Trial"}
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
              description="₹1 one-time Image Trial for 7 days (up to 50 images). Pro is separate at ₹199 for 30 days with manual renewal only."
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