import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls, OrbitControls } from '@react-three/drei'
import { Suspense, useMemo, useRef } from 'react'
import { Character } from './components/3d/Character'
import { World } from './components/3d/World'
import { useGameStore } from './stores/useGameStore'

export const Controls = {
  forward: 'forward',
  back: 'back',
  left: 'left',
  right: 'right',
  rotateLeft: 'rotateLeft',
  rotateRight: 'rotateRight',
  jump: 'jump',
  run: 'run',
  mouseLook: 'mouseLook'
}

function Scene() {
  const mouseLookEnabled = useGameStore((state) => state.mouseLookEnabled)
  const characterRef = useRef()

  return (
    <>
      <Physics debug>
        <World playerPosition={characterRef} />
        <Character ref={characterRef} />
      </Physics>

      <ambientLight intensity={0.4} />
      <directionalLight
        position={[20, 30, 20]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {mouseLookEnabled && <OrbitControls makeDefault />}
    </>
  )
}

function App() {
  const map = useMemo(() => [
    { name: Controls.forward, keys: ['KeyW'] },
    { name: Controls.back, keys: ['KeyS'] },
    { name: Controls.left, keys: ['KeyA'] },
    { name: Controls.right, keys: ['KeyD'] },
    { name: Controls.rotateLeft, keys: ['ArrowLeft'] },
    { name: Controls.rotateRight, keys: ['ArrowRight'] },
    { name: Controls.jump, keys: ['Space'] },
    { name: Controls.run, keys: ['ShiftLeft'] },
    { name: Controls.mouseLook, keys: ['ShiftRight'] }
  ], [])

  return (
    <KeyboardControls map={map}>
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
        <color attach="background" args={['#87CEEB']} />
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>

      {/* HUD / Instructions */}
      <div style={{ position: 'absolute', top: 20, left: 20, color: 'white', pointerEvents: 'none' }}>
        <h2>Aetheria Controls</h2>
        <p>WASD: Move</p>
        <p>Arrows: Rotate Camera/Char</p>
        <p>Space: Jump</p>
        <p>Shift (Left): Run</p>
        <p>Shift (Right): Toggle Mouse Look</p>
      </div>
    </KeyboardControls>
  )
}

export default App
