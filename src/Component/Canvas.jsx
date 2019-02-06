import React, { Component } from 'react';
import './Canvas.css'; 
import { DUMMY_OBSTACLES } from './variables';

export default class Canvas extends Component {
	constructor(props) {
		super(props);
		this.state = {
			hexSize: 20,
			hexOrigin: { x: 400, y: 300 },
			currentHex: { q: 0, r: 0, s: 0, x: 0, y: 0 },
			playerPosition: { q: 0, r: 0, s: 0 },
			obstacles: DUMMY_OBSTACLES,
			//frontier: [],
			cameFrom: {},
			hexPathMap: [],
			path: [],
		};
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleClick = this.handleClick.bind(this);
		//this.handleExpandClick = this.handleExpandClick.bind(this);
	}

	componentWillMount() {
		this.setState({
			canvasSize: { canvasWidth: 800, canvasHeight: 600 },
			hexParams: this.getHexParams(this.canvasHex, this.state.hexSize)
		})
	}

	componentDidMount() {
		const { canvasWidth, canvasHeight } = this.state.canvasSize;
		const { hexSize } = this.state;
		this.canvasHex.width = canvasWidth;
		this.canvasHex.height = canvasHeight;
		this.canvasInteraction.width = canvasWidth;
		this.canvasInteraction.height = canvasHeight;
		this.canvasView.width = canvasWidth;
		this.canvasView.height = canvasHeight;
		this.getCanvasPosition(this.canvasInteraction);
		//this.drawHex(this.canvasInteraction, this.Point(playerPosition.x, playerPosition.y), hexSize, 1, "black", "red");
		this.drawHexes(this.canvasHex, hexSize);
		this.drawObstacles(this.canvasHex);
	}

	shouldComponentUpdate(nextProps, nextState) {
		const { hexSize, hexOrigin } = this.state;
		const { canvasWidth, canvasHeight } = this.state.canvasSize;
		if(nextState.currentHex !== this.state.currentHex) {
			//const { x, y } = nextState.currentHex;
			const ctx = this.canvasInteraction.getContext("2d");
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			//this.drawNeighbors(this.Hex(q, r, s));
			this.drawPath(this.canvasInteraction)
			// let currentDistanceLine = nextState.currentDistanceLine;
			// for(let i = 0; i <= currentDistanceLine.length - 1; i++) {
			// 	if(i === 0)
			// 		this.drawHex(this.canvasInteraction, this.Point(currentDistanceLine[i].x, currentDistanceLine[i].y), hexSize, 1, "black", "red");
			// 	else
			// 		this.drawHex(this.canvasInteraction, this.Point(currentDistanceLine[i].x, currentDistanceLine[i].y), hexSize, 1, "black", "grey");
			// }
			// nextState.obstacles.map( ob => {
			// 	const { q, r, s } = JSON.parse(ob);
			// 	const { x, y } = this.getPointyHexToPixel(this.Hex(q, r, s), hexSize, hexOrigin);
			// 	return this.drawHex(this.canvasInteraction, this.Point(x, y), hexSize, 1, "black", "black")
			// })
			//this.drawHex(this.canvasInteraction, this.Point(x, y), hexSize, 1, "black", "grey");
			return true;
		}
		if(nextState.cameFrom !== this.state.cameFrom) {
			const ctx = this.canvasView.getContext('2d');
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			for(let l in nextState.cameFrom) {
				const { q, r, s } = JSON.parse(l);
				const { x, y } = this.getPointyHexToPixel(this.Hex(q, r, s), hexSize, hexOrigin);
				this.drawHex(this.canvasView, this.Point(x, y), hexSize, 1, "black", "green")
			}
			return true;
		}
		return false;
	}

//draw Hexes function (1) # Responsive in any canvas size
	drawHexes() {
		const { hexSize, hexOrigin, hexParams, canvasSize, obstacles, playerPosition } = this.state;
		const { canvasWidth, canvasHeight } = this.state.canvasSize;
		const { hexWidth, hexHeight } = this.state.hexParams;
		const { leftSide, rightSide, topSide, bottomSide } = this.getHexesAreaOnCanvas(canvasSize, hexOrigin, hexParams);
		
		let hexPathMap = [];
		let p = 0;
		for(let r = 0; r <= bottomSide; r++) {
			if(r%2 === 0 && r !== 0) p++;
			for(let q = -leftSide; q <= rightSide; q++) {
				const center = this.getPointyHexToPixel(this.Hex(q-p, r), hexSize, hexOrigin);
				if( (center.x > hexWidth/2 && center.x < canvasWidth - hexWidth/2) &&
					(center.y > hexHeight/2 && center.y < canvasHeight - hexHeight/2) ) {
					this.drawHex(this.canvasHex, center, hexSize, "black", 1, "grey");
					//this.drawHexCoordRowAndColumn(this.canvasHex, center, this.Hex(q-p, r, -(q-p)-r));
					let bottomH = JSON.stringify(this.Hex(q-p, r, -(q-p)-r));
					if(!obstacles.includes(bottomH)) {
						hexPathMap.push(bottomH);
					}
				}
			}
		}
		
		let n = 0;
		for(let r = -1; r >= -topSide; r--) {
			if(r%2 !== 0) n++;
			for(let q = -leftSide; q <= rightSide; q++) {
				const center = this.getPointyHexToPixel(this.Hex(q+n, r), hexSize, hexOrigin);
				if( (center.x > hexWidth/2 && center.x < canvasWidth - hexWidth/2) &&
					(center.y > hexHeight/2 && center.y < canvasHeight - hexHeight/2) ) {
					this.drawHex(this.canvasHex, center, hexSize, 1, "black", "grey");
					//this.drawHexCoordRowAndColumn(this.canvasHex, center, this.Hex(q+n, r, -(q+n)-r));
					var topH = JSON.stringify(this.Hex(q+n, r, -(q+n)-r));
					if(!obstacles.includes(topH)) {
						hexPathMap.push(topH);
					}
				}
			}
		}

		hexPathMap = [].concat(hexPathMap);
		this.setState(
			{ hexPathMap },
			this.breadthFirstSearchCallback = () => this.breadthFirstSearch(playerPosition)
		)
	}

