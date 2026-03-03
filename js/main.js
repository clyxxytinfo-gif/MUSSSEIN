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

  // Sidebar: restore interactive toggle + submenu handling
  (function sidebarInit(){
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelectorAll('.sidebar-toggle');
    const closeBtn = document.getElementById('sidebar-close');
    if(!sidebar) return;

    toggle.forEach(btn => btn.addEventListener('click', function(e){
      e.preventDefault();
      const opening = !sidebar.classList.contains('open');
      sidebar.classList.toggle('open', opening);
      // set aria on toggle and sidebar
      btn.setAttribute('aria-expanded', String(opening));
      sidebar.setAttribute('aria-hidden', String(!opening));
    }));

    if(closeBtn){ closeBtn.addEventListener('click', function(){ sidebar.classList.remove('open'); sidebar.setAttribute('aria-hidden','true'); toggle.forEach(t=> t.setAttribute('aria-expanded','false')); }); }

    // close when clicking outside on mobile
    document.addEventListener('click', function(ev){ if(!sidebar.classList.contains('open')) return; if(!sidebar.contains(ev.target) && !Array.from(toggle).some(t=>t.contains(ev.target))){ sidebar.classList.remove('open'); sidebar.setAttribute('aria-hidden','true'); toggle.forEach(t=> t.setAttribute('aria-expanded','false')); } });

    // submenu toggles
    document.querySelectorAll('.sidebar ul li').forEach(function(li){
      const submenu = li.querySelector('ul');
      const link = li.querySelector(':scope > a');
      if(submenu && link){ li.classList.add('has-sub'); submenu.style.display = 'none'; link.addEventListener('click', function(e){ e.preventDefault(); const open = li.classList.toggle('open'); submenu.style.display = open ? 'block' : 'none'; }); }
    });
  })();

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

    // --- Filter-Buttons & Galerie-Suche ---
    const filterBtns = Array.from(document.querySelectorAll('.filter'));
    const gallerySearch = document.getElementById('gallerySearch');
    let activeFilter = '*';

    function applyFilters(){
      const q = gallerySearch ? gallerySearch.value.trim().toLowerCase() : '';
      gallery.forEach(fig => {
        const title = (fig.getAttribute('data-title') || fig.querySelector('figcaption')?.textContent || '').toLowerCase();
        const cat = (fig.getAttribute('data-category') || '').toLowerCase();
        const matchesFilter = activeFilter === '*' || (cat && cat.indexOf(activeFilter) !== -1);
        const matchesSearch = q === '' || title.indexOf(q) !== -1;
        if(matchesFilter && matchesSearch){ fig.classList.remove('gallery-filter-hidden'); } else { fig.classList.add('gallery-filter-hidden'); }
      });
    }

    if(filterBtns.length){
      filterBtns.forEach(btn => btn.addEventListener('click', function(){
        filterBtns.forEach(b=>b.classList.remove('active'));
        this.classList.add('active');
        activeFilter = this.getAttribute('data-filter') || '*';
        applyFilters();
      }));
    }

    if(gallerySearch){
      gallerySearch.addEventListener('input', function(){ applyFilters(); });
    }

    // clickable gallery items -> lightbox + press feedback
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

      // open image in lightbox (no scoring)
      const id = title || url || String(idx);
    }

    function openLightboxFromURL(url, title){
      // try to find index matching URL
      const idx = gallery.findIndex(g => (g.getAttribute('data-fullimg')||'') === url || (g.querySelector('img')?.src||'') === url);
      if(idx >= 0) return openLightbox(idx);
      if(!lightbox || !lbImg) return;
      lbImg.src = url; lbImg.alt = title || ''; if(lbTitle) lbTitle.textContent = title || ''; if(lbCounter) lbCounter.textContent = '—'; lightbox.setAttribute('aria-hidden','false'); lbClose?.focus();
    }

    // Expose for map markers (opens related gallery image if provided)
    window.galleryMarkerClick = function(m){
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

    // no score badge for city site
  })();

  // Read-more / Mehr lesen: delegated toggles for elements with .read-more-btn
  (function initReadMore(){
    function toggle(btn){
      const container = btn.closest('.detail, .card, .events-item, article') || btn.parentElement;
      if(!container) return;
      const more = container.querySelector('.more-content');
      if(!more) return;
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      if(expanded){
        btn.setAttribute('aria-expanded','false');
        btn.textContent = 'Mehr lesen';
        container.classList.remove('more-open');
        more.setAttribute('aria-hidden','true');
      } else {
        btn.setAttribute('aria-expanded','true');
        btn.textContent = 'Weniger';
        container.classList.add('more-open');
        more.setAttribute('aria-hidden','false');
      }
    }

    document.addEventListener('click', function(e){
      const btn = e.target.closest && e.target.closest('.read-more-btn');
      if(!btn) return;
      e.preventDefault();
      toggle(btn);
    });

    // allow keyboard activation (Enter/Space) when button is focused
    document.addEventListener('keydown', function(e){
      const active = document.activeElement;
      if(!active) return;
      if(active.classList && active.classList.contains('read-more-btn') && (e.key === 'Enter' || e.key === ' ')){
        e.preventDefault();
        toggle(active);
      }
    });
  })();

  // Modal popup for more-link elements
  (function initModal(){
    const modal = document.getElementById('modal');
    if(!modal) return;
    const body = modal.querySelector('.modal-body');
    const closeBtn = modal.querySelector('.modal-close');

    function open(html){
      body.innerHTML = html;
      modal.setAttribute('aria-hidden','false');
      modal.classList.add('open');
      closeBtn.focus();
    }
    function close(){
      modal.setAttribute('aria-hidden','true');
      modal.classList.remove('open');
    }

    document.addEventListener('click', function(e){
      const link = e.target.closest && e.target.closest('.more-link');
      if(!link) return;
      e.preventDefault();
      const article = link.closest('article');
      if(!article) return;
      open(article.innerHTML);
    });

    closeBtn.addEventListener('click', close);
    modal.addEventListener('click', function(e){ if(e.target === modal) close(); });
    document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && modal.getAttribute('aria-hidden')==='false') close(); });
  })();

  // News/Events are static HTML in the pages (no JS rendering)
});
