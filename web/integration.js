/**
 * PERC — Website Integration Script
 *
 * Add this script to your website to send enquiries and chat messages
 * to the PERC Admission Operations Engine.
 *
 * Usage:
 *   <script src="https://your-domain.com/perc-integration.js"></script>
 *
 *   <!-- Track form submissions automatically -->
 *   <form data-perc-form="true" data-perc-source="website_form">
 *     <input name="first_name" required>
 *     <input name="phone" required>
 *     <input name="email">
 *     <textarea name="message"></textarea>
 *   </form>
 *
 *   <!-- Or use the API directly -->
 *   <script>
 *     PERC.sendEnquiry({
 *       first_name: "Rahul",
 *       phone: "+919876543210",
 *       message: "I want to know about JEE courses"
 *     });
 *   </script>
 */

(function () {
  "use strict";

  var PERC_API_BASE = (window.__PERC_CONFIG && window.__PERC_CONFIG.apiBase) || "http://localhost:8000";

  window.PERC = {
    /**
     * Send an enquiry from the website to the PERC engine.
     */
    async sendEnquiry(data) {
      var payload = {
        first_name: data.first_name,
        last_name: data.last_name || "",
        phone: data.phone || "",
        email: data.email || "",
        source: data.source || "website_form",
        category: data.category || "",
        message: data.message || "",
        metadata: data.metadata || {},
      };

      var response = await fetch(PERC_API_BASE + "/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        var err = await response.json().catch(function () { return { detail: "Request failed" }; });
        console.error("PERC: Failed to send enquiry", err);
        throw new Error(err.detail || "Failed to send enquiry");
      }

      return response.json();
    },

    /**
     * Send a chat message from the live chat widget.
     */
    async sendMessage(leadId, content, metadata) {
      var response = await fetch(PERC_API_BASE + "/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          channel: "website_chat",
          content: content,
          content_type: "text",
          metadata: metadata || {},
        }),
      });

      if (!response.ok) {
        var err = await response.json().catch(function () { return { detail: "Request failed" }; });
        console.error("PERC: Failed to send message", err);
        throw new Error(err.detail || "Failed to send message");
      }

      return response.json();
    },

    /**
     * Generic capture for any custom website integration.
     */
    async capture(data) {
      var response = await fetch(PERC_API_BASE + "/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: data.source || "website_form",
          source_reference_id: data.source_reference_id || null,
          first_name: data.first_name,
          last_name: data.last_name || "",
          phone: data.phone || "",
          email: data.email || "",
          message: data.message || "",
          content_type: data.content_type || "text",
          channel_message_id: data.channel_message_id || null,
          category: data.category || null,
          metadata: data.metadata || {},
        }),
      });

      if (!response.ok) {
        var err = await response.json().catch(function () { return { detail: "Request failed" }; });
        console.error("PERC: Capture failed", err);
        throw new Error(err.detail || "Capture failed");
      }

      return response.json();
    },
  };

  // ── Auto-bind form submissions ──────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindForms);
  } else {
    bindForms();
  }

  function bindForms() {
    var forms = document.querySelectorAll("[data-perc-form='true']");
    forms.forEach(function (form) {
      form.addEventListener("submit", async function (e) {
        e.preventDefault();

        var formData = new FormData(form);
        var data = {
          first_name: formData.get("first_name") || formData.get("name") || "",
          last_name: formData.get("last_name") || "",
          phone: formData.get("phone") || formData.get("mobile") || "",
          email: formData.get("email") || "",
          source: form.dataset.percSource || "website_form",
          category: formData.get("category") || "",
          message: formData.get("message") || formData.get("enquiry") || "",
        };

        var submitBtn = form.querySelector("[type='submit']");
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = submitBtn.dataset.loadingText || "Sending...";
        }

        try {
          var result = await window.PERC.sendEnquiry(data);
          console.log("PERC: Enquiry sent", result);

          if (result.lead_id) {
            try { localStorage.setItem("perc_lead_id", result.lead_id); } catch (e) {}
          }

          form.dispatchEvent(new CustomEvent("perc:success", { detail: result }));

          var successMsg = form.dataset.percSuccess || "Thank you! We will contact you shortly.";
          var msgEl = document.createElement("p");
          msgEl.className = "perc-success";
          msgEl.style.cssText = "color: #10b981; margin-top: 8px; font-weight: 500;";
          msgEl.textContent = successMsg;
          form.parentNode.insertBefore(msgEl, form.nextSibling);
        } catch (err) {
          console.error("PERC: Form submission failed", err);
          form.dispatchEvent(new CustomEvent("perc:error", { detail: err }));

          var errorMsg = form.dataset.percError || "Something went wrong. Please try again.";
          var errEl = document.createElement("p");
          errEl.className = "perc-error";
          errEl.style.cssText = "color: #ef4444; margin-top: 8px; font-weight: 500;";
          errEl.textContent = errorMsg;
          form.parentNode.insertBefore(errEl, form.nextSibling);
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.originalText || submitBtn.textContent;
          }
        }
      });
    });
  }
})();
