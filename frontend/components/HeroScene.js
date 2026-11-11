'use client';

import { useEffect, useRef } from 'react';

/**
 * Subtle 3D background for the home page hero.
 * A few low-poly shapes float slowly and tilt a little with the mouse.
 * - three.js is loaded only in the browser, only on this page
 * - pauses when the hero is scrolled out of view
 * - respects "reduce motion" (renders one still frame)
 * - if WebGL isn't available, nothing is shown and the page works normally
 */
export default function HeroScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let disposed = false;
    let cleanup = () => {};

    import('three').then((THREE) => {
      if (disposed) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      } catch {
        return; // no WebGL: keep the plain gradient
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.domElement.style.opacity = '0';
      renderer.domElement.style.transition = 'opacity 1.2s ease';
      mount.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, mount.clientWidth / mount.clientHeight, 0.1, 100);
      camera.position.set(0, 0, 12);

      // Lighting
      scene.add(new THREE.AmbientLight(0xffffff, 0.7));
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
      keyLight.position.set(5, 6, 6);
      scene.add(keyLight);
      const rimLight = new THREE.PointLight(0x9ec2ff, 30, 30);
      rimLight.position.set(-4, -3, 5);
      scene.add(rimLight);

      const group = new THREE.Group();
      scene.add(group);

      const solid = (color) =>
        new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.15, flatShading: true });

      // [geometry, material, position, rotation speed]
      const items = [
        [new THREE.IcosahedronGeometry(1.4, 0), solid(0xffffff), [4.4, 1.0, 0], 0.18],
        [new THREE.TorusGeometry(0.9, 0.32, 20, 48), solid(0xcfe0ff), [6.2, -1.9, -1.5], 0.22],
        [new THREE.OctahedronGeometry(0.8, 0), solid(0xffd27a), [2.7, -2.3, 1], 0.26],
        [new THREE.DodecahedronGeometry(0.6, 0), solid(0x9ec2ff), [6.8, 2.2, -2], 0.2],
        [new THREE.BoxGeometry(0.8, 0.8, 0.8), solid(0xffffff), [2.2, 2.5, -1.5], 0.16],
        [
          new THREE.IcosahedronGeometry(3.2, 1),
          new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.08 }),
          [5, 0, -5],
          0.04,
        ],
      ];

      const meshes = items.map(([geometry, material, [x, y, z], speed], i) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        mesh.userData = { baseY: y, speed, offset: i * 1.3 };
        group.add(mesh);
        return mesh;
      });

      // On small screens move shapes behind/right of the text and make them smaller
      const layout = () => {
        const mobile = mount.clientWidth < 768;
        group.position.x = mobile ? -2.5 : 0;
        group.scale.setScalar(mobile ? 0.65 : 1);
      };
      layout();

      // Gentle mouse parallax
      const target = { x: 0, y: 0 };
      const onPointerMove = (e) => {
        target.x = (e.clientX / window.innerWidth - 0.5) * 2;
        target.y = (e.clientY / window.innerHeight - 0.5) * 2;
      };

      const clock = new THREE.Clock();
      let frameId = null;
      let visible = true;

      const render = () => {
        const t = clock.getElapsedTime();
        for (const mesh of meshes) {
          const { baseY, speed, offset } = mesh.userData;
          mesh.rotation.x += speed * 0.01;
          mesh.rotation.y += speed * 0.012;
          mesh.position.y = baseY + Math.sin(t * 0.6 + offset) * 0.25;
        }
        group.rotation.y += (target.x * 0.15 - group.rotation.y) * 0.04;
        group.rotation.x += (target.y * 0.08 - group.rotation.x) * 0.04;
        renderer.render(scene, camera);
      };

      const loop = () => {
        render();
        frameId = requestAnimationFrame(loop);
      };
      const start = () => {
        if (frameId === null && visible && !reduceMotion) loop();
      };
      const stop = () => {
        if (frameId !== null) cancelAnimationFrame(frameId);
        frameId = null;
      };

      // Pause when the hero is off screen
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
        else stop();
      });
      io.observe(mount);

      const ro = new ResizeObserver(() => {
        const { clientWidth: w, clientHeight: h } = mount;
        if (!w || !h) return;
        renderer.setSize(w, h);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        layout();
        if (reduceMotion) render();
      });
      ro.observe(mount);

      if (reduceMotion) {
        render(); // one still frame
      } else {
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        start();
      }
      requestAnimationFrame(() => {
        renderer.domElement.style.opacity = '1';
      });

      cleanup = () => {
        stop();
        io.disconnect();
        ro.disconnect();
        window.removeEventListener('pointermove', onPointerMove);
        meshes.forEach((m) => {
          m.geometry.dispose();
          m.material.dispose();
        });
        renderer.dispose();
        renderer.domElement.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <div ref={mountRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />;
}
