/* ============================================================
   Drawer + Markdown renderer — Dashboard Mat. 31.973
   ============================================================ */

/* ---------- Mini Markdown renderer (suficiente p/ as peças) ---------- */
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function renderInline(s) {
  // bold **x**, italic *x*, code `x`, link [x](y)
  s = s.replace(/`([^`]+)`/g, (_, x) => `<code>${x}</code>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, (_, x) => `<strong>${x}</strong>`);
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, (_, p, x) => `${p}<em>${x}</em>`);
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, h) => `<a href="${h}" target="_blank" rel="noopener">${t}</a>`);
  return s;
}
function renderMarkdown(md) {
  const lines = md.split('\n');
  const out = [];
  let inTable = false, tableRows = [], tableHeader = null, tableAlign = [];
  let inList = false, listType = null;
  let inPara = false, paraBuf = [];
  let inBlockquote = false, bqBuf = [];

  const flushPara = () => {
    if (paraBuf.length) {
      out.push(`<p>${renderInline(paraBuf.join(' '))}</p>`);
      paraBuf = [];
    }
    inPara = false;
  };
  const flushList = () => {
    if (inList) { out.push(`</${listType}>`); inList = false; listType = null; }
  };
  const flushTable = () => {
    if (!inTable) return;
    let html = '<table>';
    if (tableHeader) {
      html += '<thead><tr>';
      tableHeader.forEach(c => html += `<th>${renderInline(c.trim())}</th>`);
      html += '</tr></thead>';
    }
    html += '<tbody>';
    tableRows.forEach(row => {
      html += '<tr>';
      row.forEach(c => html += `<td>${renderInline(c.trim())}</td>`);
      html += '</tr>';
    });
    html += '</tbody></table>';
    out.push(html);
    inTable = false; tableRows = []; tableHeader = null; tableAlign = [];
  };
  const flushBq = () => {
    if (inBlockquote) {
      out.push(`<blockquote>${renderInline(bqBuf.join(' '))}</blockquote>`);
      bqBuf = []; inBlockquote = false;
    }
  };
  const flushAll = () => { flushPara(); flushList(); flushTable(); flushBq(); };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.replace(/\s+$/, '');

    // empty line
    if (!line.trim()) { flushAll(); continue; }

    // hr
    if (/^---+\s*$/.test(line)) { flushAll(); out.push('<hr>'); continue; }

    // headings
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { flushAll(); out.push(`<h${h[1].length}>${renderInline(h[2])}</h${h[1].length}>`); continue; }

    // table — line starts and contains |
    if (line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1);
      // separator row?
      const isSep = cells.every(c => /^\s*:?-+:?\s*$/.test(c));
      if (isSep) { /* ignore align */ continue; }
      if (!inTable) {
        flushPara(); flushList(); flushBq();
        inTable = true; tableHeader = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) { flushTable(); }

    // blockquote
    if (line.startsWith('>')) {
      flushPara(); flushList(); flushTable();
      inBlockquote = true;
      bqBuf.push(line.replace(/^>\s?/, ''));
      continue;
    } else if (inBlockquote) { flushBq(); }

    // unordered list
    const ul = line.match(/^[-*]\s+(.*)$/);
    if (ul) {
      flushPara(); flushTable(); flushBq();
      if (!inList || listType !== 'ul') { flushList(); out.push('<ul>'); inList = true; listType = 'ul'; }
      out.push(`<li>${renderInline(ul[1])}</li>`);
      continue;
    }
    // ordered list
    const ol = line.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      flushPara(); flushTable(); flushBq();
      if (!inList || listType !== 'ol') { flushList(); out.push('<ol>'); inList = true; listType = 'ol'; }
      out.push(`<li>${renderInline(ol[1])}</li>`);
      continue;
    } else if (inList) {
      // continued paragraph in list? simple: close list
      flushList();
    }

    // paragraph
    inPara = true;
    paraBuf.push(line);
  }
  flushAll();
  return out.join('\n');
}

/* ---------- Drawer ---------- */
const drawerHost = document.createElement('div');
drawerHost.innerHTML = `
  <div class="drawer-backdrop" id="drawerBackdrop"></div>
  <aside class="drawer" id="drawerEl" role="dialog" aria-hidden="true">
    <header class="drawer-head">
      <div>
        <div class="dh-eyebrow" id="dhEyebrow"></div>
        <h2 id="dhTitle"></h2>
        <div class="dh-meta" id="dhMeta"></div>
      </div>
      <div class="dh-actions">
        <a class="dh-action" id="dhOpenFile" target="_blank" rel="noopener" style="display:none;">↗ Abrir arquivo</a>
        <button class="dh-close" id="dhClose" aria-label="Fechar">×</button>
      </div>
    </header>
    <div class="drawer-body" id="drawerBody"></div>
  </aside>
`;
document.body.appendChild(drawerHost);

