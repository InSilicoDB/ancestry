import React from 'react';
import {render} from 'react-dom';
import InfoText from './infoText.jsx';
import utils from '../utils/tree.js'

class Cluster extends React.Component {


  hasInfoText(cluster) {
    var self = this;
    if (cluster.inctext) {
      return true;
    } else if ( !utils.shouldShowChildren(cluster) ) {
      var children            = Object.keys(cluster.children).map(k => cluster.children[k]);
      var childrenHasInfoText = children.map(ch => self.hasInfoText(ch) );
      return childrenHasInfoText.indexOf(true) >= 0;
    }
  }

  render () {
    var cluster           = this.props.cluster;
    var hasChildrenToShow = utils.shouldShowChildren(cluster);
    var classesLi         = `list-group-item ${cluster.isOpen ? "active": ""}`;
    var classesUl         = `list-group ${cluster.isOpen ? "active":      ""}`;
    var contStyle         = {};
    var divStyle          = null;
    var glyphiconStyle    = {
      display: "None",
      color: cluster.color || "red",
      marginLeft: "3px"
    };
    if (cluster.isOpen) {
      contStyle = {
        backgroundColor: cluster.color
      };
    } else if (cluster.category === utils.CATEGORIES.CLUST) {
      divStyle = {
        backgroundColor: cluster.color || "red"
      };
    } else if (cluster.category === utils.CATEGORIES.POP) {
      divStyle = {
        borderColer: cluster.color || "red"
      };
    }
    if ( this.hasInfoText(cluster) ) {
      delete glyphiconStyle.display;
      contStyle.cursor = "pointer";
    }


    return (
      <ul className={classesUl}>
        <li style={contStyle} onClick={ () => this.props.setActive(cluster) } className={classesLi} key={Math.random()} >
          <span style={divStyle} className="sub-region-lines"></span>
          {cluster.displayName}
          <span className="glyphicon glyphicon-info-sign" style={glyphiconStyle} aria-hidden="true"></span>
          <span className="badge">{cluster.percentage.toFixed(1)}%</span>
        </li>
        {hasChildrenToShow ? (Object.keys(cluster.children).map( k => <Cluster key={Math.random()} cluster={cluster.children[k]} setActive={this.props.setActive}> </Cluster> )) : "" }
        {cluster.isActive ? (<InfoText cluster={cluster} />) : ""}
      </ul>
    );
  }

}

export default Cluster;
