import './program-images.css';

const PROGRAM_LOGOS = {
  'Aeroplan': '/program-logos/aeroplan.svg',
  'Azul': '/program-logos/azul.svg',
  'Azul pelo Mundo': '/program-logos/azul-pelo-mundo.svg',
  'Iberia Plus': '/program-logos/iberia-plus.svg',
  'Latam': '/program-logos/latam.svg',
  'Smiles': '/program-logos/smiles.svg',
  'Verão Europeu': '/program-logos/verao-europeu.svg'
};

const normalize = value => String(value || '').trim().toLocaleLowerCase('pt-BR');
const lookup = new Map(Object.entries(PROGRAM_LOGOS).map(([name, src]) => [normalize(name), { name, src }]));

function decorateProgramCell(cell) {
  if (cell.dataset.programLogo === '1') return;
  const key = normalize(cell.textContent);
  const program = lookup.get(key);
  if (!program) return;
  const text = cell.textContent.trim();
  cell.dataset.programLogo = '1';
  cell.innerHTML = `<span class="program-badge"><img src="${program.src}" alt="" loading="lazy" decoding="async"><span>${text}</span></span>`;
}

function addProgramLegend() {
  const toolbar = document.querySelector('.offers-toolbar');
  if (!toolbar || toolbar.querySelector('.program-legend')) return;
  const legend = document.createElement('div');
  legend.className = 'program-legend';
  legend.setAttribute('aria-label', 'Programas disponíveis');
  legend.innerHTML = Object.entries(PROGRAM_LOGOS).map(([name, src]) => `
    <span class="program-chip" title="${name}">
      <img src="${src}" alt="${name}" loading="lazy" decoding="async">
      <span>${name}</span>
    </span>
  `).join('');
  toolbar.appendChild(legend);
}

function decorate() {
  document.querySelectorAll('table td').forEach(decorateProgramCell);
  addProgramLegend();
}

const observer = new MutationObserver(decorate);
observer.observe(document.body, { childList: true, subtree: true });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', decorate, { once: true });
} else {
  decorate();
}
