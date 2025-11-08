import './App.css'

function App() {
  return (
    <main className="page">
      <header className="masthead">
        <a className="brand" href="/">
          Impious
        </a>
      </header>

      <section className="hero">
        <h1>Impious</h1>
        <p>Social deduction for the curiously defiant.</p>
        <div className="actions">
          <a className="button primary" href="https://game.impious.io">
            Play (alpha)
          </a>
          <a className="button" href="https://game.impious.io/health">
            Game health
          </a>
          <a className="button" href="/changelog.html">
            Changelog
          </a>
        </div>
      </section>

      <footer className="footer">
        <a href="mailto:hello@impious.io">Contact</a>
        <span aria-hidden="true">•</span>
        <a href="https://github.com/impious-io" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </footer>
    </main>
  )
}

export default App
