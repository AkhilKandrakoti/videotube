# 🎬 VideoTube

> A production-quality YouTube clone built with React + YouTube Data API v3. Live, fully functional, and deployed on Vercel.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-videotube--nine.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://videotube-nine.vercel.app)
[![GitHub](https://img.shields.io/badge/GitHub-AkhilKandrakoti%2Fvideotube-181717?style=for-the-badge&logo=github)](https://github.com/AkhilKandrakoti/videotube)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev)

---

## 🌐 Live Demo

**→ [https://videotube-nine.vercel.app](https://videotube-nine.vercel.app)**

No login required to browse. Click **Sign In** to unlock history, liked videos, playlists, and subscriptions (all stored in your browser).

---

## 📸 Screenshots

| Home Feed | Watch Page | Shorts |
|-----------|------------|--------|
| Real YouTube videos with infinite scroll | Full player with real comments | TikTok-style vertical snap scroll |

| Analytics Dashboard | Playlists | Channel Page |
|---------------------|-----------|--------------|
| Charts, demographics, traffic sources | Create & manage playlists | Full channel with all videos |

---

## ✨ Features

### 🎥 Video
- **Real YouTube videos** — powered by YouTube Data API v3
- **Infinite scroll** — loads 20+ videos at a time, more as you scroll
- **Video player** — YouTube iframe embed with autoplay
- **Real comments** — fetched live from YouTube
- **Related videos** sidebar on watch page
- **Video duration** badges on thumbnails
- **HD thumbnail** preview on hover

### 🔍 Search
- **Smart search bar** with real-time suggestions (debounced, 350ms)
- **Trending searches** shown when search bar is empty and focused
- **✕ Clear button** — clears search and returns to previous page
- **Escape key** — same as clear button
- **Enter key** — submits search
- **/ key** — focuses the search bar from anywhere
- **Voice search** — microphone button using Web Speech API

### 📱 Pages
| Page | Description |
|------|-------------|
| 🏠 Home | Category-filtered video feed with infinite scroll |
| 🔥 Trending | Top 50 trending videos ranked with stats |
| 🔴 Live | Live & recent streams with viewer count badges |
| 🔍 Search | Full search results with infinite scroll |
| 📺 Channel | Full channel page — banner, stats, all videos, About tab |
| 🎬 Shorts | Vertical snap-scroll reel like YouTube Shorts |
| 📊 Analytics | Creator dashboard with charts and audience data |
| 📋 Playlists | Create, manage, and organize video playlists |
| 📜 History | Auto-saved watch history with remove/clear |
| 👍 Liked Videos | All liked videos saved to browser |
| ⏰ Watch Later | Save videos to watch later |
| 📢 Subscriptions | Subscribe to channels, view their latest videos |
| ⬆️ Upload Studio | 4-stage upload wizard (UI demo) |

### 🎬 Shorts (YouTube-style)
- One video per screen — full viewport height
- **↑ ↓ arrow keys** navigate between shorts
- **Swipe up/down** on mobile (touch snap scroll)
- **↑ ↓ buttons** in the top bar
- Only the active video plays — others show thumbnail (saves API quota)
- Progress dots on the left edge show position
- IntersectionObserver detects which short is in view

### 📊 Analytics Dashboard
- Views & subscribers bar charts (last 7 days)
- Audience demographics (age breakdown with progress bars)
- Traffic sources (Search, Suggested, Direct, Browse)
- Top performing videos table (CTR, views, likes)
- All data is realistic and reactive

### 👤 User System (Frontend Auth)
- Sign In / Sign Up UI with form validation
- "Continue with Google" (demo mode — instant login)
- User avatar with initials
- All user data persisted in **localStorage**:
  - Watch history (last 100 videos)
  - Liked videos
  - Watch Later list
  - Subscriptions (with channel names)
  - Playlists (with video lists)
- Sign Out clears session

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `/` | Focus search bar |
| `?` | Show keyboard shortcuts help |
| `Escape` | Clear search / close modals |
| `↑` / `↓` | Navigate Shorts (when on Shorts page) |

### 🌙 UI/UX
- **Dark / Light mode** toggle — persists across sessions
- **Collapsible sidebar** — hamburger menu collapses to icons
- **Subscriptions list** in sidebar (after subscribing to channels)
- **Notification panel** dropdown
- **Loading skeletons** — animated shimmer while content loads
- **Responsive** — works on desktop, tablet, and mobile
- **Mobile bottom nav** — 5-tab navigation bar on small screens
- **Category pills** — filter home feed by topic (sticky, horizontal scroll)
- **Add to Playlist** modal — save any video to any playlist from watch page

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 with Hooks |
| **Build Tool** | Vite 5 |
| **Styling** | Inline styles (no CSS framework — pure JS) |
| **Fonts** | DM Sans + DM Mono (Google Fonts) |
| **API** | YouTube Data API v3 |
| **Auth** | Frontend-only (localStorage) |
| **State** | useState / useEffect / useCallback / useRef |
| **Routing** | Single-page app (state-based routing, no React Router) |
| **Deployment** | Vercel (auto-deploy from GitHub) |
| **Storage** | localStorage for user data persistence |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A YouTube Data API v3 key ([get one here](https://console.cloud.google.com))

### Installation

```bash
# Clone the repository
git clone https://github.com/AkhilKandrakoti/videotube.git
cd videotube

# Install dependencies
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
```

> ⚠️ Never commit your `.env` file. It's already in `.gitignore`.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🔑 YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (e.g. `videotube`)
3. Enable **YouTube Data API v3**
4. Create an **API Key** under Credentials
5. Restrict the key:
   - Application: **HTTP referrers (websites)**
   - Add: `https://videotube-nine.vercel.app/*` and `http://localhost:5173/*`
   - API restriction: **YouTube Data API v3**
6. Add the key to Vercel:
   - Go to your Vercel project → Settings → Environment Variables
   - Name: `VITE_YOUTUBE_API_KEY`
   - Value: your key

### API Quota Usage
| Action | Units Used |
|--------|-----------|
| Search (20 results) | 100 units |
| Video details (per batch) | 1 unit |
| Comments | 1 unit |
| Channel info | 1 unit |
| Trending videos | 1 unit |
| **Daily free quota** | **10,000 units** |

~100 searches per day on the free tier.

---

## 📁 Project Structure

```
videotube/
├── public/
│   └── vite.svg
├── src/
│   ├── App.jsx          ← entire application (single-file architecture)
│   ├── main.jsx         ← React entry point
│   └── index.css        ← minimal global reset
├── .env                 ← VITE_YOUTUBE_API_KEY (not committed)
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

The entire app lives in **one file** (`src/App.jsx`) — a deliberate architectural choice that makes it easy to read, deploy, and demonstrate in interviews.

---

## 🏗️ Architecture

### State Management
No external state library. All state is managed with React's built-in hooks:

```
App (root)
├── page state          → controls which page renders
├── user state          → auth / profile
├── history state       → watch history array
├── liked state         → liked videos array
├── watchLater state    → watch later array
├── subs state          → subscriptions array
└── playlists state     → playlists with videos
```

### Routing
State-based routing — no React Router. The `page` state string controls which component renders:

```jsx
const renderPage = () => {
  switch(page) {
    case "home":          return <HomePage />;
    case "watch":         return <WatchPage />;
    case "channel":       return <ChannelPage />;
    case "trending":      return <TrendingPage />;
    case "shorts":        return <ShortsPage />;
    case "analytics":     return <AnalyticsPage />;
    case "playlists":     return <PlaylistsPage />;
    // ...etc
  }
};
```

### Data Flow
```
YouTube API v3
      ↓
  ytFetch()          ← generic fetch wrapper with error handling
      ↓
  getDetails()       ← enriches search results with stats + duration
      ↓
  Page Component     ← renders videos, handles infinite scroll
      ↓
  VideoCard          ← reusable card (full or compact mode)
```

### Infinite Scroll
Uses `IntersectionObserver` to detect when the loader div enters the viewport:

```jsx
const obs = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && nextToken && !loadingMore) {
    load(false, nextToken); // fetch next page
  }
}, { threshold: 0.1 });
obs.observe(loaderRef.current);
```

---

## 📦 Key Components

| Component | Description |
|-----------|-------------|
| `VideoCard` | Reusable video card — supports `compact` mode for sidebar |
| `Sidebar` | Collapsible nav with subscriptions list |
| `HomePage` | Category pills + infinite scroll grid |
| `WatchPage` | Player + comments + related sidebar |
| `ChannelPage` | Full channel with banner, stats, video grid |
| `TrendingPage` | Ranked list with infinite scroll |
| `ShortsPage` | Vertical snap-scroll with IntersectionObserver |
| `SearchPage` | Search results with infinite scroll |
| `AnalyticsPage` | Charts + demographics + top videos table |
| `PlaylistsPage` | CRUD playlists with video management |
| `HistoryPage` | Watch history with remove + clear |
| `SavedPage` | Reusable for Liked Videos and Watch Later |
| `SubsPage` | Latest videos from subscribed channels |
| `LoginPage` | Sign in/up form + Google demo button |
| `UploadPage` | 4-stage upload wizard (UI demo) |
| `ShortcutsModal` | Keyboard shortcuts overlay |
| `AddToPlaylistModal` | Save video to playlist modal |

---

## 🚀 Deployment

Deployed on **Vercel** with automatic CI/CD:

1. Every `git push` to `main` triggers a new deployment
2. Vercel builds with `npm run build`
3. Environment variables are set in Vercel dashboard (not in code)
4. CDN serves the static assets globally

### Deploy Your Own

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AkhilKandrakoti/videotube)

1. Click the button above
2. Connect your GitHub
3. Add `VITE_YOUTUBE_API_KEY` in environment variables
4. Deploy!

---

## 🔮 Roadmap

The frontend is complete. Next phase is building a real backend:

- [ ] **Node.js + Express** REST API
- [ ] **MongoDB** for users, history, playlists
- [ ] **JWT authentication** (replace localStorage auth)
- [ ] **Video upload** to AWS S3 / Cloudflare R2
- [ ] **FFmpeg** transcoding pipeline (720p, 1080p, 4K)
- [ ] **HLS streaming** with adaptive bitrate
- [ ] **Redis** caching for trending / search
- [ ] **WebSockets** for real live chat
- [ ] **Push notifications** for new uploads from subscriptions
- [ ] **TypeScript** migration

---

## 🤝 Contributing

Pull requests are welcome!

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "add: your feature description"
git push origin feature/your-feature
# Open a PR on GitHub
```

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 👨‍💻 Author

**Akhil Kandrakoti**
- GitHub: [@AkhilKandrakoti](https://github.com/AkhilKandrakoti)
- Live Project: [videotube-nine.vercel.app](https://videotube-nine.vercel.app)

---

<div align="center">
  <strong>Built with ❤️ using React + YouTube API</strong><br/>
  <a href="https://videotube-nine.vercel.app">🌐 Live Demo</a> · 
  <a href="https://github.com/AkhilKandrakoti/videotube/issues">🐛 Report Bug</a> · 
  <a href="https://github.com/AkhilKandrakoti/videotube/issues">✨ Request Feature</a>
</div>
