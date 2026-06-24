import * as THREE from 'three';
import { buildCreatureGroup, setSlotCreature, speciesColorHex, lifeStageMeshScale } from './creature-visuals.js';

/** @typedef {'terrestrial'|'marine'|'freshwater'} Realm */

const REALM_PALETTE = {
  terrestrial: { fog: 0x09111f, ambient: 0x1a3a5c, key: 0x4f7fff, rim: 0x2dffb3, particle: 0x4f7fff },
  marine: { fog: 0x061828, ambient: 0x0a2848, key: 0x3a9fff, rim: 0x4fffdf, particle: 0x4fffdf },
  freshwater: { fog: 0x0a1428, ambient: 0x142848, key: 0x6b8fff, rim: 0x9b5fff, particle: 0x9b5fff },
};

let scene;
let camera;
let renderer;
let clock;
let helixGroup;
let particleField;
/** @type {THREE.Group} */
let founderA;
/** @type {THREE.Group} */
let founderB;
/** @type {THREE.Group} */
let hybridOrb;
let mergeBridge;
let mergeBurst;
let floorGrid;
let ambientLight;
let keyLight;
let rimLight;
let vitalityPulse;
let bioGlobe;
let running = false;

const cameraTarget = { x: 0, y: 1.2, z: 6.2, lookY: 0.25 };

const current = {
  phase: 'select',
  view: 'lab',
  realm: /** @type {Realm} */ ('terrestrial'),
  vitality: 100,
  merging: false,
};

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function buildHelix() {
  const group = new THREE.Group();
  const strandMat = new THREE.MeshStandardMaterial({
    color: 0x4f7fff,
    emissive: 0x4f7fff,
    emissiveIntensity: 0.45,
    metalness: 0.6,
    roughness: 0.2,
  });
  const partnerMat = strandMat.clone();
  partnerMat.color.setHex(0x9b5fff);
  partnerMat.emissive.setHex(0x9b5fff);

  const turns = 3.5;
  const points = 48;
  for (let i = 0; i < points; i += 1) {
    const t = i / points;
    const angle = t * Math.PI * 2 * turns;
    const y = t * 4.2 - 2.1;
    const r = 0.55 + Math.sin(t * Math.PI * 4) * 0.08;
    const sphereGeo = new THREE.SphereGeometry(0.07, 12, 12);

    const a = new THREE.Mesh(sphereGeo, strandMat);
    a.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    group.add(a);

    const b = new THREE.Mesh(sphereGeo, partnerMat);
    b.position.set(Math.cos(angle + Math.PI) * r, y, Math.sin(angle + Math.PI) * r);
    group.add(b);

    if (i % 4 === 0) {
      const rungGeo = new THREE.CylinderGeometry(0.015, 0.015, r * 2, 6);
      const rung = new THREE.Mesh(rungGeo, strandMat);
      rung.position.set(0, y, 0);
      rung.rotation.z = Math.PI / 2;
      rung.rotation.y = angle;
      group.add(rung);
    }
  }
  group.position.set(-2.8, 0.2, -1.2);
  return group;
}

function buildParticles(count = 420) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 18;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x4f7fff,
    size: 0.035,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geo, mat);
}

function buildMergeBridge() {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0x9b5fff,
    transparent: true,
    opacity: 0.35,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  for (let i = 0; i < 12; i += 1) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.04 + Math.random() * 0.03, 8, 8), mat.clone());
    s.userData.phase = Math.random() * Math.PI * 2;
    s.userData.speed = 0.4 + Math.random() * 0.6;
    group.add(s);
  }
  group.visible = false;
  return group;
}

function realmFromGame(game) {
  const hybridRealm = game.HYBRID?.parentA?.species?.realm;
  const selRealm = game.SEL_PARENT_A?.species?.realm || game.SEL_PARENT_B?.species?.realm;
  return /** @type {Realm} */ (hybridRealm || selRealm || 'terrestrial');
}

