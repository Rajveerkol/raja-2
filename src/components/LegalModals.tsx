import React, { useState } from 'react';
import { 
  X, Shield, FileText, Mail, Send, CheckCircle2, 
  MessageSquare, ExternalLink, HelpCircle, ArrowRight 
} from 'lucide-react';
import { SiteSettings } from '../types';

export type LegalModalType = 'privacy' | 'terms' | 'contact' | null;

interface LegalModalsProps {
  activeModal: LegalModalType;
  onClose: () => void;
  settings: SiteSettings;
}

export const LegalModals: React.FC<LegalModalsProps> = ({
  activeModal,
  onClose,
  settings
}) => {
  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('general');
  const [contactMessage, setContactMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!activeModal) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) return;

    setIsSubmitting(true);
    // Simulate real submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 600);
  };

  const handleResetContact = () => {
    setContactName('');
    setContactEmail('');
    setContactSubject('general');
    setContactMessage('');
    setIsSubmitted(false);
  };

  return (
    <div className="legal-modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true">
      <div className="legal-modal-card animate-scale-up">
        {/* Header */}
        <div className="legal-modal-header">
          <div className="legal-modal-header-info">
            <div className="legal-modal-icon">
              {activeModal === 'privacy' && <Shield size={22} />}
              {activeModal === 'terms' && <FileText size={22} />}
              {activeModal === 'contact' && <Mail size={22} />}
            </div>
            <div>
              <h2 className="legal-modal-title">
                {activeModal === 'privacy' && 'Privacy Policy'}
                {activeModal === 'terms' && 'Terms of Service'}
                {activeModal === 'contact' && 'Contact Us & Support'}
              </h2>
              <span className="legal-modal-subtitle">
                {activeModal === 'privacy' && 'Last Updated: October 2026 • Appvizo Security & Privacy'}
                {activeModal === 'terms' && 'Effective Date: October 2026 • User Agreement'}
                {activeModal === 'contact' && 'We are here to assist you 24/7 with inquiries and app submissions'}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="legal-modal-close" 
            onClick={onClose} 
            aria-label="Close dialog"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="legal-modal-body">
          {/* =========================================================
              PRIVACY POLICY
              ========================================================= */}
          {activeModal === 'privacy' && (
            <div className="legal-document-content">
              <section className="legal-section">
                <h3>1. Introduction &amp; Commitment</h3>
                <p>
                  Welcome to <strong>Appvizo</strong>. Your privacy and trust are our top priorities. 
                  This Privacy Policy explains how Appvizo (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) collects, 
                  manages, and safeguards your information when you access our website at <strong>appvizo.online</strong> 
                  and use our verified application distribution portal.
                </p>
                <p>
                  By accessing or browsing Appvizo, you signify your agreement to the practices described in this policy.
                </p>
              </section>

              <section className="legal-section">
                <h3>2. Information We Collect</h3>
                <p>
                  Appvizo is engineered with a strict <strong>privacy-first</strong> philosophy. We do NOT require visitor 
                  registration, user accounts, or sensitive personal data to discover and download applications.
                </p>
                <ul>
                  <li>
                    <strong>Non-Personal Technical Logs:</strong> Standard web server logs such as browser type, operating system, 
                    language preference, referring URL, and approximate timestamp. These are used solely for debugging and DDOS prevention.
                  </li>
                  <li>
                    <strong>Aggregate Download Analytics:</strong> We record anonymous download counters to rank popular apps 
                    without associating activity with individual users.
                  </li>
                  <li>
                    <strong>Inquiry Information:</strong> If you voluntarily reach out via our contact form or support channels, 
                    we receive your name, email address, and message content to address your request.
                  </li>
                </ul>
              </section>

              <section className="legal-section">
                <h3>3. Application Verification &amp; Security</h3>
                <p>
                  Every game and utility listed on Appvizo undergoes automated security inspection to check for integrity and safety. 
                  Download links redirect you directly to high-speed secure mirrors or official publisher distributions. 
                  We never distribute unauthorized spyware, trojans, or malicious payloads.
                </p>
              </section>

              <section className="legal-section">
                <h3>4. Cookies &amp; Local Storage</h3>
                <p>
                  We utilize lightweight browser LocalStorage solely to preserve client-side UI preferences (such as recent search 
                  and theme display) and admin session states. We do NOT use tracking cookies or invasive third-party cross-site trackers.
                </p>
              </section>

              <section className="legal-section">
                <h3>5. Third-Party Links &amp; External Services</h3>
                <p>
                  Our directory contains links to third-party file hosts, developers, and publishers. Once you leave Appvizo, 
                  the privacy policies and terms of those third-party services govern. We encourage you to review their respective privacy practices.
                </p>
              </section>

              <section className="legal-section disclaimer-box">
                <h3>6. Facebook &amp; Meta Disclaimer</h3>
                <p>
                  This website is not part of the Facebook website or Meta Platforms, Inc. Additionally, this site is NOT 
                  endorsed by Facebook in any way. FACEBOOK is a registered trademark of META PLATFORMS, INC.
                </p>
              </section>

              <section className="legal-section">
                <h3>7. Contact Information</h3>
                <p>
                  If you have questions or concerns regarding our privacy practices or wish to request data deletion, please contact us at:
                  <br />
                  <strong>Email:</strong> support@appvizo.online
                  <br />
                  <strong>Telegram:</strong> {settings.telegramLink || 'https://t.me/appvizo_official'}
                </p>
              </section>
            </div>
          )}

          {/* =========================================================
              TERMS OF SERVICE
              ========================================================= */}
          {activeModal === 'terms' && (
            <div className="legal-document-content">
              <section className="legal-section">
                <h3>1. Acceptance of Terms</h3>
                <p>
                  By accessing, browsing, or utilizing <strong>Appvizo</strong> (&ldquo;appvizo.online&rdquo;), you acknowledge that 
                  you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to all terms, please 
                  discontinue use of our website immediately.
                </p>
              </section>

              <section className="legal-section">
                <h3>2. Service Description</h3>
                <p>
                  Appvizo provides an index, discovery engine, and direct download facilitation service for mobile and desktop applications, 
                  casual games, and software utilities. We strive to maintain accurate ratings, descriptions, and file sizes.
                </p>
              </section>

              <section className="legal-section">
                <h3>3. Intellectual Property Rights &amp; DMCA</h3>
                <p>
                  All trademarks, logos, brand names, and app assets referenced on this website remain the property of their respective 
                  owners and copyright holders. Mention of specific software or companies does not imply endorsement or affiliation.
                </p>
                <p>
                  If you are a copyright owner or an agent thereof and believe that any content hosted or indexed on Appvizo infringes 
                  upon your copyrights, please submit a formal takedown notice to <strong>dmca@appvizo.online</strong> with appropriate documentation.
                </p>
              </section>

              <section className="legal-section">
                <h3>4. Permitted Use</h3>
                <p>
                  You agree to use Appvizo only for lawful, personal, non-commercial purposes. You may not attempt to disrupt site functionality, 
                  scrape content via abusive automated tools, reverse-engineer proprietary portal code, or bypass security barriers.
                </p>
              </section>

              <section className="legal-section">
                <h3>5. Disclaimer of Warranties</h3>
                <p>
                  The services and downloadable files provided through Appvizo are offered &ldquo;as is&rdquo; and &ldquo;as available&rdquo;, 
                  without warranties of any kind, whether express or implied. While we strive to index verified files, we do not warrant 
                  that the service will be uninterrupted, error-free, or completely free of software bugs.
                </p>
              </section>

              <section className="legal-section disclaimer-box">
                <h3>6. Meta &amp; Facebook Non-Affiliation</h3>
                <p>
                  This website is not part of the Facebook website or Meta Platforms, Inc. Additionally, this site is NOT 
                  endorsed by Facebook in any way. FACEBOOK is a registered trademark of META PLATFORMS, INC.
                </p>
              </section>

              <section className="legal-section">
                <h3>7. Modifications &amp; Governing Law</h3>
                <p>
                  We reserve the right to revise these Terms of Service at any time without prior individual notice. Your continued 
                  use of Appvizo after any modifications constitutes acceptance of the amended terms.
                </p>
              </section>
            </div>
          )}

          {/* =========================================================
              CONTACT US & SUPPORT
              ========================================================= */}
          {activeModal === 'contact' && (
            <div className="contact-modal-content">
              {isSubmitted ? (
                <div className="contact-success-state animate-fade-in">
                  <div className="contact-success-icon">
                    <CheckCircle2 size={48} />
                  </div>
                  <h3>Message Sent Successfully!</h3>
                  <p>
                    Thank you for reaching out to <strong>Appvizo Support</strong>. We have received your inquiry 
                    and our team will get back to you at <strong>{contactEmail}</strong> as soon as possible (usually within 24 hours).
                  </p>
                  <div className="contact-success-actions">
                    <button 
                      type="button" 
                      className="btn-legal-primary" 
                      onClick={handleResetContact}
                    >
                      Send Another Message
                    </button>
                    <button 
                      type="button" 
                      className="btn-legal-secondary" 
                      onClick={onClose}
                    >
                      Return to Appvizo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="contact-layout-grid">
                  {/* Left Column: Quick Channels */}
                  <div className="contact-info-col">
                    <h3 className="contact-col-title">Direct Channels</h3>
                    <p className="contact-col-desc">
                      Have a question, want to submit an app to Appvizo, or need assistance? Reach out anytime.
                    </p>

                    <div className="contact-channel-cards">
                      <a 
                        href="mailto:support@appvizo.online" 
                        className="contact-channel-item"
                        title="Email Appvizo Support"
                      >
                        <div className="contact-channel-icon email-theme">
                          <Mail size={20} />
                        </div>
                        <div className="contact-channel-text">
                          <span className="channel-label">Email Support</span>
                          <span className="channel-val">support@appvizo.online</span>
                        </div>
                      </a>

                      <a 
                        href={settings.telegramLink || 'https://t.me/appvizo_official'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="contact-channel-item"
                        title="Telegram Community"
                      >
                        <div className="contact-channel-icon telegram-theme">
                          <MessageSquare size={20} />
                        </div>
                        <div className="contact-channel-text">
                          <span className="channel-label">Official Telegram</span>
                          <span className="channel-val">@appvizo_official</span>
                        </div>
                        <ExternalLink size={14} className="external-badge" />
                      </a>
                    </div>

                    <div className="contact-faq-preview">
                      <div className="faq-preview-title">
                        <HelpCircle size={16} />
                        <span>Frequently Asked</span>
                      </div>
                      <ul className="faq-mini-list">
                        <li>
                          <strong>Are app downloads free?</strong>
                          <span>Yes, all listed games &amp; utilities are 100% free direct downloads.</span>
                        </li>
                        <li>
                          <strong>Are apps verified for safety?</strong>
                          <span>Every app goes through automated checks before being featured on Appvizo.</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Right Column: Interactive Form */}
                  <div className="contact-form-col">
                    <h3 className="contact-col-title">Send Us a Message</h3>
                    <form onSubmit={handleContactSubmit} className="contact-active-form">
                      <div className="form-field-group">
                        <label className="field-label" htmlFor="contact-name">
                          Your Name <span className="req-star">*</span>
                        </label>
                        <input 
                          id="contact-name"
                          type="text" 
                          className="field-input" 
                          placeholder="e.g. John Doe" 
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="field-label" htmlFor="contact-email">
                          Email Address <span className="req-star">*</span>
                        </label>
                        <input 
                          id="contact-email"
                          type="email" 
                          className="field-input" 
                          placeholder="you@example.com" 
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-field-group">
                        <label className="field-label" htmlFor="contact-subject">
                          Topic / Subject <span className="req-star">*</span>
                        </label>
                        <select 
                          id="contact-subject"
                          className="field-select"
                          value={contactSubject}
                          onChange={(e) => setContactSubject(e.target.value)}
                        >
                          <option value="general">General Inquiry</option>
                          <option value="app_submission">Submit App to Appvizo</option>
                          <option value="broken_link">Report Broken Download Link</option>
                          <option value="dmca">DMCA / Copyright Notice</option>
                          <option value="partnership">Advertising &amp; Partnerships</option>
                        </select>
                      </div>

                      <div className="form-field-group">
                        <label className="field-label" htmlFor="contact-message">
                          Your Message <span className="req-star">*</span>
                        </label>
                        <textarea 
                          id="contact-message"
                          className="field-textarea" 
                          rows={4}
                          placeholder="Write your message or app submission details here..."
                          value={contactMessage}
                          onChange={(e) => setContactMessage(e.target.value)}
                          required
                        />
                      </div>

                      <button 
                        type="submit" 
                        className="btn-send-message"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <span>Sending message...</span>
                        ) : (
                          <>
                            <Send size={16} />
                            <span>Send Message</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="legal-modal-footer">
          <span className="legal-footer-note">
            Appvizo • Fast, Verified &amp; Safe Direct Downloads
          </span>
          <button type="button" className="btn-modal-dismiss" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
