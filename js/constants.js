/** Economy tuning */
export const RESOURCE_SOFT_CAP = 15;

/** Meta-round: three crosses (sub-rounds), each cross runs four life-stage beats */
export const SUB_ROUNDS_PER_ROUND = 3;
export const LIFE_STAGES_PER_SUBROUND = 4;

/** Alias for banners / legacy helpers — one cross spans four life-stage beats */
export const SURVIVAL_CYCLES_IN_COHORT = LIFE_STAGES_PER_SUBROUND;

/**
 * Nine conservation deployments per meta-round — split unevenly so cross #1 can clear four life stages.
 * Surviving a full natural life grants bonus deploy passes on the next cross (legacy bonus).
 */
export const ROUND_RESOURCE_PASSES = 9;
/** Deploy budget when crosses 1–3 begin (sums to {@link ROUND_RESOURCE_PASSES}) */
export const PASSES_PER_CROSS_SEQUENCE = [4, 3, 2];

export const LIFE_STAGE_LABELS = ['Birth', 'Juvenile', 'Adult', 'Old age'];

/** 2×2 matrix: resource row × forecast column (right resource required to avoid forced collapse) */
export const MATRIX_RR_RG = 10;
export const MATRIX_RR_WG = 7;
export const MATRIX_WR_RG = -7;
export const MATRIX_WR_WG = -10;

/** Added to survival ledger for every later cross in the same meta-round after a full natural life */
export const CARE_MATE_BONUS_PER_FULL_LIFE = 8;

/** Upper bound for persisted scoreboard points */
export const FORECAST_POINTS_SOFT_CAP = 9999;

/** Trait column labels & colours */
export const TMETA = {
  adaptability: { label: '🌱 Adaptability', color: '#4f7fff' },
  immune: { label: '🛡️ Immune Strength', color: '#2dffb3' },
  reproduction: { label: '🥚 Reproduction Rate', color: '#9b5fff' },
  climate: { label: '🌡️ Climate Tolerance', color: '#4fffdf' },
  dietary: { label: '🍃 Dietary Flex', color: '#ffb84f' },
  size: { label: '📐 Size Efficiency', color: '#ff8f4f' },
  social: { label: '🤝 Social Behavior', color: '#ff4fb8' },
  camouflage: { label: '👁️ Camouflage', color: '#7bff4f' },
};

/** Environmental pressures */
export const EVENTS = [
  { id: 'habitat', emoji: '🌲', name: 'Habitat Fragmentation', desc: 'Urban sprawl has destroyed 40% of the lineage\'s primary territory.', impact: -15 },
  { id: 'disease', emoji: '🦠', name: 'Disease Outbreak', desc: 'A novel pathogen is sweeping rapidly through the regional ecosystem.', impact: -20 },
  { id: 'predator', emoji: '🐍', name: 'Invasive Predator', desc: 'A dominant apex predator has entered and destabilised the food web.', impact: -12 },
  { id: 'drought', emoji: '☀️', name: 'Severe Drought', desc: 'Three consecutive dry seasons have depleted water and food availability.', impact: -18 },
  { id: 'human', emoji: '🏭', name: 'Human Encroachment', desc: 'Poaching networks and agricultural expansion are closing in rapidly.', impact: -16 },
  { id: 'food', emoji: '🔗', name: 'Food Chain Collapse', desc: 'The lineage\'s primary prey species has gone locally extinct.', impact: -22 },
  { id: 'pollution', emoji: '☣️', name: 'Water Pollution', desc: 'Industrial runoff has contaminated the primary water sources.', impact: -14 },
  { id: 'flood', emoji: '🌊', name: 'Extreme Flood Event', desc: 'Record-breaking floods devastated the breeding grounds completely.', impact: -17 },
  { id: 'fire', emoji: '🔥', name: 'Wildfire Season', desc: 'Catastrophic fires swept through 60% of the available habitat range.', impact: -19 },
  { id: 'heat_dome', emoji: '🌡️', name: 'Persistent Heat Dome', desc: 'A stalled high-pressure cell bakes rookeries above lethal dew points.', impact: -18 },
  { id: 'cold_snap', emoji: '❄️', name: 'Polar Surge', desc: 'Jet stream buckles — flash freezes strand migrants away from thermal refugia.', impact: -14 },
  { id: 'illegal_trade', emoji: '🚤', name: 'Wildlife Trafficking Spike', desc: 'Encrypted marketplaces move live specimens faster than patrols can intercept.', impact: -17 },
  { id: 'bycatch', emoji: '🕸️', name: 'Industrial Bycatch Wave', desc: 'Ghost nets and longlines snag dispersing juveniles far beyond sanctuary lines.', impact: -16 },
  { id: 'algal_bloom', emoji: '🟢', name: 'Toxic Algal Bloom', desc: 'Nutrient runoff fuels neurotoxic cyanobacteria mats across nursery shallows.', impact: -15 },
  { id: 'seismic', emoji: '🏚️', name: 'Seismic Swarm', desc: 'Fault creep liquefies den sites and collapses migration pinch-points.', impact: -20 },
  { id: 'windstorm', emoji: '🌀', name: 'Medicane Strike', desc: 'Hybrid storms shred canopy bridges and scatter scent highways.', impact: -15 },
  { id: 'parasite_wave', emoji: '🪱', name: 'Parasite Amplification', desc: 'Climate-linked vectors boom — novel helminths overwhelm naive immune profiles.', impact: -16 },
  { id: 'mining', emoji: '⛏️', name: 'Illegal Mine Expansion', desc: 'Mercury tailings creep into aquifers relied on during dry seasons.', impact: -18 },
  { id: 'shipping_lane', emoji: '🚢', name: 'Heavy Shipping Corridor', desc: 'Low-frequency hull noise masks mating calls across entire sea lanes.', impact: -13 },
  { id: 'invasive_plant', emoji: '🌿', name: 'Invasive Plant Mat', desc: 'Kudzu-like monocultures smother browse diversity within weeks.', impact: -14 },
];

