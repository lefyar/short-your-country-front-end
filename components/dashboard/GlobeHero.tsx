// components/dashboard/GlobeHero.tsx
// @ts-nocheck
"use client";

import * as THREE from "three";
import { useRef, useReducer, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Physics, RigidBody, BallCollider } from "@react-three/rapier";
import { Effects } from "./Effects";

const accents = ["#ff4060", "#ffcc00", "#20ffa0", "#4060ff"];

// sekarang shuffle cuma dipakai buat jumlah bola + sedikit variasi material,
// warna utama tetap dari texture bendera
const shuffle = (accent = 0) => [
  { roughness: 0.25, metalness: 0.55 },
  { roughness: 0.2, metalness: 0.6 },
  { roughness: 0.15, metalness: 0.6 },
  { roughness: 0.25, metalness: 0.5 },
  { roughness: 0.2, metalness: 0.55 },
  // { roughness: 0.2, metalness: 0.55 },
  // { roughness: 0.2, metalness: 0.55 },
  // { roughness: 0.2, metalness: 0.55 },
  // { roughness: 0.2, metalness: 0.55 },
];

const flagDefinitions = [
  { name: "Indonesia", colors: ["#ff0000", "#ffffff"] },
  { name: "USA", colors: ["#3c3b6e", "#ffffff", "#b22234"] },
  // { name: "Japan", colors: ["#ffffff", "#ff0000"] },
  { name: "Germany", colors: ["#000000", "#dd0000", "#ffce00"] },
  { name: "France", colors: ["#0055a4", "#ffffff", "#ef4135"] },
  { name: "Italy", colors: ["#009246", "#ffffff", "#ce2b37"] },
  // { name: "Brazil", colors: ["#009b3a", "#ffdf00", "#002776"] },
  { name: "UK", colors: ["#012169", "#ffffff", "#c8102e"] },
];

// pusat “gravitasi” bola di kanan layar (x=6)
const HOME_CENTER = new THREE.Vector3(6, 0, 0);

// util: gambar stripes horizontal
function drawHorizontalStripes(ctx: CanvasRenderingContext2D, size: number, colors: string[]) {
  const stripeHeight = size / colors.length;
  colors.forEach((col, index) => {
    ctx.fillStyle = col;
    ctx.fillRect(0, index * stripeHeight, size, stripeHeight);
  });
}

// util: gambar stripes vertikal
function drawVerticalStripes(ctx: CanvasRenderingContext2D, size: number, colors: string[]) {
  const stripeWidth = size / colors.length;
  colors.forEach((col, index) => {
    ctx.fillStyle = col;
    ctx.fillRect(index * stripeWidth, 0, stripeWidth, size);
  });
}