function applyPalette(realm, dt) {
  const pal = REALM_PALETTE[realm] || REALM_PALETTE.terrestrial;
  current.realm = realm;

  scene.fog.color.lerp(new THREE.Color(pal.fog), dt * 2);
  renderer.setClearColor(pal.fog, 1);
  ambientLight.color.lerp(new THREE.Color(pal.ambient), dt * 2);
  keyLight.color.lerp(new THREE.Color(pal.key), dt * 2);
  rimLight.color.lerp(new THREE.Color(pal.rim), dt * 2);
  if (particleField?.material) {
    /** @type {THREE.PointsMaterial} */ (particleField.material).color.lerp(new THREE.Color(pal.particle), dt * 2);
  }
}

function updateCreatures(game, dt) {
  const showLab =
    game.VIEW === 'lab' &&
    ['select', 'merging', 'hybrid', 'life', 'cycling', 'subRoundEnd'].includes(game.PHASE);
  const merging = game.PHASE === 'merging' || game.PHASE === 'cycling';
  current.merging = merging;

  const a = game.SEL_PARENT_A;
  const b = game.SEL_PARENT_B;
  const h = game.HYBRID;

  if (founderA) {
    const showA = showLab && !!a && !h;
    if (showA && a) {
      setSlotCreature(
        founderA,
        a.species.id,
        speciesColorHex(a.species.id, a.species.taxon),
        a.species.taxon,
      );
      founderA.position.x = lerp(founderA.position.x, -1.15, dt * 3);
    } else {
      founderA.visible = false;
    }
  }

  if (founderB) {
    const showB = showLab && !!b && !h;
    if (showB && b) {
      setSlotCreature(
        founderB,
        b.species.id,
        speciesColorHex(b.species.id, b.species.taxon),
        b.species.taxon,
      );
      founderB.position.x = lerp(founderB.position.x, 1.15, dt * 3);
    } else {
      founderB.visible = false;
    }
  }

  if (hybridOrb) {
    const showHybrid = showLab && !!h;
    if (showHybrid && h) {
      const sid = h.parentA?.species?.id || 'snow-leopard';
      setSlotCreature(
        hybridOrb,
        sid,
        speciesColorHex(sid, h.parentA?.species?.taxon),
        h.parentA?.species?.taxon || 'mammal',
      );
      hybridOrb.visible = true;
      const pulse = 1 + Math.sin(clock.elapsedTime * 2.2) * 0.06;
      const merging = game.PHASE === 'merging' || game.PHASE === 'cycling';
      const lifeStage =
        game.PHASE === 'life' || game.PHASE === 'subRoundEnd'
          ? game.lifeStageIndex || (game.PHASE === 'subRoundEnd' ? 4 : 1)
          : game.PHASE === 'hybrid'
            ? 1
            : 0;
      const matureScale = lifeStage ? lifeStageMeshScale(lifeStage) : 1;
      const mergeScale = merging ? 1.35 + Math.sin(clock.elapsedTime * 8) * 0.12 : pulse;
      const targetScale = mergeScale * matureScale;
      hybridOrb.scale.setScalar(lerp(hybridOrb.scale.x, targetScale, dt * 5));
      hybridOrb.position.x = lerp(hybridOrb.position.x, 0, dt * 4);
    } else {
      hybridOrb.visible = false;
    }
  }

  if (mergeBridge) {
    mergeBridge.visible = merging && showLab;
    if (mergeBridge.visible) {
      mergeBridge.children.forEach((s, i) => {
        const t = (clock.elapsedTime * s.userData.speed + s.userData.phase) % 1;
        s.position.set(lerp(-1.1, 1.1, t), 0.15 + Math.sin(t * Math.PI) * 0.35, Math.sin(t * Math.PI * 2) * 0.15);
        s.material.opacity = 0.2 + Math.sin(t * Math.PI) * 0.5;
      });
    }
  }

  if (mergeBurst) {
    mergeBurst.visible = merging;
    if (merging) mergeBurst.rotation.z += dt * 1.2;
  }

  if (helixGroup) {
    const helixOn =
      game.VIEW === 'lab' && (game.PHASE === 'select' || game.PHASE === 'merging' || game.PHASE === 'hybrid');
    helixGroup.visible = helixOn;
    helixGroup.rotation.y += dt * (merging ? 2.4 : 0.35);
    helixGroup.scale.setScalar(lerp(helixGroup.scale.x, merging ? 1.15 : 1, dt * 3));
  }
}

