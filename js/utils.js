// ================================================
// PROMPTHUB - UTILITIES
// ================================================

// TOAST
function showToast(msg, type='default', dur=3000) {
  const t=document.getElementById('toast'); if(!t) return;
  const icons={success:'✅ ',error:'❌ ',default:'💡 '};
  t.textContent=(icons[type]||'')+msg;
  t.className=`toast ${type}`;
  requestAnimationFrame(()=>t.classList.add('show'));
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.classList.remove('show'),dur);
}

// COPY
async function copyToClipboard(text, btn=null) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta=document.createElement('textarea');
    ta.value=text; ta.style.cssText='position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  }
  showToast('Prompt copied! ✨','success');
  if(btn){
    const orig=btn.innerHTML;
    btn.innerHTML='<i class="fa fa-check"></i> Copied!';
    btn.classList.add('copied');
    setTimeout(()=>{btn.innerHTML=orig;btn.classList.remove('copied');},2000);
  }
}

// NUMBERS & DATES
function formatNumber(n){
  if(!n) return '0';
  if(n>=1000000) return (n/1000000).toFixed(1)+'M';
  if(n>=1000) return (n/1000).toFixed(1)+'K';
  return n.toString();
}
function formatDate(ts){
  if(!ts) return '';
  const d=ts.toDate?ts.toDate():new Date(ts),now=new Date(),diff=now-d,days=Math.floor(diff/86400000);
  if(days===0){const h=Math.floor(diff/3600000);return h===0?'Just now':`${h}h ago`;}
  if(days===1) return 'Yesterday';
  if(days<7) return `${days}d ago`;
  if(days<30) return `${Math.floor(days/7)}w ago`;
  return d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:days>365?'numeric':undefined});
}
function generateSlug(t){return t.toLowerCase().replace(/[^a-z0-9 -]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-').trim();}
function sanitize(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function debounce(fn,d=300){let t;return function(...a){clearTimeout(t);t=setTimeout(()=>fn.apply(this,a),d);};}
function throttle(fn,l=200){let last=0;return function(...a){const n=Date.now();if(n-last>=l){last=n;fn.apply(this,a);};};}
function getParam(n){return new URLSearchParams(window.location.search).get(n);}

// ANIMATE COUNTER
function animateCounter(el,target,dur=1200){
  const start=performance.now();
  function u(now){
    const p=Math.min((now-start)/dur,1),e=1-Math.pow(1-p,3);
    el.textContent=formatNumber(Math.floor(e*target));
    if(p<1) requestAnimationFrame(u); else el.textContent=formatNumber(target);
  }
  requestAnimationFrame(u);
}
function initCounters(){
  const cs=document.querySelectorAll('[data-count]');
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting&&!e.target._counted){e.target._counted=true;animateCounter(e.target,parseInt(e.target.dataset.count));}});
  },{threshold:0.5});
  cs.forEach(c=>io.observe(c));
}

// SHARE
function sharePrompt(title,url=window.location.href){
  if(navigator.share){navigator.share({title:`Check out: ${title}`,url});}
  else{copyToClipboard(url);showToast('Link copied!','success');}
}
function shareToWhatsApp(title,url=window.location.href){window.open(`https://wa.me/?text=${encodeURIComponent(title+'\n'+url)}`,'_blank');}

// TOOL EMOJI
function getToolEmoji(tool){
  const m={'Midjourney':'🎨','ChatGPT':'🤖','Kling AI':'⚡','Runway ML':'🎬','Gemini':'🌟','Leonardo AI':'🎭','DALL·E 3':'✨','Stable Diffusion':'🔮','Sora':'🌊','Claude':'💡','Grok':'🔭','DeepSeek':'🧠','Perplexity':'🔍'};
  return m[tool]||'🤖';
}

