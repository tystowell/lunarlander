var canvas = document.getElementById("game");
var context = canvas.getContext("2d");
var canvasLeftOffset = canvas.offsetLeft;
var canvasTopOffset = canvas.offsetTop;
var GRAVITY_FORCE = 0.01;
var leftKey = false;
var rightKey = false;
var upKey = false;
var gameOver = false;
var buttons = [];
var meteors = [];
var lastRightLeg = false;
var lastLeftLeg = false;
var meteorVelocity = 7;
var heights = [];

function meteor(size, position){
  this.size = size;
  this.position = position;
  this.velocity = {
    x: meteorVelocity * (Math.random() * .1 + .95),
    y: 0
  };
}

meteor.prototype.draw = function(){
  context.beginPath();
  context.arc(this.position.x, this.position.y, this.size, 0, 2 * Math.PI);
  context.fillStyle = "gray";
  context.fill();
  context.closePath();
}

meteor.prototype.update = function(){
  if(this.position.x > 0 && this.position.x < canvas.width){
    this.velocity.y += (GRAVITY_FORCE * (Math.random() * .5 + .75));
  }
  this.position.x += this.velocity.x;
  this.position.y += this.velocity.y;
  if(this.position.x - this.size > canvas.width){
    this.position.x = -(Math.random() * 300 + this.size);
    this.position.y = (Math.random() * 100 + 50);
    this.velocity.x = meteorVelocity * (Math.random() * .1 + .95);
    this.velocity.y = 0;
  }
  var leftRightColliding = this.position.x + this.size > lander.leftLegX && this.position.x - this.size < lander.rightLegX;
  var topColliding = (this.position.y - this.size < lander.leftLegY || this.position.y - this.size < lander.rightLegY);
  var bottomColliding = (this.position.y + this.size > lander.leftLegY || this.position.y + this.size > lander.leftLegY);
  var circleColliding = (Math.sqrt(Math.pow(this.position.x - lander.position.x, 2) + Math.pow(this.position.y - lander.position.y, 2)) < this.size + (lander.width/2));
  if((leftRightColliding && topColliding && bottomColliding) || circleColliding){
    gameOver = true;
  }
}

function Spaceship(size, position, power) {
  this.color = "white";
  this.width = size;
  this.height = size * 2.5;
  this.position = position;
  this.velocity = {
    x: 0,
    y: 0
  };
  this.angle = 0;
  this.engineOn = false;
  this.rotation = 0;
  this.power = power;
  this.leftLegX;
  this.leftLegY;
  this.rightLegX;
  this.rightLegY;
  this.excessAngle = Math.atan((2 * this.width)/((5 * this.height) + (10 * this.width * Math.sqrt(2)))); //Angle (constant) used in many calculations.
  this.circleRadius = (this.width * Math.sqrt(2)) + (this.height/4.3); //Used for calculating positions of legs with sin() and cos(). Constant.
  this.impactVelocity = 0; //velocity of latest impact.
  this.speed = 0; //Current speed.
}

