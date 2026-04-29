/* ==========================================================================
   APP — Dashboard Colarcoverde 2 / Mat. 31.973
   ========================================================================== */

// proj4 — definir EPSG:31984 (SIRGAS 2000 / UTM 24S)
proj4.defs("EPSG:31984", "+proj=utm +zone=24 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
const utmToLatLon = ([e, n]) => {
  const [lon, lat] = proj4("EPSG:31984", "EPSG:4326", [e, n]);
  return [lat, lon];
};
const utmArrayToLatLon = arr => arr.map(utmToLatLon);

// =============================================================
// Countdown — Nota 271/2026, vencimento 06/05/2026
// =============================================================
(function countdown() {
  const target = new Date('2026-05-06T17:00:00-03:00');
  const today = new Date('2026-04-28T12:00:00-03:00');
  const diffMs = target - today;
  const days = Math.ceil(diffMs / (1000*60*60*24));
  document.getElementById('cdLine').innerHTML = `06/05/2026 — <b>${days} dias</b> a partir de hoje`;
})();

// =============================================================
// Sidebar — active state on scroll
// =============================================================
(function sidebarActive() {
  const links = document.querySelectorAll('#snav a');
  const sections = Array.from(links).map(a => document.querySelector(a.getAttribute('href')));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const id = e.target.id;
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + id));
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  sections.forEach(s => s && observer.observe(s));
})();

// =============================================================
// MAPA PRINCIPAL — lazy init quando entrar no viewport
// =============================================================
let mainMap = null;
const layerRegistry = {};
const LAYER_DEFS = [
  { id: 'matriz', name: 'Matriz-mãe Mat. 12.680 / AV-9', meta: '108.516,43 m² · 16 vértices', color: '#7a7a7a',
    type: 'polyline', dash: '6,4', initial: true,
    build: () => {
      // matriz aproximada a partir do envoltório dos pontos da 31.973 + lotes
      const env = POLY_31973_UTM.map(utmToLatLon);
      return L.polyline([...env, env[0]], { color: '#7a7a7a', weight: 2, dashArray: '6,4', opacity: 0.85 });
    }
  },
  { id: 'mat31973', name: 'Mat. 31.973 atual / R-1', meta: '87.090,25 m² declarado · 103.213,94 m² calc.', color: '#c8a96a',
    initial: true,
    build: () => L.polygon(POLY_31973_UTM.map(utmToLatLon), { color: '#8a6e35', weight: 2, fillColor: '#d6b87b', fillOpacity: 0.45 })
      .bindPopup('<div class="pop-title">Mat. 31.973 — R-1</div><div>87.090,25 m² declarado · 32 vértices</div><div class="pop-meta">Área recalculada (shoelace AG): 103.213,94 m² (+18,51%)</div>')
  },
  { id: 'r04', name: 'R04 pretendido / Bruno Macedo', meta: '104.956,92 m² · 57 vértices', color: '#1F3A5F',
    initial: true,
    build: () => L.polygon(POLY_R04_UTM.map(utmToLatLon), { color: '#1F3A5F', weight: 2.5, fillColor: '#2c5283', fillOpacity: 0.35 })
      .bindPopup('<div class="pop-title">R04 — retificação pretendida</div><div>104.956,92 m² · perímetro 2.018,86 m</div><div class="pop-meta">Recálculo AG: 104.450,54 m² (Δ −0,48%)</div>')
  },
  { id: 'mat31732', name: 'Mat. 31.732 / Colarcoverde 1 (confrontante)', meta: '93.841 m² · sem sobreposição com R04', color: '#c46b8d',
    initial: false,
    build: () => L.polygon(POLY_31732_LATLON, { color: '#8a3458', weight: 1.5, fillColor: '#e3a3bb', fillOpacity: 0.25, dashArray: '4,3' })
      .bindPopup('<div class="pop-title">Mat. 31.732 — Colarcoverde 1</div><div>Confrontante a Sul/Leste · anuência verde no R05</div><div class="pop-meta">Sem sobreposição material com a poligonal R04</div>')
  },
  { id: 'lotes', name: '19 lotes desmembrados (AV-11 a AV-29)', meta: '21.419,50 m² · DXF AG', color: '#C44545', initial: false,
    build: () => L.layerGroup(LOTES_DESMEMBRADOS.map((l,i) => {
      const av = 11 + i; // AV-11 a AV-29
      return L.polygon(l.pts.map(utmToLatLon), { color: '#C44545', weight: 1.2, fillColor: '#C44545', fillOpacity: 0.28 })
        .bindPopup(`<div class="pop-title">Lote ${i+1} (AV-${av})</div><div>${l.area.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})} m² · ${l.pts.length} vért</div><div class="pop-meta">Extraído do DXF AG_COLORADO · layer _ÁREAS SUBDIVIDIDAS</div>`);
    }))
  },
  { id: 'polAnterior', name: 'Poligonal anterior R-1 (Mat. 31.973)', meta: '32 vért · 103.214 m² · DXF Bruno R05', color: '#a83434', initial: false,
    build: () => L.polygon(POLY_ANTERIOR_R1_UTM.map(utmToLatLon), { color: '#a83434', weight: 1.5, fillColor: '#a83434', fillOpacity: 0.12, dashArray: '4,3' })
      .bindPopup('<div class="pop-title">Poligonal anterior R-1</div><div>32 vért · 103.214 m² (recálculo AG)</div><div class="pop-meta">Layer "POLIGONAL ANTERIOR - CHARLES" no DXF Bruno R05 · coincide com a Mat. 31.973 antes do R04</div>')
  },
  { id: 'cercas', name: 'Cercas AG (15/08/2025)', meta: '14 trechos · DXF AG_COLORADO', color: '#7a5a2a', initial: false,
    build: () => L.layerGroup(CERCAS_AG_UTM.map(line =>
      L.polyline(line.map(utmToLatLon), { color: '#7a5a2a', weight: 1.8, dashArray: '4,2' })))
  },
  { id: 'muros', name: 'Muros AG (15/08/2025)', meta: '31 trechos · DXF AG_COLORADO', color: '#444', initial: false,
    build: () => L.layerGroup(MUROS_AG_UTM.map(line =>
      L.polyline(line.map(utmToLatLon), { color: '#444', weight: 2 })))
  },
  { id: 'meiofio', name: 'Meio-fio AG (15/08/2025)', meta: '26 trechos · DXF AG_COLORADO', color: '#8a8a8a', initial: false,
    build: () => L.layerGroup(MEIOFIO_AG_UTM.map(line =>
      L.polyline(line.map(utmToLatLon), { color: '#8a8a8a', weight: 1.4, opacity: 0.8 })))
  },
  { id: 'gnss', name: '2.268 pontos brutos GNSS (cluster)', meta: 'simbólico', color: '#7BAB3E', initial: false,
    build: () => L.layerGroup(PONTOS_GNSS_UTM.map(p =>
      L.circleMarker(utmToLatLon(p), { radius: 1.5, color: '#7BAB3E', fillColor: '#7BAB3E', fillOpacity: 0.6, weight: 0 })))
  },
];

