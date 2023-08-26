const snakeDot = "🟢";
const appleDot = "🟥";

const { RN } = require("easy-rl");


const boardSize = 15;
var applePos = [Math.floor(Math.random() * boardSize), Math.floor(Math.random() * boardSize)];
var snake = [[Math.floor(Math.random() * boardSize), Math.floor(Math.random() * boardSize)]];
var previousSnakePos = [...snake];
var snakeDirectionVector = [0,1];
var eating = false;
const rn = new RN({ numInputs: 2, gamma: 2, epsilon: 12 });

rn.addLayer(10,"sigmoid")
rn.addLayer(10,"sigmoid")
rn.addLayer(4,"softmax")
rn.compile();
function distance(p1,p2){
  return Math.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)
}
function getReward(previousSnakePos,snake){
  var snakeHead = snake[0];

  if(snakeHead[0] > boardSize) return -1;
  if(snakeHead[0] < 0) return -1;
  if(snakeHead[1] > boardSize) return -1;
  if(snakeHead[1] < 0) return -1;

  if(snakeHead[0] == applePos[0] && snakeHead[1] == applePos[1]) return 2;

  var distancePrev = distance(previousSnakePos[0], applePos);
  var distanceNow = distance(snake[0], applePos)

  if(distanceNow < distancePrev) return 0.25;
  if(distanceNow > distancePrev) return -0.25;

  return 0;
}
function isOnApple(){
  return (snake[0][0] == applePos[0] && snake[0][1] == applePos[1]);
}
function getQuadrant(p1,p2){
  var translation = [0-p1[0],0-p1[1]];

  p1 = sumArrays(p1,translation);
  p2 = sumArrays(p2, translation);

  var origin = p1;
  if(p2[0] >= 0 && p2[1] > 0) return 1;
  if(p2[0] < 0 && p2[1] >= 0) return 2;
  if(p2[0] <= 0 && p2[1] < 0) return 3;
  if(p2[0] > 0 && p2[1] <= 0) return 4;
  return 0;
}

function getAngle(p1,p2){
  var q = getQuadrant(p1,p2);
  var inBetweenPoint = [];
  var angleAddition = 0;
  switch (q){
    case 1:
      inBetweenPoint = [p2[0],p1[1]];
      break;
    case 2:
      angleAddition = 90;
      inBetweenPoint = [p1[0],p2[1]];
      break;
    case 3:
      angleAddition = 180;
      inBetweenPoint = [p2[0],p1[1]];
      break;
    case 4:
      angleAddition = 270;
      inBetweenPoint = [p1[0],p2[1]];
      break;
    case 0:
      angleAddition = 0;
      inBetweenPoint = [...p1];
      break;
  }

  var hyp = distance(p1, p2);
  var adj = distance(p1, inBetweenPoint);
  var angle = radToDeg(Math.acos(adj/hyp)) + angleAddition;
  return angle
}
function degToRad(degrees) {
  return degrees * (Math.PI / 180);
}

function radToDeg(rad) {
  return rad / (Math.PI / 180);
}
async function tick(){
  previousSnakePos = [...snake];
  var state = [getAngle(snake[0], applePos)/360, distance(snake[0],applePos)/boardSize];
  var action = await rn.getAction(state)
  var vectors = [[0,1],[0,-1],[1,0],[-1,0]];
  snakeDirectionVector = vectors[action];
  if(isOnApple()) eating = true;
  var head = snake[0];
  var newBlock = sumArrays(head,snakeDirectionVector);
  if(!eating){
    snake.pop();
  }else{
    eating = false;
  }
  snake.unshift(newBlock);
  var reward = getReward(previousSnakePos, snake);
  updateSnake();
  rn.reward(reward);
  drawBoard(reward);
  rn.next({ batchSize: 64, decayRate: 0.03 }).then(()=>{
    setTimeout(()=>{
      tick()
    },1000)
  })
}
function updateSnake(){
  var snakeHead = snake[0]
  if(snakeHead[0] == applePos[0] && snakeHead[1] == applePos[1]) {
    eating = true;
    newApple()
  }
  if(snakeHead[0] > boardSize) return newSpawn();
  if(snakeHead[0] < 0) return newSpawn();
  if(snakeHead[1] > boardSize) return newSpawn();
  if(snakeHead[1] < 0) return newSpawn();
  
}
function newSpawn(){
  snake = [[Math.floor(Math.random() * boardSize), Math.floor(Math.random() * boardSize)]];
}
function newApple(){
  applePos = [Math.floor(Math.random() * boardSize), Math.floor(Math.random() * boardSize)];

}
tick()
function drawBoard(reward){
  var m = [];
  for(var y = 0; y < boardSize; y++){
    m.push([])
    for(var x = 0; x< boardSize; x++){
      m[y].push(' ')
    }
  }
  snake.forEach(part=>{
    m[part[0]][part[1]] = snakeDot;
  });
  m[applePos[0]][applePos[1]] = appleDot;

  m = m.map(row=>{
    return row.join("");
  });
  m = m.join("\n");
  console.clear()
  console.log(m);
  console.log(reward)
}
function sumArrays(...arrays) {
    const n = arrays.reduce((max, xs) => Math.max(max, xs.length), 0);
    const result = Array.from({ length: n });
    return result.map((_, i) => arrays.map(xs => xs[i] || 0).reduce((sum, x) => sum + x, 0));
}