Spaceship.prototype.draw = function(){
  context.save();
  context.translate(this.position.x, this.position.y);
  context.rotate(this.angle);
  context.beginPath();
  context.arc(0, this.height * -0.2, this.width/1.1, 0, 2 * Math.PI);
  context.fillStyle = this.color;
  context.fill();
  context.closePath();
  drawRect(this.width * -0.5, this.height * -0.5, this.width, this.height, this.color);
  context.rotate(Math.PI/4);
  drawRect((this.width*Math.sqrt(2))/2, 0, this.height/2, this.width/5, this.color);
  drawRect(0, (this.width*Math.sqrt(2))/2, this.width/5, this.height/2, this.color);
  context.rotate(-Math.PI/4);
  if(this.engineOn){
        context.beginPath();
        context.moveTo(this.width * -0.5, this.height * 0.5);
        context.lineTo(this.width * 0.5, this.height * 0.5);
        context.lineTo(0, this.height * 0.5 + (Math.random() * 5 * this.height/16));
        context.lineTo(this.width * -0.5, this.height * 0.5);
        context.closePath();
        context.fillStyle = "orange";
        context.fill();
  }
  context.restore();
  if(this.position.y < -this.height){
    context.beginPath();
    context.moveTo(this.position.x, 0);
    context.lineTo(this.position.x - 15, 15);
    context.lineTo(this.position.x + 15, 15);
    context.lineTo(this.position.x, 0);
    context.closePath();
    context.fillStyle = "gray";
    context.fill();
  }
  drawRect(10, 10, 20, 20, "gray");
  context.beginPath();
  context.fillStyle = "gray";
  context.moveTo(20, 20);
  context.lineTo((Math.cos(this.angle - (Math.PI/2)) * 10) + 20, (Math.sin(this.angle - (Math.PI/2)) * 10) + 20);
  context.stroke();
  context.closePath();
  drawRect(32, 10, 60, 20, "gray");
  drawText(Math.round(this.speed * 10)/10, 32, 28, "black");
}

Spaceship.prototype.update = function(){//All physics happen in here (And detection for losing).
  if(!gameOver){
    this.rightLegX = this.position.x + Math.cos(this.angle + (Math.PI/4) + this.excessAngle) * this.circleRadius;
    this.rightLegY = this.position.y + Math.sin(this.angle + (Math.PI/4) + this.excessAngle) * this.circleRadius;//Right Leg
    this.leftLegX = this.position.x + Math.cos(this.angle + ((3 * Math.PI)/4) - this.excessAngle) * this.circleRadius;//Left Leg
    this.leftLegY = this.position.y + Math.sin(this.angle + ((3 * Math.PI)/4) - this.excessAngle) * this.circleRadius;//Left Leg
    if(leftKey){
      this.rotation -= this.power * Math.PI / 240;
    }
    if(rightKey){
      this.rotation += this.power * Math.PI / 240;
    }
    this.rotation += -(this.rotation * Math.PI/180); //Friction
    this.angle += this.rotation;

    this.engineOn = upKey;
    if(this.engineOn){
      this.velocity.x -= this.power * Math.sin(-this.angle);
      this.velocity.y -= this.power * Math.cos(this.angle);
    }
    this.velocity.y += GRAVITY_FORCE; //Gravity
    var rightLegOnGround = this.rightLegY > canvas.height - heights[Math.floor(this.rightLegX)];
    var leftLegOnGround = this.leftLegY > canvas.height - heights[Math.floor(this.leftLegX)];

    if(rightLegOnGround){
      if(!lastRightLeg){
        var torque = (Math.PI/500) * Math.sin(this.angle - this.excessAngle + (Math.PI/2)) * this.circleRadius * GRAVITY_FORCE;// sin(theta) * F * R
        this.rotation -= torque;
        if(!leftLegOnGround){
          this.impactVelocity = Math.sqrt(Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.y, 2));
          this.velocity.x -= 0.5 * this.velocity.x * this.velocity.y;
        }
      }
      var forceY = this.velocity.y;
      if(this.velocity.y > 0){
        this.velocity.y = -((forceY)/4);
      }
      if(this.rightLegY - canvas.height + heights[Math.floor(this.rightLegX)] > 3){
        this.velocity.y -= 0.03;
      }
      this.velocity.x += (this.velocity.x > 0) ? -0.01 : 0.01;
    }

    if(leftLegOnGround){
      if(!lastLeftLeg){
        var torque = (Math.PI/500) * Math.sin(this.angle - this.excessAngle + (Math.PI/2)) * this.circleRadius * GRAVITY_FORCE;// sin(theta) * F * R
        this.rotation += torque;
        if(!rightLegOnGround){
          this.impactVelocity = Math.sqrt(Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.y, 2));
          this.velocity.x -= 0.5 * this.velocity.x * this.velocity.y;
        }
      }
      var forceY = this.velocity.y;
      if(this.velocity.y > 0){
        this.velocity.y = -((forceY)/4);
      }
      if(this.leftLegY - canvas.height + heights[Math.floor(this.leftLegX)] > 3){
        this.velocity.y -= 0.03;
      }
      this.velocity.x += (this.velocity.x > 0) ? -0.01 : 0.01;
    }

    var topOnGround = (this.position.y + this.width/1.1) > (canvas.height - heights[Math.floor(this.position.x)]);

    if(topOnGround){
      this.impactVelocity = Math.sqrt(Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.y, 2));
      gameOver = true;
    }

    this.rotation += (leftLegOnGround && !rightLegOnGround) ? 0.001 : ((rightLegOnGround && !leftLegOnGround) ? -0.001 : 0);
    if(leftLegOnGround && rightLegOnGround){
      this.rotation = 0;
    }
    lastRightLeg = rightLegOnGround;
    lastLeftLeg = leftLegOnGround;
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.speed = Math.sqrt(Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.y, 2));
    if(this.position.x > canvas.width + this.width){
      this.position.x = -this.width + 1;
    }
    if(this.position.x < -this.width){
      this.position.x = canvas.width + this.width - 1;
    }
  }
  if(this.impactVelocity > 3){
    gameOver = true;
  }
}

