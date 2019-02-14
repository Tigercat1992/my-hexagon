

class Hex {
    constructor(public q: number,
                public r: number,
                public s: number) {
    }
}

class MapObject {
    constructor(
        public id: number,
        public type: string,
        public position: Hex,
        public targetPosition: Hex,
        public path: Array<string>,
        public lastFrameTime: number,
        public fps: number
    ) {
    }
}

class Point {
    constructor(public x: number,
                public y: number) {
    }
}

class PointWithAngle {
    constructor(public x: number,
                public y: number,
                public a: number,
                public param: number) {
    }
}


class Segment {
    constructor(public a: PointWithAngle,
                public b: PointWithAngle) {
    }
}

function BFS  (playerPosition: Hex, hexPathMap: {[key: string]: Array<string>}) {
  
    var frontier = [hexToString(playerPosition)];
    var cameFrom: {[key: string]: string} = {};

    cameFrom[hexToString(playerPosition)] = hexToString(playerPosition);

    while (frontier.length != 0) {
        var current = frontier.shift();
        if (current) {
            var arr: Array<string> = hexPathMap[current];
            if (arr) {
                for (var i = 0, len = arr.length; i < len; i++) {
                    if (!cameFrom.hasOwnProperty(arr[i])) {
                        frontier.push(arr[i]);
                        cameFrom[arr[i]] = current;
                    }    
                }
            }
        }
    }

    return cameFrom
}

function getPath  (start: Hex, end: Hex, cameFrom: {[key: string]: string}): Array<string>  {
 
    if (areHexesEqual(start, end)) return []

    var strStart = hexToString(start);
    var strCurrent = hexToString(end);
    var path: Array<string> = [];
    if (cameFrom[strCurrent] != undefined) {
        path = [strCurrent];
        while (strCurrent != strStart) {
            strCurrent = cameFrom[strCurrent];
            path.push(strCurrent);
        }
    }
    return path
}

function clocks  (timestamp: number, state: State): any {

    var currentFrameTime = timestamp - state.lastFrameTime;

    if (currentFrameTime > state.targetFrameTime) {
        
        var lastFrameTime = timestamp - (currentFrameTime % state.targetFrameTime);

            var timeToUpdateFPSInfo = timestamp - state.lastFPSTime >= 1000;
            var currentFPS = timeToUpdateFPSInfo ? state.numFrames + 1 / (timestamp - state.lastFPSTime) * 1000 : state.currentFPS;
            var lastFPSTime = timeToUpdateFPSInfo ? timestamp : state.lastFPSTime;
            var numFrames = timeToUpdateFPSInfo ? 0 : state.numFrames + 1;

            
        update(state);
 
        
        updateState(state, mergeToState(state, {
            currentFrameTime: currentFrameTime,
            lastFrameTime: lastFrameTime,
            numFrames: numFrames,
            currentFPS: currentFPS,
            lastFPSTime: lastFPSTime
        }));
    }

    window.requestAnimationFrame((timestamp) => clocks(timestamp, state))
}

function getTime ()  {
    return window.performance.now();
}



declare var OffscreenCanvas: any;

function getCanvas (state: State) {
        var canvasParametres = state.canvasParametres;

        var canvasHex = document.getElementById("canvasHex") as HTMLCanvasElement;
        var canvasInteraction = document.getElementById("canvasInteraction") as HTMLCanvasElement;

        var canvasHexOffscreen = new OffscreenCanvas(canvasParametres.offscreenWidth, canvasParametres.offscreenHeight);
        var canvasInteractionOffscreen = new OffscreenCanvas(canvasParametres.offscreenWidth, canvasParametres.offscreenHeight);

        if (canvasHex && canvasInteraction) {
            setCanvasSize(canvasHex, state);
            setCanvasSize(canvasInteraction, state);
        }

        var rect = canvasInteraction.getBoundingClientRect();

        return mergeToState(state, {
            canvasParametres: {
                width: config.canvasWidth,
                height: config.canvasHeight,
                offscreenWidth: config.offscreenCanvasWidth,
                offscreenHeight: config.offscreenCanvasHeight,
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom
            },
            canvases: {
                canvasHex: canvasHex,
                canvasInteraction: canvasInteraction,
                canvasHexOffscreen: canvasHexOffscreen,
                canvasInteractionOffscreen: canvasInteractionOffscreen,
            }
        });
    }