const $ = (id) => document.getElementById(id);
function openDrawer({ eyebrow, title, meta, file, body }) {
  $('dhEyebrow').textContent = eyebrow || '';
  $('dhTitle').textContent = title || '';
  $('dhMeta').textContent = meta || '';
  const openLink = $('dhOpenFile');
  if (file) {
    openLink.href = file;
    openLink.style.display = 'inline-flex';
  } else {
    openLink.style.display = 'none';
  }
  $('drawerBody').innerHTML = body || '';
  $('drawerBody').scrollTop = 0;
  $('drawerEl').classList.add('open');
  $('drawerBackdrop').classList.add('open');
  $('drawerEl').setAttribute('aria-hidden', 'false');
}
function closeDrawer() {
  $('drawerEl').classList.remove('open');
  $('drawerBackdrop').classList.remove('open');
  $('drawerEl').setAttribute('aria-hidden', 'true');
}
$('dhClose').addEventListener('click', closeDrawer);
$('drawerBackdrop').addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

/* ---------- Carregamento de markdown remoto ---------- */
async function loadMarkdown(path) {
  try {
    const r = await fetch(path);
    if (!r.ok) return `<p><em>Erro ao carregar: HTTP ${r.status}</em></p>`;
    const txt = await r.text();
    return renderMarkdown(txt);
  } catch (e) {
    return `<p><em>Erro ao carregar: ${escapeHtml(String(e))}</em></p>`;
  }
}

