import React from 'react';
import {render} from 'react-dom';
import Cluster from './components/cluster.jsx';
import SunBurst from './components/sunBurst.jsx';
import utils from './utils/tree.js'
import './styles/app.css';

// const bookListingTemplate = require("./templates/book-listing.handlebars");
const populationDefs =  require("./utils/populations");
// const userReportData =
// `
// AMBIGUOUS 0.0241815595745
// NAFRICA 0.0148221574468
// ITALY 0.264005851064
// AMBIG_WEURASIA 0.018330093617
// FINNISH 0.0213826404255
// CYPRUS-MALTA-SICILY 0.109452904255
// AMBIG_NEEUROPE 0.017516506383
// NEAREAST 0.0270528361702
// CSAMERICA 0.202923978723
// SWEUROPE 0.0611808574468
// AMBIG_SWEUROPE 0.0271630659574
// TURK-IRAN-CAUCASUS 0.0461903978723
// AMBIG_EMED 0.0100534148936
// NEUROPE 0.15574373617
// `;
//
// var rawData = userReportData
//   .trim()
//   .split("\n")
//   .map(c => c.split(" "))
//   .map(c => ({
//     percentage: c[1] * 100,
//     type: c[0],
//   }));



class App extends React.Component {

  constructor(props) {
   super(props);
   this.state = {isToggleOn: true};
   // This binding is necessary to make `this` work in the callback
   this.handleClick = this.handleClick.bind(this);
   this.setActive   = this.setActive.bind(this);
   this.sizeUpdate  = this.sizeUpdate.bind(this);
  }

  handleClick(cluster, updateState=true) {
    var sortedTree = this.getSortedTree();
    this.resetOpen();
    this.resetActive(sortedTree);
    cluster.isOpen = true;
    if (updateState) {
      this.setState({tree: sortedTree});
    }
  }

  setActive(cluster, updateState=true) {
    var sortedTree = this.getSortedTree();
    this.resetActive(sortedTree);
    var topParent = utils.getTopParent(sortedTree, cluster);
    this.handleClick(topParent, false);
    // var flatTree = utils.getFlatTree(cluster);
    // flatTree.forEach( f => f.isActive = true);
    cluster.isActive = true;
    // console.log(cluster);
    if (updateState) {
      this.setState({tree: sortedTree});
    }
  }

  resetOpen() {
    Object.keys(this.props.tree).map( k => this.props.tree[k].isOpen = false);
  }

  resetActive(cluster) {
    var flatTree = utils.getFlatTree(cluster);
    flatTree.forEach( f => f.isActive = false );
  }

  hasActive(cluster) {
    var flatTree = utils.getFlatTree(cluster);
    return flatTree.some( f => f.isActive);
  }

  getOpenCluster() {
    var cl = null;
    Object.keys(this.props.tree).forEach( k => {
      if (this.props.tree[k].isOpen) {
        cl = this.props.tree[k];
      }
    });
    return cl;
  }

  getSortedTree() {
    var keys = Object.keys(this.props.tree).sort( (a, b) => this.props.tree[b].percentage - this.props.tree[a].percentage);
    var children = {};
    keys.forEach( k => children[k] = this.props.tree[k] );
    return {children};
  }

  sizeUpdate() {
    console.log("trigger size update");
    setTimeout( () => window.parent.postMessage(document.body.clientHeight, '*'), 500) ;
  }

