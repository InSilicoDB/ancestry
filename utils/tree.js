const utility = require("./old-function");

const POP = "population";
const CLUST = "cluster";
const CONT = "continent";
const AMBIGUOUS_SUBCAT = "AMBIG_";

function addDisplayNames(tree, displayNames) {
  for (var popType in tree) {
    if (tree.hasOwnProperty(popType)) {
      var popTypeToSearch = popType.startsWith(AMBIGUOUS_SUBCAT) ? popType.replace(AMBIGUOUS_SUBCAT,"") : popType;
      // console.log(popType, popTypeToSearch);
      // tree[popType].displayName = (popType.startsWith(AMBIGUOUS_SUBCAT) ? DISPLAY_NAMES[AMBIGUOUS_SUBCAT] : "") + (DISPLAY_NAMES[popTypeToSearch] ? DISPLAY_NAMES[popTypeToSearch] : popType);
      tree[popType].displayName = popType.startsWith(AMBIGUOUS_SUBCAT) ? displayNames[AMBIGUOUS_SUBCAT] : (displayNames[popTypeToSearch] ? displayNames[popTypeToSearch] : popType) ;
      if (tree[popType].children) {
        addDisplayNames(tree[popType].children, displayNames);
      }
    }
  }
}

function addIncludeText(tree, popSources, allSources) {
  for (var popType in tree) {
    if (tree.hasOwnProperty(popType)) {
      if (tree[popType].children  && Object.keys(tree[popType].children).length > 0 ) {
        addIncludeText(tree[popType].children, popSources, allSources);
      } else {
        var sources      = utility.make_sources(popSources, allSources);
        var pops_to_list = [];
        for (var i in sources) {
          for (var j in popSources[popType]) {
            if (sources[i][0] == popSources[popType][j] && sources[i][1]!='FAKE') {
                pops_to_list.push([sources[i][1], sources[i][2]]);
            }
          }
        }
        tree[popType].pops_to_list = pops_to_list;
        tree[popType].inctext      = utility.list_to_text(pops_to_list);
      }
    }
  }
}

function addHelpText(tree, clusters, displayNames) {
  for (var popType in tree) {
    if (tree.hasOwnProperty(popType)) {
      if (tree[popType].children) {
        addHelpText(tree[popType].children, clusters, displayNames);
      } else {
        if (popType.startsWith(AMBIGUOUS_SUBCAT) ) {
          var popTypeToSearch = popType.replace(AMBIGUOUS_SUBCAT,"");
          var popname = (displayNames[popTypeToSearch] || popType);
          var txt = '';
          txt += popname;
          txt += ' is a ';
          if (tree[popType].category==CONT) txt += 'very ';
          txt += 'general category containing ';
          var subpops = {};
          for (var i in clusters) {
            let index = 1;
            if(tree[popType].category==CLUST) {
              index = 2;
            }
            if (clusters[i][2-index]==popTypeToSearch) {
                var subpop = clusters[i][(2-index)-1];
                subpops[ (displayNames[subpop] || subpop) ] = true;
            }
          }
          txt += utility.andify(Object.keys(subpops));
          tree[popType].inctext = txt;
        }
      }
    }
  }
}

function addColors(tree, displayColors) {
  for (var popType in tree) {
    if (tree.hasOwnProperty(popType)) {
      tree[popType].color = displayColors[popType];
      if (tree[popType].children) {
        addColors(tree[popType].children, displayColors);
      }
    }
  }
}

function getNewTreeNode(popCategory, popType, children={}) {
  return {children: children, percentage: 0, category: popCategory, type: popType};
}

