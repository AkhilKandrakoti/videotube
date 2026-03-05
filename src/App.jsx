import { useState, useEffect, useRef, useCallback } from "react";

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YT_BASE = "https://www.googleapis.com/youtube/v3";

// localStorage — only used for dark mode preference (no user data stored here anymore)
const storage = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};

// ── Backend API helper ─────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "https://videotube-backend.onrender.com";

const api = {
  // Get stored token
  token: () => localStorage.getItem("vt_token"),

  // Make authenticated request
  req: async (method, path, body) => {
    const token = localStorage.getItem("vt_token");
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Request failed");
    return data;
  },

  get:    (path)       => api.req("GET",    path),
  post:   (path, body) => api.req("POST",   path, body),
  put:    (path, body) => api.req("PUT",    path, body),
  delete: (path)       => api.req("DELETE", path),
};

const fmtViews = (n) => {
  if (!n) return "0";
  const x = parseInt(n);
  if (x >= 1000000000) return `${(x/1000000000).toFixed(1)}B`;
  if (x >= 1000000) return `${(x/1000000).toFixed(1)}M`;
  if (x >= 1000) return `${(x/1000).toFixed(0)}K`;
  return x.toString();
};

const fmtDate = (d) => {
  if (!d) return "";
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff/60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff/86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff/2592000)} months ago`;
  return `${Math.floor(diff/31536000)} years ago`;
};

const fmtDur = (iso) => {
  if (!iso) return "";
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return "";
  const h=parseInt(m[1]||0), min=parseInt(m[2]||0), s=parseInt(m[3]||0);
  if (h>0) return `${h}:${String(min).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return `${min}:${String(s).padStart(2,"0")}`;
};

