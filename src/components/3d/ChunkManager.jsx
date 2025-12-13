import { useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Chunk } from './Chunk'

const CHUNK_SIZE = 60
const RENDER_DISTANCE = 5 // Increased render distance (11x11 grid)

export function ChunkManager({ playerPos }) {
    const [chunks, setChunks] = useState([])
    const lastChunkPos = useRef({ x: null, z: null })

    useFrame(() => {
        if (!playerPos.current) return

        const px = playerPos.current.x
        const pz = playerPos.current.z

        const cx = Math.round(px / CHUNK_SIZE)
        const cz = Math.round(pz / CHUNK_SIZE)

        // Only update if we moved to a new chunk to avoid constant re-renders
        if (cx !== lastChunkPos.current.x || cz !== lastChunkPos.current.z) {
            const newChunks = []
            for (let x = -RENDER_DISTANCE; x <= RENDER_DISTANCE; x++) {
                for (let z = -RENDER_DISTANCE; z <= RENDER_DISTANCE; z++) {
                    const dist = Math.max(Math.abs(x), Math.abs(z))
                    let segments = 32

                    // Expanded LOD Radii
                    // High Detail (128): Current + 1 neighbor (3x3 area)
                    // This ensures player always walks into high detail terrain
                    if (dist <= 1) segments = 128
                    // Medium Detail (64): Up to 3 chunks away (7x7 area)
                    else if (dist <= 3) segments = 64

                    newChunks.push({
                        x: cx + x,
                        z: cz + z,
                        key: `${cx + x},${cz + z}`,
                        segments: segments
                    })
                }
            }
            setChunks(newChunks)
            lastChunkPos.current = { x: cx, z: cz }
        }
    })

    return (
        <group>
            {chunks.map(chunk => (
                <Chunk
                    key={chunk.key}
                    chunkX={chunk.x}
                    chunkZ={chunk.z}
                    size={CHUNK_SIZE}
                    segments={chunk.segments}
                />
            ))}
        </group>
    )
}