function draw(){
    context.clearRect(0, 0, canvas.width, canvas.height);

    drawScene();

    updateMeteors();

    lander.update();

    lander.draw();

    if(!gameOver){
      requestAnimationFrame(draw);
    }else{
      gameOverScreen();
    }
}

document.addEventListener('keyup', keyUp);

document.addEventListener('keydown', keyDown);

document.addEventListener('click', onClick, false);

var lander = new Spaceship(5, {x: canvas.width/2, y: 50}, 0.04);

start();

function randomizeTerrain(){
  var peakXPositions = [];

  for(var i = 0; i < 4; i ++){
    peakXPositions.push(Math.floor(canvas.width * Math.random()));
  }

  var peakYPositions = [];

  for(var i = 0; i < peakXPositions.length; i ++){
    peakYPositions.push((Math.random()/4 + .75) * 100);
  }

  var randomBumps = [];

  var numberOfBumps = Math.floor(20 * (.25 * Math.random() + .75));
  for(var i = 0; i < numberOfBumps; i ++){
    randomBumps.push(Math.floor(canvas.width * Math.random()));
  }

  for(var i = 0; i < canvas.width; i ++){
    var closest = canvas.width;
    var closestIndex = -1;
    for(var a = 0; a < peakXPositions.length; a ++){
      var distance = Math.abs(peakXPositions[a] - i);
      if(distance < closest){
        closest = distance;
        closestIndex = a;
      }
    }
    var equation = peakYPositions[closestIndex] * Math.pow(Math.E/(200 * Math.sqrt(2 * Math.PI)), (Math.pow(closest, 2) / 80000));
    var closestBump = canvas.width;
    for(var a = 0; a < numberOfBumps; a ++){
      var bumpDistance = Math.abs(i - randomBumps[a]);
      if(bumpDistance < closestBump){
        closestBump = bumpDistance;
      }
    }
    var bumpyValue = equation + (15 * Math.pow(Math.E/(30 * Math.sqrt(2 * Math.PI)), (Math.pow(closestBump, 2) / 1800)));
    var finalValue = bumpyValue * (.01 * Math.random() + .99);
    heights.push(finalValue);
  }
}

function drawRect(x, y, width, height, color){
  context.beginPath();
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
  context.closePath();
}

function drawText(text, x, y, color){
  context.beginPath();
  context.font = "26px serif";
  context.fillStyle = color;
  context.fillText(text, x, y);
  context.closePath();
}

