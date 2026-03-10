import React, { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { 
  Float, 
  Environment, 
  MeshTransmissionMaterial, 
  Sparkles, 
  RoundedBox, 
  ContactShadows,
  PresentationControls,
  Preload
} from "@react-three/drei";
import * as THREE from "three";

// Reusable configurations for beautiful frosted glass
const getGlassMaterialProps = () => ({
  transmission: 0.95,
  thickness: 2,
  roughness: 0.08,
  ior: 1.5,
  chromaticAberration: 0.04,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
});

// Interactive wrapper to make objects scale up and show a pointer cursor on hover
const InteractiveElement = ({ children, scaleMultiplier = 1.08 }) => {
  const ref = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const targetScale = hovered ? scaleMultiplier : 1;
    ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 8);
  });

  return (
    <group 
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {children}
    </group>
  );
};

// 1. Live Stage and Sound Systems (Central Anchor)
const StageAndAudio = ({ isDark }) => {
  const glassMaterialProps = {
    ...getGlassMaterialProps(),
    color: isDark ? "#121318" : "#ffffff",
    attenuationColor: "#fccb00",
    attenuationDistance: 4,
  };

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <InteractiveElement>
        {/* Main Stage Circular Platform */}
        <mesh position={[0, -1, 0]}>
          <cylinderGeometry args={[2.5, 2.5, 0.2, 64]} />
          <MeshTransmissionMaterial {...glassMaterialProps} />
        </mesh>
        
        {/* Stage Glowing LED Edge */}
        <mesh position={[0, -0.9, 0]}>
          <torusGeometry args={[2.5, 0.02, 16, 64]} />
          <meshStandardMaterial color="#fccb00" emissive="#fccb00" emissiveIntensity={1} />
        </mesh>

        {/* Abstract Interactive Installation (Hologram on Stage) */}
        <mesh position={[0, -0.2, 0]}>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#fccb00" wireframe transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#fccb00" emissive="#fccb00" emissiveIntensity={0.8} />
        </mesh>

        {/* Left Line-Array Speaker */}
        <group position={[-1.8, -0.2, 0.8]} rotation={[0, Math.PI / 6, 0]}>
          <RoundedBox args={[0.5, 1.4, 0.4]} radius={0.05}>
            <meshStandardMaterial color={isDark ? "#0d0e12" : "#f4f6f9"} metalness={0.6} roughness={0.2} />
          </RoundedBox>
          <mesh position={[0, 0.3, 0.21]}>
            <circleGeometry args={[0.15, 32]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0, -0.3, 0.21]}>
            <circleGeometry args={[0.2, 32]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>

        {/* Right Line-Array Speaker */}
        <group position={[1.8, -0.2, 0.8]} rotation={[0, -Math.PI / 6, 0]}>
          <RoundedBox args={[0.5, 1.4, 0.4]} radius={0.05}>
            <meshStandardMaterial color={isDark ? "#0d0e12" : "#f4f6f9"} metalness={0.6} roughness={0.2} />
          </RoundedBox>
          <mesh position={[0, 0.3, 0.21]}>
            <circleGeometry args={[0.15, 32]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh position={[0, -0.3, 0.21]}>
            <circleGeometry args={[0.2, 32]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        </group>
      </InteractiveElement>
    </Float>
  );
};

// 2. Ticketing and Registration Kiosk
const TicketingKiosk = ({ isDark }) => {
  const glassMaterialProps = {
    ...getGlassMaterialProps(),
    color: isDark ? "#121318" : "#ffffff",
  };

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group position={[3.5, -0.5, -1]} rotation={[0, -0.5, 0]}>
        <InteractiveElement scaleMultiplier={1.12}>
          {/* Kiosk Stand Pole */}
          <mesh position={[0, -0.6, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.2, 16]} />
            <meshStandardMaterial color={isDark ? "#222" : "#ccc"} metalness={0.8} />
          </mesh>
          {/* Base Plate */}
          <mesh position={[0, -1.2, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.05, 32]} />
            <meshStandardMaterial color={isDark ? "#222" : "#ccc"} metalness={0.8} />
          </mesh>

          {/* Kiosk Floating Touch Screen */}
          <group position={[0, 0.2, 0]} rotation={[Math.PI / 6, 0, 0]}>
            <RoundedBox args={[1.2, 0.8, 0.1]} radius={0.05}>
              <MeshTransmissionMaterial {...glassMaterialProps} />
            </RoundedBox>
            
            {/* Screen UI Output */}
            <mesh position={[0, 0, 0.06]}>
              <planeGeometry args={[1.0, 0.6]} />
              <meshStandardMaterial color={isDark ? "#08090b" : "#e6e8eb"} />
            </mesh>
            {/* Simulated QR Code / App Graphics */}
            <mesh position={[-0.2, 0.1, 0.07]}>
              <planeGeometry args={[0.4, 0.2]} />
              <meshStandardMaterial color="#fccb00" />
            </mesh>
            <mesh position={[0.2, -0.1, 0.07]}>
              <planeGeometry args={[0.3, 0.05]} />
              <meshStandardMaterial color={isDark ? "#fff" : "#111"} />
            </mesh>
          </group>
        </InteractiveElement>
      </group>
    </Float>
  );
};

