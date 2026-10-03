/**
 * Galeri & Biodata Keluarga Component
 */

(function () {
  'use strict';

  let currentAlbumIndex = 0;
  let currentPhotoIndex = 0;
  let activeFilter = 'all';

  // DOM Elements
  let albumsGridEl;
  let filterBtnsEl;
  let albumSelectEl;
  let lightboxEl;
  let lbImageEl;
  let lbInfoEl;
  let lbCounterEl;

  document.addEventListener('DOMContentLoaded', function () {
    initElements();

    const albums = (typeof KELUARGA_ALBUMS !== 'undefined' && Array.isArray(KELUARGA_ALBUMS)) ? KELUARGA_ALBUMS : [];
    
    if (albums.length > 0) {
      initFilters(albums);
      renderFamilyCards(albums);
      initLightboxEvents();
    } else {
      renderEmptyState();
    }
  });

  function initElements() {
    albumsGridEl = document.getElementById('keluarga-albums-grid');
    filterBtnsEl = document.getElementById('keluarga-filter-bar');
    albumSelectEl = document.getElementById('keluarga-album-select');
    lightboxEl = document.getElementById('keluarga-lightbox');
    lbImageEl = document.getElementById('keluarga-lb-image');
    lbInfoEl = document.getElementById('keluarga-lb-info');
    lbCounterEl = document.getElementById('keluarga-lb-counter');
  }

  function renderEmptyState() {
    if (filterBtnsEl && filterBtnsEl.parentElement) {
      filterBtnsEl.parentElement.style.display = 'none';
    }
    if (albumsGridEl) {
      albumsGridEl.innerHTML = `
        <div class="col-12">
          <div class="keluarga-empty-state">
            <div class="keluarga-empty-icon">
              <i class="mbri-users mbr-iconfont"></i>
            </div>
            <h3 class="keluarga-empty-title">Dokumentasi & Biodata Keluarga</h3>
            <p class="keluarga-empty-desc">
              Data keluarga belum ditambahkan. Silakan tambahkan file biodata dan foto ke dalam folder <code>assets/images/Keluarga/</code> dan konfigurasikan di <code>assets/gallery/keluarga-data.js</code>.
            </p>
          </div>
        </div>
      `;
    }
  }

  function initFilters(albums) {
    if (!filterBtnsEl) return;

    // Ordered roles for filter
    const roleOrder = ['Ayah', 'Ibu', 'Kakek', 'Nenek'];
    const presentCategories = [...new Set(albums.map(a => a.category).filter(Boolean))];
    const categories = ['all', ...roleOrder.filter(r => presentCategories.includes(r)), ...presentCategories.filter(c => !roleOrder.includes(c))];

    // Render filter buttons
    let html = '';
    categories.forEach(cat => {
      let label = 'Semua (' + albums.length + ')';
      if (cat !== 'all') {
        const count = albums.filter(a => a.category === cat).length;
        label = `${cat} (${count})`;
      }
      const activeClass = cat === activeFilter ? 'active' : '';
      html += `<button type="button" class="keluarga-filter-btn ${activeClass}" data-filter="${cat}">${label}</button>`;
    });

    filterBtnsEl.innerHTML = html;

    // Add click listeners to filter buttons
    filterBtnsEl.querySelectorAll('.keluarga-filter-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        filterBtnsEl.querySelectorAll('.keluarga-filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        activeFilter = this.getAttribute('data-filter');
        applyFilter();
      });
    });

    // Populate dropdown select
    if (albumSelectEl) {
      let optHtml = '<option value="">-- Pilih Anggota Keluarga --</option>';
      albums.forEach((album, idx) => {
        const roleLabel = album.role ? `[${album.role}] ` : (album.category ? `[${album.category}] ` : '');
        optHtml += `<option value="${idx}">${roleLabel}${album.title} ${album.period && album.period !== '-' ? '(' + album.period + ')' : ''}</option>`;
      });
      albumSelectEl.innerHTML = optHtml;

      albumSelectEl.addEventListener('change', function () {
        if (this.value !== '') {
          const idx = parseInt(this.value, 10);
          const member = KELUARGA_ALBUMS[idx];
          if (member && member.cover) {
            openLightboxForMember(idx);
          } else if (member && member.detailUrl) {
            window.open(member.detailUrl, '_blank');
          }
        }
      });
    }
  }

  function applyFilter() {
    const albums = (typeof KELUARGA_ALBUMS !== 'undefined') ? KELUARGA_ALBUMS : [];
    const filtered = activeFilter === 'all'
      ? albums
      : albums.filter(a => a.category === activeFilter);
    renderFamilyCards(filtered);
  }

  function renderFamilyCards(albums) {
    if (!albumsGridEl) return;

    if (!albums.length) {
      albumsGridEl.innerHTML = '<div class="col-12 text-center text-muted py-5"><h5>Tidak ada data untuk kategori ini.</h5></div>';
      return;
    }

    let html = '';
    albums.forEach(item => {
      const originalIdx = KELUARGA_ALBUMS.findIndex(a => a.id === item.id);
      const childrenHtml = (item.children && item.children.length)
        ? `<div class="keluarga-children-tags">${item.children.map(c => `<span class="keluarga-child-tag">${escapeHtml(c)}</span>`).join('')}</div>`
        : '-';

      const hasPhoto = !!(item.cover && item.photos && item.photos.length > 0);
      const badgeText = item.status ? `${item.role || item.category} (${item.status})` : (item.role || item.category || 'Keluarga');

      html += `
        <div class="col-12 col-md-6 col-lg-4 keluarga-card-col">
          <div class="keluarga-card">
            <div class="keluarga-card-header-bar">
              <span class="keluarga-card-category">${escapeHtml(badgeText)}</span>
              <span class="keluarga-card-period">${escapeHtml(item.period || '-')}</span>
            </div>
            
            ${hasPhoto ? `
              <div class="keluarga-card-photo-wrap" data-member-idx="${originalIdx}" title="Klik untuk memperbesar foto">
                <img src="${encodeURI(item.cover)}" alt="${escapeHtml(item.title)}" loading="lazy">
                <div class="keluarga-photo-zoom-hint">
                  <i class="mbri-search mbr-iconfont"></i>
                  <span>Perbesar Foto</span>
                </div>
              </div>
            ` : `
              <div class="keluarga-card-photo-wrap" ${item.detailUrl ? `onclick="window.open('${encodeURI(item.detailUrl)}', '_blank')"` : ''} title="Klik untuk melihat biodata">
                <div class="keluarga-photo-placeholder">
                  <i class="mbri-user mbr-iconfont"></i>
                  <span>(Foto Belum Tersedia)</span>
                </div>
              </div>
            `}

            <div class="keluarga-card-body">
              <h3 class="keluarga-card-name">${escapeHtml(item.title)}</h3>
              
              <div class="keluarga-info-row">
                <span class="keluarga-info-lbl">Hubungan:</span>
                <span class="keluarga-info-val" style="font-weight: 700; color: #781c1c;">${escapeHtml(item.role || item.category || '-')}</span>
              </div>

              ${item.spouse ? `
                <div class="keluarga-info-row">
                  <span class="keluarga-info-lbl">${escapeHtml(item.spouseLabel || 'Pasangan')}:</span>
                  <span class="keluarga-info-val">${escapeHtml(item.spouse)}</span>
                </div>
              ` : ''}

              <div class="keluarga-info-row">
                <span class="keluarga-info-lbl">Tahun Lahir:</span>
                <span class="keluarga-info-val">${escapeHtml(item.birthYear || '-')}</span>
              </div>

              <div class="keluarga-info-row">
                <span class="keluarga-info-lbl">Tahun Wafat:</span>
                <span class="keluarga-info-val">${escapeHtml(item.deathYear || '-')}</span>
              </div>

              <div class="keluarga-info-row">
                <span class="keluarga-info-lbl">Nama Anak:</span>
                <div class="keluarga-info-val">${childrenHtml}</div>
              </div>

              <div class="keluarga-card-actions">
                ${item.detailUrl ? `
                  <a href="${encodeURI(item.detailUrl)}" target="_blank" class="keluarga-btn-primary">
                    <i class="mbri-file mbr-iconfont" style="font-size: 0.9rem;"></i>
                    <span>Lihat Biodata Lengkap</span>
                  </a>
                ` : ''}
                ${hasPhoto ? `
                  <button type="button" class="keluarga-btn-secondary" data-member-idx="${originalIdx}" title="Perbesar Foto">
                    <i class="mbri-photos mbr-iconfont"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    });

    albumsGridEl.innerHTML = html;

    // Attach click events to photo wrap and secondary button
    albumsGridEl.querySelectorAll('[data-member-idx]').forEach(el => {
      el.addEventListener('click', function (e) {
        if (e.target.closest('a')) return;
        const idx = parseInt(this.getAttribute('data-member-idx'), 10);
        openLightboxForMember(idx);
      });
    });
  }

  function getMembersWithPhotos() {
    return KELUARGA_ALBUMS.filter(a => a.cover && a.photos && a.photos.length > 0);
  }

  function openLightboxForMember(memberIdx) {
    if (!KELUARGA_ALBUMS || memberIdx < 0 || memberIdx >= KELUARGA_ALBUMS.length) return;
    const member = KELUARGA_ALBUMS[memberIdx];
    if (!member || !member.cover) return;

    currentAlbumIndex = memberIdx;
    currentPhotoIndex = 0;
    openLightbox(0);
  }

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
    const album = KELUARGA_ALBUMS[currentAlbumIndex];
    if (!album || !album.photos || !album.photos.length) return;

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

    const roleTag = album.role ? `[${album.role}] ` : '';
    if (lbInfoEl) {
      lbInfoEl.innerHTML = `<strong>${escapeHtml(roleTag + album.title)}</strong> ${album.period && album.period !== '-' ? '(' + escapeHtml(album.period) + ')' : ''}`;
    }

    if (lbCounterEl) {
      lbCounterEl.textContent = `${album.role || album.category || 'Keluarga'} - ${escapeHtml(album.title)}`;
    }
  }

  function nextPhoto() {
    const photoMembers = getMembersWithPhotos();
    if (!photoMembers.length) return;
    const currentObj = KELUARGA_ALBUMS[currentAlbumIndex];
    let photoIdx = photoMembers.findIndex(m => m.id === currentObj.id);
    photoIdx = (photoIdx + 1) % photoMembers.length;
    const nextMember = photoMembers[photoIdx];
    currentAlbumIndex = KELUARGA_ALBUMS.findIndex(m => m.id === nextMember.id);
    currentPhotoIndex = 0;
    updateLightboxImage();
  }

  function prevPhoto() {
    const photoMembers = getMembersWithPhotos();
    if (!photoMembers.length) return;
    const currentObj = KELUARGA_ALBUMS[currentAlbumIndex];
    let photoIdx = photoMembers.findIndex(m => m.id === currentObj.id);
    photoIdx = (photoIdx - 1 + photoMembers.length) % photoMembers.length;
    const prevMember = photoMembers[photoIdx];
    currentAlbumIndex = KELUARGA_ALBUMS.findIndex(m => m.id === prevMember.id);
    currentPhotoIndex = 0;
    updateLightboxImage();
  }

  function initLightboxEvents() {
    const closeBtn = document.getElementById('keluarga-lb-close');
    const prevBtn = document.getElementById('keluarga-lb-prev');
    const nextBtn = document.getElementById('keluarga-lb-next');

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', function (e) { e.stopPropagation(); prevPhoto(); });
    if (nextBtn) nextBtn.addEventListener('click', function (e) { e.stopPropagation(); nextPhoto(); });

    if (lightboxEl) {
      lightboxEl.addEventListener('click', function (e) {
        if (e.target === lightboxEl || e.target.classList.contains('keluarga-lb-content')) {
          closeLightbox();
        }
      });
    }

    document.addEventListener('keydown', function (e) {
      if (!lightboxEl || !lightboxEl.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    });

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

  window.KeluargaGallery = {
    openMember: openLightboxForMember
  };

})();
