import { Terminal } from "@/components/ui/terminal";

export function TerminalDemo() {
  return (
    <section className="w-full py-10 md:py-20">
      <Terminal
        commands={[
          "orqen init --workspace growth",
          "orqen workflow create market-brief",
          "orqen agents deploy research,strategy,writing",
          "orqen run --approve-on-critical",
        ]}
        outputs={{
          0: [
            "✔ Connected Slack, Notion, HubSpot.",
            "✔ Workspace ready. 3 seats provisioned.",
          ],
          1: [
            "✔ Workflow drafted from customer feedback.",
            "✔ Decision log attached.",
          ],
          2: [
            "✔ Research agent monitoring signals.",
            "✔ Strategy and writing agents standing by.",
          ],
          3: [
            "✔ Launch brief delivered to #product-launch.",
            "✔ Review requested from leadership.",
          ],
        }}
        typingSpeed={42}
        delayBetweenCommands={1100}
      />
    </section>
  );
}