	getHexesAreaOnCanvas({canvasWidth, canvasHeight}, hexOrigin, hexParams) {
		let leftSide = Math.round( hexOrigin.x / hexParams.horizDist );
		let rightSide = Math.round( (canvasWidth - hexOrigin.x) / hexParams.horizDist );
		let topSide = Math.round( hexOrigin.y / hexParams.vertDist );
		let bottomSide = Math.round( (canvasHeight - hexOrigin.y) / hexParams.vertDist );
		return { leftSide, rightSide, topSide, bottomSide };
	}
//draw Hexes function (1) END

	drawHex(canvasID, center, size, lineWidth, lineColor, fillColor) {
		for(let i = 0; i <= 5; i++) {
			let start = this.getPointyHexCornerCoord(center, size, i);
			let end = this.getPointyHexCornerCoord(center, size, i + 1);
			this.fillHex(canvasID, center, fillColor, size);
			this.drawLine(canvasID, start, end, lineWidth, lineColor);
		} 
	}

	getPath(start, current) {
		const { cameFrom } = this.state;
		start = JSON.stringify(start);
		current = JSON.stringify(current);
		if(cameFrom[current] !== undefined) {
			let path = [current];
			while (current !== start) {
				current = cameFrom[current];
				path.push(current);
			}
			path = [].concat(path);
			this.setState({ path });
		}
	}

	drawPath(canvasID) {
		let { path, hexSize, hexOrigin } = this.state;
		for (let i = 0; i <= path.length - 1; i++) {
			const { q, r } = JSON.parse(path[i]);
			const { x, y } = this.getPointyHexToPixel(this.Hex(q, r), hexSize, hexOrigin);
			this.drawHex(canvasID, this.Point(x, y), hexSize, 1, "black", "yellow");
		}
	}

	drawObstacles(canvasID) {
		const { hexSize, hexOrigin, obstacles } = this.state;
		obstacles.map( ob => {
			const { q, r, s } = JSON.parse(ob);
			const { x, y } = this.getPointyHexToPixel(this.Hex(q, r, s), hexSize, hexOrigin);
			return this.drawHex(canvasID, this.Point(x, y), hexSize, 1, "black", "black");
		});
	}
 
