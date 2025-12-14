import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls, OrbitControls } from '@react-three/drei'
import { Suspense, useMemo, useRef, Component } from 'react'
import { Character } from './components/3d/Character'
import { World } from './components/3d/World'
import { useGameStore } from './stores/useGameStore'
import { getSafeSpawnPosition } from './utils/terrain'

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

  // Calculate safe spawn once
  const spawnPos = useMemo(() => getSafeSpawnPosition(), [])

  return (
    <>
      <Physics debug>
        <World playerPosition={characterRef} />
        <Character ref={characterRef} initialPos={spawnPos} />
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

// Global Error Boundary for the entire App
class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error("Critical App Error:", error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: '#200000', color: 'red', padding: '50px', zIndex: 9999
        }}>
          <h1>CRITICAL ERROR</h1>
          <p>The game crashed. Error details below:</p>
          <pre style={{ backgroundColor: '#400000', padding: '20px', overflow: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', fontSize: '1.2em' }}>
            Reload Game
          </button>
        </div>
      )
    }
    return this.props.children
  }
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
    <GlobalErrorBoundary>
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
    </GlobalErrorBoundary>
  )
}

export default App
