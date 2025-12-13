import { useKeyboardControls, PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import * as THREE from 'three'
import { useGameStore } from '../../stores/useGameStore'
import { Controls } from '../../App'

const MOVEMENT_SPEED = 5
const RUN_SPEED = 10
const ROTATION_SPEED = 2
const JUMP_FORCE = 5
const CAMERA_DISTANCE = 5
const CAMERA_HEIGHT = 2

export const Character = forwardRef((props, ref) => {
    const rigidBody = useRef()
    // Expose position to parent via ref
    useImperativeHandle(ref, () => ({
        get x() { return rigidBody.current ? rigidBody.current.translation().x : 0 },
        get y() { return rigidBody.current ? rigidBody.current.translation().y : 0 },
        get z() { return rigidBody.current ? rigidBody.current.translation().z : 0 }
    }))

    const characterRef = useRef()
    const [animationOffset] = useState(() => Math.random() * 100)
    const [subscribeKeys, getKeys] = useKeyboardControls()
    const { rapier, world } = useRapier()
    const { camera } = useThree()

    const mouseLookEnabled = useGameStore((state) => state.mouseLookEnabled)
    const toggleMouseLook = useGameStore((state) => state.toggleMouseLook)

    // Toggle Mouse Look
    useEffect(() => {
        const unsub = subscribeKeys(
            (state) => state.mouseLook,
            (value) => {
                if (value) toggleMouseLook()
            }
        )
        return unsub
    }, [subscribeKeys, toggleMouseLook])

    // Refs for smooth camera
    const cameraTarget = useRef(new THREE.Vector3())
    const cameraPosition = useRef(new THREE.Vector3())

    // Current rotation angle (Y axis)
    const rotationY = useRef(0)

    useFrame((state, delta) => {
        const { forward, back, left, right, jump, run, rotateLeft, rotateRight } = getKeys()
        const rb = rigidBody.current
        if (!rb) return

        const vel = rb.linvel()
        const pos = rb.translation()

        // 1. Handle Rotation
        if (rotateLeft) {
            rotationY.current += ROTATION_SPEED * delta
        }
        if (rotateRight) {
            rotationY.current -= ROTATION_SPEED * delta
        }

        // Apply rotation to character visual
        const quaternion = new THREE.Quaternion()
        quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationY.current)
        // We can either rotate the RigidBody kinematically or just rotate the mesh if the collider is a symmetric capsule
        // Rotating the mesh is easier for movement direction calculation usually, but let's rotate the RB so 'forward' in physics matches
        rb.setRotation(quaternion, true)

        // 2. Handle Movement
        const speed = run ? RUN_SPEED : MOVEMENT_SPEED
        const direction = new THREE.Vector3()

        const frontVector = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY.current)
        const sideVector = new THREE.Vector3(-1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY.current)

        if (forward) {
            direction.add(frontVector)
        }
        if (back) {
            direction.sub(frontVector)
        }
        if (left) {
            direction.add(sideVector)
        }
        if (right) {
            direction.sub(sideVector)
        }

        if (direction.lengthSq() > 0) {
            direction.normalize().multiplyScalar(speed)
        }

        // Apply velocity (keep Y velocity for gravity)
        rb.setLinvel({ x: direction.x, y: vel.y, z: direction.z }, true)

        // 3. Handle Jump
        // For now simple jump check (raycast would be better for ground check)
        if (jump && Math.abs(vel.y) < 0.1) {
            rb.applyImpulse({ x: 0, y: JUMP_FORCE, z: 0 }, true)
        }

        // 4. Camera Follow
        // Desired camera position: Behind the character
        const camDist = 5
        const camHeight = 2.5

        // Calculate "ideal" camera ref based on character rotation
        // We want the camera to be behind the character.
        // Character Forward is frontVector.
        // Behind is -frontVector.

        // Ideal position
        const idealOffset = frontVector.clone().negate().multiplyScalar(camDist).add(new THREE.Vector3(0, camHeight, 0))
        const currentPos = new THREE.Vector3(pos.x, pos.y, pos.z)
        const idealPos = currentPos.clone().add(idealOffset)

        if (mouseLookEnabled) {
            // If mouse look is on, we let OrbitControls or manual mouse logic handle it. 
            // But prompt implies "User can make the camera look around according to mouse controls".
            // We might need a separate mechanism or OrbitControls that is engaged only when toggled.
            // For now, let's implement the standard follow first.
        } else {
            // Smoothly interp camera to ideal pos
            // Lerp factor
            const t = 1.0 - Math.pow(0.01, delta) // Independent of framedrop

            state.camera.position.lerp(idealPos, 0.1) // Simple lerp
            state.camera.lookAt(currentPos.clone().add(new THREE.Vector3(0, 1, 0))) // Look at character head slightly up
        }

        // Animation Logic
        const time = state.clock.getElapsedTime()
        const isMoving = forward || back || left || right
        const isRunning = run

        // Limb rotation (simple sine wave)
        if (characterRef.current) {
            const speed = isRunning ? 15 : 10
            const amp = isMoving ? (isRunning ? 1 : 0.5) : 0
            const angle = Math.sin(time * speed + animationOffset) * amp

            // Arms
            const leftArm = characterRef.current.getObjectByName('leftArm')
            const rightArm = characterRef.current.getObjectByName('rightArm')
            const leftLeg = characterRef.current.getObjectByName('leftLeg')
            const rightLeg = characterRef.current.getObjectByName('rightLeg')

            if (leftArm) leftArm.rotation.x = angle
            if (rightArm) rightArm.rotation.x = -angle
            if (leftLeg) leftLeg.rotation.x = -angle
            if (rightLeg) rightLeg.rotation.x = angle
        }
    })

    return (
        <group>
            <RigidBody ref={rigidBody} colliders={false} enabledRotations={[false, false, false]} position={props.initialPos || [0, 5, 0]}>
                <CapsuleCollider args={[0.75, 0.5]} position={[0, 1.25, 0]} />
                {/* Visual Character */}
                <group ref={characterRef}>
                    {/* Head */}
                    <mesh position={[0, 2.3, 0]} castShadow>
                        <boxGeometry args={[0.8, 0.8, 0.8]} />
                        <meshStandardMaterial color="orange" />
                    </mesh>
                    {/* Body */}
                    <mesh position={[0, 1.4, 0]} castShadow>
                        <boxGeometry args={[1, 1.2, 0.6]} />
                        <meshStandardMaterial color="hotpink" />
                    </mesh>
                    {/* Left Arm */}
                    <mesh name="leftArm" position={[0.7, 1.4, 0]} castShadow>
                        <boxGeometry args={[0.4, 1, 0.4]} />
                        <meshStandardMaterial color="hotpink" />
                    </mesh>
                    {/* Right Arm */}
                    <mesh name="rightArm" position={[-0.7, 1.4, 0]} castShadow>
                        <boxGeometry args={[0.4, 1, 0.4]} />
                        <meshStandardMaterial color="hotpink" />
                    </mesh>
                    {/* Left Leg */}
                    <mesh name="leftLeg" position={[0.3, 0.4, 0]} castShadow>
                        <boxGeometry args={[0.4, 1, 0.4]} />
                        <meshStandardMaterial color="blue" />
                    </mesh>
                    {/* Right Leg */}
                    <mesh name="rightLeg" position={[-0.3, 0.4, 0]} castShadow>
                        <boxGeometry args={[0.4, 1, 0.4]} />
                        <meshStandardMaterial color="blue" />
                    </mesh>
                </group>
            </RigidBody>
        </group>
    )
})
