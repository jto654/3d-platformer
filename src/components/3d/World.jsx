import { Sky, Stars, Cloud } from '@react-three/drei'
import { ChunkManager } from './ChunkManager'

export function World({ playerPosition }) {
    // Static objects (Water, Clouds) can stay global or also be chunked.
    // For now, let's make water global and huge.

    return (
        <group>
            <Sky sunPosition={[100, 20, 100]} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Cloud position={[-10, 50, -10]} opacity={0.5} speed={0.2} />
            <Cloud position={[50, 60, 50]} opacity={0.5} speed={0.2} />

            <ChunkManager playerPos={playerPosition} />

            {/* Infinite Water Plane (Visual only, below terrain) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.1, 0]}>
                <planeGeometry args={[10000, 10000]} />
                <meshStandardMaterial color="#0077be" transparent opacity={0.8} />
            </mesh>
        </group>
    )
}
