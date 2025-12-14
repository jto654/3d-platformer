import { useAnimations, useFBX } from '@react-three/drei'
import { useEffect, useRef, useMemo } from 'react'
import * as THREE from 'three'

export function Samurai({ animation = 'Idle', ...props }) {
    const group = useRef()

    // Load FBX Animations
    // We assume both files contain the skinned mesh. We'll render one and use anims from both.
    const walking = useFBX('/models/Walking.fbx')
    const running = useFBX('/models/Run.fbx')

    // Extract and name animations
    const animations = useMemo(() => {
        const walkAnim = walking.animations[0]
        const runAnim = running.animations[0]

        walkAnim.name = 'Walk'
        runAnim.name = 'Run'

        return [walkAnim, runAnim]
    }, [walking, running])

    const { actions } = useAnimations(animations, group)

    useEffect(() => {
        // Stop all currents
        // Default to Walk if Idle is requested (paused?) or just Walk
        const targetAnim = animation === 'Idle' ? 'Walk' : animation

        const action = actions[targetAnim]

        if (action) {
            // Smooth transition
            Object.values(actions).forEach(act => act !== action && act.fadeOut(0.2))

            if (animation === 'Idle') {
                // Hack for Idle: Play Walk but pause it or play very slowly? 
                // Better: Reset and stop.
                action.reset().fadeIn(0.2).play()
                action.paused = true // Freeze 
            } else {
                action.reset().fadeIn(0.2).play()
                action.paused = false
            }
        }
    }, [animation, actions])

    return (
        <group ref={group} {...props} dispose={null}>
            {/* Render the mesh from the Walking FBX */}
            <primitive object={walking} />
        </group>
    )
}

useFBX.preload('/models/Walking.fbx')
useFBX.preload('/models/Run.fbx')

// useGLTF.preload('/models/white_mesh.glb')
