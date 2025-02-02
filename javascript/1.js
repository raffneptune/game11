(function () {

  var GameInstance = new Game();

  function Game() {
    var G = {};

    G.active_baddie = null;

    init();

    function init() {
      setAlphabet();
      setAudio();
      setElements();
      setContext();
      setState();
      setMethods();
      setEvents();
    }

    function setAlphabet() {
      G.alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
    }

    function setElements() {
      G.$hero = document.getElementById("hero");
      G.bloodshed = document.getElementById("bloodshed");
      G.$bloodshed = G.bloodshed.getContext("2d");
      G.$level = document.getElementById("level");
      G.$level_again = document.getElementById("level-again");
      G.$context = document.getElementById("context");
      G.$baddies = document.getElementById("baddies");
      G.$projectiles = document.getElementById("projectiles");
      G.$audio_toggle = document.getElementById("audio-toggle");
      G.$result = document.getElementById("result");
      G.$start_screen = document.getElementById("start-screen");
      G.$end_screen = document.getElementById("end-screen");
      G.$start = document.getElementById("start");
      G.$start_over = document.getElementById("start-over");
    }

    function setContext() {
      G.context = {
        width: G.$context.offsetWidth,
        height: G.$context.offsetHeight,
        target: {
          x: G.$context.offsetWidth * 0.5,
          y: G.$context.offsetHeight * 0.9
        }
      };


    }

    function setState() {
      resetScores(1);
      G.playing = false;
      G.start = start;
    }

    function resetScores(level) {
      G.level = level;
      G.kill_count = 0;
      G.passed_count = 0;
      G.fire_count = 0;
      G.hit_count = 0;
      G.you_arent_dead = true;
      G.weapons = {};
      G.problematic = {};
      G.active_baddie = null;
      G.$result.innerHTML = "";
    }

    function setMethods() {
      G.gameOver = gameOver;
      G.muted = false;
      G.playAudio = playAudio;
      G.muteAudio = muteAudio;
      G.offscreen = offscreen;
    }

    function playAudio() {
      G.$soundtrack.play();
    }

    function muteAudio() {
      G.$soundtrack.pause();
    }

    function start(level) {
      clearExplosions();
      resetScores(level);
      G.start_time = Date.now() / 1000;
      G.start_level = level;
      createWave();
      G.playing = true;
      G.$context.className += " active";
      G.$start_screen.className = G.$start_screen.className.replace(" active", "");
      G.$end_screen.className = G.$end_screen.className.replace(" active", "");
      if (!G.muted) {
        G.$soundtrack.play();
      }
    }

    function clearExplosions() {
      var bloodshed = G.bloodshed;
      G.$bloodshed.clearRect(0, 0, bloodshed.width, bloodshed.height);
    }

    function sanitizeLevel(value) {
      var number = parseInt(value);
      number = Math.min(50, number);
      return Math.max(1, number);
    }

    function stop() {
      G.playing = false;
      G.stop_time = Date.now() / 1000;
      G.elapsed_time = time();
      G.$context.className = G.$context.className.replace(" active", "");
      G.$soundtrack.pause();
      G.$soundtrack.currentTime = 0;
      G.$end_screen.className += " active";
    }

    function time() {
      var time = G.stop_time - G.start_time;
      var minutes = Math.floor(time / 60);
      var seconds = Math.round(time - minutes * 60);
      var string = "";
      if (minutes > 0) string += minutes + "m ";
      string += seconds + "s";
      return string;
    }

    function setAudio() {
      var base_url = "https://s3-us-west-2.amazonaws.com/s.cdpn.io/111863/";
      G.$soundtrack = document.createElement("audio");
      G.$soundtrack.loop = true;
      G.$soundtrack.volume = 0.8;
      G.$soundtrack.src = base_url + "Sprawl_II.mp3";
      G.sound_effects = {
        keys: [],
        kills: []
      };

      for (var i = 0; i < 5; i++) {
        G.sound_effects;
        var el = document.createElement("audio");
        el.src = base_url + "key_" + (i + 1) + ".mp3";
        G.sound_effects.keys.push(el);
      }
      // for (var i = 0; i < 10; i++) {
      //   G.sound_effects  
      //   var el = document.createElement("audio");
      //   el.src = base_url + "kill_" + (i + 1) + ".mp3";
      //   G.sound_effects.kills.push(el);
      // }
    }

    function playKey() {
      if (G.muted) return;
      var el = G.sound_effects.keys[Math.floor(Math.random() * G.sound_effects.keys.length)];
      el.play();
    }

    function playKill() {
      return;
      if (G.muted) return;
      if (G.kill_count % Math.max(Math.floor(G.level / 2), 2) !== 0) return;
      var el = G.sound_effects.kills[Math.floor(Math.random() * G.sound_effects.kills.length)];
      el.play();
    }

    function gameOver() {
      stop();
      G.you_arent_dead = false;
      removeDOM();
      loadResults();
    }

    function removeDOM() {
      G.$baddies.innerHTML = "";
      //G.$projectiles.innerHTML = ""; // should already be empty
    }

    function loadResults() {
      var list = document.createElement("ul");

      if (G.start_level !== G.level) {
        listItem("Levels", G.start_level + "-" + G.level);
      } else {
        listItem("Level", G.level);
      }
      listItem("Time", G.elapsed_time);
      listItem("Kills", G.kill_count);
      listItem("Hits", G.hit_count);
      listItem("Shots", G.fire_count);
      listItem("Accuracy", Math.round((G.hit_count / G.fire_count || 0) * 100) + "%");
      if (G.passed_count > 0) {
        listItem("Escaped", G.passed_count);
      }
      listItem("Top Weapons", G.weapons);
      listItem("Problematic Sequences", G.problematic);

      G.$result.appendChild(list);

      function listItem(label, data) {
        var li = document.createElement("li");
        var l = document.createElement("span");
        var d = document.createElement("span");
        l.innerHTML = label;
        l.className = "label";

        if (typeof data !== "string" && typeof data !== "number") {
          li.className = "full";
          var sorted = [];

          for (var item in data) {
            sorted.push([item, data[item]]);
          }

          sorted = sorted.sort(function (a, b) {
            return b[1] - a[1];
          });


          var string = "";
          for (var s = 0; s < Math.min(5, sorted.length); s++) {
            string += '"' + sorted[s][0].toUpperCase() + '": ' + sorted[s][1] + ", ";
          }

          string = string.replace(/(, $)|(,$)/, '');

          d.innerHTML = string;
          d.className = "value";

        } else {
          d.innerHTML = data;
          d.className = "value";
        }

        if (d.innerHTML !== "") {
          li.appendChild(l);
          li.appendChild(d);
          list.appendChild(li);
        }
      }
    }

    function createWave() {
      setTimeout(function () {
        notifyLevel();
        G.$baddies.innerHTML = "";
        delete G.wave;
        G.wave = new EnemyWave({
          game: G
        });
        G.wave.spawn();
        G.wave_kills = 0;
        G.wave_count = Object.keys(G.wave.baddies).length;
      }, 200);
    }

    function setEvents() {
      document.addEventListener("keydown", assault, false);

      G.$start.addEventListener("click", function () {
        start(sanitizeLevel(G.$level.value));
      });

      G.$start_over.addEventListener("click", function () {
        start(sanitizeLevel(G.$level_again.value));
      });

      G.$audio_toggle.addEventListener("click", function () {
        if (G.muted) {
          G.$audio_toggle.className = G.$audio_toggle.className.replace(" muted", "");
          if (G.playing) G.playAudio();
        } else {
          G.$audio_toggle.className += " muted";
          G.muteAudio();
        }
        G.muted = !G.muted;
      }, false);
    }

    // when something makes it offscreen
    function offscreen() {
      G.passed_count++;
      G.wave_kills++;
      if (G.wave_kills === G.wave_count) {
        G.level++;
        createWave();
      }
    }

    function notifyLevel() {
      var notify = document.createElement("div");
      notify.className = "level-notify";
      notify.innerHTML = G.level;
      G.$context.appendChild(notify);
      setTimeout(function () {
        G.$context.removeChild(notify);
      }, 3000);
    }

    // assaulting the legion
    function assault(e) {
      if (!G.playing) return;

      var keyCode = e.keyCode;
      if (keyCode === 8) {
        e.preventDefault();
      }
      var key = G.alphabet[keyCode - 65];
      if (key) {

        playKey();
        // miss or hit fire
        G.fire_count++;

        if (G.weapons[key]) {
          G.weapons[key]++;
        } else {
          G.weapons[key] = 1;
        }

        if (G.active_baddie) {
          var fire = G.active_baddie.fire(key);
          if (fire !== "miss") G.hit_count++;
          if (fire === "killed") {
            playKill();
            G.active_baddie = null;
            G.kill_count++;
            G.wave_kills++;

            if (G.wave_kills === G.wave_count) {
              G.level++;
              createWave();
            }
          }

        } else {

          var hit = G.wave.assault(key);
          if (hit) {
            G.hit_count++;
            return G.active_baddie = hit;
          }
          return G.active_baddie = null;
        }
      }
    }
    return G;
  }



  function Enemy(params) {
    var E = {};

    var library;

    init();

    function init() {
      library = params.library;
      E.game = params.wave.game;
      E.complexity = params.complexity;
      E.context = {
        width: E.game.context.width,
        height: E.game.context.height,
        target: E.game.context.target
      };

      E.word = chooseWord(params.existing_chars);
      if (E.word) {
        E.word_arr = E.word.split("");
        E.key = E.word_arr[0];
        E.strike_me = 0;
        E.speed = speed();
        E.is_holding_on_for_dear_life = true;
        E.fire = fire;
        setUpElement();
        beginWarpath();
      } else {
        E = null;
        return E;
      }
    }

    function setUpElement() {
      E.$el = createElement();
      setTimeout(function () {
        E.context.el_w = E.$el.offsetWidth;
        E.context.el_h = E.$el.offsetHeight;
        E.context.gutter = E.context.el_w / 2;
        var initial_x = Math.random() * E.context.width;
        initial_x = Math.max(Math.min(initial_x, E.context.width - E.context.gutter), E.context.gutter);
        var initial_y = Math.random() * -150;
        position({
          x: initial_x,
          y: initial_y
        });
      }, 0);

    }

    function speed() {
      var base_speed = 1000 / 120;
      return Math.round(base_speed);
    }

    function fire(key) {
      if (key == E.word_arr[E.strike_me]) {
        hitDOM();
        if (!E.$el.className.indexOf("active") > -1) E.$el.className += " active";
        E.strike_me++;

        if (E.strike_me > E.word_arr.length - 1) {
          E.is_holding_on_for_dear_life = false;
          killDOM();
          return "killed";
        }

        return "hit";
      } else {
        logProblematic();
        return "miss";
      }
    }

    function logProblematic() {
      var key = E.word_arr[E.strike_me - 1] + E.word_arr[E.strike_me];
      if (E.strike_me < E.word_arr.length - 1) {
        key += E.word_arr[E.strike_me + 1];
      }
      if (E.game.problematic[key]) {
        E.game.problematic[key]++;
      } else {
        E.game.problematic[key] = 1;
      }
    }

    function hitDOM() {
      var $char = document.getElementById([E.key, E.strike_me, E.word_arr[E.strike_me]].join(""));
      fireProjectile();
      $char.setAttribute("id", "");
      $char.className = "hit";
    }

    function killDOM() {
      E.$el.className += " killed";
    }

    function drawExplosion(x, y) {
      var bloodshed = E.game.$bloodshed;
      var color = "rgba(241, 103, 69, 0.02)";
      var rat = E.complexity / 10;
      var influx = 3;
      var di = 50 * (1 + influx * rat);

      bloodshed.beginPath();
      var radius = di / 2;
      bloodshed.arc(x, y, radius, 0, Math.PI * 2, false);
      bloodshed.closePath();
      bloodshed.fillStyle = color;
      bloodshed.fill();
    }

    function fireProjectile() {
      var dest_x = E.context.x;
      var dest_y = E.context.y + E.context.el_h / 2;

      var $projectile = document.createElement("span");
      $projectile.className = "projectile projectile-" + E.complexity;

      var transform = "translate3d(" + E.context.target.x + "px, " + E.context.target.y + "px, 0)";
      $projectile.style.webkitTransform = transform;
      $projectile.style.transform = transform;
      E.game.$projectiles.appendChild($projectile);

      var transform_end = "translate3d(" + dest_x + "px, " + dest_y + "px, 0)";
      setTimeout(function () {
        $projectile.style.webkitTransform = transform_end;
        $projectile.style.transform = transform_end;
        drawExplosion(dest_x, dest_y);
      }, 50);
      setTimeout(function () {
        E.game.$projectiles.removeChild($projectile);
      }, 50 + 400);
    }

    // choose a word that doesnt start with a letter inside the provided array
    function chooseWord(existing_letters) {
      if (typeof library === "string" || library.length <= 0) return null;

      var index = Math.floor(Math.random() * library.length);
      var word = library[index];

      // remove it from parent library to reduce the processing
      library.splice(index, 1);

      // validate that this word's first letter hasnt been selected yet
      if (existing_letters.indexOf(word.split("")[0]) > -1) {
        return chooseWord(existing_letters);
      } else {
        return word;
      }
    }

    // create an element
    function createElement() {
      var $el = document.createElement("div");
      $el.className = "baddie baddie-lvl-" + E.complexity;
      $el.innerHTML = E.word.split("").map(function (char, index) {
        return ['<span id="', E.key, index, char, '">', char, "</span>"].join("");
      }).join("");
      return $el;
    }

    function beginWarpath() {
      E.warpath_go = null;
      window.requestAnimationFrame(warpath);
    }

    function warpath(timestamp) {
      if (!E.warpath_go) E.warpath_go = timestamp;
      var progress = timestamp - E.warpath_go;
      move();
      if (E.game.you_arent_dead && E.is_holding_on_for_dear_life) {
        setTimeout(function () {
          window.requestAnimationFrame(warpath);
        }, E.speed);
      }
    }

    function move() {
      if (E.is_holding_on_for_dear_life) {
        var coors = randomCoords();
        position(coors);
      }
    }

    function randomCoords() {
      var factor = Math.floor(E.game.level / 18) * 0.5 - 0.5;
      var step = (7 - E.complexity) / 6 * (2 + factor);
      var x = E.context.x;
      var y = E.context.y;

      var longitudinal_proximity = y / E.context.target.y;
      var odds_of_sucking = Math.max(0.6 * (1 - longitudinal_proximity), 0.3);

      var is_failing_at_trying_to_murder_you_laterally = Math.random() <= odds_of_sucking;
      var is_failing_at_trying_to_murder_you_longitudinally = Math.random() <= odds_of_sucking / 2;
      var step_x = E.context.target.x < x ? -step : step;
      var step_y = step;

      if (is_failing_at_trying_to_murder_you_laterally) step_x *= -1;
      if (is_failing_at_trying_to_murder_you_longitudinally) step_y = 0;

      var gutter = E.context.gutter || 40;
      var new_x = Math.max(Math.min(x + step_x, E.context.width - gutter), gutter);

      return {
        x: new_x,
        y: y + step_y
      };
    }

    function position(coors) {
      E.context.x = coors.x;
      E.context.y = coors.y;

      if (inRange(coors, "x") && inRange(coors, "y")) {
        E.game.gameOver();
      }

      if (E.context.y > E.context.height) {
        E.game.offscreen();
        if (E.game.active_baddie === E) E.game.active_baddie = null;
        E.is_holding_on_for_dear_life = false;
      }
      var left = coors.x - E.context.el_w / 2;
      var top = coors.y - E.context.el_h / 2;
      var transform = "translate3d(" + left + "px, " + top + "px, 0)";
      E.$el.style.webkitTransform = transform;
      E.$el.style.transform = transform;
    }

    function inRange(coors, which) {
      var hit_box = 30;
      return coors[which] < E.context.target[which] + hit_box && coors[which] > E.context.target[which] - hit_box;
    }

    return E;
  }



  function EnemyWave(params) {
    var EW = {};

    EW.library = new Lib();

    EW.game = params.game;
    EW.level = params.game.level;
    EW.baddies = spawnBaddies();
    EW.$container = document.getElementById("baddies");

    EW.spawn = function () {
      for (var key in EW.baddies) {
        EW.$container.appendChild(EW.baddies[key].$el);
      }
    };

    EW.assault = function (key) {
      if (EW.baddies[key] && EW.baddies[key].is_holding_on_for_dear_life) {
        EW.baddies[key].fire(key);
        return EW.baddies[key];
      } else {
        return null;
      }
    };


    function spawnBaddies() {
      var wave = {};
      var existing_chars = [];

      var levels_per_stage = 3;
      var stages_per_world = 9;
      var stage = Math.floor((EW.level - 1) / levels_per_stage) + 1;
      var world = Math.floor((EW.level - 1) / stages_per_world) + 1;

      addEnemies(Math.min(world, 5), world);
      addEnemies(Math.min(Math.max(1, Math.floor(world * 0.7)), 3), world + 1);
      addEnemies(Math.min(Math.max(1, Math.floor(world * 0.5)), 3), world + 2);

      if (world > 4) {
        addEnemies(1, world - 2);
        addEnemies(1, world - 1);
      }

      function addEnemies(count, complexity) {
        for (var i = 0; i < count; i++) {
          addEnemyToWave(Math.min(complexity, 6));
        }
      }

      function addEnemyToWave(complexity) {
        var e = new Enemy({
          library: EW.library[complexity],
          complexity: complexity,
          existing_chars: existing_chars,
          context: params.context,
          wave: EW
        });


        if (Object.keys(e).length) {
          wave[e.key] = e;
          existing_chars.push(e.word.split("")[0]);
        }
      }

      if (Object.keys(wave).length) {
        return wave;
      } else {
        EW.game.gameOver();
      }
    }

    function Lib() {
      var lib = {
        1: "nil lib go pen var if add zsh run php bug fix api key add all id em erb rem px ux ui svg for box git xml rtc pre rgb hsl rel web js def moz end to dev css".split(" "),
        2: "void null code scss bash else push edge ruby pull tidy head body foot haml slim jade true html color top span left right save fork flex none bold auto href link size ease fill path rgba hsla from skew sort font size team sass hash json less attr text data".split(" "),
        3: "react ember event width height clone gulp concat fetch valid aside style elsif babel jquery param start assign posts logos chrome blogs block align xcode slack class agile xmlns origin comma scrum stroke scale false rails".split(" "),
        4: "inline method deploy target assign window grunt commit minify jekyll stylus article import tweets google opacity weight bottom scroll italic profile hidden github keytrap editor webkit string number integer decimal period jsconf".split(" "),
        5: "inherit function includes bourbon normalize angular explorer section ternary twitter overflow absolute postcss invalid viewbox content sublime session display background compile bracket backbone boolean  dreamhire contains standup".split(" "),
        6: "chriscoyier javascript cssdevconf customers autoprefixer stackoverflow visibility headphones underscore bootstrap csstricks typescript livescript customer settings semicolon attribute parenthesis markdown compiler responsive preprocessor webdesign developer development".split(" ")
      };

      return lib;
    }

    return EW;
  }

})();