const MARKERS = [
  { name: "Severino → Jayme (Norte)", lat: -8.417847, lon: -37.074546, anuencia: "Sucessão dominial PENDENTE — ato saneador η", color: "#C44545" },
  { name: "R. Magalhães Porto (Leste superior)", lat: -8.418973, lon: -37.072848, anuencia: "Logradouro público municipal", color: "#D98841" },
  { name: "Mat. 27.539 (Leste)", lat: -8.419349, lon: -37.071249, anuencia: "Confrontante leste — incluído 28/04", color: "#A87CCF" },
  { name: "Tv. Vicente Gomes (Leste inferior)", lat: -8.419451, lon: -37.072153, anuencia: "Logradouro · ato saneador ζ", color: "#E8B23A" },
  { name: "Iarlley Cintra (Mat. 23.240) — Sul-leste", lat: -8.421249, lon: -37.073992, anuencia: "Anuência via gov.br no R05 · CPF 013.692.284-81", color: "#4F9F8E" },
  { name: "Cond. Olho D'Água (CNPJ 24.268.981) — Sul", lat: -8.421972, lon: -37.074358, anuencia: "Bloco de assinatura no R05 · Resp. Arthur L. F. Ramos", color: "#5A8FCC" },
  { name: "Colarcoverde 1 — Mat. 31.732 (Sudoeste)", lat: -8.420977, lon: -37.072529, anuencia: "CNPJ 63.542.167/0001-02 · sem sobreposição com R04 (Cenário B)", color: "#7BAB3E" },
  { name: "Av. Osvaldo Cruz — Oeste", lat: -8.421791, lon: -37.076553, anuencia: "Logradouro público municipal", color: "#B6843A" },
  { name: "Rodovia Luiz Gonzaga (BR-232) — Oeste", lat: -8.422425, lon: -37.076644, anuencia: "Rodovia federal · DNIT", color: "#7A5A2A" },
  { name: "Flávio Mendonça (CPF 858.649.864-53) — Norte (lotes desmembrados)", lat: -8.421249, lon: -37.075821, anuencia: "Bloco de assinatura no R05 · antigo proprietário (R-7/12.680)", color: "#8E6FB8" },
];