// ================================================
// AI TOOL OPEN WITH PROMPT AUTOFILL (Task #5)
// ================================================
async function openInAITool(toolName, promptText) {
  const encoded = encodeURIComponent(promptText);

  const toolConfigs = {
    'ChatGPT': {
      // ChatGPT supports ?q= param for pre-filling
      url: `https://chat.openai.com/?q=${encoded}`,
      fallbackUrl: 'https://chat.openai.com',
      supportsParam: true
    },
    'Gemini': {
      // Gemini supports ?q= param
      url: `https://gemini.google.com/app?q=${encoded}`,
      fallbackUrl: 'https://gemini.google.com',
      supportsParam: true
    },
    'Claude': {
      // Claude supports ?q= param at claude.ai
      url: `https://claude.ai/new?q=${encoded}`,
      fallbackUrl: 'https://claude.ai',
      supportsParam: true
    },
    'Grok': {
      url: 'https://grok.com',
      fallbackUrl: 'https://grok.com',
      supportsParam: false
    },
    'DeepSeek': {
      url: 'https://chat.deepseek.com',
      fallbackUrl: 'https://chat.deepseek.com',
      supportsParam: false
    },
    'Perplexity': {
      // Perplexity supports ?q= param
      url: `https://www.perplexity.ai/?q=${encoded}`,
      fallbackUrl: 'https://www.perplexity.ai',
      supportsParam: true
    }
  };

  const config = toolConfigs[toolName];
  if (!config) return;

  // Always copy prompt to clipboard first
  try {
    await navigator.clipboard.writeText(promptText);
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = promptText; ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
    } catch {}
  }

  if (config.supportsParam) {
    window.open(config.url, '_blank', 'noopener');
    showToast(`Opening ${toolName} with your prompt...`, 'success', 4000);
  } else {
    window.open(config.fallbackUrl, '_blank', 'noopener');
    showToast(`Prompt copied! Paste it into ${toolName}.`, 'success', 5000);
  }
}

// BUILD PROMPT CARD (no user auth required)
function buildPromptCard(p,i=0){
  const isVideo=p.type==='video';
  const img=p.thumbnailUrl||(p.mediaUrl&&!isVideo?p.mediaUrl:'')||p.imageUrl||'';
  const toolColors={'Midjourney':'#7C3AED','ChatGPT':'#10B981','Kling AI':'#FF4ECD','Runway ML':'#00E5FF','Gemini':'#4285F4','Leonardo AI':'#F59E0B','DALL·E 3':'#EC4899','Stable Diffusion':'#8B5CF6','Sora':'#06B6D4','Claude':'#FF6B35'};
  const tc=toolColors[p.tool]||'#7C3AED';
  const isTrending=(p.likes||0)>50||(p.copies||0)>30;
  return `
  <div class="prompt-card card-enter" style="animation-delay:${i*0.06}s" onclick="viewPrompt('${p.id}')">
    <div class="card-media">
      ${img?`<img src="${img}" alt="${sanitize(p.title||'')}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
             <div class="card-media-placeholder" style="display:none">${getToolEmoji(p.tool)}</div>`
          :`<div class="card-media-placeholder">${getToolEmoji(p.tool)}</div>`}
      ${isTrending?'<div class="card-badge trending">🔥 Trending</div>':''}
      ${p.featured?'<div class="card-badge featured">⭐ Featured</div>':''}
      ${isVideo?'<div class="card-video-icon"><i class="fa fa-play"></i></div>':''}
    </div>
    <div class="card-body">
      <div class="card-tool-tag" style="color:${tc};border-color:${tc}33;background:${tc}1A">${getToolEmoji(p.tool)} ${sanitize(p.tool||'AI')}</div>
      <div class="card-title">${sanitize(p.title||'Untitled')}</div>
      <div class="card-desc">${sanitize(p.description||'')}</div>
    </div>
    <div class="card-creator">
      <div class="creator-mini-avatar">👤</div>
      <span class="creator-mini-name">${sanitize(p.creatorName||'Creator')}</span>
    </div>
    <div class="card-footer" onclick="event.stopPropagation()">
      <div class="card-actions">
        <span class="card-action-btn"><i class="fa fa-heart" style="color:#FF4ECD"></i> ${formatNumber(p.likes||0)}</span>
        <span class="card-action-btn"><i class="fa fa-eye"></i> ${formatNumber(p.views||0)}</span>
      </div>
      <button class="card-copy-btn" onclick="handleCopy('${p.id}',\`${escapeText(p.prompt||'')}\`,this)">
        <i class="fa fa-copy"></i> Copy
      </button>
    </div>
  </div>`;
}
function escapeText(t){return t.replace(/`/g,'\\`').replace(/\$/g,'\\$').replace(/\\/g,'\\\\');}

// COPY HANDLER
async function handleCopy(promptId,text,btn){
  await copyToClipboard(text,btn);
  try{await DB.incrementField('prompts',promptId,'copies');}catch{}
}
// VIEW PROMPT
function viewPrompt(id){window.location.href=`/pages/prompt.html?id=${id}`;}
// GOTO CATEGORY
function gotoCategory(cat){window.location.href=`/pages/feed.html?category=${encodeURIComponent(cat)}`;}
// HERO SEARCH
function handleHeroSearch(){const v=document.getElementById('heroSearch')?.value.trim();if(v)window.location.href=`/pages/search.html?q=${encodeURIComponent(v)}`;}
function quickSearch(t){window.location.href=`/pages/search.html?q=${encodeURIComponent(t)}`;}

// NAVBAR SCROLL
function initNavbarScroll(){
  const nb=document.getElementById('navbar');if(!nb)return;
  window.addEventListener('scroll',throttle(()=>nb.classList.toggle('scrolled',window.scrollY>50),100));
}
// HAMBURGER
function initHamburger(){
  const ham=document.getElementById('hamburger'),links=document.getElementById('navLinks');
  if(!ham||!links)return;
  ham.addEventListener('click',()=>{ham.classList.toggle('active');links.classList.toggle('mobile-open');});
  document.addEventListener('click',e=>{if(!ham.contains(e.target)&&!links.contains(e.target)){ham.classList.remove('active');links.classList.remove('mobile-open');}});
}
// THEME
function initThemeToggle(){
  const btn=document.getElementById('themeToggle');if(!btn)return;
  if(localStorage.getItem('theme')==='light') document.body.classList.add('light-mode');
  btn.addEventListener('click',()=>{
    document.body.classList.toggle('light-mode');
    const isL=document.body.classList.contains('light-mode');
    localStorage.setItem('theme',isL?'light':'dark');
    btn.innerHTML=isL?'<i class="fa fa-sun"></i>':'<i class="fa fa-moon"></i>';
  });
  if(document.body.classList.contains('light-mode')) btn.innerHTML='<i class="fa fa-sun"></i>';
}
// TYPED TEXT
function initTypedText(){
  const el=document.getElementById('typedText');if(!el)return;
  const texts=['AI Creativity','AI Images','AI Videos','Viral Prompts','Your Workflow'];
  let ti=0,ci=0,del=false;
  function type(){
    const cur=texts[ti];
    el.textContent=del?cur.substring(0,ci--):cur.substring(0,ci++);
    if(!del&&ci>cur.length){del=true;setTimeout(type,1600);return;}
    if(del&&ci<0){del=false;ti=(ti+1)%texts.length;}
    setTimeout(type,del?55:90);
  }
  type();
}
// SCROLL REVEAL
function initScrollReveal(){
  const rs=document.querySelectorAll('.reveal');if(!rs.length)return;
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');io.unobserve(e.target);}});},{threshold:0.1});
  rs.forEach(el=>io.observe(el));
}
// MAGNETIC BUTTONS
function initMagneticButtons(){
  document.querySelectorAll('.magnetic-btn').forEach(btn=>{
    btn.addEventListener('mousemove',e=>{const r=btn.getBoundingClientRect();btn.style.transform=`translate(${(e.clientX-r.left-r.width/2)*0.15}px,${(e.clientY-r.top-r.height/2)*0.15}px)`;});
    btn.addEventListener('mouseleave',()=>btn.style.transform='');
  });
}
// LAZY LOAD
function initLazyLoad(){
  if(!('IntersectionObserver'in window))return;
  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){const img=e.target;if(img.dataset.src){img.src=img.dataset.src;delete img.dataset.src;}io.unobserve(img);}});});
  document.querySelectorAll('img[loading="lazy"]').forEach(img=>io.observe(img));
}

