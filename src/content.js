// Text from the supplied handoff and approved four-panel master.
export const people = {
  duke: {
    title: 'Duke', name: 'Mahgirb',
    classification: 'Royal traveler · Strategist · Reluctant dancer',
    origin: 'Brindahl', originDetail: 'Royal bloodline',
    role: 'Defender of the Empire · Diplomat · Dance partner',
    biography: 'Descended from Brindahl’s oldest royal bloodline, Duke Mahgirb has devoted his reign to safeguarding the planet’s resources and maintaining the appearance of composure. His most consequential diplomatic encounter took place at a geriatric dance party on Bishop, where he met Lady Lhadnik. He insists he was only there for the refreshments.',
    exploits: ['Repelled 7 resource-hungry invasions', 'Traveled to 23 star systems (so far)', 'Survived the Bishop Dance Party (4876)', 'Still has the moves'],
  },
  duchess: {
    title: 'Duchess', name: 'Lhadnik',
    classification: 'Interplanetary diplomat · Cultural collector · Dance party instigator',
    origin: 'The Avelis System', originDetail: 'Another world',
    role: 'Diplomat · Cultural envoy · Travel companion · DJ (unofficial)',
    biography: 'Hailing from the Avelis System, Duchess Lhadnik has crossed galaxies in pursuit of culture, adventure, and occasionally better music. At a geriatric dance party on Bishop, she encountered a nobleman studying the emergency exits. She asked him to dance. The rest is imperial history, though the Duke disputes several details.',
    quote: 'Diplomacy, discovery, and a good dance floor make the galaxy a kinder place.',
  },
};

// References are NOT app assets. Populate only with approved standalone art.
export const artwork = {
  environment: { src: null, label: 'Planet & waterfalls', detail: 'Standalone artwork needed', alt: 'The lush planet Brindahl with monumental architecture and waterfalls.' },
  dukeStanding: { src: null, label: 'Duke', detail: 'Full-length photo needed', alt: 'Duke Mahgirb standing in his imperial costume.' },
  duchessStanding: { src: null, label: 'Duchess', detail: 'Full-length photo needed', alt: 'Duchess Lhadnik standing in her imperial costume.' },
  dukePortrait: { src: null, label: 'Duke portrait', detail: 'Portrait artwork needed', alt: 'Duke Mahgirb in imperial dress.' },
  duchessPortrait: { src: null, label: 'Duchess portrait', detail: 'Portrait artwork needed', alt: 'Duchess Lhadnik in imperial dress.' },
  seal: { src: null, label: 'B/K seal', detail: 'Approved source needed', alt: 'The ornate intertwined B and K imperial seal.' },
  bishop: { src: null, label: 'Bishop encounter', detail: 'Standalone scene needed', alt: 'The Duke and Duchess outside the dance hall on Bishop.' },
  avelis: { src: null, label: 'Avelis landscape', detail: 'Standalone scene needed', alt: 'The distant Avelis System.' },
};

export const routes = ['home', 'duke', 'duchess', 'guestbook', 'secrets'];
export function routeFromHash(hash) {
  const name = hash.replace(/^#\/?/, '');
  return routes.includes(name) ? name : 'home';
}
