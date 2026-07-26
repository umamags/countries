import { Route, Routes } from 'react-router-dom'
import { IndexProvider } from './data/IndexContext'
import { FavoritesProvider } from './data/FavoritesContext'
import Layout from './components/Layout'
import ContinentsPage from './pages/ContinentsPage'
import CountryListPage from './pages/CountryListPage'
import CountryDetailPage from './pages/CountryDetailPage'
import LandmarkDetailPage from './pages/LandmarkDetailPage'
import './App.css'

export default function App() {
  return (
    <IndexProvider>
      <FavoritesProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ContinentsPage />} />
            <Route path="continent/:continentSlug" element={<CountryListPage />} />
            <Route path="continent/:continentSlug/country/:countrySlug" element={<CountryDetailPage />} />
            <Route
              path="continent/:continentSlug/country/:countrySlug/landmark/:landmarkSlug"
              element={<LandmarkDetailPage />}
            />
          </Route>
        </Routes>
      </FavoritesProvider>
    </IndexProvider>
  )
}
