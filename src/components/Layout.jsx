import { Link, Outlet } from 'react-router-dom'
import SearchBox from './SearchBox'

export default function Layout() {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="site-title">
          Countries Explorer
        </Link>
        <SearchBox />
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>© Mahesh Natarajan · v1.0 · July 2026</p>
      </footer>
    </>
  )
}
