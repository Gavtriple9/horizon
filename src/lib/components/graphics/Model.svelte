<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import {
    AmbientLight,
    Box3,
    Color,
    DirectionalLight,
    PerspectiveCamera,
    Scene,
    SRGBColorSpace,
    Vector3,
    WebGLRenderer,
    type ColorRepresentation,
    type Mesh,
    type Object3D,
  } from "three";
  import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

  export let src: string | null = null;
  export let background: ColorRepresentation | "transparent" = "transparent";
  export let autoRotate = false;

  let container: HTMLDivElement | null = null;

  let requestModel: ((url: string) => Promise<void>) | null = null;
  let clearModel: (() => void) | null = null;
  let updateBackground:
    | ((value: ColorRepresentation | "transparent") => void)
    | null = null;
  let updateAutoRotate: ((value: boolean) => void) | null = null;

  let pendingSrc: string | null = null;
  let lastHandledSrc: string | null = null;
  let cleanup: (() => void) | null = null;

  $: if (requestModel && src && src !== pendingSrc && src !== lastHandledSrc) {
    const target = src;
    pendingSrc = target;
    requestModel(target)
      .then(() => {
        lastHandledSrc = target;
      })
      .catch((error) => {
        console.error("Model load failed", error);
        lastHandledSrc = target;
      })
      .finally(() => {
        if (pendingSrc === target) {
          pendingSrc = null;
        }
      });
  }

  $: if (!src && clearModel) {
    clearModel();
    pendingSrc = null;
    lastHandledSrc = null;
  }

  $: updateBackground?.(background);
  $: updateAutoRotate?.(autoRotate);

  onMount(() => {
    if (!container) return;

    const scene = new Scene();
    const camera = new PerspectiveCamera(45, 1, 0.1, 1000);
    const renderer = new WebGLRenderer({ antialias: true, alpha: true });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    camera.position.set(0, 0, 0);

    const ambient = new AmbientLight(0xffffff, 0.7);
    const directional = new DirectionalLight(0xffffff, 0.8);
    directional.position.set(6, 8, 10);
    scene.add(ambient);
    scene.add(directional);

    const updateSize = () => {
      if (!container) return;
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight, false);
    };

    const resizeObserver = new ResizeObserver(updateSize);

    resizeObserver.observe(container);
    updateSize();

    const loader = new GLTFLoader();
    let currentModel: Object3D | null = null;
    let currentRequestToken = 0;

    const disposeObject = (object: Object3D) => {
      object.traverse((child) => {
        const mesh = child as Mesh;
        if (!mesh.isMesh) return;

        mesh.geometry.dispose();

        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      });
    };

    const fitCameraToObject = (object: Object3D) => {
      const box = new Box3().setFromObject(object);
      if (box.isEmpty()) {
        camera.position.set(0, 0, 0);
        camera.lookAt(0, 0, 0);
        return;
      }

      const size = box.getSize(new Vector3());
      const center = box.getCenter(new Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const distance = maxDim / (2 * Math.tan(fov / 2));
      const offset = 0.6;

      camera.position.set(
        center.x + distance * offset,
        center.y + distance * offset,
        center.z + distance * offset
      );
      camera.near = Math.max(distance / 100, 0.01);
      camera.far = Math.max(distance * 100, camera.near + 10);
      camera.updateProjectionMatrix();
      camera.lookAt(center);
    };

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    requestModel = async (url: string) => {
      const requestToken = ++currentRequestToken;
      try {
        const { scene: gltfScene } = await loader.loadAsync(url);
        if (requestToken !== currentRequestToken) {
          disposeObject(gltfScene);
          return;
        }

        gltfScene.traverse((child) => {
          const mesh = child as Mesh;
          if (!mesh.isMesh) return;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        });

        if (currentModel) {
          scene.remove(currentModel);
          disposeObject(currentModel);
        }

        currentModel = gltfScene;
        scene.add(gltfScene);
        fitCameraToObject(gltfScene);
      } catch (error) {
        throw error;
      }
    };

    clearModel = () => {
      currentRequestToken++;
      if (!currentModel) return;
      scene.remove(currentModel);
      disposeObject(currentModel);
      currentModel = null;
      renderer.render(scene, camera);
    };

    updateBackground = (value) => {
      if (value === "transparent") {
        scene.background = null;
        renderer.domElement.style.backgroundColor = "transparent";
      } else {
        scene.background = new Color(value);
        renderer.domElement.style.backgroundColor = "";
      }
      renderer.render(scene, camera);
    };

    if (background) {
      updateBackground(background);
    }

    cleanup = () => {
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      clearModel?.();
      renderer.dispose();
      if (container && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }

      requestModel = null;
      clearModel = null;
      updateBackground = null;
      updateAutoRotate = null;
    };

    return cleanup;
  });

  onDestroy(() => {
    cleanup?.();
  });
</script>

<div class="model" bind:this={container}></div>

<style>
  .model {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  :global(.model > canvas) {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
