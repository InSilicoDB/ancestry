function andify(list, punctuation) {
    if (!punctuation) punctuation = ',';
    if (list.length == 0) {
        return '';
    } else if (list.length == 1) {
        return list[0];
    } else if (list.length == 2) {
        return list[0] + ' and ' + list[1];
    } else {
        var last = list.pop();
        var out = list.join(punctuation+' ') + ' and ' + last;
        list.push(last); // leave our input the way we found it, since js doesn't copy
        return out;
    }
}

// Convert a list of places into a reasonably compact text string, fixing ugly names.
// The data that goes into this lives in popsources.js.  Hand-cleaning that without breaking
// anything would be very difficult, and likely cause problems for the next reference panel,
// so instead we clean it up here.
function list_to_text(l) {
    var places      = {};
    var geneticists = ["Ayodo", "Comas", "Coriell", "ECCAC", "Henn", "Metspalu"];
    var subplaces   = ["Adana", "Aydin", "Balikesir", "Cochabamba", "East", "Istanbul", "Kayseri", "Kinyawa_MKK", "LaPaz", "NChina", "Pando", "Pomiri", "South", "Trabzon", "Kenya_LWK"];
    var subtypes    = ["Argyll", "Bergamo", "Chaplin", "EastSicilian", "French", "Megrels", "Naukan", "Reindeer", "Sir", "Sireniki", "Spanish", "Tuscan", "WestSicilian"];
    for (var i in l) {
        var place='', subplace='', pop='';
        if (l[i][1].indexOf('(')!=-1 && l[i][1].indexOf('expat')==-1) {
            var tmp  = l[i][1].split('(');
            place    = tmp[0];
            subplace = tmp[1];
            subplace = subplace.split(')')[0];
        } else if (l[i][1].indexOf(', ')!=-1) {
            var tmp  = l[i][1].split(', ');
            place    = tmp[0];
            subplace = tmp[1];
        } else {
            place = l[i][1];
        }
        var usidx = l[i][0].indexOf('_');
        if (usidx==-1) {
            pop = l[i][0];
        } else if (l[i][0].indexOf('Eskimo_')!=-1) {
            // Even if the Chaplin, Naukan and Sireniki don't consider "Eskimo" an insult, the Inuit
            // do and with no actual Inuit samples Inuit users might get classified here.
            pop = l[i][0].replace('Eskimo_','');
        } else {
            var modifier = l[i][0].substring(usidx+1);
            if (geneticists.indexOf(modifier)!=-1) {
                pop = l[i][0].substring(0,usidx);
            } else if (subplaces.indexOf(modifier)!=-1) {
                pop      = l[i][0].substring(0,usidx);
                subplace = modifier;
            } else if (subtypes.indexOf(modifier)!=-1) {
                pop = l[i][0].replace('_','/','g');
            } else {
                pop = l[i][0].replace('_',' ','g');
            }
        }
        if (place=='Italia')       place    = 'Italy'; // The *only* translated placename in our data
        if (subplace=='Kenya_LWK') subplace = 'Webuye';
        if (pop=='BantuKenya')     pop      = 'Bantu';
        subplace = subplace.replace(/_[A-Z][A-Z][A-Z]$/, '');
        place    = place.replace(/([a-z])([A-Z])/g,'$1 $2').replace('_',' ');
        pop      = pop.replace('Pygmy',' (Pygmy)');
        if (!(place in places)) {
            places[place] = {'pops':[], 'subplaces':[], 'cnt':0};
        }
        if (places[place].pops.indexOf(pop)==-1) places[place].pops.push(pop);
        if (subplace && places[place].subplaces.indexOf(subplace)==-1) places[place].subplaces.push(subplace);
        places[place].cnt++;
    }
    var outlist = [];
    for (var place in places) {
        var out = '';
        out += andify(places[place].pops);
        if (place.indexOf('expat')!=-1) {
            out += ' from ';
        } else {
            out += ' in ';
        }
        if (places[place].subplaces.length > 0) {
            if (places[place].cnt > places[place].subplaces.length) {
                var extra = places[place].cnt - places[place].subplaces.length;
                places[place].subplaces.push(extra + ' other site' + (extra>1 ? 's' : ''));
            }
            out += '(' + andify(places[place].subplaces) + ') ';
        } else if (places[place].cnt > places[place].pops.length) {
            out += '(' + places[place].cnt + ' sites) ';
        }
        out += place;
        outlist.push(out);
    }
    return andify(outlist,';');
}

function make_sources(pop_sources, allsources) {
  var sources_wanted = {};
  var sources = [];
  for (var group in pop_sources) {
      for (var i in pop_sources[group]) {
          sources_wanted[pop_sources[group][i]] = group;
      }
  }
  for (var i in allsources) {
      if (allsources[i][1] in sources_wanted) {
          allsources[i][0] = allsources[i][1];
      }
      if (allsources[i][0] in sources_wanted) {
          allsources[i].push(sources_wanted[allsources[i][0]]);
          sources.push(allsources[i]);
      }
  }
  return sources;
}


module.exports = {
  list_to_text,
  make_sources,
  andify
}
