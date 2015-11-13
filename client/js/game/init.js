if (!Detector.webgl) {
  Detector.addGetWebGLMessage();
} else {
  window.gameInstance = window.game.core();
  window.gameInstance.init({
    domContainer: document.querySelector("#game"),
    rendererClearColor: window.game.static.white
  });
}

// STATS VIA MONKEY PATCH
(function() {
  var gameLoop = window.gameInstance.loop;
  var stats = new Stats();

  stats.domElement.style.position = "absolute";
  stats.domElement.style.left = "0px";
  stats.domElement.style.top = "0px";

  document.body.appendChild( stats.domElement );

  window.gameInstance.loop = function() {
    stats.begin();
    gameLoop();
    stats.end();
  }
})();
