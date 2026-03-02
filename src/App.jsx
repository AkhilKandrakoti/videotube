import { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// MOCK DATA LAYER (simulates API responses)
// ============================================================
const MOCK_USERS = [
  { id: "u1", name: "Alex Chen", avatar: "AC", channel: "TechWithAlex", subscribers: 1420000, verified: true },
  { id: "u2", name: "Sarah Kim", avatar: "SK", channel: "CodeCraft", subscribers: 892000, verified: true },
  { id: "u3", name: "Marcus Rivera", avatar: "MR", channel: "DesignPulse", subscribers: 340000, verified: false },
  { id: "u4", name: "Priya Nair", avatar: "PN", channel: "DevDiary", subscribers: 2100000, verified: true },
  { id: "u5", name: "Jordan Wu", avatar: "JW", channel: "ByteSize", subscribers: 156000, verified: false },
];

const CATEGORIES = ["All", "JavaScript", "System Design", "React", "DevOps", "Machine Learning", "CSS", "Node.js", "TypeScript", "Cloud"];

const MOCK_VIDEOS = [
  { id: "v1", title: "Building a Scalable Microservices Architecture from Scratch", thumbnail: "#1a1a2e", duration: "47:23", views: 2840000, likes: 89400, dislikes: 1200, uploadedAt: "2 weeks ago", userId: "u1", category: "System Design", description: "In this comprehensive tutorial, we dive deep into microservices architecture...", tags: ["microservices", "architecture", "distributed systems"], comments: 2340 },
  { id: "v2", title: "React 19 Features You NEED to Know in 2025", thumbnail: "#0d1117", duration: "28:15", views: 1920000, likes: 67200, dislikes: 890, uploadedAt: "5 days ago", userId: "u2", category: "React", description: "React 19 brings revolutionary changes to how we build UIs...", tags: ["react", "javascript", "frontend"], comments: 1890 },
  { id: "v3", title: "CSS Grid Mastery: Advanced Layout Techniques", thumbnail: "#1a0a2e", duration: "33:42", views: 445000, likes: 18900, dislikes: 230, uploadedAt: "1 week ago", userId: "u3", category: "CSS", description: "Master CSS Grid with advanced techniques that will transform your layouts...", tags: ["css", "grid", "layout"], comments: 567 },
  { id: "v4", title: "TypeScript 5.x: Generic Types Deep Dive", thumbnail: "#0a1a2e", duration: "51:08", views: 3200000, likes: 124000, dislikes: 2100, uploadedAt: "3 weeks ago", userId: "u4", category: "TypeScript", description: "Everything you need to know about TypeScript generics...", tags: ["typescript", "types", "javascript"], comments: 4560 },
  { id: "v5", title: "Docker + Kubernetes: Production Deployment Guide", thumbnail: "#1a2a0a", duration: "1:12:34", views: 987000, likes: 45600, dislikes: 780, uploadedAt: "1 month ago", userId: "u1", category: "DevOps", description: "Complete guide to deploying containerized apps to production...", tags: ["docker", "kubernetes", "devops"], comments: 2100 },
  { id: "v6", title: "Node.js Event Loop: The Complete Deep Dive", thumbnail: "#2a0a1a", duration: "39:17", views: 1560000, likes: 56700, dislikes: 1100, uploadedAt: "2 weeks ago", userId: "u5", category: "Node.js", description: "Understanding the Node.js event loop is crucial for performance...", tags: ["nodejs", "javascript", "backend"], comments: 3200 },
  { id: "v7", title: "Building Real-Time Apps with WebSockets & Redis", thumbnail: "#0a2a1a", duration: "44:52", views: 678000, likes: 29800, dislikes: 450, uploadedAt: "3 days ago", userId: "u2", category: "Node.js", description: "Learn to build scalable real-time applications...", tags: ["websockets", "redis", "realtime"], comments: 890 },
  { id: "v8", title: "AWS Lambda: Serverless Architecture Patterns", thumbnail: "#1a1a0a", duration: "56:33", views: 2340000, likes: 98700, dislikes: 1890, uploadedAt: "1 week ago", userId: "u4", category: "Cloud", description: "Serverless patterns that scale to millions of requests...", tags: ["aws", "lambda", "serverless"], comments: 5670 },
  { id: "v9", title: "Machine Learning Pipeline with Python & FastAPI", thumbnail: "#2a1a0a", duration: "1:05:20", views: 890000, likes: 34500, dislikes: 670, uploadedAt: "4 days ago", userId: "u3", category: "Machine Learning", description: "Build production ML pipelines from data to deployment...", tags: ["ml", "python", "fastapi"], comments: 1230 },
  { id: "v10", title: "JavaScript Performance: V8 Engine Internals", thumbnail: "#0a1a3a", duration: "42:11", views: 1120000, likes: 48900, dislikes: 920, uploadedAt: "6 days ago", userId: "u5", category: "JavaScript", description: "How V8 compiles and optimizes your JavaScript code...", tags: ["javascript", "v8", "performance"], comments: 2780 },
  { id: "v11", title: "Next.js App Router: Complete Migration Guide", thumbnail: "#2a0a2a", duration: "58:44", views: 1780000, likes: 72300, dislikes: 1340, uploadedAt: "2 weeks ago", userId: "u1", category: "React", description: "Everything you need to migrate from Pages to App Router...", tags: ["nextjs", "react", "appRouter"], comments: 3890 },
  { id: "v12", title: "PostgreSQL Query Optimization: 10x Performance Boost", thumbnail: "#0a2a2a", duration: "35:29", views: 567000, likes: 24100, dislikes: 380, uploadedAt: "5 days ago", userId: "u2", category: "System Design", description: "Practical techniques to dramatically speed up your queries...", tags: ["postgresql", "database", "performance"], comments: 1450 },
];

const MOCK_COMMENTS = [
  { id: "c1", userId: "u2", text: "This is exactly what I needed! Been struggling with this concept for weeks. Clear explanation, great pacing. Subscribed!", likes: 1240, time: "3 days ago", replies: [] },
  { id: "c2", userId: "u3", text: "The section at 23:45 about connection pooling is gold. Saved our production system from going down.", likes: 890, time: "1 week ago", replies: [{ id: "r1", userId: "u1", text: "Glad it helped! That pattern has saved me multiple times too.", likes: 234, time: "1 week ago" }] },
  { id: "c3", userId: "u5", text: "Could you make a follow-up video about monitoring these services in production? Grafana + Prometheus setup?", likes: 456, time: "2 weeks ago", replies: [] },
  { id: "c4", userId: "u4", text: "Best explanation of distributed tracing I've seen. The diagrams at 34:00 really clicked for me.", likes: 782, time: "3 days ago", replies: [] },
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const formatViews = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
};

const formatSubscribers = (n) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
};

