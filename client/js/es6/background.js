  // const scene = document.getElementById('background');
  /**
   * create new scene
   */
  const scene = new THREE.Scene();
  const backgroundContainer = document.getElementById('background');


  /**
   * PerspectiveCamera([1],[2],[3],[4])
   * [1] -sets vertical FOV in degrees
   * [2] -aspect ratio
   * [3] -near clipping plane
   * [4] -far clipping plane
   */
  const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth/window.innerHeight,
    1,
    5000
  );

  /**
   * set up WebGLRenderer
   * 	--CanvasRenderer can be used as fallback--
   * create instance and setSize of renderer
   *
   */
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  // document.body.appendChild(renderer.domElement);
  backgroundContainer.appendChild(renderer.domElement);

  /**
   * use BoxGeometry obj with all vertices and faces of the cube
   * BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments)
   * Segement args are optional -default to 1-
   */
  let geometry = new THREE.BoxGeometry(700, 700, 700, 10, 10, 10);

  /**
   * color box with mesh material
   */
  let material = new THREE.MeshBasicMaterial({color: 0xfffff, wireframe: true});

  let cube = new THREE.Mesh(geometry, material);
  /**
   * add cube to scene
   * set at origin (0,0,0)
   */
  scene.add(cube);

  /**
   * set camera before rendering scene
   */
  camera.position.z = 1000;

  /**
   * create a render loop
   */
  let render = () => {
    requestAnimationFrame(render);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  };
  render();
