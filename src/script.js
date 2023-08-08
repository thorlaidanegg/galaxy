import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import waterVertexShader from './shaders/water/vertex.glsl'
import waterFragmentShader from './shaders/water/fragment.glsl'
import galaxyVertexShader from './shaders/galaxy/vertex.glsl'
import galaxyFragmentShader from './shaders/galaxy/fragment.glsl'

/**
 * Base
 */
// Debug

const textureLoader = new THREE.TextureLoader()
const gltfLoader = new GLTFLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Water
 */
// Geometry
const waterGeometry = new THREE.PlaneGeometry(8, 8, 512, 512)

// Material
const waterMaterial = new THREE.ShaderMaterial({
    vertexShader : waterVertexShader,
    fragmentShader : waterFragmentShader,
    uniforms:
    {
        uBigWavesElevation : { value : 0.2},
        uBigWavesFrequency : { value : new THREE.Vector2(4,1.5)},
        uTime : { value : 0.0},
        uBigWavesSpeed : {value : 0.75},
        uDepthColor : { value : new THREE.Color('#186691')},
        uSurfaceColor : { value : new THREE.Color('#9bd8ff')},
        uColorOffset : { value : 0.08},
        uColorMultiplier : { value : 5},
        uSmallWavesElevation : { value : 0.15},
        uSmallWavesFrequency : { value :3},
        uSmallWavesSpeed : { value : 0.2},
        uSmallIterations : {value : 4}
    }
})


// Mesh
const water = new THREE.Mesh(waterGeometry, waterMaterial)
water.rotation.x =  -Math.PI * 0.38
water.position.z += 2  

scene.add(water)

const objectDistance = 6

//galaxy

const parameters = {}
parameters.count = 200000
parameters.size = 0.0015
parameters.radius = 5
parameters.branches = 4
parameters.spin = 0.1
parameters.randomness = 1
parameters.randomnessPower = 11
parameters.insideColor = '#ff6030'
parameters.outsideColor = '#1b3984'

let geometry = null
let material = null
let points = null

const generateGalaxy = () =>
{
    if(points !== null)
    {
        geometry.dispose()
        material.dispose()
        scene.remove(points)
    }

    /**
     * Geometry
     */
    geometry = new THREE.BufferGeometry()

    const positions = new Float32Array(parameters.count * 3)
    const randomness = new Float32Array(parameters.count * 3)
    const colors = new Float32Array(parameters.count * 3)
    const scales = new Float32Array(parameters.count * 1)

    const insideColor = new THREE.Color(parameters.insideColor)
    const outsideColor = new THREE.Color(parameters.outsideColor)

    for(let i = 0; i < parameters.count; i++)
    {
        const i3 = i * 3

        // Position
        const radius = Math.random() * parameters.radius

        const branchAngle = (i % parameters.branches) / parameters.branches * Math.PI * 2

        const randomX = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius
        const randomY = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius
        const randomZ = Math.pow(Math.random(), parameters.randomnessPower) * (Math.random() < 0.5 ? 1 : - 1) * parameters.randomness * radius

        positions[i3    ] = Math.cos(branchAngle) * radius
        positions[i3 + 1] = 0
        positions[i3 + 2] = Math.sin(branchAngle) * radius
    
        randomness[i3    ] = randomX
        randomness[i3 + 1] = randomY
        randomness[i3 + 2] = randomZ

        // Color
        const mixedColor = insideColor.clone()
        mixedColor.lerp(outsideColor, radius / parameters.radius)

        colors[i3    ] = mixedColor.r
        colors[i3 + 1] = mixedColor.g
        colors[i3 + 2] = mixedColor.b

        // Scale
        scales[i] = Math.random()
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('aRandomness', new THREE.BufferAttribute(randomness, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))

    /**
     * Material
     */
    material = new THREE.ShaderMaterial({
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        uniforms:
        {
            uTime: { value: 0 },
            uSize: { value: 30 * renderer.getPixelRatio() }
        },    
        vertexShader: galaxyVertexShader,
        fragmentShader: galaxyFragmentShader
    })

    /**
     * Points
     */
    points = new THREE.Points(geometry, material)        
    points.position.y -= objectDistance 
    points.rotation.z = 1
    scene.add(points)
}


const geometry3 = new THREE.TorusKnotGeometry(0.8, 0.35, 100, 16)
const material3 = new THREE.MeshNormalMaterial()
const mesh3 = new THREE.Mesh(geometry3, material3)
mesh3.position.y = -objectDistance * 2
mesh3.position.x += 1.75
mesh3.scale.set (0.75,0.75,0.75)
scene.add(mesh3)

/**
 * Scroll
 */

let scrollY = window.scrollY

window.addEventListener("scroll", function(){
    scrollY = window.scrollY

})


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})



/**
 * Camera
 */

const cameraGroup = new THREE.Group()
scene.add(cameraGroup)

// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 6
cameraGroup.add(camera)



/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Update controls
    camera.position.y = - scrollY / sizes.height * objectDistance 

    mesh3.rotation.x += deltaTime * 0.4
    mesh3.rotation.z += deltaTime * 0.44

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)

    waterMaterial.uniforms.uTime.value = elapsedTime
    material.uniforms.uTime.value = elapsedTime
}

generateGalaxy()

tick()