// 3. Event Signage and Banners
const EventSignage = ({ isDark }) => {
  const glassMaterialProps = {
    ...getGlassMaterialProps(),
    color: isDark ? "#1a1a24" : "#f0f2f5",
  };

  return (
    <Float speed={1.8} rotationIntensity={0.4} floatIntensity={0.8}>
      <group position={[-3.5, 0, -2]} rotation={[0, 0.4, 0]}>
        <InteractiveElement scaleMultiplier={1.1}>
          {/* Heavy Banner Stand Base */}
          <mesh position={[0, -1.4, 0]}>
            <boxGeometry args={[1.2, 0.1, 0.4]} />
            <meshStandardMaterial color={isDark ? "#111" : "#ddd"} metalness={0.6} />
          </mesh>

          {/* Vertical Glass Signage Panel */}
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[1.0, 3.0, 0.05]} />
            <MeshTransmissionMaterial {...glassMaterialProps} />
          </mesh>

          {/* Gold Accent Top Strip */}
          <mesh position={[0, 1.5, 0]}>
            <boxGeometry args={[1.0, 0.1, 0.06]} />
            <meshStandardMaterial color="#fccb00" />
          </mesh>

          {/* Abstract Typography and Graphics on Banner */}
          <group position={[0, 0.6, 0.03]}>
            <mesh position={[0, 0, 0]}>
              <circleGeometry args={[0.2, 32]} />
              <meshStandardMaterial color="#fccb00" />
            </mesh>
            <mesh position={[0, -0.4, 0]}>
              <planeGeometry args={[0.6, 0.05]} />
              <meshStandardMaterial color={isDark ? "#fff" : "#333"} />
            </mesh>
            <mesh position={[0, -0.6, 0]}>
              <planeGeometry args={[0.4, 0.03]} />
              <meshStandardMaterial color={isDark ? "#888" : "#999"} />
            </mesh>
          </group>
        </InteractiveElement>
      </group>
    </Float>
  );
};

// 4. Furniture and Seating (VIP Lounge)
const VIPLoungeSeating = ({ isDark }) => {
  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.4}>
      <group position={[-2, -1.2, 3]} rotation={[0, 0.8, 0]}>
        <InteractiveElement scaleMultiplier={1.12}>
          {/* Swivel Chair Chrome Base */}
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.3, 0.05, 0.5, 32]} />
            <meshStandardMaterial color={isDark ? "#222" : "#ccc"} metalness={0.8} />
          </mesh>

          {/* Premium Glass / Leather Seat Cushion */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 0.1, 32]} />
            <meshStandardMaterial color={isDark ? "#1a1a24" : "#ffffff"} />
          </mesh>
          
          {/* Glowing Trim */}
          <mesh position={[0, 0, 0]}>
            <torusGeometry args={[0.4, 0.015, 16, 32]} />
            <meshStandardMaterial color="#fccb00" emissive="#fccb00" emissiveIntensity={0.5} />
          </mesh>

          {/* Translucent Modern Backrest */}
          <mesh position={[0, 0.35, -0.3]} rotation={[-0.2, 0, 0]}>
            <boxGeometry args={[0.8, 0.6, 0.05]} />
            <MeshTransmissionMaterial {...getGlassMaterialProps()} color={isDark ? "#121318" : "#ffffff"} />
          </mesh>
        </InteractiveElement>
      </group>
    </Float>
  );
};


