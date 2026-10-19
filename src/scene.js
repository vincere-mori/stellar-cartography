import * as THREE from "three";
import { OrbitControls } from "../vendor/OrbitControls.js";
import {
  makeGalaxy,
  makeBackground,
  makeObject,
  disposeGroup,
  randomGenerator,
  blackHoleFragment,
} from "./models.js";
import { getObject, objects } from "./catalog.js";

export class SpaceScene {
  constructor(container, callbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.mode = "map";
    this.time = 0;
    this.quality = "auto";
    this.autoRotate = false;
    // один оборот галактики примерно за 4 минуты
    this.galaxySpin = 0.026;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor("#080c12");
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Трёхмерная карта. Для выбора объекта используйте каталог или метки.",
    );
    this.renderer.domElement.setAttribute("role", "img");
    this.container.append(this.renderer.domElement);
    this.camera = new THREE.PerspectiveCamera(44, 1, 0.1, 900);
    this.scene = new THREE.Scene();
    this.background = makeBackground();
    this.scene.add(this.background);
    this.galaxy = makeGalaxy();
    this.scene.add(this.galaxy);
    this.objectGroup = null;
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.reducedMotion;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.8;
    this.controls.autoRotateSpeed = 0.3;
    this.controls.addEventListener("start", () =>
      this.callbacks.onInteraction?.(),
    );
    this.controls.minDistance = 40;
    this.controls.maxDistance = 160;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    this.controls.minPolarAngle = 0.12;
    this.selectionRing = new THREE.Mesh(
      new THREE.RingGeometry(0.95, 1.04, 64),
      new THREE.MeshBasicMaterial({
        color: "#e9bc86",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.68,
        depthWrite: false,
      }),
    );
    this.selectionRing.rotation.x = -Math.PI / 2;
    this.galaxy.add(this.selectionRing);
    this.route = null;
    this.blackHoleScene = new THREE.Scene();
    this.blackHoleCamera = new THREE.Camera();
    this.blackHoleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uCamera: { value: this.camera.position },
        uWorld: { value: this.camera.matrixWorld },
        uProjection: { value: this.camera.projectionMatrixInverse },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2() },
      },
      vertexShader: "void main(){gl_Position=vec4(position.xy,0.,1.);}",
      fragmentShader: blackHoleFragment,
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      this.blackHoleMaterial,
    );
    quad.frustumCulled = false;
    this.blackHoleScene.add(quad);
    this.makeWarp();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.resetView();
    this.select("sgr-a");
    this.renderer.domElement.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.renderer.setAnimationLoop(null);
      callbacks.onError(
        "Графический контекст потерян. Нажмите «Попробовать снова», чтобы восстановить карту.",
      );
    });
    this.lastFrame = performance.now();
    this.fpsStart = this.lastFrame;
    this.frames = 0;
    this.visibilityHandler = () => {
      this.lastFrame = performance.now();
      this.fpsStart = this.lastFrame;
      this.frames = 0;
      this.renderer.setAnimationLoop(
        document.hidden ? null : (now) => this.frame(now),
      );
    };
    document.addEventListener("visibilitychange", this.visibilityHandler);
    this.motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
    this.motionHandler = (event) => {
      this.reducedMotion = event.matches;
      this.controls.enableDamping = !event.matches;
      if (event.matches) this.setAutoRotate(false);
      if (event.matches && this.flight) this.finishFlight();
    };
    this.motionQuery.addEventListener("change", this.motionHandler);
    this.renderer.setAnimationLoop((now) => this.frame(now));
  }

  mapDistance() {
    return (
      38 /
      (Math.tan(THREE.MathUtils.degToRad(22)) *
        Math.min(1.35, this.camera.aspect))
    );
  }

  orbitDistance(object) {
    return object.radius / Math.min(1, this.camera.aspect);
  }

  resize() {
    const width = this.container.clientWidth,
      height = this.container.clientHeight;
    if (!width || !height) return;
    const previousAspect = this.width ? this.camera.aspect : null;
    this.width = width;
    this.height = height;
    const dpr =
      this.quality === "low"
        ? 0.85
        : this.quality === "high"
          ? Math.min(devicePixelRatio, 2)
          : Math.min(devicePixelRatio, 1.4);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.warpCamera.aspect = width / height;
    this.warpCamera.updateProjectionMatrix();
    this.renderer.getDrawingBufferSize(
      this.blackHoleMaterial.uniforms.uResolution.value,
    );
    this.scene.traverse((child) => {
      if (child.material?.uniforms?.uHeight)
        child.material.uniforms.uHeight.value = height * dpr;
    });
    this.controls.maxDistance =
      this.mode === "map" ? Math.max(160, this.mapDistance() * 1.8) : 65;
    if (previousAspect && this.mode !== "flight") {
      const limit = this.mode === "map" ? 1.35 : 1;
      const ratio =
        Math.min(limit, previousAspect) / Math.min(limit, this.camera.aspect);
      const offset = this.camera.position
        .clone()
        .sub(this.controls.target)
        .multiplyScalar(ratio);
      this.camera.position.copy(this.controls.target).add(offset);
      this.controls.update();
    }
  }

  setQuality(quality) {
    this.quality = quality;
    this.resize();
  }
  setAutoRotate(value) {
    this.autoRotate = value;
    this.controls.autoRotate = value && this.mode !== "flight";
  }
  zoom(multiplier) {
    if (this.mode === "flight") return;
    const offset = this.camera.position.clone().sub(this.controls.target);
    const distance = THREE.MathUtils.clamp(
      offset.length() * multiplier,
      this.controls.minDistance,
      this.controls.maxDistance,
    );
    this.camera.position
      .copy(this.controls.target)
      .add(offset.setLength(distance));
    this.controls.update();
  }
  resetView() {
    this.controls.target.set(0, 0, 0);
    if (this.mode === "map") {
      const d = this.mapDistance();
      this.camera.position.set(0, d * 0.64, d * 0.768);
      this.controls.maxDistance = Math.max(160, d * 1.8);
    } else if (this.activeObject) {
      const radius = this.orbitDistance(this.activeObject);
      const angle = this.activeObject.model === "blackhole" ? 0.17 : 0.3;
      this.camera.position.set(0, radius * angle, radius);
    }
    this.controls.update();
  }

  select(id, origin = "sun") {
    const target = getObject(id),
      from = getObject(origin) || getObject("sun");
    this.selectionRing.position.set(...target.position);
    this.selectionRing.position.y += 0.06;
    if (this.route) {
      this.galaxy.remove(this.route);
      disposeGroup(this.route);
      this.route = null;
    }
    if (target.id === from.id) return;
    const a = new THREE.Vector3(...from.position),
      b = new THREE.Vector3(...target.position);
    const midpoint = a.clone().lerp(b, 0.5);
    midpoint.y += a.distanceTo(b) * 0.22;
    const curve = new THREE.QuadraticBezierCurve3(a, midpoint, b);
    this.route = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(curve.getPoints(80)),
      new THREE.LineDashedMaterial({
        color: "#d5ab79",
        transparent: true,
        opacity: 0.55,
        dashSize: 0.35,
        gapSize: 0.3,
      }),
    );
    this.route.computeLineDistances();
    this.galaxy.add(this.route);
  }

  makeWarp() {
    this.warpScene = new THREE.Scene();
    this.warpScene.background = new THREE.Color("#060b13");
    this.warpCamera = new THREE.PerspectiveCamera(65, 1, 0.1, 150);
    const random = randomGenerator(478);
    this.warpSeeds = Array.from({ length: 600 }, () => ({
      angle: random() * Math.PI * 2,
      r: 1.5 + random() * 32,
      offset: random() * 100,
    }));
    this.warpPositions = new Float32Array(this.warpSeeds.length * 6);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(this.warpPositions, 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    this.warpLines = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: "#9ec8e4",
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.warpLines.frustumCulled = false;
    this.warpScene.add(this.warpLines);
  }

  startFlight(object) {
    if (this.flight) return;
    if (this.mode === "map")
      this.mapView = {
        position: this.camera.position.clone(),
        target: this.controls.target.clone(),
        aspect: this.camera.aspect,
      };
    this.flight = {
      object,
      elapsed: 0,
      duration: this.reducedMotion ? 0.15 : 4.8,
      start: this.camera.position.clone(),
      target: this.controls.target.clone(),
      fromMap: this.mode === "map",
      prepared: false,
    };
    this.mode = "flight";
    this.controls.enabled = false;
    this.controls.autoRotate = false;
  }

  prepareOrbit(object) {
    if (this.objectGroup) {
      this.scene.remove(this.objectGroup);
      disposeGroup(this.objectGroup);
    }
    this.activeObject = object;
    this.objectGroup = makeObject(object);
    this.scene.add(this.objectGroup);
    this.galaxy.visible = false;
    this.controls.target.set(0, 0, 0);
    this.controls.minDistance =
      object.model === "blackhole"
        ? 10
        : object.model === "saturn"
          ? 6
          : object.category === "nebula" || object.id === "pleiades"
            ? 8
            : 4;
    this.controls.maxDistance = 65;
    this.controls.minPolarAngle = 0.03;
    this.controls.maxPolarAngle = Math.PI - 0.03;
    this.resize();
  }

  finishFlight() {
    if (!this.flight) return;
    const object = this.flight.object;
    if (!this.flight.prepared) this.prepareOrbit(object);
    this.flight = null;
    this.mode = "orbit";
    this.controls.enabled = true;
    this.controls.autoRotate = this.autoRotate;
    this.resetView();
    this.callbacks.onArrive(object);
  }

  showMap() {
    this.flight = null;
    this.mode = "map";
    if (this.objectGroup) {
      this.scene.remove(this.objectGroup);
      disposeGroup(this.objectGroup);
      this.objectGroup = null;
    }
    this.activeObject = null;
    this.galaxy.visible = true;
    this.controls.enabled = true;
    this.controls.autoRotate = this.autoRotate;
    this.controls.minDistance = 40;
    this.controls.maxDistance = Math.max(160, this.mapDistance() * 1.8);
    this.controls.minPolarAngle = 0.12;
    this.controls.maxPolarAngle = Math.PI * 0.48;
    if (this.mapView) {
      this.controls.target.copy(this.mapView.target);
      const ratio =
        Math.min(1.35, this.mapView.aspect) /
        Math.min(1.35, this.camera.aspect);
      this.camera.position
        .copy(this.mapView.position)
        .sub(this.mapView.target)
        .multiplyScalar(ratio)
        .add(this.mapView.target);
      this.controls.update();
    } else this.resetView();
  }

  worldPosition(object) {
    return new THREE.Vector3(...object.position).applyMatrix4(
      this.galaxy.matrixWorld,
    );
  }

  projectLabels() {
    return objects.map((object) => {
      const point = this.worldPosition(object).project(this.camera);
      return {
        id: object.id,
        x: (point.x * 0.5 + 0.5) * this.width,
        y: (-point.y * 0.5 + 0.5) * this.height,
        visible:
          point.z > -1 &&
          point.z < 1 &&
          Math.abs(point.x) < 1.1 &&
          Math.abs(point.y) < 1.1,
      };
    });
  }

  renderObject() {
    if (this.activeObject?.model === "blackhole") {
      this.camera.updateMatrixWorld();
      this.blackHoleMaterial.uniforms.uTime.value = this.time;
      this.renderer.render(this.blackHoleScene, this.blackHoleCamera);
    } else this.renderer.render(this.scene, this.camera);
  }

  frame(now) {
    const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    if (!this.reducedMotion) this.time += dt;
    this.frames++;
    if (now - this.fpsStart > 1600) {
      const fps = Math.round((this.frames * 1000) / (now - this.fpsStart));
      this.callbacks.onFPS(fps);
      this.frames = 0;
      this.fpsStart = now;
      if (
        this.quality === "auto" &&
        fps < 27 &&
        this.renderer.getPixelRatio() > 0.9
      ) {
        this.renderer.setPixelRatio(0.85);
        this.renderer.setSize(this.width, this.height, false);
        this.renderer.getDrawingBufferSize(
          this.blackHoleMaterial.uniforms.uResolution.value,
        );
        this.scene.traverse((child) => {
          if (child.material?.uniforms?.uHeight)
            child.material.uniforms.uHeight.value = this.height * 0.85;
        });
      }
    }
    if (this.objectGroup)
      this.objectGroup.traverse((child) => {
        if (child.material?.uniforms?.uTime)
          child.material.uniforms.uTime.value = this.time;
        if (child.userData.spin && !this.reducedMotion)
          child.rotation.y += child.userData.spin * dt;
      });
    if (this.flight) {
      const flight = this.flight;
      flight.elapsed += dt;
      const p = Math.min(flight.elapsed / flight.duration, 1);
      this.callbacks.onFlightProgress(p);
      if (p >= 1) {
        this.finishFlight();
        this.renderObject();
        return;
      }
      if (this.reducedMotion) {
        this.renderer.render(this.scene, this.camera);
        return;
      }
      if (p < 0.25) {
        const t = p / 0.25,
          eased = t * t * (3 - 2 * t);
        const target = flight.fromMap
          ? this.worldPosition(flight.object)
          : flight.target;
        const destination = target
          .clone()
          .add(flight.start.clone().sub(target).multiplyScalar(0.2));
        this.camera.position.copy(flight.start).lerp(destination, eased);
        this.camera.lookAt(flight.target.clone().lerp(target, eased));
        this.renderObject();
      } else if (p < 0.78) {
        for (let i = 0; i < this.warpSeeds.length; i++) {
          const seed = this.warpSeeds[i],
            z =
              -1 - ((((seed.offset - flight.elapsed * 55) % 100) + 100) % 100);
          const x = Math.cos(seed.angle) * seed.r,
            y = Math.sin(seed.angle) * seed.r;
          this.warpPositions.set([x, y, z, x, y, z - 6], i * 6);
        }
        this.warpLines.geometry.attributes.position.needsUpdate = true;
        this.warpLines.material.opacity =
          Math.sin(((p - 0.25) / 0.53) * Math.PI) * 0.65;
        this.renderer.render(this.warpScene, this.warpCamera);
      } else {
        if (!flight.prepared) {
          this.prepareOrbit(flight.object);
          flight.prepared = true;
        }
        const t = (p - 0.78) / 0.22,
          smooth = 1 - Math.pow(1 - t, 3);
        const distance =
          this.orbitDistance(flight.object) * (1.85 - smooth * 0.85);
        this.camera.position.set(
          0,
          distance * (flight.object.model === "blackhole" ? 0.17 : 0.3),
          distance,
        );
        this.camera.lookAt(0, 0, 0);
        this.renderObject();
      }
      return;
    }
    this.controls.update(dt);
    if (this.mode === "map") {
      if (!this.reducedMotion) {
        this.galaxy.rotation.y -= this.galaxySpin * dt;
        this.galaxy.updateMatrixWorld();
      }
      for (const child of [...this.galaxy.children, this.background])
        if (child.material?.uniforms?.uTime)
          child.material.uniforms.uTime.value = this.time;
      this.selectionRing.material.opacity =
        0.55 + Math.sin(this.time * 1.8) * 0.12;
      this.callbacks.onLabels(this.projectLabels(), this.width, this.height);
    }
    this.renderObject();
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    document.removeEventListener("visibilitychange", this.visibilityHandler);
    this.motionQuery.removeEventListener("change", this.motionHandler);
    disposeGroup(this.scene);
    disposeGroup(this.warpScene);
    disposeGroup(this.blackHoleScene);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
