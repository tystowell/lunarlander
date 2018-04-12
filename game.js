var canvas = document.getElementById("game");
var context = canvas.getContext("2d");
var canvasLeftOffset = canvas.offsetLeft;
var canvasTopOffset = canvas.offsetTop;
var GRAVITY_FORCE = 0.01;//Gravity
var leftKey = false;//If left key is being pressed
var rightKey = false;//If right key is being pressed
var upKey = false;//If up key is being pressed
var gameOver = false; //If game is over
var buttons = []; //Stores all current buttons.
var meteors = []; //Stores all meteors.
var lastRightLeg = false;//If right leg was on ground last frame
var lastLeftLeg = false;//If left leg was on ground last frame
var meteorVelocity = 7;//Meteor starting velecity
var heights = [];//Stores terrain
var score = 0;

function button(text, x, y){//Object to create buttons
  this.width = 90;
  this.height = 30;
  this.x = x;
  this.y = y;
  this.text = text;
}

button.prototype.draw = function(){
  drawRect(this.x, this.y, this.width, this.height, "white");
  drawText(this.text, this.x + (this.width/2) - (this.text.length * 6.75), this.y + (this.height/2) + 8, "blue");
}

function meteor(size, position){//Object to create meteors
  this.size = size;
  this.position = position;
  this.velocity = {
    x: meteorVelocity * (Math.random() * .1 + .95),
    y: 0
  };
}

meteor.prototype.draw = function(){//Draws the meteor
  context.beginPath();
  context.arc(this.position.x, this.position.y, this.size, 0, 2 * Math.PI);
  context.fillStyle = "gray";
  context.fill();
  context.closePath();
}

meteor.prototype.update = function(){//Physics for the meteor
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

function Spaceship(size, position, power) {//Object to make lunar lander
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

Spaceship.prototype.draw = function(){//Draws lunar lander
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
  drawRect(94, 10, 160, 20, "gray");
  drawText("Score:", 94, 28, "black");
  drawText(score, 160, 28, "black");
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
          score = Math.floor(100 - ((this.impactVelocity * 10) + Math.abs(this.angle) * 10));
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
          score = (this.impactVelocity * 10) + (this.angle * 10);
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

function draw(){//The loop that is called repetadely.
    context.clearRect(0, 0, canvas.width, canvas.height);//Clear screen

    drawScene();//Draw terrain and background

    updateMeteors();//Physics for meteors, and draws them.

    lander.update();//Physics for lander.

    lander.draw();//Draws lander

    if(!gameOver){
      requestAnimationFrame(draw);//Keep looping this section
    }else{
      gameOverScreen();//Stop
    }
}

document.addEventListener('keyup', keyUp);

document.addEventListener('keydown', keyDown);

document.addEventListener('click', onClick, false);

var lander = new Spaceship(5, {x: canvas.width/2, y: 50}, 0.04);//Creates lander

start();//Calls start function (not loop)

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

function drawScene(){//Background and terrain
  drawRect(0, 0, canvas.width, canvas.height, "black");
  drawTerrain();
}

function drawTerrain(){//Terrain
  for(var i = 0; i < heights.length; i ++){
    drawRect(i, canvas.height - heights[i], 1, heights[i], "gray");
  }
}

function gameOverScreen(){
  drawRect(0, 0, canvas.width, canvas.height, "black");
  drawText("Game Over", canvas.width/2 - 60, canvas.height/2, "red");
}

function start(){//First code to run
  randomizeTerrain();
  drawScene();

  var easy = new button("easy", canvas.width/2 - 150, canvas.height/2);
  buttons.push(easy);
  var medium = new button("medium", canvas.width/2 - 45, canvas.height/2);
  buttons.push(medium);
  var hard = new button("hard", canvas.width/2 + 60, canvas.height/2);
  buttons.push(hard);
  var free = new button("free", canvas.width/2 - 45, canvas.height/2 + 50);
  buttons.push(free);

  drawButtons();
}

function drawButtons(){
  buttons.forEach(function(b){
    b.draw();
  });
}

function keyUp(e){//Called when a key goes up
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

function keyDown(e){//Called when a key is pressed
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

function createMeteors(number){//Creates meteors
  for(var i = 0; i < number; i ++){
    var asteroid = new meteor(20, {x: -(i * 300 * (Math.random() * .5 + .75)), y: (Math.random() * 150 + 50)});
    meteors.push(asteroid);
  }
}

function updateMeteors(){//Updates meteors
  meteors.forEach(function(asteroid){
    asteroid.update();
    asteroid.draw();
  });
}

function onClick(click){//Looks for button clicks
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

function freeSelectScreen(){//Sets up "free" screen
  buttons = [];
  buttons.push(new button("low-g", 10, 70));
  buttons.push(new button("mid-g", 110, 70));
  buttons.push(new button("crazy", 210, 70));
  buttons.push(new button("low-p", canvas.width/2 - 130, 70));
  buttons.push(new button("mid-p", canvas.width/2 - 30, 70));
  buttons.push(new button("AH", canvas.width/2 + 70, 70));
  buttons.push(new button("1", canvas.width - 300, 70));
  buttons.push(new button("3", canvas.width - 200, 70));
  buttons.push(new button("5", canvas.width - 100, 70));
  buttons.push(new button("start", canvas.width/2 - 45, canvas.height/2));
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawScene();
  drawText("Gravity:", 10, 30, "white");
  drawText("Asteroids:", canvas.width - 300, 30, "white");
  drawText("Power:", canvas.width/2 - 130, 30, "white");
  drawButtons();
  document.addEventListener('click', freeSelectDetect, false);
}

function freeSelectDetect(click){//Looks for clicks on "free" screen
  var x = click.pageX - canvasLeftOffset;//X position of mouse altered so 0 is left of CANVAS, not page.
  var y = click.pageY - canvasTopOffset;//Y position of mouse altered so 0 is top of CANVAS, not page.
  buttons.forEach(function(element){
    if (y > element.y && y < element.y + element.height && x > element.x && x < element.x + element.width) {//If mouse is in a button on click
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

function randomizeTerrain(){//Creates random terrain
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