const COLORS = ["#6366f1","#ec4899","#f59e0b","#10b981","#3b82f6","#ef4444","#8b5cf6","#06b6d4","#f97316","#14b8a6"];
const clr = (s) => COLORS[(s||"").charCodeAt(0) % COLORS.length];
const ini = (s) => (s||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

const CATS = ["All","JavaScript","React","Python","System Design","DevOps","Machine Learning","CSS","Node.js","TypeScript","Cloud","Web Dev","Gaming","Science","Finance"];

const ytFetch = async (url) => {
  const r = await fetch(url);
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d;
};

const getDetails = async (ids) => {
  if (!ids.length) return [];
  const d = await ytFetch(`${YT_BASE}/videos?part=snippet,statistics,contentDetails&id=${ids.join(",")}&key=${API_KEY}`);
  return d.items||[];
};

const Sk = ({ w="100%", h, r=8 }) => (
  <div style={{ width:w, height:h, borderRadius:r, background:"linear-gradient(90deg,rgba(255,255,255,0.05) 25%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.05) 75%)", backgroundSize:"200% 100%", animation:"shimmer 1.5s infinite", flexShrink:0 }}/>
);

// VIDEO CARD
const VideoCard = ({ video, onClick, compact=false, dm, onCh }) => {
  const [hov, setHov] = useState(false);
  const sn=video.snippet||{}, st=video.statistics||{}, cd=video.contentDetails||{};
  const vid = video.id?.videoId||video.id;
  const thumb = sn.thumbnails?.medium?.url||"";
  const hithumb = sn.thumbnails?.high?.url||thumb;
  const ch = sn.channelTitle||"";

  if (compact) return (
    <div onClick={()=>onClick(video)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ display:"flex", gap:10, cursor:"pointer", padding:"8px 6px", borderRadius:10, background:hov?(dm?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"):"transparent", transition:"background 0.15s" }}>
      <div style={{ position:"relative", width:130, height:73, flexShrink:0, borderRadius:8, overflow:"hidden", background:"#1a1a2e" }}>
        {thumb&&<img src={thumb} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/>}
        {cd.duration&&<div style={{ position:"absolute", bottom:3, right:3, background:"rgba(0,0,0,0.85)", color:"#fff", fontSize:10, fontWeight:600, padding:"1px 5px", borderRadius:3 }}>{fmtDur(cd.duration)}</div>}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:600, color:dm?"#f0f0f0":"#0f0f0f", lineHeight:1.4, marginBottom:3, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{sn.title}</div>
        <div style={{ fontSize:11, color:dm?"#888":"#606060", cursor:"pointer", marginBottom:2 }} onClick={e=>{e.stopPropagation();onCh&&onCh(sn.channelId,ch);}}>{ch}</div>
        <div style={{ fontSize:11, color:dm?"#666":"#808080" }}>{st.viewCount?`${fmtViews(st.viewCount)} views · `:""}{fmtDate(sn.publishedAt)}</div>
      </div>
    </div>
  );

  return (
    <div onClick={()=>onClick(video)} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ cursor:"pointer", borderRadius:12, transition:"transform 0.2s", transform:hov?"translateY(-2px)":"translateY(0)" }}>
      <div style={{ position:"relative", borderRadius:10, overflow:"hidden", background:"#1a1a2e", paddingTop:"56.25%" }}>
        {thumb&&<img src={hov?hithumb:thumb} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/>}
        {cd.duration&&<div style={{ position:"absolute", bottom:6, right:6, background:"rgba(0,0,0,0.85)", color:"#fff", fontSize:11, fontWeight:600, padding:"2px 6px", borderRadius:4 }}>{fmtDur(cd.duration)}</div>}
      </div>
      <div style={{ padding:"10px 4px 8px", display:"flex", gap:10 }}>
        <div onClick={e=>{e.stopPropagation();onCh&&onCh(sn.channelId,ch);}} style={{ width:36, height:36, borderRadius:"50%", background:clr(ch), display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff", flexShrink:0, cursor:"pointer" }}>{ini(ch)}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:600, color:dm?"#f0f0f0":"#0f0f0f", lineHeight:1.45, marginBottom:4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{sn.title}</div>
          <div onClick={e=>{e.stopPropagation();onCh&&onCh(sn.channelId,ch);}} style={{ fontSize:12, color:dm?"#8a8a9a":"#606060", marginBottom:2, cursor:"pointer" }}>{ch}</div>
          <div style={{ fontSize:12, color:dm?"#666":"#808080" }}>{st.viewCount?`${fmtViews(st.viewCount)} views · `:""}{fmtDate(sn.publishedAt)}</div>
        </div>
      </div>
    </div>
  );
};

// SIDEBAR
const Sidebar = ({ collapsed, page, nav, dm, subs, onCh }) => {
  const items = [
    {id:"home",l:"Home",ic:"M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"},
    {id:"trending",l:"Trending",ic:"M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"},
    {id:"live",l:"Live",ic:"M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"},
    {id:"subscriptions",l:"Subscriptions",ic:"M20 8H4V6h16v2zm-2-6H6v2h12V2zm4 10v8l-6-4 6-4zm-8 0H2v8h12v-8z"},
    {id:"history",l:"History",ic:"M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"},
    {id:"liked",l:"Liked Videos",ic:"M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"},
    {id:"watchlater",l:"Watch Later",ic:"M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c.55 0 1-.45 1-1v-3h1v-2h-2V9h2zm-4 10H4V5h14v14zm-2-8H6v-2h10v2zm-4 4H6v-2h6v2zm4-8H6V5h10v2z"},
    {id:"upload",l:"Upload Studio",ic:"M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"},
    {id:"shorts",l:"Shorts",ic:"M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"},
    {id:"analytics",l:"Analytics",ic:"M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"},
    {id:"playlists",l:"Playlists",ic:"M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"},
  ];
  const bg=dm?"#0a0a14":"#fff", bdr=dm?"rgba(255,255,255,0.05)":"#e0e0e0";
  const ac="#6366f1", abg=dm?"rgba(99,102,241,0.15)":"rgba(99,102,241,0.1)", tc=dm?"#a0a0b0":"#606060";

  if (collapsed) return (
    <div style={{ width:64, paddingTop:12, display:"flex", flexDirection:"column", gap:4, alignItems:"center", borderRight:`1px solid ${bdr}`, background:bg, flexShrink:0 }}>
      {items.map(i=>(
        <button key={i.id} onClick={()=>nav(i.id)} title={i.l} style={{ background:page===i.id?abg:"transparent", border:"none", cursor:"pointer", borderRadius:10, padding:10, color:page===i.id?ac:tc, display:"flex" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={i.ic}/></svg>
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ width:220, padding:"12px 8px", borderRight:`1px solid ${bdr}`, overflowY:"auto", background:bg, flexShrink:0 }}>
      {items.map(i=>(
        <button key={i.id} onClick={()=>nav(i.id)}
          style={{ width:"100%", background:page===i.id?abg:"transparent", border:"none", cursor:"pointer", borderRadius:10, padding:"10px 12px", color:page===i.id?ac:tc, display:"flex", alignItems:"center", gap:12, fontSize:13, fontWeight:500, textAlign:"left", marginBottom:2 }}
          onMouseEnter={e=>{if(page!==i.id)e.currentTarget.style.background=dm?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)";}}
          onMouseLeave={e=>{if(page!==i.id)e.currentTarget.style.background="transparent";}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d={i.ic}/></svg>
          {i.l}
          {i.id==="live"&&<span style={{ marginLeft:"auto", background:"#ef4444", color:"#fff", fontSize:9, fontWeight:700, padding:"2px 5px", borderRadius:3 }}>LIVE</span>}
        </button>
      ))}
      {subs&&subs.length>0&&(
        <>
          <div style={{ height:1, background:bdr, margin:"10px 8px" }}/>
          <div style={{ padding:"4px 12px 8px", fontSize:11, color:dm?"#555":"#909090", textTransform:"uppercase", letterSpacing:"0.08em" }}>Subscriptions</div>
          {subs.map(s=>(
            <button key={s.channelId} onClick={()=>onCh(s.channelId,s.channelName)}
              style={{ width:"100%", background:"transparent", border:"none", cursor:"pointer", borderRadius:10, padding:"8px 12px", color:tc, display:"flex", alignItems:"center", gap:10, fontSize:12, fontWeight:500, textAlign:"left", marginBottom:2 }}
              onMouseEnter={e=>e.currentTarget.style.background=dm?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{ width:24, height:24, borderRadius:"50%", background:clr(s.channelName), display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#fff", flexShrink:0 }}>{ini(s.channelName)}</div>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.channelName}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
};

// HOME
const HomePage = ({ onVideoClick, dm, onCh }) => {
  const [cat, setCat] = useState("All");
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadMore, setLoadMore] = useState(false);
  const [nextTok, setNextTok] = useState("");
  const [err, setErr] = useState(null);
  const loaderRef = useRef(null);

  const load = useCallback(async (reset=false, tok="") => {
    if (!API_KEY) { setErr("Add VITE_YOUTUBE_API_KEY to Vercel environment variables"); setLoading(false); return; }
    try {
      reset?setLoading(true):setLoadMore(true);
      const q = cat==="All"?"programming tutorial technology 2024":cat;
      const pt = tok?`&pageToken=${tok}`:"";
      const data = await ytFetch(`${YT_BASE}/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=24${pt}&key=${API_KEY}`);
      const ids = (data.items||[]).map(i=>i.id?.videoId).filter(Boolean);
      if (!ids.length) { if(reset)setVideos([]); setLoading(false); setLoadMore(false); return; }
      const details = await getDetails(ids);
      setVideos(v=>reset?details:[...v,...details]);
      setNextTok(data.nextPageToken||"");
    } catch(e) { setErr(e.message); }
    finally { setLoading(false); setLoadMore(false); }
  }, [cat]);

  useEffect(()=>{ load(true); }, [load]);

  useEffect(()=>{
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(en=>{ if(en[0].isIntersecting&&nextTok&&!loadMore)load(false,nextTok); },{threshold:0.1});
    obs.observe(loaderRef.current);
    return ()=>obs.disconnect();
  }, [nextTok, loadMore, load]);

  const bg=dm?"#0a0a14":"#f9f9f9";

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"0 20px 60px", background:bg }}>
      <div style={{ display:"flex", gap:8, overflowX:"auto", padding:"12px 0", scrollbarWidth:"none", position:"sticky", top:0, background:bg, zIndex:10 }}>
        {CATS.map(c=>(
          <button key={c} onClick={()=>setCat(c)}
            style={{ flexShrink:0, padding:"7px 14px", borderRadius:24, background:cat===c?"#6366f1":(dm?"rgba(255,255,255,0.07)":"#f0f0f0"), border:`1px solid ${cat===c?"#6366f1":(dm?"rgba(255,255,255,0.1)":"#e0e0e0")}`, color:cat===c?"#fff":(dm?"#b0b0c0":"#0f0f0f"), fontSize:13, fontWeight:500, cursor:"pointer", whiteSpace:"nowrap" }}>
            {c}
          </button>
        ))}
      </div>
      {err&&<div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:12, padding:"14px 18px", color:"#ef4444", marginBottom:20, fontSize:14 }}>⚠️ {err}</div>}
      {loading?(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
          {[...Array(12)].map((_,i)=><div key={i}><Sk h={158} r={10}/><div style={{ display:"flex", gap:10, marginTop:10 }}><Sk w={36} h={36} r={18}/><div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}><Sk h={14}/><Sk w="60%" h={12}/></div></div></div>)}
        </div>
      ):(
        <>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
            {videos.map(v=><VideoCard key={v.id} video={v} onClick={onVideoClick} dm={dm} onCh={onCh}/>)}
          </div>
          <div ref={loaderRef} style={{ height:60, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {loadMore&&<div style={{ display:"flex", gap:6 }}>{[0,1,2].map(i=><div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#6366f1", animation:`bounce 0.6s ${i*0.15}s infinite alternate` }}/>)}</div>}
          </div>
        </>
      )}
    </div>
  );
};

// WATCH PAGE
const WatchPage = ({ video, onVideoClick, dm, onCh, user, history, setHistory, liked, setLiked, watchLater, setWatchLater }) => {
  const [comments, setComments] = useState([]);
  const [related, setRelated] = useState([]);
  const [subbed, setSubbed] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [cmtTxt, setCmtTxt] = useState("");
  const sn=video.snippet||{}, st=video.statistics||{};
  const vid = video.id?.videoId||video.id;
  const isLiked = !!(liked||[]).find(v=>(v.id?.videoId||v.id)===vid);
  const isWL = !!(watchLater||[]).find(v=>(v.id?.videoId||v.id)===vid);

  useEffect(()=>{
    if (!vid) return;
    const h = history||[];
    const newH = [video, ...h.filter(v=>(v.id?.videoId||v.id)!==vid)].slice(0,100);
    setHistory(newH);
    if(user) api.post("/api/user/history",{ videoId:vid, title:sn.title, thumbnail:sn.thumbnails?.medium?.url, channelTitle:sn.channelTitle, channelId:sn.channelId }).catch(()=>{});
    if (!API_KEY) return;
    fetch(`${YT_BASE}/commentThreads?part=snippet&videoId=${vid}&maxResults=30&order=relevance&key=${API_KEY}`)
      .then(r=>r.json()).then(d=>{ if(!d.error)setComments(d.items||[]); }).catch(()=>{});
    fetch(`${YT_BASE}/search?part=snippet&relatedToVideoId=${vid}&type=video&maxResults=15&key=${API_KEY}`)
      .then(r=>r.json()).then(async d=>{
        if(d.error) return;
        const ids=(d.items||[]).map(i=>i.id?.videoId).filter(Boolean);
        if(!ids.length) return;
        const det = await getDetails(ids).catch(()=>[]);
        setRelated(det);
      }).catch(()=>{});
  }, [vid]);

  const toggleLike = () => {
    const l=liked||[];
    const newL = isLiked?l.filter(v=>(v.id?.videoId||v.id)!==vid):[video,...l];
    setLiked(newL);
    if(user) api.post("/api/user/liked",{ videoId:vid, title:sn.title, thumbnail:sn.thumbnails?.medium?.url, channelTitle:sn.channelTitle, channelId:sn.channelId, viewCount:st.viewCount, likeCount:st.likeCount, duration:cd.duration, publishedAt:sn.publishedAt }).catch(()=>{});
  };
  const toggleWL = () => {
    const w=watchLater||[];
    const newW = isWL?w.filter(v=>(v.id?.videoId||v.id)!==vid):[video,...w];
    setWatchLater(newW);
    if(user) api.post("/api/user/watchlater",{ videoId:vid, title:sn.title, thumbnail:sn.thumbnails?.medium?.url, channelTitle:sn.channelTitle, channelId:sn.channelId, viewCount:st.viewCount, duration:cd.duration, publishedAt:sn.publishedAt }).catch(()=>{});
  };

  const tp=dm?"#f0f0f0":"#0f0f0f", ts=dm?"#8a8a9a":"#606060", bg=dm?"#0a0a14":"#f9f9f9";

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 20px 80px", background:bg }}>
      <div style={{ display:"flex", gap:28, maxWidth:1400, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:300 }}>
          <div style={{ position:"relative", paddingTop:"56.25%", borderRadius:12, overflow:"hidden", background:"#000" }}>
            <iframe src={`https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`}
              style={{ position:"absolute", inset:0, width:"100%", height:"100%", border:"none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={sn.title}/>
          </div>
          <h1 style={{ color:tp, fontSize:18, fontWeight:700, marginTop:16, marginBottom:12, lineHeight:1.4 }}>{sn.title}</h1>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:16 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div onClick={()=>onCh(sn.channelId,sn.channelTitle)} style={{ width:42, height:42, borderRadius:"50%", background:clr(sn.channelTitle), display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:700, color:"#fff", cursor:"pointer" }}>{ini(sn.channelTitle)}</div>
              <div>
                <div onClick={()=>onCh(sn.channelId,sn.channelTitle)} style={{ color:tp, fontSize:15, fontWeight:600, cursor:"pointer" }}>{sn.channelTitle}</div>
              </div>
              <button onClick={()=>setSubbed(s=>!s)} style={{ padding:"8px 18px", borderRadius:24, border:"none", cursor:"pointer", background:subbed?(dm?"rgba(255,255,255,0.1)":"#e0e0e0"):"#6366f1", color:subbed?ts:"#fff", fontSize:13, fontWeight:600 }}>{subbed?"Subscribed ✓":"Subscribe"}</button>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[
                {l:isLiked?`▲ ${fmtViews(parseInt(st.likeCount||0)+1)}`:`▲ ${fmtViews(st.likeCount)}`, a:toggleLike, on:isLiked},
                {l:isWL?"✓ Saved":"⊕ Save", a:toggleWL, on:isWL},
                {l:"↗ Share", a:()=>{ try{navigator.share({title:sn.title,url:`https://youtube.com/watch?v=${vid}`})}catch{navigator.clipboard.writeText(`https://youtube.com/watch?v=${vid}`)} }},
              ].map(b=>(
                <button key={b.l} onClick={b.a} style={{ padding:"8px 14px", borderRadius:24, background:b.on?"rgba(99,102,241,0.25)":(dm?"rgba(255,255,255,0.07)":"#f0f0f0"), border:`1px solid ${b.on?"rgba(99,102,241,0.5)":(dm?"rgba(255,255,255,0.1)":"#e0e0e0")}`, color:b.on?"#8b8cf8":ts, fontSize:13, fontWeight:500, cursor:"pointer" }}>{b.l}</button>
              ))}
            </div>
          </div>
          <div style={{ background:dm?"rgba(255,255,255,0.04)":"#fff", borderRadius:12, padding:"14px 16px", marginBottom:20, border:dm?"none":"1px solid #e0e0e0" }}>
            <div style={{ color:ts, fontSize:13, lineHeight:1.7 }}>
              <div style={{ display:"flex", gap:16, marginBottom:8, flexWrap:"wrap", color:dm?"#aaa":"#333", fontSize:13, fontWeight:600 }}>
                <span>{fmtViews(st.viewCount)} views</span><span>{fmtDate(sn.publishedAt)}</span>
                <span>💬 {fmtViews(st.commentCount)}</span><span>👍 {fmtViews(st.likeCount)}</span>
              </div>
              <div style={{ whiteSpace:"pre-wrap", wordBreak:"break-word", color:ts }}>{showDesc?sn.description:(sn.description||"").slice(0,200)+"..."}</div>
            </div>
            <button onClick={()=>setShowDesc(s=>!s)} style={{ background:"none", border:"none", color:"#6366f1", cursor:"pointer", fontSize:13, fontWeight:600, marginTop:8, padding:0 }}>{showDesc?"Show less":"...more"}</button>
          </div>
          <div style={{ fontSize:16, fontWeight:700, color:tp, marginBottom:16 }}>{fmtViews(st.commentCount)} Comments</div>
          {user&&(
            <div style={{ display:"flex", gap:12, marginBottom:24 }}>
              <div style={{ width:36, height:36, borderRadius:"50%", background:"#6366f1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff", flexShrink:0 }}>{ini(user.name)}</div>
              <div style={{ flex:1 }}>
                <input value={cmtTxt} onChange={e=>setCmtTxt(e.target.value)} placeholder="Add a comment..."
                  style={{ width:"100%", background:"transparent", border:"none", borderBottom:`1px solid ${dm?"rgba(255,255,255,0.15)":"#e0e0e0"}`, outline:"none", color:tp, fontSize:14, padding:"8px 0", boxSizing:"border-box" }}/>
                {cmtTxt&&<div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:8 }}>
                  <button onClick={()=>setCmtTxt("")} style={{ background:"none", border:"none", color:ts, cursor:"pointer", fontSize:13 }}>Cancel</button>
                  <button style={{ background:"#6366f1", border:"none", color:"#fff", borderRadius:20, padding:"6px 16px", cursor:"pointer", fontSize:13, fontWeight:600 }}>Comment</button>
                </div>}
              </div>
            </div>
          )}
          {comments.map(c=>{
            const t=c.snippet?.topLevelComment?.snippet||{};
            return (
              <div key={c.id} style={{ display:"flex", gap:12, marginBottom:20 }}>
                <img src={t.authorProfileImageUrl} alt="" style={{ width:36, height:36, borderRadius:"50%", flexShrink:0, background:"#333", objectFit:"cover" }} onError={e=>e.target.style.display="none"}/>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:4 }}>
                    <span style={{ color:tp, fontSize:13, fontWeight:600 }}>{t.authorDisplayName}</span>
                    <span style={{ color:dm?"#555":"#909090", fontSize:12 }}>{fmtDate(t.publishedAt)}</span>
                  </div>
                  <div style={{ color:ts, fontSize:14, lineHeight:1.6, marginBottom:6, whiteSpace:"pre-wrap", wordBreak:"break-word" }}>{t.textDisplay}</div>
                  <div style={{ display:"flex", gap:12 }}>
                    <span style={{ color:dm?"#888":"#606060", fontSize:13 }}>▲ {fmtViews(t.likeCount)}</span>
                    <button style={{ background:"none", border:"none", color:dm?"#888":"#606060", cursor:"pointer", fontSize:13 }}>Reply</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ width:360, flexShrink:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:ts, marginBottom:12, textTransform:"uppercase", letterSpacing:"0.06em" }}>Up Next</div>
          {related.length>0?related.map(v=><VideoCard key={v.id} video={v} onClick={onVideoClick} compact dm={dm} onCh={onCh}/>):
            [...Array(6)].map((_,i)=><div key={i} style={{ display:"flex", gap:10, marginBottom:12 }}><Sk w={130} h={73} r={8}/><div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}><Sk h={12}/><Sk w="70%" h={10}/></div></div>)
          }
        </div>
      </div>
    </div>
  );
};

// TRENDING
const TrendingPage = ({ onVideoClick, dm, onCh }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadMore, setLoadMore] = useState(false);
  const [nextTok, setNextTok] = useState("");
  const loaderRef = useRef(null);

  const load = useCallback(async (reset=false, tok="") => {
    if (!API_KEY) { setLoading(false); return; }
    try {
      reset?setLoading(true):setLoadMore(true);
      const pt=tok?`&pageToken=${tok}`:"";
      const data = await ytFetch(`${YT_BASE}/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=US&maxResults=50${pt}&key=${API_KEY}`);
      setVideos(v=>reset?(data.items||[]):[...v,...(data.items||[])]);
      setNextTok(data.nextPageToken||"");
    } catch(e) {}
    finally { setLoading(false); setLoadMore(false); }
  }, []);

  useEffect(()=>{ load(true); },[load]);
  useEffect(()=>{
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(en=>{ if(en[0].isIntersecting&&nextTok&&!loadMore)load(false,nextTok); },{threshold:0.1});
    obs.observe(loaderRef.current); return ()=>obs.disconnect();
  }, [nextTok, loadMore, load]);

  const bg=dm?"#0a0a14":"#f9f9f9", tp=dm?"#f0f0f0":"#0f0f0f", ts=dm?"#8a8a9a":"#606060", bdr=dm?"rgba(255,255,255,0.05)":"#e0e0e0";

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 20px 80px", background:bg }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <div style={{ width:4, height:28, background:"linear-gradient(180deg,#6366f1,#ec4899)", borderRadius:2 }}/>
        <h2 style={{ color:tp, fontSize:22, fontWeight:700, margin:0 }}>🔥 Trending</h2>
      </div>
      {loading?(<div style={{ display:"flex", flexDirection:"column", gap:16 }}>{[...Array(8)].map((_,i)=><div key={i} style={{ display:"flex", gap:16 }}><Sk w={200} h={112} r={10}/><div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}><Sk h={16}/><Sk w="50%" h={12}/></div></div>)}</div>):(
        <>
          {videos.map((video,i)=>{
            const sn=video.snippet||{}, st=video.statistics||{};
            return (
              <div key={video.id} onClick={()=>onVideoClick(video)} style={{ display:"flex", gap:16, padding:"14px 0", borderBottom:`1px solid ${bdr}`, cursor:"pointer" }}
                onMouseEnter={e=>e.currentTarget.style.background=dm?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div style={{ fontSize:22, fontWeight:800, color:i<3?"#6366f1":(dm?"#333":"#ccc"), width:36, textAlign:"center", paddingTop:4, flexShrink:0 }}>{i+1}</div>
                <div style={{ position:"relative", width:200, height:112, flexShrink:0, borderRadius:10, overflow:"hidden", background:"#1a1a2e" }}>
                  {sn.thumbnails?.medium?.url&&<img src={sn.thumbnails.medium.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/>}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:16, fontWeight:600, color:tp, marginBottom:8, lineHeight:1.4 }}>{sn.title}</div>
                  <div onClick={e=>{e.stopPropagation();onCh(sn.channelId,sn.channelTitle);}} style={{ fontSize:13, color:ts, marginBottom:4, cursor:"pointer" }}>{sn.channelTitle}</div>
                  <div style={{ display:"flex", gap:16, fontSize:12, color:dm?"#666":"#909090" }}>
                    <span>{fmtViews(st.viewCount)} views</span><span>{fmtDate(sn.publishedAt)}</span><span>▲ {fmtViews(st.likeCount)}</span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={loaderRef} style={{ height:60, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {loadMore&&<div style={{ display:"flex", gap:6 }}>{[0,1,2].map(i=><div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#6366f1", animation:`bounce 0.6s ${i*0.15}s infinite alternate` }}/>)}</div>}
          </div>
        </>
      )}
    </div>
  );
};

// CHANNEL PAGE
const ChannelPage = ({ channelId, channelName, onVideoClick, dm, subs, setSubs }) => {
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadMore, setLoadMore] = useState(false);
  const [nextTok, setNextTok] = useState("");
  const [tab, setTab] = useState("Videos");
  const loaderRef = useRef(null);
  const isSubbed = !!(subs||[]).find(s=>s.channelId===channelId);

  const loadVideos = useCallback(async (reset=false, tok="") => {
    if (!API_KEY||!channelId) return;
    try {
      reset?setLoading(true):setLoadMore(true);
      const pt=tok?`&pageToken=${tok}`:"";
      const data = await ytFetch(`${YT_BASE}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=30${pt}&key=${API_KEY}`);
      const ids=(data.items||[]).map(i=>i.id?.videoId).filter(Boolean);
      if (ids.length) {
        const details = await getDetails(ids);
        setVideos(v=>reset?details:[...v,...details]);
      }
      setNextTok(data.nextPageToken||"");
    } catch(e) {}
    finally { setLoading(false); setLoadMore(false); }
  }, [channelId]);

  useEffect(()=>{
    setVideos([]); setNextTok("");
    if (channelId&&API_KEY) {
      ytFetch(`${YT_BASE}/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${API_KEY}`).then(d=>setChannel(d.items?.[0]||null)).catch(()=>{});
      loadVideos(true);
    }
  }, [channelId]);

  useEffect(()=>{
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(en=>{ if(en[0].isIntersecting&&nextTok&&!loadMore)loadVideos(false,nextTok); },{threshold:0.1});
    obs.observe(loaderRef.current); return ()=>obs.disconnect();
  }, [nextTok, loadMore, loadVideos]);

  const toggleSub = () => {
    const s=subs||[], n=channel?.snippet?.title||channelName;
    const newS = isSubbed?s.filter(x=>x.channelId!==channelId):[...s,{channelId,channelName:n}];
    setSubs(newS);
    if(user) api.post("/api/user/subscriptions",{ channelId, channelName:ch.snippet?.title||channelName }).catch(()=>{});
  };

  const sn=channel?.snippet||{}, st=channel?.statistics||{};
  const bg=dm?"#0a0a14":"#f9f9f9", tp=dm?"#f0f0f0":"#0f0f0f", ts=dm?"#8a8a9a":"#606060", bdr=dm?"rgba(255,255,255,0.07)":"#e0e0e0";
  const name=sn.title||channelName, banner=channel?.brandingSettings?.image?.bannerExternalUrl, avatar=sn.thumbnails?.high?.url||sn.thumbnails?.default?.url;

  return (
    <div style={{ flex:1, overflowY:"auto", background:bg }}>
      <div style={{ height:180, background:banner?`url(${banner}) center/cover no-repeat`:`linear-gradient(135deg,${clr(name)}33,${clr(name)}88,#0a0a1a)` }}/>
      <div style={{ padding:"0 28px 20px", borderBottom:`1px solid ${bdr}` }}>
        <div style={{ display:"flex", alignItems:"flex-end", gap:20, marginTop:-40, marginBottom:16 }}>
          {avatar?<img src={avatar} alt="" style={{ width:88, height:88, borderRadius:"50%", border:`4px solid ${bg}`, flexShrink:0, objectFit:"cover" }}/>:
            <div style={{ width:88, height:88, borderRadius:"50%", background:clr(name), display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, fontWeight:700, color:"#fff", border:`4px solid ${bg}`, flexShrink:0 }}>{ini(name)}</div>}
          <div style={{ flex:1, paddingBottom:4 }}>
            <div style={{ fontSize:22, fontWeight:800, color:tp, marginBottom:4 }}>{name}</div>
            <div style={{ fontSize:13, color:ts }}>{fmtViews(st.subscriberCount)} subscribers · {fmtViews(st.videoCount)} videos · {fmtViews(st.viewCount)} total views</div>
          </div>
          <button onClick={toggleSub} style={{ padding:"10px 24px", borderRadius:24, border:"none", cursor:"pointer", background:isSubbed?(dm?"rgba(255,255,255,0.1)":"#e0e0e0"):"#6366f1", color:isSubbed?ts:"#fff", fontSize:14, fontWeight:600 }}>{isSubbed?"Subscribed ✓":"Subscribe"}</button>
        </div>
        <div style={{ display:"flex" }}>
          {["Videos","About"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{ background:"none", border:"none", borderBottom:`2px solid ${tab===t?"#6366f1":"transparent"}`, color:tab===t?tp:ts, padding:"10px 20px", cursor:"pointer", fontSize:14, fontWeight:tab===t?700:500 }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ padding:"24px 28px" }}>
        {tab==="Videos"&&(
          loading?(
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:20 }}>
              {[...Array(8)].map((_,i)=><div key={i}><Sk h={135} r={10}/><div style={{ display:"flex", gap:10, marginTop:10 }}><Sk w={36} h={36} r={18}/><div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}><Sk h={14}/><Sk w="60%" h={12}/></div></div></div>)}
            </div>
          ):(
            <>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:20 }}>
                {videos.map(v=><VideoCard key={v.id} video={v} onClick={onVideoClick} dm={dm} onCh={()=>{}}/>)}
              </div>
              <div ref={loaderRef} style={{ height:60, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {loadMore&&<div style={{ display:"flex", gap:6 }}>{[0,1,2].map(i=><div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#6366f1", animation:`bounce 0.6s ${i*0.15}s infinite alternate` }}/>)}</div>}
              </div>
            </>
          )
        )}
        {tab==="About"&&(
          <div style={{ maxWidth:600 }}>
            <div style={{ color:ts, fontSize:15, lineHeight:1.8, marginBottom:20 }}>{sn.description||"No description."}</div>
            {[["Subscribers",fmtViews(st.subscriberCount)],["Total Views",fmtViews(st.viewCount)],["Videos",fmtViews(st.videoCount)],["Joined",sn.publishedAt?new Date(sn.publishedAt).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"}):"—"]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", gap:16, fontSize:14, marginBottom:10 }}>
                <span style={{ color:dm?"#666":"#909090", width:130 }}>{k}</span><span style={{ color:tp }}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// SEARCH PAGE
const SearchPage = ({ query, onVideoClick, dm, onCh }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadMore, setLoadMore] = useState(false);
  const [nextTok, setNextTok] = useState("");
  const loaderRef = useRef(null);

  const load = useCallback(async (reset=false, tok="") => {
    if (!query||!API_KEY) { setLoading(false); return; }
    try {
      reset?setLoading(true):setLoadMore(true);
      const pt=tok?`&pageToken=${tok}`:"";
      const data = await ytFetch(`${YT_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=20${pt}&key=${API_KEY}`);
      const ids=(data.items||[]).map(i=>i.id?.videoId).filter(Boolean);
      if (!ids.length) { if(reset)setVideos([]); setLoading(false); setLoadMore(false); return; }
      const details = await getDetails(ids);
      setVideos(v=>reset?details:[...v,...details]);
      setNextTok(data.nextPageToken||"");
    } catch(e) {}
    finally { setLoading(false); setLoadMore(false); }
  }, [query]);

  useEffect(()=>{ load(true); },[load]);
  useEffect(()=>{
    if (!loaderRef.current) return;
    const obs = new IntersectionObserver(en=>{ if(en[0].isIntersecting&&nextTok&&!loadMore)load(false,nextTok); },{threshold:0.1});
    obs.observe(loaderRef.current); return ()=>obs.disconnect();
  }, [nextTok, loadMore, load]);

  const bg=dm?"#0a0a14":"#f9f9f9", tp=dm?"#f0f0f0":"#0f0f0f", ts=dm?"#666":"#606060";

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 20px 80px", background:bg }}>
      <div style={{ marginBottom:16, color:ts, fontSize:14 }}>{loading?"Searching...":videos.length===0?`No results for "${query}"`:` ${videos.length}+ results for "${query}"`}</div>
      {loading?(<div style={{ display:"flex", flexDirection:"column", gap:16 }}>{[...Array(6)].map((_,i)=><div key={i} style={{ display:"flex", gap:16 }}><Sk w={248} h={140} r={10}/><div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}><Sk h={16}/><Sk w="40%" h={12}/><Sk w="60%" h={12}/></div></div>)}</div>):(
        <>
          <div style={{ display:"flex", flexDirection:"column", gap:4, maxWidth:900 }}>
            {videos.map(video=>{
              const sn=video.snippet||{}, st=video.statistics||{};
              return (
                <div key={video.id} onClick={()=>onVideoClick(video)} style={{ display:"flex", gap:16, cursor:"pointer", borderRadius:12, padding:8 }}
                  onMouseEnter={e=>e.currentTarget.style.background=dm?"rgba(255,255,255,0.03)":"rgba(0,0,0,0.03)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{ position:"relative", width:248, height:140, flexShrink:0, borderRadius:10, overflow:"hidden", background:"#1a1a2e" }}>
                    {sn.thumbnails?.medium?.url&&<img src={sn.thumbnails.medium.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/>}
                  </div>
                  <div style={{ flex:1, paddingTop:4 }}>
                    <div style={{ fontSize:16, fontWeight:600, color:tp, marginBottom:8, lineHeight:1.4 }}>{sn.title}</div>
                    <div style={{ fontSize:12, color:ts, marginBottom:6 }}>{fmtViews(st.viewCount)} views · {fmtDate(sn.publishedAt)}</div>
                    <div onClick={e=>{e.stopPropagation();onCh(sn.channelId,sn.channelTitle);}} style={{ fontSize:13, color:dm?"#8a8a9a":"#606060", marginBottom:8, cursor:"pointer" }}>{sn.channelTitle}</div>
                    <div style={{ fontSize:13, color:ts, lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{sn.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div ref={loaderRef} style={{ height:60, display:"flex", alignItems:"center", justifyContent:"center" }}>
            {loadMore&&<div style={{ display:"flex", gap:6 }}>{[0,1,2].map(i=><div key={i} style={{ width:8, height:8, borderRadius:"50%", background:"#6366f1", animation:`bounce 0.6s ${i*0.15}s infinite alternate` }}/>)}</div>}
          </div>
        </>
      )}
    </div>
  );
};

// HISTORY PAGE
const HistoryPage = ({ history, setHistory, onVideoClick, dm }) => {
  const clear = () => { setHistory([]); api.delete("/api/user/history").catch(()=>{}); };
  const remove = (vid) => { const h=history.filter(v=>(v.id?.videoId||v.id)!==vid); setHistory(h); api.delete(`/api/user/history/${vid}`).catch(()=>{}); };
  const bg=dm?"#0a0a14":"#f9f9f9", tp=dm?"#f0f0f0":"#0f0f0f", ts=dm?"#8a8a9a":"#606060", bdr=dm?"rgba(255,255,255,0.05)":"#e0e0e0";

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 28px 80px", background:bg }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:4, height:28, background:"linear-gradient(180deg,#6366f1,#ec4899)", borderRadius:2 }}/>
          <h2 style={{ color:tp, fontSize:22, fontWeight:700, margin:0 }}>📜 Watch History</h2>
        </div>
        {history.length>0&&<button onClick={clear} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444", padding:"8px 16px", borderRadius:20, cursor:"pointer", fontSize:13, fontWeight:600 }}>Clear All</button>}
      </div>
      {history.length===0?(
        <div style={{ textAlign:"center", padding:"80px 20px" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📺</div>
          <div style={{ color:tp, fontSize:18, fontWeight:600, marginBottom:8 }}>No watch history yet</div>
          <div style={{ color:ts, fontSize:14 }}>Videos you watch will appear here</div>
        </div>
      ):history.map(video=>{
        const sn=video.snippet||{}, st=video.statistics||{}, vid=video.id?.videoId||video.id;
        return (
          <div key={vid} style={{ display:"flex", gap:16, padding:"12px 0", borderBottom:`1px solid ${bdr}`, alignItems:"center" }}>
            <div onClick={()=>onVideoClick(video)} style={{ position:"relative", width:200, height:112, flexShrink:0, borderRadius:10, overflow:"hidden", background:"#1a1a2e", cursor:"pointer" }}>
              {sn.thumbnails?.medium?.url&&<img src={sn.thumbnails.medium.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/>}
            </div>
            <div style={{ flex:1, cursor:"pointer" }} onClick={()=>onVideoClick(video)}>
              <div style={{ fontSize:15, fontWeight:600, color:tp, marginBottom:6, lineHeight:1.4 }}>{sn.title}</div>
              <div style={{ fontSize:13, color:ts, marginBottom:4 }}>{sn.channelTitle}</div>
              <div style={{ fontSize:12, color:dm?"#555":"#909090" }}>{fmtViews(st.viewCount)} views · {fmtDate(sn.publishedAt)}</div>
            </div>
            <button onClick={()=>remove(vid)} style={{ background:"none", border:"none", color:dm?"#555":"#909090", cursor:"pointer", fontSize:20, padding:8 }}>✕</button>
          </div>
        );
      })}
    </div>
  );
};

// SAVED PAGE (liked / watch later)
const SavedPage = ({ items, setItems, stKey, title, icon, emptyMsg, onVideoClick, dm }) => {
  const apiPath = stKey==="vt_liked"?"/api/user/liked":"/api/user/watchlater";
  const clear = () => { setItems([]); };
  const remove = (vid) => {
    const n=items.filter(v=>(v.id?.videoId||v.id)!==vid); setItems(n);
    // Toggle off on backend by sending the videoId
    api.post(apiPath,{ videoId: vid }).catch(()=>{});
  };
  const bg=dm?"#0a0a14":"#f9f9f9", tp=dm?"#f0f0f0":"#0f0f0f", ts=dm?"#8a8a9a":"#606060";

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 28px 80px", background:bg }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:4, height:28, background:"linear-gradient(180deg,#6366f1,#ec4899)", borderRadius:2 }}/>
          <h2 style={{ color:tp, fontSize:22, fontWeight:700, margin:0 }}>{icon} {title}</h2>
        </div>
        {items.length>0&&<button onClick={clear} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444", padding:"8px 16px", borderRadius:20, cursor:"pointer", fontSize:13, fontWeight:600 }}>Clear All</button>}
      </div>
      {items.length===0?(
        <div style={{ textAlign:"center", padding:"80px 20px" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>{icon}</div>
          <div style={{ color:tp, fontSize:18, fontWeight:600, marginBottom:8 }}>{emptyMsg}</div>
          <div style={{ color:ts, fontSize:14 }}>Videos you save will appear here</div>
        </div>
      ):(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
          {items.map(video=>{
            const vid=video.id?.videoId||video.id;
            return (
              <div key={vid} style={{ position:"relative" }}>
                <VideoCard video={video} onClick={onVideoClick} dm={dm} onCh={()=>{}}/>
                <button onClick={()=>remove(vid)} style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.7)", border:"none", color:"#fff", borderRadius:"50%", width:28, height:28, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// SUBSCRIPTIONS PAGE
const SubsPage = ({ subs, onVideoClick, dm, onCh }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const bg=dm?"#0a0a14":"#f9f9f9", tp=dm?"#f0f0f0":"#0f0f0f", ts=dm?"#8a8a9a":"#606060";

  useEffect(()=>{
    if (!subs||subs.length===0||!API_KEY) { setLoading(false); return; }
    const loadAll = async () => {
      const all = [];
      for (const sub of subs.slice(0,5)) {
        try {
          const data = await ytFetch(`${YT_BASE}/search?part=snippet&channelId=${sub.channelId}&type=video&order=date&maxResults=6&key=${API_KEY}`);
          const ids=(data.items||[]).map(i=>i.id?.videoId).filter(Boolean);
          if (ids.length) { const det=await getDetails(ids); all.push(...det); }
        } catch(e) {}
      }
      all.sort((a,b)=>new Date(b.snippet?.publishedAt)-new Date(a.snippet?.publishedAt));
      setVideos(all); setLoading(false);
    };
    loadAll();
  }, [subs]);

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 28px 80px", background:bg }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
        <div style={{ width:4, height:28, background:"linear-gradient(180deg,#6366f1,#ec4899)", borderRadius:2 }}/>
        <h2 style={{ color:tp, fontSize:22, fontWeight:700, margin:0 }}>📢 Subscriptions</h2>
      </div>
      {!subs||subs.length===0?(
        <div style={{ textAlign:"center", padding:"80px 20px" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📢</div>
          <div style={{ color:tp, fontSize:18, fontWeight:600, marginBottom:8 }}>No subscriptions yet</div>
          <div style={{ color:ts, fontSize:14 }}>Click Subscribe on any channel to see their videos here</div>
        </div>
      ):loading?(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
          {[...Array(8)].map((_,i)=><div key={i}><Sk h={158} r={10}/><div style={{ display:"flex", gap:10, marginTop:10 }}><Sk w={36} h={36} r={18}/><div style={{ flex:1, display:"flex", flexDirection:"column", gap:6 }}><Sk h={14}/><Sk w="60%" h={12}/></div></div></div>)}
        </div>
      ):(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
          {videos.map(v=><VideoCard key={v.id} video={v} onClick={onVideoClick} dm={dm} onCh={onCh}/>)}
        </div>
      )}
    </div>
  );
};

// LIVE PAGE
const LivePage = ({ onVideoClick, dm, onCh }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts] = useState(()=>Array.from({length:20},()=>Math.floor(Math.random()*80000)+500));
  const bg=dm?"#0a0a14":"#f9f9f9", tp=dm?"#f0f0f0":"#0f0f0f", ts=dm?"#8a8a9a":"#606060";

  useEffect(()=>{
    if (!API_KEY) { setLoading(false); return; }
    ytFetch(`${YT_BASE}/search?part=snippet&q=live+stream+technology+programming&type=video&maxResults=20&key=${API_KEY}`)
      .then(async data=>{ const ids=(data.items||[]).map(i=>i.id?.videoId).filter(Boolean); if(!ids.length){setLoading(false);return;} const det=await getDetails(ids); setVideos(det); setLoading(false); })
      .catch(()=>setLoading(false));
  }, []);

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 20px 80px", background:bg }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
        <div style={{ width:10, height:10, borderRadius:"50%", background:"#ef4444", animation:"pulse 1.5s infinite" }}/>
        <h2 style={{ color:tp, fontSize:22, fontWeight:700, margin:0 }}>Live Now</h2>
      </div>
      <div style={{ color:ts, fontSize:13, marginBottom:24 }}>Live and recent streams from around the world</div>
      {loading?(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
          {[...Array(8)].map((_,i)=><div key={i}><Sk h={158} r={10}/></div>)}
        </div>
      ):(
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
          {videos.map((video,i)=>{
            const sn=video.snippet||{};
            return (
              <div key={video.id} onClick={()=>onVideoClick(video)} style={{ cursor:"pointer", borderRadius:12, overflow:"hidden", background:dm?"#141420":"#fff" }}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                <div style={{ position:"relative", paddingTop:"56.25%", background:"#1a1a2e" }}>
                  {sn.thumbnails?.medium?.url&&<img src={sn.thumbnails.medium.url} alt="" style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} loading="lazy"/>}
                  <div style={{ position:"absolute", top:8, left:8, background:"#ef4444", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:4 }}>● LIVE</div>
                  <div style={{ position:"absolute", bottom:8, right:8, background:"rgba(0,0,0,0.8)", color:"#fff", fontSize:11, padding:"2px 8px", borderRadius:4 }}>👁 {fmtViews(counts[i])} watching</div>
                </div>
                <div style={{ padding:"10px", display:"flex", gap:10 }}>
                  <div onClick={e=>{e.stopPropagation();onCh(sn.channelId,sn.channelTitle);}} style={{ width:36, height:36, borderRadius:"50%", background:clr(sn.channelTitle), display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff", flexShrink:0, cursor:"pointer" }}>{ini(sn.channelTitle)}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:14, fontWeight:600, color:tp, lineHeight:1.4, marginBottom:4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{sn.title}</div>
                    <div style={{ fontSize:12, color:ts }}>{sn.channelTitle}</div>
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
const UploadPage = ({ dm }) => {
  const [stage, setStage] = useState("select");
  const [dragOver, setDragOver] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [progress, setProgress] = useState(0);
  const bg=dm?"#0a0a14":"#f9f9f9", tp=dm?"#f0f0f0":"#0f0f0f", ib=dm?"rgba(255,255,255,0.05)":"#fff", ibdr=dm?"rgba(255,255,255,0.1)":"#e0e0e0";

  const simulate = () => {
    setStage("processing"); let p=0;
    const iv=setInterval(()=>{ p+=Math.random()*6; if(p>=100){p=100;clearInterval(iv);setTimeout(()=>setStage("done"),500);} setProgress(p); },200);
  };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"28px 32px 80px", background:bg }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
        <div style={{ width:4, height:28, background:"linear-gradient(180deg,#6366f1,#ec4899)", borderRadius:2 }}/>
        <h2 style={{ color:tp, fontSize:22, fontWeight:700, margin:0 }}>Upload Studio</h2>
      </div>
      {stage==="select"&&(
        <div onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{e.preventDefault();setDragOver(false);setStage("details");}} onClick={()=>setStage("details")}
          style={{ border:`2px dashed ${dragOver?"#6366f1":ibdr}`, borderRadius:20, padding:"60px 40px", textAlign:"center", cursor:"pointer", background:dragOver?"rgba(99,102,241,0.05)":ib }}>
          <div style={{ fontSize:56, marginBottom:16 }}>📹</div>
          <div style={{ fontSize:20, fontWeight:700, color:tp, marginBottom:8 }}>Drag & drop your video here</div>
          <div style={{ fontSize:14, color:dm?"#666":"#909090", marginBottom:20 }}>MP4, MKV, MOV, AVI · Up to 128GB</div>
          <button style={{ padding:"12px 28px", background:"#6366f1", border:"none", borderRadius:24, color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer" }}>Select File</button>
        </div>
      )}
      {stage==="details"&&(
        <div style={{ maxWidth:600 }}>
          <div style={{ marginBottom:18 }}>
            <label style={{ display:"block", color:dm?"#888":"#606060", fontSize:12, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Title *</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Add a title..."
              style={{ width:"100%", background:ib, border:`1px solid ${ibdr}`, borderRadius:10, padding:"12px 14px", color:tp, fontSize:14, outline:"none", boxSizing:"border-box" }}/>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={{ display:"block", color:dm?"#888":"#606060", fontSize:12, marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" }}>Description</label>
            <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Tell viewers about your video..." rows={5}
              style={{ width:"100%", background:ib, border:`1px solid ${ibdr}`, borderRadius:10, padding:"12px 14px", color:tp, fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box" }}/>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <button onClick={simulate} style={{ padding:"13px 32px", background:"#6366f1", border:"none", borderRadius:24, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>Upload & Publish</button>
            <button onClick={()=>setStage("select")} style={{ padding:"13px 24px", background:"transparent", border:`1px solid ${ibdr}`, borderRadius:24, color:dm?"#888":"#606060", fontSize:15, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}
      {stage==="processing"&&(
        <div style={{ textAlign:"center", padding:"60px 20px" }}>
          <div style={{ fontSize:48, marginBottom:20 }}>⚡</div>
          <h3 style={{ color:tp, marginBottom:8 }}>Processing your video...</h3>
          <div style={{ color:dm?"#666":"#909090", marginBottom:32 }}>Transcoding · Generating HLS · Distributing to CDN</div>
          <div style={{ maxWidth:400, margin:"0 auto" }}>
            <div style={{ background:dm?"rgba(255,255,255,0.07)":"#e0e0e0", borderRadius:8, height:8, overflow:"hidden", marginBottom:8 }}>
              <div style={{ width:`${progress}%`, height:"100%", background:"linear-gradient(90deg,#6366f1,#ec4899)", borderRadius:8, transition:"width 0.2s" }}/>
            </div>
            <div style={{ color:dm?"#888":"#606060", fontSize:14 }}>{Math.floor(progress)}%</div>
          </div>
        </div>
      )}
      {stage==="done"&&(
        <div style={{ textAlign:"center", padding:"60px 20px" }}>
          <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(16,185,129,0.2)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 24px", border:"2px solid rgba(16,185,129,0.4)" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="#10b981"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
          </div>
          <h3 style={{ color:tp, marginBottom:8, fontSize:22 }}>Video Published! 🎉</h3>
          <button onClick={()=>{setStage("select");setProgress(0);setTitle("");setDesc("");}} style={{ padding:"12px 28px", background:"#6366f1", border:"none", borderRadius:24, color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer", marginTop:16 }}>Upload Another</button>
        </div>
      )}
    </div>
  );
};

// LOGIN PAGE
const LoginPage = ({ onLogin, dm, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState(""), [pass, setPass] = useState(""), [name, setName] = useState(""), [err, setErr] = useState("");
  const bg=dm?"#0a0a14":"#f9f9f9", cb=dm?"#141420":"#fff", tp=dm?"#f0f0f0":"#0f0f0f", ts=dm?"#888":"#606060", ib=dm?"rgba(255,255,255,0.05)":"#f8f8f8", ibdr=dm?"rgba(255,255,255,0.1)":"#e0e0e0";

  const handle = () => {
    if (!email){setErr("Email required");return;} if (!pass){setErr("Password required");return;}
    if (!isLogin&&!name){setErr("Name required");return;}
    const u={name:isLogin?email.split("@")[0]:name, email, avatar:ini(isLogin?email.split("@")[0]:name)};
    storage.set("vt_user",u); onLogin(u);
  };

  return (
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:bg, padding:20 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:12 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:"linear-gradient(135deg,#6366f1,#ec4899)", display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg></div>
            <span style={{ fontSize:24, fontWeight:800, color:tp }}>video<span style={{ color:"#6366f1" }}>tube</span></span>
          </div>
          <div style={{ color:ts, fontSize:14 }}>{isLogin?"Sign in to your account":"Create your free account"}</div>
        </div>
        <div style={{ background:cb, borderRadius:20, padding:32, border:dm?"1px solid rgba(255,255,255,0.07)":"1px solid #e0e0e0", boxShadow:dm?"0 20px 60px rgba(0,0,0,0.4)":"0 8px 30px rgba(0,0,0,0.08)" }}>
          <button onClick={async()=>{
            setLoading(true); setError("");
            try {
              const data = await api.post("/api/auth/login",{email:"demo@videotube.com",password:"demo123456"});
              localStorage.setItem("vt_token",data.token);
              onLogin(data.user, data.token);
            } catch {
              // If demo account doesn't exist, create it
              try {
                const data = await api.post("/api/auth/register",{name:"Demo User",email:"demo@videotube.com",password:"demo123456"});
                localStorage.setItem("vt_token",data.token);
                onLogin(data.user, data.token);
              } catch(e){ setError(e.message); }
            } finally { setLoading(false); }
          }}
            style={{ width:"100%", padding:12, background:ib, border:`1px solid ${ibdr}`, borderRadius:12, color:tp, fontSize:14, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20 }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google (Demo)
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <div style={{ flex:1, height:1, background:ibdr }}/><span style={{ color:ts, fontSize:12 }}>or</span><div style={{ flex:1, height:1, background:ibdr }}/>
          </div>
          {err&&<div style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444", padding:"10px 14px", borderRadius:10, fontSize:13, marginBottom:16 }}>{err}</div>}
          {!isLogin&&<div style={{ marginBottom:14 }}><label style={{ display:"block", color:ts, fontSize:12, marginBottom:6, fontWeight:500 }}>Full Name</label><input value={name} onChange={e=>{setName(e.target.value);setErr("");}} placeholder="John Doe" style={{ width:"100%", background:ib, border:`1px solid ${ibdr}`, borderRadius:10, padding:"11px 14px", color:tp, fontSize:14, outline:"none", boxSizing:"border-box" }}/></div>}
          <div style={{ marginBottom:14 }}><label style={{ display:"block", color:ts, fontSize:12, marginBottom:6, fontWeight:500 }}>Email</label><input value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} type="email" placeholder="you@example.com" style={{ width:"100%", background:ib, border:`1px solid ${ibdr}`, borderRadius:10, padding:"11px 14px", color:tp, fontSize:14, outline:"none", boxSizing:"border-box" }}/></div>
          <div style={{ marginBottom:20 }}><label style={{ display:"block", color:ts, fontSize:12, marginBottom:6, fontWeight:500 }}>Password</label><input value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} type="password" placeholder="••••••••" onKeyDown={e=>e.key==="Enter"&&handle()} style={{ width:"100%", background:ib, border:`1px solid ${ibdr}`, borderRadius:10, padding:"11px 14px", color:tp, fontSize:14, outline:"none", boxSizing:"border-box" }}/></div>
          <button onClick={handle} style={{ width:"100%", padding:13, background:"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none", borderRadius:12, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer" }}>{isLogin?"Sign In":"Create Account"}</button>
          <div style={{ textAlign:"center", marginTop:16, color:ts, fontSize:13 }}>
            {isLogin?"Don't have an account? ":"Already have an account? "}
            <button onClick={()=>{setIsLogin(l=>!l);setErr("");}} style={{ background:"none", border:"none", color:"#6366f1", cursor:"pointer", fontSize:13, fontWeight:600 }}>{isLogin?"Sign up":"Sign in"}</button>
          </div>
          <button onClick={onBack} style={{ display:"block", margin:"12px auto 0", background:"none", border:"none", color:ts, cursor:"pointer", fontSize:13 }}>← Back to VideoTube</button>
        </div>
      </div>
    </div>
  );
};


// ============================================================
// ANALYTICS DASHBOARD
// ============================================================
const AnalyticsPage = ({ dm, history }) => {
  const bg=dm?"#0a0a14":"#f9f9f9", tp=dm?"#f0f0f0":"#0f0f0f", ts=dm?"#8a8a9a":"#606060", cb=dm?"#141420":"#fff", bdr=dm?"rgba(255,255,255,0.07)":"#e0e0e0";
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const viewData = [4200,6800,5100,9300,7600,12400,8900];
  const subData = [120,340,180,560,420,780,340];
  const maxV = Math.max(...viewData), maxS = Math.max(...subData);
  const stats = [
    {l:"Total Views",v:"2.4M",ch:"+12.3%",up:true,icon:"👁"},
    {l:"Subscribers",v:"48.2K",ch:"+8.7%",up:true,icon:"👥"},
    {l:"Watch Time",v:"142K hrs",ch:"+23.1%",up:true,icon:"⏱"},
    {l:"Revenue",v:"$3,240",ch:"-2.4%",up:false,icon:"💰"},
  ];
  const topVideos = (history||[]).slice(0,5).map((v,i)=>({
    title: v.snippet?.title||"Unknown", views: fmtViews(v.statistics?.viewCount||Math.floor(Math.random()*500000+10000)),
    likes: fmtViews(v.statistics?.likeCount||Math.floor(Math.random()*20000+500)), ctr:`${(Math.random()*8+2).toFixed(1)}%`
  }));

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 28px 80px", background:bg }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
        <div style={{ width:4, height:28, background:"linear-gradient(180deg,#6366f1,#ec4899)", borderRadius:2 }}/>
        <h2 style={{ color:tp, fontSize:22, fontWeight:700, margin:0 }}>📊 Creator Analytics</h2>
        <div style={{ marginLeft:"auto", padding:"6px 14px", background:"rgba(99,102,241,0.15)", border:"1px solid rgba(99,102,241,0.3)", borderRadius:20, fontSize:12, color:"#8b8cf8", fontWeight:600 }}>Last 28 days</div>
      </div>

      {/* Stats Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:16, marginBottom:28 }}>
        {stats.map(s=>(
          <div key={s.l} style={{ background:cb, borderRadius:16, padding:"20px", border:`1px solid ${bdr}` }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontSize:24, fontWeight:800, color:tp, marginBottom:4 }}>{s.v}</div>
            <div style={{ fontSize:13, color:ts, marginBottom:8 }}>{s.l}</div>
            <div style={{ fontSize:12, fontWeight:600, color:s.up?"#10b981":"#ef4444" }}>{s.up?"↑":"↓"} {s.ch} vs last period</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:28 }}>
        {/* Views Chart */}
        <div style={{ background:cb, borderRadius:16, padding:24, border:`1px solid ${bdr}` }}>
          <div style={{ fontSize:15, fontWeight:700, color:tp, marginBottom:20 }}>Views This Week</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120 }}>
            {viewData.map((v,i)=>(
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                <div style={{ fontSize:9, color:ts }}>{fmtViews(v)}</div>
                <div style={{ width:"100%", background:"linear-gradient(180deg,#6366f1,#8b5cf6)", borderRadius:"4px 4px 0 0", height:`${(v/maxV)*90}px`, transition:"height 0.5s", minHeight:4 }}/>
                <div style={{ fontSize:10, color:ts }}>{days[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Subscribers Chart */}
        <div style={{ background:cb, borderRadius:16, padding:24, border:`1px solid ${bdr}` }}>
          <div style={{ fontSize:15, fontWeight:700, color:tp, marginBottom:20 }}>New Subscribers</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120 }}>
            {subData.map((v,i)=>(
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                <div style={{ fontSize:9, color:ts }}>{v}</div>
                <div style={{ width:"100%", background:"linear-gradient(180deg,#ec4899,#f97316)", borderRadius:"4px 4px 0 0", height:`${(v/maxS)*90}px`, transition:"height 0.5s", minHeight:4 }}/>
                <div style={{ fontSize:10, color:ts }}>{days[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audience Metrics */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:28 }}>
        <div style={{ background:cb, borderRadius:16, padding:24, border:`1px solid ${bdr}` }}>
          <div style={{ fontSize:15, fontWeight:700, color:tp, marginBottom:16 }}>Audience Demographics</div>
          {[["18-24","32%",0.32],["25-34","41%",0.41],["35-44","18%",0.18],["45+","9%",0.09]].map(([age,pct,val])=>(
            <div key={age} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ color:ts, fontSize:13 }}>{age}</span><span style={{ color:tp, fontSize:13, fontWeight:600 }}>{pct}</span>
              </div>
              <div style={{ height:6, background:dm?"rgba(255,255,255,0.07)":"#e0e0e0", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${val*100}%`, background:"linear-gradient(90deg,#6366f1,#ec4899)", borderRadius:3 }}/>
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:cb, borderRadius:16, padding:24, border:`1px solid ${bdr}` }}>
          <div style={{ fontSize:15, fontWeight:700, color:tp, marginBottom:16 }}>Traffic Sources</div>
          {[["YouTube Search","45%",0.45,"#6366f1"],["Suggested Videos","28%",0.28,"#ec4899"],["Direct/External","15%",0.15,"#f59e0b"],["Browse Features","12%",0.12,"#10b981"]].map(([src,pct,val,color])=>(
            <div key={src} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <div style={{ width:10, height:10, borderRadius:"50%", background:color, flexShrink:0 }}/>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                  <span style={{ color:ts, fontSize:12 }}>{src}</span><span style={{ color:tp, fontSize:12, fontWeight:600 }}>{pct}</span>
                </div>
                <div style={{ height:4, background:dm?"rgba(255,255,255,0.07)":"#e0e0e0", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${val*100}%`, background:color, borderRadius:2 }}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Videos Table */}
      {topVideos.length>0&&(
        <div style={{ background:cb, borderRadius:16, padding:24, border:`1px solid ${bdr}` }}>
          <div style={{ fontSize:15, fontWeight:700, color:tp, marginBottom:16 }}>Top Performing Videos</div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead>
                <tr>
                  {["Video","Views","Likes","CTR"].map(h=>(
                    <th key={h} style={{ textAlign:"left", padding:"8px 12px", fontSize:12, color:ts, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:`1px solid ${bdr}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topVideos.map((v,i)=>(
                  <tr key={i}>
                    <td style={{ padding:"12px", fontSize:13, color:tp, borderBottom:`1px solid ${bdr}`, maxWidth:300 }}>
                      <div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.title}</div>
                    </td>
                    <td style={{ padding:"12px", fontSize:13, color:ts, borderBottom:`1px solid ${bdr}` }}>{v.views}</td>
                    <td style={{ padding:"12px", fontSize:13, color:ts, borderBottom:`1px solid ${bdr}` }}>{v.likes}</td>
                    <td style={{ padding:"12px", fontSize:13, color:"#10b981", fontWeight:600, borderBottom:`1px solid ${bdr}` }}>{v.ctr}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// PLAYLISTS PAGE
// ============================================================
const PlaylistsPage = ({ playlists, setPlaylists, onVideoClick, dm }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [openPl, setOpenPl] = useState(null);
  const bg=dm?"#0a0a14":"#f9f9f9", tp=dm?"#f0f0f0":"#0f0f0f", ts=dm?"#8a8a9a":"#606060", cb=dm?"#141420":"#fff", bdr=dm?"rgba(255,255,255,0.07)":"#e0e0e0", ib=dm?"rgba(255,255,255,0.05)":"#f8f8f8", ibdr=dm?"rgba(255,255,255,0.1)":"#e0e0e0";

  const createPlaylist = () => {
    if (!newName.trim()) return;
    try {
      const data = await api.post("/api/user/playlists",{ name: newName.trim() });
      setPlaylists(data.playlists);
    } catch { 
      const pl={id:Date.now().toString(),name:newName.trim(),videos:[],createdAt:new Date().toISOString()};
      setPlaylists(p=>[pl,...p]);
    }
    setNewName(""); setShowCreate(false);
  };

  const deletePlaylist = (id) => {
    api.delete(`/api/user/playlists/${id}`).then(d=>setPlaylists(d.playlists)).catch(()=>{
      setPlaylists(p=>p.filter(pl=>pl.id!==id));
    });
    if (openPl===id) setOpenPl(null);
  };

  const removeFromPlaylist = (plId, vidId) => {
    const newPls = playlists.map(p=>p.id===plId?{...p,videos:p.videos.filter(v=>(v.id?.videoId||v.id)!==vidId)}:p);
    setPlaylists(newPls);
    api.post(`/api/user/playlists/${plId}/videos`,{ video:{id:vidId} }).catch(()=>{});
  };

  const openedPl = playlists.find(p=>p.id===openPl);

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"24px 28px 80px", background:bg }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ width:4, height:28, background:"linear-gradient(180deg,#6366f1,#ec4899)", borderRadius:2 }}/>
          <h2 style={{ color:tp, fontSize:22, fontWeight:700, margin:0 }}>📋 Playlists</h2>
        </div>
        <button onClick={()=>setShowCreate(true)} style={{ padding:"10px 20px", background:"#6366f1", border:"none", borderRadius:24, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6 }}>
          + New Playlist
        </button>
      </div>

      {showCreate&&(
        <div style={{ background:cb, borderRadius:16, padding:24, border:`1px solid ${bdr}`, marginBottom:24 }}>
          <div style={{ fontSize:15, fontWeight:700, color:tp, marginBottom:16 }}>Create New Playlist</div>
          <input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createPlaylist()} placeholder="Playlist name..."
            style={{ width:"100%", background:ib, border:`1px solid ${ibdr}`, borderRadius:10, padding:"11px 14px", color:tp, fontSize:14, outline:"none", boxSizing:"border-box", marginBottom:12 }}/>
          <div style={{ display:"flex", gap:10 }}>
            <button onClick={createPlaylist} style={{ padding:"10px 24px", background:"#6366f1", border:"none", borderRadius:20, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer" }}>Create</button>
            <button onClick={()=>{setShowCreate(false);setNewName("");}} style={{ padding:"10px 20px", background:"transparent", border:`1px solid ${ibdr}`, borderRadius:20, color:ts, fontSize:13, cursor:"pointer" }}>Cancel</button>
          </div>
        </div>
      )}

      {playlists.length===0?(
        <div style={{ textAlign:"center", padding:"80px 20px" }}>
          <div style={{ fontSize:48, marginBottom:16 }}>📋</div>
          <div style={{ color:tp, fontSize:18, fontWeight:600, marginBottom:8 }}>No playlists yet</div>
          <div style={{ color:ts, fontSize:14, marginBottom:24 }}>Create a playlist to organize your videos</div>
          <button onClick={()=>setShowCreate(true)} style={{ padding:"12px 28px", background:"#6366f1", border:"none", borderRadius:24, color:"#fff", fontSize:14, fontWeight:600, cursor:"pointer" }}>Create Playlist</button>
        </div>
      ):(
        openedPl?(
          <div>
            <button onClick={()=>setOpenPl(null)} style={{ background:"none", border:"none", color:"#6366f1", cursor:"pointer", fontSize:14, fontWeight:600, marginBottom:16, display:"flex", alignItems:"center", gap:6 }}>← Back to Playlists</button>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
              <div>
                <div style={{ fontSize:20, fontWeight:700, color:tp }}>{openedPl.name}</div>
                <div style={{ fontSize:13, color:ts }}>{openedPl.videos.length} videos</div>
              </div>
              <button onClick={()=>deletePlaylist(openedPl.id)} style={{ background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#ef4444", padding:"8px 16px", borderRadius:20, cursor:"pointer", fontSize:13 }}>Delete Playlist</button>
            </div>
            {openedPl.videos.length===0?(
              <div style={{ textAlign:"center", padding:"40px", color:ts }}>No videos in this playlist yet. Like or save videos to add them.</div>
            ):(
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:20 }}>
                {openedPl.videos.map(v=>{
                  const vid=v.id?.videoId||v.id;
                  return (
                    <div key={vid} style={{ position:"relative" }}>
                      <VideoCard video={v} onClick={onVideoClick} dm={dm} onCh={()=>{}}/>
                      <button onClick={()=>removeFromPlaylist(openedPl.id,vid)} style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.7)", border:"none", color:"#fff", borderRadius:"50%", width:28, height:28, cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ):(
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:20 }}>
            {playlists.map(pl=>(
              <div key={pl.id} onClick={()=>setOpenPl(pl.id)} style={{ background:cb, borderRadius:16, overflow:"hidden", border:`1px solid ${bdr}`, cursor:"pointer", transition:"transform 0.2s" }}
                onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
                onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
                <div style={{ height:140, background:`linear-gradient(135deg,${["#6366f1","#ec4899","#f59e0b","#10b981"][playlists.indexOf(pl)%4]}33,#0a0a1a)`, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                  {pl.videos[0]?.snippet?.thumbnails?.medium?.url
                    ? <img src={pl.videos[0].snippet.thumbnails.medium.url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
                    : <div style={{ fontSize:40 }}>📋</div>}
                  <div style={{ position:"absolute", bottom:8, right:8, background:"rgba(0,0,0,0.8)", color:"#fff", fontSize:11, padding:"2px 8px", borderRadius:4 }}>{pl.videos.length} videos</div>
                </div>
                <div style={{ padding:"14px 16px" }}>
                  <div style={{ fontSize:15, fontWeight:700, color:tp, marginBottom:4 }}>{pl.name}</div>
                  <div style={{ fontSize:12, color:ts }}>Created {fmtDate(pl.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

// ============================================================
// SHORTS PAGE  -- one video per screen, arrow keys + swipe
// ============================================================
const ShortsPage = ({ dm }) => {
  const [videos, setVideos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const itemRefs = useRef([]);

  useEffect(()=>{
    if (!API_KEY){ setLoading(false); return; }
    ytFetch(`${YT_BASE}/search?part=snippet&q=shorts+viral+trending+2024&type=video&maxResults=20&videoDuration=short&key=${API_KEY}`)
      .then(async data=>{
        const ids=(data.items||[]).map(i=>i.id?.videoId).filter(Boolean);
        if(!ids.length){ setLoading(false); return; }
        const det = await getDetails(ids).catch(()=>[]);
        setVideos(det); setLoading(false);
      }).catch(()=>setLoading(false));
  },[]);

  const goTo = (idx)=>{
    if(idx < 0 || idx >= videos.length) return;
    setCurrent(idx);
    itemRefs.current[idx]?.scrollIntoView({ behavior:"smooth", block:"start" });
  };

  useEffect(()=>{
    const handler=(e)=>{
      if(e.key==="ArrowDown"){ e.preventDefault(); goTo(Math.min(current+1, videos.length-1)); }
      if(e.key==="ArrowUp")  { e.preventDefault(); goTo(Math.max(current-1, 0)); }
    };
    window.addEventListener("keydown", handler);
    return ()=>window.removeEventListener("keydown", handler);
  },[current, videos.length]);

  useEffect(()=>{
    if(!videos.length) return;
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting) setCurrent(parseInt(e.target.dataset.idx||"0",10)); });
    },{ threshold:0.55 });
    itemRefs.current.forEach(el=>{ if(el) obs.observe(el); });
    return ()=>obs.disconnect();
  },[videos.length]);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:"#000", overflow:"hidden" }}>
      <div style={{ flexShrink:0, display:"flex", alignItems:"center", gap:10, padding:"9px 14px", background:"rgba(0,0,0,0.95)", borderBottom:"1px solid rgba(255,255,255,0.07)", zIndex:20 }}>
        <span style={{ color:"#fff", fontWeight:800, fontSize:16, flex:1 }}>🎬 Shorts</span>
        <span style={{ color:"rgba(255,255,255,0.3)", fontSize:11 }}>↑↓ keys or swipe</span>
        <button onClick={()=>goTo(Math.max(current-1,0))} disabled={current===0}
          style={{ width:32,height:32,borderRadius:"50%",background:current===0?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.18)",border:"none",color:current===0?"rgba(255,255,255,0.2)":"#fff",cursor:current===0?"not-allowed":"pointer",fontSize:16 }}>↑</button>
        <button onClick={()=>goTo(Math.min(current+1,videos.length-1))} disabled={current===videos.length-1}
          style={{ width:32,height:32,borderRadius:"50%",background:current===videos.length-1?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.18)",border:"none",color:current===videos.length-1?"rgba(255,255,255,0.2)":"#fff",cursor:current===videos.length-1?"not-allowed":"pointer",fontSize:16 }}>↓</button>
      </div>
      {loading?(
        <div style={{ flex:1,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ display:"flex",gap:8 }}>{[0,1,2].map(i=><div key={i} style={{ width:12,height:12,borderRadius:"50%",background:"#6366f1",animation:`bounce 0.6s ${i*0.15}s infinite alternate` }}/>)}</div>
        </div>
      ):(
        <div style={{ flex:1,overflowY:"scroll",scrollSnapType:"y mandatory",scrollbarWidth:"none",WebkitOverflowScrolling:"touch" }}>
          {videos.map((video,i)=>{
            const sn=video.snippet||{}, st=video.statistics||{};
            const vid=video.id?.videoId||video.id;
            const thumb=sn.thumbnails?.high?.url||sn.thumbnails?.medium?.url||"";
            const isActive=i===current;
            return (
              <div key={vid} data-idx={i} ref={el=>{ itemRefs.current[i]=el; }}
                style={{ height:"calc(100vh - 110px)",minHeight:480,scrollSnapAlign:"start",scrollSnapStop:"always",display:"flex",justifyContent:"center",alignItems:"stretch",background:"#000",position:"relative",flexShrink:0 }}>
                <div style={{ position:"relative",width:"100%",maxWidth:400,background:"#111",overflow:"hidden" }}>
                  {thumb&&<img src={thumb} alt="" loading="lazy" style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",zIndex:1 }}/>}
                  {isActive&&(
                    <iframe key={vid}
                      src={`https://www.youtube.com/embed/${vid}?autoplay=1&mute=0&loop=1&playlist=${vid}&controls=1&rel=0&playsinline=1`}
                      style={{ position:"absolute",inset:0,width:"100%",height:"100%",border:"none",zIndex:2 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen title={sn.title}/>
                  )}
                  <div style={{ position:"absolute",bottom:0,left:0,right:0,height:220,background:"linear-gradient(transparent,rgba(0,0,0,0.88))",zIndex:3,pointerEvents:"none" }}/>
                  <div style={{ position:"absolute",bottom:16,left:12,right:68,zIndex:4 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                      <div style={{ width:36,height:36,borderRadius:"50%",flexShrink:0,background:clr(sn.channelTitle),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",border:"2px solid rgba(255,255,255,0.5)" }}>{ini(sn.channelTitle)}</div>
                      <span style={{ color:"#fff",fontSize:13,fontWeight:700,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textShadow:"0 1px 4px rgba(0,0,0,0.9)" }}>@{(sn.channelTitle||"").replace(/\s/g,"").toLowerCase()}</span>
                    </div>
                    <div style={{ color:"rgba(255,255,255,0.92)",fontSize:13,lineHeight:1.5,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden",textShadow:"0 1px 4px rgba(0,0,0,0.9)" }}>{sn.title}</div>
                    <button style={{ marginTop:8,padding:"5px 14px",background:"transparent",border:"1.5px solid rgba(255,255,255,0.85)",borderRadius:20,color:"#fff",fontSize:12,cursor:"pointer",fontWeight:700 }}>Subscribe</button>
                  </div>
                  <div style={{ position:"absolute",right:8,bottom:100,zIndex:4,display:"flex",flexDirection:"column",gap:16,alignItems:"center" }}>
                    {[{ic:"👍",l:fmtViews(st.likeCount)||"Like"},{ic:"💬",l:fmtViews(st.commentCount)||"0"},{ic:"↗",l:"Share"},{ic:"⊕",l:"Save"}].map(a=>(
                      <div key={a.l} style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:3,cursor:"pointer",transition:"transform 0.15s" }}
                        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.15)"}
                        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                        <div style={{ width:46,height:46,borderRadius:"50%",background:"rgba(255,255,255,0.18)",backdropFilter:"blur(6px)",border:"1px solid rgba(255,255,255,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22 }}>{a.ic}</div>
                        <span style={{ color:"#fff",fontSize:11,fontWeight:600,textShadow:"0 1px 3px rgba(0,0,0,0.8)" }}>{a.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ position:"absolute",left:5,top:"50%",transform:"translateY(-50%)",display:"flex",flexDirection:"column",gap:5,zIndex:5 }}>
                  {videos.slice(Math.max(0,i-3),Math.min(videos.length,i+4)).map((_,di)=>{
                    const ri=Math.max(0,i-3)+di;
                    return <div key={ri} onClick={()=>goTo(ri)} style={{ width:3,height:ri===current?22:5,borderRadius:2,background:ri===current?"#fff":"rgba(255,255,255,0.3)",transition:"height 0.25s,background 0.25s",cursor:"pointer" }}/>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============================================================
// KEYBOARD SHORTCUTS MODAL
// ============================================================
const ShortcutsModal = ({ onClose, dm }) => {
  const shortcuts = [
    {key:"K or Space",desc:"Play / Pause"},
    {key:"F",desc:"Fullscreen"},
    {key:"M",desc:"Mute / Unmute"},
    {key:"→ / ←",desc:"Seek 5 seconds"},
    {key:"J / L",desc:"Seek 10 seconds"},
    {key:"0-9",desc:"Jump to % of video"},
    {key:"/",desc:"Focus search bar"},
    {key:"Escape",desc:"Close / Clear search"},
    {key:"?",desc:"Show this help"},
  ];
  const bg=dm?"#141420":"#fff", tp=dm?"#f0f0f0":"#0f0f0f", ts=dm?"#8a8a9a":"#606060", bdr=dm?"rgba(255,255,255,0.08)":"#e0e0e0";
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:bg, borderRadius:20, padding:32, width:"100%", maxWidth:460, border:`1px solid ${bdr}`, boxShadow:"0 30px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div style={{ fontSize:18, fontWeight:700, color:tp }}>⌨️ Keyboard Shortcuts</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:ts, cursor:"pointer", fontSize:22 }}>×</button>
        </div>
        {shortcuts.map(s=>(
          <div key={s.key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 0", borderBottom:`1px solid ${bdr}` }}>
            <span style={{ color:ts, fontSize:14 }}>{s.desc}</span>
            <kbd style={{ background:dm?"rgba(255,255,255,0.08)":"#f0f0f0", border:`1px solid ${bdr}`, borderRadius:6, padding:"3px 10px", fontSize:12, fontFamily:"monospace", color:tp, fontWeight:600 }}>{s.key}</kbd>
          </div>
        ))}
        <div style={{ marginTop:16, fontSize:12, color:ts, textAlign:"center" }}>Press <kbd style={{ background:dm?"rgba(255,255,255,0.08)":"#f0f0f0", border:`1px solid ${bdr}`, borderRadius:4, padding:"1px 6px", fontSize:11 }}>?</kbd> anytime to show this</div>
      </div>
    </div>
  );
};

// ============================================================
// ADD TO PLAYLIST MODAL
// ============================================================
const AddToPlaylistModal = ({ video, playlists, setPlaylists, onClose, dm }) => {
  const [newName, setNewName] = useState("");
  const bg=dm?"#141420":"#fff", tp=dm?"#f0f0f0":"#0f0f0f", ts=dm?"#8a8a9a":"#606060", bdr=dm?"rgba(255,255,255,0.08)":"#e0e0e0", ib=dm?"rgba(255,255,255,0.05)":"#f8f8f8", ibdr=dm?"rgba(255,255,255,0.1)":"#e0e0e0";
  const vid=video.id?.videoId||video.id;

  const toggle = (plId) => {
    const newPls = playlists.map(p=>{
      if (p.id!==plId) return p;
      const has = p.videos.find(v=>(v.id?.videoId||v.id)===vid);
      return { ...p, videos: has ? p.videos.filter(v=>(v.id?.videoId||v.id)!==vid) : [...p.videos, video] };
    });
    setPlaylists(newPls);
    api.post(`/api/user/playlists/${plId}/videos`,{ video }).catch(()=>{});
  };

  const create = () => {
    if (!newName.trim()) return;
    try {
      const data = await api.post("/api/user/playlists",{ name: newName.trim() });
      // Then add the video
      await api.post(`/api/user/playlists/${data.playlists[0].id}/videos`,{ video });
      const sync = await api.get("/api/user/sync");
      if(sync?.data) setPlaylists(sync.data.playlists||[]);
    } catch {
      const pl={id:Date.now().toString(),name:newName.trim(),videos:[video],createdAt:new Date().toISOString()};
      setPlaylists(p=>[pl,...p]);
    }
    setNewName("");
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:bg, borderRadius:20, padding:24, width:"100%", maxWidth:360, border:`1px solid ${bdr}`, boxShadow:"0 30px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontSize:16, fontWeight:700, color:tp }}>Save to playlist</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:ts, cursor:"pointer", fontSize:22 }}>×</button>
        </div>
        {playlists.map(pl=>{
          const has = pl.videos.find(v=>(v.id?.videoId||v.id)===vid);
          return (
            <div key={pl.id} onClick={()=>toggle(pl.id)} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", cursor:"pointer", borderBottom:`1px solid ${bdr}` }}>
              <div style={{ width:20, height:20, borderRadius:4, border:`2px solid ${has?"#6366f1":bdr}`, background:has?"#6366f1":"transparent", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
                {has&&<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>}
              </div>
              <span style={{ color:tp, fontSize:14 }}>{pl.name}</span>
              <span style={{ marginLeft:"auto", color:ts, fontSize:12 }}>{pl.videos.length}</span>
            </div>
          );
        })}
        <div style={{ marginTop:16 }}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&create()} placeholder="+ Create new playlist"
            style={{ width:"100%", background:ib, border:`1px solid ${ibdr}`, borderRadius:10, padding:"10px 14px", color:tp, fontSize:13, outline:"none", boxSizing:"border-box" }}/>
        </div>
      </div>
    </div>
  );
};


// ============================================================
// MAIN APP
// ============================================================
export default function App() {
  const [page, setPage] = useState("home");
  const [video, setVideo] = useState(null);
  const [chId, setChId] = useState(null);
  const [chName, setChName] = useState("");
  const [searchIn, setSearchIn] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [prevPage, setPrevPage] = useState("home");
  const searchRef = useRef(null);
  const suggestTimer = useRef(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [dm, setDm] = useState(()=>storage.get("vt_dm")!==false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(()=>localStorage.getItem("vt_token"));
  const [authLoading, setAuthLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [liked, setLiked] = useState([]);
  const [watchLater, setWatchLater] = useState([]);
  const [subs, setSubs] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [watchProgress, setWatchProgress] = useState({});
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [bellSubs, setBellSubs] = useState([]);

  useEffect(()=>{
    const s=document.createElement("style");
    s.textContent=`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@500;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;scrollbar-width:thin;scrollbar-color:rgba(99,102,241,0.3) transparent}
    *::-webkit-scrollbar{width:5px}*::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.3);border-radius:10px}
    html,body{overflow-x:hidden!important;max-width:100vw}
    body{font-family:'DM Sans',sans-serif}
    @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
    @keyframes bounce{from{transform:translateY(0)}to{transform:translateY(-8px)}}
    @media(max-width:768px){#dsk-sb{display:none!important}#mob-nav{display:flex!important}.hdr-upload{display:none!important}.hdr-shorts{display:none!important}.hdr-kbd{display:none!important}}`;
    document.head.appendChild(s);
    return ()=>document.head.removeChild(s);
  },[]);

  useEffect(()=>{ storage.set("vt_dm",dm); document.body.style.background=dm?"#0a0a14":"#f9f9f9"; },[dm]);

  // Restore session from token on page load
  useEffect(()=>{
    const savedToken = localStorage.getItem("vt_token");
    if (!savedToken) { setAuthLoading(false); return; }
    api.get("/api/auth/me")
      .then(data=>{
        setUser(data.user);
        setToken(savedToken);
        // Load all user data
        return api.get("/api/user/sync");
      })
      .then(data=>{
        if(data?.data){
          setHistory(data.data.history||[]);
          setLiked(data.data.liked||[]);
          setWatchLater(data.data.watchLater||[]);
          setSubs(data.data.subscriptions||[]);
          setPlaylists(data.data.playlists||[]);
        }
      })
      .catch(()=>{ localStorage.removeItem("vt_token"); })
      .finally(()=>setAuthLoading(false));
  },[]);

  // Keyboard shortcuts
  useEffect(()=>{
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag==="INPUT"||tag==="TEXTAREA") return;
      if (e.key==="?") { setShowShortcuts(s=>!s); return; }
      if (e.key==="/" ) { e.preventDefault(); document.querySelector("input[placeholder*='Search']")?.focus(); return; }
      if (e.key==="Escape") { setShowShortcuts(false); }
    };
    window.addEventListener("keydown", handler);
    return ()=>window.removeEventListener("keydown", handler);
  }, []);

  const nav=(p)=>{ setPage(p); if(p!=="watch"&&p!=="channel")setVideo(null); setShowNotif(false); setShowUserMenu(false); setPrevPage(p); };
  const onVideoClick=(v)=>{ setVideo(v); setPage("watch"); };
  const onCh=(id,name)=>{ setChId(id); setChName(name); setPage("channel"); };
  const onSearch=(q)=>{
    const query = q || searchIn;
    if(query.trim()){ setSearchQ(query); setSearchIn(query); setPage("search"); setSuggestions([]); setSearchFocused(false); }
  };
  const onClearSearch=()=>{ setSearchIn(""); setSuggestions([]); setSearchFocused(false); nav(prevPage==="search"?"home":prevPage); };

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback((val) => {
    clearTimeout(suggestTimer.current);
    if (!val.trim() || !API_KEY) { setSuggestions([]); return; }
    suggestTimer.current = setTimeout(async () => {
      try {
        const data = await ytFetch(`${YT_BASE}/search?part=snippet&q=${encodeURIComponent(val)}&type=video&maxResults=8&key=${API_KEY}`);
        const titles = [...new Set((data.items||[]).map(i=>i.snippet?.title||"").filter(Boolean))].slice(0,7);
        setSuggestions(titles);
      } catch(e) { setSuggestions([]); }
    }, 350);
  }, []);
  const onLogin=async(u, tok)=>{
    setUser(u); setToken(tok); setShowLogin(false);
    // Load user data from backend
    try {
      const data = await api.get("/api/user/sync");
      if(data?.data){
        setHistory(data.data.history||[]);
        setLiked(data.data.liked||[]);
        setWatchLater(data.data.watchLater||[]);
        setSubs(data.data.subscriptions||[]);
        setPlaylists(data.data.playlists||[]);
      }
    } catch(e){ console.error("Sync failed:", e); }
  };
  const onLogout=()=>{
    setUser(null); setToken(null);
    localStorage.removeItem("vt_token");
    setHistory([]); setLiked([]); setWatchLater([]); setSubs([]); setPlaylists([]);
    setShowUserMenu(false);
  };

  const hBg=dm?"rgba(10,10,20,0.97)":"rgba(255,255,255,0.97)", tp=dm?"#f0f0f0":"#0f0f0f", ts=dm?"#8a8a9a":"#606060", bdr=dm?"rgba(255,255,255,0.06)":"#e0e0e0", bbg=dm?"rgba(255,255,255,0.06)":"#f0f0f0";

  if (authLoading) return (
    <div style={{ minHeight:"100vh", background:dm?"#0a0a14":"#f9f9f9", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:800, color:"#6366f1" }}>video<span style={{color:"#f0f0f0"}}>tube</span></div>
      <div style={{ display:"flex", gap:8 }}>{[0,1,2].map(i=><div key={i} style={{ width:10, height:10, borderRadius:"50%", background:"#6366f1", animation:`bounce 0.6s ${i*0.15}s infinite alternate` }}/>)}</div>
    </div>
  );

  const renderPage=()=>{
    if (showLogin) return <LoginPage onLogin={onLogin} dm={dm} onBack={()=>setShowLogin(false)}/>;
    switch(page){
      case "home": return <HomePage onVideoClick={onVideoClick} dm={dm} onCh={onCh}/>;
      case "watch": return video?<WatchPage video={video} onVideoClick={onVideoClick} dm={dm} onCh={onCh} user={user} history={history} setHistory={setHistory} liked={liked} setLiked={setLiked} watchLater={watchLater} setWatchLater={setWatchLater} playlists={playlists} setPlaylists={setPlaylists}/>:<HomePage onVideoClick={onVideoClick} dm={dm} onCh={onCh}/>;
      case "channel": return <ChannelPage channelId={chId} channelName={chName} onVideoClick={onVideoClick} dm={dm} subs={subs} setSubs={setSubs} user={user}/>;
      case "trending": return <TrendingPage onVideoClick={onVideoClick} dm={dm} onCh={onCh}/>;
      case "live": return <LivePage onVideoClick={onVideoClick} dm={dm} onCh={onCh}/>;
      case "subscriptions": return <SubsPage subs={subs} onVideoClick={onVideoClick} dm={dm} onCh={onCh}/>;
      case "history": return <HistoryPage history={history} setHistory={setHistory} onVideoClick={onVideoClick} dm={dm}/>;
      case "liked": return <SavedPage items={liked} setItems={setLiked} stKey="vt_liked" title="Liked Videos" icon="👍" emptyMsg="No liked videos yet" onVideoClick={onVideoClick} dm={dm}/>;
      case "watchlater": return <SavedPage items={watchLater} setItems={setWatchLater} stKey="vt_watchlater" title="Watch Later" icon="⏰" emptyMsg="No saved videos yet" onVideoClick={onVideoClick} dm={dm}/>;
      case "search": return <SearchPage query={searchQ} onVideoClick={onVideoClick} dm={dm} onCh={onCh}/>;
      case "upload": return <UploadPage dm={dm}/>;
      case "analytics": return <AnalyticsPage dm={dm} history={history}/>;
      case "playlists": return <PlaylistsPage playlists={playlists} setPlaylists={setPlaylists} onVideoClick={onVideoClick} dm={dm}/>;
      case "shorts": return <ShortsPage dm={dm} onVideoClick={onVideoClick}/>;
      default: return <HomePage onVideoClick={onVideoClick} dm={dm} onCh={onCh}/>;
    }
  };

  return (
    <div style={{ minHeight:"100vh", maxWidth:"100vw", overflowX:"hidden", background:dm?"#0a0a14":"#f9f9f9", display:"flex", flexDirection:"column", fontFamily:"'DM Sans',sans-serif" }}>
      {/* HEADER */}
      <header style={{ height:60, display:"flex", alignItems:"center", padding:"0 10px", gap:8, borderBottom:`1px solid ${bdr}`, background:hBg, backdropFilter:"blur(12px)", position:"sticky", top:0, zIndex:100, flexShrink:0, overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0, minWidth:collapsed?48:160 }}>
          <button onClick={()=>setCollapsed(c=>!c)} style={{ background:"none", border:"none", cursor:"pointer", padding:8, borderRadius:8, color:ts, display:"flex" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
          </button>
          <div onClick={()=>nav("home")} style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", userSelect:"none" }}>
            <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#6366f1,#ec4899)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
            {!collapsed&&<span style={{ fontSize:17, fontWeight:800, color:tp, fontFamily:"'DM Mono',monospace", letterSpacing:"-0.03em" }}>video<span style={{ color:"#6366f1" }}>tube</span></span>}
          </div>
        </div>

        <div ref={searchRef} style={{ display:"flex", alignItems:"center", flex:1, minWidth:0, maxWidth:580, position:"relative" }}>
          <div style={{ flex:1, display:"flex", alignItems:"center", background:searchFocused?(dm?"rgba(255,255,255,0.08)":"#fff"):(dm?"rgba(255,255,255,0.05)":"#f8f8f8"), border:`1px solid ${searchFocused?"rgba(99,102,241,0.5)":bdr}`, borderRadius:"24px 0 0 24px", overflow:"hidden", transition:"all 0.2s", boxShadow:searchFocused?"0 0 0 3px rgba(99,102,241,0.12)":"none" }}>
            <input
              value={searchIn}
              onChange={e=>{ setSearchIn(e.target.value); fetchSuggestions(e.target.value); }}
              onFocus={()=>setSearchFocused(true)}
              onBlur={()=>setTimeout(()=>setSearchFocused(false),180)}
              onKeyDown={e=>{ if(e.key==="Enter")onSearch(); if(e.key==="Escape")onClearSearch(); }}
              placeholder="Search videos, channels..."
              style={{ flex:1, background:"transparent", border:"none", outline:"none", color:tp, fontSize:14, padding:"10px 16px" }}
            />
            {searchIn&&(
              <button onClick={onClearSearch}
                style={{ background:"none", border:"none", cursor:"pointer", color:ts, padding:"0 10px", display:"flex", alignItems:"center", fontSize:18, lineHeight:1 }}
                title="Clear search">
                ✕
              </button>
            )}
          </div>
          <button onClick={()=>onSearch()} style={{ background:bbg, border:`1px solid ${bdr}`, borderLeft:"none", borderRadius:"0 24px 24px 0", padding:"10px 18px", cursor:"pointer", color:ts, display:"flex" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
          </button>
          <button title="Voice search" onClick={()=>{
            if(!window.SpeechRecognition&&!window.webkitSpeechRecognition){alert("Voice search not supported in your browser");return;}
            const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
            const sr=new SR(); sr.lang="en-US"; sr.start();
            sr.onresult=(e)=>{ const t=e.results[0][0].transcript; setSearchIn(t); onSearch(t); };
          }} style={{ background:"none", border:"none", cursor:"pointer", color:ts, padding:"8px 6px", display:"flex", alignItems:"center", marginLeft:4 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/></svg>
          </button>

          {/* Suggestions Dropdown */}
          {searchFocused && (searchIn.trim() ? suggestions.length > 0 : true) && (
            <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, right:0, background:dm?"#141420":"#fff", border:`1px solid ${dm?"rgba(255,255,255,0.1)":"#e0e0e0"}`, borderRadius:14, overflow:"hidden", boxShadow:"0 16px 48px rgba(0,0,0,0.25)", zIndex:300 }}>
              {!searchIn.trim() ? (
                <>
                  <div style={{ padding:"10px 16px 6px", fontSize:11, color:dm?"#555":"#909090", textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600 }}>Trending Searches</div>
                  {["JavaScript tutorial 2024","React hooks explained","Python machine learning","System design interview","CSS animations","Node.js REST API","TypeScript for beginners","Docker tutorial"].map((s,i)=>(
                    <div key={i} onMouseDown={()=>onSearch(s)}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", cursor:"pointer", transition:"background 0.1s" }}
                      onMouseEnter={e=>e.currentTarget.style.background=dm?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{ fontSize:16 }}>🔥</span>
                      <span style={{ color:dm?"#d0d0e0":"#0f0f0f", fontSize:14 }}>{s}</span>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div style={{ padding:"10px 16px 6px", fontSize:11, color:dm?"#555":"#909090", textTransform:"uppercase", letterSpacing:"0.07em", fontWeight:600 }}>Suggestions</div>
                  {suggestions.map((s,i)=>(
                    <div key={i} onMouseDown={()=>onSearch(s)}
                      style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 16px", cursor:"pointer", transition:"background 0.1s" }}
                      onMouseEnter={e=>e.currentTarget.style.background=dm?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={dm?"#555":"#909090"}><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
                      <span style={{ color:dm?"#d0d0e0":"#0f0f0f", fontSize:14, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s}</span>
                      <button onMouseDown={e=>{e.stopPropagation();setSearchIn(s);fetchSuggestions(s);}} style={{ background:"none", border:"none", color:dm?"#555":"#909090", cursor:"pointer", fontSize:12, transform:"rotate(315deg)", padding:"2px 4px", flexShrink:0 }}>↗</button>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:8 }}>
          <button onClick={()=>setDm(d=>!d)} style={{ background:bbg, border:`1px solid ${bdr}`, borderRadius:24, padding:"7px 12px", color:ts, cursor:"pointer", fontSize:16 }} title="Toggle dark/light mode">{dm?"☀️":"🌙"}</button>
          <button onClick={()=>setShowShortcuts(true)} style={{ background:bbg, border:`1px solid ${bdr}`, borderRadius:24, padding:"7px 12px", color:ts, cursor:"pointer", fontSize:14, fontWeight:600 }} title="Keyboard shortcuts (?)">⌨️</button>
          <button className="hdr-shorts" onClick={()=>nav("shorts")} style={{ background:bbg, border:`1px solid ${bdr}`, borderRadius:24, padding:"7px 14px", color:ts, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:6, fontWeight:500 }}>
            🎬 Shorts
          </button>
          <button className="hdr-upload" onClick={()=>nav("upload")} style={{ background:bbg, border:`1px solid ${bdr}`, borderRadius:24, padding:"7px 14px", color:ts, cursor:"pointer", fontSize:13, display:"flex", alignItems:"center", gap:6, fontWeight:500 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/></svg>
            Upload
          </button>
          <div style={{ position:"relative" }}>
            <button onClick={()=>{setShowNotif(n=>!n);setShowUserMenu(false);}} style={{ background:"transparent", border:"none", padding:8, color:ts, cursor:"pointer", display:"flex", position:"relative" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
              <div style={{ position:"absolute", top:6, right:6, width:8, height:8, borderRadius:"50%", background:"#ec4899", border:`2px solid ${dm?"#0a0a14":"#fff"}` }}/>
            </button>
            {showNotif&&(
              <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:320, background:dm?"#141420":"#fff", border:`1px solid ${bdr}`, borderRadius:16, overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", zIndex:200 }}>
                <div style={{ padding:"14px 20px", borderBottom:`1px solid ${bdr}`, display:"flex", justifyContent:"space-between" }}>
                  <span style={{ color:tp, fontWeight:700 }}>Notifications</span>
                  <button onClick={()=>setShowNotif(false)} style={{ background:"none", border:"none", color:ts, cursor:"pointer", fontSize:18 }}>×</button>
                </div>
                {[{t:"🔥 Trending in JavaScript right now",d:"2h ago",u:true},{t:"📺 New videos from your subscriptions",d:"5h ago",u:true},{t:"🔔 Weekly digest ready",d:"1d ago",u:false}].map((n,i)=>(
                  <div key={i} style={{ display:"flex", gap:10, padding:"12px 20px", background:n.u?(dm?"rgba(99,102,241,0.05)":"rgba(99,102,241,0.04)"):"transparent", borderBottom:`1px solid ${bdr}` }}>
                    {n.u&&<div style={{ width:7, height:7, borderRadius:"50%", background:"#6366f1", marginTop:6, flexShrink:0 }}/>}
                    {!n.u&&<div style={{ width:7, flexShrink:0 }}/>}
                    <div><div style={{ color:tp, fontSize:13, lineHeight:1.5 }}>{n.t}</div><div style={{ color:dm?"#555":"#909090", fontSize:11, marginTop:3 }}>{n.d}</div></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {user?(
            <div style={{ position:"relative" }}>
              <div onClick={()=>{setShowUserMenu(m=>!m);setShowNotif(false);}} style={{ width:34, height:34, borderRadius:"50%", background:"#6366f1", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer", border:"2px solid rgba(99,102,241,0.4)" }}>{ini(user.name)}</div>
              {showUserMenu&&(
                <div style={{ position:"absolute", top:"calc(100% + 8px)", right:0, width:200, background:dm?"#141420":"#fff", border:`1px solid ${bdr}`, borderRadius:14, overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.3)", zIndex:200 }}>
                  <div style={{ padding:"14px 16px", borderBottom:`1px solid ${bdr}` }}>
                    <div style={{ color:tp, fontWeight:600, fontSize:14 }}>{user.name}</div>
                    <div style={{ color:ts, fontSize:12, marginTop:2 }}>{user.email}</div>
                  </div>
                  {[{l:"📜 History",p:"history"},{l:"👍 Liked Videos",p:"liked"},{l:"⏰ Watch Later",p:"watchlater"},{l:"📋 Playlists",p:"playlists"},{l:"📢 Subscriptions",p:"subscriptions"},{l:"📊 Analytics",p:"analytics"},{l:"⬆️ Upload Studio",p:"upload"}].map(it=>(
                    <button key={it.p} onClick={()=>{nav(it.p);setShowUserMenu(false);}}
                      style={{ width:"100%", background:"transparent", border:"none", padding:"10px 16px", color:ts, cursor:"pointer", textAlign:"left", fontSize:13 }}
                      onMouseEnter={e=>e.currentTarget.style.background=dm?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{it.l}</button>
                  ))}
                  <div style={{ height:1, background:bdr }}/>
                  <button onClick={onLogout} style={{ width:"100%", background:"transparent", border:"none", padding:"10px 16px", color:"#ef4444", cursor:"pointer", textAlign:"left", fontSize:13 }}>🚪 Sign Out</button>
                </div>
              )}
            </div>
          ):(
            <button onClick={()=>setShowLogin(true)} style={{ padding:"8px 16px", borderRadius:24, background:"transparent", border:"1px solid #6366f1", color:"#6366f1", cursor:"pointer", fontSize:13, fontWeight:600 }}>Sign In</button>
          )}
        </div>
      </header>

      {/* BODY */}
      <div style={{ flex:1, display:"flex", minHeight:0, overflow:"hidden" }}>
        {!showLogin&&<div id="dsk-sb"><Sidebar collapsed={collapsed} page={page} nav={nav} dm={dm} subs={subs} onCh={onCh}/></div>}
        {renderPage()}
      </div>

      {/* MOBILE NAV */}
      <div id="mob-nav" style={{ display:"none", position:"fixed", bottom:0, left:0, right:0, zIndex:150, background:dm?"#0a0a14":"#fff", borderTop:`1px solid ${bdr}`, padding:"8px 0" }}>
        {[{id:"home",l:"Home",ic:"M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"},{id:"trending",l:"Trending",ic:"M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"},{id:"live",l:"Live",ic:"M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"},{id:"subscriptions",l:"Subs",ic:"M20 8H4V6h16v2zm-2-6H6v2h12V2zm4 10v8l-6-4 6-4zm-8 0H2v8h12v-8z"},{id:"history",l:"History",ic:"M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"}].map(i=>(
          <button key={i.id} onClick={()=>nav(i.id)} style={{ flex:1, background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"6px 4px", color:page===i.id?"#6366f1":(dm?"#666":"#909090") }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d={i.ic}/></svg>
            <span style={{ fontSize:10, fontWeight:500 }}>{i.l}</span>
          </button>
        ))}
      </div>

      {(showNotif||showUserMenu)&&<div style={{ position:"fixed", inset:0, zIndex:99 }} onClick={()=>{setShowNotif(false);setShowUserMenu(false);}}/>}
      {showShortcuts&&<ShortcutsModal onClose={()=>setShowShortcuts(false)} dm={dm}/>}
    </div>
  );
}
