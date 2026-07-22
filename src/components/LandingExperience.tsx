import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { TerminalDemo } from "@/components/landing/TerminalDemo";

const reveal = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } };
const inView = {
  initial: "hidden",
  whileInView: "visible",
  viewport: { once: true, amount: 0.22 },
  transition: { duration: 0.55, ease: "easeOut" },
} as const;

const WorkGraph = ({ step, complete }: { step: number; complete: boolean }) => {
  const nodes = [
    ["Understand", "interpret brief", "graph-node-a"],
    ["Plan", "map work", "graph-node-b"],
    ["Act", "run tools", "graph-node-c"],
    ["Verify", "check result", "graph-node-d"],
    ["Done", "send outcome", "graph-node-e"],
  ];
  const progress = complete ? 100 : [15, 40, 60, 85][step];

  return (
    <div className="work-graph" aria-label="An autonomous workflow progressing from brief to completion">
      <div className="graph-top">
        <span className="graph-led" /> WORKFLOW IN PROGRESS <span>ORQ_204</span>
      </div>
      <div className="graph-canvas">
        <svg viewBox="0 0 640 340" aria-hidden="true">
          <path d="M88 173 C175 70, 230 70, 300 170 S425 270, 536 168" />
          <path
            key={`left-${step}`}
            className={step > 0 || complete ? "drawn" : ""}
            d="M88 173 C175 70, 230 70, 300 170"
          />
          <path
            key={`right-${step}`}
            className={step > 2 || complete ? "drawn" : ""}
            d="M300 170 S425 270, 536 168"
          />
        </svg>
        {nodes.map(([title, detail, className], index) => (
          <div
            className={`graph-node ${className} ${!complete && step === index ? "active" : ""} ${complete || step > index ? "complete" : ""}`}
            key={title}
          >
            <span>{complete || step > index ? <Check size={14} /> : <i />}</span>
            <b>{title}</b>
            <small>{detail}</small>
          </div>
        ))}
        <div className="graph-note">Prepare launch brief from this week’s customer feedback.</div>
      </div>
      <div className="graph-bottom">
        <span>{complete ? "Workflow complete" : "Agents are coordinating"}</span>
        <span>{progress}%</span>
      </div>
    </div>
  );
};