	drawNeighbors(h) {
		const { hexSize, hexOrigin } = this.state;
		for(let i = 0; i <= 5; i++) {
			const {q, r, s} = this.getCubeNeighbor(this.Hex(h.q, h.r, h.s), i);
			const {x, y} = this.getPointyHexToPixel(this.Hex(q, r, s), hexSize, hexOrigin);
			this.drawHex(this.canvasInteraction, this.Point(x, y), hexSize, 1, "red", "grey");
		}
	}

	handleMouseMove(event) {
		const { canvasPosition, hexSize, hexOrigin } = this.state;
		const { canvasWidth, canvasHeight } = this.state.canvasSize;
		const { hexWidth, hexHeight } = this.state.hexParams;
		let offsetX = event.pageX - canvasPosition.left;
		let offsetY = event.pageY - canvasPosition.top;		
		const { q, r, s } = this.cubeRound(this.getPointyPixelToHex(this.Point(offsetX, offsetY), hexSize, hexOrigin));
		const { x, y } = this.getPointyHexToPixel(this.Hex(q, r, s), hexSize, hexOrigin);
		let { playerPosition } = this.state;
		//this.getDistanceLine( this.Hex(playerPosition.q, playerPosition.r, playerPosition.s), this.Hex(q,r,s), hexSize, hexOrigin );
		this.getPath(this.Hex(playerPosition.q, playerPosition.r, playerPosition.s), this.Hex(q, r, s) );
		if((x > hexWidth/2 && x < canvasWidth - hexWidth/2) && (y > hexHeight/2 && y < canvasHeight - hexHeight/2)) {
			this.setState({ currentHex: { q, r, s, x, y } });
		}
	}

	handleClick() {
		const { currentHex, cameFrom } = this.state;
		const { q, r, s } = currentHex;
		if(cameFrom[JSON.stringify(this.Hex(q, r, s))]) {
			this.setState(
				{ playerPosition: this.Hex(q, r, s) },
				this.breadthFirstSearchCallback = () => this.breadthFirstSearch(this.state.playerPosition)
			)
		}
		//this.setState({ playerPosition: this.state.currentHex });
		//this.addObstacles();
	}

	// handleExpandClick() {
	// 	let { frontier, cameFrom, obstacles } = this.state;
	// 	let { q, r, s } = this.state.playerPosition;
	// 	if(frontier.length === 0) {
	// 		frontier.push(this.Hex(q, r, s));
	// 		cameFrom[JSON.stringify(this.Hex(q, r, s))] = JSON.stringify(null);
	// 	}
	// 	let n = 0;
	// 	if(n < 1) {
	// 		let current = frontier.shift();
	// 		let arr = this.getNeighbors(current);
	// 		arr.map( l => {
	// 			if(!cameFrom.hasOwnProperty(JSON.stringify(l)) && !obstacles.includes(JSON.stringify(l))) {
	// 				frontier.push(l);
	// 				cameFrom[JSON.stringify(l)] = JSON.stringify(current);
	// 			}
	// 			return null;
	// 		})
	// 		n++;
	// 	}
	// 	cameFrom = Object.assign({}, cameFrom);
	// 	this.setState({ cameFrom });
	// }

	breadthFirstSearch(playerPosition) {
		let { cameFrom, hexPathMap } = this.state;
		let current = [];
		let frontier = [playerPosition];
		cameFrom[JSON.stringify(playerPosition)] = JSON.stringify(playerPosition);
		let objMaker =  (l) => {
			if(!cameFrom.hasOwnProperty(JSON.stringify(l)) && hexPathMap.includes(JSON.stringify(l))) {
				frontier.push(l);
				cameFrom[JSON.stringify(l)] = JSON.stringify(current);
			}
		};
		while (frontier.length !== 0) {
			current = frontier.shift();
			let arr = this.getNeighbors(current);
			arr.map(objMaker)
		};
		cameFrom = Object.assign({}, cameFrom);
		this.setState({ cameFrom });
	}

