"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  type RapierRigidBody,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
} from "@react-three/rapier";
import { useInView } from "framer-motion";
import { MeshLineGeometry, MeshLineMaterial } from "meshline";
import {
  type RefObject,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import { useIntroDone } from "./intro";

extend({ MeshLineGeometry, MeshLineMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    meshLineGeometry: ThreeElements["bufferGeometry"];
    meshLineMaterial: ThreeElements["meshBasicMaterial"] & {
      lineWidth?: number;
      resolution?: [number, number];
      useMap?: number | boolean;
      repeat?: [number, number];
    };
  }
}

// ---- konstanta yang bisa disetel ----
const CARD_W = 1.6;
const CARD_H = 2.25;
const CARD_D = 0.05;
const CARD_R = 0.11;
const RING_Y = CARD_H / 2 + 0.3; // cincin di atas kartu
const STRAP_WIDTH = 1.3; // lebar tiap tali; naikkan/turunkan kalau terlalu tipis/tebal
const GRAVITY: [number, number, number] = [0, -40, 0];
const ACCENT = "#ffc21a";
const DARK = "#0b0d10";

// ---------- tekstur kartu (digambar di canvas) ----------
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawFront(
  img: HTMLImageElement | null,
  name: string,
  role: string,
): HTMLCanvasElement {
  const W = 800;
  const H = 1125;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  roundRect(ctx, 0, 0, W, H, 56);
  ctx.fillStyle = DARK;
  ctx.fill();
  ctx.save();
  roundRect(ctx, 0, 0, W, H, 56);
  ctx.clip();

  // pita atas + slot
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, W, 150);
  ctx.fillStyle = DARK;
  roundRect(ctx, W / 2 - 70, 36, 140, 28, 14);
  ctx.fill();
  ctx.font = '500 26px "IBM Plex Mono", ui-monospace, monospace';
  ctx.textBaseline = "alphabetic";
  ctx.fillText("PORTFOLIO", 48, 122);

  // foto
  const px = 48;
  const py = 190;
  const pw = W - 96;
  const ph = 640;
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 40);
  ctx.clip();
  ctx.fillStyle = "#1c2128";
  ctx.fillRect(px, py, pw, ph);
  if (img) {
    const s = Math.max(pw / img.width, ph / img.height);
    ctx.drawImage(
      img,
      px + (pw - img.width * s) / 2,
      py,
      img.width * s,
      img.height * s,
    );
  }
  ctx.restore();

  // nama (otomatis dikecilkan agar muat) dan peran
  ctx.fillStyle = "#ffffff";
  let size = 78;
  ctx.font = `800 ${size}px Inter, system-ui, sans-serif`;
  while (ctx.measureText(name).width > pw && size > 36) {
    size -= 2;
    ctx.font = `800 ${size}px Inter, system-ui, sans-serif`;
  }
  ctx.fillText(name, px, 915);
  ctx.fillStyle = ACCENT;
  ctx.font = '500 30px "IBM Plex Mono", ui-monospace, monospace';
  ctx.fillText(role.toUpperCase(), px, 972);

  // barcode dekoratif
  ctx.fillStyle = "#ffffff";
  let x = px;
  let i = 0;
  while (x < px + pw) {
    const w = 3 + ((i * 7) % 5);
    ctx.fillRect(x, 1020, w, 64);
    x += w + 5 + ((i * 3) % 4);
    i += 1;
  }
  ctx.restore();
  return canvas;
}

function drawBack(name: string): HTMLCanvasElement {
  const W = 800;
  const H = 1125;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  roundRect(ctx, 0, 0, W, H, 56);
  ctx.fillStyle = ACCENT;
  ctx.fill();
  ctx.fillStyle = DARK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "800 620px Inter, system-ui, sans-serif";
  ctx.fillText(name.slice(0, 1).toUpperCase(), W / 2, H / 2 - 30);
  ctx.font = '500 30px "IBM Plex Mono", ui-monospace, monospace';
  ctx.fillText(name.toUpperCase(), W / 2, H - 70);
  return canvas;
}