/** Conservation deployables */
export const RESOURCES = [
  { id: 'habitat', emoji: '🏕️', name: 'Protected Habitat Zone', desc: 'Secure 500km² from all human activity.', effect: '+18 survival bonus', bonus: 18, type: 'survival' },
  { id: 'food', emoji: '🍖', name: 'Emergency Food Supply', desc: 'Airlifted provisions through the crisis period.', effect: '+12 survival bonus', bonus: 12, type: 'survival' },
  { id: 'genefix', emoji: '💉', name: 'Gene Therapy Token', desc: 'Experimental lab-grade defect targeting.', effect: 'Unlocks ~80% defect cure during defect triage', bonus: 8, type: 'cure' },
  { id: 'patrol', emoji: '🛡️', name: 'Anti-Poaching Patrol', desc: 'Deploy rangers with drones across the territory.', effect: '+15 survival bonus', bonus: 15, type: 'survival' },
  { id: 'vaccine', emoji: '🧪', name: 'Disease Inoculation', desc: 'Custom vaccine targeting regional pathogens.', effect: '+22 vs disease events', bonus: 22, type: 'survival' },
  { id: 'shelter', emoji: '⛺', name: 'Climate Shelter Network', desc: 'Microclimatic refugia across the habitat.', effect: '+20 survival bonus', bonus: 20, type: 'survival' },
];

/** Genetic defect templates */
export const DEFECT_POOL = [
  { name: 'Recessive Immune Disorder', desc: 'HLA antigen mismatch creates an autoimmune cascade that steadily weakens host defences.', impact: 'Immune strength -25 in Cycle 3.' },
  { name: 'Partial Infertility', desc: 'Chromosomal mismatch at key loci reduces viable offspring by 50% per generation.', impact: 'Reproduction rate halved permanently.' },
  { name: 'Behavioural Incompatibility', desc: 'Conflicting neurological pheromone systems prevent natural mating behaviours from triggering.', impact: 'Social score -30; breeding nearly impossible.' },
  { name: 'Organ Malformation', desc: 'Hepatic and renal systems show structural defects from mismatched developmental genes.', impact: 'Lifespan -40%; metabolic efficiency drops sharply.' },
  { name: 'Thermal Dysregulation', desc: 'Conflicting thermoregulatory genes produce dangerous swings in core body temperature.', impact: 'Climate tolerance -28; drought events become lethal.' },
  { name: 'Neurological Stress Response', desc: 'Cross-lineage neural wiring creates extreme anxiety responses to normal environmental stimuli.', impact: 'Adaptability -22 under high-pressure events.' },
];
