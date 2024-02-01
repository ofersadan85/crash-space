"use strict";

class Vec2 {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  add(vec) {
    this.x += vec.x;
    this.y += vec.y;
  }
}

class Rect {
  constructor(x, y, width, height) {
    this.position = new Vec2(x, y);
    this.width = width;
    this.height = height;
  }

  get center() {
    return new Vec2(this.position.x + this.width / 2, this.position.y + this.height / 2);
  }

  get left() {
    return this.position.x;
  }

  get right() {
    return this.position.x + this.width;
  }

  get top() {
    return this.position.y;
  }

  get bottom() {
    return this.position.y + this.height;
  }
}

class Asset {
  constructor(img, scale = 1) {
    if (typeof img === "string") {
      this.image = new Image();
      console.log(`Loading ${img}`);
      this.image.src = img;
    } else if (img instanceof Image) {
      this.image = img;
    }
    this.position = new Vec2(0, 0);
    this.velocity = new Vec2(0, 0);
    this.acceleration = new Vec2(0, 0);
    this.rotation = 0;
    this.rotation_speed = 0;
    this.scale = scale;
    this.visible = true;
    this.drawRect = true;
  }

  get rect() {
    return new Rect(this.position.x, this.position.y, this.image.width * this.scale, this.image.height * this.scale);
  }

  move(lastFrameTime = 0) {
    const deltaTime = Date.now() - lastFrameTime;
    this.rotation += this.rotation_speed * deltaTime;
    this.rotation = this.rotation >= 360 ? this.rotation - 360 : this.rotation;
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
  }

  draw(ctx) {
    // console.log(`Drawing ${this.image.src} At ${this.position.x}, ${this.position.y} Scale: ${this.scale}`)
    if (this.visible) {
      const rect = this.rect;
      ctx.rotate(this.rotation * (Math.PI / 180)); // Convert to radians
      ctx.drawImage(this.image, rect.left, rect.top, rect.width, rect.height);
      if (this.drawRect) {
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
      }
    }
  }
}

class Laser {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 10;
  }

  move(lastFrameTime = 0) {
    const deltaTime = Date.now() - lastFrameTime;
    this.y -= this.speed * deltaTime;
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.arc(this.x, this.y + 10, 3, 0, Math.PI);
    ctx.lineTo(this.x + 3, this.y);
    ctx.arc(this.x, this.y - 10, 3, Math.PI, 0);
    ctx.lineTo(this.x - 3, this.y);
    ctx.fill();
    ctx.closePath();
  }
}

class Star {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = Math.random() * 5;
    this.speed = 1;
  }

  move(lastFrameTime = 0) {
    const deltaTime = Date.now() - lastFrameTime;
    this.y += this.speed * this.radius * deltaTime;
    if (this.y > window.innerHeight + 5) {
      this.x = Math.random() * window.innerWidth;
      this.y = -5;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
  }
}