function setCanvasSize (canvas: HTMLCanvasElement, state: State) {
        var canvasParametres = state.canvasParametres;
        canvas.width = canvasParametres.width;
        canvas.height = canvasParametres.height;
}



var config = {
    canvasWidth: 800,
    canvasHeight: 600,
    offscreenCanvasWidth: 2000,
    offscreenCanvasHeight: 2000,
    hexOrigin: new Point(0, 0),
    hexSizeX: 18.477,
    hexSizeY: 8,
    hexHeight: 18.477 * 2,
    hexWidth: 32,
    hexVertDist: 16,
    hexHorizDist: 32,
}



function cubeToOddr (c: {x: number, z: number}): Hex {
    var q = c.x - (c.z - (c.z & 1)) / 2;
    var r = c.z;
    return new Hex(q, r, -q - r)
};

function axialToCube (h: Hex)  {
    var x = h.q;
    var z = h.r;
    var y = -x-z;
    return {x: x, y: y, z: z}
};

function hexToPixel (h: Hex): Point {
    var x = config.hexSizeX * Math.sqrt(3) * (h.q + h.r / 2) + config.hexOrigin.x;
    var y = config.hexSizeY * 3 / 2 * h.r + config.hexOrigin.y;
    return new Point(x, y)
}

function pixelToHex (p: Point): Hex  {
    var q = (((p.x - config.hexOrigin.x) * Math.sqrt(3) / 3) / config.hexSizeX  - ((p.y - config.hexOrigin.y) / 3) / config.hexSizeY)
    var r = (p.y - config.hexOrigin.y) * 2 / 3 / config.hexSizeY
    return new Hex(q, r, -q - r);
}

function hexToString (hex: Hex): string {
    return `${hex.q}:${hex.r}:${hex.s}`;
}

function stringToHex (str: string): Hex  {
    var arr = str.split(":");
    return {q: Number.parseInt(arr[0]), r: Number.parseInt(arr[1]), s: Number.parseInt(arr[2])}
}



function drawHex (canvasID: HTMLCanvasElement, center: Point, lineWidth: number, lineColor: string, fillColor: string): void {
    for (var i = 0; i <= 5; i++) {
        var start = getHexCornerCoord(center, i);
        var end = getHexCornerCoord(center, i + 1);
        fillHex(canvasID, center, fillColor);
        drawLine(canvasID, start, end, lineWidth, lineColor);
    }
}

function fillHex (canvasID: HTMLCanvasElement, center: Point, fillColor: string): void {
    var c0 = getHexCornerCoord(center, 0);
    var c1 = getHexCornerCoord(center, 1);
    var c2 = getHexCornerCoord(center, 2);
    var c3 = getHexCornerCoord(center, 3);
    var c4 = getHexCornerCoord(center, 4);
    var c5 = getHexCornerCoord(center, 5);
    var ctx = canvasID.getContext("2d");
    if (ctx) {
        ctx.beginPath();
        ctx.fillStyle = fillColor;
        ctx.moveTo(c0.x, c0.y);
        ctx.lineTo(c1.x, c1.y);
        ctx.lineTo(c2.x, c2.y);
        ctx.lineTo(c3.x, c3.y);
        ctx.lineTo(c4.x, c4.y);
        ctx.lineTo(c5.x, c5.y);
        ctx.closePath();
        ctx.fill();
    }
}


function drawLine  (canvasID: HTMLCanvasElement, start: Point, end: Point, lineWidth: number, lineColor: string): void  {
    var ctx = canvasID.getContext("2d");
    if (ctx) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = lineWidth;
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.closePath();
    }
}

function drawPoint (canvasID: HTMLCanvasElement, start: Point): void {
    var ctx = canvasID.getContext("2d");
    if (ctx) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 1;
        ctx.lineTo(start.x + 1, start.y + 1);
        ctx.stroke();
        ctx.closePath();
    }
}

function animateCurrentHex (state: State) {
    if (state.canvases.canvasInteractionOffscreen) {
        drawHex(state.canvases.canvasInteractionOffscreen, hexToPixel(state.currentHex), 1, "#6bff02", "transparent");
    }
}

