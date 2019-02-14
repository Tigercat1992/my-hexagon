import React, { Component } from 'react';
import Canvas from './Canvas.jsx';
import OriginCanvas from './OriginCanvas.jsx';

class App extends Component {
	render() {
		return (
			<div className="container">
				{<Canvas />}
				{/*<OriginCanvas />*/}
			</div>
		);
	}
}

export default App;