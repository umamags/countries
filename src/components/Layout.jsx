import { Link, Outlet } from 'react-router-dom'
import SearchBox from './SearchBox'
import Footer from './Footer'

export default function Layout() {
  return (
    <>
      <header className="site-header">
        <Link to="/" className="site-title">
          Countries Explorer
        </Link>
        <div className="header-controls">
          <SearchBox />
          <Link to="/compare" className="compare-button">
            Compare Countries
          </Link>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
