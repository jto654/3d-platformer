import { useMemo } from 'react'
import * as THREE from 'three'
import { RigidBody } from '@react-three/rapier'
import { getGlobalHeight, getBiomeColor } from '../../utils/terrain'

// Let's create a local Tree component here or import it if I export it. 
// I'll copy the Tree component for now to keep it self-contained or better, move Tree to a separate file.
// For speed, defining it here.

function Tree({ position }) {
    return (
        <group position={position}>
            <mesh position={[0, 1, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.2, 0.4, 2, 8]} />
                <meshStandardMaterial color="#5c4033" />
            </mesh>
            <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
                <coneGeometry args={[1.5, 3, 8]} />
                <meshStandardMaterial color="#2d4c1e" />
            </mesh>
        </group>
    )
}

export function Chunk({ chunkX, chunkZ, size }) {
    const { geometry, treePositions } = useMemo(() => {
        const segments = 32 // Reasonable resolution per chunk
        const geo = new THREE.PlaneGeometry(size, size, segments, segments)

        // Offset standard PlaneGeometry to start from top-left logic or just center?
        // PlaneGeometry is centered at (0,0).
        // It's easier if we treat (chunkX * size, chunkZ * size) as the CENTER of the chunk in world space
        // So the vertices world pos = (chunkX * size + localX, chunkZ * size + localY)

        const posAttribute = geo.attributes.position
        const vertex = new THREE.Vector3()
        const count = posAttribute.count

        // Add color attribute
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
        const colorAttribute = geo.attributes.color

        const trees = []

        for (let i = 0; i < count; i++) {
            vertex.fromBufferAttribute(posAttribute, i)

            // Convert local vertex to world coordinates
            // Note: PlaneGeometry is X, Y. We map Y -> Z in world space usually, but here
            // let's assume the mesh is rotated -PI/2 X, so (x, y, z) -> (x, -z, y)?
            // Wait. Standard: mesh.rotation.x = -Math.PI/2.
            // Vertex (x, y, 0).
            // World Position:
            // worldX = chunkX * size + vertex.x
            // worldZ = chunkZ * size + vertex.y (because of rotation, y becomes -z... wait)

            // Let's keep it simple: We use vertex.x and vertex.y as the "Ground Plan" coordinates.
            // Since we will rotate the mesh -90deg on X:
            // Visual X = vertex.x
            // Visual Z = -vertex.y (or vertex.y depending on mapping)

            // Actual World Coords relative to (0,0) of the world:
            const worldX = (chunkX * size) + vertex.x
            const worldZ = (chunkZ * size) - vertex.y // Invert Y for Z if needed, or just map directly

            const h = getGlobalHeight(worldX, worldZ)

            // Set height (z in local plane space)
            posAttribute.setZ(i, h)

            // Color
            const color = getBiomeColor(h, worldX, worldZ)
            colorAttribute.setXYZ(i, color.r, color.g, color.b)

            // Tree Generation Logic
            // We iterate vertices. If we rely solely on vertices, trees align to grid.
            // That's acceptable for performance.
            // Use a high frequency noise or pseudo-random hash based on worldX, worldZ
            // Only place trees on "Grass" (approx height check or biome check)
            // And not on steep slopes (simplified: if height is moderate)

            if (h > 2 && h < 20) {
                // Pseudo-random check
                // A simple way: (Math.sin(worldX * 12.9898 + worldZ * 78.233) * 43758.5453) % 1
                // Or just reuse noise
                const n = getGlobalHeight(worldX * 50, worldZ * 50) // Use high freq noise from terrain.js? No, access is via export? 
                // Let's just do a simple math hash
                const hash = Math.abs(Math.sin(worldX * 12.9898 + worldZ * 78.233) * 43758.5453 % 1);

                if (hash > 0.985) { // 1.5% chance per vertex
                    trees.push([worldX, h, worldZ]) // Store World position
                    // Wait, we need local position for the chunk group?
                    // Chunk is positioned at [chunkX*size, 0, chunkZ*size].
                    // So tree local pos: x = vertex.x, z = -vertex.y (from plane) -> -vertex.y is usually Z in 3D...
                    // Let's verify Chunk rotation.
                    // Chunk mesh is rotated [-PI/2, 0, 0].
                    // So Local Y becomes World Z. Local Z becomes World Y.
                    // We want Tree to be upright.
                    // It's easier to put Trees outside the rotated mesh, simply added to the Chunk group.
                    // The Chunk Group is at (CX*S, 0, CZ*S).
                    // Tree Local X = worldX - (chunkX*size) = vertex.x
                    // Tree Local Z = worldZ - (chunkZ*size) = -vertex.y
                    // Tree Local Y = h
                }
            }
        }

        geo.computeVertexNormals()
        return { geometry: geo, treePositions: trees }
    }, [chunkX, chunkZ, size])

    return (
        <group>
            <RigidBody type="fixed" colliders="trimesh">
                <mesh
                    geometry={geometry}
                    position={[chunkX * size, 0, chunkZ * size]}
                    rotation={[-Math.PI / 2, 0, 0]}
                    receiveShadow
                    castShadow
                >
                    <meshStandardMaterial vertexColors roughness={0.8} />
                </mesh>
            </RigidBody>

            {treePositions.map((pos, i) => (
                <group position={[pos[0], pos[1], pos[2]]} key={i}>
                    <Tree />
                </group>
            ))}
        </group>
    )
}
