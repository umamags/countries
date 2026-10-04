export default function FlagModal({ flag, countryName, onClose }) {
  if (!flag) return null

  return (
    <div className="video-modal-backdrop" onClick={onClose}>
      <div className="flag-modal" onClick={(e) => e.stopPropagation()}>
        <div className="video-modal-header">
          <span className="video-modal-title">{countryName} Flag</span>
          <button type="button" className="video-modal-close" onClick={onClose} aria-label="Close flag">
            ×
          </button>
        </div>
        <img src={flag.image_large} alt={`Flag of ${countryName}`} className="flag-image-large" />
      </div>
    </div>
  )
}