// Persistent global container for the canvas to prevent re-compilation lag
const globalSceneEl = document.createElement("div");
globalSceneEl.style.position = "absolute";
globalSceneEl.style.top = "0";
globalSceneEl.style.left = "0";
globalSceneEl.style.width = "100%";
globalSceneEl.style.height = "100%";
globalSceneEl.style.zIndex = "0";

let globalRoot = null;

const GlobalCanvasRenderer = ({ isDark, bgColor }) => (
  <Canvas 
    camera={{ position: [0, 1.5, 11], fov: 42 }}
    gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping, powerPreference: "high-performance" }}
    dpr={[1, 1.5]}
  >
    <color attach="background" args={[bgColor]} />
    <fog attach="fog" args={[bgColor, 8, 22]} />
    
    <ambientLight intensity={isDark ? 0.4 : 0.8} />
    
    {/* Main studio rim light */}
    <directionalLight 
      position={[5, 10, 5]} 
      intensity={isDark ? 2 : 2.5} 
      color="#ffffff" 
    />
    
    {/* Dramatic gold stage light */}
    <spotLight 
      position={[-10, 5, 5]} 
      intensity={isDark ? 5 : 3} 
      color="#fccb00" 
      penumbra={0.8}
      distance={30}
    />

    <Suspense fallback={null}>
      {/* Global drag-to-rotate presentation physics */}
      <PresentationControls 
        global 
        config={{ mass: 1, tension: 170, friction: 26 }} 
        snap={{ mass: 2, tension: 200 }} 
        rotation={[0.1, 0, 0]} 
        polar={[-Math.PI / 8, Math.PI / 8]} 
        azimuth={[-Math.PI / 6, Math.PI / 6]}
      >
        {/* Render our specific Event Components */}
        <StageAndAudio isDark={isDark} />
        <TicketingKiosk isDark={isDark} />
        <EventSignage isDark={isDark} />
        <VIPLoungeSeating isDark={isDark} />
      </PresentationControls>

      {/* Studio atmosphere (Light dust / particles) */}
      <Sparkles 
        count={50} 
        scale={16} 
        size={isDark ? 5 : 3} 
        speed={0.2} 
        opacity={isDark ? 0.4 : 0.2} 
        color="#fccb00"
      />

      {/* Environment map ensures glass items refract metallic light heavily */}
      <Environment preset="city" />

      {/* Cinematic Floor Grounding Shadow */}
      <ContactShadows 
        position={[0, -2.5, 0]} 
        opacity={isDark ? 0.8 : 0.2} 
        scale={30} 
        blur={2.5} 
        far={10} 
        color="#000000"
      />
      <Preload all />
    </Suspense>
  </Canvas>
);

const renderGlobalScene = (isDark, bgColor) => {
  // Use createRoot dynamically if it hasn't been created yet
  if (!globalRoot) {
    // Dynamic require so we don't break earlier react imports if not available
    const { createRoot } = require("react-dom/client");
    globalRoot = createRoot(globalSceneEl);
  }
  globalRoot.render(<GlobalCanvasRenderer isDark={isDark} bgColor={bgColor} />);
};

const HeroBackground = ({ theme = "dark" }) => {
  const containerRef = useRef();
  const isDark = theme === "dark";
  const bgColor = isDark ? "#08090b" : "#f7f8fa";

  React.useEffect(() => {
    renderGlobalScene(isDark, bgColor);
  }, [isDark, bgColor]);

  React.useEffect(() => {
    if (containerRef.current) {
        containerRef.current.appendChild(globalSceneEl);
    }
    return () => {
        if (globalSceneEl.parentNode) {
            globalSceneEl.parentNode.removeChild(globalSceneEl);
        }
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 0,
        background: bgColor,
        transition: "background 0.5s ease"
      }}
      className="hero-3d-canvas-container"
    >
      {/* Vignette edge blending */}
      <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at center, transparent 30%, ${bgColor} 100%)`,
          pointerEvents: 'none',
          zIndex: 1
      }} />
    </div>
  );
};

export default HeroBackground;
