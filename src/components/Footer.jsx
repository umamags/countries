export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} <a href="https://ai-lab.in">Mahesh Natarajan</a></p>
        <nav className="footer-links">
          <a href="/quiz-app">
            Quiz App
          </a>
          <a href="/trains">
            Trains
          </a>
          <a href="/countries">
            Countries
          </a>
          <a href="/temples">
            Temples
          </a>
          <a href="/education">
            Education
          </a>
        </nav>
      </div>
    </footer>
  )
}