function drawStrap(): HTMLCanvasElement {
  const W = 1024;
  const H = 128;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // dasar kain
  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, W, H);

  // anyaman: benang searah panjang + benang silang bergantian
  for (let y = 0; y < H; y += 2) {
    ctx.fillStyle = y % 4 === 0 ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.06)";
    ctx.fillRect(0, y, W, 1);
  }
  for (let x = 0; x < W; x += 4) {
    for (let y = 0; y < H; y += 4) {
      const odd = ((x + y) / 4) % 2 === 0;
      ctx.fillStyle = odd ? "rgba(0,0,0,0.09)" : "rgba(255,255,255,0.05)";
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // serat acak (deterministik supaya tidak berubah antar render)
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    ctx.fillStyle =
      rnd() > 0.5 ? "rgba(255,255,255,0.10)" : "rgba(80,50,0,0.12)";
    ctx.fillRect(x, y, 1 + rnd() * 3, 1);
  }

  // motif bintang kecil di tengah
  ctx.fillStyle = "rgba(11,13,16,0.78)";
  ctx.font = "700 34px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let x = 64; x < W; x += 128) ctx.fillText("✦", x, H / 2 + 1);

  // jahitan putus-putus di dekat tepi
  for (const y of [17, H - 17]) {
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 10]);
    ctx.beginPath();
    ctx.moveTo(0, y + 2);
    ctx.lineTo(W, y + 2);
    ctx.stroke();
    ctx.strokeStyle = "#7a5a00";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // shading lintang: tepi gelap, tengah terang (kain menggulung)
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "rgba(40,25,0,0.55)");
  g.addColorStop(0.14, "rgba(40,25,0,0.12)");
  g.addColorStop(0.5, "rgba(255,255,255,0.10)");
  g.addColorStop(0.86, "rgba(40,25,0,0.12)");
  g.addColorStop(1, "rgba(40,25,0,0.55)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  return canvas;
}

type Textures = {
  front: THREE.CanvasTexture;
  back: THREE.CanvasTexture;
  strap: THREE.CanvasTexture;
};

function makeTexture(canvas: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function useCardTextures(
  photoUrl: string | null,
  name: string,
  role: string,
): Textures | null {
  const [textures, setTextures] = useState<Textures | null>(null);

  useEffect(() => {
    let cancelled = false;
    let created: Textures | null = null;

    async function build() {
      try {
        await Promise.all([
          document.fonts.load("800 64px Inter"),
          document.fonts.load('500 28px "IBM Plex Mono"'),
        ]);
      } catch {
        // font gagal dimuat: pakai fallback sistem
      }
      const img = photoUrl ? await loadImage(photoUrl).catch(() => null) : null;
      if (cancelled) return;
      const strap = makeTexture(drawStrap());
      strap.wrapS = THREE.RepeatWrapping;
      strap.wrapT = THREE.RepeatWrapping;
      created = {
        front: makeTexture(drawFront(img, name, role)),
        back: makeTexture(drawBack(name)),
        strap,
      };
      setTextures(created);
    }
    build();

    return () => {
      cancelled = true;
      if (created) {
        created.front.dispose();
        created.back.dispose();
        created.strap.dispose();
      }
    };
  }, [photoUrl, name, role]);

  return textures;
}

// ---------- geometri kartu ----------
function roundedShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// ---------- tali V (dua arah) + kartu ----------
const FOV = 25;
const ANCHOR_SPREAD_PX = 110; // jarak tiap pangkal tali dari tengah, dalam px layar
const CARD_PX = { desktop: 300, mobile: 230 }; // tinggi kartu di layar

// ---- koreografi scroll (hanya layar lebar) ----
// p = seberapa jauh section About sudah naik menutupi hero (0..1).
const FRAY_FROM = 0.05; // tali mulai menipis
const RELEASE_AT = 0.55; // tali putus, kartu lepas
const REATTACH_BELOW = 0.3; // scroll balik: tali tersambung lagi
const REST_TILT = 0.1; // kemiringan kartu saat diam di About (rad)
const TARGET_ID = "lanyard-target";
// z-index canvas: tepat di bawah navbar supaya pangkal tali tetap tersembunyi di baliknya.
const PORTAL_Z = 29;

type Layout = {
  w: number;
  h: number;
  cx: number;
  cy: number;
  cardPx: number;
};

type Drive = {
  released: boolean;
  progress: { current: number };
  getTarget: () => HTMLElement | null;
  onLand: () => void;
};

type Vec3 = { x: number; y: number; z: number };

function useBodyRef(): RefObject<RapierRigidBody> {
  return useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>;
}

function makeCurve() {
  const c = new THREE.CatmullRomCurve3([
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
    new THREE.Vector3(),
  ]);
  c.curveType = "chordal";
  return c;
}

function updateStrand(
  mesh: THREE.Mesh | null,
  curve: THREE.CatmullRomCurve3,
  mid: RapierRigidBody,
  p2: THREE.Vector3 | null,
  p1: THREE.Vector3 | null,
  anchor: RapierRigidBody,
  points: number,
) {
  if (!mesh || !p1 || !p2) return;
  curve.points[0]?.copy(mid.translation());
  curve.points[1]?.copy(p2);
  curve.points[2]?.copy(p1);
  curve.points[3]?.copy(anchor.translation());
  (mesh.geometry as MeshLineGeometry).setPoints(curve.getPoints(points));
}

// Garis lurus a -> b (potongan tali setelah putus).
function lineBetween(
  mesh: THREE.Mesh | null,
  curve: THREE.CatmullRomCurve3,
  a: Vec3,
  b: Vec3,
  points: number,
) {
  if (!mesh) return;
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    curve.points[i]?.set(
      a.x + (b.x - a.x) * t,
      a.y + (b.y - a.y) * t,
      a.z + (b.z - a.z) * t,
    );
  }
  (mesh.geometry as MeshLineGeometry).setPoints(curve.getPoints(points));
}

