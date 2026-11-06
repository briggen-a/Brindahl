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

// User-approved extractions of the exact master. See public/artwork/provenance.json.
// Hero is intentionally one composition, not independently movable people/planet.
export const artwork = {
  hero: { src: '/artwork/brindahl-hero.webp', width: 492, height: 605, alt: 'Duke Mahgirb and Duchess Lhadnik stand side by side in full imperial dress before Brindahl, its waterfalls and cities. The B/K seal rests at their feet.' },
  dukePortrait: { src: '/artwork/duke-portrait.png', width: 175, height: 560, alt: 'Duke Mahgirb in black and gold imperial dress.' },
  duchessPortrait: { src: '/artwork/duchess-portrait.png', width: 170, height: 554, alt: 'Duchess Lhadnik in black and gold imperial dress.' },
  seal: { src: '/artwork/house-seal.webp', width: 76, height: 70, alt: 'The ornate intertwined B and K imperial seal.' },
  bishop: { src: '/artwork/bishop-scene.webp', width: 336, height: 145, alt: 'The Duke and Duchess outside the illuminated dance hall on Bishop.' },
  avelis: { src: '/artwork/avelis-scene.webp', width: 315, height: 62, alt: 'Avelis: distant mountains and a city beneath the night sky.' },
};

export const routes = ['home', 'duke', 'duchess', 'guestbook', 'secrets'];
export function routeFromHash(hash) {
  const name = hash.replace(/^#\/?/, '');
  return routes.includes(name) ? name : 'home';
}
