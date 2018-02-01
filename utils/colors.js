

function shadeColor(color, percent) {
  var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
  return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function generateRandomColor(colorHex) {
    var red = getRandomInt(0,50);
    var green = getRandomInt(0,50);
    var blue = getRandomInt(0,50);

    // mix the color
    if (colorHex) {
      var color = hexToRgb(colorHex);
      red = Math.round((red + color.r));
      green = Math.round((green + color.g));
      blue = Math.round((blue + color.b));
    }

    var newHex = rgbToHex(red, green, blue);
    return newHex;
}

export default {
  shadeColor,
  generateRandomColor
};
