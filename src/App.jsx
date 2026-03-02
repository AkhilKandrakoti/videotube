import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// YOUTUBE API CONFIG — reads from environment variable
// ============================================================
const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YT_BASE = "https://www.googleapis.com/youtube/v3";

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const formatViews = (n) => {
  if (!n) return "0";
  const num = parseInt(n);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
};

const formatDuration = (iso) => {
  if (!iso) return "0:00";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  const h = parseInt(match[1] || 0);
  const m = parseInt(match[2] || 0);
  const s = parseInt(match[3] || 0);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
};

const CATEGORIES = ["All", "JavaScript", "React", "Python", "System Design", "DevOps", "Machine Learning", "CSS", "Node.js", "TypeScript", "Cloud", "Web Dev"];

const avatarColors = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444", "#8b5cf6", "#06b6d4"];
const getColor = (str) => avatarColors[(str || "").charCodeAt(0) % avatarColors.length];
const getInitials = (name) => (name || "??").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

// ============================================================
// YOUTUBE API CALLS
// ============================================================
const searchVideos = async (query, maxResults = 20) => {
  const res = await fetch(`${YT_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${API_KEY}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.items || [];
};

const getVideoDetails = async (videoIds) => {
  const ids = videoIds.join(",");
  const res = await fetch(`${YT_BASE}/videos?part=snippet,statistics,contentDetails&id=${ids}&key=${API_KEY}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.items || [];
};

const getTrendingVideos = async (maxResults = 20) => {
  const res = await fetch(`${YT_BASE}/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=US&maxResults=${maxResults}&key=${API_KEY}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.items || [];
};

const getVideoComments = async (videoId) => {
  const res = await fetch(`${YT_BASE}/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&key=${API_KEY}`);
  const data = await res.json();
  if (data.error) return [];
  return data.items || [];
};

const getRelatedVideos = async (videoId) => {
  const res = await fetch(`${YT_BASE}/search?part=snippet&relatedToVideoId=${videoId}&type=video&maxResults=10&key=${API_KEY}`);
  const data = await res.json();
  if (data.error) return [];
  return data.items || [];
};

// ============================================================
// COMPONENTS
// ============================================================

// Loading Skeleton
const Skeleton = ({ w, h, radius = 8 }) => (
  <div style={{
    width: w, height: h, borderRadius: radius,
    background: "linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
  }} />
);

// Video Card
const VideoCard = ({ video, onClick, compact = false, darkMode }) => {
  const [hovered, setHovered] = useState(false);
  const snippet = video.snippet || {};
  const stats = video.statistics || {};
  const details = video.contentDetails || {};
  const videoId = video.id?.videoId || video.id;
  const thumb = snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "";
  const channelName = snippet.channelTitle || "Unknown";
  const title = snippet.title || "Untitled";
  const views = stats.viewCount;
  const publishedAt = snippet.publishedAt;
  const duration = formatDuration(details.duration);

  const cardBg = darkMode ? (hovered ? "rgba(255,255,255,0.05)" : "transparent") : (hovered ? "rgba(0,0,0,0.04)" : "transparent");

  if (compact) {
    return (
      <div onClick={() => onClick(video)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ display: "flex", gap: 10, cursor: "pointer", padding: "8px 6px", borderRadius: 10, transition: "background 0.15s", background: cardBg }}>
        <div style={{ position: "relative", width: 130, height: 73, flexShrink: 0, borderRadius: 8, overflow: "hidden", background: "#1a1a2e" }}>
          {thumb && <img src={thumb} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          {duration && <div style={{ position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.85)", color: "#fff", fontSize: 10, fontWeight: 600, padding: "1px 5px", borderRadius: 3 }}>{duration}</div>}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: darkMode ? "#f0f0f0" : "#0f0f0f", lineHeight: 1.4, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</div>
          <div style={{ fontSize: 11, color: darkMode ? "#888" : "#606060", marginBottom: 2 }}>{channelName}</div>
          <div style={{ fontSize: 11, color: darkMode ? "#666" : "#808080" }}>{views ? `${formatViews(views)} views` : ""} {publishedAt ? `· ${formatDate(publishedAt)}` : ""}</div>
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => onClick(video)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer", borderRadius: 12, transition: "transform 0.2s", transform: hovered ? "translateY(-2px)" : "translateY(0)" }}>
      <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", background: "#1a1a2e", paddingTop: "56.25%" }}>
        {thumb && <img src={thumb} alt={title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        {duration && <div style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.85)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "2px 6px", borderRadius: 4 }}>{duration}</div>}
      </div>
      <div style={{ padding: "10px 4px 8px", display: "flex", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: getColor(channelName), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {getInitials(channelName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: darkMode ? "#f0f0f0" : "#0f0f0f", lineHeight: 1.45, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{title}</div>
          <div style={{ fontSize: 12, color: darkMode ? "#8a8a9a" : "#606060", marginBottom: 2 }}>{channelName}</div>
          <div style={{ fontSize: 12, color: darkMode ? "#666" : "#808080" }}>{views ? `${formatViews(views)} views` : ""} {publishedAt ? `· ${formatDate(publishedAt)}` : ""}</div>
        </div>
      </div>
    </div>
  );
};

// Search Bar
const SearchBar = ({ value, onChange, onSearch, darkMode }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", flex: 1, maxWidth: 580 }}>
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        background: focused ? (darkMode ? "rgba(255,255,255,0.08)" : "#fff") : (darkMode ? "rgba(255,255,255,0.04)" : "#f8f8f8"),
        border: `1px solid ${focused ? "rgba(99,102,241,0.6)" : (darkMode ? "rgba(255,255,255,0.1)" : "#e0e0e0")}`,
        borderRadius: "24px 0 0 24px", overflow: "hidden", transition: "all 0.2s",
        boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.15)" : "none"
      }}>
        <input value={value} onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          onKeyDown={e => e.key === "Enter" && onSearch()}
          placeholder="Search videos, channels, topics..."
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: darkMode ? "#f0f0f0" : "#0f0f0f", fontSize: 14, padding: "10px 16px" }}
        />
      </div>
      <button onClick={onSearch} style={{
        background: darkMode ? "rgba(255,255,255,0.07)" : "#f0f0f0",
        border: `1px solid ${darkMode ? "rgba(255,255,255,0.1)" : "#e0e0e0"}`,
        borderLeft: "none", borderRadius: "0 24px 24px 0", padding: "10px 18px",
        cursor: "pointer", color: darkMode ? "#c0c0d0" : "#606060", display: "flex", alignItems: "center"
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      </button>
    </div>
  );
};

// Sidebar
const Sidebar = ({ collapsed, currentPage, onNavigate, darkMode }) => {
  const navItems = [
    { id: "home", label: "Home", icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" },
    { id: "trending", label: "Trending", icon: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" },
    { id: "live", label: "Live", icon: "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" },
    { id: "subscriptions", label: "Subscriptions", icon: "M20 8H4V6h16v2zm-2-6H6v2h12V2zm4 10v8l-6-4 6-4zm-8 0H2v8h12v-8z" },
    { id: "library", label: "Library", icon: "M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" },
    { id: "history", label: "History", icon: "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" },
    { id: "upload", label: "Upload Studio", icon: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" },
  ];

  const bg = darkMode ? "#0a0a14" : "#fff";
  const border = darkMode ? "rgba(255,255,255,0.05)" : "#e0e0e0";
  const activeColor = "#6366f1";
  const activeBg = darkMode ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)";
  const textColor = darkMode ? "#a0a0b0" : "#606060";

  if (collapsed) {
    return (
      <div style={{ width: 64, paddingTop: 12, display: "flex", flexDirection: "column", gap: 4, alignItems: "center", borderRight: `1px solid ${border}`, background: bg, flexShrink: 0 }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => onNavigate(item.id)} title={item.label}
            style={{ background: currentPage === item.id ? activeBg : "transparent", border: "none", cursor: "pointer", borderRadius: 10, padding: "10px", color: currentPage === item.id ? activeColor : textColor, transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={item.icon} /></svg>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ width: 220, padding: "12px 8px", borderRight: `1px solid ${border}`, overflowY: "auto", background: bg, flexShrink: 0 }}>
      {navItems.map(item => (
        <button key={item.id} onClick={() => onNavigate(item.id)}
          style={{ width: "100%", background: currentPage === item.id ? activeBg : "transparent", border: "none", cursor: "pointer", borderRadius: 10, padding: "10px 12px", color: currentPage === item.id ? activeColor : textColor, display: "flex", alignItems: "center", gap: 12, fontSize: 13, fontWeight: 500, transition: "all 0.15s", textAlign: "left", marginBottom: 2 }}
          onMouseEnter={e => { if (currentPage !== item.id) e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"; }}
          onMouseLeave={e => { if (currentPage !== item.id) e.currentTarget.style.background = "transparent"; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={item.icon} /></svg>
          {item.label}
          {item.id === "live" && <span style={{ marginLeft: "auto", background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 3 }}>LIVE</span>}
        </button>
      ))}
    </div>
  );
};

// Category Pills
const CategoryPills = ({ selected, onSelect, darkMode }) => (
  <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 0", scrollbarWidth: "none" }}>
    {CATEGORIES.map(cat => (
      <button key={cat} onClick={() => onSelect(cat)}
        style={{ flexShrink: 0, padding: "7px 14px", borderRadius: 24, background: selected === cat ? "#6366f1" : (darkMode ? "rgba(255,255,255,0.07)" : "#f0f0f0"), border: `1px solid ${selected === cat ? "#6366f1" : (darkMode ? "rgba(255,255,255,0.1)" : "#e0e0e0")}`, color: selected === cat ? "#fff" : (darkMode ? "#b0b0c0" : "#0f0f0f"), fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}>
        {cat}
      </button>
    ))}
  </div>
);

// HOME PAGE
const HomePage = ({ onVideoClick, darkMode }) => {
  const [category, setCategory] = useState("All");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const query = category === "All" ? "programming tutorial 2024" : category;
    setLoading(true);
    setError(null);

    if (!API_KEY) {
      setError("YouTube API key not configured. Add VITE_YOUTUBE_API_KEY to your environment.");
      setLoading(false);
      return;
    }

    searchVideos(query, 20)
      .then(async (items) => {
        const ids = items.map(i => i.id?.videoId).filter(Boolean);
        if (ids.length === 0) { setVideos([]); setLoading(false); return; }
        const details = await getVideoDetails(ids);
        setVideos(details);
        setLoading(false);
      })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [category]);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 40px", background: darkMode ? "#0a0a14" : "#f9f9f9" }}>
      <CategoryPills selected={category} onSelect={setCategory} darkMode={darkMode} />
      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "16px 20px", color: "#ef4444", marginBottom: 20 }}>
          ⚠️ {error}
        </div>
      )}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {[...Array(12)].map((_, i) => (
            <div key={i}>
              <Skeleton w="100%" h={158} radius={10} />
              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <Skeleton w={36} h={36} radius={18} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skeleton w="90%" h={14} />
                  <Skeleton w="60%" h={12} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {videos.map(video => <VideoCard key={video.id} video={video} onClick={onVideoClick} darkMode={darkMode} />)}
        </div>
      )}
    </div>
  );
};

// WATCH PAGE
const WatchPage = ({ video, onVideoClick, darkMode }) => {
  const [comments, setComments] = useState([]);
  const [related, setRelated] = useState([]);
  const [liked, setLiked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [commentText, setCommentText] = useState("");

  const snippet = video.snippet || {};
  const stats = video.statistics || {};
  const videoId = video.id?.videoId || video.id;

  useEffect(() => {
    if (!videoId || !API_KEY) return;
    getVideoComments(videoId).then(setComments).catch(() => {});
    getRelatedVideos(videoId)
      .then(async items => {
        const ids = items.map(i => i.id?.videoId).filter(Boolean);
        if (ids.length === 0) return;
        const details = await getVideoDetails(ids);
        setRelated(details);
      }).catch(() => {});
  }, [videoId]);

  const bg = darkMode ? "#0a0a14" : "#f9f9f9";
  const textPrimary = darkMode ? "#f0f0f0" : "#0f0f0f";
  const textSecondary = darkMode ? "#8a8a9a" : "#606060";
  const cardBg = darkMode ? "rgba(255,255,255,0.04)" : "#fff";

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 40px", background: bg }}>
      <div style={{ display: "flex", gap: 28, maxWidth: 1400, flexWrap: "wrap" }}>
        {/* Main */}
        <div style={{ flex: 1, minWidth: 0, minWidth: 320 }}>
          {/* YouTube Embed */}
          <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 12, overflow: "hidden", background: "#000" }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={snippet.title}
            />
          </div>

          {/* Title */}
          <h1 style={{ color: textPrimary, fontSize: 18, fontWeight: 700, marginTop: 16, marginBottom: 12, lineHeight: 1.4 }}>
            {snippet.title}
          </h1>

          {/* Meta */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: getColor(snippet.channelTitle), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>
                {getInitials(snippet.channelTitle)}
              </div>
              <div>
                <div style={{ color: textPrimary, fontSize: 15, fontWeight: 600 }}>{snippet.channelTitle}</div>
              </div>
              <button onClick={() => setSubscribed(s => !s)}
                style={{ padding: "8px 18px", borderRadius: 24, border: "none", cursor: "pointer", background: subscribed ? (darkMode ? "rgba(255,255,255,0.1)" : "#e0e0e0") : "#6366f1", color: subscribed ? textSecondary : "#fff", fontSize: 13, fontWeight: 600, transition: "all 0.2s" }}>
                {subscribed ? "Subscribed ✓" : "Subscribe"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: liked ? `▲ ${formatViews(parseInt(stats.likeCount || 0) + 1)}` : `▲ ${formatViews(stats.likeCount)}`, action: () => setLiked(l => !l), active: liked },
                { label: "↗ Share", action: () => {} },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action}
                  style={{ padding: "8px 14px", borderRadius: 24, background: btn.active ? "rgba(99,102,241,0.25)" : (darkMode ? "rgba(255,255,255,0.07)" : "#f0f0f0"), border: `1px solid ${btn.active ? "rgba(99,102,241,0.5)" : (darkMode ? "rgba(255,255,255,0.1)" : "#e0e0e0")}`, color: btn.active ? "#8b8cf8" : textSecondary, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s" }}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ background: cardBg, borderRadius: 12, padding: "14px 16px", marginBottom: 20, border: darkMode ? "none" : "1px solid #e0e0e0" }}>
            <div style={{ color: textSecondary, fontSize: 13, lineHeight: 1.7 }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, color: textPrimary }}>{formatViews(stats.viewCount)} views</span>
                <span>{formatDate(snippet.publishedAt)}</span>
                <span>💬 {formatViews(stats.commentCount)} comments</span>
              </div>
              {showDesc ? snippet.description : (snippet.description || "").slice(0, 150) + "..."}
            </div>
            <button onClick={() => setShowDesc(s => !s)} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 13, fontWeight: 600, marginTop: 8, padding: 0 }}>
              {showDesc ? "Show less" : "...more"}
            </button>
          </div>

          {/* Comments */}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>
              {formatViews(stats.commentCount)} Comments
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>You</div>
              <div style={{ flex: 1 }}>
                <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..."
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${darkMode ? "rgba(255,255,255,0.15)" : "#e0e0e0"}`, outline: "none", color: textPrimary, fontSize: 14, padding: "8px 0", boxSizing: "border-box" }} />
              </div>
            </div>
            {comments.map(c => {
              const top = c.snippet?.topLevelComment?.snippet || {};
              return (
                <div key={c.id} style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  <img src={top.authorProfileImageUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: "#333" }} onError={e => { e.target.style.display = "none"; }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ color: textPrimary, fontSize: 13, fontWeight: 600 }}>{top.authorDisplayName}</span>
                      <span style={{ color: darkMode ? "#555" : "#909090", fontSize: 12 }}>{formatDate(top.publishedAt)}</span>
                    </div>
                    <div style={{ color: textSecondary, fontSize: 14, lineHeight: 1.6, marginBottom: 6 }}>{top.textDisplay}</div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <span style={{ color: darkMode ? "#888" : "#606060", fontSize: 13 }}>▲ {formatViews(top.likeCount)}</span>
                      <button style={{ background: "none", border: "none", color: darkMode ? "#888" : "#606060", cursor: "pointer", fontSize: 13 }}>Reply</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Related */}
        <div style={{ width: 380, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: darkMode ? "#888" : "#606060", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>Up Next</div>
          {related.length > 0
            ? related.map(v => <VideoCard key={v.id} video={v} onClick={onVideoClick} compact darkMode={darkMode} />)
            : [...Array(6)].map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <Skeleton w={130} h={73} radius={8} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skeleton w="100%" h={12} />
                  <Skeleton w="70%" h={10} />
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

// TRENDING PAGE
const TrendingPage = ({ onVideoClick, darkMode }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!API_KEY) { setLoading(false); return; }
    getTrendingVideos(20).then(v => { setVideos(v); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const bg = darkMode ? "#0a0a14" : "#f9f9f9";
  const textPrimary = darkMode ? "#f0f0f0" : "#0f0f0f";
  const textSecondary = darkMode ? "#8a8a9a" : "#606060";
  const border = darkMode ? "rgba(255,255,255,0.05)" : "#e0e0e0";

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 40px", background: bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 4, height: 28, background: "linear-gradient(180deg, #6366f1, #ec4899)", borderRadius: 2 }} />
        <h2 style={{ color: textPrimary, fontSize: 22, fontWeight: 700, margin: 0 }}>Trending</h2>
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[...Array(8)].map((_, i) => <div key={i} style={{ display: "flex", gap: 16 }}><Skeleton w={200} h={112} radius={10} /><div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}><Skeleton w="80%" h={16} /><Skeleton w="50%" h={12} /></div></div>)}
        </div>
      ) : (
        videos.map((video, i) => {
          const snippet = video.snippet || {};
          const stats = video.statistics || {};
          const thumb = snippet.thumbnails?.medium?.url || "";
          return (
            <div key={video.id} onClick={() => onVideoClick(video)}
              style={{ display: "flex", gap: 16, padding: "14px 0", borderBottom: `1px solid ${border}`, cursor: "pointer" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: i < 3 ? "#6366f1" : (darkMode ? "#333" : "#ccc"), width: 36, textAlign: "center", paddingTop: 4 }}>{i + 1}</div>
              <div style={{ position: "relative", width: 200, height: 112, flexShrink: 0, borderRadius: 10, overflow: "hidden", background: "#1a1a2e" }}>
                {thumb && <img src={thumb} alt={snippet.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: textPrimary, marginBottom: 8, lineHeight: 1.4 }}>{snippet.title}</div>
                <div style={{ fontSize: 13, color: textSecondary, marginBottom: 4 }}>{snippet.channelTitle}</div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: darkMode ? "#666" : "#909090" }}>
                  <span>{formatViews(stats.viewCount)} views</span>
                  <span>{formatDate(snippet.publishedAt)}</span>
                  <span>▲ {formatViews(stats.likeCount)}</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

// SEARCH RESULTS PAGE
const SearchResultsPage = ({ query, onVideoClick, darkMode }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query || !API_KEY) { setLoading(false); return; }
    setLoading(true);
    searchVideos(query, 20)
      .then(async items => {
        const ids = items.map(i => i.id?.videoId).filter(Boolean);
        if (ids.length === 0) { setVideos([]); setLoading(false); return; }
        const details = await getVideoDetails(ids);
        setVideos(details);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, [query]);

  const bg = darkMode ? "#0a0a14" : "#f9f9f9";
  const textPrimary = darkMode ? "#f0f0f0" : "#0f0f0f";
  const textSecondary = darkMode ? "#666" : "#606060";

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 40px", background: bg }}>
      <div style={{ marginBottom: 16, color: textSecondary, fontSize: 14 }}>
        {loading ? "Searching..." : `${videos.length} results for "${query}"`}
      </div>
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[...Array(6)].map((_, i) => <div key={i} style={{ display: "flex", gap: 16 }}><Skeleton w={248} h={140} radius={10} /><div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}><Skeleton w="80%" h={16} /><Skeleton w="40%" h={12} /><Skeleton w="60%" h={12} /></div></div>)}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 900 }}>
          {videos.map(video => {
            const snippet = video.snippet || {};
            const stats = video.statistics || {};
            const thumb = snippet.thumbnails?.medium?.url || "";
            return (
              <div key={video.id} onClick={() => onVideoClick(video)}
                style={{ display: "flex", gap: 16, cursor: "pointer", borderRadius: 12, padding: 8, transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <div style={{ position: "relative", width: 248, height: 140, flexShrink: 0, borderRadius: 10, overflow: "hidden", background: "#1a1a2e" }}>
                  {thumb && <img src={thumb} alt={snippet.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: textPrimary, marginBottom: 8, lineHeight: 1.4 }}>{snippet.title}</div>
                  <div style={{ fontSize: 12, color: textSecondary, marginBottom: 8 }}>{formatViews(stats.viewCount)} views · {formatDate(snippet.publishedAt)}</div>
                  <div style={{ fontSize: 13, color: darkMode ? "#8a8a9a" : "#606060", marginBottom: 8 }}>{snippet.channelTitle}</div>
                  <div style={{ fontSize: 13, color: textSecondary, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{snippet.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// LIVE PAGE
const LivePage = ({ onVideoClick, darkMode }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerCounts] = useState(() => Array.from({ length: 12 }, () => Math.floor(Math.random() * 50000) + 1000));

  useEffect(() => {
    if (!API_KEY) { setLoading(false); return; }
    searchVideos("live stream programming coding", 12)
      .then(async items => {
        const ids = items.map(i => i.id?.videoId).filter(Boolean);
        if (!ids.length) { setLoading(false); return; }
        const details = await getVideoDetails(ids);
        setVideos(details);
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  const bg = darkMode ? "#0a0a14" : "#f9f9f9";
  const textPrimary = darkMode ? "#f0f0f0" : "#0f0f0f";

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 40px", background: bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444", animation: "pulse 1.5s infinite" }} />
        <h2 style={{ color: textPrimary, fontSize: 22, fontWeight: 700, margin: 0 }}>Live Now</h2>
      </div>
      <div style={{ color: darkMode ? "#666" : "#909090", fontSize: 13, marginBottom: 24 }}>Watch live streams from creators around the world</div>
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {[...Array(8)].map((_, i) => <div key={i}><Skeleton w="100%" h={158} radius={10} /><div style={{ marginTop: 10, display: "flex", gap: 8 }}><Skeleton w={36} h={36} radius={18} /><div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}><Skeleton w="90%" h={14} /><Skeleton w="50%" h={12} /></div></div></div>)}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
          {videos.map((video, i) => {
            const snippet = video.snippet || {};
            const thumb = snippet.thumbnails?.medium?.url || "";
            return (
              <div key={video.id} onClick={() => onVideoClick(video)} style={{ cursor: "pointer", borderRadius: 12, overflow: "hidden", transition: "transform 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ position: "relative", paddingTop: "56.25%", background: "#1a1a2e" }}>
                  {thumb && <img src={thumb} alt={snippet.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
                  <div style={{ position: "absolute", top: 8, left: 8, background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>● LIVE</div>
                  <div style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.8)", color: "#fff", fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>
                    👁 {formatViews(viewerCounts[i])} watching
                  </div>
                </div>
                <div style={{ padding: "10px 4px", display: "flex", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: getColor(snippet.channelTitle), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {getInitials(snippet.channelTitle)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: textPrimary, lineHeight: 1.4, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{snippet.title}</div>
                    <div style={{ fontSize: 12, color: darkMode ? "#8a8a9a" : "#606060" }}>{snippet.channelTitle}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// UPLOAD STUDIO
const UploadStudio = ({ darkMode }) => {
  const [stage, setStage] = useState("select");
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [progress, setProgress] = useState(0);

  const simulateUpload = () => {
    setStage("processing");
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 8;
      if (p >= 100) { p = 100; clearInterval(interval); setTimeout(() => setStage("done"), 500); }
      setProgress(p);
    }, 200);
  };

  const bg = darkMode ? "#0a0a14" : "#f9f9f9";
  const textPrimary = darkMode ? "#f0f0f0" : "#0f0f0f";
  const inputBg = darkMode ? "rgba(255,255,255,0.05)" : "#fff";
  const inputBorder = darkMode ? "rgba(255,255,255,0.1)" : "#e0e0e0";

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px 40px", background: bg }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 4, height: 28, background: "linear-gradient(180deg, #6366f1, #ec4899)", borderRadius: 2 }} />
        <h2 style={{ color: textPrimary, fontSize: 22, fontWeight: 700, margin: 0 }}>Upload Studio</h2>
      </div>
      {stage === "select" && (
        <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); setStage("details"); }} onClick={() => setStage("details")}
          style={{ border: `2px dashed ${dragOver ? "#6366f1" : inputBorder}`, borderRadius: 20, padding: "60px 40px", textAlign: "center", cursor: "pointer", background: dragOver ? "rgba(99,102,241,0.05)" : inputBg, transition: "all 0.2s" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>📹</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: textPrimary, marginBottom: 8 }}>Drag & drop your video here</div>
          <div style={{ fontSize: 14, color: darkMode ? "#666" : "#909090", marginBottom: 20 }}>Supports MP4, MKV, MOV · Up to 128GB</div>
          <button style={{ padding: "12px 28px", background: "#6366f1", border: "none", borderRadius: 24, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" }}>Select File</button>
        </div>
      )}
      {stage === "details" && (
        <div style={{ maxWidth: 600 }}>
          {[{ label: "Title *", value: title, set: setTitle, placeholder: "Add a title..." }, { label: "Description", value: description, set: setDescription, placeholder: "Tell viewers about your video...", textarea: true }].map(field => (
            <div key={field.label} style={{ marginBottom: 18 }}>
              <label style={{ display: "block", color: darkMode ? "#888" : "#606060", fontSize: 12, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>{field.label}</label>
              {field.textarea
                ? <textarea value={field.value} onChange={e => field.set(e.target.value)} placeholder={field.placeholder} rows={5}
                  style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 10, padding: "12px 14px", color: textPrimary, fontSize: 14, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                : <input value={field.value} onChange={e => field.set(e.target.value)} placeholder={field.placeholder}
                  style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 10, padding: "12px 14px", color: textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              }
            </div>
          ))}
          <button onClick={simulateUpload} style={{ padding: "13px 32px", background: "#6366f1", border: "none", borderRadius: 24, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Upload & Publish</button>
        </div>
      )}
      {stage === "processing" && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚡</div>
          <h3 style={{ color: textPrimary, marginBottom: 8 }}>Processing your video...</h3>
          <div style={{ color: darkMode ? "#666" : "#909090", marginBottom: 32 }}>Transcoding and distributing to CDN</div>
          <div style={{ maxWidth: 400, margin: "0 auto" }}>
            <div style={{ background: darkMode ? "rgba(255,255,255,0.07)" : "#e0e0e0", borderRadius: 8, height: 8, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #ec4899)", borderRadius: 8, transition: "width 0.2s" }} />
            </div>
            <div style={{ color: darkMode ? "#888" : "#606060", fontSize: 14 }}>{Math.floor(progress)}% complete</div>
          </div>
        </div>
      )}
      {stage === "done" && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", border: "2px solid rgba(16,185,129,0.4)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#10b981"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
          </div>
          <h3 style={{ color: textPrimary, marginBottom: 8, fontSize: 22 }}>Video Published! 🎉</h3>
          <div style={{ color: darkMode ? "#666" : "#909090", marginBottom: 32 }}>Your video is live worldwide</div>
          <button onClick={() => { setStage("select"); setProgress(0); setTitle(""); setDescription(""); }}
            style={{ padding: "12px 28px", background: "#6366f1", border: "none", borderRadius: 24, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Upload Another</button>
        </div>
      )}
    </div>
  );
};

// LOGIN PAGE
const LoginPage = ({ onLogin, darkMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const bg = darkMode ? "#0a0a14" : "#f9f9f9";
  const cardBg = darkMode ? "#141420" : "#fff";
  const textPrimary = darkMode ? "#f0f0f0" : "#0f0f0f";
  const textSecondary = darkMode ? "#888" : "#606060";
  const inputBg = darkMode ? "rgba(255,255,255,0.05)" : "#f8f8f8";
  const inputBorder = darkMode ? "rgba(255,255,255,0.1)" : "#e0e0e0";

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: bg, padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
            </div>
            <span style={{ fontSize: 24, fontWeight: 800, color: textPrimary }}>video<span style={{ color: "#6366f1" }}>tube</span></span>
          </div>
          <div style={{ color: textSecondary, fontSize: 14 }}>{isLogin ? "Sign in to your account" : "Create your account"}</div>
        </div>

        {/* Card */}
        <div style={{ background: cardBg, borderRadius: 20, padding: 32, border: darkMode ? "1px solid rgba(255,255,255,0.07)" : "1px solid #e0e0e0", boxShadow: darkMode ? "0 20px 60px rgba(0,0,0,0.4)" : "0 8px 30px rgba(0,0,0,0.08)" }}>
          {/* Google Sign In */}
          <button style={{ width: "100%", padding: "12px", background: darkMode ? "rgba(255,255,255,0.06)" : "#f8f8f8", border: `1px solid ${inputBorder}`, borderRadius: 12, color: textPrimary, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 20, transition: "all 0.15s" }}
            onClick={() => onLogin({ name: "Demo User", email: "demo@videotube.com" })}
            onMouseEnter={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.1)" : "#f0f0f0"}
            onMouseLeave={e => e.currentTarget.style.background = darkMode ? "rgba(255,255,255,0.06)" : "#f8f8f8"}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: inputBorder }} />
            <span style={{ color: textSecondary, fontSize: 12 }}>or</span>
            <div style={{ flex: 1, height: 1, background: inputBorder }} />
          </div>

          {/* Form */}
          {!isLogin && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", color: textSecondary, fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe"
                style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 10, padding: "11px 14px", color: textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", color: textSecondary, fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email"
              style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 10, padding: "11px 14px", color: textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", color: textSecondary, fontSize: 12, marginBottom: 6, fontWeight: 500 }}>Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" type="password"
              style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 10, padding: "11px 14px", color: textPrimary, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>

          <button onClick={() => onLogin({ name: name || email.split("@")[0], email })}
            style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "opacity 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            {isLogin ? "Sign In" : "Create Account"}
          </button>

          <div style={{ textAlign: "center", marginTop: 16, color: textSecondary, fontSize: 13 }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(l => !l)} style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// NOTIFICATIONS PANEL
const NotificationsPanel = ({ onClose, darkMode }) => {
  const items = [
    { id: 1, text: "New trending video in JavaScript", time: "2h ago", unread: true, icon: "🔥" },
    { id: 2, text: "Your subscribed channel uploaded a new video", time: "5h ago", unread: true, icon: "📺" },
    { id: 3, text: "Weekly tech digest is ready", time: "1d ago", unread: false, icon: "📰" },
    { id: 4, text: "Live stream starting soon", time: "2d ago", unread: false, icon: "🔴" },
  ];
  const bg = darkMode ? "#141420" : "#fff";
  const border = darkMode ? "rgba(255,255,255,0.1)" : "#e0e0e0";
  const textPrimary = darkMode ? "#d0d0e0" : "#0f0f0f";

  return (
    <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 360, background: bg, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", zIndex: 200 }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: textPrimary, fontWeight: 700 }}>Notifications</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: darkMode ? "#888" : "#606060", cursor: "pointer", fontSize: 20 }}>×</button>
      </div>
      {items.map(n => (
        <div key={n.id} style={{ display: "flex", gap: 12, padding: "14px 20px", background: n.unread ? (darkMode ? "rgba(99,102,241,0.05)" : "rgba(99,102,241,0.04)") : "transparent", borderBottom: `1px solid ${border}`, cursor: "pointer" }}>
          {n.unread && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", marginTop: 6, flexShrink: 0 }} />}
          {!n.unread && <div style={{ width: 8, flexShrink: 0 }} />}
          <div style={{ fontSize: 24 }}>{n.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ color: textPrimary, fontSize: 13, lineHeight: 1.5 }}>{n.text}</div>
            <div style={{ color: darkMode ? "#555" : "#909090", fontSize: 11, marginTop: 4 }}>{n.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

// MOBILE BOTTOM NAV
const MobileBottomNav = ({ currentPage, onNavigate, darkMode }) => {
  const items = [
    { id: "home", label: "Home", icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" },
    { id: "trending", label: "Trending", icon: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" },
    { id: "live", label: "Live", icon: "M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" },
    { id: "library", label: "Library", icon: "M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z" },
    { id: "upload", label: "Upload", icon: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" },
  ];

  return (
    <div style={{
      display: "none", position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 150,
      background: darkMode ? "#0a0a14" : "#fff",
      borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.08)" : "#e0e0e0"}`,
      padding: "8px 0 env(safe-area-inset-bottom)",
      "@media(maxWidth:768px)": { display: "flex" }
    }}
      id="mobile-bottom-nav">
      {items.map(item => (
        <button key={item.id} onClick={() => onNavigate(item.id)}
          style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "6px 4px", color: currentPage === item.id ? "#6366f1" : (darkMode ? "#666" : "#909090") }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d={item.icon} /></svg>
          <span style={{ fontSize: 10, fontWeight: 500 }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [page, setPage] = useState("home");
  const [currentVideo, setCurrentVideo] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500;600;700&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; scrollbar-width: thin; scrollbar-color: rgba(99,102,241,0.3) transparent; }
      *::-webkit-scrollbar { width: 5px; }
      *::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 10px; }
      body { font-family: 'DM Sans', sans-serif; }
      @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      @media (max-width: 768px) {
        #mobile-bottom-nav { display: flex !important; }
        #desktop-sidebar { display: none !important; }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleVideoClick = (video) => { setCurrentVideo(video); setPage("watch"); };
  const handleSearch = () => { if (searchInput.trim()) { setSearchQuery(searchInput); setPage("search"); } };
  const handleNavigate = (p) => { setPage(p); if (p !== "watch") setCurrentVideo(null); };
  const handleLogin = (userData) => { setUser(userData); setShowLogin(false); };

  const headerBg = darkMode ? "rgba(10,10,20,0.95)" : "rgba(255,255,255,0.95)";
  const textPrimary = darkMode ? "#f0f0f0" : "#0f0f0f";
  const border = darkMode ? "rgba(255,255,255,0.06)" : "#e0e0e0";

  const renderPage = () => {
    if (showLogin) return <LoginPage onLogin={handleLogin} darkMode={darkMode} />;
    switch (page) {
      case "home": return <HomePage onVideoClick={handleVideoClick} darkMode={darkMode} />;
      case "watch": return currentVideo ? <WatchPage video={currentVideo} onVideoClick={handleVideoClick} darkMode={darkMode} /> : <HomePage onVideoClick={handleVideoClick} darkMode={darkMode} />;
      case "trending": return <TrendingPage onVideoClick={handleVideoClick} darkMode={darkMode} />;
      case "live": return <LivePage onVideoClick={handleVideoClick} darkMode={darkMode} />;
      case "upload": return <UploadStudio darkMode={darkMode} />;
      case "search": return <SearchResultsPage query={searchQuery} onVideoClick={handleVideoClick} darkMode={darkMode} />;
      default: return <HomePage onVideoClick={handleVideoClick} darkMode={darkMode} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: darkMode ? "#0a0a14" : "#f9f9f9", display: "flex", flexDirection: "column", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header style={{ height: 60, display: "flex", alignItems: "center", padding: "0 16px", gap: 16, borderBottom: `1px solid ${border}`, background: headerBg, backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: sidebarCollapsed ? 56 : 200 }}>
          <button onClick={() => setSidebarCollapsed(c => !c)} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 8, color: darkMode ? "#c0c0d0" : "#606060", display: "flex" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
          </button>
          <div onClick={() => handleNavigate("home")} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
            </div>
            {!sidebarCollapsed && <span style={{ fontSize: 17, fontWeight: 800, color: textPrimary, fontFamily: "'DM Mono', monospace", letterSpacing: "-0.03em" }}>video<span style={{ color: "#6366f1" }}>tube</span></span>}
          </div>
        </div>

        <SearchBar value={searchInput} onChange={setSearchInput} onSearch={handleSearch} darkMode={darkMode} />

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          {/* Dark mode toggle */}
          <button onClick={() => setDarkMode(d => !d)}
            style={{ background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", border: `1px solid ${border}`, borderRadius: 24, padding: "7px 14px", color: darkMode ? "#c0c0d0" : "#606060", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", gap: 6 }}>
            {darkMode ? "☀️" : "🌙"}
          </button>

          <button onClick={() => handleNavigate("upload")}
            style={{ background: darkMode ? "rgba(255,255,255,0.06)" : "#f0f0f0", border: `1px solid ${border}`, borderRadius: 24, padding: "7px 14px", color: darkMode ? "#c0c0d0" : "#606060", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" /></svg>
            Upload
          </button>

          <div style={{ position: "relative" }}>
            <button onClick={() => setShowNotifications(n => !n)}
              style={{ background: "transparent", border: "none", borderRadius: 10, padding: "8px", color: darkMode ? "#8a8a9a" : "#606060", cursor: "pointer", display: "flex", position: "relative" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>
              <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#ec4899", border: `2px solid ${darkMode ? "#0a0a14" : "#fff"}` }} />
            </button>
            {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} darkMode={darkMode} />}
          </div>

          {user ? (
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", border: "2px solid rgba(99,102,241,0.4)" }}>
              {getInitials(user.name)}
            </div>
          ) : (
            <button onClick={() => setShowLogin(true)}
              style={{ padding: "8px 16px", borderRadius: 24, background: "transparent", border: "1px solid #6366f1", color: "#6366f1", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {!showLogin && (
          <div id="desktop-sidebar">
            <Sidebar collapsed={sidebarCollapsed} currentPage={page} onNavigate={handleNavigate} darkMode={darkMode} />
          </div>
        )}
        {renderPage()}
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav currentPage={page} onNavigate={handleNavigate} darkMode={darkMode} />

      {showNotifications && <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowNotifications(false)} />}
    </div>
  );
}
