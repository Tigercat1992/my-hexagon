import React, { Component } from 'react';
import './Canvas.css';

export default class Canvas extends Component {
	constructor(props) {
		super(props);
		this.state = {
			hexSize: 20,
			hexOrigin: { x: 400, y: 300 },
			currentHex: { q: 0, r: 0, s: 0, x: 0, y: 0 },
			playerPosition: { q: 0, r: 0, s: 0, x: 0, y: 0 },
		};
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleClick = this.handleClick.bind(this);
	}

	componentWillMount() {
		this.setState({
			canvasSize: { canvasWidth: 800, canvasHeight: 600 },
			hexParams: this.getHexParams(this.canvasHex, this.state.hexSize)
		})
	}

	componentDidMount() {
		const { canvasWidth, canvasHeight } = this.state.canvasSize;
		this.canvasHex.width = canvasWidth;
		this.canvasHex.height = canvasHeight;
		this.canvasCoord.width = canvasWidth;
		this.canvasCoord.height = canvasHeight;
		this.drawHexes(this.canvasHex, this.state.hexSize);
		this.getCanvasPosition(this.canvasCoord);
	}

	shouldComponentUpdate(nextProps, nextState) {
		if(nextState.currentHex !== this.state.currentHex) {
			const { q, r, s, x, y } = nextState.currentHex;
			const { canvasWidth, canvasHeight } = this.state.canvasSize;
			const ctx = this.canvasCoord.getContext("2d");
			ctx.clearRect(0, 0, canvasWidth, canvasHeight);
			//this.drawNeighbors(this.Hex(q, r, s));
			let currentDistanceLine = nextState.currentDistanceLine;
			for(let i = 0; i <= currentDistanceLine.length - 1; i++) {
				if(i === 0)
					this.drawHex(this.canvasCoord, this.Point(currentDistanceLine[i].x, currentDistanceLine[i].y), this.state.hexSize, "black", 1, "red");
				else
					this.drawHex(this.canvasCoord, this.Point(currentDistanceLine[i].x, currentDistanceLine[i].y), this.state.hexSize, "black", 1, "grey");
			}
			this.drawHex(this.canvasCoord, this.Point(x, y), this.state.hexSize, "black", 1, "grey");
			return true;
		}
		return false;
	}

//draw Hexes function (1) # Responsive in any canvas size
	drawHexes() {
		const { hexSize, hexOrigin, hexParams, canvasSize } = this.state;
		const { canvasWidth, canvasHeight } = this.state.canvasSize;
		const { hexWidth, hexHeight, horizDist, vertDist } = this.state.hexParams;
		const { leftSide, rightSide, topSide, bottomSide } = this.getHexesAreaOnCanvas(canvasSize, hexOrigin, hexParams);

		let p = 0;
		for(let r = 0; r <= bottomSide; r++) {
			if(r%2 === 0 && r !== 0) p++;
			for(let q = -leftSide; q <= rightSide; q++) {
				const center = this.getPointyHexToPixel(this.Hex(q-p, r), hexSize, hexOrigin);
				if( (center.x > hexWidth/2 && center.x < canvasWidth - hexWidth/2) &&
					(center.y > hexHeight/2 && center.y < canvasHeight - hexHeight/2) ) {
					this.drawHex(this.canvasHex, center, hexSize, "black", 1, "grey");
					//this.drawHexCoordRowAndColumn(this.canvasHex, center, this.Hex(q-p, r, -(q-p)-r));
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
					this.drawHex(this.canvasHex, center, hexSize, "black", 1, "grey");
					//this.drawHexCoordRowAndColumn(this.canvasHex, center, this.Hex(q+n, r, -(q+n)-r));
				}
			}
		}
	}

	getHexesAreaOnCanvas({canvasWidth, canvasHeight}, hexOrigin, hexParams) {
		let leftSide = Math.round( hexOrigin.x / hexParams.horizDist );
		let rightSide = Math.round( (canvasWidth - hexOrigin.x) / hexParams.horizDist );
		let topSide = Math.round( hexOrigin.y / hexParams.vertDist );
		let bottomSide = Math.round( (canvasHeight - hexOrigin.y) / hexParams.vertDist );
		return { leftSide, rightSide, topSide, bottomSide };
	}
//draw Hexes function (1) END

	drawHex(canvasID, center, size, color, width, fillColor) {
		for(let i = 0; i <= 5; i++) {
			let start = this.getPointyHexCornerCoord(center, size, i);
			let end = this.getPointyHexCornerCoord(center, size, i + 1);
			this.fillHex(canvasID, center, fillColor, size);
			this.drawLine(canvasID, start, end, color, width);
		} 
	}

	drawNeighbors(h) {
		const { hexSize, hexOrigin } = this.state;
		for(let i = 0; i <= 5; i++) {
			const {q, r, s} = this.getCubeNeighbor(this.Hex(h.q, h.r, h.s), i);
			const {x, y} = this.getPointyHexToPixel(this.Hex(q, r, s), hexSize, hexOrigin);
			this.drawHex(this.canvasCoord, this.Point(x, y), hexSize, "red", 1, "grey");
		}
	}

	handleMouseMove(event) {
		const { canvasPosition, hexSize, hexOrigin } = this.state;
		const { canvasWidth, canvasHeight } = this.state.canvasSize;
		const { hexWidth, hexHeight, horizDist, vertDist } = this.state.hexParams;
		let offsetX = event.pageX - canvasPosition.left;
		let offsetY = event.pageY - canvasPosition.top;		
		const { q, r, s } = this.cubeRound(this.getPointyPixelToHex(this.Point(offsetX, offsetY), hexSize, hexOrigin));
		const { x, y } = this.getPointyHexToPixel(this.Hex(q, r, s), hexSize, hexOrigin);
		let { playerPosition } = this.state;
		this.getDistanceLine( this.Hex(playerPosition.q, playerPosition.r, playerPosition.s), this.Hex(q,r,s) );
		if((x > hexWidth/2 && x < canvasWidth - hexWidth/2) && (y > hexHeight/2 && y < canvasHeight - hexHeight/2)) {
			this.setState({ currentHex: { q, r, s, x, y } });
		}
	}

	handleClick() {
		this.setState({ playerPosition: this.state.currentHex });
	}

	render() {
		return (
			<div>
				<canvas ref={canvasHex => this.canvasHex = canvasHex}>
				</canvas>
				<canvas 
					ref={canvasCoord => this.canvasCoord = canvasCoord}
					onMouseMove={this.handleMouseMove}
					onClick={this.handleClick}
				>
				</canvas>
			</div>
		);
	}

//canvas drawing
	drawLine(canvasID, start, end, color, width) {
		const ctx = canvasID.getContext('2d');
		ctx.beginPath();
		ctx.moveTo(start.x, start.y);
		ctx.strokeStyle = color;
		ctx.lineWidth = width;
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

	getDistanceLine(hexA, hexB) {
		const { hexSize, hexOrigin } = this.state;
		let dist = this.cubeDistance(hexA, hexB);
		let arr = [];
		for(let i = 0; i <= dist; i++) {
			let center = this.getPointyHexToPixel( 
				this.cubeRound( this.cubeLinearInt(hexA, hexB, 1.0 / dist * i) ),
				hexSize, hexOrigin 
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