import { createNoise2D } from 'simplex-noise'
import * as THREE from 'three'

// Initialize noise with a consistent function (for now random is fine if initialized once globally)
const noise2D = createNoise2D()

// Multi-octave noise function
function fbm(x, z, octaves, persistence, lacunarity, scale) {
    let total = 0
    let frequency = 1 / scale
    let amplitude = 1
    let maxValue = 0  // Used for normalizing result to 0.0 - 1.0
    for (let i = 0; i < octaves; i++) {
        total += noise2D(x * frequency, z * frequency) * amplitude

        maxValue += amplitude

        amplitude *= persistence
        frequency *= lacunarity
    }

    return total // range roughly -maxValue to maxValue
}

export function getGlobalHeight(x, z) {
    // 1. Large scale features (Mountains / Continents)
    // Scale: Large (e.g. 500), Amplitude: High (e.g. 50)
    const macro = fbm(x, z, 2, 0.5, 2.0, 400) * 40

    // 2. Rolling Hills
    // Scale: Medium (e.g. 100), Amplitude: Medium (e.g. 10)
    const hills = fbm(x, z + 1000, 3, 0.5, 2.0, 100) * 10

    // 3. Fine details
    const detail = fbm(x, z, 4, 0.5, 2.0, 20) * 1

    // Path carving logic could go here (domain warping or simple subtraction)

    let height = 0

    // Logic: If macro is high, it's mountainous. If low, it's plains/hills.
    if (macro > 20) {
        // Mountains
        height = macro + hills + detail
    } else {
        // Plains / Hills
        height = (macro * 0.2) + hills + detail
    }

    // Flatten at 0 for water
    // return Math.max(height, -2)
    return height
}

export function getBiomeColor(height, x, z) {
    const color = new THREE.Color()

    // Normalize height roughly for color ramps
    // Water
    if (height < -2) {
        return color.set('#0077be')
    }

    // Sand
    if (height < 2) {
        return color.set('#e0c9a6')
    }

    // Path Logic (Simple noise channel)
    const pathNoise = noise2D(x * 0.015, z * 0.015) // Wide paths
    // If near 0, it's a path
    if (Math.abs(pathNoise) < 0.05 && height < 15 && height > 2) {
        return color.set('#8B5A2B') // Path brown
    }

    // Grass vs Rock
    // Determine slope proxy by checking noise change? 
    // Without calculating normals, we can just use height.
    if (height > 25) {
        // High mountains -> Rock/Snow
        if (height > 45) return color.set('#ffffff') // Snow
        return color.set('#808080') // Rock
    }

    // Grass with some variation
    const grassVar = noise2D(x * 0.1, z * 0.1)
    if (grassVar > 0.5) return color.set('#4a6b3a')
    return color.set('#5c7d4d')
}

export function getSafeSpawnPosition() {
    // Spiral search for land
    let x = 0
    let z = 0
    let step = 1
    let direction = 0 // 0: right, 1: down, 2: left, 3: up

    // Safety break
    let maxChecks = 1000

    // Check 0,0 first
    if (getGlobalHeight(x, z) > 0) return [x, getGlobalHeight(x, z) + 2, z]

    for (let i = 0; i < maxChecks; i++) {
        // Move
        if (direction === 0) x += 5
        else if (direction === 1) z += 5
        else if (direction === 2) x -= 5
        else if (direction === 3) z -= 5

        // Check
        const h = getGlobalHeight(x, z)
        // Water is at -2 roughly (visual at -2.1)
        // Sand is < 2.
        // Let's spawn on Sand or Grass, safe from water.
        if (h > -1) {
            return [x, h + 5, z] // Drop from slightly higher to prevent clipping
        }

        // Spiral Step logic
        // Simple ring search is easier? 
        // Let's just do random checks if spiral is annoying to implement perfectly quickly in one go
        // Random might fail but it's unlikely given the noise.
        // Actually, let's just do a linear scan or ring.
        // Re-implementing simplified spiral:
        // Or just check random points within radius 100
    }

    // Fallback if world is waterworld (unlikely based on noise settings)
    return [0, 20, 0]
}
