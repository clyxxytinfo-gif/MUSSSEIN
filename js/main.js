// Simple JS: search filtering and contact form stub
document.addEventListener('DOMContentLoaded',function(){
  const search = document.getElementById('searchInput');
  if(search){
    search.addEventListener('input',function(){
      const q = this.value.trim().toLowerCase();
      const cards = document.querySelectorAll('.card, .feature, .events-item, .detail');
      cards.forEach(c=>{
        const show = q === '' || c.textContent.toLowerCase().includes(q);
        c.style.display = show ? '' : 'none';
      });
    });
  }

  const form = document.getElementById('contactForm');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      alert('Danke! Das Formular wurde (lokal) abgeschickt.');
      form.reset();
    });
  }

  // mark active nav link based on current file
  const navLinks = document.querySelectorAll('.main-nav a');
  navLinks.forEach(a => {
    try{
      const href = a.getAttribute('href');
      const path = window.location.pathname.split('/').pop() || 'index.html';
      if(path === href || (href === 'index.html' && path === '')){
        a.classList.add('active');
      }
    }catch(e){ }
  });

  // mobile menu toggle
  const menuToggles = document.querySelectorAll('.menu-toggle');
  menuToggles.forEach(btn => {
    btn.addEventListener('click', ()=>{
      const sidebar = document.querySelector('.sidebar');
      const nav = sidebar.querySelector('.main-nav');
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('show');
    });
  });

  // --- User slide-in sidebar JS ---
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebarEl = document.getElementById('sidebar');
  const sidebarClose = document.getElementById('sidebar-close');
  if(sidebarToggle && sidebarEl){
    // Toggle open/close and switch icon between ☰ and ✕
    sidebarToggle.addEventListener('click', function(e){
      e.stopPropagation();
      const opening = !sidebarEl.classList.contains('open');
      sidebarEl.classList.toggle('open');
      document.body.classList.toggle('sidebar-open');
      // update toggle icon and aria-label
      sidebarToggle.textContent = opening ? '✕' : '☰';
      sidebarToggle.setAttribute('aria-label', opening ? 'Menü schließen' : 'Menü öffnen');
      // hide the inside close button when using top toggle (to avoid duplicate)
      const insideClose = document.getElementById('sidebar-close');
      if(insideClose) insideClose.style.display = opening ? 'none' : '';
    });
  }
  if(sidebarClose && sidebarEl){
    sidebarClose.addEventListener('click', function(e){
      e.stopPropagation();
      sidebarEl.classList.remove('open');
      document.body.classList.remove('sidebar-open');
      // reset top toggle icon
      if(sidebarToggle){ sidebarToggle.textContent = '☰'; sidebarToggle.setAttribute('aria-label','Menü öffnen'); }
      sidebarClose.style.display = '';
    });
  }

  // Close sidebar when clicking outside
  document.addEventListener('click', function(event){
    if(!sidebarEl) return;
    const toggle = document.getElementById('sidebar-toggle');
    if (!sidebarEl.contains(event.target) && toggle && !toggle.contains(event.target)){
      sidebarEl.classList.remove('open');
      document.body.classList.remove('sidebar-open');
      if(sidebarToggle){ sidebarToggle.textContent = '☰'; sidebarToggle.setAttribute('aria-label','Menü öffnen'); }
      const insideClose = document.getElementById('sidebar-close'); if(insideClose) insideClose.style.display = '';
    }
  });

  // Mark items that have submenus and collapse them by default
  document.querySelectorAll('.sidebar ul li').forEach(function(li){
    const submenu = li.querySelector('ul');
    if(submenu){
      li.classList.add('has-sub');
      // ensure collapsed at start
      submenu.style.display = 'none';
      li.classList.remove('open');
    }
  });

  // Sidebar dropdowns: toggle nested ULs
  document.querySelectorAll('.sidebar ul li').forEach(function(li){
    const submenu = li.querySelector('ul');
    const mainLink = li.querySelector(':scope > a');
    if(submenu && mainLink){
      mainLink.addEventListener('click', function(e){
        e.preventDefault();
        const opened = li.classList.toggle('open');
        submenu.style.display = opened ? 'block' : 'none';
      });
    }
  });

  // Initialize Leaflet map on pages that include #map using inline `PLACES` array (no JSON fetch)
  (function initMap(){
    const mapEl = document.getElementById('map');
    if(!mapEl || typeof L === 'undefined') return;

    const map = L.map(mapEl).setView([51.1657, 10.4515], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Inline places data (editable here)
    const PLACES = [
      {id:1,lat:52.5208,lon:13.4050,title:'Rathaus',desc:'Das Rathaus im Zentrum der Stadt.'},
      {id:2,lat:48.1351,lon:11.5820,title:'Stadtpark',desc:'Großer Park mit Spielplatz.'},
      {id:3,lat:50.9375,lon:6.9603,title:'Museum',desc:'Museum für lokale Geschichte.'}
    ];

    try{
      PLACES.forEach(m => {
        const marker = L.marker([m.lat,m.lon]).addTo(map).bindPopup('<strong>'+m.title+'</strong><br/>'+m.desc);
        marker.on('click', function(){ if(window.galleryMarkerClick) window.galleryMarkerClick(m); });
      });
      if(PLACES.length) map.setView([PLACES[0].lat, PLACES[0].lon], 12);
    }catch(e){
      L.marker([52.5208,13.4050]).addTo(map).bindPopup('Beispielort');
    }
  })();

  // --- Gallery, Lightbox & Scoring ---
  (function initGalleryFeatures(){
    const gallery = Array.from(document.querySelectorAll('.gallery-item'));
    const lightbox = document.getElementById('lightbox');
    const lbImg = lightbox ? lightbox.querySelector('.lightbox-img') : null;
    const lbTitle = lightbox ? lightbox.querySelector('.lightbox-title') : null;
    const lbCounter = lightbox ? lightbox.querySelector('.lightbox-counter') : null;
    const lbClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;
    const lbNext = lightbox ? lightbox.querySelector('.lightbox-next') : null;
    const lbPrev = lightbox ? lightbox.querySelector('.lightbox-prev') : null;

    let current = -1;
    const SCORE_KEY = 'galleryScore_v1';
    const COLLECTED_KEY = 'galleryCollected_v1';
    const collected = new Set(JSON.parse(localStorage.getItem(COLLECTED_KEY) || '[]'));



    function addScore(amount, opts){
      const prev = loadScore();
      const next = prev + amount;
      saveScore(next);
      if(opts && opts.el){
        const plus = document.createElement('div'); plus.className = 'floating-plus'; plus.textContent = (amount>0?'+':'')+amount;
        opts.el.appendChild(plus);
        setTimeout(()=> plus.remove(), 900);
      }
    }

    // clickable gallery items -> lightbox + score + press feedback
    gallery.forEach((fig, idx)=>{
      fig.setAttribute('tabindex','0');
      fig.addEventListener('click', function(e){ openLightbox(idx, e.currentTarget); });
      fig.addEventListener('keydown', function(e){ if(e.key==='Enter' || e.key===' ') { e.preventDefault(); openLightbox(idx, e.currentTarget); } });
      // quick press visual (pointer friendly)
      fig.addEventListener('pointerdown', function(){ this.classList.add('pressed'); });
      ['pointerup','pointercancel','pointerleave'].forEach(ev=> fig.addEventListener(ev, function(){ this.classList.remove('pressed'); }));
    });

    function openLightbox(idx, sourceEl){
      if(!lightbox || !lbImg) return;
      current = idx;
      const fig = gallery[idx];
      const url = fig.getAttribute('data-fullimg') || fig.querySelector('img')?.src;
      const title = fig.getAttribute('data-title') || fig.querySelector('figcaption')?.textContent || '';
      // reset any transform from swipe
      lbImg.style.transition = 'transform .18s ease'; lbImg.style.transform = 'translateX(0)';
      lbImg.src = url;
      lbImg.alt = title;
      if(lbTitle) lbTitle.textContent = title;
      if(lbCounter) lbCounter.textContent = (idx+1) + ' / ' + gallery.length;
      lightbox.setAttribute('aria-hidden','false');
      lbClose?.focus();

      // scoring: only once per unique image
      const id = title || url || String(idx);
      if(!collected.has(id)){
        collected.add(id);
        localStorage.setItem(COLLECTED_KEY, JSON.stringify(Array.from(collected)));
        addScore(10, {el: sourceEl || fig});
      }
    }

    function openLightboxFromURL(url, title){
      // try to find index matching URL
      const idx = gallery.findIndex(g => (g.getAttribute('data-fullimg')||'') === url || (g.querySelector('img')?.src||'') === url);
      if(idx >= 0) return openLightbox(idx);
      if(!lightbox || !lbImg) return;
      lbImg.src = url; lbImg.alt = title || ''; if(lbTitle) lbTitle.textContent = title || ''; if(lbCounter) lbCounter.textContent = '—'; lightbox.setAttribute('aria-hidden','false'); lbClose?.focus();
    }

    // Expose for map markers
    window.galleryMarkerClick = function(m){
      // marker gives small reward; if marker includes image, open it
      addScore(5);
      if(m.fullimg){ openLightboxFromURL(m.fullimg, m.title); }
    };

    function closeLightbox(){ if(!lightbox) return; lightbox.setAttribute('aria-hidden','true'); lbImg.src = ''; current = -1; }
    function next(){ if(gallery.length===0) return; openLightbox((current+1) % gallery.length); }
    function prev(){ if(gallery.length===0) return; openLightbox((current-1 + gallery.length) % gallery.length); }

    lbClose?.addEventListener('click', closeLightbox);
    lbNext?.addEventListener('click', next);
    lbPrev?.addEventListener('click', prev);

    // close on backdrop click
    lightbox?.addEventListener('click', function(e){ if(e.target === lightbox) closeLightbox(); });

    // touch / pointer swipe support inside lightbox
    if(lightbox && lbImg){
      let t = {startX:0, startY:0, dx:0, dragging:false};
      lightbox.addEventListener('touchstart', function(e){ if(e.touches.length===1){ t.startX = e.touches[0].clientX; t.startY = e.touches[0].clientY; t.dragging = true; lbImg.style.transition = 'none'; } }, {passive:true});
      lightbox.addEventListener('touchmove', function(e){ if(!t.dragging) return; const dx = e.touches[0].clientX - t.startX; t.dx = dx; lbImg.style.transform = `translateX(${dx}px)`; }, {passive:true});
      lightbox.addEventListener('touchend', function(e){ if(!t.dragging) return; t.dragging = false; lbImg.style.transition = 'transform .18s ease'; if(t.dx > 60){ prev(); } else if(t.dx < -60){ next(); } else { lbImg.style.transform = 'translateX(0)'; } t.dx = 0; });

      // pointer (mouse) drag support
      let pointer = {down:false,startX:0,dx:0};
      lbImg.addEventListener('pointerdown', function(e){ if(e.pointerType === 'mouse' || e.pointerType === 'pen'){ pointer.down = true; pointer.startX = e.clientX; lbImg.setPointerCapture(e.pointerId); lbImg.style.transition = 'none'; } });
      lbImg.addEventListener('pointermove', function(e){ if(!pointer.down) return; pointer.dx = e.clientX - pointer.startX; lbImg.style.transform = `translateX(${pointer.dx}px)`; });
      lbImg.addEventListener('pointerup', function(e){ if(!pointer.down) return; pointer.down = false; lbImg.releasePointerCapture(e.pointerId); lbImg.style.transition = 'transform .18s ease'; if(pointer.dx > 60) { prev(); } else if(pointer.dx < -60) { next(); } else { lbImg.style.transform = 'translateX(0)'; } pointer.dx = 0; });
      lbImg.addEventListener('pointercancel', function(e){ pointer.down = false; pointer.dx = 0; lbImg.style.transition = 'transform .18s ease'; lbImg.style.transform = 'translateX(0)'; });
    }

    // keyboard nav
    document.addEventListener('keydown', function(e){
      if(!lightbox || lightbox.getAttribute('aria-hidden') === 'true') return;
      if(e.key === 'Escape') return closeLightbox();
      if(e.key === 'ArrowRight') return next();
      if(e.key === 'ArrowLeft') return prev();
    });

    updateScoreBadge();
  })();

  // News/Events are static HTML in the pages (no JS rendering)
});