function animateCurrentHexCoords (state: State) {
    if (!state.canvases.canvasInteractionOffscreen) return
    var ctxCanvasInteractionOffscreen = state.canvases.canvasInteractionOffscreen.getContext("2d");
    if (!ctxCanvasInteractionOffscreen) return

    var currentHexPoint = hexToPixel(state.currentHex);
    ctxCanvasInteractionOffscreen.fillStyle = "#6bff02";
    ctxCanvasInteractionOffscreen.fillText(hexToString(state.currentHex),currentHexPoint.x+20, currentHexPoint.y);

}

function drawCanvas (state: State): void {
    if (!state.canvases.canvasHex) return
    if (!state.canvases.canvasInteraction) return
    if (!state.canvases.canvasInteractionOffscreen) return
    if (!state.canvases.canvasHexOffscreen) return

    var ctxCanvasHex = state.canvases.canvasHex.getContext('2d');
    var ctxCanvasInteraction = state.canvases.canvasInteraction.getContext("2d");
    var ctxCanvasInteractionOffscreen = state.canvases.canvasInteractionOffscreen.getContext("2d");

    if (!ctxCanvasHex) return
    if (!ctxCanvasInteraction) return
    if (!ctxCanvasInteractionOffscreen) return

    ctxCanvasHex.clearRect(0, 0, state.canvasParametres.width, state.canvasParametres.height);
    ctxCanvasHex.drawImage(state.canvases.canvasHexOffscreen, state.canvasX, state.canvasY, state.canvasParametres.width, state.canvasParametres.height, 0, 0, state.canvasParametres.width, state.canvasParametres.height);

    ctxCanvasInteraction.clearRect(0, 0, state.canvasParametres.width, state.canvasParametres.height);
    ctxCanvasInteraction.drawImage(state.canvases.canvasInteractionOffscreen, state.canvasX, state.canvasY, state.canvasParametres.width, state.canvasParametres.height, 0, 0, state.canvasParametres.width, state.canvasParametres.height);    

    ctxCanvasInteractionOffscreen.clearRect(0, 0, state.canvasParametres.offscreenWidth, state.canvasParametres.offscreenHeight);
}

function animateMapObject (state: State, object: MapObject) {
    if (state.canvases.canvasInteractionOffscreen) {
        drawHex(state.canvases.canvasInteractionOffscreen, hexToPixel(object.position), 1, "transparent", object.id === 0 ? "yellow" : "rgba(255,0,0,0.1)");
    }
}

function drawFOVPoligon (state: State,  endPoints: Array<PointWithAngle>, player: MapObject) {
    if (state.canvases.canvasInteractionOffscreen) {
        var ctx = state.canvases.canvasInteractionOffscreen.getContext("2d");
            if (ctx) {
                endPoints = endPoints.sort((pointA, pointB) => pointA.a - pointB.a);
                ctx.fillStyle = "rgb(255,255,0, 0.5)";
                ctx.beginPath();
                ctx.moveTo(endPoints[0].x,endPoints[0].y);
                for(var i=1; i<endPoints.length; i++) {
                    var intersect = endPoints[i];
                    ctx.lineTo(intersect.x,intersect.y);
                }
                ctx.fill();
            }
    }
}

function drawFOVRays (state: State,  endPoints: Array<PointWithAngle>, player: MapObject) {
    if (state.canvases.canvasInteractionOffscreen) {
        var ctx = state.canvases.canvasInteractionOffscreen.getContext("2d");
        if (ctx) {
            var playerPosition = hexToPixel(player.position)
            ctx.strokeStyle = "rgb(255,255,0)";
            ctx.fillStyle = "rgb(173,255,47)";
            ctx.lineWidth = 0.1;
            for (var i=0; i < endPoints.length; i++) {
                var intersect = endPoints[i];

                ctx.beginPath();
                ctx.moveTo(playerPosition.x,playerPosition.y);
                ctx.lineTo(intersect.x,intersect.y);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(intersect.x, intersect.y, 1, 0, 2 * Math.PI, false);
                ctx.fill();
            }
        }
    }
}

function drawFOV (state: State,  endPoints: Array<PointWithAngle>, player: MapObject) {
    if (state.endPoints.length > 0) {
        drawFOVPoligon(state, endPoints, player);
        drawFOVRays(state, endPoints, player);
    }
}