let basemapOSM, basemapEsri;

function initMainMap() {
  if (mainMap) return;
  mainMap = L.map('map', { center: MAP_CENTER, zoom: 17, scrollWheelZoom: false });

  basemapOSM = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19
  }).addTo(mainMap);
  basemapEsri = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri', maxZoom: 19
  });

  // Build layers
  const ctlHost = document.getElementById('layerControls');
  LAYER_DEFS.forEach(def => {
    const layer = def.build();
    layerRegistry[def.id] = layer;
    if (def.initial) layer.addTo(mainMap);

    const row = document.createElement('div');
    row.className = 'layer-row';
    row.innerHTML = `
      <label aria-label="${def.name}">
        <input type="checkbox" ${def.initial ? 'checked' : ''} data-layer="${def.id}">
        <span class="swatch" style="background:${def.color};"></span>
        <span>
          <div class="layer-name">${def.name}</div>
          <div class="layer-meta">${def.meta}</div>
        </span>
      </label>
    `;
    ctlHost.appendChild(row);
    row.querySelector('input').addEventListener('change', e => {
      if (e.target.checked) layer.addTo(mainMap);
      else mainMap.removeLayer(layer);
    });
  });

  // Markers
  const mLeg = document.getElementById('markerLegend');
  MARKERS.forEach(m => {
    const marker = L.circleMarker([m.lat, m.lon], {
      radius: 7, color: '#fff', weight: 2, fillColor: m.color, fillOpacity: 1
    }).addTo(mainMap);
    marker.bindPopup(`<div class="pop-title">${m.name}</div><div>${m.anuencia}</div>`);
    const row = document.createElement('div');
    row.innerHTML = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${m.color};margin-right:6px;vertical-align:middle;"></span>${m.name}`;
    mLeg.appendChild(row);
  });

  // Basemap toggle
  document.querySelectorAll('.basemap-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.basemap-toggle button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const which = btn.dataset.basemap;
      if (which === 'osm') {
        if (mainMap.hasLayer(basemapEsri)) mainMap.removeLayer(basemapEsri);
        if (!mainMap.hasLayer(basemapOSM)) basemapOSM.addTo(mainMap);
      } else {
        if (mainMap.hasLayer(basemapOSM)) mainMap.removeLayer(basemapOSM);
        if (!mainMap.hasLayer(basemapEsri)) basemapEsri.addTo(mainMap);
      }
    });
  });

  // Legend
  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = function() {
    const div = L.DomUtil.create('div');
    div.style.cssText = 'background:rgba(255,255,255,.95);padding:8px 10px;border-radius:6px;font-size:11px;font-family:ui-monospace,Menlo,monospace;box-shadow:0 2px 6px rgba(0,0,0,.15);line-height:1.5;';
    div.innerHTML = `<b style="color:#1F3A5F">SIRGAS 2000 / UTM 24S</b><br>
      <span style="display:inline-block;width:10px;height:10px;background:#d6b87b;margin-right:4px;"></span>Mat. 31.973 R-1<br>
      <span style="display:inline-block;width:10px;height:10px;background:#2c5283;margin-right:4px;"></span>R04 pretendido<br>
      <span style="display:inline-block;width:10px;height:10px;background:#C44545;margin-right:4px;"></span>Lotes 18/19 (AV-28/29)`;
    return div;
  };
  legend.addTo(mainMap);

  // Fit
  setTimeout(() => mainMap.invalidateSize(), 80);
  const bounds = L.latLngBounds([...POLY_31973_UTM.map(utmToLatLon), ...POLY_R04_UTM.map(utmToLatLon)]);
  mainMap.fitBounds(bounds, { padding: [30, 30] });
}

