Pacman.Ghost = function (game, map, ghostSpec) {
  var position = null,
    direction = null,
    eatable = null,
    eaten = null,
    due = null,
    color =
      ghostSpec.color ??
      "#" +
        ("00000" + ((Math.random() * 16777216) << 0).toString(16)).substr(-6);

  function getNewCoord(dir, current) {
    var speed = isVunerable() ? 1 : isHidden() ? 4 : 2,
      xSpeed = (dir === LEFT && -speed) || (dir === RIGHT && speed) || 0,
      ySpeed = (dir === DOWN && speed) || (dir === UP && -speed) || 0;

    return {
      x: addBounded(current.x, xSpeed),
      y: addBounded(current.y, ySpeed),
    };
  }

  /* Collision detection(walls) is done when a ghost lands on an
   * exact block, make sure they dont skip over it
   */
  function addBounded(x1, x2) {
    var rem = x1 % 10,
      result = rem + x2;
    if (rem !== 0 && result > 10) {
      return x1 + (10 - rem);
    } else if (rem > 0 && result < 0) {
      return x1 - rem;
    }
    return x1 + x2;
  }

  function isVunerable() {
    return eatable !== null;
  }

  function isDangerous() {
    return eaten === null;
  }

  function isHidden() {
    return eatable === null && eaten !== null;
  }

  function getRandomDirection(availableDirections = [LEFT, RIGHT, UP, DOWN]) {
    if (availableDirections.length !== 4)
      return availableDirections[
        Math.floor(Math.random() * availableDirections.length)
      ];
    const moves =
      direction === LEFT || direction === RIGHT ? [UP, DOWN] : [LEFT, RIGHT];
    return moves[Math.floor(Math.random() * 2)];
  }

  function reset() {
    eaten = null;
    eatable = null;
    position = ghostSpec.home
      ? {
          x: ghostSpec.home.x * 10,
          y: ghostSpec.home.y * 10,
        }
      : { x: 90, y: 80 };
    direction = getRandomDirection();
    due = getRandomDirection();
  }

  function onWholeSquare(x) {
    return x % 10 === 0;
  }

  function oppositeDirection(dir) {
    return (
      (dir === LEFT && RIGHT) ||
      (dir === RIGHT && LEFT) ||
      (dir === UP && DOWN) ||
      UP
    );
  }

  function makeEatable() {
    direction = oppositeDirection(direction);
    eatable = game.getTick();
  }

  function eat() {
    eatable = null;
    eaten = game.getTick();
  }

  function pointToCoord(x) {
    return Math.round(x / 10);
  }

  function nextSquare(x, dir) {
    var rem = x % 10;
    if (rem === 0) {
      return x;
    } else if (dir === RIGHT || dir === DOWN) {
      return x + (10 - rem);
    } else {
      return x - rem;
    }
  }

  function onGridSquare(pos) {
    return onWholeSquare(pos.y) && onWholeSquare(pos.x);
  }

  function secondsAgo(tick) {
    return (game.getTick() - tick) / Pacman.FPS;
  }

  function getColor() {
    if (eatable) {
      if (secondsAgo(eatable) > 5) {
        return game.getTick() % 20 > 10 ? "#FFFFFF" : "#0000BB";
      } else {
        return "#0000BB";
      }
    } else if (eaten) {
      return "#222";
    }
    return color;
  }

  function draw(ctx) {
    const s = map.blockSize;
    if (ghostSpec.img) {
      const ghostImg = new Image();
      ghostImg.src = ghostSpec.img;
      const ghostWidth =
        ghostImg.width > ghostImg.height
          ? s
          : s * (ghostImg.width / ghostImg.height);
      ctx.drawImage(
        ghostImg,
        (position.x / 10) * s - (ghostWidth - s) / 2,
        (position.y / 10) * s,
        ghostWidth,
        s
      );
      return;
    }
    const top = (position.y / 10) * s + s / 10,
      left = (position.x / 10) * s;

    if (eatable && secondsAgo(eatable) > 8) {
      eatable = null;
    }

    if (eaten && secondsAgo(eaten) > 3) {
      eaten = null;
    }

    var tl = left + s - s / 10;
    var base = top + s - s / 5;
    var inc = s / 10;

    var high = game.getTick() % 10 > 5 ? 3 : -3;
    var low = game.getTick() % 10 > 5 ? -3 : 3;

    ctx.fillStyle = getColor();
    ctx.beginPath();

    ctx.moveTo(left, base);

    ctx.quadraticCurveTo(left, top, left + s / 2, top);
    ctx.quadraticCurveTo(left + s, top, left + s, base);

    // Wavy things at the bottom
    ctx.quadraticCurveTo(tl - inc * 1, base + high, tl - inc * 2, base);
    ctx.quadraticCurveTo(tl - inc * 3, base + low, tl - inc * 4, base);
    ctx.quadraticCurveTo(tl - inc * 5, base + high, tl - inc * 6, base);
    ctx.quadraticCurveTo(tl - inc * 7, base + low, tl - inc * 8, base);
    ctx.quadraticCurveTo(tl - inc * 9, base + high, tl - inc * 10, base);

    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "#FFF";
    ctx.arc(left + s / 6, top + 6, s / 6, 0, 300, false);
    ctx.arc(left + s - s / 6, top + 6, s / 6, 0, 300, false);
    ctx.closePath();
    ctx.fill();

    var f = s / 12;
    var off = {};
    off[RIGHT] = [f, 0];
    off[LEFT] = [-f, 0];
    off[UP] = [0, -f];
    off[DOWN] = [0, f];

    ctx.beginPath();
    ctx.fillStyle = "#000";
    ctx.arc(
      left + 6 + off[direction][0],
      top + 6 + off[direction][1],
      s / 15,
      0,
      300,
      false
    );
    ctx.arc(
      left + s - 6 + off[direction][0],
      top + 6 + off[direction][1],
      s / 15,
      0,
      300,
      false
    );
    ctx.closePath();
    ctx.fill();
  }

  function pane(pos) {
    if (pos.y === 100 && pos.x >= 190 && direction === RIGHT) {
      return { y: 100, x: -10 };
    }

    if (pos.y === 100 && pos.x <= -10 && direction === LEFT) {
      return (position = { y: 100, x: 190 });
    }

    return false;
  }

  function move(ctx, availableDirections = [LEFT, RIGHT, UP, DOWN]) {
    var oldPos = position,
      onGrid = onGridSquare(position),
      npos = null;

    if (due !== direction) {
      npos = getNewCoord(due, position);

      if (
        onGrid &&
        map.isFloorSpace({
          y: pointToCoord(nextSquare(npos.y, due)),
          x: pointToCoord(nextSquare(npos.x, due)),
        })
      ) {
        direction = due;
      } else {
        npos = null;
      }
    }

    if (npos === null) {
      npos = getNewCoord(direction, position);
    }

    if (
      onGrid &&
      map.isWallSpace({
        y: pointToCoord(nextSquare(npos.y, direction)),
        x: pointToCoord(nextSquare(npos.x, direction)),
      })
    ) {
      // TODO: Add available directions here
      due = getRandomDirection(availableDirections);
      // remove direction from availableDirections
      availableDirections = availableDirections.filter((dir) => dir !== due);
      return move(ctx, availableDirections);
    }

    if (npos.y < 0) {
      npos = { y: Pacman.MAP.length * 10, x: npos.x };
    } else if (npos.y > Pacman.MAP.length * 10) {
      npos = { y: 0, x: npos.x };
    }

    if (npos.x <= 0) {
      npos = { y: npos.y, x: Pacman.MAP[0].length * 10 };
    } else if (npos.x >= Pacman.MAP[0].length * 10) {
      npos = { y: npos.y, x: 0 };
    }

    position = npos;

    var tmp = pane(position);
    if (tmp) {
      position = tmp;
    }

    due = getRandomDirection();

    return {
      new: position,
      old: oldPos,
    };
  }

  return {
    eat: eat,
    isVunerable: isVunerable,
    isDangerous: isDangerous,
    makeEatable: makeEatable,
    reset: reset,
    move: move,
    draw: draw,
  };
};
