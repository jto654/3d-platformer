import { RigidBody } from '@react-three/rapier'
import { Sky, Stars, Cloud, useTexture } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { createNoise2D } from 'simplex-noise'

const noise2D = createNoise2D()

function Tree({ position }) {
    return (
        <group position={position}>
            {/* Trunk */}
            <mesh position={[0, 1, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.2, 0.4, 2, 8]} />
                <meshStandardMaterial color="#5c4033" />
            </mesh>
            {/* Leaves */}
            <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
                <coneGeometry args={[1.5, 3, 8]} />
                <meshStandardMaterial color="#2d4c1e" />
            </mesh>
        </group>
    )
}

function Terrain() {
    const { geometry } = useMemo(() => {
        const width = 100
        const depth = 100
        const segments = 128

        const geo = new THREE.PlaneGeometry(width, depth, segments, segments)
        const posAttribute = geo.attributes.position
        const vertex = new THREE.Vector3()

        // Add color attribute
        const count = posAttribute.count
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
        const colorAttribute = geo.attributes.color

        for (let i = 0; i < count; i++) {
            vertex.fromBufferAttribute(posAttribute, i)

            // --- Height Generation ---
            const f = 0.05
            let h = noise2D(vertex.x * f, vertex.y * f) * 2

            // Edge Mountains
            const dist = Math.sqrt(vertex.x * vertex.x + vertex.y * vertex.y)
            if (dist > 30) {
                h += (dist - 30) * 0.8 * Math.abs(noise2D(vertex.x * 0.1, vertex.y * 0.1)) * 3
            }

            // Plateau / Cliffs (stepped height)
            if (dist > 20 && dist < 40 && noise2D(vertex.x * 0.2, vertex.y * 0.2) > 0.5) {
                h += 2; // Instant cliff
            }

            // Flatten center
            if (dist < 10) h *= 0.1

            posAttribute.setZ(i, h)

            // --- Color Generation ---
            // 1. Base Biome
            const color = new THREE.Color()

            if (h < 0.5) {
                color.set('#e0c9a6') // Sand
            } else if (h > 10) {
                color.set('#808080') // Rock
            } else {
                color.set('#4a6b3a') // Grass
            }

            // 2. Paths (Brown) via Path Noise
            // A "path" is where pathNoise is close to 0 (sinuous lines)
            const pathVal = noise2D(vertex.x * 0.03 + 100, vertex.y * 0.03 + 100)
            if (Math.abs(pathVal) < 0.05 && h < 8 && h > 0.5) {
                color.set('#8B5A2B') // Brown Path
                // Flatten path a bit
                // posAttribute.setZ(i, h * 0.8) // Ideally paths are flatter
            }

            // 3. Slope based Rock (if neighbor diff is high)
            // Hard to calculate exactly here without normals first, but we can approximate or just leave it.
            // Let's stick to height/noise based.

            colorAttribute.setXYZ(i, color.r, color.g, color.b)
        }

        geo.computeVertexNormals()
        return { geometry: geo }
    }, [])

    return (
        <RigidBody type="fixed" colliders="trimesh">
            <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} receiveShadow castShadow>
                <meshStandardMaterial vertexColors roughness={0.8} />
            </mesh>
        </RigidBody>
    )
}

export function World() {
    // Generate random tree positions
    const trees = useMemo(() => {
        const items = []
        for (let i = 0; i < 50; i++) {
            const angle = Math.random() * Math.PI * 2
            const rad = 15 + Math.random() * 30
            const x = Math.cos(angle) * rad
            const z = Math.sin(angle) * rad
            // Simple height approx or raycast. For now place at specific Y or let them clip
            // We really need to know the height at (x,z).
            // For simplicity, we just look at our noise function logic or just place them high and let them not fall (they are visual only mostly unless we add RB)
            // Let's manually invoke noise logic again approx
            const f = 0.05
            let h = noise2D(x * f, y_is_z_in_noise(z) * f) * 2 // Wait, careful with coords
            // It's just visual decoration for now, can be improved.
            items.push({ pos: [x, 0, z] }) // Y will be fixed for now, might clip
        }
        return items
    }, [])

    // Helper to get noise height for placement
    const getH = (x, z) => {
        const f = 0.05
        let h = noise2D(x * f, z * f) * 2
        const dist = Math.sqrt(x * x + z * z)
        if (dist > 30) h += (dist - 30) * 0.5
        if (dist < 10) h *= 0.1
        return h
    }

    return (
        <group>
            <Sky sunPosition={[100, 20, 100]} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Cloud position={[-10, 15, -10]} opacity={0.5} />
            <Cloud position={[10, 15, -10]} opacity={0.5} />

            <Terrain />

            {/* Water Plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#0077be" transparent opacity={0.6} />
            </mesh>

            {/* Trees */}
            {Array.from({ length: 40 }).map((_, i) => {
                const x = (Math.random() - 0.5) * 80
                const z = (Math.random() - 0.5) * 80
                // Don't place too close to center
                if (x * x + z * z < 100) return null

                const y = getH(x, z)
                return <Tree key={i} position={[x, y, z]} />
            })}

            {/* Floating Platforms for Climbing */}
            {[...Array(5)].map((_, i) => (
                <RigidBody key={i} type="fixed" position={[5 + i * 3, 2 + i * 1.5, -5]}>
                    <mesh castShadow receiveShadow>
                        <boxGeometry args={[2, 0.5, 2]} />
                        <meshStandardMaterial color="#8B4513" />
                    </mesh>
                </RigidBody>
            ))}
        </group>
    )
}

function y_is_z_in_noise(val) { return val } // Just a dummy to keep mind clear