// Sambungan dibuat sebagai komponen supaya bisa dilepas (unmount) saat tali putus.
function Rope({
  a,
  b,
  len,
}: {
  a: RefObject<RapierRigidBody>;
  b: RefObject<RapierRigidBody>;
  len: number;
}) {
  useRopeJoint(a, b, [[0, 0, 0], [0, 0, 0], len]);
  return null;
}

function Pin({
  a,
  b,
}: {
  a: RefObject<RapierRigidBody>;
  b: RefObject<RapierRigidBody>;
}) {
  useSphericalJoint(a, b, [
    [0, 0, 0],
    [0, RING_Y, 0],
  ]);
  return null;
}

function Strap({
  meshRef,
  texture,
  size,
  visible = true,
}: {
  meshRef: RefObject<THREE.Mesh | null>;
  texture: THREE.Texture;
  size: [number, number];
  visible?: boolean;
}) {
  return (
    <mesh ref={meshRef} frustumCulled={false} visible={visible}>
      <meshLineGeometry />
      <meshLineMaterial
        color="white"
        depthTest={false}
        resolution={size}
        useMap={1}
        map={texture}
        repeat={[-3, 1]}
        lineWidth={STRAP_WIDTH}
      />
    </mesh>
  );
}

function Band({
  textures,
  isSmall,
  layout,
  drive,
}: {
  textures: Textures;
  isSmall: boolean;
  layout: Layout;
  drive: Drive;
}) {
  const bandL = useRef<THREE.Mesh>(null);
  const bandR = useRef<THREE.Mesh>(null);
  const fixedL = useBodyRef();
  const l1 = useBodyRef();
  const l2 = useBodyRef();
  const fixedR = useBodyRef();
  const r1 = useBodyRef();
  const r2 = useBodyRef();
  const mid = useBodyRef();
  const card = useBodyRef();
  const lerps = useRef<(THREE.Vector3 | null)[]>([null, null, null, null]);

  const vec = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const ang = useMemo(() => new THREE.Vector3(), []);
  const rot = useMemo(() => new THREE.Vector3(), []);
  const curveL = useMemo(makeCurve, []);
  const curveR = useMemo(makeCurve, []);

  // Keadaan setelah tali putus: kartu digerakkan kinematik menuju target di About.
  const released = drive.released;
  const releasedRef = useRef(released);
  releasedRef.current = released;
  const curP = useMemo(() => new THREE.Vector3(), []);
  const curQ = useMemo(() => new THREE.Quaternion(), []);
  const tgtQ = useMemo(() => new THREE.Quaternion(), []);
  const eul = useMemo(() => new THREE.Euler(), []);
  const tRel = useRef(0);
  const landedRef = useRef(false);
  const lockRef = useRef<{ x: number; y: number } | null>(null);

  const [dragged, setDragged] = useState<THREE.Vector3 | false>(false);
  const [hovered, setHovered] = useState(false);

  const { w, h, cx, cy, cardPx } = layout;
  const kw = CARD_H / cardPx; // satuan dunia per px
  const geo = useMemo(() => {
    const k = CARD_H / cardPx; // satuan dunia per px
    const x = (cx - w / 2) * k;
    const y = (h / 2 - cy) * k;
    const topY = (h / 2) * k + 1.5; // pangkal tali di atas tepi canvas (tersembunyi di balik navbar)
    const spread = ANCHOR_SPREAD_PX * k;
    const restMidY = y + RING_Y;
    const strand = Math.hypot(spread, topY - restMidY) * 1.03;
    return { x, topY, spread, seg: strand / 3, midStartY: topY - 0.4 };
  }, [w, h, cx, cy, cardPx]);

  // Posisi awal sepanjang garis pangkal -> klip: kartu jatuh dari atas saat dipasang.
  const startAt = (side: -1 | 1, t: number): [number, number, number] => [
    geo.x + side * geo.spread * (1 - t),
    geo.topY + (geo.midStartY - geo.topY) * t,
    0,
  ];

  const { bodyGeo, faceGeo } = useMemo(() => {
    const shape = roundedShape(CARD_W, CARD_H, CARD_R);
    const body = new THREE.ExtrudeGeometry(shape, {
      depth: CARD_D,
      bevelEnabled: false,
      curveSegments: 10,
    });
    body.translate(0, 0, -CARD_D / 2);
    const face = new THREE.ShapeGeometry(shape, 10);
    const pos = face.attributes.position;
    const uv = face.attributes.uv;
    if (pos && uv) {
      for (let i = 0; i < pos.count; i++) {
        uv.setXY(
          i,
          (pos.getX(i) + CARD_W / 2) / CARD_W,
          (pos.getY(i) + CARD_H / 2) / CARD_H,
        );
      }
      uv.needsUpdate = true;
    }
    return { bodyGeo: body, faceGeo: face };
  }, []);

  useEffect(
    () => () => {
      bodyGeo.dispose();
      faceGeo.dispose();
    },
    [bodyGeo, faceGeo],
  );

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = dragged ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered, dragged]);

  // Saat men-drag kartu, jangan ikut menyeleksi teks halaman.
  useEffect(() => {
    if (!dragged) return;
    document.body.style.userSelect = "none";
    return () => {
      document.body.style.userSelect = "";
    };
  }, [dragged]);

  // Saat tali putus: ingat posisi/rotasi kartu sekarang, dan buat potongan tali
  // yang jatuh tidak bertabrakan dengan kartu.
  useEffect(() => {
    if (!released) return;
    const c = card.current;
    if (!c) return;
    const t = c.translation();
    const r = c.rotation();
    curP.set(t.x, t.y, 0);
    curQ.set(r.x, r.y, r.z, r.w);
    tRel.current = 0;
    landedRef.current = false;
    lockRef.current = null;
    for (const ref of [l2, r2, mid]) ref.current?.collider(0)?.setSensor(true);
  }, [released, card, l2, r2, mid, curP, curQ]);

  useFrame((state, delta) => {
    const cardBody = card.current;
    const midBody = mid.current;
    const fL = fixedL.current;
    const fR = fixedR.current;
    if (!cardBody || !midBody || !fL || !fR) return;
    const isReleased = releasedRef.current;
    const p = drive.progress.current;

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      for (const ref of [card, mid, l1, l2, r1, r2, fixedL, fixedR]) {
        ref.current?.wakeUp();
      }
      cardBody.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
      if (isReleased) curP.set(vec.x - dragged.x, vec.y - dragged.y, 0);
    } else if (isReleased) {
      const dt = Math.min(delta, 0.05);
      tRel.current += dt;
      const el = drive.getTarget();
      if (lockRef.current) {
        // Sudah mendarat di About: posisi dikunci.
        curP.x = lockRef.current.x;
        curP.y = lockRef.current.y;
      } else if (el) {
        const r = el.getBoundingClientRect();
        const tx = (r.left + r.width / 2 - w / 2) * kw;
        const ty =
          (h / 2 - (r.top + r.height / 2)) * kw +
          Math.sin(state.clock.elapsedTime * 1.3) * 0.04;
        // jatuh sedikit dulu, baru meluncur ke target
        const dip = Math.sin(Math.PI * Math.min(1, tRel.current / 0.9)) * 0.9;
        const a = 1 - Math.exp(-dt * (tRel.current < 0.35 ? 2.4 : 6));
        curP.x += (tx - curP.x) * a;
        curP.y += (ty - dip - curP.y) * a;
        if (
          !landedRef.current &&
          tRel.current > 0.9 &&
          Math.hypot(tx - curP.x, ty - curP.y) < 0.06
        ) {
          landedRef.current = true;
          lockRef.current = { x: curP.x, y: curP.y };
          drive.onLand();
        }
      }
      const spin = Math.sin(Math.PI * Math.min(1, tRel.current / 1.2)) * 0.9;
      eul.set(
        0,
        spin,
        REST_TILT +
          (lockRef.current ? 0 : Math.sin(state.clock.elapsedTime * 0.8) * 0.025),
      );
      tgtQ.setFromEuler(eul);
      curQ.slerp(tgtQ, 1 - Math.exp(-dt * 6));
      cardBody.setNextKinematicTranslation({ x: curP.x, y: curP.y, z: 0 });
      cardBody.setNextKinematicRotation(curQ);
    }

    [l1, l2, r1, r2].forEach((ref, i) => {
      const body = ref.current;
      if (!body) return;
      let v = lerps.current[i] ?? null;
      if (!v) {
        v = new THREE.Vector3().copy(body.translation());
        lerps.current[i] = v;
      }
      const dist = Math.max(0.1, Math.min(1, v.distanceTo(body.translation())));
      v.lerp(body.translation(), delta * (dist * 50));
    });

    const pts = isSmall ? 16 : 32;
    if (!isReleased) {
      updateStrand(
        bandL.current,
        curveL,
        midBody,
        lerps.current[1] ?? null,
        lerps.current[0] ?? null,
        fL,
        pts,
      );
      updateStrand(
        bandR.current,
        curveR,
        midBody,
        lerps.current[3] ?? null,
        lerps.current[2] ?? null,
        fR,
        pts,
      );
    } else {
      // Tali putus: sisa tali pendek menjuntai ke ATAS dari cincin kartu,
      // tidak pernah turun menutupi wajah kartu.
      const m = midBody.translation();
      const stub = 0.16;
      const tipL = new THREE.Vector3(m.x - 0.05, m.y + stub, m.z);
      const tipR = new THREE.Vector3(m.x + 0.05, m.y + stub, m.z);
      lineBetween(bandL.current, curveL, m, tipL, pts);
      lineBetween(bandR.current, curveR, m, tipR, pts);
    }

    // Tali menipis seiring scroll (seperti ditarik), lalu putus.
    const fray = Math.min(
      1,
      Math.max(0, (p - FRAY_FROM) / (RELEASE_AT - FRAY_FROM)),
    );
    const width = isReleased
      ? STRAP_WIDTH * 0.4
      : STRAP_WIDTH * (1 - 0.65 * fray * fray);
    for (const m of [bandL.current, bandR.current]) {
      const mat = m?.material as unknown as { lineWidth: number } | undefined;
      if (mat) mat.lineWidth = width;
    }

    if (!isReleased) {
      ang.copy(cardBody.angvel());
      rot.copy(cardBody.rotation());
      cardBody.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);
    }
  });

  const segmentProps = {
    type: "dynamic" as const,
    canSleep: true,
    colliders: false as const,
    angularDamping: 4,
    linearDamping: 4,
  };

  return (
    <>
      <RigidBody
        ref={fixedL}
        {...segmentProps}
        type="fixed"
        position={[geo.x - geo.spread, geo.topY, 0]}
      />
      <RigidBody ref={l1} {...segmentProps} position={startAt(-1, 1 / 3)}>
        <BallCollider args={[0.1]} />
      </RigidBody>
      <RigidBody ref={l2} {...segmentProps} position={startAt(-1, 2 / 3)}>
        <BallCollider args={[0.1]} />
      </RigidBody>

      <RigidBody
        ref={fixedR}
        {...segmentProps}
        type="fixed"
        position={[geo.x + geo.spread, geo.topY, 0]}
      />
      <RigidBody ref={r1} {...segmentProps} position={startAt(1, 1 / 3)}>
        <BallCollider args={[0.1]} />
      </RigidBody>
      <RigidBody ref={r2} {...segmentProps} position={startAt(1, 2 / 3)}>
        <BallCollider args={[0.1]} />
      </RigidBody>

      <RigidBody
        ref={mid}
        {...segmentProps}
        position={[geo.x, geo.midStartY, 0]}
      >
        <BallCollider args={[0.1]} />
      </RigidBody>

      <RigidBody
        ref={card}
        {...segmentProps}
        position={[geo.x, geo.midStartY - RING_Y, 0]}
        type={released || dragged ? "kinematicPosition" : "dynamic"}
      >
        <CuboidCollider args={[CARD_W / 2, CARD_H / 2, CARD_D / 2]} />
        <group
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onPointerUp={(e) => {
            (e.target as Element).releasePointerCapture(e.pointerId);
            setDragged(false);
          }}
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture(e.pointerId);
            const origin = card.current?.translation();
            if (!origin) return;
            setDragged(new THREE.Vector3().copy(e.point).sub(vec.copy(origin)));
          }}
        >
          <mesh geometry={bodyGeo}>
            <meshPhysicalMaterial
              color={DARK}
              roughness={0.45}
              metalness={0.2}
              clearcoat={0.6}
            />
          </mesh>
          <mesh geometry={faceGeo} position={[0, 0, CARD_D / 2 + 0.001]}>
            <meshPhysicalMaterial
              map={textures.front}
              roughness={0.35}
              clearcoat={1}
              clearcoatRoughness={0.15}
            />
          </mesh>
          <mesh
            geometry={faceGeo}
            position={[0, 0, -CARD_D / 2 - 0.001]}
            rotation={[0, Math.PI, 0]}
          >
            <meshPhysicalMaterial
              map={textures.back}
              roughness={0.35}
              clearcoat={1}
              clearcoatRoughness={0.15}
            />
          </mesh>
          <mesh position={[0, CARD_H / 2 + 0.09, 0]}>
            <boxGeometry args={[0.42, 0.2, 0.07]} />
            <meshStandardMaterial
              color="#c8ccd2"
              metalness={1}
              roughness={0.25}
            />
          </mesh>
          <group position={[0, RING_Y + 0.1, 0]}>
            <mesh renderOrder={10}>
              <boxGeometry args={[0.36, 0.34, 0.1]} />
              <meshStandardMaterial
                color="#c8ccd2"
                metalness={1}
                roughness={0.25}
                depthTest={false}
              />
            </mesh>
            <mesh renderOrder={11} position={[0, 0.07, 0.056]}>
              <boxGeometry args={[0.2, 0.05, 0.02]} />
              <meshStandardMaterial color={DARK} depthTest={false} />
            </mesh>
            <mesh
              renderOrder={10}
              position={[0, -0.2, 0]}
              rotation={[0, 0, Math.PI * 0.75]}
            >
              <torusGeometry args={[0.1, 0.03, 12, 24, Math.PI * 1.5]} />
              <meshStandardMaterial
                color="#c8ccd2"
                metalness={1}
                roughness={0.25}
                depthTest={false}
              />
            </mesh>
          </group>
          <mesh position={[0, RING_Y, 0]}>
            <torusGeometry args={[0.11, 0.032, 12, 28]} />
            <meshStandardMaterial
              color="#c8ccd2"
              metalness={1}
              roughness={0.25}
            />
          </mesh>
        </group>
      </RigidBody>

      {/* Sambungan tali. Yang di tengah dan di kartu dilepas saat tali putus. */}
      <Rope a={fixedL} b={l1} len={geo.seg} />
      {!released && <Rope a={l1} b={l2} len={geo.seg} />}
      <Rope a={l2} b={mid} len={geo.seg} />
      <Rope a={fixedR} b={r1} len={geo.seg} />
      {!released && <Rope a={r1} b={r2} len={geo.seg} />}
      <Rope a={r2} b={mid} len={geo.seg} />
      <Pin a={mid} b={card} />

      <Strap meshRef={bandL} texture={textures.strap} size={[w, h]} />
      <Strap meshRef={bandR} texture={textures.strap} size={[w, h]} />
    </>
  );
}