// Lazy init
new IntersectionObserver((entries, obs) => {
  entries.forEach(e => { if (e.isIntersecting) { initMainMap(); obs.disconnect(); }});
}, { rootMargin: '100px' }).observe(document.getElementById('s2'));

// =============================================================
// TIMELINE
// =============================================================
(function buildTimeline() {
  const host = document.getElementById('timeline');
  TIMELINE.forEach((n, i) => {
    const cls = n.crit ? 'critical' : (n.adopted ? 'adopted' : '');
    const el = document.createElement('div');
    el.className = `tl-node ${cls}`;
    el.innerHTML = `
      <div class="tl-date">${n.d}</div>
      <div class="tl-title">${n.t}</div>
      <div class="tl-body">${n.body}</div>
    `;
    el.addEventListener('click', () => el.classList.toggle('open'));
    host.appendChild(el);
  });
})();

// =============================================================
// FINDINGS
// =============================================================
(function buildFindings() {
  const host = document.getElementById('findings');
  FINDINGS.forEach((f, idx) => {
    const card = document.createElement('div');
    card.className = 'finding';
    let extra = '';
    if (f.bars) {
      const max = Math.max(...DIST_VERT.map(d => d[1]));
      extra = `<div class="bars" aria-label="Distância de cada vértice ao elemento físico mais próximo">
        <div style="font-size:11px;color:#6b6b6b;margin-bottom:6px;font-family:var(--mono);">Distância de cada vértice à divisa física mais próxima (m) — tolerância NBR 17047: 0,24 m</div>
        ${DIST_VERT.map(([v, d]) => {
          const pct = (d / max) * 100;
          const tol = d <= 0.24;
          return `<div class="bar-row">
            <span class="vlbl">${v}</span>
            <div class="btrack"><div class="bfill ${tol?'tol':''}" style="width:${Math.max(pct,1.5)}%;"></div></div>
            <span class="bvalue" style="color:${tol?'#4f7c1f':'#c44545'}">${d.toFixed(2)} m</span>
          </div>`;
        }).join('')}
      </div>`;
    }
    if (f.miniMap) {
      extra = `<div class="mini-map" id="miniMap${idx}"></div>`;
    }
    card.innerHTML = `
      <div class="head">
        <div class="label-letter">${f.letter}</div>
        <div style="flex:1;"><h3>${f.title}</h3></div>
        <div class="toggle">+</div>
      </div>
      <div class="body">${f.body}${extra}</div>
    `;
    card.querySelector('.head').addEventListener('click', () => {
      card.classList.toggle('open');
      card.querySelector('.toggle').textContent = card.classList.contains('open') ? '−' : '+';
      // init mini-map on first open
      if (f.miniMap && card.classList.contains('open')) {
        const id = `miniMap${idx}`;
        if (!card.dataset.mapInit) {
          const m = L.map(id, { center: MAP_CENTER, zoom: 18, zoomControl: false, attributionControl: false });
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m);
          L.polygon(POLY_31973_UTM.map(utmToLatLon), { color:'#8a6e35', weight:1.2, fillColor:'#d6b87b', fillOpacity:0.3 }).addTo(m);
          // segmento V28→V29 destacado
          const v28 = utmToLatLon([711733.17, 9068807.65]);
          const v29 = utmToLatLon([711897.80, 9068743.16]);
          L.polyline([v28, v29], { color:'#C44545', weight:4, opacity:0.95 }).addTo(m).bindTooltip('V28 → V29 · az 111°23\'30" · 176,81 m', { permanent: true, direction: 'top' });
          LOTES_DESMEMBRADOS.forEach(l => L.polygon(l.pts.map(utmToLatLon), { color: '#C44545', weight: 1, fillOpacity: 0.25 }).addTo(m));
          m.fitBounds(L.latLngBounds([v28, v29, ...POLY_31973_UTM.map(utmToLatLon)]), { padding: [10, 10] });
          card.dataset.mapInit = '1';
          setTimeout(() => m.invalidateSize(), 50);
        }
      }
    });
    host.appendChild(card);
  });
})();

