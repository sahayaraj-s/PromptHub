// ================================================
// PROMPTHUB - MAIN (Homepage)
// ================================================

document.addEventListener('DOMContentLoaded', () => {
  // Init AOS
  AOS.init({
    duration: 700,
    easing: 'ease-out-cubic',
    once: true,
    offset: 60,
    disable: window.innerWidth < 480 ? true : false
  });

  // Init utilities
  initNavbarScroll();
  initHamburger();
  initThemeToggle();
  initMagneticButtons();
  initTypedText();
  initCounters();
  initScrollReveal();
  initLazyLoad();

  // Load content
  loadTrendingPrompts();
  loadVideos();
  loadCategoryStats();

  // Page loaded animation
  document.body.classList.add('page-loaded');

  // Keyboard search
  document.getElementById('heroSearch')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleHeroSearch();
  });
});

// LOAD TRENDING PROMPTS
async function loadTrendingPrompts() {
  const grid = document.getElementById('trendingGrid');
  if (!grid) return;

  try {
    const prompts = await DB.getTrending(6);
    if (prompts.length === 0) {
      grid.innerHTML = getDemoCards();
      return;
    }
    grid.innerHTML = prompts.map((p, i) => buildPromptCard(p, i)).join('');
    initLikeStates();
  } catch (e) {
    console.error('Error loading trending:', e);
    grid.innerHTML = getDemoCards();
  }
}

// DEMO CARDS (when Firebase is empty / error)
function getDemoCards() {
  const demos = [
    {
      id: 'demo1',
      title: 'Cinematic AI Portrait – Golden Hour',
      description: 'A stunning cinematic portrait with perfect golden hour lighting and film grain.',
      prompt: 'Cinematic portrait of a woman, golden hour lighting, film grain, bokeh background, 85mm lens, f/1.4, photorealistic, hyperdetailed, shot on ARRI ALEXA --ar 2:3 --v 6',
      tool: 'Midjourney', type: 'image', likes: 324, copies: 187, views: 1450,
      featured: true
    },
    {
      id: 'demo2',
      title: 'Viral Neon City Time-lapse Prompt',
      description: 'Create jaw-dropping neon cityscape videos with this Kling AI prompt.',
      prompt: 'Hyperlapse through a neon-lit cyberpunk city at night, rain reflections on wet streets, flying cars, holographic billboards, cinematic motion blur, 4K ultra-realistic',
      tool: 'Kling AI', type: 'video', likes: 512, copies: 280, views: 3200,
      featured: false
    },
    {
      id: 'demo3',
      title: 'Anime Character Full-Body',
      description: 'Generate perfect anime-style full body character illustrations.',
      prompt: 'Full body anime character, magical girl, flowing sakura dress, glowing eyes, detailed shading, studio quality, white background, digital art illustration --ar 3:4 --v 6',
      tool: 'Midjourney', type: 'image', likes: 198, copies: 134, views: 980
    },
    {
      id: 'demo4',
      title: 'ChatGPT Viral Social Media Captions',
      description: 'Get 30 viral-ready captions for any niche in seconds.',
      prompt: 'You are a viral social media expert. Generate 30 engaging captions for [NICHE] content. Each should include a hook, value, and call to action. Make them conversational, not salesy. Include relevant emojis.',
      tool: 'ChatGPT', type: 'text', likes: 445, copies: 390, views: 2100
    },
    {
      id: 'demo5',
      title: 'Luxury Product Photography',
      description: 'Stunning luxury product shots for e-commerce and ads.',
      prompt: 'Luxury perfume bottle, studio photography, soft dramatic lighting, dark moody background, reflections on marble surface, high-end fashion magazine style, f/2.8, 100mm macro lens --ar 1:1 --v 6',
      tool: 'DALL·E 3', type: 'image', likes: 267, copies: 156, views: 1340
    },
    {
      id: 'demo6',
      title: 'Runway AI Abstract Art Video',
      description: 'Mesmerizing abstract art animations for reels and videos.',
      prompt: 'Abstract flowing liquid metallic shapes, iridescent colors shifting from purple to cyan to pink, slow motion, loop-able, 4K, mesmerizing fluid dynamics, no text',
      tool: 'Runway ML', type: 'video', likes: 389, copies: 212, views: 2400
    }
  ];

  return demos.map((p, i) => buildPromptCard(p, i)).join('');
}

// LOAD VIDEOS
async function loadVideos() {
  const grid = document.getElementById('videoGrid');
  if (!grid) return;

  try {
    const videos = await DB.getPrompts({ type: 'video', limit: 3, orderBy: 'createdAt' });
    if (videos.length === 0) {
      grid.innerHTML = getDemoVideos();
      return;
    }
    grid.innerHTML = videos.map((v, i) => buildVideoCard(v, i)).join('');
  } catch {
    grid.innerHTML = getDemoVideos();
  }
}

function buildVideoCard(video, index = 0) {
  const thumb = video.thumbnailUrl || video.imageUrl || '';
  return `
    <div class="video-card" onclick="viewPrompt('${video.id}')" data-aos="fade-up" data-aos-delay="${index * 100}">
      <div class="video-thumb">
        ${thumb ? `<img src="${thumb}" alt="${sanitize(video.title || '')}" loading="lazy"/>` : `<div style="height:100%;background:linear-gradient(135deg,var(--bg-2),var(--bg-3));display:flex;align-items:center;justify-content:center;font-size:3rem">🎬</div>`}
        <div class="video-play">
          <div class="video-play-icon"><i class="fa fa-play"></i></div>
        </div>
        <div class="video-duration">${video.duration || 'AI Video'}</div>
      </div>
      <div class="card-body">
        <div class="card-tool-tag">${getToolEmoji(video.tool)} ${sanitize(video.tool || 'AI')}</div>
        <div class="card-title">${sanitize(video.title || 'AI Video Prompt')}</div>
        <div class="card-meta">
          <span class="views"><i class="fa fa-eye"></i> ${formatNumber(video.views || 0)}</span>
          <span>·</span>
          <span class="date">${formatDate(video.createdAt)}</span>
        </div>
      </div>
    </div>
  `;
}

function getDemoVideos() {
  const videos = [
    { id: 'v1', title: 'Cinematic Rain Scene – Kling AI', tool: 'Kling AI', views: 4200, createdAt: null },
    { id: 'v2', title: 'Abstract Loop Animation – Runway', tool: 'Runway ML', views: 3100, createdAt: null },
    { id: 'v3', title: 'AI Character Walk Cycle – Sora', tool: 'Sora', views: 2800, createdAt: null }
  ];
  return videos.map((v, i) => buildVideoCard(v, i)).join('');
}

// CATEGORY STATS
async function loadCategoryStats() {
  const catCards = document.querySelectorAll('[data-category]');
  catCards.forEach(async (el) => {
    const cat = el.dataset.category;
    try {
      const count = await DB.getCategoryCount(cat);
      el.textContent = count > 0 ? `${formatNumber(count)} prompts` : 'Explore';
    } catch {
      el.textContent = 'Explore';
    }
  });
}

// INIT LIKE STATES FOR CARDS
async function initLikeStates() {
  if (!currentUser) return;
  const likeButtons = document.querySelectorAll('.like-btn');
  for (const btn of likeButtons) {
    const promptId = btn.dataset.id;
    if (!promptId) continue;
    try {
      const liked = await DB.isLiked(promptId, currentUser.uid);
      if (liked) {
        btn.classList.add('liked');
        btn.querySelector('i').style.color = '#FF4ECD';
      }
    } catch {}
  }
}