const getUser = (id) => MOCK_USERS.find(u => u.id === id) || MOCK_USERS[0];

const avatarColors = {
  "u1": "#6366f1", "u2": "#ec4899", "u3": "#f59e0b", "u4": "#10b981", "u5": "#3b82f6"
};

const thumbnailGradients = {
  "#1a1a2e": "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
  "#0d1117": "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)",
  "#1a0a2e": "linear-gradient(135deg, #1a0a2e 0%, #2d1b69 50%, #1a0a2e 100%)",
  "#0a1a2e": "linear-gradient(135deg, #0a1a2e 0%, #0e4a6e 50%, #0a2a3e 100%)",
  "#1a2a0a": "linear-gradient(135deg, #1a2a0a 0%, #2d4a0e 50%, #1a3a0a 100%)",
  "#2a0a1a": "linear-gradient(135deg, #2a0a1a 0%, #4a1a2e 50%, #2a0a1a 100%)",
  "#0a2a1a": "linear-gradient(135deg, #0a2a1a 0%, #0e4a2e 50%, #0a3a1a 100%)",
  "#1a1a0a": "linear-gradient(135deg, #1a1a0a 0%, #3a3a0e 50%, #2a2a0a 100%)",
  "#2a1a0a": "linear-gradient(135deg, #2a1a0a 0%, #4a2a0e 50%, #2a1a0a 100%)",
  "#0a1a3a": "linear-gradient(135deg, #0a1a3a 0%, #0e2a6e 50%, #0a1a3a 100%)",
  "#2a0a2a": "linear-gradient(135deg, #2a0a2a 0%, #4a0a4a 50%, #2a0a2a 100%)",
  "#0a2a2a": "linear-gradient(135deg, #0a2a2a 0%, #0e4a4a 50%, #0a2a2a 100%)",
};

// ============================================================
// COMPONENTS
// ============================================================

// Avatar Component
const Avatar = ({ userId, size = 36 }) => {
  const user = getUser(userId);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: avatarColors[userId] || "#6366f1",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 700, color: "#fff",
      fontFamily: "'DM Mono', monospace", flexShrink: 0
    }}>
      {user.avatar}
    </div>
  );
};

// Thumbnail Component  
const Thumbnail = ({ video, style = {}, showDuration = true }) => (
  <div style={{
    position: "relative", borderRadius: 10, overflow: "hidden",
    background: thumbnailGradients[video.thumbnail] || "linear-gradient(135deg, #1a1a2e, #0f3460)",
    ...style
  }}>
    <div style={{
      width: "100%", paddingTop: "56.25%",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative"
    }}>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%",
          background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(255,255,255,0.2)"
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              width: 3, height: 12 + Math.random() * 12,
              background: `rgba(255,255,255,${0.2 + Math.random() * 0.4})`,
              borderRadius: 2
            }}/>
          ))}
        </div>
      </div>
    </div>
    {showDuration && (
      <div style={{
        position: "absolute", bottom: 6, right: 6,
        background: "rgba(0,0,0,0.85)", color: "#fff",
        fontSize: 11, fontWeight: 600, padding: "2px 6px",
        borderRadius: 4, fontFamily: "'DM Mono', monospace",
        letterSpacing: "0.02em"
      }}>
        {video.duration}
      </div>
    )}
  </div>
);

// Video Card Component
const VideoCard = ({ video, onClick, compact = false }) => {
  const [hovered, setHovered] = useState(false);
  const user = getUser(video.userId);

  if (compact) {
    return (
      <div
        onClick={() => onClick(video)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: "flex", gap: 10, cursor: "pointer", padding: "8px 6px",
          borderRadius: 10, transition: "background 0.15s",
          background: hovered ? "rgba(255,255,255,0.05)" : "transparent",
        }}
      >
        <Thumbnail video={video} style={{ width: 130, height: 73, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", lineHeight: 1.4, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {video.title}
          </div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>{user.channel}</div>
          <div style={{ fontSize: 11, color: "#666" }}>{formatViews(video.views)} views · {video.uploadedAt}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onClick(video)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "pointer", borderRadius: 12, overflow: "hidden", transition: "transform 0.2s", transform: hovered ? "translateY(-2px)" : "translateY(0)" }}
    >
      <div style={{ transform: hovered ? "scale(1.02)" : "scale(1)", transition: "transform 0.25s", borderRadius: 10, overflow: "hidden" }}>
        <Thumbnail video={video} />
      </div>
      <div style={{ padding: "10px 4px 8px", display: "flex", gap: 10 }}>
        <Avatar userId={video.userId} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0", lineHeight: 1.45, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {video.title}
          </div>
          <div style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
            {user.channel}
            {user.verified && <svg width="12" height="12" viewBox="0 0 24 24" fill="#6366f1"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>}
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>{formatViews(video.views)} views · {video.uploadedAt}</div>
        </div>
      </div>
    </div>
  );
};

// Search Bar
const SearchBar = ({ value, onChange, onSearch }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, maxWidth: 580 }}>
      <div style={{
        flex: 1, display: "flex", alignItems: "center",
        background: focused ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${focused ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: "24px 0 0 24px", overflow: "hidden",
        transition: "all 0.2s", boxShadow: focused ? "0 0 0 3px rgba(99,102,241,0.15)" : "none"
      }}>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => e.key === "Enter" && onSearch()}
          placeholder="Search videos, channels, topics..."
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "#f0f0f0", fontSize: 14, padding: "10px 16px",
            fontFamily: "'DM Sans', sans-serif"
          }}
        />
      </div>
      <button
        onClick={onSearch}
        style={{
          background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
          borderLeft: "none", borderRadius: "0 24px 24px 0", padding: "10px 18px",
          cursor: "pointer", color: "#c0c0d0", transition: "background 0.15s",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
      </button>
    </div>
  );
};