function onMouseMove (state: State): void {
    var canvasParametres = state.canvasParametres;

    if (!state.canvases.canvasInteraction) return

    state.canvases.canvasInteraction.onmousemove = (evt: MouseEvent) => {
        var offsetX = evt.pageX - canvasParametres.left;
        var offsetY = evt.pageY - canvasParametres.top;

        var hex = cubeRound(pixelToHex(new Point(offsetX + state.canvasX, offsetY + state.canvasY)));
        var point = hexToPixel(hex);
    
        var inCanvas = (point.x > config.hexWidth / 2 && point.x < canvasParametres.offscreenWidth - config.hexWidth / 2) 
        && (point.y > config.hexHeight / 2 && point.y < canvasParametres.offscreenHeight - config.hexHeight / 2);

        var currentHex = inCanvas ? hex : new Hex(0, 0, 0);

        updateState(state, mergeToState(state, {
            mouseX: offsetX,
            mouseY: offsetY,
            currentHex: currentHex
        }))
    }
}


function onMouseDown (state: State): void {

    if (!state.canvases.canvasInteraction) return

    state.canvases.canvasInteraction.onmousedown = (evt: MouseEvent) => {

    }
}

function onMouseUp (state: State): void {

    if (!state.canvases.canvasInteraction) return

    state.canvases.canvasInteraction.onmouseup = (evt: MouseEvent) => {
        if (evt.button === 0) {

            if (state.hexPathMap[hexToString(state.currentHex)]) {
                var idx = state.mapObjects.findIndex(el => el.id === 0);
                var bfs = BFS(state.mapObjects[idx].position, state.hexPathMap);
                var path = getPath(state.mapObjects[idx].position, state.currentHex, bfs);
                var object = {...state.mapObjects[idx], targetPosition: state.currentHex, path: path};
                var newMapObjects = [
                    ...state.mapObjects.slice(0, idx),
                    object,
                    ...state.mapObjects.slice(idx + 1)
                ]
                var stateWithMapObjects = mergeToState(state, {mapObjects: newMapObjects});
                updateState(state, stateWithMapObjects)
            }
        }
        if (evt.button === 1) {
            var newHexPathMap = {...state.hexPathMap, [hexToString(state.currentHex)]: getNeighbors(state.currentHex)};
            var idx = state.mapObjects.findIndex(el => areHexesEqual(el.position, state.currentHex));
            var newMapObjects = [
                ...state.mapObjects.slice(0, idx),
                ...state.mapObjects.slice(idx + 1)
            ]
            var stateWithMapObjects = mergeToState(state, {
                mapObjects: newMapObjects,
                hexPathMap: newHexPathMap
            });
            updateState(state, stateWithMapObjects);
        }
        if (evt.button === 2) {
            var newMapObjects = [
                ...state.mapObjects,
                new MapObject(
                    state.mapObjects.length, 
                    "wall", 
                    state.currentHex, 
                    state.currentHex,
                    [],
                    0,
                    20
                )
            ]
            var newHexPathMap = {...state.hexPathMap, [hexToString(state.currentHex)]: null}
            var stateWithMapObjects = mergeToState(state, {
                mapObjects: newMapObjects,
                hexPathMap: newHexPathMap
            });
            updateState(state, stateWithMapObjects);
        }
    }
}


function handleMouseOut (state: State): void {

    if (!state.canvases.canvasInteraction) return

    state.canvases.canvasInteraction.onmouseout = (evt: MouseEvent) => {
        updateState(state, mergeToState(state, {
            mouseOut: true
        }))
    }
}

function handleMouseOver (state: State): void {

    if (!state.canvases.canvasInteraction) return

    state.canvases.canvasInteraction.onmouseover = (evt: MouseEvent) => {
        updateState(state, mergeToState(state, {
            mouseOut: false
        }))
    }
}

