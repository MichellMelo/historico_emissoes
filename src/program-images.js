import './program-images.css';

/*
 * Logos oficiais / ativos de marca publicados pelas próprias marcas
 * ou em repositórios que identificam a marca como fonte.
 *
 * Azul pelo Mundo usa a identidade Azul porque a própria Azul o apresenta
 * como uma oferta/vertical do Azul Fidelidade, e não como um programa
 * independente. Verão Europeu é tratado como campanha, pois não foi
 * localizado um logotipo oficial próprio.
 */
const PROGRAM_LOGOS = {
  'Aeroplan': {
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Aeroplan_2020_Logo.svg',
    label: 'Aeroplan'
  },
  'Azul': {
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Logo_da_Azul_Linhas_A%C3%A9reas_Brasileiras.svg',
    label: 'Azul Fidelidade'
  },
  'Azul pelo Mundo': {
    src: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Logo_da_Azul_Linhas_A%C3%A9reas_Brasileiras.svg',
    label: 'Azul pelo Mundo'
  },
  'Iberia Plus': {
    src: 'https://www.iberia.com/wcs/imagenes/ibplus/landings/clubibplus/logo_club_ibplus.png',
    label: 'Iberia Club'
  },
  'Latam': {
    src: 'https://hangar-statics.appslatam.com/images/logos/latam/IsoGrayscaleInverse.svg',
    label: 'LATAM Pass'
  },
  'Smiles': {
    src: 'https://static.smiler.com.br/mkt/n_site/2024/lp_clubesmiles/logo_smiles.png',
    label: 'Smiles'
  }
};

const CAMPAIGN_BADGES = {
  'Verão Europeu': {
    label: 'Campanha',
    icon: '☀'
  }
};

const normalize = value => String(value || '').trim().toLocaleLowerCase('pt-BR');
const lookup = new Map(
  Object.entries(PROGRAM_LOGOS).map(([name, config]) => [normalize(name), { name, ...config }])
);
const campaignLookup = new Map(
  Object.entries(CAMPAIGN_BADGES).map(([name, config]) => [normalize(name), { name, ...config }])
);

function decorateProgramCell(cell) {
  if (cell.dataset.programLogo === '1') return;

  const key = normalize(cell.textContent);
  const program = lookup.get(key);
  const campaign = campaignLookup.get(key);
  if (!program && !campaign) return;

  const text = cell.textContent.trim();
  cell.dataset.programLogo = '1';

  if (program) {
    cell.innerHTML = `<span class="program-badge">
      <span class="program-logo-frame"><img src="${program.src}" alt="${program.label}" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>
      <span>${text}</span>
    </span>`;
  } else {
    cell.innerHTML = `<span class="program-badge campaign-badge">
      <span class="campaign-icon" aria-hidden="true">${campaign.icon}</span>
      <span>${text}</span>
    </span>`;
  }
}

function addProgramLegend() {
  const toolbar = document.querySelector('.offers-toolbar');
  if (!toolbar || toolbar.querySelector('.program-legend')) return;

  const legend = document.createElement('div');
  legend.className = 'program-legend';
  legend.setAttribute('aria-label', 'Programas disponíveis');

  legend.innerHTML = [
    ...Object.entries(PROGRAM_LOGOS).map(([name, config]) => `
      <span class="program-chip" title="${config.label}">
        <span class="program-logo-frame"><img src="${config.src}" alt="${config.label}" loading="lazy" decoding="async" referrerpolicy="no-referrer"></span>
        <span>${name}</span>
      </span>
    `),
    `<span class="program-chip campaign-chip" title="Campanha Verão Europeu">
      <span class="campaign-icon" aria-hidden="true">☀</span>
      <span>Verão Europeu</span>
    </span>`
  ].join('');

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
