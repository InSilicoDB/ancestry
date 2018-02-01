import React from 'react';
import {render, findDOMNode} from 'react-dom';
import InfoText from './infoText.jsx';
import utils from '../utils/tree.js'
import d3SunBurst from '../utils/d3-sunburst.js'

class SunBurst extends React.Component {

  constructor(props) {
   super(props);
   this.updateDimensions = this.updateDimensions.bind(this);
  }

  updateDimensions() {
    var w = window,
        d = document,
        documentElement = d.documentElement,
        body      = d.getElementsByTagName('body')[0],
        width     = w.innerWidth || documentElement.clientWidth || body.clientWidth,
        height    = w.innerHeight|| documentElement.clientHeight|| body.clientHeight;
    var tree      = this.props.tree;
    var colors    = this.props.colors;
    var setActive = this.props.setActive;
    var width     = findDOMNode(this).offsetWidth;
    $("#chart svg").remove();
    console.log("updateDimensions");
    d3SunBurst.createSunBurst(tree, colors, width, setActive);
    this.props.sizeUpdate();
    //  this.setState({width: width, height: height});
  }

  render () {
    var width = this.state ? this.state.width : null;
    return (
      <div id="main">
        <div id="sequence"></div>
        <div width={width} id="chart">
          <div id="explanation">
            <span id="percentage"></span><br/>
            <span id="explanation-text"></span>
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    var tree      = this.props.tree;
    var colors    = this.props.colors;
    var setActive = this.props.setActive;
    var width     = findDOMNode(this).offsetWidth;
    console.log("componentDidMount");
    d3SunBurst.createSunBurst(tree, colors, width, setActive);
    window.addEventListener("resize", this.updateDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions);
  }

  componentDidUpdate() {

  }

}

export default SunBurst;