function buildBioGlobe() {
  const geo = new THREE.IcosahedronGeometry(1.1, 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x4fffdf,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(3.2, 0.55, -0.8);
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.35, 48),
    new THREE.MeshBasicMaterial({
      color: 0x4f7fff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  mesh.add(ring);
  return mesh;
}

function setCameraZone(phase, view) {
  if (view !== 'lab') {
    cameraTarget.x = 0;
    cameraTarget.y = 1.2;
    cameraTarget.z = 6.2;
    cameraTarget.lookY = 0.25;
    return;
  }
  if (phase === 'life' || phase === 'hybrid' || phase === 'subRoundEnd') {
    cameraTarget.x = 0;
    cameraTarget.y = 1.1;
    cameraTarget.z = 5.4;
    cameraTarget.lookY = 0.3;
  } else if (phase === 'merging' || phase === 'cycling') {
    cameraTarget.x = 0;
    cameraTarget.y = 1.15;
    cameraTarget.z = 5.8;
    cameraTarget.lookY = 0.28;
  } else {
    cameraTarget.x = 0.2;
    cameraTarget.y = 1.25;
    cameraTarget.z = 6.5;
    cameraTarget.lookY = 0.25;
  }
}

function updateVitality(vitality, dt) {
  current.vitality = lerp(current.vitality, vitality, dt * 2);
  const v = current.vitality / 100;
  const stress = 1 - v;
  keyLight.intensity = lerp(keyLight.intensity, 1.1 + v * 0.5, dt * 3);
  rimLight.intensity = lerp(rimLight.intensity, 0.65 + v * 0.35, dt * 3);

  if (vitalityPulse) {
    vitalityPulse.material.opacity = lerp(vitalityPulse.material.opacity, 0.08 + stress * 0.18, dt * 3);
    const col =
      v >= 0.66 ? new THREE.Color(0x2dffb3) : v >= 0.33 ? new THREE.Color(0xffb84f) : new THREE.Color(0xff4f6b);
    vitalityPulse.material.color.lerp(col, dt * 4);
  }
}

export function initScene() {
  const root = document.getElementById('scene-root');
  if (!root || running) return;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x09111f, 0.055);

  camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 80);
  camera.position.set(0, 1.2, 6.2);
  camera.lookAt(0, 0.3, 0);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  root.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  ambientLight = new THREE.AmbientLight(0x1a3a5c, 0.55);
  scene.add(ambientLight);

  keyLight = new THREE.DirectionalLight(0x4f7fff, 1.35);
  keyLight.position.set(3, 6, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  rimLight = new THREE.DirectionalLight(0x2dffb3, 0.75);
  rimLight.position.set(-4, 2, -3);
  scene.add(rimLight);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(9, 64),
    new THREE.MeshStandardMaterial({
      color: 0x0e1829,
      metalness: 0.85,
      roughness: 0.35,
      transparent: true,
      opacity: 0.55,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.35;
  floor.receiveShadow = true;
  scene.add(floor);

  floorGrid = new THREE.GridHelper(14, 28, 0x4f7fff, 0x1a2840);
  floorGrid.position.y = -1.34;
  floorGrid.material.opacity = 0.22;
  floorGrid.material.transparent = true;
  scene.add(floorGrid);

  helixGroup = buildHelix();
  scene.add(helixGroup);

  particleField = buildParticles();
  scene.add(particleField);

  founderA = new THREE.Group();
  founderA.position.set(-1.15, 0.1, 0.4);
  scene.add(founderA);

  founderB = new THREE.Group();
  founderB.position.set(1.15, 0.1, 0.4);
  scene.add(founderB);

  hybridOrb = new THREE.Group();
  hybridOrb.position.set(0, 0.25, 0.2);
  scene.add(hybridOrb);

  mergeBridge = buildMergeBridge();
  scene.add(mergeBridge);

  mergeBurst = new THREE.Group();
  const burstMat = new THREE.MeshBasicMaterial({
    color: 0x9b5fff,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  mergeBurst.add(new THREE.Mesh(new THREE.RingGeometry(0.6, 1.4, 32), burstMat));
  mergeBurst.add(new THREE.Mesh(new THREE.RingGeometry(0.3, 0.55, 24), burstMat.clone()));
  mergeBurst.position.set(0, 0.2, 0.1);
  mergeBurst.visible = false;
  scene.add(mergeBurst);

  vitalityPulse = new THREE.Mesh(
    new THREE.SphereGeometry(2.4, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0x2dffb3,
      transparent: true,
      opacity: 0.1,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  vitalityPulse.position.set(0, 0.2, 0);
  scene.add(vitalityPulse);

  bioGlobe = buildBioGlobe();
  scene.add(bioGlobe);

  window.addEventListener('resize', onResize);
  running = true;
  animate();
}

function onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  if (!running) return;
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  applyPalette(current.realm, dt * 0.65);

  if (particleField) {
    particleField.rotation.y = t * 0.025;
    const pos = particleField.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      pos.array[i * 3 + 1] += Math.sin(t + i) * 0.0004;
    }
    pos.needsUpdate = true;
  }

  [founderA, founderB, hybridOrb].forEach((g, idx) => {
    if (!g?.visible) return;
    const dir = idx === 1 ? -1 : 1;
    g.rotation.y += dt * 0.7 * dir;
    g.position.y = (idx === 2 ? 0.25 : 0.1) + Math.sin(t * 1.4 + idx) * 0.08;
  });

  if (vitalityPulse) {
    vitalityPulse.scale.setScalar(1 + Math.sin(t * 1.5) * 0.04);
  }

  if (bioGlobe?.visible) {
    bioGlobe.rotation.y += dt * 0.25;
    bioGlobe.rotation.x = Math.sin(t * 0.15) * 0.08;
  }

  camera.position.x = lerp(camera.position.x, cameraTarget.x + Math.sin(t * 0.12) * 0.2, dt * 2);
  camera.position.y = lerp(camera.position.y, cameraTarget.y + Math.sin(t * 0.18) * 0.06, dt * 2);
  camera.position.z = lerp(camera.position.z, cameraTarget.z, dt * 2);
  camera.lookAt(0, cameraTarget.lookY, 0);

  renderer.render(scene, camera);
}

/** @param {typeof import('./state.js').game} game */
export function syncScene(game) {
  if (!running) return;

  current.phase = game.PHASE;
  current.view = game.VIEW;
  setCameraZone(game.PHASE, game.VIEW);

  updateCreatures(game, 1);
  applyPalette(realmFromGame(game), 1);
  updateVitality(game.PHASE === 'life' ? game.healthMeter ?? 100 : 100, 1);

  if (bioGlobe) {
    bioGlobe.visible =
      game.VIEW === 'lab' &&
      !game.showIntro &&
      (game.PHASE === 'select' || game.gameAwaitingStart);
  }

  const introOn = !!game.showIntro;
  document.body.classList.toggle('scene-intro', introOn);
  document.body.classList.toggle('scene-dim', game.VIEW !== 'lab' || introOn);

  if (helixGroup && introOn) {
    helixGroup.visible = true;
    const step = Math.max(0, Math.min(6, game.introStep ?? 0));
    helixGroup.position.x = lerp(helixGroup.position.x, step <= 1 ? -1.2 : -2.8, 0.08);
    helixGroup.scale.setScalar(lerp(helixGroup.scale.x, step === 0 ? 1.2 : step === 6 ? 1.05 : 1, 0.08));
  }
}