  render () {
    var sortedTree = this.getSortedTree();
    var openCluster = this.getOpenCluster();
    // console.log(sortedTree);

    if ( openCluster && utils.isStraightLine(openCluster) && !this.hasActive(openCluster) ) {
      this.setActive(openCluster, false);
    }
    return (
      <div>
        <section className="app-hero-section-wrapper ancestry-app">
          <div className="app-hero-section grid">
            <div className="row graph">
              <div className="col-xs-12 col-sm-12 col-md-5 col-lg-5">
                <SunBurst tree={sortedTree} colors={populationDefs.DISPLAY_COLORS} setActive={this.setActive} sizeUpdate={this.sizeUpdate}/>
              </div>
              <div className="col-xs-12 col-sm-12 col-md-6 col-md-offset-1 col-lg-6 col-lg-offset-1">
                <h1>Estimation of the general geographic regions where your ancestors lived</h1>
                <ul className="list-group population-list">
                  {
                    Object.keys(sortedTree.children).map( (k,i) => {
                      if (sortedTree.children[k] == openCluster) {
                        return (<Cluster key={i.toString()} cluster={openCluster} setActive={this.setActive}></Cluster>);
                      } else {
                        return (
                          <li className="list-group-item top" key={i.toString()} onClick={() => this.handleClick(sortedTree.children[k])}>
                            {sortedTree.children[k].displayName}
                            <span className="glyphicon glyphicon-chevron-down"></span>
                            <span className="badge">{sortedTree.children[k].percentage.toFixed(1)}%</span>
                          </li>
                        );
                      }
                    })
                  }
                </ul>
              </div>
            </div>
          </div>
        </section>
        <section className="app-section info">
          <div className="grid">
            <div className="row">
              <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12 bg-info-ancestry">
                <p className="bg-info">
                  The <strong>ambiguous percentage</strong> of your ancestry report indicates a percentage of your DNA file that did not match with any of the sources in our reference panel.
                </p>
              </div>
              <div className="col-xs-12 col-sm-12 col-md-12 col-lg-12">
                <blockquote className="blockquote-reverse">
                  <footer>This application uses <cite title="Algorithm Author">Dr. Joe Pickrell's</cite> algorithm.</footer>
                </blockquote>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }
}

(function() {
  window.addEventListener('message', function(event) {
    function parseContent(content) {
      return content.trim()
      .split("\n")
      .map( c => c.split(" ") )
      .map( c => ({
            percentage: c[1] * 100,
            type: c[0],
          })
      );
    }

    console.log("GOT EVENT");
    var raw_data = JSON.parse(event.data);
    console.log(raw_data);
    if ( raw_data ) {
      if ( raw_data && raw_data.hasOwnProperty && raw_data.hasOwnProperty("__fs") ) {
        console.log("return FS event", raw_data);
        return; //fullstory bug!!!!!!
      }
      if (typeof raw_data === "string") {
        raw_data = {
          reportPage: raw_data
        };
      }
      if (raw_data && raw_data.reportPage && typeof raw_data.reportPage === "string") {
        raw_data.parsedData = parseContent(raw_data.reportPage)
      }
      if (raw_data.preview) {
        raw_data.parsedData = [
          {"percentage": 2.489131, "type": "CASIA"},
          {"percentage": 20.634334, "type": "CSAMERICA"},
          {"percentage": 15.032288, "type": "NEUROPE"},
          {"percentage": 48.984473, "type": "SWEUROPE"},
          {"percentage": 4.007514, "type": "TURK-IRAN-CAUCASUS"},
          {"percentage": 3.069884, "type": "AMBIGUOUS"},
          {"percentage": 3.833882, "type": "AMBIG_WEURASIA"},
          {"percentage": 1.948494, "type": "AMBIG_AFRICA"}
        ];
        // $("#ac-username").html("Maradona 's<br>ancestry")
        // to do depending on requirements
      }
      var tree = utils.build(raw_data.parsedData, populationDefs.CLUSTERS, populationDefs.DISPLAY_NAMES, populationDefs.POP_SOURCES, populationDefs.ALL_SOURCES, populationDefs.DISPLAY_COLORS);
      render(<App tree={tree}/>, document.getElementById('app'));
    }
    setTimeout( () => window.parent.postMessage(JSON.stringify({
        height: document.body.clientHeight,
        sharingDescription: "Checkout my ancestry on GenePlaza"
      }), '*'
    ), 500) ;

  }, false);
})();
