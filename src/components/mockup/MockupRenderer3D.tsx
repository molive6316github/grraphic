import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  ContactShadows, 
  PerspectiveCamera,
  useTexture,
  RoundedBox,
  Text,
  Float,
  Sparkles,
  MeshReflectorMaterial,
  Center
} from '@react-three/drei';
import * as THREE from 'three';

interface MockupRenderer3DProps {
  type: 'phone' | 'laptop' | 'tablet' | 'monitor' | 'watch' | 'tv' | 'box' | 'card' | 'book' | 'mug' | 'tshirt' | 'billboard';
  screenImage?: string;
  backgroundColor?: string;
  environment?: 'studio' | 'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'city' | 'park' | 'lobby';
  autoRotate?: boolean;
  showShadows?: boolean;
  showSparkles?: boolean;
}

// Phone 3D Model
function Phone({ screenImage }: { screenImage?: string }) {
  const texture = screenImage ? useTexture(screenImage) : null;
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={meshRef}>
        {/* Phone body */}
        <RoundedBox args={[2.4, 5, 0.3]} radius={0.15} smoothness={4}>
          <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
        </RoundedBox>
        
        {/* Screen */}
        <mesh position={[0, 0, 0.16]}>
          <planeGeometry args={[2.2, 4.6]} />
          {texture ? (
            <meshBasicMaterial map={texture} />
          ) : (
            <meshStandardMaterial color="#0f0f1a" emissive="#1a1a3e" emissiveIntensity={0.3} />
          )}
        </mesh>
        
        {/* Camera notch */}
        <mesh position={[0, 2.1, 0.16]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 32]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#0a0a15" />
        </mesh>
        
        {/* Side buttons */}
        <mesh position={[-1.25, 0.5, 0]}>
          <boxGeometry args={[0.05, 0.4, 0.1]} />
          <meshStandardMaterial color="#2a2a4e" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
    </Float>
  );
}

// Laptop 3D Model
function Laptop({ screenImage }: { screenImage?: string }) {
  const texture = screenImage ? useTexture(screenImage) : null;
  const [openAngle] = useState(-25);
  
  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.3}>
      <group rotation={[0, 0, 0]} position={[0, -0.5, 0]}>
        {/* Base */}
        <RoundedBox args={[6, 0.15, 4]} radius={0.05} position={[0, 0, 0]}>
          <meshStandardMaterial color="#2a2a3e" metalness={0.7} roughness={0.3} />
        </RoundedBox>
        
        {/* Keyboard area */}
        <mesh position={[0, 0.08, 0.3]}>
          <boxGeometry args={[5.5, 0.02, 2.5]} />
          <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.5} />
        </mesh>
        
        {/* Trackpad */}
        <mesh position={[0, 0.085, 1.2]}>
          <boxGeometry args={[2, 0.01, 1.2]} />
          <meshStandardMaterial color="#252535" metalness={0.6} roughness={0.4} />
        </mesh>
        
        {/* Screen lid */}
        <group position={[0, 0.075, -2]} rotation={[THREE.MathUtils.degToRad(openAngle), 0, 0]}>
          <RoundedBox args={[6, 4, 0.12]} radius={0.05} position={[0, 2, 0]}>
            <meshStandardMaterial color="#2a2a3e" metalness={0.7} roughness={0.3} />
          </RoundedBox>
          
          {/* Screen */}
          <mesh position={[0, 2, 0.07]}>
            <planeGeometry args={[5.6, 3.5]} />
            {texture ? (
              <meshBasicMaterial map={texture} />
            ) : (
              <meshStandardMaterial color="#0a0a15" emissive="#1a1a3e" emissiveIntensity={0.2} />
            )}
          </mesh>
          
          {/* Webcam */}
          <mesh position={[0, 3.85, 0.07]}>
            <cylinderGeometry args={[0.04, 0.04, 0.02, 32]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#0a0a15" />
          </mesh>
        </group>
      </group>
    </Float>
  );
}

