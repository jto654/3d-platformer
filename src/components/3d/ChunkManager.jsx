import { useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Chunk } from './Chunk'

const CHUNK_SIZE = 60
const RENDER_DISTANCE = 3 // Radius in chunks (3 -> 7x7 grid)

export function ChunkManager({ playerPos }) {
    const [chunks, setChunks] = useState([])
    const lastChunkPos = useRef({ x: null, z: null })

    useFrame(() => {
        if (!playerPos.current) return

        const px = playerPos.current.x
        const pz = playerPos.current.z

        // Convert player pos to chunk coords
        // Note: Chunk origin is center.
        const cx = Math.round(px / CHUNK_SIZE)
        const cz = Math.round(pz / CHUNK_SIZE)

        if (cx !== lastChunkPos.current.x || cz !== lastChunkPos.current.z) {
            // Update chunks
            const newChunks = []
            for (let x = -RENDER_DISTANCE; x <= RENDER_DISTANCE; x++) {
                for (let z = -RENDER_DISTANCE; z <= RENDER_DISTANCE; z++) {
                    newChunks.push({ x: cx + x, z: cz + z, key: `${cx + x},${cz + z}` })
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
                />
            ))}
        </group>
    )
}
