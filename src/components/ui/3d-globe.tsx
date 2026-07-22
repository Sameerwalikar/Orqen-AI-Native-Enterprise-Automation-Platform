import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { cn } from "@/lib/utils";

export interface GlobeMarker {
  lat: number;
  lng: number;
  src: string;
  label?: string;
  size?: number;
}

export interface Globe3DConfig {
  radius?: number;
  globeColor?: string;
  textureUrl?: string;
  bumpMapUrl?: string;
  showAtmosphere?: boolean;
  atmosphereColor?: string;
  atmosphereIntensity?: number;
  atmosphereBlur?: number;
  bumpScale?: number;
  autoRotateSpeed?: number;
  enableZoom?: boolean;
  enablePan?: boolean;
  minDistance?: number;
  maxDistance?: number;
  initialRotation?: { x: number; y: number };
  markerSize?: number;
}

export interface Globe3DProps {
  markers?: GlobeMarker[];
  config?: Globe3DConfig;
  className?: string;
  onMarkerClick?: (marker: GlobeMarker) => void;
  onMarkerHover?: (marker: GlobeMarker | null) => void;
}

const DEFAULT_TEXTURE =
  "https://unpkg.com/three-globe@2.31.1/example/img/earth-blue-marble.jpg";
const DEFAULT_BUMP =
  "https://unpkg.com/three-globe@2.31.1/example/img/earth-topology.png";

function latLngToVector3(lat: number, lng: number, radius: number) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function GlobeSphere({
  config,
  markers,
  onMarkerClick,
  onMarkerHover,
}: {
  config: Required<Globe3DConfig>;
  markers: GlobeMarker[];
  onMarkerClick?: (marker: GlobeMarker) => void;
  onMarkerHover?: (marker: GlobeMarker | null) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const texture = useLoader(THREE.TextureLoader, config.textureUrl);
  const bumpMap = useLoader(THREE.TextureLoader, config.bumpMapUrl);

  useFrame(() => {
    if (groupRef.current && config.autoRotateSpeed > 0) {
      groupRef.current.rotation.y += config.autoRotateSpeed * 0.0025;
    }
  });

  const markerNodes = useMemo(
    () =>
      markers.map((marker) => ({
        marker,
        position: latLngToVector3(marker.lat, marker.lng, config.radius * 1.02),
      })),
    [config.radius, markers],
  );

  return (
    <group ref={groupRef} rotation={[config.initialRotation.x, config.initialRotation.y, 0]}>
      <mesh>
        <sphereGeometry args={[config.radius, 64, 64]} />
        <meshStandardMaterial
          map={texture}
          bumpMap={bumpMap}
          bumpScale={config.bumpScale * 0.001}
          color={config.globeColor}
          roughness={0.85}
          metalness={0.08}
        />
      </mesh>

      {config.showAtmosphere && (
        <mesh scale={[1.04, 1.04, 1.04]}>
          <sphereGeometry args={[config.radius, 48, 48]} />
          <meshBasicMaterial
            color={config.atmosphereColor}
            transparent
            opacity={Math.min(config.atmosphereIntensity * 0.012, 0.22)}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {markerNodes.map(({ marker, position }) => (
        <Html key={`${marker.lat}-${marker.lng}`} position={position} center distanceFactor={8.5}>
          <button
            type="button"
            className={cn(
              "group relative flex items-center justify-center rounded-full border border-white/70 bg-white/95 shadow-[0_8px_24px_rgba(0,0,0,.18)] transition-transform duration-300 hover:scale-110",
              hoveredLabel === marker.label ? "scale-110" : "",
            )}
            style={{
              width: marker.size ?? config.markerSize,
              height: marker.size ?? config.markerSize,
            }}
            onClick={() => onMarkerClick?.(marker)}
            onMouseEnter={() => {
              setHoveredLabel(marker.label ?? null);
              onMarkerHover?.(marker);
            }}
            onMouseLeave={() => {
              setHoveredLabel(null);
              onMarkerHover?.(null);
            }}
          >
            <img
              src={marker.src}
              alt={marker.label ?? "Team member"}
              className="h-full w-full rounded-full object-cover"
            />
            {marker.label && hoveredLabel === marker.label && (
              <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#1c1a1d] px-2.5 py-1 text-[9px] font-medium tracking-wide text-white">
                {marker.label}
              </span>
            )}
          </button>
        </Html>
      ))}
    </group>
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 2, 4]} intensity={1.1} />
      <directionalLight position={[-3, -1, -2]} intensity={0.35} color="#d8d0c8" />
    </>
  );
}

function ResponsiveCamera({ radius }: { radius: number }) {
  const { camera, size } = useThree();

  useEffect(() => {
    const aspect = size.width / size.height;
    const distance = radius * (aspect < 1 ? 3.4 : 2.8);
    camera.position.set(0, 0.15, distance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }, [camera, radius, size.height, size.width]);

  return null;
}

export function Globe3D({
  markers = [],
  config = {},
  className,
  onMarkerClick,
  onMarkerHover,
}: Globe3DProps) {
  const resolvedConfig = {
    radius: config.radius ?? 1.2,
    globeColor: config.globeColor ?? "#ffffff",
    textureUrl: config.textureUrl ?? DEFAULT_TEXTURE,
    bumpMapUrl: config.bumpMapUrl ?? DEFAULT_BUMP,
    showAtmosphere: config.showAtmosphere ?? true,
    atmosphereColor: config.atmosphereColor ?? "#8a8580",
    atmosphereIntensity: config.atmosphereIntensity ?? 12,
    atmosphereBlur: config.atmosphereBlur ?? 1,
    bumpScale: config.bumpScale ?? 5,
    autoRotateSpeed: config.autoRotateSpeed ?? 0.3,
    enableZoom: config.enableZoom ?? false,
    enablePan: config.enablePan ?? false,
    minDistance: config.minDistance ?? 2.8,
    maxDistance: config.maxDistance ?? 4.2,
    initialRotation: config.initialRotation ?? { x: 0.18, y: -0.6 },
    markerSize: config.markerSize ?? 28,
  } as Required<Globe3DConfig>;

  return (
    <div className={cn("relative h-full min-h-[360px] w-full", className)}>
      <Canvas
        dpr={[1, 1.75]}
        camera={{ fov: 42, near: 0.1, far: 100, position: [0, 0.15, 3.4] }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <SceneLighting />
          <ResponsiveCamera radius={resolvedConfig.radius} />
          <GlobeSphere
            config={resolvedConfig}
            markers={markers}
            onMarkerClick={onMarkerClick}
            onMarkerHover={onMarkerHover}
          />
          <OrbitControls
            enablePan={resolvedConfig.enablePan}
            enableZoom={resolvedConfig.enableZoom}
            minDistance={resolvedConfig.minDistance}
            maxDistance={resolvedConfig.maxDistance}
            autoRotate={resolvedConfig.autoRotateSpeed > 0}
            autoRotateSpeed={resolvedConfig.autoRotateSpeed}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
