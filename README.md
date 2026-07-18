# Veronime 🌐

Website nonton anime futuristik dengan tampilan holographic elegan.

## Tech Stack
- **Frontend:** React 18 + Vite + Tailwind CSS 3
- **Backend:** Vercel Serverless Functions (Node.js)
- **Scraping:** Axios + Cheerio (Inertia.js `data-page` payload)
- **Source:** [AnibiPlay](https://anibiplay.net) — anime, manga & novel sub Indo
- **Stream:** Mirror embed multi-server (odstream, filelions, mega, dll)

## Fitur
1. **Homepage sections** — semua section dari sumber (ongoing, update terbaru, populer, rekomendasi, manga populer, novel, dst) otomatis terender
2. **Anime detail & episode lengkap** — sinopsis, studio, genre, trailer + daftar semua episode
3. **Video stream embed** — mirror per kualitas (480P/720P/default), auto mode `<video>` untuk file direct & `<iframe>` untuk embed host, prev/next episode, daftar link download
4. **Search anime & manga (& novel)** — satu endpoint untuk semua kategori, hasil manga/novel dibuka di situs sumber
5. **Explore paginated catalog** — support `page`, `type`, `status`, `sort`, `search`, dan multi-`genres` filter dengan URL yang shareable
6. **Global proxy** — request scraper bisa lewat proxy (env `ANIBIPLAY_PROXY`), plus endpoint `/api/proxy` untuk media

Konfigurasi proxy via environment variable (salah satu):
`ANIBIPLAY_PROXY`, `SCRAPE_PROXY`, `PROXY_URL`, `HTTPS_PROXY`
Format: `http://user:pass@host:port`

> **PENTING:** anibiplay.net memblokir IP datacenter Vercel (403). Set salah satu
> proxy di atas (proxy non-AWS) agar scraping production jalan.

Alternatif tanpa proxy: **relay fetch template** — `ANIBIPLAY_FETCH_PROXY`
berisi URL template dengan placeholder `%s` (contoh Cloudflare Workers:
`https://namaworker.workers.dev/?u=%s`). Dipakai otomatis saat request
langsung gagal (403/5xx/timeout).

Kustom base URL sumber: `ANIBIPLAY_BASE` (default `https://anibiplay.net`).

## API Endpoints
| Endpoint | Keterangan |
| --- | --- |
| `GET /api/home` | Semua section homepage + hero |
| `GET /api/detail?slug=...` | Detail anime + daftar episode lengkap |
| `GET /api/episode?slug=...&ep=...` | Mirror stream, download, prev/next |
| `GET /api/search?q=...` | Search anime, manga & novel |
| `GET /api/explore?page=&type=&status=&sort=&search=&genres=` | Katalog paginated + filters |
| `GET /api/genres` | Daftar genre (cached) |
| `GET /api/proxy?url=...` | Media proxy (gambar/video, support Range) |
| `GET /api/debug?what=home\|detail\|episode\|explore\|search\|proxy` | Raw props sumber (util dev) |

## Struktur Project
```
veronime/
├── api/                    # CUMA 1 Vercel Serverless Function (aman kuota Hobby)
│   ├── [...path].js        # Catch-all router: /api/<route>
│   └── _lib/               # (folder _ tidak dihitung function)
│       ├── handlers.js     # Semua handler: home/detail/episode/search/explore/genres/proxy/debug
│       ├── anibiplay.js    # Scraper AnibiPlay (Inertia payload)
│       ├── normalize.js    # Normalisasi data ke bentuk kanonik
│       └── http.js         # CORS + TTL cache + helper
├── src/
│   ├── components/
│   │   ├── Navbar.jsx      # Navbar + search dropdown (anime/manga/novel)
│   │   ├── AnimeCard.jsx   # Card 3D holographic tilt + badge kategori
│   │   ├── AnimeRow.jsx    # Horizontal scroll row
│   │   └── VideoPlayer.jsx # HTML5 player + mode embed iframe
│   ├── pages/
│   │   ├── Home.jsx        # Semua section dari sumber
│   │   ├── AnimeDetail.jsx # Detail + player + mirror + episode list
│   │   ├── BrowsePage.jsx  # Terbaru / Populer / Movie / Complete
│   │   ├── ExplorePage.jsx # Katalog + filter lengkap + pagination
│   │   └── SearchPage.jsx  # Hasil pencarian dengan tab kategori
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