// ================================================
// CATEGORY HELPERS (shared across pages)
// ================================================
const DEFAULT_CATEGORY_ICONS = {
  'ai-images':'🖼️','ai-videos':'🎬','midjourney':'🎨','kling-ai':'⚡',
  'runway-ai':'🎥','chatgpt':'🤖','gemini':'🌟','leonardo':'🎭',
  'stable-diffusion':'🔮','sora':'🌊','cinematic':'🎞️','viral-content':'🔥'
};
function getCatEmoji(cat){ return DEFAULT_CATEGORY_ICONS[cat?.toLowerCase().replace(/\s+/g,'-')]||'📁'; }

// Load dynamic categories from Firestore; fallback to static list
async function loadDynamicCategories() {
  try {
    const cats = await DB.getCategories(true);
    if(cats.length) return cats;
  } catch(e){}
  // Static fallback
  return [
    {id:'ai-images',name:'AI Images',slug:'ai-images',description:'Stunning AI-generated images',icon:'🖼️',gradient:'#7C3AED,#00E5FF'},
    {id:'ai-videos',name:'AI Videos',slug:'ai-videos',description:'Viral AI video prompts',icon:'🎬',gradient:'#FF4ECD,#7C3AED'},
    {id:'midjourney',name:'Midjourney',slug:'midjourney',description:'Expert Midjourney prompts',icon:'🎨',gradient:'#7C3AED,#9D6FEB'},
    {id:'kling-ai',name:'Kling AI',slug:'kling-ai',description:'Video generation for Kling AI',icon:'⚡',gradient:'#FF6B35,#FF4ECD'},
    {id:'runway-ai',name:'Runway ML',slug:'runway-ai',description:'Cinematic AI video creation',icon:'🎥',gradient:'#00E5FF,#7C3AED'},
    {id:'chatgpt',name:'ChatGPT',slug:'chatgpt',description:'ChatGPT prompts for every use case',icon:'🤖',gradient:'#10B981,#00E5FF'},
    {id:'gemini',name:'Gemini',slug:'gemini',description:'Google Gemini creative prompts',icon:'🌟',gradient:'#4285F4,#FF4ECD'},
    {id:'leonardo',name:'Leonardo AI',slug:'leonardo',description:'Beautiful Leonardo AI prompts',icon:'🎭',gradient:'#F59E0B,#EF4444'},
    {id:'stable-diffusion',name:'Stable Diffusion',slug:'stable-diffusion',description:'Open-source AI image prompts',icon:'🔮',gradient:'#8B5CF6,#EC4899'},
    {id:'sora',name:'Sora',slug:'sora',description:'OpenAI Sora video prompts',icon:'🌊',gradient:'#06B6D4,#3B82F6'},
    {id:'cinematic',name:'Cinematic',slug:'cinematic',description:'Hollywood-level visual prompts',icon:'🎞️',gradient:'#F59E0B,#EF4444'},
    {id:'viral-content',name:'Viral Content',slug:'viral-content',description:'Trending social content prompts',icon:'🔥',gradient:'#EF4444,#F59E0B'},
  ];
}