// Sidebar
const Sidebar = ({ collapsed, currentPage, onNavigate }) => {
  const navItems = [
    { id: "home", icon: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z", label: "Home" },
    { id: "trending", icon: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z", label: "Trending" },
    { id: "subscriptions", icon: "M20 8H4V6h16v2zm-2-6H6v2h12V2zm4 10v8l-6-4 6-4zm-8 0H2v8h12v-8z", label: "Subscriptions" },
    { id: "library", icon: "M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z", label: "Library" },
    { id: "history", icon: "M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z", label: "History" },
  ];

  const secondaryItems = [
    { id: "liked", icon: "M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z", label: "Liked Videos" },
    { id: "watchlater", icon: "M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c.55 0 1-.45 1-1v-3h1v-2h-2V9h2zm-4 10H4V5h14v14zm-2-8H6v-2h10v2zm-4 4H6v-2h6v2zm4-8H6V5h10v2z", label: "Watch Later" },
    { id: "upload", icon: "M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z", label: "Upload Studio" },
  ];

  if (collapsed) {
    return (
      <div style={{
        width: 64, paddingTop: 12, display: "flex", flexDirection: "column", gap: 4,
        alignItems: "center", borderRight: "1px solid rgba(255,255,255,0.05)"
      }}>
        {[...navItems, ...secondaryItems].map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            title={item.label}
            style={{
              background: currentPage === item.id ? "rgba(99,102,241,0.15)" : "transparent",
              border: "none", cursor: "pointer", borderRadius: 10, padding: "10px",
              color: currentPage === item.id ? "#8b8cf8" : "#8a8a9a",
              transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={item.icon}/></svg>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div style={{ width: 220, padding: "12px 8px", borderRight: "1px solid rgba(255,255,255,0.05)", overflowY: "auto" }}>
      {navItems.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          style={{
            width: "100%", background: currentPage === item.id ? "rgba(99,102,241,0.15)" : "transparent",
            border: "none", cursor: "pointer", borderRadius: 10,
            padding: "10px 12px", color: currentPage === item.id ? "#8b8cf8" : "#a0a0b0",
            display: "flex", alignItems: "center", gap: 12, fontSize: 13, fontWeight: 500,
            transition: "all 0.15s", textAlign: "left", marginBottom: 2,
            fontFamily: "'DM Sans', sans-serif"
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={item.icon}/></svg>
          {item.label}
        </button>
      ))}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 8px" }}/>
      {secondaryItems.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          style={{
            width: "100%", background: currentPage === item.id ? "rgba(99,102,241,0.15)" : "transparent",
            border: "none", cursor: "pointer", borderRadius: 10,
            padding: "10px 12px", color: currentPage === item.id ? "#8b8cf8" : "#a0a0b0",
            display: "flex", alignItems: "center", gap: 12, fontSize: 13, fontWeight: 500,
            transition: "all 0.15s", textAlign: "left", marginBottom: 2,
            fontFamily: "'DM Sans', sans-serif"
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={item.icon}/></svg>
          {item.label}
        </button>
      ))}
      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "10px 8px" }}/>
      <div style={{ padding: "4px 12px 8px", fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'DM Mono', monospace" }}>
        Subscriptions
      </div>
      {MOCK_USERS.slice(0, 4).map(user => (
        <button
          key={user.id}
          onClick={() => onNavigate("channel")}
          style={{
            width: "100%", background: "transparent", border: "none", cursor: "pointer",
            borderRadius: 10, padding: "8px 12px", color: "#a0a0b0",
            display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 500,
            transition: "background 0.15s", textAlign: "left", marginBottom: 2,
            fontFamily: "'DM Sans', sans-serif"
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: avatarColors[user.id], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: "'DM Mono', monospace" }}>
            {user.avatar}
          </div>
          {user.channel}
        </button>
      ))}
    </div>
  );
};

// Category Pills
const CategoryPills = ({ selected, onSelect }) => {
  const ref = useRef(null);
  return (
    <div ref={ref} style={{ display: "flex", gap: 8, overflowX: "auto", padding: "12px 0", scrollbarWidth: "none" }}>
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          style={{
            flexShrink: 0, padding: "7px 14px", borderRadius: 24,
            background: selected === cat ? "#6366f1" : "rgba(255,255,255,0.07)",
            border: `1px solid ${selected === cat ? "#6366f1" : "rgba(255,255,255,0.1)"}`,
            color: selected === cat ? "#fff" : "#b0b0c0", fontSize: 13, fontWeight: 500,
            cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif",
            whiteSpace: "nowrap"
          }}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

// HOME PAGE
const HomePage = ({ onVideoClick }) => {
  const [category, setCategory] = useState("All");
  const filtered = category === "All" ? MOCK_VIDEOS : MOCK_VIDEOS.filter(v => v.category === category);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 40px" }}>
      <CategoryPills selected={category} onSelect={setCategory} />
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: 20, paddingTop: 8
      }}>
        {filtered.map(video => (
          <VideoCard key={video.id} video={video} onClick={onVideoClick} />
        ))}
      </div>
    </div>
  );
};

// VIDEO PLAYER
const VideoPlayer = ({ video }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [quality, setQuality] = useState("1080p");
  const [showControls, setShowControls] = useState(true);
  const intervalRef = useRef(null);

  const togglePlay = useCallback(() => {
    setPlaying(p => {
      if (!p) {
        intervalRef.current = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) { clearInterval(intervalRef.current); return 100; }
            return prev + 0.1;
          });
        }, 200);
      } else {
        clearInterval(intervalRef.current);
      }
      return !p;
    });
  }, []);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const qualities = ["2160p", "1440p", "1080p", "720p", "480p", "360p", "144p"];

  return (
    <div style={{
      position: "relative", width: "100%", paddingTop: "56.25%",
      background: thumbnailGradients[video.thumbnail] || "#000",
      borderRadius: 12, overflow: "hidden", cursor: "pointer",
    }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => playing && setShowControls(false)}
      onClick={togglePlay}
    >
      {/* Play/Pause overlay */}
      {!playing && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.4)"
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(99,102,241,0.9)", display: "flex",
            alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 40px rgba(99,102,241,0.5)"
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      )}

      {/* Visualization when playing */}
      {playing && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 5, alignItems: "flex-end" }}>
            {[...Array(20)].map((_, i) => (
              <div key={i} style={{
                width: 4, borderRadius: 2,
                background: `rgba(99,102,241,${0.5 + Math.random() * 0.5})`,
                height: 20 + Math.sin(i * 0.8 + Date.now() * 0.005) * 30,
                animation: `bar-${i} ${0.3 + Math.random() * 0.5}s ease-in-out infinite alternate`,
              }}/>
            ))}
          </div>
        </div>
      )}

      {/* Controls overlay */}
      {showControls && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
          padding: "30px 16px 12px",
          transition: "opacity 0.2s"
        }}
          onClick={e => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div style={{ position: "relative", height: 4, background: "rgba(255,255,255,0.2)", borderRadius: 2, marginBottom: 10, cursor: "pointer" }}
            onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); setProgress(((e.clientX - rect.left) / rect.width) * 100); }}
          >
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${progress}%`, background: "#6366f1", borderRadius: 2, transition: "width 0.1s" }}/>
            <div style={{ position: "absolute", top: "50%", left: `${progress}%`, transform: "translate(-50%, -50%)", width: 12, height: 12, borderRadius: "50%", background: "#6366f1", transition: "left 0.1s" }}/>
          </div>

          {/* Control buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={togglePlay} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}>
              {playing
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                : <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              }
            </button>
            <button style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(255,255,255,0.8)">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
              </svg>
              <input type="range" min="0" max="100" value={volume} onChange={e => setVolume(e.target.value)}
                style={{ width: 70, accentColor: "#6366f1" }}
              />
            </div>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "'DM Mono', monospace", marginLeft: 4 }}>
              {Math.floor(progress * 0.4 * 60 / 100)}:{String(Math.floor((progress * 0.4 * 60 / 100 % 1) * 60)).padStart(2, "0")} / {video.duration}
            </span>
            <div style={{ flex: 1 }}/>
            <select
              value={quality}
              onChange={e => setQuality(e.target.value)}
              style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 6, padding: "3px 8px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Mono', monospace" }}
            >
              {qualities.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            <button style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: 4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// WATCH PAGE
const WatchPage = ({ video, onVideoClick }) => {
  const user = getUser(video.userId);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [showDesc, setShowDesc] = useState(false);
  const related = MOCK_VIDEOS.filter(v => v.id !== video.id).slice(0, 8);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 40px" }}>
      <div style={{ display: "flex", gap: 28, maxWidth: 1400 }}>
        {/* Main content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <VideoPlayer video={video} />

          {/* Title */}
          <h1 style={{ color: "#f0f0f0", fontSize: 19, fontWeight: 700, marginTop: 16, marginBottom: 12, lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>
            {video.title}
          </h1>

          {/* Meta row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar userId={video.userId} size={42} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#f0f0f0", fontSize: 15, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                  {user.channel}
                  {user.verified && <svg width="14" height="14" viewBox="0 0 24 24" fill="#6366f1"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>{formatSubscribers(user.subscribers)} subscribers</div>
              </div>
              <button
                onClick={() => setSubscribed(s => !s)}
                style={{
                  padding: "8px 18px", borderRadius: 24, border: "none", cursor: "pointer",
                  background: subscribed ? "rgba(255,255,255,0.1)" : "#6366f1",
                  color: subscribed ? "#c0c0d0" : "#fff", fontSize: 13, fontWeight: 600,
                  transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif"
                }}
              >
                {subscribed ? "Subscribed ✓" : "Subscribe"}
              </button>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: liked ? `▲ ${formatViews(video.likes + 1)}` : `▲ ${formatViews(video.likes)}`, action: () => { setLiked(l => !l); setDisliked(false); }, active: liked },
                { label: disliked ? "▼ Dislike" : "▼ Dislike", action: () => { setDisliked(d => !d); setLiked(false); }, active: disliked },
                { label: "↗ Share", action: () => {} },
                { label: "⋯ More", action: () => {} },
              ].map(btn => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  style={{
                    padding: "8px 14px", borderRadius: 24,
                    background: btn.active ? "rgba(99,102,241,0.25)" : "rgba(255,255,255,0.07)",
                    border: `1px solid ${btn.active ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.1)"}`,
                    color: btn.active ? "#8b8cf8" : "#c0c0d0", fontSize: 13, fontWeight: 500,
                    cursor: "pointer", transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif"
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
            <div style={{ color: "#b0b0c0", fontSize: 13, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, color: "#f0f0f0" }}>{formatViews(video.views)} views</span>
                <span style={{ color: "#666" }}>{video.uploadedAt}</span>
                {video.tags.map(t => <span key={t} style={{ color: "#6366f1" }}>#{t}</span>)}
              </div>
              {showDesc ? video.description + " Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. This video covers all essential aspects including architecture patterns, performance optimization, security considerations, and production deployment strategies." : video.description.slice(0, 120) + "..."}
            </div>
            <button onClick={() => setShowDesc(s => !s)} style={{ background: "none", border: "none", color: "#8b8cf8", cursor: "pointer", fontSize: 13, fontWeight: 600, marginTop: 8, padding: 0, fontFamily: "'DM Sans', sans-serif" }}>
              {showDesc ? "Show less" : "...more"}
            </button>
          </div>

          {/* Comments */}
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0", marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
              {formatViews(video.comments)} Comments
            </div>
            <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
              <Avatar userId="u3" size={36} />
              <div style={{ flex: 1 }}>
                <input
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  style={{
                    width: "100%", background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.15)",
                    outline: "none", color: "#f0f0f0", fontSize: 14, padding: "8px 0",
                    fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box"
                  }}
                />
                {commentText && (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                    <button onClick={() => setCommentText("")} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
                    <button style={{ background: "#6366f1", border: "none", color: "#fff", borderRadius: 20, padding: "6px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Comment</button>
                  </div>
                )}
              </div>
            </div>
            {MOCK_COMMENTS.map(comment => {
              const cu = getUser(comment.userId);
              return (
                <div key={comment.id} style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  <Avatar userId={comment.userId} size={36} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ color: "#f0f0f0", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{cu.channel}</span>
                      <span style={{ color: "#555", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{comment.time}</span>
                    </div>
                    <div style={{ color: "#c0c0d0", fontSize: 14, lineHeight: 1.6, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{comment.text}</div>
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <button style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 4, fontFamily: "'DM Sans', sans-serif" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
                        {formatViews(comment.likes)}
                      </button>
                      <button style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Reply</button>
                    </div>
                    {comment.replies.map(reply => {
                      const ru = getUser(reply.userId);
                      return (
                        <div key={reply.id} style={{ display: "flex", gap: 10, marginTop: 12, paddingLeft: 8, borderLeft: "2px solid rgba(99,102,241,0.2)" }}>
                          <Avatar userId={reply.userId} size={28} />
                          <div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                              <span style={{ color: "#f0f0f0", fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{ru.channel}</span>
                              <span style={{ color: "#555", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>{reply.time}</span>
                            </div>
                            <div style={{ color: "#b0b0c0", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{reply.text}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Related videos */}
        <div style={{ width: 380, flexShrink: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Mono', monospace" }}>Up Next</div>
          {related.map(v => <VideoCard key={v.id} video={v} onClick={onVideoClick} compact />)}
        </div>
      </div>
    </div>
  );
};

// TRENDING PAGE
const TrendingPage = ({ onVideoClick }) => {
  const sorted = [...MOCK_VIDEOS].sort((a, b) => b.views - a.views);
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 4, height: 28, background: "linear-gradient(180deg, #6366f1, #ec4899)", borderRadius: 2 }}/>
        <h2 style={{ color: "#f0f0f0", fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Trending</h2>
      </div>
      {sorted.map((video, i) => {
        const user = getUser(video.userId);
        return (
          <div key={video.id} onClick={() => onVideoClick(video)} style={{
            display: "flex", gap: 16, padding: "14px 0",
            borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer"
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: i < 3 ? "#6366f1" : "#333", width: 36, textAlign: "center", fontFamily: "'DM Mono', monospace", paddingTop: 4 }}>
              {i + 1}
            </div>
            <Thumbnail video={video} style={{ width: 200, height: 112, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#f0f0f0", marginBottom: 8, lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>{video.title}</div>
              <div style={{ fontSize: 13, color: "#8a8a9a", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>{user.channel}</div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#666", fontFamily: "'DM Sans', sans-serif" }}>
                <span>{formatViews(video.views)} views</span>
                <span>{video.uploadedAt}</span>
                <span>▲ {formatViews(video.likes)} likes</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// CHANNEL PAGE
const ChannelPage = ({ userId = "u4", onVideoClick }) => {
  const user = getUser(userId);
  const videos = MOCK_VIDEOS.filter(v => v.id !== "v3" && v.id !== "v5"); // simulate channel
  const [tab, setTab] = useState("Videos");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {/* Channel banner */}
      <div style={{ height: 180, background: `linear-gradient(135deg, ${avatarColors[userId]}33, ${avatarColors[userId]}66, #0a0a1a)`, position: "relative", borderRadius: "0 0 0 0" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 30% 50%, rgba(99,102,241,0.2) 0%, transparent 60%)" }}/>
      </div>

      {/* Channel info */}
      <div style={{ padding: "0 28px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginTop: -32, marginBottom: 16 }}>
          <div style={{ width: 88, height: 88, borderRadius: "50%", background: avatarColors[userId], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, color: "#fff", border: "4px solid #0a0a1a", flexShrink: 0, fontFamily: "'DM Mono', monospace" }}>
            {user.avatar}
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif" }}>{user.channel}</span>
              {user.verified && <svg width="18" height="18" viewBox="0 0 24 24" fill="#6366f1"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>}
            </div>
            <div style={{ fontSize: 13, color: "#666", fontFamily: "'DM Sans', sans-serif" }}>
              @{user.channel.toLowerCase().replace(/\s/g, "")} · {formatSubscribers(user.subscribers)} subscribers · {videos.length} videos
            </div>
          </div>
          <button
            onClick={() => setSubscribed(s => !s)}
            style={{
              padding: "10px 24px", borderRadius: 24, border: "none", cursor: "pointer",
              background: subscribed ? "rgba(255,255,255,0.1)" : "#6366f1",
              color: subscribed ? "#c0c0d0" : "#fff", fontSize: 14, fontWeight: 600,
              transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif"
            }}
          >
            {subscribed ? "Subscribed ✓" : "Subscribe"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 0 }}>
          {["Videos", "Playlists", "About"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: "none", border: "none", borderBottom: `2px solid ${tab === t ? "#6366f1" : "transparent"}`,
                color: tab === t ? "#f0f0f0" : "#888", padding: "10px 20px", cursor: "pointer",
                fontSize: 14, fontWeight: tab === t ? 700 : 500, fontFamily: "'DM Sans', sans-serif",
                transition: "all 0.15s"
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "24px 28px" }}>
        {tab === "Videos" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {videos.map(v => <VideoCard key={v.id} video={v} onClick={onVideoClick} />)}
          </div>
        )}
        {tab === "About" && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ color: "#c0c0d0", fontSize: 15, lineHeight: 1.8, marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
              Welcome to {user.channel}! We publish high-quality tutorials on software engineering, system design, and modern web development. Our mission is to make complex technical concepts accessible and actionable.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[["Subscribers", formatSubscribers(user.subscribers)], ["Total Views", "142M"], ["Joined", "March 2018"], ["Location", "San Francisco, CA"]].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 16, fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                  <span style={{ color: "#666", width: 120 }}>{k}</span>
                  <span style={{ color: "#e0e0f0" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// UPLOAD STUDIO
const UploadStudio = () => {
  const [stage, setStage] = useState("select"); // select | details | processing | done
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("JavaScript");
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

  const stages = {
    select: (
      <div>
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); setStage("details"); }}
          onClick={() => setStage("details")}
          style={{
            border: `2px dashed ${dragOver ? "#6366f1" : "rgba(255,255,255,0.15)"}`,
            borderRadius: 20, padding: "60px 40px", textAlign: "center", cursor: "pointer",
            background: dragOver ? "rgba(99,102,241,0.05)" : "rgba(255,255,255,0.02)",
            transition: "all 0.2s"
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>📹</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#f0f0f0", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
            Drag & drop your video here
          </div>
          <div style={{ fontSize: 14, color: "#666", marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>
            Supports MP4, MKV, MOV, AVI, WebM · Up to 128GB
          </div>
          <button style={{ padding: "12px 28px", background: "#6366f1", border: "none", borderRadius: 24, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Select File
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 24 }}>
          {[["🎬", "Up to 1080p", "Full HD support"], ["⚡", "Fast Processing", "HLS transcoding"], ["🔒", "Secure", "Encrypted storage"]].map(([icon, title, sub]) => (
            <div key={title} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 14, padding: 20, textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
              <div style={{ color: "#f0f0f0", fontWeight: 600, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>{title}</div>
              <div style={{ color: "#666", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    details: (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 28 }}>
        <div>
          <h3 style={{ color: "#f0f0f0", marginBottom: 20, fontFamily: "'DM Sans', sans-serif" }}>Video Details</h3>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 6, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Add a title that describes your video" style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "#f0f0f0", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box", transition: "border 0.15s" }}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 6, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell viewers about your video..." rows={5} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "#f0f0f0", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", color: "#888", fontSize: 12, marginBottom: 6, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 14px", color: "#f0f0f0", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif", width: "100%", cursor: "pointer" }}>
              {CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c} style={{ background: "#1a1a2e" }}>{c}</option>)}
            </select>
          </div>
          <button onClick={simulateUpload} style={{ padding: "13px 32px", background: "#6366f1", border: "none", borderRadius: 24, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            Upload & Publish
          </button>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 20, border: "1px solid rgba(255,255,255,0.06)", height: "fit-content" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#888", marginBottom: 16, fontFamily: "'DM Mono', monospace" }}>VIDEO PREVIEW</div>
          <div style={{ background: "#1a1a2e", borderRadius: 10, aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ textAlign: "center", color: "#444" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
              <div style={{ fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Thumbnail preview</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#666", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.7 }}>
            <div>Processing pipeline:</div>
            {["Validate & upload", "Extract thumbnail", "Transcode to HLS", "Generate 1080p/720p/480p/360p", "Distribute to CDN", "Publish"].map((step, i) => (
              <div key={step} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(99,102,241,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#6366f1", fontWeight: 700 }}>{i + 1}</div>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    processing: (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>⚡</div>
        <h3 style={{ color: "#f0f0f0", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Processing your video...</h3>
        <div style={{ color: "#666", marginBottom: 32, fontFamily: "'DM Sans', sans-serif" }}>Transcoding, generating HLS segments, and distributing to CDN</div>
        <div style={{ maxWidth: 400, margin: "0 auto" }}>
          <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 8, height: 8, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: `${progress}%`, height: "100%", background: "linear-gradient(90deg, #6366f1, #ec4899)", borderRadius: 8, transition: "width 0.2s" }}/>
          </div>
          <div style={{ color: "#888", fontSize: 14, fontFamily: "'DM Mono', monospace" }}>{Math.floor(progress)}% complete</div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 32, flexWrap: "wrap" }}>
          {["Uploading", "Transcoding", "Generating HLS", "CDN Distribution"].map((step, i) => (
            <div key={step} style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontFamily: "'DM Sans', sans-serif",
              background: progress > i * 25 ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
              color: progress > i * 25 ? "#8b8cf8" : "#555",
              border: `1px solid ${progress > i * 25 ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)"}`
            }}>
              {progress > i * 25 ? "✓ " : ""}{step}
            </div>
          ))}
        </div>
      </div>
    ),
    done: (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", border: "2px solid rgba(16,185,129,0.4)" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#10b981"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
        </div>
        <h3 style={{ color: "#f0f0f0", marginBottom: 8, fontSize: 22, fontFamily: "'DM Sans', sans-serif" }}>Video Published!</h3>
        <div style={{ color: "#666", marginBottom: 32, fontFamily: "'DM Sans', sans-serif" }}>Your video is live and available to viewers worldwide</div>
        <button onClick={() => { setStage("select"); setProgress(0); setTitle(""); setDescription(""); }} style={{ padding: "12px 28px", background: "#6366f1", border: "none", borderRadius: 24, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
          Upload Another
        </button>
      </div>
    )
  };

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ width: 4, height: 28, background: "linear-gradient(180deg, #6366f1, #ec4899)", borderRadius: 2 }}/>
        <h2 style={{ color: "#f0f0f0", fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Upload Studio</h2>
        {stage !== "select" && (
          <div style={{ display: "flex", gap: 0, marginLeft: 20 }}>
            {["select", "details", "processing", "done"].map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  background: ["select", "details", "processing", "done"].indexOf(stage) >= i ? "#6366f1" : "rgba(255,255,255,0.07)",
                  fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "'DM Mono', monospace"
                }}>{i + 1}</div>
                {i < 3 && <div style={{ width: 24, height: 2, background: ["select", "details", "processing", "done"].indexOf(stage) > i ? "#6366f1" : "rgba(255,255,255,0.1)" }}/>}
              </div>
            ))}
          </div>
        )}
      </div>
      {stages[stage]}
    </div>
  );
};

// ANALYTICS PAGE
const AnalyticsPage = () => {
  const generateData = (count, base, variance) =>
    Array.from({ length: count }, (_, i) => base + Math.sin(i * 0.5) * variance + Math.random() * variance * 0.5);

  const viewsData = generateData(30, 15000, 8000);
  const maxViews = Math.max(...viewsData);
  const totalViews = viewsData.reduce((a, b) => a + b, 0);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 40px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 4, height: 28, background: "linear-gradient(180deg, #6366f1, #ec4899)", borderRadius: 2 }}/>
        <h2 style={{ color: "#f0f0f0", fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Creator Analytics</h2>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "Total Views", value: "12.4M", change: "+18%", color: "#6366f1" },
          { label: "Watch Time", value: "847K hrs", change: "+12%", color: "#10b981" },
          { label: "Subscribers", value: "+14.2K", change: "+34%", color: "#ec4899" },
          { label: "Revenue Est.", value: "$8,420", change: "+9%", color: "#f59e0b" },
        ].map(card => (
          <div key={card.label} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "20px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 8, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}>{card.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#f0f0f0", marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{card.value}</div>
            <div style={{ fontSize: 12, color: "#10b981", fontFamily: "'DM Sans', sans-serif" }}>{card.change} this month</div>
            <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, marginTop: 12 }}>
              <div style={{ width: "65%", height: "100%", background: card.color, borderRadius: 2 }}/>
            </div>
          </div>
        ))}
      </div>

      {/* Views chart */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "24px", marginBottom: 24, border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0", fontFamily: "'DM Sans', sans-serif" }}>Views Over Time</div>
            <div style={{ fontSize: 12, color: "#666", marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>Last 30 days · {formatViews(Math.round(totalViews))} total views</div>
          </div>
          <select style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", color: "#c0c0d0", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
            {["Last 30 days", "Last 90 days", "Last year"].map(o => <option key={o} style={{ background: "#1a1a2e" }}>{o}</option>)}
          </select>
        </div>
        <div style={{ height: 180, display: "flex", alignItems: "flex-end", gap: 3 }}>
          {viewsData.map((v, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{
                width: "100%", borderRadius: "3px 3px 0 0",
                height: `${(v / maxViews) * 160}px`,
                background: `rgba(99,102,241,${0.3 + (v / maxViews) * 0.7})`,
                transition: "height 0.3s", cursor: "pointer",
                position: "relative", minHeight: 4
              }}/>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, color: "#555", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
          <span>Dec 1</span><span>Dec 10</span><span>Dec 20</span><span>Dec 30</span>
        </div>
      </div>

      {/* Top videos table */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: "24px", border: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0", marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>Top Performing Videos</div>
        {MOCK_VIDEOS.slice(0, 5).map((video, i) => (
          <div key={video.id} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < 4 ? "1px solid rgba(255,255,255,0.05)" : "none", alignItems: "center" }}>
            <div style={{ color: "#444", fontSize: 13, fontWeight: 700, width: 20, textAlign: "center", fontFamily: "'DM Mono', monospace" }}>{i + 1}</div>
            <Thumbnail video={video} style={{ width: 100, height: 56, flexShrink: 0 }} showDuration={false} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#e0e0f0", fontSize: 13, fontWeight: 600, marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>{video.title}</div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#666", fontFamily: "'DM Sans', sans-serif" }}>
                <span>{formatViews(video.views)} views</span>
                <span>▲ {formatViews(video.likes)}</span>
                <span>{video.uploadedAt}</span>
              </div>
            </div>
            <div style={{ width: 120 }}>
              <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2 }}>
                <div style={{ width: `${(video.views / 3200000) * 100}%`, height: "100%", background: "#6366f1", borderRadius: 2 }}/>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// SEARCH RESULTS
const SearchResultsPage = ({ query, onVideoClick }) => {
  const results = query ? MOCK_VIDEOS.filter(v =>
    v.title.toLowerCase().includes(query.toLowerCase()) ||
    v.tags.some(t => t.includes(query.toLowerCase())) ||
    v.category.toLowerCase().includes(query.toLowerCase())
  ) : MOCK_VIDEOS;

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 40px" }}>
      <div style={{ marginBottom: 16, color: "#888", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
        {results.length} results{query ? ` for "${query}"` : ""}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 900 }}>
        {results.map(video => {
          const user = getUser(video.userId);
          return (
            <div key={video.id} onClick={() => onVideoClick(video)} style={{ display: "flex", gap: 16, cursor: "pointer", borderRadius: 12, padding: 8, transition: "background 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Thumbnail video={video} style={{ width: 248, height: 140, flexShrink: 0 }} />
              <div style={{ flex: 1, paddingTop: 4 }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#f0f0f0", marginBottom: 8, lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>{video.title}</div>
                <div style={{ fontSize: 12, color: "#666", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{formatViews(video.views)} views · {video.uploadedAt}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: avatarColors[video.userId], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff", fontFamily: "'DM Mono', monospace" }}>{getUser(video.userId).avatar}</div>
                  <span style={{ fontSize: 13, color: "#8a8a9a", fontFamily: "'DM Sans', sans-serif" }}>{user.channel}</span>
                  {user.verified && <svg width="12" height="12" viewBox="0 0 24 24" fill="#6366f1"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>}
                </div>
                <div style={{ fontSize: 13, color: "#666", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
                  {video.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// LIBRARY / HISTORY PAGE
const LibraryPage = ({ onVideoClick }) => (
  <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px 40px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
      <div style={{ width: 4, height: 28, background: "linear-gradient(180deg, #6366f1, #ec4899)", borderRadius: 2 }}/>
      <h2 style={{ color: "#f0f0f0", fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Watch History</h2>
    </div>
    {MOCK_VIDEOS.slice(0, 6).map((video, i) => {
      const user = getUser(video.userId);
      const watchPercent = [100, 78, 45, 90, 32, 67][i];
      return (
        <div key={video.id} onClick={() => onVideoClick(video)} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", cursor: "pointer" }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Thumbnail video={video} style={{ width: 200, height: 112 }} />
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.15)", borderRadius: "0 0 10px 10px" }}>
              <div style={{ width: `${watchPercent}%`, height: "100%", background: watchPercent === 100 ? "#10b981" : "#6366f1", borderRadius: "inherit" }}/>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0", marginBottom: 6, lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>{video.title}</div>
            <div style={{ fontSize: 12, color: "#8a8a9a", marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>{user.channel}</div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{formatViews(video.views)} views · {video.uploadedAt}</div>
            <div style={{ fontSize: 12, color: watchPercent === 100 ? "#10b981" : "#6366f1", fontFamily: "'DM Sans', sans-serif" }}>
              {watchPercent === 100 ? "✓ Watched" : `${watchPercent}% watched`}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

// NOTIFICATIONS PANEL
const NotificationsPanel = ({ onClose }) => {
  const notifications = [
    { id: "n1", userId: "u2", text: "CodeCraft uploaded: React 19 Deep Dive", time: "2h ago", unread: true },
    { id: "n2", userId: "u4", text: "DevDiary uploaded: AWS Lambda Best Practices", time: "5h ago", unread: true },
    { id: "n3", userId: "u1", text: "TechWithAlex liked your comment", time: "1d ago", unread: false },
    { id: "n4", userId: "u5", text: "ByteSize replied to your comment", time: "2d ago", unread: false },
  ];
  return (
    <div style={{
      position: "absolute", top: "calc(100% + 8px)", right: 0, width: 360,
      background: "#141420", border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 16, overflow: "hidden",
      boxShadow: "0 20px 60px rgba(0,0,0,0.5)", zIndex: 200
    }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "#f0f0f0", fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Notifications</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 20 }}>×</button>
      </div>
      {notifications.map(n => (
        <div key={n.id} style={{ display: "flex", gap: 12, padding: "14px 20px", background: n.unread ? "rgba(99,102,241,0.05)" : "transparent", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", alignItems: "flex-start" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
          onMouseLeave={e => e.currentTarget.style.background = n.unread ? "rgba(99,102,241,0.05)" : "transparent"}
        >
          {n.unread && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", marginTop: 6, flexShrink: 0 }}/>}
          {!n.unread && <div style={{ width: 8, height: 8, flexShrink: 0 }}/>}
          <Avatar userId={n.userId} size={38} />
          <div style={{ flex: 1 }}>
            <div style={{ color: "#d0d0e0", fontSize: 13, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{n.text}</div>
            <div style={{ color: "#555", fontSize: 11, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{n.time}</div>
          </div>
        </div>
      ))}
      <div style={{ padding: "12px 20px", textAlign: "center" }}>
        <button style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>View all notifications</button>
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [page, setPage] = useState("home");
  const [currentVideo, setCurrentVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode] = useState(true);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500;600;700&display=swap');
      * { box-sizing: border-box; margin: 0; padding: 0; scrollbar-width: thin; scrollbar-color: rgba(99,102,241,0.3) transparent; }
      *::-webkit-scrollbar { width: 5px; }
      *::-webkit-scrollbar-track { background: transparent; }
      *::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 10px; }
      input, textarea, select { font-family: inherit; }
      option { background: #141420; color: #f0f0f0; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleVideoClick = (video) => {
    setCurrentVideo(video);
    setPage("watch");
    window.scrollTo(0, 0);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage("search");
  };

  const handleNavigate = (p) => {
    setPage(p);
    if (p !== "watch") setCurrentVideo(null);
  };

  const renderPage = () => {
    switch (page) {
      case "home": return <HomePage onVideoClick={handleVideoClick} />;
      case "watch": return currentVideo ? <WatchPage video={currentVideo} onVideoClick={handleVideoClick} /> : <HomePage onVideoClick={handleVideoClick} />;
      case "trending": return <TrendingPage onVideoClick={handleVideoClick} />;
      case "subscriptions": return <HomePage onVideoClick={handleVideoClick} />;
      case "library": case "history": return <LibraryPage onVideoClick={handleVideoClick} />;
      case "liked": return <HomePage onVideoClick={handleVideoClick} />;
      case "watchlater": return <HomePage onVideoClick={handleVideoClick} />;
      case "upload": return <UploadStudio />;
      case "channel": return <ChannelPage onVideoClick={handleVideoClick} />;
      case "search": return <SearchResultsPage query={searchQuery} onVideoClick={handleVideoClick} />;
      case "analytics": return <AnalyticsPage />;
      default: return <HomePage onVideoClick={handleVideoClick} />;
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a14", color: "#f0f0f0",
      fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column"
    }}>
      {/* Header */}
      <header style={{
        height: 60, display: "flex", alignItems: "center", padding: "0 16px",
        gap: 16, borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(10,10,20,0.95)", backdropFilter: "blur(12px)",
        position: "sticky", top: 0, zIndex: 100, flexShrink: 0
      }}>
        {/* Logo & hamburger */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: sidebarCollapsed ? 56 : 198 }}>
          <button
            onClick={() => setSidebarCollapsed(c => !c)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: 8, color: "#c0c0d0", display: "flex" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
          </button>
          <div
            onClick={() => handleNavigate("home")}
            style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", userSelect: "none" }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #ec4899)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
            {!sidebarCollapsed && (
              <span style={{ fontSize: 17, fontWeight: 800, color: "#f0f0f0", fontFamily: "'DM Mono', monospace", letterSpacing: "-0.03em" }}>
                video<span style={{ color: "#6366f1" }}>tube</span>
              </span>
            )}
          </div>
        </div>

        {/* Search */}
        <SearchBar value={searchInput} onChange={setSearchInput} onSearch={handleSearch} />

        {/* Right icons */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => handleNavigate("upload")}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "7px 14px", color: "#c0c0d0", cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
            Upload
          </button>
          <button
            onClick={() => handleNavigate("analytics")}
            style={{ background: "transparent", border: "none", borderRadius: 10, padding: "8px", color: "#8a8a9a", cursor: "pointer", display: "flex" }}
            title="Analytics"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H7v-2h5v2zm5-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>
          </button>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotifications(n => !n)}
              style={{ background: "transparent", border: "none", borderRadius: 10, padding: "8px", color: "#8a8a9a", cursor: "pointer", display: "flex", position: "relative" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
              <div style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#ec4899", border: "2px solid #0a0a14" }}/>
            </button>
            {showNotifications && <NotificationsPanel onClose={() => setShowNotifications(false)} />}
          </div>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: avatarColors["u3"], display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", fontFamily: "'DM Mono', monospace", border: "2px solid rgba(99,102,241,0.4)" }}>
            MR
          </div>
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", height: "calc(100vh - 60px)" }}>
        <Sidebar collapsed={sidebarCollapsed} currentPage={page} onNavigate={handleNavigate} />
        {renderPage()}
      </div>

      {/* Click outside notifications */}
      {showNotifications && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setShowNotifications(false)} />
      )}
    </div>
  );
}