// Menjaga ukuran kartu konstan dalam px: jarak kamera mengikuti tinggi canvas.
function CameraRig({ z }: { z: number }) {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(0, 0, z);
    camera.updateProjectionMatrix();
  }, [camera, z]);
  return null;
}

// Navbar = elemen fixed/sticky pendek di puncak layar. Tali dipotong di bawahnya.
function findNav(): Element | null {
  const vw = window.innerWidth;
  const els = document.querySelectorAll(
    'header, nav, [class*="fixed"], [class*="sticky"]',
  );
  for (const el of Array.from(els)) {
    if (el.closest("[aria-hidden='true']")) continue;
    const cs = getComputedStyle(el);
    if (cs.position !== "fixed" && cs.position !== "sticky") continue;
    const r = el.getBoundingClientRect();
    if (r.top <= 1 && r.height > 20 && r.height < 160 && r.width > vw * 0.6) {
      return el;
    }
  }
  return null;
}

export default function Lanyard({
  name,
  title,
  photoUrl,
  eventSource,
}: {
  name: string;
  title: string;
  photoUrl: string | null;
  eventSource: RefObject<HTMLElement | null>;
}) {
  const introDone = useIntroDone();
  const textures = useCardTextures(photoUrl, name, title);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef);
  const [isSmall, setIsSmall] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches,
  );
  const [box, setBox] = useState<Omit<Layout, "cardPx"> | null>(null);
  const [released, setReleased] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [covered, setCovered] = useState(false);
  const progress = useRef(0);
  const releasedRef = useRef(false);
  const targetRef = useRef<HTMLElement | null>(null);
  const landRef = useRef<() => void>(() => {});

  // Layar lebar: canvas jadi lapisan fixed (via portal) dengan koreografi scroll.
  // Layar kecil: seperti sebelumnya, canvas di dalam hero.
  const choreo = !isSmall;

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const on = () => setIsSmall(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Ukur posisi stage (tempat kartu menggantung) relatif terhadap canvas.
  useEffect(() => {
    const wrap = wrapRef.current;
    const stage = eventSource.current;
    if (!wrap || !stage) return;
    let timer: number | undefined;
    const measure = () => {
      const a = wrap.getBoundingClientRect();
      const b = stage.getBoundingClientRect();
      if (a.width < 10 || a.height < 10) return;
      setBox({
        w: Math.round(a.width),
        h: Math.round(a.height),
        cx: Math.round(b.left + b.width / 2 - a.left),
        cy: Math.round(b.top + b.height / 2 - a.top),
      });
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 120);
    };
    measure();
    const ro = new ResizeObserver(schedule);
    ro.observe(wrap);
    ro.observe(stage);
    window.addEventListener("resize", schedule);
    return () => {
      window.clearTimeout(timer);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
    };
  }, [eventSource, choreo]);

  // Progres scroll: tali menipis, putus, lalu kartu pindah ke About.
  // Saat tali putus (scroll ke bawah), halaman digeser sampai About tepat di
  // atas dan scroll ditahan sampai kartu mendarat.
  useEffect(() => {
    if (!choreo) return;
    const about = document.getElementById("about");
    const after = about?.nextElementSibling ?? null;
    targetRef.current = document.getElementById(TARGET_ID);
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const clamp = (n: number) => Math.min(1, Math.max(0, n));
    let lastY = window.scrollY;
    let navEl: Element | null = null;
    let holding = false;
    let holdTimer: number | undefined;

    const block = (e: Event) => e.preventDefault();
    const blockKeys = (e: KeyboardEvent) => {
      if (
        ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(
          e.key,
        )
      ) {
        e.preventDefault();
      }
    };
    const endHold = () => {
      if (!holding) return;
      holding = false;
      window.clearTimeout(holdTimer);
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", blockKeys);
    };
    const startHold = () => {
      if (holding || reduceMotion || !about) return;
      holding = true;
      window.addEventListener("wheel", block, { passive: false });
      window.addEventListener("touchmove", block, { passive: false });
      window.addEventListener("keydown", blockKeys);
      holdTimer = window.setTimeout(endHold, 2400); // pengaman kalau kartu tidak mendarat
      window.scrollTo({
        top: window.scrollY + about.getBoundingClientRect().top,
        behavior: "smooth",
      });
    };
    landRef.current = endHold;

    const navBottom = () => {
      if (!navEl || !navEl.isConnected) navEl = findNav();
      return navEl ? Math.max(0, navEl.getBoundingClientRect().bottom) : 0;
    };

    const update = () => {
      const vh = window.innerHeight;
      const y = window.scrollY;
      const down = y > lastY;
      lastY = y;
      const p = about ? clamp(1 - about.getBoundingClientRect().top / vh) : 0;
      progress.current = p;
      const q = after ? clamp(1 - after.getBoundingClientRect().top / vh) : 0;
      const fade = 1 - clamp((q - 0.1) / 0.4);
      const wrap = wrapRef.current;
      if (wrap) {
        wrap.style.opacity = String(fade);
        // Tali selalu dipotong tepat di bawah navbar, termasuk di hero.
        wrap.style.clipPath = `inset(${Math.round(navBottom())}px 0 0 0)`;
      }
      setCovered(fade <= 0.01);
      const rel = releasedRef.current;
      const next =
        Boolean(targetRef.current) &&
        (rel ? p > REATTACH_BELOW : p >= RELEASE_AT);
      if (next !== rel) {
        releasedRef.current = next;
        setReleased(next);
        if (next) {
          if (down) startHold();
        } else {
          endHold();
          setEpoch((e) => e + 1); // tali tersambung lagi: pasang ulang dari atas
        }
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      endHold();
      landRef.current = () => {};
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [choreo, box]);

  const cardPx = isSmall ? CARD_PX.mobile : CARD_PX.desktop;
  const k = CARD_H / cardPx;
  const camZ = box ? (box.h * k) / 2 / Math.tan((FOV * Math.PI) / 360) : 12;
  const drive: Drive = {
    released,
    progress,
    getTarget: () => targetRef.current,
    onLand: () => landRef.current(),
  };

  const content = (
    <div
      ref={wrapRef}
      className={
        choreo
          ? "pointer-events-none fixed inset-0"
          : "pointer-events-none absolute inset-0 z-30"
      }
      style={choreo ? { zIndex: PORTAL_Z } : undefined}
    >
      {box && (
        <Canvas
          camera={{ position: [0, 0, camZ], fov: FOV }}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true }}
          frameloop={(choreo ? !covered : inView) ? "always" : "never"}
          eventSource={
            choreo ? document.body : (eventSource as RefObject<HTMLElement>)
          }
          eventPrefix="client"
        >
          <CameraRig z={camZ} />
          <ambientLight intensity={1.5} />
          <Physics gravity={GRAVITY} timeStep={1 / 60}>
            {introDone && textures && (
              <Band
                key={`${box.w}-${box.h}-${box.cx}-${box.cy}-${cardPx}-${epoch}`}
                textures={textures}
                isSmall={isSmall}
                layout={{ ...box, cardPx }}
                drive={drive}
              />
            )}
          </Physics>
          <Environment blur={0.75}>
            <Lightformer
              intensity={2}
              color="white"
              position={[0, -1, 5]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="white"
              position={[-1, -1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={3}
              color="white"
              position={[1, 1, 1]}
              rotation={[0, 0, Math.PI / 3]}
              scale={[100, 0.1, 1]}
            />
            <Lightformer
              intensity={10}
              color="white"
              position={[-10, 0, 14]}
              rotation={[0, Math.PI / 2, Math.PI / 3]}
              scale={[100, 10, 1]}
            />
          </Environment>
        </Canvas>
      )}
    </div>
  );

  return choreo ? createPortal(content, document.body) : content;
}