const LandingExperience = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState(reducedMotion ? 4 : 0);
  const words = ["the market brief", "the exception", "the campaign", "the launch plan"];
  const complete = step === 4;

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || reducedMotion) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      threshold: 0.2,
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || !visible) return;
    const timeout = window.setTimeout(
      () => setStep((value) => (value === 4 ? 0 : value + 1)),
      complete ? 3000 : 2000,
    );
    return () => window.clearTimeout(timeout);
  }, [complete, reducedMotion, step, visible]);

  useEffect(() => {
    if (visible && !reducedMotion) setStep(0);
  }, [visible, reducedMotion]);

  const start = () => navigate("/sign-up");

  return (
    <main className="orqen-editorial">
      <section ref={heroRef} className="editorial-hero" id="top">
        <div className="hero-text">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.11 } } }}
          >
            <motion.p variants={reveal} className="editorial-eyebrow">
              <i /> ORQEN OPERATING SYSTEM
            </motion.p>
            <motion.h1 variants={reveal}>
              Describe{" "}
              <span className="rotating-word">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={step}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {complete ? "done." : `${words[step]}.`}
                  </motion.span>
                </AnimatePresence>
              </span>
              <br />
              Our agents <em>plan it,</em>
              <br />
              <em>do it,</em> and tell you
              <br />
              when it’s done.
            </motion.h1>
            <motion.p variants={reveal} className="hero-support">
              A coordinated team that turns intent into completed work — across your tools,
              data, and judgement calls.
            </motion.p>
            <motion.div variants={reveal} className="editorial-actions">
              <button onClick={start} className="editorial-primary">
                Start your first workflow <ArrowRight size={17} />
              </button>
              <a
                href="https://www.linkedin.com/in/sameer-walikar/"
                target="_blank"
                rel="noreferrer"
                className="editorial-founder"
              >
                <img src="/sameer.jpeg" alt="Orqen founder" /> Talk to Founders
              </a>
            </motion.div>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.65, ease: "easeOut" }}
          className="hero-graph-wrap"
        >
          <WorkGraph step={complete ? 4 : step} complete={complete} />
        </motion.div>
      </section>

      <section className="editorial-section sequence-section" id="workflow">
        <motion.div {...inView}>
          <p className="editorial-eyebrow">01 — WHAT THE WORK LOOKS LIKE</p>
          <h2>
            A weekly brief,
            <br />
            <em>already moving.</em>
          </h2>
        </motion.div>
        <div className="sequence">
          <article>
            <span>01</span>
            <p>INPUT</p>
            <h3>“Turn customer feedback into a launch plan.”</h3>
          </article>
          <article>
            <span>02</span>
            <p>AGENTS REASON</p>
            <h3>
              Research collects patterns. Strategy selects priorities. Writing shapes the
              narrative.
            </h3>
          </article>
          <article>
            <span>03</span>
            <p>THEY ACT</p>
            <h3>
              The team creates the brief, updates your project, and sends the right people a
              review.
            </h3>
          </article>
          <article>
            <span>04</span>
            <p>OUTCOME</p>
            <h3>
              <b>
                <Check size={15} /> Launch plan ready
              </b>
              <small>Delivered with sources and a decision log.</small>
            </h3>
          </article>
        </div>
      </section>

      <section className="contrast-section">
        <motion.div {...inView} className="contrast-head">
          <p className="editorial-eyebrow">02 — WHY THIS IS DIFFERENT</p>
          <h2>
            Not another place
            <br />
            to <em>talk about work.</em>
          </h2>
        </motion.div>
        <div className="contrast-lines">
          <motion.div {...inView}>
            <span>Chatbot</span>
            <p>Answers a question.</p>
            <strong>Orqen turns a question into coordinated action.</strong>
          </motion.div>
          <motion.div {...inView}>
            <span>Automation</span>
            <p>Follows a fixed path.</p>
            <strong>Orqen makes informed decisions along the way.</strong>
          </motion.div>
          <motion.div {...inView}>
            <span>Dashboard</span>
            <p>Gives you another surface to manage.</p>
            <strong>Orqen gives your team work back.</strong>
          </motion.div>
        </div>
      </section>

      <section className="developer-section editorial-section" id="platform">
        <motion.div {...inView} className="developer-copy">
          <p className="editorial-eyebrow">03 — SET UP IN MINUTES</p>
          <h2>
            Your workspace,
            <br />
            <em>already configured.</em>
          </h2>
          <p>
            Connect the tools your team already uses. Define a workflow once. Orqen handles
            the coordination, approvals, and audit trail from there.
          </p>
          <div className="developer-stats">
            <Card className="developer-stat-card">
              <CardContent className="p-0">
                <span>Under 10 min</span>
                <p>First workflow live</p>
              </CardContent>
            </Card>
            <Card className="developer-stat-card">
              <CardContent className="p-0">
                <span>Full trail</span>
                <p>Every decision logged</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
        <motion.div {...inView} className="developer-terminal">
          <TerminalDemo />
        </motion.div>
      </section>

      <section className="editorial-section credibility-section">
        <motion.div {...inView}>
          <p className="editorial-eyebrow">04 — BUILT FOR REAL OPERATIONS</p>
          <h2>
            Connect the work.
            <br />
            <em>Keep the judgement.</em>
          </h2>
        </motion.div>
        <div className="credibility-copy">
          <p>
            Orqen works across the systems your business already depends on. Agents carry
            context between tools, leave an audit trail, and ask for approval when the
            decision is yours.
          </p>
          <div className="integration-row">
            {["Slack", "Notion", "HubSpot", "Google", "API"].map((name) => (
              <Card key={name} className="integration-card">
                <CardContent className="p-0">{name}</CardContent>
              </Card>
            ))}
          </div>
          <a
            href="https://www.linkedin.com/in/sameer-walikar/"
            target="_blank"
            rel="noreferrer"
            className="founder-proof"
          >
            <img src="/sameer.jpeg" alt="Sameer Walikar" />
            <span>
              <b>Talk to the people building Orqen</b>
              <small>For teams with serious work to automate.</small>
            </span>
            <ChevronRight size={17} />
          </a>
        </div>
      </section>

      <section className="editorial-section cards-section" id="teams">
        <motion.div {...inView}>
          <p className="editorial-eyebrow">05 — TEAMS, ALREADY AT WORK</p>
          <h2>
            Different work.
            <br />
            <em>Same operating system.</em>
          </h2>
        </motion.div>
        <div className="workflow-cards">
          <Card className="workflow-card card-research">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div>
                <p>MARKET INTELLIGENCE</p>
                <h3>Watch the market while your team sleeps.</h3>
              </div>
              <div>
                <div className="workflow-card-flow">
                  <span>Monitor</span>
                  <i />
                  <span>Compare</span>
                  <i />
                  <span>Brief</span>
                </div>
                <small>Competitor movement → decision-ready weekly report</small>
              </div>
            </CardContent>
          </Card>
          <Card className="workflow-card card-ops">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div>
                <p>OPERATIONS</p>
                <h3>Move an exception from signal to resolution.</h3>
              </div>
              <div>
                <div className="workflow-card-flow">
                  <span>Detect</span>
                  <i />
                  <span>Investigate</span>
                  <i />
                  <span>Resolve</span>
                </div>
                <small>Operational anomaly → team notification and next action</small>
              </div>
            </CardContent>
          </Card>
          <Card className="workflow-card card-growth">
            <CardContent className="flex h-full flex-col justify-between p-6">
              <div>
                <p>GROWTH</p>
                <h3>Turn a customer moment into momentum.</h3>
              </div>
              <div>
                <div className="workflow-card-flow">
                  <span>Listen</span>
                  <i />
                  <span>Shape</span>
                  <i />
                  <span>Launch</span>
                </div>
                <small>Customer feedback → aligned campaign and deliverables</small>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="editorial-final">
        <p className="editorial-eyebrow">ORQEN OPERATING SYSTEM</p>
        <h2>
          Describe it.
          <br />
          <em>Consider it done.</em>
        </h2>
        <p>Give your most important work more than one mind.</p>
        <button onClick={start} className="editorial-primary">
          Start your first workflow <ArrowRight size={17} />
        </button>
      </section>
    </main>
  );
};

export default LandingExperience;
