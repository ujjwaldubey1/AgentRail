export function Hero() {
  return (
    <section className="wrap hero" id="home">
      <div className="floaters">
        <div className="blob lock">
          <div className="lock-face">🔒</div>
        </div>
        <div className="blob globe">
          <div className="globe-ring">◎</div>
        </div>
        <div className="blob lime">
          <div className="smile">☺</div>
        </div>
        <div className="blob purple" />
      </div>
      <h1>Agents shouldn’t execute blindly</h1>
      <p>
        AgentRail is a BOT Chain control plane: Read → Simulate → Execute → Verify. The
        agent never holds the treasury.
      </p>
      <a className="pill" href="#app">
        Open the rail
      </a>
    </section>
  );
}