function drawScene(){
  drawRect(0, 0, canvas.width, canvas.height, "black");
  drawTerrain();
}

function drawTerrain(){
  for(var i = 0; i < heights.length; i ++){
    drawRect(i, canvas.height - heights[i], 1, heights[i], "gray");
  }
}

function gameOverScreen(){
  drawRect(0, 0, canvas.width, canvas.height, "black");
  drawText("Game Over", canvas.width/2 - 60, canvas.height/2, "red");
}

function start(){
  randomizeTerrain();
  drawScene();
  buttons.push({
    text: "easy",
    width: 90,
    height: 30,
    x: canvas.width/2 - 150,
    y: canvas.height/2
  });
  buttons.push({
    text: "medium",
    width: 90,
    height: 30,
    x: canvas.width/2 - 45,
    y: canvas.height/2
  });
  buttons.push({
    text: "hard",
    width: 90,
    height: 30,
    x: canvas.width/2 + 60,
    y: canvas.height/2
  });
  buttons.push({
    text: "free",
    width: 90,
    height: 30,
    x: canvas.width/2 - 45,
    y: canvas.height/2 + 50
  });
  drawButtons();
}

function drawButtons(){
  buttons.forEach(function(e){
    context.beginPath();
    context.fillStyle = "white";
    context.fillRect(e.x, e.y, e.width, e.height);
    context.closePath();
    drawText(e.text, e.x + (e.width/2) - (e.text.length * 6.75), e.y + (e.height/2) + 8, "blue");
  });
}

function keyUp(e){
    switch(e.keyCode){
        case 37:
            leftKey = false;
            break;
        case 39:
            rightKey = false;
            break;
        case 38:
            upKey = false;
            break;
    }
}

function keyDown(e){
    switch(e.keyCode){
        case 37:
            leftKey = true;
            break;
        case 39:
            rightKey = true;
            break;
        case 38:
            upKey = true;
            break;
    }
}

function createMeteors(number){
  for(var i = 0; i < number; i ++){
    var asteroid = new meteor(20, {x: -(i * 300 * (Math.random() * .5 + .75)), y: (Math.random() * 150 + 50)});
    meteors.push(asteroid);
  }
}

function updateMeteors(){
  meteors.forEach(function(asteroid){
    asteroid.update();
    asteroid.draw();
  });
}

function onClick(click){
  var x = click.pageX - canvasLeftOffset;
  var y = click.pageY - canvasTopOffset;
  buttons.forEach(function(element){
    if (y > element.y && y < element.y + element.height && x > element.x && x < element.x + element.width) {
      if(element.text == "easy"){
        lander.power = 0.1;
        document.removeEventListener('click', onClick, false);
        createMeteors(1);
        draw();
      }
      if(element.text == "medium"){
        lander.power = 0.03;
        document.removeEventListener('click', onClick, false);
        createMeteors(2);
        draw();
      }
      if(element.text == "hard"){
        lander.power = 0.02;
        document.removeEventListener('click', onClick, false);
        createMeteors(3);
        draw();
      }
      if(element.text == "free"){
        lander.power = 0.03;
        document.removeEventListener('click', onClick, false);
        freeSelectScreen();
      }
    }
  });
}