function scrollByPointer (state: State): State {

    if (state.mouseOut) return state;

    var right = state.mouseX > state.canvasParametres.width - 50 && state.canvasX < state.canvasParametres.offscreenWidth - state.canvasParametres.width;
    var left = state.mouseX < 50 && state.canvasX > 0;
    var bottom = state.mouseY > state.canvasParametres.height - 50 && state.canvasY < state.canvasParametres.offscreenHeight - state.canvasParametres.height;
    var top = state.mouseY < 50 && state.canvasY > 0;
 
    var mouseX = right ? state.mouseX + 10 : left ? state.mouseX - 10 : state.mouseX;
    var mouseY = bottom ? state.mouseY + 10 : top ? state.mouseY - 10 : state.mouseY;

    var canvasX = right ? state.canvasX + 10 : left ? state.canvasX - 10 : state.canvasX;
    var canvasY = bottom ? state.canvasY + 10 : top ? state.canvasY - 10 : state.canvasY;

    return mergeToState(state, {
        mouseX: mouseX,
        mouseY: mouseY,
        canvasX: canvasX,
        canvasY: canvasY,
    })
}




function getDistance (a: Point, b: Point): number {
    return Math.hypot(b.x - a.x, b.y - a.y);
}

function getIntersection (ray: Segment, segment: Segment): PointWithAngle | null {

    var r_px = ray.a.x;
    var r_py = ray.a.y;
    var r_dx = ray.b.x-ray.a.x;
    var r_dy = ray.b.y-ray.a.y;

    var s_px = segment.a.x;
    var s_py = segment.a.y;
    var s_dx = segment.b.x-segment.a.x;
    var s_dy = segment.b.y-segment.a.y;

    var r_mag = Math.sqrt(r_dx * r_dx + r_dy * r_dy);
    var s_mag = Math.sqrt(s_dx * s_dx + s_dy * s_dy);
    if(r_dx / r_mag == s_dx / s_mag && r_dy / r_mag == s_dy / s_mag){
        return null;
    }

    var T2 = (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) / (s_dx * r_dy - s_dy * r_dx);
    var T1 = (s_px + s_dx * T2 - r_px) / r_dx;

    if (T1 < 0) return null;
    if (T2 < 0 || T2 > 1) return null;

    return new PointWithAngle(r_px + r_dx  *T1, r_py + r_dy * T1, 0, T1)
}

function getObstacles (nearestObstacles: {[key: string]: boolean}, object: MapObject): {[key: string]: boolean} {
    if (object.type === "wall") {
        if (!nearestObstacles.hasOwnProperty(hexToString(object.position))) {
            return {...nearestObstacles, [hexToString(object.position)]: true};
            
        }
    }
    return nearestObstacles;
}

function getObstaclesSegments (nearestObstaclesArg: {[key: string]: boolean}): Array<Segment> {
    var obstacleSides: Array<Segment> = [];
    var nearestObstacles = Object.keys(nearestObstaclesArg);

    for (var i = 0, len = nearestObstacles.length; i < len; i++) {
        var hexCenter = hexToPixel(stringToHex(nearestObstacles[i]));

        for (var j = 0; j < 6; j++) {
            var a = getHexCornerCoord(hexCenter, j);
            var b = getHexCornerCoord(hexCenter, j + 1);
            var side = new Segment(a, b);
            obstacleSides.push(side);
        }
    }

   return obstacleSides.concat([
        new Segment(new PointWithAngle(0, 0, 0, 0), new PointWithAngle(2000, 0, 0, 0)),
        new Segment(new PointWithAngle(2000, 0, 0, 0), new PointWithAngle(2000, 2000, 0, 0)),
        new Segment(new PointWithAngle(2000, 2000, 0, 0), new PointWithAngle(0, 2000, 0, 0)),
        new Segment(new PointWithAngle(0, 2000, 0, 0), new PointWithAngle(0, 0, 0, 0))
    ]);
}