	addObstacles() {
		const { q, r, s } = this.state.currentHex;
		let { obstacles } = this.state;
		if(!obstacles.includes(JSON.stringify(this.Hex(q, r, s)))) {
			obstacles = [].concat(obstacles, JSON.stringify(this.Hex(q, r, s)));
		} else {
			obstacles.map( (ob, index) => {
				if(ob === JSON.stringify(this.Hex(q, r, s))) {
					obstacles = obstacles.slice(0, index).concat(obstacles.slice(index+1));
				}
				return null;
			});
		}
		this.setState({ obstacles }, () => this.findObstacles() )
	}

//canvas drawing
	drawLine(canvasID, start, end, lineWidth, lineColor) {
		const ctx = canvasID.getContext('2d');
		ctx.beginPath();
		ctx.moveTo(start.x, start.y);
		ctx.strokeStyle = lineColor;
		ctx.lineWidth = lineWidth;
		ctx.lineTo(end.x, end.y);
		ctx.stroke();
		ctx.closePath();
	}

	fillHex(canvasID, center, fillColor, size) {
		let coor = [];
		[0,1,2,3,4,5].map( i => coor[i] = this.getPointyHexCornerCoord(center, size, i) );
		const ctx = canvasID.getContext('2d');
		ctx.beginPath();
		ctx.fillStyle = fillColor;
		ctx.globalAlpha = 0.1;
		[0,1,2,3,4,5].map( i => ctx.lineTo(coor[i].x, coor[i].y) );
		ctx.closePath();
		ctx.fill();
	}

	drawHexCoordRowAndColumn(canvasID, center, hex) {
		const ctx = canvasID.getContext('2d');
		ctx.fillText(hex.s, center.x - 15, center.y-2);
		ctx.fillText(hex.q, center.x + 3, center.y-2);
		ctx.fillText(hex.r, center.x - 3, center.y + 14);
	}
//canvas drawing END

	render() {
		return (
			<div>
				<canvas ref={canvasHex => this.canvasHex = canvasHex}></canvas>
				<canvas ref={canvasCoordinates => this.canvasCoordinates = canvasCoordinates}></canvas>
				<canvas ref={canvasView => this.canvasView = canvasView}></canvas>
				<canvas 
					ref={canvasInteraction => this.canvasInteraction = canvasInteraction}
					onMouseMove={this.handleMouseMove}
					onClick={this.handleClick}
				></canvas>
				<button className="expandButton" onClick={this.handleExpandClick}>Expand</button>
			</div>
		);
	}

//useful function
	getPointyHexCornerCoord(center, size, i) {
		let angle_deg = 60 * i - 30;
		let angle_rad = Math.PI / 180 * angle_deg;
		let x = center.x + size * Math.cos(angle_rad);
		let y = center.y + size * Math.sin(angle_rad);
		return this.Point(x, y);
	}

	getPointyHexToPixel(hex, size, hexOrigin) {
		let x = size * (Math.sqrt(3) * hex.q + Math.sqrt(3)/2 * hex.r) + hexOrigin.x;
		let y = size * (3/2 * hex.r) + hexOrigin.y;
		return this.Point(x, y);
	}

	getPointyPixelToHex(point, size, hexOrigin) {
		let q = ((point.x - hexOrigin.x) * Math.sqrt(3) / 3 - (point.y - hexOrigin.y) / 3) / size;
		let r = (point.y - hexOrigin.y) * 2 / 3 / size;
		return this.Hex(q, r);
	}

	cubeDirection(direction) {
		const cubeDirection = [this.Hex(1, 0, -1), this.Hex(1, -1, 0), this.Hex(0, -1, 1),
													this.Hex(-1, 0, 1), this.Hex(-1, 1, 0), this.Hex(0, 1, -1)];
		return cubeDirection[ direction ];
	}

	cubeAdd(a, b) {
		return this.Hex(a.q + b.q, a.r + b.r, a.s + b.s);
	}

	getCubeNeighbor(h, direction) {
		return this.cubeAdd(h, this.cubeDirection(direction));
	}

	getNeighbors(h) {
		let arr = [];
		for(let i = 0; i <= 5; i++) {
			const { q, r, s } = this.getCubeNeighbor(this.Hex(h.q, h.r, h.s), i);
			arr.push(this.Hex(q, r, s));
		}
		return arr;
	}

	cubeRound(hex) {
		let rq = Math.round(hex.q);
		let rr = Math.round(hex.r);
		let rs = Math.round(hex.s);
		let q_diff = Math.abs(rq - hex.q);
		let r_diff = Math.abs(rr - hex.r);
		let s_diff = Math.abs(rs - hex.s);
		if(q_diff > r_diff && q_diff > s_diff) {
			rq = - rr - rs;
		}else if(r_diff > s_diff) {
			rr = - rq - rs;
		}else {
			rs = - rq - rr;
		}
		return this.Hex(rq, rr, rs);
	}