// Populate a <select> element with categories from Firestore
async function populateCategorySelect(selectEl, selectedVal='') {
  if(!selectEl) return;
  const cats = await loadDynamicCategories();
  const opts = cats.map(c=>`<option value="${c.slug||c.id}" ${(c.slug||c.id)===selectedVal?'selected':''}>${c.icon||getCatEmoji(c.slug||c.id)} ${sanitize(c.name)}</option>`).join('');
  selectEl.innerHTML = `<option value="">Select Category</option>${opts}`;
}

// ================================================
// AD BLOCKER DETECTION (auto-runs on user pages)
// ================================================
(function detectAdBlock(){
  // Skip on admin pages
  if(window.location.pathname.includes('/admin')) return;

  // Inject a bait element that ad blockers target
  const bait = document.createElement('div');
  bait.className = 'ad adsbygoogle ad-block text-ad textAd text_ad text_ads ad-300x250 pub_300x250 pub_728x90';
  bait.setAttribute('data-ad','true');
  bait.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
  document.body.appendChild(bait);

  // Also try fetching a known ad URL that ad blockers intercept
  let adFetchBlocked = false;
  const img = new Image();
  img.onload  = () => {}; // not blocked
  img.onerror = () => { adFetchBlocked = true; };
  img.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-test';

  setTimeout(() => {
    const style = window.getComputedStyle(bait);
    const isHidden =
      !bait ||
      bait.offsetParent === null ||
      bait.offsetHeight === 0 ||
      bait.offsetWidth  === 0 ||
      style.getPropertyValue('display')    === 'none' ||
      style.getPropertyValue('visibility') === 'hidden' ||
      style.getPropertyValue('opacity')    === '0';

    if(bait.parentNode) bait.parentNode.removeChild(bait);

    if(isHidden || adFetchBlocked){
      _showAdBlockOverlay();
    }
  }, 400);

  function _showAdBlockOverlay(){
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.id = 'adblock-overlay';
    overlay.innerHTML = `
      <div class="adblock-modal">
        <span class="adblock-icon">🛡️</span>
        <h2>Ad Blocker Detected</h2>
        <p>PromptHub is 100% free and kept alive by non-intrusive ads. Please whitelist us to continue using the site — it takes only 10 seconds!</p>
        <div class="adblock-steps">
          <div class="adblock-step">
            <div class="adblock-step-num">1</div>
            <span>Click your ad blocker icon in the browser toolbar</span>
          </div>
          <div class="adblock-step">
            <div class="adblock-step-num">2</div>
            <span>Select <strong style="color:#fff">"Pause on this site"</strong> or <strong style="color:#fff">"Whitelist"</strong></span>
          </div>
          <div class="adblock-step">
            <div class="adblock-step-num">3</div>
            <span>Click the button below to reload</span>
          </div>
        </div>
        <button class="adblock-btn" onclick="location.reload()">
          <i class="fa fa-refresh"></i>
          I've Disabled It – Reload Now
        </button>
      </div>`;
    document.body.appendChild(overlay);
  }
})();
