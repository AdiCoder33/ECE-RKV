import React, { useState, Suspense, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, User, Shield, Briefcase, ChevronRight, Building } from 'lucide-react';
import { toast } from 'sonner';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

// 3D primitives for fallback
const Student3D = () => (
  <mesh>
    <boxGeometry args={[1, 1.5, 1]} />
    <meshStandardMaterial color="#b3112eff" />
  </mesh>
);

const HOD3D = () => (
  <mesh>
    <coneGeometry args={[1, 2, 32]} />
    <meshStandardMaterial color="#059669" />
  </mesh>
);

const Admin3D = () => (
  <mesh>
    <torusGeometry args={[1, 0.3, 16, 100]} />
    <meshStandardMaterial color="#f59e42" />
  </mesh>
);

const Alumni3D = () => (
  <mesh>
    <dodecahedronGeometry args={[1]} />
    <meshStandardMaterial color="#a21caf" />
  </mesh>
);

// RGUKT 3D logo loader with spinning and color change, no user flipping
const RGUKTLogo3D = () => {
  const gltf = useLoader(GLTFLoader, '/src/Assets/rgukt-v1.glb');
  const logoRef = useRef();

  // Always spin the logo
  useFrame(() => {
    if (logoRef.current) {
      // @ts-ignore
      logoRef.current.rotation.y += 0.02;
    }
  });

  // Change color of all mesh materials to match website theme (red-700 and yellow-400)
  React.useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child: any) => {
        if (child.isMesh && child.material) {
          // Use a gradient or two colors for more branding effect
          child.material.color.set('#b91c1c'); // Tailwind red-700
          if (child.material.name && child.material.name.toLowerCase().includes('accent')) {
            child.material.color.set('#facc15'); // Tailwind yellow-400
          }
        }
      });
    }
  }, [gltf]);

  return <primitive object={gltf.scene} scale={2.2} ref={logoRef} />;
};

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4 transition-colors">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-700">Department of ECE</h1>
          <p className="text-gray-500 dark:text-gray-400">Academic Portal & Management System</p>
        </div>

        <Card className="flex flex-col md:flex-row shadow-lg overflow-hidden dark:bg-gray-800 border-none">
          {/* Left side with animated logo/image or 3D model */}
          <div className="md:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 transition-colors">
            <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in transition-transform duration-500 w-full">
              <div className="h-32 w-32 md:h-48 md:w-48">
                <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
                  <ambientLight intensity={0.7} />
                  <directionalLight position={[2, 2, 2]} />
                  <OrbitControls enableZoom={false} enableRotate={false} /> {/* Prevent user flipping */}
                  <Suspense fallback={null}>
                    <RGUKTLogo3D />
                  </Suspense>
                </Canvas>
              </div>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300 mt-2">
                
              </p>
            </div>
          </div>

          {/* Right side with the login form */}
          <div className="md:w-1/2 p-8 flex items-center dark:bg-gray-800">
            <div className="w-full">
              <CardHeader className="p-0 mb-6">
                <CardTitle className="text-2xl font-bold text-red-700">Sign In</CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">Enter your credentials to access the portal</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="transition-all duration-300 focus:border-red-700 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="transition-all duration-300 focus:border-red-700 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-red-700 hover:bg-red-800 transition-colors duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing In...
                      </div>
                    ) : (
                      <span className="flex items-center justify-center">
                        Sign In <ChevronRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </span>
                    )}
                  </Button>
                </form>
              </CardContent>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;