function visibleField (obstacleSides: Array<Segment>, object: MapObject) {

    var objectCoords = hexToPixel(object.position);

    var points = (segments => {
        var a: Array<PointWithAngle> = [];
        segments.forEach(seg => a.push(seg.a, seg.b));
        return a;
    })(obstacleSides);

    var uniquePoints = (points => {
        var set: {[key: string]: boolean} = {};
        return points.filter(p => {
            var key = `${p.x},${p.y}`;
            if (key in set) {
                return false;
            } else {
                set[key] = true;
                return true;
            }
        });
    })(points);

    var uniqueAngles = [];
    for (var j=0; j<uniquePoints.length; j++) {
        var uniquePoint = uniquePoints[j];
        var angle = Math.atan2(uniquePoint.y - objectCoords.y, uniquePoint.x - objectCoords.x);
        uniquePoint.a = angle;
        uniqueAngles.push(angle - 0.00001, angle, angle + 0.00001);
    }

    var endPoints: Array<PointWithAngle> = [];
    for (var j=0; j < uniqueAngles.length; j++) {

        var angle = uniqueAngles[j];

        var dx = Math.cos(angle);
        var dy = Math.sin(angle);
        
        var ray = {
            a: new PointWithAngle(objectCoords.x, objectCoords.y, 0, 0),
            b: new PointWithAngle(objectCoords.x + dx, objectCoords.y + dy, 0, 0)
        };
        
        var closestIntersect = null;
        for(var i = 0; i < obstacleSides.length; i++){
            
            var intersect = getIntersection(ray, obstacleSides[i]);
            if (!intersect) continue;
            if (!closestIntersect || intersect.param< closestIntersect.param) {
                closestIntersect = new PointWithAngle(intersect.x, intersect.y, 0, intersect.param);
            }
        }
        if (!closestIntersect) continue
            closestIntersect.a = angle;
            endPoints.push(closestIntersect)
    }
    return endPoints
}



function getHexPathMap (state: State): State {

    var hexPathMap: {[key: string]: Array<string> | null} = {};

    var horizontalHexes = Math.round((state.canvasParametres.offscreenWidth)/config.hexHorizDist);
    var verticalHexes = Math.round((state.canvasParametres.offscreenHeight)/12);


     for (var r = 0; r <= verticalHexes; r++) {
        for(var q=0; q <= horizontalHexes; q++) {
            var cube = axialToCube(new Hex(q, r, -q - r));
            var h = cubeToOddr(cube);
            hexPathMap[hexToString(h)] = getNeighbors(h);
            var center = hexToPixel(h);
            if (state.canvases.canvasHexOffscreen) {
                drawHex(state.canvases.canvasHexOffscreen, center, 0.3, "#6bff02", "transparent");
            }
        }  
    }

    if (state.canvases.canvasHex && state.canvases.canvasHexOffscreen) {
        var ctx = state.canvases.canvasHex.getContext('2d');
        if (ctx) {
            ctx.drawImage(state.canvases.canvasHexOffscreen, 0, 0, state.canvasParametres.width, state.canvasParametres.height, 0, 0, state.canvasParametres.width, state.canvasParametres.height);
        }
    }

    for (var i = 0, len = state.mapObjects.length; i < len; i++) {
        var newHexPathMap = state.mapObjects[i].type === "wall" ? {...hexPathMap, [hexToString(state.mapObjects[i].position)]: null} : hexPathMap
        hexPathMap = newHexPathMap
    }

    return mergeToState(state, {hexPathMap: hexPathMap})
}

function getHexCornerCoord (center: Point, i: number) {
    var angle_deg = 60 * i + 30;
    var angle_rad = Math.PI / 180 * angle_deg;
    var x = center.x + config.hexSizeX * Math.cos(angle_rad);
    var y = center.y + config.hexSizeY * Math.sin(angle_rad);

    return new PointWithAngle(x, y, 0, 0);
}

function cubeDirection (direction: number): Hex {
        var cubeDirections = [new Hex(0, 1, -1), new Hex(-1, 1, 0), new Hex(-1, 0, 1),
            new Hex(0, -1, 1), new Hex(1, -1, 0), new Hex(1, 0, -1)
        ];
        return cubeDirections[direction];
    }

function cubeAdd (a: Hex, b: Hex): Hex {
        return new Hex(a.q + b.q, a.r + b.r, a.s + b.s);
    }

function cubeSubstract (a: Hex, b: Hex): Hex  {
        return new Hex(a.q - b.q, a.r - b.r, a.s - b.s);
    }

function getCubeNeighbor (h: Hex, direction: number): Hex  {
        return cubeAdd(h, cubeDirection(direction));
    }

function getNeighbors (h: Hex): Array<string>  {
        var arr = [];
            for (var i = 0; i <= 5; i++) {
                var {
                    q,
                    r,
                    s
                } = getCubeNeighbor(new Hex(h.q, h.r, h.s), i);
                arr.push(hexToString(new Hex(q, r, s)));
            }
            return arr;
    }

