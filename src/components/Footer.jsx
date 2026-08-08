export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <span>&copy; {new Date().getFullYear()} Mahesh Natarajan</span>
        <nav className="footer-links">
          <a href="/quiz-app/">Quiz App</a>
          <a href="/trains/">Trains</a>
          <a href="/countries/">Countries</a>
          <a href="/temples/">Temples</a>
        </nav>
      </div>
    </footer>
  )
}
