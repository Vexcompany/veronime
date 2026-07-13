# Veronime 🌐

Website nonton anime futuristik dengan tampilan holographic elegan.

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS 3
- **Backend:** Vercel Serverless Functions (Node.js)
- **Scraping:** Axios + Cheerio
- **Source:** Samehadaku (v2.samehadaku.how)
- **Stream:** Pixeldrain via API

## Struktur Project
```
veronime/
├── api/                    # Vercel Serverless Functions
│   ├── anime-list.js       # Daftar anime (ongoing/popular/movie)
│   ├── anime-detail.js     # Detail anime + daftar episode
│   ├── stream.js           # Ekstrak URL stream Pixeldrain
│   ├── episode-detail.js   # Detail episode + semua sumber
│   └── search.js           # Pencarian anime
├── src/
│   ├── components/
│   │   ├── Navbar.jsx      # Navbar + search dropdown
│   │   ├── AnimeCard.jsx   # Card 3D holographic tilt
│   │   ├── AnimeRow.jsx    # Horizontal scroll row
│   │   └── VideoPlayer.jsx # Custom HTML5 video player
│   ├── pages/
│   │   ├── Home.jsx        # Homepage + hero section
│   │   ├── AnimeDetail.jsx # Halaman detail + player + episode list
│   │   ├── BrowsePage.jsx  # Browse by category
│   │   └── SearchPage.jsx  # Halaman hasil pencarian
│   └── utils/
│       └── api.js          # Fetch ke serverless functions
├── vercel.json             # Konfigurasi Vercel
└── tailwind.config.js
```

## Cara Deploy ke Vercel

1. **Push ke GitHub:**
   ```bash
   git init
   git add .
   git commit -m "init veronime"
   git remote add origin https://github.com/username/veronime
   git push -u origin main
   ```

2. **Connect ke Vercel:**
   - Buka [vercel.com](https://vercel.com)
   - Import repository
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Install dependency API:**
   Vercel otomatis install dari `api/package.json`

## Development Lokal

```bash
# Install frontend deps
npm install

# Install vercel CLI
npm i -g vercel

# Run dev (termasuk serverless functions)
vercel dev
```

> **Catatan:** `npm run dev` biasa hanya menjalankan frontend Vite saja.
> Untuk menjalankan API functions juga, gunakan `vercel dev`.

## Cara Kerja Scraping

```
User klik anime → /api/anime-detail?slug=xxx
                → Scrape v2.samehadaku.how/xxx/
                → Return: title, image, synopsis, genres, episode list

User klik episode → /api/stream?url=https://v2.samehadaku.how/xxx-episode-N/
                  → Scrape halaman episode
                  → Cari link Pixeldrain (.download-eps)
                  → Return: https://pixeldrain.com/api/file/{ID}

Video player → <video src="https://pixeldrain.com/api/file/{ID}">
```

## Troubleshooting

- **Selector berubah:** Samehadaku sering update HTML. Cek dan update selector di `api/anime-list.js` dan `api/anime-detail.js`
- **Episode tidak muncul:** Update selector `#list-eps li a` di `api/anime-detail.js`
- **Stream tidak jalan:** Cek link Pixeldrain masih aktif. Update selector `.download-eps` di `api/stream.js`
- **CORS error di dev:** Gunakan `vercel dev` bukan `npm run dev`
