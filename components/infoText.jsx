import React from 'react';
import {render} from 'react-dom';
import utils from '../utils/tree.js'

class InfoText extends React.Component {

  getInfoText(cluster) {
    var flattenArr    = utils.getFlatTree(cluster);
    var activeCluster = flattenArr.find(f => f.isActive);
    if ( activeCluster && !utils.shouldShowChildren( activeCluster ) ) {
      var flattenArrAC = utils.getFlatTree(activeCluster);
      activeCluster = flattenArrAC.find(f => f.inctext && f.inctext!="");
    }
    return activeCluster ? (activeCluster.inctext || "" ) : "";
  }

  getColorOfActive(cluster) {
    var flattenArr    = utils.getFlatTree(cluster);
    var activeCluster = flattenArr.find(f => f.isActive);
    return activeCluster ? activeCluster.color : false;
  }

  render () {
    var cluster      = this.props.cluster;
    var infoText     = this.getInfoText(cluster);
    var color        = this.getColorOfActive(cluster);
    var style        = {
      backgroundColor: color
    };
    var showInfoText = (infoText.trim() !== "");
    if (showInfoText) {
      return (
        <li style={style} className="list-group-item active infoBox" key={Math.random()}>
          <span className="glyphicon glyphicon-info-sign" aria-hidden="true"></span>
          {infoText}
        </li>
      );
    } else {
      return null;
    }

 }
}

export default InfoText;