// bikin texture bendera sesuai flag.name
function createFlagTexture(flag: { name: string; colors: string[] } | undefined) {
  if (!flag) return null;

  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const { name, colors } = flag;

  switch (name) {
    case "Indonesia": {
      // merah - putih horizontal
      drawHorizontalStripes(ctx, size, colors);
      break;
    }

    case "Japan": {
      // putih dengan lingkaran merah
      const [bg, circle] = colors;
      ctx.fillStyle = bg ?? "#ffffff";
      ctx.fillRect(0, 0, size, size);

      ctx.fillStyle = circle ?? "#ff0000";
      const radius = size * 0.2;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, radius, 1, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "Germany": {
      // hitam - merah - kuning horizontal
      drawHorizontalStripes(ctx, size, colors);
      break;
    }

    case "France":
    case "Italy": {
      // tricolor vertikal
      drawVerticalStripes(ctx, size, colors);
      break;
    }

    case "USA": {
      // stripes + canton biru + "bintang"
      const [blue, white, red] = colors;
      const stripeCount = 13;
      const stripeHeight = size / stripeCount;

      for (let i = 0; i < stripeCount; i++) {
        ctx.fillStyle = i % 2 === 0 ? (red ?? "#b22234") : (white ?? "#ffffff");
        ctx.fillRect(0, i * stripeHeight, size, stripeHeight);
      }

      const cantonWidth = size * 0.45;
      const cantonHeight = stripeHeight * 7;
      ctx.fillStyle = blue ?? "#3c3b6e";
      ctx.fillRect(0, 0, cantonWidth, cantonHeight);

      // bintang simplifikasi: titik-titik putih
      ctx.fillStyle = white ?? "#ffffff";
      const rows = 5;
      const cols = 6;
      const starRadius = stripeHeight * 0.2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = (c + 0.5) * (cantonWidth / cols);
          const y = (r + 0.5) * (cantonHeight / rows);
          ctx.beginPath();
          ctx.arc(x, y, starRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case "Brazil": {
      // hijau, diamond kuning, lingkaran biru
      ctx.fillStyle = colors[0] ?? "#009b3a"; // hijau
      ctx.fillRect(0, 0, size, size);

      // diamond kuning
      ctx.fillStyle = colors[1] ?? "#ffdf00";
      ctx.beginPath();
      ctx.moveTo(size / 2, size * 0.12);
      ctx.lineTo(size * 0.86, size / 2);
      ctx.lineTo(size / 2, size * 0.88);
      ctx.lineTo(size * 0.14, size / 2);
      ctx.closePath();
      ctx.fill();

      // lingkaran biru
      ctx.fillStyle = colors[2] ?? "#002776";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size * 0.22, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "UK": {
      // background biru
      ctx.fillStyle = colors[0] ?? "#012169";
      ctx.fillRect(0, 0, size, size);

      // white cross
      ctx.fillStyle = colors[1] ?? "#ffffff";
      const crossWidth = size * 0.28;
      const crossEdge = size * 0.09;

      // horizontal
      ctx.fillRect(0, size / 2 - crossWidth / 2, size, crossWidth);
      // vertical
      ctx.fillRect(size / 2 - crossWidth / 2, 0, crossWidth, size);

      // red cross (lebih kecil)
      ctx.fillStyle = colors[2] ?? "#c8102e";
      const redWidth = size * 0.14;
      ctx.fillRect(0, size / 2 - redWidth / 2, size, redWidth);
      ctx.fillRect(size / 2 - redWidth / 2, 0, redWidth, size);

      // (diagonal dibikin simple / bisa ditambah kalau mau super detail)
      break;
    }

    default: {
      // fallback: stripes horizontal dari warna yang ada
      drawHorizontalStripes(ctx, size, colors);
      break;
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function GlobeHero() {
  const [accent, click] = useReducer(
    (state) => (state + 1) % accents.length,
    0
  );
  const connectors = useMemo(() => shuffle(accent), [accent]);

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
       style={{ width: "100%", height: "100%" }}
        flat
        shadows
        onClick={click}
        dpr={[1, 1.5]}
        gl={{ antialias: false }}
        camera={{ position: [3, 0, 26], fov: 24, near: 10, far: 60 }}
      >
        <color attach="background" args={["#020617"]} />

        <ambientLight intensity={0.7} />
        <directionalLight
          position={[12, 10, 10]}
          intensity={1.8}
          castShadow
        />

        <Physics timeStep="vary" gravity={[0, 0, 0]}>
          <Pointer />
          {connectors.map((props, i) => {
            const flag = flagDefinitions[i % flagDefinitions.length];
            return <Sphere key={i} {...props} flag={flag} />;
          })}
        </Physics>

        <Environment resolution={256}>
          <group rotation={[-Math.PI / 3, 0, 1]}>
            <Lightformer
              form="circle"
              intensity={100}
              rotation-x={Math.PI / 2}
              position={[0, 5, -9]}
              scale={2}
            />
            <Lightformer
              form="circle"
              intensity={2}
              rotation-y={Math.PI / 2}
              position={[-5, 1, -1]}
              scale={2}
            />
            <Lightformer
              form="circle"
              intensity={2}
              rotation-y={Math.PI / 2}
              position={[-5, -1, -1]}
              scale={2}
            />
            <Lightformer
              form="circle"
              intensity={2}
              rotation-y={-Math.PI / 2}
              position={[10, 1, 0]}
              scale={8}
            />
            <Lightformer
              form="ring"
              color="#4060ff"
              intensity={80}
              onUpdate={(self) => self.lookAt(0, 0, 0)}
              position={[10, 10, 0]}
              scale={10}
            />
          </group>
        </Environment>

        <Effects />
      </Canvas>
    </div>
  );
}

function Sphere({
  position,
  children,
  vec = new THREE.Vector3(),
  r = THREE.MathUtils.randFloatSpread,
  flag,
  ...props
}) {
  const api = useRef<any>(null);
  const ref = useRef<any>(null);

  // Posisi awal: bias ke kanan (x selalu positif)
  const pos = useMemo(() => {
    const x = Math.abs(r(10)) + 2; // 2–12
    const y = r(8);                // -8–8
    const z = r(10);               // -10–10
    return position || [x, y, z];
  }, []);

  const flagTexture = useMemo(() => createFlagTexture(flag), [flag]);

  useFrame((state, delta) => {
    delta = Math.min(0.1, delta);

    if (api.current) {
      const t = api.current.translation();
      // arah menuju HOME_CENTER (kanan)
      vec
        .set(t.x - HOME_CENTER.x, t.y - HOME_CENTER.y, t.z - HOME_CENTER.z)
        .multiplyScalar(-0.12); // - → dorong ke center
      api.current.applyImpulse(vec);
    }

    // kalau mau bola spinning:
    if (ref.current) {
      ref.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <RigidBody
      linearDamping={4}
      angularDamping={1}
      friction={0.1}
      position={pos}
      ref={api}
      colliders={false}
    >
      <BallCollider args={[1]} />
      <mesh ref={ref} castShadow receiveShadow>
        <sphereGeometry args={[1.2, 64, 64]} />
        <meshStandardMaterial
          // warna base netral, semua pattern dari texture
          color="#ffffff"
          map={flagTexture ?? undefined}
          metalness={props.metalness ?? 0.55}
          roughness={props.roughness ?? 0.25}
        />
        {children}
      </mesh>
    </RigidBody>
  );
}

function Pointer({ vec = new THREE.Vector3() }) {
  const ref = useRef<any>(null);
  useFrame(({ mouse, viewport }) =>
    ref.current?.setNextKinematicTranslation(
      vec.set(
        (mouse.x * viewport.width) / 2,
        (mouse.y * viewport.height) / 2,
        0
      )
    )
  );
  return (
    <RigidBody
      position={[0, 0, 0]}
      type="kinematicPosition"
      colliders={false}
      ref={ref}
    >
      <BallCollider args={[1]} />
    </RigidBody>
  );
}