// Monitor 3D Model
function Monitor({ screenImage }: { screenImage?: string }) {
  const texture = screenImage ? useTexture(screenImage) : null;
  
  return (
    <Float speed={1} rotationIntensity={0.05} floatIntensity={0.2}>
      <group>
        {/* Screen frame */}
        <RoundedBox args={[8, 5, 0.3]} radius={0.1} position={[0, 2.5, 0]}>
          <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
        </RoundedBox>
        
        {/* Screen */}
        <mesh position={[0, 2.5, 0.16]}>
          <planeGeometry args={[7.6, 4.5]} />
          {texture ? (
            <meshBasicMaterial map={texture} />
          ) : (
            <meshStandardMaterial color="#0a0a15" emissive="#1a1a3e" emissiveIntensity={0.2} />
          )}
        </mesh>
        
        {/* Stand neck */}
        <mesh position={[0, 0.3, -0.3]}>
          <boxGeometry args={[0.4, 0.6, 0.4]} />
          <meshStandardMaterial color="#2a2a4e" metalness={0.9} roughness={0.3} />
        </mesh>
        
        {/* Stand base */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
          <meshStandardMaterial color="#2a2a4e" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>
    </Float>
  );
}

// 3D Box/Package
function ProductBox({ screenImage }: { screenImage?: string }) {
  const texture = screenImage ? useTexture(screenImage) : null;
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={meshRef}>
        <RoundedBox args={[3, 4, 2]} radius={0.05}>
          {texture ? (
            <meshStandardMaterial map={texture} />
          ) : (
            <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.8} />
          )}
        </RoundedBox>
      </group>
    </Float>
  );
}

// Business Card
function BusinessCard({ screenImage }: { screenImage?: string }) {
  const texture = screenImage ? useTexture(screenImage) : null;
  
  return (
    <Float speed={3} rotationIntensity={0.4} floatIntensity={0.6}>
      <group rotation={[0.2, 0.3, 0]}>
        <RoundedBox args={[3.5, 2, 0.02]} radius={0.02}>
          {texture ? (
            <meshStandardMaterial map={texture} />
          ) : (
            <meshStandardMaterial color="#ffffff" metalness={0.1} roughness={0.3} />
          )}
        </RoundedBox>
      </group>
    </Float>
  );
}

// T-Shirt
function TShirt({ screenImage }: { screenImage?: string }) {
  const texture = screenImage ? useTexture(screenImage) : null;
  
  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.4}>
      <group>
        {/* Body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3, 3.5, 0.3]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
        
        {/* Print area */}
        <mesh position={[0, 0.3, 0.16]}>
          <planeGeometry args={[2, 2]} />
          {texture ? (
            <meshBasicMaterial map={texture} transparent />
          ) : (
            <meshStandardMaterial color="#f0f0f0" />
          )}
        </mesh>
        
        {/* Left sleeve */}
        <mesh position={[-2, 1, 0]} rotation={[0, 0, 0.4]}>
          <boxGeometry args={[1.5, 1.2, 0.25]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
        
        {/* Right sleeve */}
        <mesh position={[2, 1, 0]} rotation={[0, 0, -0.4]}>
          <boxGeometry args={[1.5, 1.2, 0.25]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
        
        {/* Collar */}
        <mesh position={[0, 1.7, 0]}>
          <torusGeometry args={[0.5, 0.15, 8, 32, Math.PI]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      </group>
    </Float>
  );
}

// Reflective floor
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
      <planeGeometry args={[50, 50]} />
      <MeshReflectorMaterial
        blur={[300, 100]}
        resolution={1024}
        mixBlur={1}
        mixStrength={50}
        roughness={1}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color="#0a0a15"
        metalness={0.5}
        mirror={0.5}
      />
    </mesh>
  );
}

// Loading fallback
function Loader() {
  return (
    <Center>
      <Text fontSize={0.5} color="#666">
        Loading 3D...
      </Text>
    </Center>
  );
}

export function MockupRenderer3D({
  type,
  screenImage,
  backgroundColor = '#0a0a15',
  environment = 'studio',
  autoRotate = true,
  showShadows = true,
  showSparkles = false
}: MockupRenderer3DProps) {
  const renderMockup = () => {
    switch (type) {
      case 'phone':
        return <Phone screenImage={screenImage} />;
      case 'laptop':
        return <Laptop screenImage={screenImage} />;
      case 'monitor':
      case 'tv':
        return <Monitor screenImage={screenImage} />;
      case 'box':
        return <ProductBox screenImage={screenImage} />;
      case 'card':
        return <BusinessCard screenImage={screenImage} />;
      case 'tshirt':
        return <TShirt screenImage={screenImage} />;
      default:
        return <Phone screenImage={screenImage} />;
    }
  };

  return (
    <div className="w-full h-full" style={{ background: backgroundColor }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 2, 10]} fov={45} />
        
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Suspense fallback={<Loader />}>
          {renderMockup()}
          
          {showShadows && <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={20} blur={2} far={4} />}
          {showShadows && <Floor />}
          
          {showSparkles && <Sparkles count={100} scale={10} size={2} speed={0.4} />}
          
          <Environment preset={environment as any} />
        </Suspense>
        
        <OrbitControls
          autoRotate={autoRotate}
          autoRotateSpeed={1}
          enablePan={false}
          minDistance={5}
          maxDistance={20}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}

export default MockupRenderer3D;