function freeSelectScreen(){
  buttons = [];
  buttons.push({
    text: "low-g",
    width: 90,
    height: 30,
    x: 10,
    y: 70
  });
  buttons.push({
    text: "mid-g",
    width: 90,
    height: 30,
    x: 110,
    y: 70
  });
  buttons.push({
    text: "crazy",
    width: 90,
    height: 30,
    x: 210,
    y: 70
  });
  buttons.push({
    text: "low-p",
    width: 90,
    height: 30,
    x: canvas.width/2 - 130,
    y: 70
  });
  buttons.push({
    text: "mid-p",
    width: 90,
    height: 30,
    x: canvas.width/2 - 30,
    y: 70
  });
  buttons.push({
    text: "AH",
    width: 90,
    height: 30,
    x: canvas.width/2 + 70,
    y: 70
  });
  buttons.push({
    text: "1",
    width: 90,
    height: 30,
    x: canvas.width - 300,
    y: 70
  });
  buttons.push({
    text: "3",
    width: 90,
    height: 30,
    x: canvas.width - 200,
    y: 70
  });
  buttons.push({
    text: "5",
    width: 90,
    height: 30,
    x: canvas.width - 100,
    y: 70
  });
  buttons.push({
    text: "start",
    width: 90,
    height: 30,
    x: canvas.width/2 - 45,
    y: canvas.height/2
  })
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawScene();
  drawText("Gravity:", 10, 30, "white");
  drawText("Asteroids:", canvas.width - 300, 30, "white");
  drawText("Power:", canvas.width/2 - 130, 30, "white");
  drawButtons();
  document.addEventListener('click', freeSelectDetect, false);
}

function freeSelectDetect(click){
  var x = click.pageX - canvasLeftOffset;
  var y = click.pageY - canvasTopOffset;
  buttons.forEach(function(element){
    if (y > element.y && y < element.y + element.height && x > element.x && x < element.x + element.width) {
      if(element.text == "low-g"){
        GRAVITY_FORCE = 0.005;
      }
      if(element.text == "mid-g"){
        GRAVITY_FORCE = 0.01;
      }
      if(element.text == "crazy"){
        GRAVITY_FORCE = 0.025;
      }
      if(element.text == "low-p"){
        lander.power = 0.03;
      }
      if(element.text == "mid-p"){
        lander.power = 0.075;
      }
      if(element.text == "AH"){
        lander.power = 0.2;
      }
      if(element.text == "1"){
        createMeteors(1);
      }
      if(element.text == "3"){
        createMeteors(3);
      }
      if(element.text == "5"){
        createMeteors(5);
      }
      if(element.text == "start"){
        lander.position.y = canvas.height/2 + 10;
        document.removeEventListener('click', freeSelectDetect, false);
        draw();
      }
    }
  });
  drawRect(canvas.width - 100, 100, 100, 50, "black");
  drawText(meteors.length, canvas.width - 100, 150, "white");
}

function randomizeTerrain(){
  var peakXPositions = [];

  for(var i = 0; i < 4; i ++){
    peakXPositions.push(Math.floor(canvas.width * Math.random()));
  }

  var peakYPositions = [];

  for(var i = 0; i < peakXPositions.length; i ++){
    peakYPositions.push((Math.random()/4 + .75) * 100);
  }

  var randomBumps = [];

  var numberOfBumps = Math.floor(20 * (.25 * Math.random() + .75));
  for(var i = 0; i < numberOfBumps; i ++){
    randomBumps.push(Math.floor(canvas.width * Math.random()));
  }

  for(var i = 0; i < canvas.width; i ++){
    var closest = canvas.width;
    var closestIndex = -1;
    for(var a = 0; a < peakXPositions.length; a ++){
      var distance = Math.abs(peakXPositions[a] - i);
      if(distance < closest){
        closest = distance;
        closestIndex = a;
      }
    }
    var equation = peakYPositions[closestIndex] * Math.pow(Math.E/(200 * Math.sqrt(2 * Math.PI)), (Math.pow(closest, 2) / 80000));
    var closestBump = canvas.width;
    for(var a = 0; a < numberOfBumps; a ++){
      var bumpDistance = Math.abs(i - randomBumps[a]);
      if(bumpDistance < closestBump){
        closestBump = bumpDistance;
      }
    }
    var bumpyValue = equation + (15 * Math.pow(Math.E/(30 * Math.sqrt(2 * Math.PI)), (Math.pow(closestBump, 2) / 1800)));
    var finalValue = bumpyValue * (.01 * Math.random() + .99);
    heights.push(finalValue);
  }
}
