import {
  CameraControls,
  ContactShadows,
  Environment,
  Text,
} from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { useChat } from "../hooks/useChat";
import { Avatar } from "./Avatar";

const Dots = (props) => {
  const { loading } = useChat();
  const [loadingText, setLoadingText] = useState("");
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingText((loadingText) => {
          if (loadingText.length > 2) {
            return ".";
          }
          return loadingText + ".";
        });
      }, 800);
      return () => clearInterval(interval);
    } else {
      setLoadingText("");
    }
  }, [loading]);
  if (!loading) return null;
  return (
    <group {...props}>
      <Text fontSize={0.14} anchorX={"left"} anchorY={"bottom"}>
        {loadingText}
        <meshBasicMaterial attach="material" color="white" />
      </Text>
    </group>
  );
};

export const Experience = () => {
  const cameraControls = useRef();
  const { cameraZoomed } = useChat();

  useEffect(() => {
    // Initial camera position - slightly zoomed out to fit the chat UI style
    cameraControls.current.setLookAt(0, 1.8, 4, 0, 1.5, 0);
  }, []);

  useEffect(() => {
    if (cameraZoomed) {
      // Zoomed in for conversation - closer to face
      cameraControls.current.setLookAt(0, 1.5, 1.8, 0, 1.5, 0, true);
    } else {
      // Zoomed out to show full upper body
      cameraControls.current.setLookAt(0, 1.6, 4, 0, 1.0, 0, true);
    }
  }, [cameraZoomed]);
  
  return (
    <>
      <color attach="background" args={["#1a1a1a"]} />
      <CameraControls ref={cameraControls} />
      <Environment preset="night" />
      
      {/* Soft ambient light */}
      <ambientLight intensity={0.5} />
      
      {/* Key light from front */}
      <directionalLight 
        position={[2, 2, 5]} 
        intensity={1.5} 
        color="#ffffff" 
      />
      
      {/* Fill light from side */}
      <pointLight
        position={[-2, 1, 1]}
        intensity={0.4}
        color="#b3c6ff"
      />
      
      {/* Rim light for edge definition */}
      <spotLight
        position={[0, 3, -5]}
        intensity={0.5}
        color="#ffffff"
        distance={7}
      />
      
      {/* Suspense for Dots loading indicator */}
      <Suspense>
        <Dots position-y={1.75} position-x={-0.02} />
      </Suspense>
      
      <Avatar />
      
      {/* Subtle shadow for better grounding */}
      <ContactShadows 
        opacity={0.5} 
        scale={10} 
        blur={1} 
        far={10} 
        resolution={256} 
        color="#000000" 
      />
    </>
  );
};