	getDistanceLine(hexA, hexB, size, hexOrigin) {
		let dist = this.cubeDistance(hexA, hexB);
		let arr = [];
		for(let i = 0; i <= dist; i++) {
			let center = this.getPointyHexToPixel( 
				this.cubeRound( this.cubeLinearInt(hexA, hexB, 1.0 / dist * i) ),
				size, hexOrigin 
			);
			arr = [].concat(arr, center);
		}
		this.setState({ currentDistanceLine: arr });
	}

	cubeDistance(hexA, hexB) {
		const { q, r, s } = this.cubeSubstract(hexA, hexB);
		return ( Math.abs(q) + Math.abs(r) + Math.abs(s) ) / 2;
	}

	cubeSubstract(hexA, hexB) {
		return this.Hex(hexA.q-hexB.q, hexA.r-hexB.r, hexA.s-hexB.s);
	}

	cubeLinearInt(hexA, hexB, t) {
		return this.Hex(
			this.linearInterpolation(hexA.q, hexB.q, t),
			this.linearInterpolation(hexA.r, hexB.r, t),
			this.linearInterpolation(hexA.s, hexB.s, t)
		);
	}

	linearInterpolation(a, b, t) {
		return (a + (b - a) * t);
	}

	getHexParams(hex, size) {
		let hexWidth = Math.sqrt(3) * size;
		let hexHeight = 2 * size;
		let horizDist = hexWidth;
		let vertDist = hexHeight * 3 / 4;
		return { hexWidth, hexHeight, horizDist, vertDist };
	}

	getCanvasPosition(canvasID) {
		let rect = canvasID.getBoundingClientRect();
		this.setState({
			canvasPosition: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }
		})
	}
//useful function END

//helper function
	Point(x, y) {
		return { x: x, y: y };
	}

	Hex(q, r, s) {
		return { q: q, r: r, s: s };
	}
//helper function END

	//My Function
	findObstacles() {
		const { obstacles } = this.state;
		let allObstacles = [];
		obstacles.map( ob => {
			const { q, r, s } = JSON.parse(ob);
			allObstacles = [].concat(allObstacles, this.Hex(q, r, s));
			return null;
		});
		return allObstacles;
	}



//draw Hexes function (2) # need more or less values of leftSide & rightSide according to canvas size
	// drawHexes() {
	// 	const { hexSize, hexOrigin, hexParams, canvasSize } = this.state;
	// 	const { canvasWidth, canvasHeight } = this.state.canvasSize;
	// 	const { hexWidth, hexHeight, horizDist, vertDist } = this.state.hexParams;
	// 	const { leftSide, rightSide, topSide, bottomSide } = this.getHexesArea(canvasSize, hexOrigin, hexParams);

	// 	for(let r = -topSide; r <= bottomSide; r++) {
	// 		for(let q = -leftSide; q <= rightSide; q++) {
	// 			let center = this.getPointyHexToPixel(this.Hex(q, r), hexSize, hexOrigin);
	// 			if( (center.x > hexWidth/2 && center.x < canvasWidth - hexWidth/2) &&
	// 				(center.y > hexHeight/2 && center.y < canvasHeight - hexHeight/2) ) {
	// 				this.drawHex(this.canvasHex, center, hexSize);
	// 				this.drawHexCoordRowAndColumn(this.canvasHex, center, this.Hex(q, r));
	// 			}
	// 		}
	// 	}
	// }

	// getHexesArea({canvasWidth, canvasHeight}, hexOrigin, hexParams) {
	// 	let leftSide = Math.round( hexOrigin.x / hexParams.horizDist ) * 2;
	// 	let rightSide = Math.round( (canvasWidth - hexOrigin.x) / hexParams.horizDist ) * 2;
	// 	let topSide = Math.round( hexOrigin.y / hexParams.vertDist );
	// 	let bottomSide = Math.round( (canvasHeight - hexOrigin.y) / hexParams.vertDist );
	// 	return { leftSide, rightSide, topSide, bottomSide };
	// }
//draw Hexes function (2) END

}