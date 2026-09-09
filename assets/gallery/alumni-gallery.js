/**
 * Alumni MTs Gallery Component
 * Handles Album Grid, Category Filtering, Album View, and Fullscreen Lightbox
 */

(function () {
  'use strict';

  let currentAlbumIndex = 0;
  let currentPhotoIndex = 0;
  let activeFilter = 'all';

  // DOM Elements
  let albumsGridEl;
  let albumDetailEl;
  let filterBtnsEl;
  let albumSelectEl;
  let lightboxEl;
  let lbImageEl;
  let lbInfoEl;
  let lbCounterEl;

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof ALUMNI_ALBUMS === 'undefined' || !ALUMNI_ALBUMS.length) {
      console.warn('ALUMNI_ALBUMS data not found.');
      return;
    }

    initElements();
    initFilters();
    renderAlbumCards(ALUMNI_ALBUMS);
    initLightboxEvents();
  });

  function initElements() {
    albumsGridEl = document.getElementById('alumni-albums-grid');
    albumDetailEl = document.getElementById('alumni-detail-view');
    filterBtnsEl = document.getElementById('alumni-filter-bar');
    albumSelectEl = document.getElementById('alumni-album-select');
    lightboxEl = document.getElementById('alumni-lightbox');
    lbImageEl = document.getElementById('alumni-lb-image');
    lbInfoEl = document.getElementById('alumni-lb-info');
    lbCounterEl = document.getElementById('alumni-lb-counter');

    // Back to albums button
    const backBtn = document.getElementById('alumni-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', showAlbumsGrid);
    }
  }

  function initFilters() {
    if (!filterBtnsEl) return;

    // Collect distinct years
    const years = ['all', ...new Set(ALUMNI_ALBUMS.map(a => a.year))].sort();

    // Render filter buttons
    let html = '';
    years.forEach(year => {
      const label = year === 'all' ? `Semua (${ALUMNI_ALBUMS.length} Album)` : `${year}`;
      const activeClass = year === activeFilter ? 'active' : '';
      html += `<button class="alumni-filter-btn ${activeClass}" data-year="${year}">${label}</button>`;
    });

    filterBtnsEl.innerHTML = html;

    // Add click listeners to filter buttons
    filterBtnsEl.querySelectorAll('.alumni-filter-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        filterBtnsEl.querySelectorAll('.alumni-filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeFilter = this.getAttribute('data-year');
        applyFilter();
      });
    });

    // Populate dropdown select
    if (albumSelectEl) {
      let optHtml = '<option value="">-- Pilih Album / Kegiatan --</option>';
      ALUMNI_ALBUMS.forEach((album, idx) => {
        optHtml += `<option value="${idx}">${album.date} - ${album.title} (${album.count} Foto)</option>`;
      });
      albumSelectEl.innerHTML = optHtml;

      albumSelectEl.addEventListener('change', function () {
        if (this.value !== '') {
          openAlbum(parseInt(this.value, 10));
        }
      });
    }
  }

  function applyFilter() {
    showAlbumsGrid();
    const filtered = activeFilter === 'all'
      ? ALUMNI_ALBUMS
      : ALUMNI_ALBUMS.filter(a => a.year === activeFilter);
    renderAlbumCards(filtered);
  }

  function renderAlbumCards(albums) {
    if (!albumsGridEl) return;

    if (!albums.length) {
      albumsGridEl.innerHTML = '<div class="col-12 text-center text-muted py-5"><h5>Tidak ada album untuk kategori ini.</h5></div>';
      return;
    }

    let html = '';
    albums.forEach(album => {
      // Find original index
      const originalIdx = ALUMNI_ALBUMS.findIndex(a => a.id === album.id);
      html += `
        <div class="col-12 col-sm-6 col-md-4 col-lg-3 mb-4">
          <div class="alumni-album-card" data-index="${originalIdx}">
            <div class="alumni-album-cover">
              <img src="${encodeURI(album.cover)}" alt="${escapeHtml(album.title)}" loading="lazy">
              <span class="alumni-album-badge"><i class="mbri-photos mbr-iconfont"></i> ${album.count} Foto</span>
              <span class="alumni-album-year-badge">${album.year}</span>
            </div>
            <div class="alumni-album-body">
              <h4 class="alumni-album-title">${escapeHtml(album.title)}</h4>
              <div class="alumni-album-date">
                <i class="mbri-calendar mbr-iconfont" style="font-size: 0.9rem;"></i> ${album.date}
              </div>
              <button type="button" class="alumni-album-btn">
                <span>Lihat Foto</span>
                <i class="mbri-arrow-next mbr-iconfont" style="font-size: 0.85rem;"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    albumsGridEl.innerHTML = html;

    // Attach click events to album cards
    albumsGridEl.querySelectorAll('.alumni-album-card').forEach(card => {
      card.addEventListener('click', function () {
        const idx = parseInt(this.getAttribute('data-index'), 10);
        openAlbum(idx);
      });
    });
  }

  function openAlbum(albumIdx) {
    if (albumIdx < 0 || albumIdx >= ALUMNI_ALBUMS.length) return;
    currentAlbumIndex = albumIdx;
    const album = ALUMNI_ALBUMS[albumIdx];

    // Hide albums grid, show detail view
    if (albumsGridEl) albumsGridEl.style.display = 'none';
    if (filterBtnsEl) filterBtnsEl.parentElement.style.display = 'none';
    if (albumDetailEl) albumDetailEl.style.display = 'block';

    // Update detail title and info
    const titleEl = document.getElementById('alumni-detail-title');
    const infoEl = document.getElementById('alumni-detail-date');
    if (titleEl) titleEl.textContent = `${album.title}`;
    if (infoEl) infoEl.innerHTML = `<i class="mbri-calendar mbr-iconfont"></i> ${album.date} &nbsp;•&nbsp; <i class="mbri-photos mbr-iconfont"></i> ${album.count} Foto`;

    // Render photo items
    const photoGridEl = document.getElementById('alumni-photo-grid');
    if (photoGridEl) {
      let html = '';
      album.photos.forEach((photoUrl, pIdx) => {
        html += `
          <div class="alumni-photo-item" data-photo-idx="${pIdx}">
            <img src="${encodeURI(photoUrl)}" alt="${escapeHtml(album.title)} Foto ${pIdx + 1}" loading="lazy">
            <div class="alumni-photo-overlay">
              <span class="mbri-search mbr-iconfont"></span>
            </div>
          </div>
        `;
      });
      photoGridEl.innerHTML = html;

      // Attach click to open lightbox
      photoGridEl.querySelectorAll('.alumni-photo-item').forEach(item => {
        item.addEventListener('click', function () {
          const pIdx = parseInt(this.getAttribute('data-photo-idx'), 10);
          openLightbox(pIdx);
        });
      });
    }

    // Scroll smoothly to gallery top
    const sectionEl = document.getElementById('foto-alumni');
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function showAlbumsGrid() {
    if (albumDetailEl) albumDetailEl.style.display = 'none';
    if (albumsGridEl) albumsGridEl.style.display = 'flex';
    if (filterBtnsEl) filterBtnsEl.parentElement.style.display = 'block';
    if (albumSelectEl) albumSelectEl.value = '';
  }

  // Lightbox Implementation
  function openLightbox(photoIdx) {
    if (!lightboxEl) return;
    currentPhotoIndex = photoIdx;
    updateLightboxImage();
    lightboxEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateLightboxImage() {
    const album = ALUMNI_ALBUMS[currentAlbumIndex];
    if (!album || !album.photos.length) return;

    if (currentPhotoIndex < 0) currentPhotoIndex = album.photos.length - 1;
    if (currentPhotoIndex >= album.photos.length) currentPhotoIndex = 0;

    const photoUrl = album.photos[currentPhotoIndex];

    if (lbImageEl) {
      lbImageEl.style.opacity = '0.4';
      lbImageEl.src = encodeURI(photoUrl);
      lbImageEl.onload = function () {
        lbImageEl.style.opacity = '1';
      };
    }

    if (lbInfoEl) {
      lbInfoEl.innerHTML = `<strong>${escapeHtml(album.title)}</strong> (${album.date})`;
    }

    if (lbCounterEl) {
      lbCounterEl.textContent = `Foto ${currentPhotoIndex + 1} dari ${album.photos.length}`;
    }
  }

  function nextPhoto() {
    currentPhotoIndex++;
    updateLightboxImage();
  }

  function prevPhoto() {
    currentPhotoIndex--;
    updateLightboxImage();
  }

  function initLightboxEvents() {
    const closeBtn = document.getElementById('alumni-lb-close');
    const prevBtn = document.getElementById('alumni-lb-prev');
    const nextBtn = document.getElementById('alumni-lb-next');

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', function (e) { e.stopPropagation(); prevPhoto(); });
    if (nextBtn) nextBtn.addEventListener('click', function (e) { e.stopPropagation(); nextPhoto(); });

    if (lightboxEl) {
      lightboxEl.addEventListener('click', function (e) {
        if (e.target === lightboxEl || e.target.classList.contains('alumni-lb-content')) {
          closeLightbox();
        }
      });
    }

    // Keyboard support
    document.addEventListener('keydown', function (e) {
      if (!lightboxEl || !lightboxEl.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    });

    // Touch Swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    if (lightboxEl) {
      lightboxEl.addEventListener('touchstart', function (e) {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });

      lightboxEl.addEventListener('touchend', function (e) {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      }, { passive: true });
    }

    function handleSwipe() {
      const diff = touchEndX - touchStartX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) prevPhoto();
        else nextPhoto();
      }
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#039;';
        default: return m;
      }
    });
  }

  // Expose global functions for album navigation
  window.AlumniGallery = {
    openAlbum: openAlbum,
    showAlbums: showAlbumsGrid
  };

})();
