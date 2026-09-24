import { useRef, useState } from 'react'

const ICON = {
  Novel: '📕',
  Teknologi: '💻',
  Sejarah: '🏛️',
  Filsafat: '🧠',
  Pendidikan: '🎓',
  'Pengembangan Diri': '🌱',
}

/**
 * Pratinjau sampul buku 3D (hardcover) yang bisa diputar dengan
 * klik + geser. Sisi buku disusun dengan transform 3D murni:
 * sampul depan, punggung, sisi dalam (halaman), dan belakang.
 */
export default function BookPreview3D({ title, author, year, kategori, image }) {
  const [rot, setRot] = useState({ x: 8, y: -28 })
  const drag = useRef(null)

  const handleDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, x: rot.x, y: rot.y }
  }

  const handleMove = (e) => {
    if (!drag.current) return

    const start = drag.current
    const y = start.y + (e.clientX - start.px) * 0.45
    const x = Math.max(-24, Math.min(30, start.x - (e.clientY - start.py) * 0.3))

    setRot({ x, y })
  }

  const handleUp = (e) => {
    drag.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* pointer mungkin sudah dilepas */
    }
  }

  const heading = title || 'Judul Buku'
  const sub = [author || 'Penulis', year].filter(Boolean).join(' · ')

  return (
    <div className="bp3d-stage">
      <div className="bp3d-float">
        <div
          className="bp3d"
          style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)` }}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
          role="img"
          aria-label={`Pratinjau sampul buku ${heading}`}
        >
          <div className="bp3d-face bp3d-front">
            {image ? (
              <img src={image} alt="" draggable={false} />
            ) : (
              <span className="bp3d-emoji">{ICON[kategori] || '📘'}</span>
            )}
            <span className="bp3d-gloss" aria-hidden="true" />
            <span className="bp3d-meta">
              <strong>{heading}</strong>
              <small>{sub}</small>
            </span>
          </div>

          <div className="bp3d-face bp3d-spine" aria-hidden="true">
            <span>{heading}</span>
          </div>

          <div className="bp3d-face bp3d-edge" aria-hidden="true" />
          <div className="bp3d-face bp3d-back" aria-hidden="true" />
        </div>
      </div>

      <p className="bp3d-hint">👆 Klik dan geser untuk memutar</p>
    </div>
  )
}
