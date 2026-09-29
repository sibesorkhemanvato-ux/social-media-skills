import { useEffect, useRef, useState } from 'react'

/** Loads Three.js after the main content is interactive. CSS/SVG fallback stays visible on constrained devices. */
export function HeroScene() {
  const canvasHost = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const compact = window.matchMedia('(max-width: 720px)').matches
    const lowPower = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4
    if (reduceMotion || compact || lowPower || !canvasHost.current) return

    let disposed = false
    let cleanup = () => undefined
    const start = async () => {
      const THREE = await import('three')
      if (disposed || !canvasHost.current) return

      const host = canvasHost.current
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
      camera.position.set(0, 0.4, 8)
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      renderer.setClearColor(0x000000, 0)
      host.appendChild(renderer.domElement)

      const warm = new THREE.MeshStandardMaterial({ color: 0xe0a458, roughness: 0.45, metalness: 0.18 })
      const cream = new THREE.MeshStandardMaterial({ color: 0xf4ede1, roughness: 0.75, metalness: 0 })
      const group = new THREE.Group()
      group.rotation.set(0.18, -0.32, -0.1)
      scene.add(group)
      const rungGeometry = new THREE.BoxGeometry(3.15, 0.105, 0.14)
      const sideGeometry = new THREE.BoxGeometry(0.15, 5.5, 0.15)
      const left = new THREE.Mesh(sideGeometry, warm)
      const right = new THREE.Mesh(sideGeometry, warm)
      left.position.set(-1.45, 0, 0)
      right.position.set(1.45, 0, 0)
      group.add(left, right)
      for (let i = -2; i <= 2; i += 1) {
        const rung = new THREE.Mesh(rungGeometry, cream)
        rung.position.set(0, i * 1.04, 0)
        group.add(rung)
      }
      const glow = new THREE.PointLight(0xe0a458, 8, 18)
      glow.position.set(0, 3.3, 2)
      scene.add(glow)
      scene.add(new THREE.AmbientLight(0xf4ede1, 1.25))
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.38, 24, 24), warm)
      bulb.position.set(0, 3.45, 0)
      group.add(bulb)

      const resize = () => {
        const { width, height } = host.getBoundingClientRect()
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }
      resize()
      const observer = new ResizeObserver(resize)
      observer.observe(host)
      let frame = 0
      const animate = () => {
        frame = requestAnimationFrame(animate)
        group.rotation.y += 0.0023
        bulb.scale.setScalar(1 + Math.sin(performance.now() / 900) * 0.035)
        renderer.render(scene, camera)
      }
      animate()
      setActive(true)
      cleanup = () => {
        cancelAnimationFrame(frame)
        observer.disconnect()
        rungGeometry.dispose()
        sideGeometry.dispose()
        warm.dispose()
        cream.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    }

    const idle = window.requestIdleCallback ? window.requestIdleCallback(start, { timeout: 1600 }) : window.setTimeout(start, 700)
    return () => {
      disposed = true
      if (window.cancelIdleCallback && typeof idle === 'number') window.cancelIdleCallback(idle)
      else window.clearTimeout(idle as number)
      cleanup()
    }
  }, [])

  return (
    <div className={`hero-scene ${active ? 'hero-scene--active' : ''}`} aria-label="تصویر نردبان و چراغ">
      <img src="/images/ladder-fallback.svg" alt="نردبان و چراغ، نماد انتخاب مسیر" width="740" height="680" decoding="async" />
      <div className="hero-scene__canvas" ref={canvasHost} aria-hidden="true" />
    </div>
  )
}
