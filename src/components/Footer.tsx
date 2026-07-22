import { ArrowRight, Linkedin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Globe3DDemo } from "@/components/landing/Globe3DDemo";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="orqen-footer">
      <section className="footer-globe-section">
        <div className="footer-globe-copy">
          <p className="editorial-eyebrow">
            <i /> GLOBAL BY DESIGN
          </p>
          <h2>
            Work that moves
            <br />
            <em>across time zones.</em>
          </h2>
          <p>
            Teams in thirteen cities run the same operating system — handoffs stay
            coherent, context travels with the work, and nothing waits on someone’s
            morning.
          </p>
          <ul className="footer-city-list">
            <li>New York</li>
            <li>London</li>
            <li>Tokyo</li>
            <li>Singapore</li>
            <li>Dubai</li>
            <li>+8 more</li>
          </ul>
          <button
            type="button"
            onClick={() => navigate("/sign-up")}
            className="editorial-primary footer-cta"
          >
            Start your first workflow <ArrowRight size={17} />
          </button>
        </div>
        <div className="footer-globe-visual">
          <Globe3DDemo />
        </div>
      </section>

      <div className="footer-main">
        <div className="footer-brand">
          <div className="footer-logo">
            <div className="orqen-logo-mark">
              <span />
            </div>
            <span>orqen</span>
          </div>
          <p>Operating system for coordinated work.</p>
        </div>

        <div className="footer-links">
          <div>
            <h3>Product</h3>
            <ul>
              <li>
                <a href="#workflow">Workflows</a>
              </li>
              <li>
                <a href="#platform">Platform</a>
              </li>
              <li>
                <a href="/sign-up">Get started</a>
              </li>
            </ul>
          </div>
          <div>
            <h3>Company</h3>
            <ul>
              <li>
                <a href="https://www.linkedin.com/in/sameer-walikar/" target="_blank" rel="noreferrer">
                  Team
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/sameer-walikar/" target="_blank" rel="noreferrer">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Orqen</span>
        <a
          href="https://www.linkedin.com/in/sameer-walikar/"
          target="_blank"
          rel="noreferrer"
          aria-label="LinkedIn"
        >
          <Linkedin size={17} />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
