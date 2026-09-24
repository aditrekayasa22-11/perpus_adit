import { useState } from 'react'

const TONE = {
  Novel: 'c-rose',
  Teknologi: 'c-blue',
  Sejarah: 'c-amber',
  Filsafat: 'c-violet',
  Pendidikan: 'c-green',
  'Pengembangan Diri': 'c-teal',
}

const ICON = {
  Novel: '📕',
  Teknologi: '💻',
  Sejarah: '🏛️',
  Filsafat: '🧠',
  Pendidikan: '🎓',
  'Pengembangan Diri': '🌱',
}

/**
 * Sampul buku mini.
 *
 * Bila buku punya gambar sampul (`src`), gambar itu yang ditampilkan;
 * selain itu memakai emoji + warna kategori.
 */
export default function Cover({ kategori = '', size = 'md', src = '' }) {
  const [failed, setFailed] = useState(false)
  const tone = TONE[kategori] || 'c-slate'
  const icon = ICON[kategori] || '📘'

  if (src && !failed) {
    return (
      <span className={`cover ${size} ${tone}`}>
        <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />
      </span>
    )
  }

  return (
    <span className={`cover ${size} ${tone}`} aria-hidden="true">
      {icon}
    </span>
  )
}