function cubeRound (cube: Hex) {
        var rx = Math.round(cube.q)
        var ry = Math.round(cube.r)
        var rz = Math.round(cube.s)

        var x_diff = Math.abs(rx - cube.q)
        var y_diff = Math.abs(ry - cube.r)
        var z_diff = Math.abs(rz - cube.s)

        if (x_diff > y_diff && x_diff > z_diff) {
            rx = -ry - rz;
        }
        else if (y_diff > z_diff) {
            ry = -rx - rz
        }
        else {
            rz = -rx - ry
        }
        return new Hex(rx, ry, rz)
    }

function getDistanceLine (a: Hex, b: Hex) {
        var dist = cubeDistance(a, b);
        var arr: Array<Point> = [];
        for (var i = 0; i <= dist; i++) {
            var center = hexToPixel(cubeRound(cubeLinearInt(a, b, 1.0 / dist * i)));
            arr = [...arr, center];
        }
        return arr
    }

function cubeDistance (a: Hex, b: Hex): number {
        var {
            q,
            r,
            s
        } = cubeSubstract(a, b);
        return (Math.abs(q) + Math.abs(r) + Math.abs(s)) / 2;
    }

function cubeLinearInt (a: Hex, b: Hex, t: number): Hex  {
        return new Hex(linearInt(a.q, b.q, t), linearInt(a.r, b.r, t), linearInt(a.s, b.s, t));
    }

function linearInt (a: number, b: number, t: number): number  {
        return (a + (b - a) * t)
    }

function areHexesEqual (a: Hex, b: Hex)  {
        return a.q === b.q && a.r === b.r && a.s === b.s;
    }




interface State {
    hexPathMap: {[key: string]: Array<string>},
    nearestObstacles: {[key: string]: boolean},
    obstacleSides: Array<Segment>,
    obstacleCorners: Array<Point>,
    currentHex: Hex,
    endPoints: Array<PointWithAngle>,
    fov: {[key: string]: boolean},
    canvases: {
        canvasHex: HTMLCanvasElement | undefined,
        canvasHexOffscreen: HTMLCanvasElement | undefined,
        canvasInteraction: HTMLCanvasElement | undefined,
        canvasInteractionOffscreen: HTMLCanvasElement | undefined,
    },
    canvasParametres: {
        width: number,
        height: number,
        offscreenWidth: number,
        offscreenHeight: number,
        left: number,
        right: number,
        top: number,
        bottom: number
    },
    mouseX: number,
    mouseY: number,
    canvasX: number,
    canvasY: number,
    mouseOut: boolean,
    //clocks
    currentFrameTime: number,
    lastFrameTime: number,
    targetFrameTime: number,
    lastFPSTime: number,
    targetFPS: number,
    currentFPS: number,
    numFrames: number,
    mapObjects: Array<MapObject>;
}

var globalState: State = {
    currentHex: new Hex(0, 0, 0),
    hexPathMap: {},
    nearestObstacles: {},
    obstacleSides: [],
    obstacleCorners: [],
    endPoints: [],
    fov: {},
    canvases: {
        canvasHex: undefined,
        canvasHexOffscreen: undefined,
        canvasInteraction: undefined,
        canvasInteractionOffscreen: undefined,
    },
    canvasParametres: {
        width: config.canvasWidth,
        height: config.canvasHeight,
        offscreenWidth: config.offscreenCanvasWidth,
        offscreenHeight: config.offscreenCanvasHeight,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
    },
    mouseX: 0,
    mouseY: 0,
    canvasX: 0,
    canvasY: 0,
    mouseOut: false,
    //clocks
    currentFrameTime: 0,
    lastFrameTime: window.performance.now(),
    targetFrameTime: 1000 / 30,
    lastFPSTime: 0,
    targetFPS: 30,
    currentFPS: 0,
    numFrames: 0,
    mapObjects: [
        new MapObject(0, "player", new Hex(0, 20, -20), new Hex(0, 20, -20), [], 0, 60),
        new MapObject(1, "wall", new Hex(0, 18, -18), new Hex(0, 18, -18), [], 0, 0),
        new MapObject(2, "wall", new Hex(1, 18, -19), new Hex(1, 18, -19), [], 0, 0),
        new MapObject(3, "wall", new Hex(2, 18, -20), new Hex(2, 18, -20), [], 0, 0),
        new MapObject(4, "wall", new Hex(3, 18, -21), new Hex(3, 18, -21), [], 0, 0),
        new MapObject(5, "wall", new Hex(4, 18, -22), new Hex(4, 18, -22), [], 0, 0),
        new MapObject(6, "wall", new Hex(3, 19, -22), new Hex(3, 19, -22), [], 0, 0),
        new MapObject(7, "wall", new Hex(2, 20, -22), new Hex(2, 20, -22), [], 0, 0),
        new MapObject(8, "wall", new Hex(1, 21, -22), new Hex(1, 21, -22), [], 0, 0),
        new MapObject(9, "wall", new Hex(0, 22, -22), new Hex(0, 22, -22), [], 0, 0),
        new MapObject(10, "wall", new Hex(-1, 22, -21), new Hex(-1, 22, -21), [], 0, 0),
        new MapObject(11, "wall", new Hex(-2, 22, -20), new Hex(-2, 22, -20), [], 0, 0),
        new MapObject(12, "wall", new Hex(-3, 22, -19), new Hex(-3, 22, -19), [], 0, 0),
        new MapObject(13, "wall", new Hex(-4, 22, -18), new Hex(-4, 22, -18), [], 0, 0),
        new MapObject(14, "wall", new Hex(-1, 19, -18), new Hex(-1, 19, -18), [], 0, 0),
        new MapObject(15, "wall", new Hex(-3, 21, -18), new Hex(-3, 21, -18), [], 0, 0),
    ],
}

