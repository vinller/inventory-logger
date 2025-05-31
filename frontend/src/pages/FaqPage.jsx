// src/pages/FaqPage.jsx
import React, { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import { useAuth } from "../context/AuthContext";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/solid";
import Footer from "../components/Footer";


function FaqPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const faqs = [
    {
      category: "How To",
      question: "How do I check out an item?",
      answer:
        "Go to the User Dashboard and scan or enter the item's barcode. If the item is available, a form will appear to enter room, client name, and event number.",
      pdf: "https://drive.google.com/placeholder-checkout"
    },
    {
      category: "How To",
      question: "Can I view my past check-ins and check-outs?",
      answer:
        "Yes. Navigate to 'My History' on your dashboard to view all check-in and check-out activity."
    },
    {
      category: "What If",
      question: "What happens if I scan an item that's already checked out?",
      answer:
        "It will automatically check the item back in, as long as you're the user who checked it out."
    },
    {
      category: "What If",
      question: "Why is my item not showing up when I scan the barcode?",
      answer:
        "It may not have been added to the database yet. Confirm the barcode or contact an admin for help."
    },
    {
      category: "Permissions",
      question: "Who can add, edit, or delete items?",
      answer:
        "Only admins can create, update, or delete items. Users can only log items in or out.",
      pdf: "https://drive.google.com/placeholder-admin"
    },
    {
      category: "What If",
      question: "What should I do if I accidentally check out the wrong item?",
      answer:
        "Check it back in immediately and notify a supervisor so they can review item history."
    }
  ];

  const groupedFaqs = {
    "How To": [],
    "What If": [],
    "Permissions": []
  };

  faqs.forEach((faq, i) => {
    groupedFaqs[faq.category].push({ ...faq, id: i });
  });

  const filteredFaqs = faqs.filter(f =>
    f.question.toLowerCase().includes(query.toLowerCase())
  );

  const filteredGrouped = {
    "How To": [],
    "What If": [],
    "Permissions": []
  };

  filteredFaqs.forEach(f => {
    filteredGrouped[f.category].push(f);
  });

  useEffect(() => {
    setNotFound(query.length > 2 && filteredFaqs.length === 0);
  }, [query, filteredFaqs]);

  const sendFaqEmail = async () => {
    setSending(true);
    try {
      await fetch("/api/email/faq-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: query,
          username: user.username
        })
      });
      setSent(true);
    } catch (err) {
      alert("Error sending email. Please try again later.");
    }
    setSending(false);
  };

  const categories = ["How To", "What If", "Permissions"];

  return (
    <>
      <TopBar />
      <div className="bg-gray-900 min-h-screen text-white px-6 py-12">
        <h1 className="text-3xl font-bold mb-6 text-center text-asuGold">FAQ</h1>

        <div className="max-w-3xl mx-auto mb-6">
          <input
            type="text"
            placeholder="Search your question..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        {notFound && (
          <div className="text-center text-white/80 mb-8">
            <p className="mb-2">No match found for your question.</p>
            {sent ? (
              <p className="text-green-400 font-medium">Sent! We'll follow up with you shortly.</p>
            ) : (
              <button
                onClick={sendFaqEmail}
                disabled={sending}
                className={`bg-blue-600 text-white font-medium px-6 py-2 rounded-full ${
                  sending ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
                }`}
              >
                {sending ? "Sending..." : "Still have questions? Send it to us"}
              </button>
            )}
          </div>
        )}

        <div className="max-w-3xl mx-auto">
          {categories.map((section) => {
            const sectionFaqs = query ? filteredGrouped[section] : groupedFaqs[section];
            if (!sectionFaqs.length) return null;

            return (
              <div key={section} className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">{section}</h2>
                <div className="space-y-3">
                  {sectionFaqs.map((faq) => (
                    <div key={faq.id} className="bg-gray-800 rounded-lg border border-gray-700">
                      <button
                        onClick={() => setOpenIndex(openIndex === faq.id ? null : faq.id)}
                        className="w-full text-left px-5 py-4 flex justify-between items-center"
                      >
                        <span className="text-base font-medium text-white">
                          {faq.question}
                        </span>
                        {openIndex === faq.id ? (
                          <ChevronUpIcon className="h-5 w-5 text-white" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-white/60" />
                        )}
                      </button>
                      {openIndex === faq.id && (
                        <div className="px-5 pb-5 text-sm text-gray-300">
                          <p className="mb-2">{faq.answer}</p>
                          {faq.pdf && (
                            <a
                              href={faq.pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 underline hover:text-blue-500"
                            >
                              📄 View Guide (PDF)
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default FaqPage;
