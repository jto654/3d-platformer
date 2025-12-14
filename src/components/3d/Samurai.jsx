import { useAnimations, useGLTF, useTexture } from '@react-three/drei'
import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'

export function Samurai({ animation = 'Idle', ...props }) {
    const group = useRef()

    // Load Model (using white_mesh.glb)
    const { nodes, materials, animations } = useGLTF('/models/samurai_mesh.glb')
    const { actions } = useAnimations(animations, group)

    // DEBUG: Texture logic removed to prevent crash.
    // const texture = useTexture('/textures/samurai_texture.png')

    useEffect(() => {
        // Stop all current animations and play new one (if they exist)
        if (actions) {
            const action = actions[animation]
            if (action) {
                Object.values(actions).forEach(act => act.stop())
                action.reset().fadeIn(0.2).play()
            }
        }
    }, [animation, actions])

    return (
        <group ref={group} {...props} dispose={null}>
            <primitive object={nodes.Scene || nodes.root || Object.values(nodes)[0]} />
        </group>
    )
}

useGLTF.preload('/models/samurai_mesh.glb')

// useGLTF.preload('/models/white_mesh.glb')