function build( algorithmData, CLUSTERS, displayNames, popSources, allSources, displayColors ) {
  var tree = {};

  for (var i = 0; i < algorithmData.length; i++) {
    var popData = algorithmData[i];
    var popTypeToSearch = popData.type.startsWith(AMBIGUOUS_SUBCAT) ? popData.type.replace(AMBIGUOUS_SUBCAT,"") : popData.type;
    var popCategory = POP;
    var cluster = CLUSTERS.find( cl => cl[0] === popTypeToSearch);
    // console.log(popTypeToSearch,cluster);
    if (!cluster) {
      popCategory = CLUST;
      cluster = CLUSTERS.find( cl => cl[1] === popTypeToSearch);
    }
    if (!cluster) {
      popCategory = CONT;
      cluster = CLUSTERS.find( cl => cl[2] === popTypeToSearch);
    }
    if ( popData.type.startsWith(AMBIGUOUS_SUBCAT) && [CONT,CLUST].indexOf(popCategory)!=-1 ) {
      popCategory = [CONT,CLUST, POP][[CONT,CLUST, POP].indexOf(popCategory) + 1];
    }
    if (cluster) {
      var population = cluster[0];
      var group      = cluster[1];
      var continent  = cluster[2];
      // console.log(popTypeToSearch, cluster)//,population,cluster,continent);
      if ( popCategory === CONT ) {
        tree[popData.type] = tree[popData.type] ? tree[popData.type] : getNewTreeNode(CONT, popData.type);
        tree[popData.type].percentage += popData.percentage;
      }
      if ( popCategory === CLUST ) {
        tree[continent] = tree[continent] ? tree[continent] : getNewTreeNode(CONT, popData.type);
        tree[continent].percentage += popData.percentage;
        tree[continent].children[popData.type] = tree[continent].children[popData.type] ? tree[continent].children[popData.type] : getNewTreeNode(CLUST, popData.type);
        tree[continent].children[popData.type].percentage += popData.percentage;
      }
      if ( popCategory === POP ) {
        tree[continent] = tree[continent] ? tree[continent] : getNewTreeNode(CONT, popData.type);
        tree[continent].percentage += popData.percentage;
        tree[continent].children[group] = tree[continent].children[group] ? tree[continent].children[group] : getNewTreeNode(CLUST, popData.type);
        tree[continent].children[group].percentage += popData.percentage;
        tree[continent].children[group].children[popData.type] = tree[continent].children[group].children[popData.type] ? tree[continent].children[group].children[popData.type] : getNewTreeNode(POP, popData.type, false);
        tree[continent].children[group].children[popData.type].percentage  += popData.percentage;
      }
    } else {
      //TODO warn unknow cluster
    }
  }
  // console.log("#############");
  addDisplayNames(tree, displayNames);
  addIncludeText(tree, popSources, allSources);
  addHelpText(tree, CLUSTERS, displayNames);
  addColors(tree, displayColors);
  return tree;
}

export default {
  build,
  getFlatTree(cluster) {
    var self = this;
    var flattenArr = [cluster];
    if (cluster.children) {
      var children = Object.keys(cluster.children).map( k => cluster.children[k] );
      children.forEach( child => {
        flattenArr = flattenArr.concat(self.getFlatTree(child));
        if ( flattenArr.indexOf(child)===-1 ) {
          flattenArr.push(child);
        }
      });
    }
    return flattenArr;
  },
  isStraightLine(cluster) {
    if (cluster.children) {
      var children = Object.keys(cluster.children).map( k => cluster.children[k] );
      if(children.length==1) {
        return this.isStraightLine(children[0])
      } else{
        return false;
      }
    } else {
      return true;
    }
  },
  shouldShowChildren(cluster) {
    if (cluster.children) {
      var children = Object.keys(cluster.children).map( k => cluster.children[k] );
      if (children.length>1) {
        return true;
      } else if(children.length==1) {
        if (children[0].displayName != cluster.displayName || this.shouldShowChildren(children[0]) ) {
          return true;
        }
      }
    }
    return false;
  },
  getTopParent(tree, cluster) {
    var self                   = this;
    var children               = Object.keys(tree.children).map( k => tree.children[k] );
    var parentChildrenMappings = children.map( f => ({cluster: f, allChildren: self.getFlatTree(f)}) );
    var parentChildrenMapping  = parentChildrenMappings.find( m => m.allChildren.indexOf(cluster) > -1 );
    return parentChildrenMapping.cluster;
  },
  CATEGORIES: {
    POP,
    CLUST,
    CONT
  }
};