/* ---------- Conteúdo de cada item da Seção 8 ---------- */
window.SECTION8_CONTENT = {
  /* ===== PRONTO ===== */
  'doc-a': {
    eyebrow: 'PRONTO · Documento A',
    title: 'Diagnóstico Técnico-Documental',
    meta: 'v3 · 28/04 · peça principal sob RT CAU-PE A88.162-7',
    body: `
<div class="info-block">
  <h5>Status</h5>
  <p>Conteúdo consolidado nas Seções 2, 3 e 4 deste dashboard. A versão final integrada será exportada como PDF/DOCX para encaminhamento à Colorado.</p>
</div>
<h3>Estrutura do Documento A</h3>
<ol>
  <li>Sumário executivo (4 achados que importam mais)</li>
  <li>Cadeia dominial reconstituída — 12.680 → AV-10 (1973) → AV-11..AV-29 (lotes) → 31.973 (R-1) → R04 pretendida</li>
  <li>Diagnóstico técnico do erro topológico V28→V29 (AV-10 atravessa Lotes 18 e 19 que ela mesma criou)</li>
  <li>Levantamento físico AG (15/08/2025) — 2.268 pontos, ortomosaicos Pix4D, ~6.609 m de cercas/muros georreferenciados</li>
  <li>Comparação 32 vértices Mat. 31.973 vs cercas físicas — 31 de 32 vértices fora da tolerância NBR (24 cm)</li>
  <li>Polígono R04 pretendido — 57 vértices, 104.956,92 m², contorna corretamente os 19 lotes</li>
  <li>Confrontantes — 7 partes formais identificadas, situação de cada</li>
  <li>Atos saneadores α a θ recomendados antes do despacho</li>
</ol>
<h3>Fundamentação técnica</h3>
<ul>
  <li>Lei 6.015/1973, art. 213, II e §13 (Lei 14.382/2022)</li>
  <li>Provimento CNJ 195/2025, arts. 440-AR e 440-AX</li>
  <li>NBR 17.047:2022, arts. 4.2, 6.4.4, 7-d, 9.4</li>
  <li>NBR 13.133:2021, art. 5.5.1.2</li>
</ul>
`
  },

  'achado-sad69': {
    eyebrow: 'PRONTO · Achado SAD69',
    title: 'Achado SAD69 — Mat. 31.732',
    meta: '28/04 · 4 fontes independentes · Δ 59,24 m a sudoeste',
    file: 'uploads/Achado_SAD69_Mat31732_28042026.html',
    body: `
<div class="info-block">
  <h5>Resumo</h5>
  <p>A certidão da Mat. 31.732 (CNM 073809.2.0031732-92) <strong>omite o sistema geodésico de referência</strong>. O comportamento das coordenadas é compatível com SAD69 não declarado — demonstrável por quatro evidências independentes que convergem.</p>
</div>

<h3>Δ medido</h3>
<table>
  <thead><tr><th>Eixo</th><th>Δ metros</th><th>Δ graus (lat −8,42°)</th></tr></thead>
  <tbody>
    <tr><td>Longitude (E→O)</td><td>−37,74 m</td><td>−0,000343°</td></tr>
    <tr><td>Latitude (N→S)</td><td>−45,67 m</td><td>−0,000413°</td></tr>
    <tr><td><strong>Resultante</strong></td><td><strong>59,24 m a SO</strong></td><td>—</td></tr>
  </tbody>
</table>

<h3>Quatro fontes independentes (convergência)</h3>
<ol>
  <li><strong>Mat. 29.205</strong> — registro anterior do mesmo terreno (mesmas coordenadas em formato declarado SAD69)</li>
  <li><strong>Cerca norte AG GNSS (15/08/2025)</strong> — divergência de 1,1 m vs >14 m no datum bruto</li>
  <li><strong>Ortofoto Esri World Imagery</strong> — sobreposição visual sobre cerca física confirma deslocamento</li>
  <li><strong>R04 vs Mat. 31.732</strong> — sobreposição cai de 5.872,53 m² (datum bruto) para <strong>0 m²</strong> reprojetando para SIRGAS</li>
</ol>

<h3>Implicação registral</h3>
<p>A Mat. 31.732 <strong>não se sobrepõe geometricamente</strong> ao limite pretendido R04 da Mat. 31.973 — não há controvérsia material com essa confrontante. As inconsistências internas da 31.732 (datum não declarado + erros materiais V4→V5 e V15→V16 que concentram 99,92% do erro de fechamento) são <strong>matéria própria</strong> da Mat. 31.732 e devem ser sanadas pela Colarcoverde 1 em procedimento próprio.</p>

<p><em>Clique "Abrir arquivo" acima para ver a peça HTML completa do achado.</em></p>
`
  },

  'tabela-coords-31732': {
    eyebrow: 'PRONTO · Tabela auditável',
    title: 'Tabela de coordenadas Mat. 31.732',
    meta: '16 vértices · sexagesimal + decimal + UTM SIRGAS',
    file: 'uploads/Tabela_Coordenadas_Mat31732_28042026.html',
    body: `
<div class="info-block">
  <h5>O que é</h5>
  <p>Auditoria documental dos 16 vértices declarados na certidão CNM 073809.2.0031732-92, em três formatos paralelos: <strong>sexagesimal (como na certidão), decimal e UTM SIRGAS 2000</strong>, com a reprojeção SAD69→SIRGAS aplicada.</p>
</div>

<h3>Fontes dos dados</h3>
<ul>
  <li><code>uploads/tabela_31732_completa.csv</code> — 16 vértices declarados</li>
  <li><code>uploads/vertices_mat31732_original_e_sad69_para_sirgas.csv</code> — coordenadas reprojetadas (PyProj, EPSG:4618 → 4674)</li>
  <li><code>uploads/mat_31732_REEXTRAIDA_28042026.json</code> — extração canônica</li>
</ul>

<p><em>Clique "Abrir arquivo" acima para ver a tabela HTML interativa.</em></p>
`
  },

  'recalculo-shoelace': {
    eyebrow: 'PRONTO · Recálculo geométrico',
    title: 'Recálculo shoelace — Mat. 31.973 e R04',
    meta: 'Δ R-1: +18,51 % · Δ R04: −0,48 %',
    body: `
<div class="info-block">
  <h5>Método</h5>
  <p>Recálculo da área das poligonais por algoritmo de Shoelace (Gauss) sobre as coordenadas UTM declaradas no memorial, comparando ao valor de área textualmente declarado na mesma peça.</p>
</div>

<h3>Resultados</h3>
<table>
  <thead><tr><th>Polígono</th><th>Área declarada</th><th>Área shoelace</th><th>Δ</th></tr></thead>
  <tbody>
    <tr><td>Mat. 31.973 (R-1, 32 vért)</td><td>87.090,25 m²</td><td>103.218,74 m²</td><td><strong>+18,51 %</strong></td></tr>
    <tr><td>R04 pretendido (57 vért)</td><td>104.956,92 m²</td><td>104.453,83 m²</td><td>−0,48 %</td></tr>
  </tbody>
</table>

<h3>Leitura</h3>
<p>O Δ +18,51% da Mat. 31.973 vigente é <strong>evidência aritmética independente</strong> da incompatibilidade entre o memorial textual e o polígono que ele descreve. O R04 fecha dentro da tolerância NBR 17.047 (24 cm). Esse desvio é uma das três pernas da prova de erro material exigida pelo art. 213 §13 LRP.</p>
`
  },

  'av-19-poligonos': {
    eyebrow: 'PRONTO · 19 lotes desmembrados',
    title: 'Polígonos AV-11 a AV-29 (lotes desmembrados)',
    meta: '21.419,50 m² total · Δ −0,032 % vs declarado · 19 lotes',
    body: `
<div class="info-block">
  <h5>O que é</h5>
  <p>Reconstituição geométrica dos 19 lotes desmembrados da Mat. 12.680 pelo mesmo ato AV-10 que criou a Área Remanescente (Mat. 31.973). Cada lote tem sua própria averbação (AV-11 a AV-29) na Mat. 12.680, com memorial textual e área declarada.</p>
</div>

<h3>Síntese</h3>
<table>
  <thead><tr><th>Métrica</th><th>Valor</th></tr></thead>
  <tbody>
    <tr><td>Total de lotes</td><td>19</td></tr>
    <tr><td>Soma das áreas declaradas</td><td>21.426,32 m²</td></tr>
    <tr><td>Soma shoelace AG</td><td>21.419,50 m²</td></tr>
    <tr><td>Δ</td><td>−0,032 %</td></tr>
  </tbody>
</table>

<h3>Implicação registral</h3>
<p>Os 19 polígonos fecham aritmeticamente dentro da tolerância NBR (≪ 24 cm), comprovando integridade interna do desmembramento. O <strong>erro topológico está exclusivamente no memorial da Área Remanescente</strong> da AV-10/12.680 — que descreve perimetralmente <strong>através</strong> dos lotes que ela mesma desmembrou (atravessa V28→V29 sobre os Lotes 18 e 19).</p>

<p>Esta é a base da fundamentação NBR 17.047 art. 7-d (tratamento de erro topológico) — o R04 contorna corretamente os lotes.</p>
`
  },

  'memorando-ag-bruno': {
    eyebrow: 'PRONTO · Interface técnica',
    title: 'Memorando AG ↔ Bruno Macedo',
    meta: 'v2 · 28/04 · delimitação de RT entre as peças',
    file: 'uploads/MEMORANDO_INTERFACE_AG_BRUNO_v2_28042026.md',
    md: 'uploads/MEMORANDO_INTERFACE_AG_BRUNO_v2_28042026.md',
  },

  'ficha-prova': {
    eyebrow: 'PRONTO · Peça executiva',
    title: 'Ficha Técnica de Prova',
    meta: 'v2 · 28/04 · 8 atos saneadores recomendados',
    file: 'uploads/FICHA_TECNICA_PROVA_REUNIAO_v2_28042026.md',
    md: 'uploads/FICHA_TECNICA_PROVA_REUNIAO_v2_28042026.md',
  },

  'parecer-normativo': {
    eyebrow: 'PRONTO · Parecer Técnico',
    title: 'Parecer Técnico de Fundamentação Normativa',
    meta: 'Lei 6.015/73 + Prov. CNJ 195/2025 + NBR 17.047 + NBR 13.133',
    file: 'uploads/PARECER_TECNICO_FUNDAMENTACAO_NORMATIVA_28042026.md',
    md: 'uploads/PARECER_TECNICO_FUNDAMENTACAO_NORMATIVA_28042026.md',
  },

  'carta-apresentacao': {
    eyebrow: 'PRONTO · Carta de envio',
    title: 'Carta de Apresentação ao destinatário',
    meta: 'v4 · 28/04 · para Ricardo Rocha + Pedro Ezequiel',
    file: 'uploads/CARTA_APRESENTACAO_PEDRO_RICARDO_v4_28042026.md',
    md: 'uploads/CARTA_APRESENTACAO_PEDRO_RICARDO_v4_28042026.md',
  },

  'mapa-satelite': {
    eyebrow: 'PRONTO · Mapa interativo',
    title: 'Mapa R04 × cercas AG (satélite)',
    meta: 'HTML · sessão geométrica · sobre ortofoto Esri',
    file: 'uploads/MAPA_SATELITE_HIPOTESE_SAD69.html',
    body: `
<div class="info-block">
  <h5>Conteúdo</h5>
  <p>Mapa interativo Leaflet sobre Esri World Imagery mostrando a sobreposição do polígono Mat. 31.732 (na hipótese SAD69 declarado vs reprojetado para SIRGAS) com o R04 pretendido e as cercas físicas levantadas pela AG em campo.</p>
</div>

<h3>Camadas visíveis</h3>
<ul>
  <li>Polígono Mat. 31.732 — coordenadas brutas (presumido SAD69 não declarado)</li>
  <li>Polígono Mat. 31.732 — reprojetado SAD69→SIRGAS</li>
  <li>R04 pretendido (57 vértices)</li>
  <li>Cercas/muros físicos AG (15/08/2025)</li>
  <li>Mat. 29.205 (registro anterior do mesmo terreno)</li>
</ul>

<p><em>Clique "Abrir arquivo" acima para abrir o mapa em nova aba.</em></p>
`
  },

  'mapa-vertices-nbr': {
    eyebrow: 'PRONTO · Mapa de tolerância',
    title: 'Mapa 32 vértices Mat. 31.973 × tolerância NBR',
    meta: 'PNG · 31 de 32 vértices fora dos 24 cm',
    file: 'uploads/MAPA_1_situacao_atual.png',
    body: `
<div class="info-block">
  <h5>Conteúdo</h5>
  <p>Plotagem dos 32 vértices da Mat. 31.973 vigente sobre o levantamento físico AG, com círculos de raio 24 cm (tolerância NBR 17.047 art. 6.4.4) marcando cada vértice e indicação da divisa física mais próxima.</p>
</div>
<p><strong>Resultado:</strong> 31 dos 32 vértices estão a mais de 1 m da divisa física mais próxima (média ≈ 5 m), distância 20× superior à tolerância normativa.</p>
<p><em>Clique "Abrir arquivo" acima para abrir a imagem em nova aba.</em></p>
`
  },

  'mapa-v28-v29': {
    eyebrow: 'PRONTO · Mapa de evidência',
    title: 'Mapa V28→V29 atravessando Lotes 18 e 19',
    meta: 'PNG · evidência B do erro topológico AV-10',
    file: 'uploads/MAPA_3_triplo_confronto.png',
    body: `
<div class="info-block">
  <h5>Conteúdo</h5>
  <p>Sobreposição do segmento V28→V29 do memorial da Mat. 31.973 vigente (AV-10/12.680) sobre os polígonos dos Lotes 18 e 19 desmembrados pelo mesmo ato AV-10. O segmento da divisa externa <strong>atravessa fisicamente</strong> os lotes que ela mesma criou.</p>
</div>
<p>Esta é a evidência cartorial direta do erro topológico que a retificação R04 corrige por contorno correto, conforme NBR 17.047 art. 7-d.</p>
<p><em>Clique "Abrir arquivo" acima para abrir a imagem em nova aba.</em></p>
`
  },

  'jsons-auditaveis': {
    eyebrow: 'PRONTO · Cadeia de custódia',
    title: '5 JSONs canônicos auditáveis',
    meta: 'cadeia de custódia íntegra · base da reprodutibilidade',
    body: `
<div class="info-block">
  <h5>O que são</h5>
  <p>Arquivos JSON que congelam, em formato auditável e parseável, cada extração ou recálculo realizado pela AG na sessão geométrica de 28/04. Garantem que qualquer revisor (Bruno, RGI, perito futuro) possa reproduzir os números do dashboard a partir das coordenadas brutas.</p>
</div>

<ul class="file-list">
  <li>
    <a href="uploads/analise_final_28042026.json" target="_blank" rel="noopener">analise_final_28042026.json</a>
    <span class="fl-meta">síntese final dos achados geométricos</span>
  </li>
  <li>
    <a href="uploads/analise_sad69_28042026.json" target="_blank" rel="noopener">analise_sad69_28042026.json</a>
    <span class="fl-meta">cálculo da hipótese SAD69 não declarado</span>
  </li>
  <li>
    <a href="uploads/extracoes_DXF_28042026.json" target="_blank" rel="noopener">extracoes_DXF_28042026.json</a>
    <span class="fl-meta">extração de polígonos do DWG AG REV01</span>
  </li>
  <li>
    <a href="uploads/mat_31732_REEXTRAIDA_28042026.json" target="_blank" rel="noopener">mat_31732_REEXTRAIDA_28042026.json</a>
    <span class="fl-meta">re-extração das coordenadas da certidão 31.732</span>
  </li>
  <li>
    <a href="uploads/resultado_R04_DEFINITIVO_28042026.json" target="_blank" rel="noopener">resultado_R04_DEFINITIVO_28042026.json</a>
    <span class="fl-meta">polígono R04 final (57 vértices)</span>
  </li>
  <li>
    <a href="uploads/tabela_31732_completa.json" target="_blank" rel="noopener">tabela_31732_completa.json</a>
    <span class="fl-meta">16 vértices da Mat. 31.732 — formato canônico</span>
  </li>
</ul>
`
  },

  'diagnostico-area-31732': {
    eyebrow: 'PRONTO · Diagnóstico de área',
    title: 'Diagnóstico de área Mat. 31.732 (v2)',
    meta: 'reconstrução por 2 métodos · 2 trechos explicam 99,92% do erro',
    file: 'uploads/Diagnostico_Area_Mat31732_v2_28042026.html',
    body: `
<div class="info-block">
  <h5>Achado principal</h5>
  <p>O memorial cartorial da Mat. 31.732 não é "intrinsecamente errado". O profissional que elaborou o cálculo original chegou em poligonal coerente com a área declarada (93.841 m²). Os erros foram introduzidos <strong>na transcrição</strong> dos azimutes para o texto narrativo, em <strong>4 trechos identificáveis</strong> — sendo 2 que dominam 99,92% do erro de fechamento.</p>
</div>

<h3>Quatro valores de área para o mesmo imóvel</h3>
<table>
  <thead><tr><th>Reconstrução</th><th>Área</th><th>Δ vs declarada</th></tr></thead>
  <tbody>
    <tr><td>Declarada na certidão</td><td><strong>93.841,00 m²</strong></td><td>— (referência)</td></tr>
    <tr><td>Método A — coordenadas lat/long → UTM</td><td>89.803,56 m²</td><td>−4.037,44 m² (−4,30%)</td></tr>
    <tr><td>Método B — azimute geodésico + distância (16 trechos)</td><td>87.234,13 m²</td><td>−6.606,87 m² (−7,04%)</td></tr>
    <tr><td><strong>Método C — com 2 trechos corrigidos (V4→V5 e V15→V16)</strong></td><td><strong>93.866,26 m²</strong></td><td><strong>+25,26 m² (+0,03%)</strong></td></tr>
  </tbody>
</table>

<h3>Os 2 trechos dominantes</h3>
<ul>
  <li><strong>V4→V5</strong> — divisa sul, confrontante <em>Fazenda Malhada Grande</em>. Az. declarado 170°06'28"; calculado 171°06'29". <strong>Diferença de exatamente 1°</strong>. Padrão compatível com erro de digitação de um dígito.</li>
  <li><strong>V15→V16</strong> — divisa norte-leste, confrontante <em>Fagner Barbosa</em>. Az. declarado 93°14'04"; calculado 3°13'37". <strong>Diferença de exatamente 90°</strong>. Padrão compatível com erro de quadrante na transcrição (soma indevida de 90° entre orientação CAD e azimute geodésico).</li>
</ul>

<h3>4 trechos com erros menores compensatórios</h3>
<p>V7→V8, V8→V9, V10→V11 e V11→V12 deslocam vértices internos sem afetar o perímetro fechado ou a área — os erros adjacentes se cancelam mutuamente na propagação sequencial.</p>

<h3>Solução técnica</h3>
<p>Os erros são <strong>materiais de transcrição</strong>, não de levantamento. Comportam <strong>averbação retificadora pontual dos 4 trechos identificados</strong> — não exigem retificação registral integral da Mat. 31.732. Esta interpretação preserva e fortalece a análise anterior: a inconsistência interna permanece comprovada, mas agora tem solução técnica clara em procedimento próprio da Colarcoverde 1.</p>

<p><em>Clique "Abrir arquivo" acima para ver a peça completa com tabela trecho-a-trecho e busca sistemática.</em></p>
`
  },

  /* ===== ATUALIZAR ===== */
  'upd-anexo-ii': {
    eyebrow: 'ATUALIZAR · Anexo II',
    title: 'Anexo II — Quadros Geométricos',
    meta: 'v2 · incorporar polígono SIRGAS oficial Mat. 31.732',
    file: 'uploads/DOCUMENTO_A_ANEXO_II_QUADROS_GEOMETRICOS_v2_28042026.md',
    body: `
<div class="info-block">
  <h5>Por que precisa atualizar</h5>
  <p>O Anexo II v2 atual ainda registra as coordenadas da Mat. 31.732 no formato bruto da certidão (sem datum declarado). Após o achado SAD69 de 28/04, a AG passou a dispor das coordenadas <strong>oficialmente reprojetadas para SIRGAS</strong> (PyProj, EPSG:4618→4674) e a confirmação de que a sobreposição com R04 = 0 m² é a referência correta.</p>
</div>

<h3>O que mudar</h3>
<ol>
  <li>Substituir, na subseção <strong>QII.1-quater</strong>, a tabela atual por uma nova com 3 colunas: certidão (sexagesimal) | decimal bruto | UTM SIRGAS reprojetado</li>
  <li>Adicionar nota técnica explicando o método de reprojeção (PyProj, transformação geocêntrica)</li>
  <li>Atualizar QII.6 com a nova métrica de sobreposição R04 × Mat. 31.732 = <strong>0 m²</strong> (substituir os 5.872 m² do datum bruto)</li>
  <li>Acrescentar QII.7 com a aritmética dos dois trechos com erro material (V4→V5 e V15→V16 concentram 99,92% do não-fechamento)</li>
</ol>

<h3>Insumos disponíveis</h3>
<ul>
  <li><code>uploads/vertices_mat31732_original_e_sad69_para_sirgas.csv</code></li>
  <li><code>uploads/area_2trechos_corrigidos.json</code></li>
  <li><code>uploads/consistencia_memorial_31732.json</code></li>
</ul>
`
  },

  'upd-doc-b': {
    eyebrow: 'ATUALIZAR · Documento B',
    title: 'Documento B — Esboço peça registral',
    meta: 'v2 · cláusula sobre confrontante leste sem sobreposição',
    file: 'uploads/DOCUMENTO_B_ESBOCO_PECA_REGISTRAL_v2_28042026.md',
    body: `
<div class="info-block">
  <h5>Por que precisa atualizar</h5>
  <p>O Documento B v2 atual descreve o confrontante leste pelo polígono bruto da Mat. 31.732. Com a confirmação da hipótese SAD69 (Cenário B do achado AG), o texto da cláusula sobre o confrontante leste deve passar a refletir <strong>inexistência de sobreposição com o R04</strong>.</p>
</div>

<h3>O que mudar</h3>
<ol>
  <li>Item 6 — Confrontante Leste: substituir referência ao polígono Mat. 31.732 bruto por "polígono Mat. 31.732 reprojetado SAD69→SIRGAS, conforme Achado AG 28/04"</li>
  <li>Acrescentar nota explicativa: "O comportamento geométrico das coordenadas declaradas na Mat. 31.732 é compatível com origem em SAD69 não declarado; reprojetadas para SIRGAS resultam em <strong>0 m²</strong> de sobreposição com o R04 ora pretendido"</li>
  <li>Vincular nota ao ato saneador <strong>θ</strong> da Ficha de Prova (nota técnica esclarecedora)</li>
</ol>
`
  },

  'upd-diagnostico-area': {
    eyebrow: 'ATUALIZAR · Diagnóstico R04',
    title: 'Diagnóstico de área R04 vs Mat. 31.973',
    meta: 'HTML · adicionar Mat. 31.732 SIRGAS como camada confrontante',
    file: 'uploads/Diagnostico_Area_Mat31732_v2_28042026.html',
    body: `
<div class="info-block">
  <h5>Por que precisa atualizar</h5>
  <p>O HTML do diagnóstico atualmente mostra apenas o limite atual e o R04 pretendido. Para conferir o cenário pós-achado SAD69, o usuário precisa visualizar simultaneamente o R04 e o polígono SIRGAS reprojetado da Mat. 31.732 — para confirmar visualmente o "0 m² de sobreposição".</p>
</div>

<h3>O que mudar</h3>
<ol>
  <li>Adicionar 4ª camada Leaflet: polígono Mat. 31.732 reprojetado SIRGAS</li>
  <li>Adicionar legenda separando o polígono bruto (cinza, transparente) do polígono reprojetado (azul AG, sólido)</li>
  <li>Adicionar nota no painel lateral linkando para o Achado SAD69</li>
</ol>
`
  },

  'upd-tabela-r04': {
    eyebrow: 'ATUALIZAR · Tabela R04',
    title: 'Tabela de coordenadas R04 (57 vértices)',
    meta: 'HTML · revalidar trecho leste contra 31.732 SIRGAS',
    body: `
<div class="info-block">
  <h5>Por que precisa atualizar</h5>
  <p>Os vértices V31 a V42 do R04 correspondem ao confrontante leste (Mat. 31.732). Convém revalidar essas coordenadas contra o polígono SIRGAS reprojetado da 31.732 para confirmar que a divisa pretendida não toca o polígono confrontante.</p>
</div>

<h3>O que mudar</h3>
<ol>
  <li>Adicionar coluna "distância ao polígono Mat. 31.732 SIRGAS" para os vértices V31..V42</li>
  <li>Adicionar célula de status (verde se distância > 24 cm, amarelo se 0–24 cm, vermelho se sobreposição)</li>
  <li>Não devem aparecer células vermelhas — esta é a confirmação visual do "0 m²"</li>
</ol>
`
  },

  'upd-mensagem-r05': {
    eyebrow: 'ATUALIZAR · Mensagem prévia',
    title: 'Mensagem prévia DWG R05 → Bruno',
    meta: 'v1 · acrescentar pedido de inclusão Mat. 31.732 SIRGAS no R06',
    body: `
<div class="info-block">
  <h5>Por que precisa atualizar</h5>
  <p>A mensagem prévia já encaminhada (27/04) tratou da planta duplicada no Model Space. Após o achado SAD69 do dia seguinte, convém complementar com pedido para que o R06 (próxima revisão do DWG) inclua o polígono Mat. 31.732 SIRGAS como referência da divisa leste.</p>
</div>

<h3>O que mudar</h3>
<ol>
  <li>Acrescentar parágrafo: "Solicito ainda que o R06 inclua, em camada de referência cartorial, o polígono Mat. 31.732 SIRGAS reprojetado conforme Achado AG 28/04, para confronto visual da divisa leste."</li>
  <li>Anexar arquivo CSV: <code>uploads/vertices_mat31732_original_e_sad69_para_sirgas.csv</code></li>
</ol>
`
  },

  'upd-nbr-resumo': {
    eyebrow: 'ATUALIZAR · NBR 17.047',
    title: 'NBR 17.047 — Resumo e aplicação',
    meta: 'v1 · referenciar artigo sobre datum declarado/presumido',
    body: `
<div class="info-block">
  <h5>Por que precisa atualizar</h5>
  <p>O Resumo NBR atual aplica os artigos 4.2, 6.4.4, 7-d e 9.4 ao caso da Mat. 31.973. A discussão completa do <strong>art. 4.2 (sistema geodésico)</strong> precisa ganhar uma sub-seção dedicada à Mat. 31.732 confrontante, explicando como a omissão do datum constitui não-conformidade documentada e como a reprojeção para SIRGAS é a forma técnica de saneá-la para fins de confronto registral.</p>
</div>

<h3>O que mudar</h3>
<ol>
  <li>Acrescentar item "4.2.bis — Aplicação ao confrontante Mat. 31.732"</li>
  <li>Citar o Achado SAD69 como evidência empírica</li>
  <li>Indicar que a reprojeção é matéria do procedimento próprio da Mat. 31.732 (não da 31.973)</li>
</ol>
`
  },

  /* ===== A PRODUZIR ===== */
  'prod-peca-memorial': {
    eyebrow: 'A PRODUZIR',
    title: 'Atualização da peça de retificação e do memorial',
    meta: 'Bruno + AG · incorporar atos saneadores e achados consolidados',
    body: `
<div class="info-block">
  <h5>Descrição</h5>
  <p>Atualização integrada da peça de retificação e do memorial descritivo R04, incorporando o cumprimento dos atos saneadores executados e os achados técnicos consolidados durante a investigação. A peça atualizada constitui a versão definitiva a ser submetida ao oficial registrador.</p>
</div>
<dl class="ato-grid">
  <dt>Responsáveis</dt><dd>Bruno Macedo (RT registral) + AG Topografia (RT CAU-PE A88.162-7)</dd>
  <dt>Insumos</dt><dd>R04 atual · atos saneadores executados · diagnóstico de área Mat. 31.732 (v2) · achado SAD69 · tabela de coordenadas reprojetadas · recálculo shoelace</dd>
  <dt>Entregáveis</dt><dd>(1) Peça de retificação atualizada · (2) Memorial descritivo R04 reformulado para protocolo</dd>
  <dt>Função no procedimento</dt><dd>Versão definitiva consolidada para protocolo no RGI — peça final integrando saneamentos e diagnóstico técnico</dd>
</dl>
`
  },

  'prod-laudo-pos': {
    eyebrow: 'A PRODUZIR',
    title: 'Laudo técnico pós atos saneadores',
    meta: 'AG · consolidação técnica após cumprimento dos saneamentos',
    body: `
<div class="info-block">
  <h5>Descrição</h5>
  <p>Laudo técnico final, sob RT CAU, consolidando a posição técnica da AG após o cumprimento dos atos saneadores. Documenta — para o tabelião — a consistência geométrica e registral do R04, a inexistência de sobreposição material com a Mat. 31.732 (Cenário B), e a fundamentação técnica completa para o despacho favorável.</p>
</div>
<dl class="ato-grid">
  <dt>Responsável</dt><dd>AG Topografia e Construções — Aryanna Gonzaga (CAU-PE A88.162-7)</dd>
  <dt>Insumos</dt><dd>Atos saneadores executados · diagnóstico Mat. 31.732 (v2) · achado SAD69 · recálculo shoelace · tabela de coordenadas reprojetadas · sobreposição R04 = 0 m² (Cenário B)</dd>
  <dt>Entregável</dt><dd>Laudo técnico em PDF, sob RT CAU, consolidando o quadro técnico-registral final</dd>
  <dt>Função no procedimento</dt><dd>Peça técnica de fechamento — entrega ao tabelião o quadro consolidado pós-saneamento, com todos os achados e diligências documentados</dd>
</dl>
`
  },
};

/* ---------- Wire-up: torna cada item.status-item clicável ---------- */
function wireStatusItems() {
  document.querySelectorAll('.status-item[data-key]').forEach(el => {
    const key = el.dataset.key;
    const data = window.SECTION8_CONTENT[key];
    if (!data) return;
    el.classList.add('clickable');
    el.querySelector('.si-name')?.insertAdjacentHTML('beforeend', ' <span class="si-arrow">→</span>');
    el.addEventListener('click', async () => {
      let body = data.body || '';
      if (data.md && !data.body) {
        body = '<p><em>Carregando…</em></p>';
        openDrawer({ ...data, body });
        const rendered = await loadMarkdown(data.md);
        $('drawerBody').innerHTML = rendered;
      } else {
        openDrawer({ ...data, body });
      }
    });
  });
}
// Re-wire after status grids rendered (delay one tick after dashboard-app)
setTimeout(wireStatusItems, 50);