// =============================================================
// SANEADORES
// =============================================================
(function buildSaneadores() {
  const tbody = document.querySelector('#actsTable tbody');
  function render(filter) {
    tbody.innerHTML = '';
    SANEADORES.forEach((s, idx) => {
      if (filter !== 'all' && s.quem !== filter) return;
      const cls = s.quem === 'AG' ? 'green' : (s.quem === 'Bruno' ? 'gray' : 'amber');
      const tr = document.createElement('tr');
      tr.dataset.idx = idx;
      tr.innerHTML = `
        <td><span class="greek">${s.g}</span></td>
        <td><strong>${s.titulo}</strong></td>
        <td style="font-size:12px;color:var(--ink-2);">${s.fund}</td>
        <td><span class="badge ${cls}">${s.quem}</span></td>
        <td style="text-align:right;color:var(--ink-3);font-family:var(--mono);">＋</td>
      `;
      tr.addEventListener('click', () => {
        const next = tr.nextElementSibling;
        if (next && next.classList.contains('detail-row')) {
          next.remove(); tr.classList.remove('expanded');
        } else {
          // close others
          tbody.querySelectorAll('.detail-row').forEach(r => r.remove());
          tbody.querySelectorAll('tr.expanded').forEach(r => r.classList.remove('expanded'));
          const drow = document.createElement('tr');
          drow.className = 'detail-row';
          drow.innerHTML = `<td colspan="5">${s.detalhe}</td>`;
          tr.classList.add('expanded');
          tr.after(drow);
        }
      });
      tbody.appendChild(tr);
    });
  }
  render('all');
  document.querySelectorAll('.filter-bar button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-bar button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(btn.dataset.f);
    });
  });
})();

// =============================================================
// CONFRONTANTES
// =============================================================
(function buildConfrontantes() {
  const list = document.getElementById('confList');
  CONFRONTANTES.forEach(c => {
    const colorMap = { verde: '#7BAB3E', amarelo: '#E8B23A', vermelho: '#C44545' };
    const row = document.createElement('div');
    row.className = 'conf-row';
    row.innerHTML = `
      <div class="conf-dot" style="background:${colorMap[c.anuencia]};"></div>
      <div style="flex:1;">
        <div class="conf-name">${c.name}</div>
        <div class="conf-meta">${c.side} · ${c.mat}${c.cpf?' · '+c.cpf:''}</div>
        <div style="font-size:12px;color:var(--ink-2);margin-top:4px;">${c.nota}</div>
      </div>
    `;
    list.appendChild(row);
  });

  // Mini map
  const lazyConf = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const m = L.map('miniMapConf', { center: MAP_CENTER, zoom: 16 });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(m);
      const r04latlon = POLY_R04_UTM.map(utmToLatLon);
      L.polygon(r04latlon, { color:'#1F3A5F', weight:2, fillColor:'#2c5283', fillOpacity:0.18 }).addTo(m);
      const colorMap = { verde: '#7BAB3E', amarelo: '#E8B23A', vermelho: '#C44545' };
      CONFRONTANTES.forEach(c => {
        const mk = L.circleMarker([c.lat, c.lon], {
          radius: 8, color: '#fff', weight: 2, fillColor: colorMap[c.anuencia], fillOpacity: 1
        }).addTo(m);
        mk.bindPopup(`<div class="pop-title">${c.name}</div><div>${c.nota}</div><div class="pop-meta">${c.side} · ${c.mat}</div>`);
      });
      const allPts = [...r04latlon, ...CONFRONTANTES.map(c => [c.lat, c.lon])];
      m.fitBounds(L.latLngBounds(allPts), { padding: [20, 20] });
      setTimeout(() => m.invalidateSize(), 80);
      obs.disconnect();
    });
  }, { rootMargin: '100px' });
  lazyConf.observe(document.getElementById('s6'));
})();

// =============================================================
// STATUS — Resposta à Nota 271/2026
// =============================================================
// =============================================================
// STATUS — Resposta à Nota 271/2026 (3 colunas)
// =============================================================
(function buildStatus() {
  const renderItem = (item) => {
    const el = document.createElement('div');
    el.className = 'status-item';
    if (item.key) el.dataset.key = item.key;
    const tag = item.greek
      ? `<span class="si-tag greek-tag">${item.greek}</span>`
      : '';
    el.innerHTML = `<div class="si-name">${tag}${item.name}</div><div class="si-meta">${item.meta}</div>`;
    return el;
  };
  const fill = (id, list) => {
    const host = document.getElementById(id);
    if (!host) return;
    list.forEach(it => host.appendChild(renderItem(it)));
  };
  fill('statusPronto', STATUS_PRONTO);
  fill('statusAtualizar', STATUS_ATUALIZAR);
  fill('statusProduzir', STATUS_PRODUZIR);
})();