function update (state: State) {
    updateState(state, mergeToState(state, scrollByPointer(state)));
    animateCurrentHex(state);
    animateCurrentHexCoords(state);
    drawCanvas(state);

    var playerIdx = state.mapObjects.findIndex(el => el.id === 0);

    for (var i = 0, len = state.mapObjects.length; i < len; i++) {

        animateMapObject(state, state.mapObjects[i]);

        i === playerIdx && drawFOV(state, state.endPoints, state.mapObjects[playerIdx]);

        var newState = mergeToState(state, {
            mapObjects: updateMapObjects(state, makeMovement(state.mapObjects[i], state.hexPathMap), i),
            nearestObstacles: getObstacles(state.nearestObstacles, state.mapObjects[i]),
            endPoints: i === playerIdx ? visibleField(getObstaclesSegments(state.nearestObstacles), state.mapObjects[playerIdx]) : state.endPoints,
        });
        updateState(state, newState);
    }
} 

function init  (state: State) {
    
    //initialazing state
    var stateWithHexPathMap = getHexPathMap(getCanvas(state));

    updateState(state, stateWithHexPathMap)

    //attach eventlisteners
    //these don't return state, they update it in place
    onMouseMove(state);
    onMouseDown(state);
    onMouseUp(state);
    handleMouseOut(state);
    handleMouseOver(state);

    //launch game clocks
    clocks(window.performance.now(), globalState)
}

init(globalState);


function makeMovement  (object: MapObject, hexPathMap: {[key: string]: Array<string>}): MapObject {
    if (!areHexesEqual(object.position, object.targetPosition)) {
        if (object.path.length === 0) {
            var newPath = getPath(object.position, object.targetPosition, BFS(object.position, hexPathMap));
            return Object.assign({}, object, {path: newPath});
        } else {
            if (getTime() - object.lastFrameTime > 1000 / object.fps) {
                var newPath = critterMakeStep(object.path);
                return Object.assign({}, object, {
                    path: newPath,
                    lastFrameTime: getTime(),
                    position: getCurrentPosition(object.path)
                });
            }
        }
    }
    return object;
}

function getCurrentPosition (path: Array<string>): Hex {
    return stringToHex(path.slice(path.length - 1, path.length)[0]);
}

function critterMakeStep (path: Array<string>): Array<string> {
    return path.slice(0, -1);
}


function mergeToState (state: State, statePart: {}) {
    return Object.assign({}, state, statePart)
}

function  updateState (globalState: State, newState: State)  {
    globalState = Object.assign(globalState, newState);
}

function updateMapObjects (state: State, object: MapObject, idx: number) {
 return [
    ...state.mapObjects.slice(0, idx),
    Object.assign({}, object),
    ...state.mapObjects.slice(idx + 1)
 ]
}