class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.spaceship = new Asset("spaceship.png", 0.3);

    this.assets = [];
    this.stars = [];
    for (let i = 0; i < 100; i++) {
      this.stars.push(new Star(Math.random() * window.innerWidth, Math.random() * window.innerHeight));
    }
    this.state = "loading";
    this.state = "playing";
    this.spaceshipFixedY = window.innerHeight * 0.5;
    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.spaceshipFixedY);
    this.ctx.lineTo(window.innerWidth, this.spaceshipFixedY);
    this.ctx.closePath();
    this.ctx.stroke();
    this.spaceship.position.y = this.spaceshipFixedY;
    this.spaceship.position.x = (window.innerWidth - this.spaceship.image.width * this.spaceship.scale) / 2;
    this.lasers = [];
    this.score = 0;
    this.health = 100;
    for (let asset of this.assets) {
      asset.position.x = -100;
      asset.position.y = -100;
      asset.velocity.x = 0;
      asset.velocity.y = 0;
      asset.visible = true;
    }
    this.drawInterface();
    let loaded = false;
    while (!loaded) {
      loaded = true;
      for (let asset of this.assets) {
        if (!asset.image.complete) {
          loaded = false;
        }
      }
    }
    console.log("Loaded");
    this.start();
  }

  draw(lastFrameTime = 0) {
    const deltaTime = Date.now() - lastFrameTime;
    this.canvas.height = window.innerHeight - 4;
    this.canvas.width = window.innerWidth - 1;
    // this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#000025";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.spaceship.move(lastFrameTime);
    if (this.spaceship.rect.left < 0) {
      this.spaceship.position.x = 0
    }
    if (this.spaceship.rect.right > window.innerWidth) {
      this.spaceship.position.x = window.innerWidth - this.spaceship.rect.width;
    }
    this.spaceship.acceleration.x *= 0.99 * deltaTime;
    this.spaceship.acceleration.y *= 0.99 * deltaTime;
    this.spaceship.draw(this.ctx);

    for (let star of this.stars) {
      star.move(lastFrameTime);
      star.draw(this.ctx);
    }

    for (let laser of this.lasers) {
      laser.move(lastFrameTime);
      if (laser.y < -10) {
        this.lasers.splice(this.lasers.indexOf(laser), 1);
      } else {
        laser.draw(this.ctx);
      }
    }

    for (let asset of this.assets) {
      asset.move(lastFrameTime);
      asset.draw(this.ctx);
    }

    this.drawInterface();

    window.requestAnimationFrame(this.draw.bind(this));
  }

  drawInterface() {
    const fontScale = window.innerWidth / 30;
    const score = `Score: ${this.score}`;
    const health = `Health: ${this.health}`;
    this.ctx.font = `${fontScale}px Arial`;
    this.ctx.fillStyle = "white";
    this.ctx.fillText(score, fontScale, fontScale);
    this.ctx.fillText(health, fontScale, window.innerHeight - fontScale * 2);
    if (this.state === "over") {
      this.ctx.fillText("Game Over", window.innerWidth / 2 - 100, window.innerHeight / 2);
    } else if (this.state === "paused") {
      this.ctx.fillText("Paused", window.innerWidth / 2 - 100, window.innerHeight / 2);
    } else if (this.state === "loading") {
      this.ctx.fillText("Loading", window.innerWidth / 2 - 100, window.innerHeight / 2);
    }

    this.ctx.strokeStyle = "white";
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(fontScale / 2, window.innerHeight - fontScale * 1.5, window.innerWidth / 3, fontScale);
    if (this.health > 50) {
      this.ctx.fillStyle = "green";
    } else if (this.health > 25) {
      this.ctx.fillStyle = "yellow";
    } else if (this.health > 0) {
      this.ctx.fillStyle = "red";
    } else {
      this.ctx.fillStyle = "black";
      this.state = "over";
    }
    this.ctx.fillRect(
      fontScale / 2,
      window.innerHeight - fontScale * 1.5,
      ((window.innerWidth / 3) * this.health) / 100,
      fontScale
    );
  }

  togglePause() {
    if (this.state === "paused") {
      this.state = "playing";
    } else if (this.state === "playing") {
      this.state = "paused";
    }
  }

  start() {
    this.state = "playing";
    this.spaceshipFixedY = this.spaceship.rect.center.y;
    this.spaceship.position.y = this.spaceshipFixedY;
    this.spaceship.position.x = (window.innerWidth - this.spaceship.image.width * this.spaceship.scale) / 2;
    this.lasers = [];
    this.score = 0;
    this.health = 100;
    for (let asset of this.assets) {
      asset.position.x = -100;
      asset.position.y = -100;
      asset.velocity.x = 0;
      asset.velocity.y = 0;
    }
    window.requestAnimationFrame(this.draw.bind(this));
  }
}

window.onload = () => {
  document.body.style.margin = 0;
  document.body.style.padding = 0;
  const canvas = document.getElementById("game");
  const enemy1 = new Asset("enemy1.png", 0.1);
  enemy1.position.x = window.innerWidth / 2 - enemy1.rect.width / 2;
  const enemy2 = new Asset("enemy2.png", 0.3);
  enemy2.position.x = window.innerWidth / 2 - enemy2.rect.width / 2;
  let game = new Game(canvas);
  game.assets = [enemy1, enemy2];
  document.addEventListener("keydown", (event) => {
    if (game.state !== "playing") return;
    if (event.key === "a") {
      game.spaceship.velocity.x = -1;
    } else if (event.key === "d") {
      game.spaceship.velocity.x = 1;
    } else if (event.key === " ") {
      game.lasers.push(new Laser(game.spaceship.position.x + game.spaceship.rect.width / 2, game.spaceship.position.y));
      game.health -= 5;
    } else if (event.key === "Escape" || event.key === "p") {
      game.togglePause();
    } else if (event.key === "r") {
      game = new Game(canvas);
      game.assets = [enemy1, enemy2];
      game.start();
    }
  });
};
