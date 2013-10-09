// cGauge.js
// version 0.1.0
// Robert Sadler
// gitHub

if (typeof jQuery === 'function') {
  jQuery.fn.cGauge = function(options) {
    options.node = this.get(0);
    return new cGauge(options);
  }
}

var cGauge = function(options) {

  var
    node            = options.node,
    unit            = options.unit        || '',
    value           = options.value       || 0,
    maxValue        = options.maxValue    || findGoodMax(value),
    arcColor        = options.arcColor    || '#27AE60',
    arcWidth        = options.arcWidth    || 1,
    fillColor       = options.fillColor   || 'rgb(230, 230, 230)',
    font            = options.font        || 'sans-serif',
    fontColor       = options.fontColor   || 'rgb(80, 80, 80)',
    tickColor       = options.tickColor   || 'rgb(80,80,80)',
    outerSpace      = options.outerSpace === undefined ? 0.4: options.outerSpace,
    innerSpace      = options.innerSpace === undefined ? 0.4: options.innerSpace,
    ticks           = options.ticks      === undefined ? 40   : options.ticks,
    outerNums       = options.outerNums  === undefined ? true : options.outerNums,
    minNum          = options.minNum     === undefined ? true : options.minNum,
    maxNum          = options.maxNum     === undefined ? true : options.maxNum,
    shadowColor     = 'rgb(155, 155, 155)',
    shadowSize      = 0.15,
    
    nodeID          = node.getAttribute('id'),    
    nodeW           = node.offsetWidth,
    nodeH           = node.offsetHeight,
    
    W               = nodeW < nodeH ? nodeW : nodeH,
    H               = W,
    cx              = W/2,
    cy              = W/2,
    innerRadius     = W * 0.1495,
    innerTickRadius = W * 0.2875,
    outerTickRadius = W * 0.345,
    startRadians    = 0,
    endRadians      = 272,
    deg2rad         = Math.PI / 180.0001,     // not 180 to fix midpoint bug in Chrome (http://stackoverflow.com/questions/17557980/why-is-my-canvas-animated-arc-glitching-at-the-midpoint).
    offset          = 134,
    preValForGauge  = 0,
    preVal          = 0,
    preValSteps     = 0;

    // shadow options / defaults

    for (var x = 1; x <= 4; x++) {
      if (options['shadow' + x]) {
        if (options['shadow' + x].color) {
          options['shadow' + x].color = options['shadow' + x].color;
        } else {
          options['shadow' + x].color = shadowColor;
        }
        if (typeof options['shadow' + x].size !== undefined) {
          options['shadow' + x].size = options['shadow' + x].size;
        } else {
          options['shadow' + x].size = shadowSize;
        }
      } else {
        options['shadow' + x] = {
          color: shadowColor,
          size: shadowSize
        }
      }
    }

    var shadow1 = options.shadow1;
    var shadow2 = options.shadow2;
    var shadow3 = options.shadow3;
    var shadow4 = options.shadow4;


  // Warnings
  if (!document.contains(node)) {
    console.warn('cGauge DOM node not properly defined!');
  }
  
  // Initialize canvases and contexts
  var ctx  = createCanvas(1, W, H),
      ctx2 = createCanvas(2, W, H),
      ctx3 = createCanvas(3, W, H),
      ctx4 = createCanvas(4, W, H);
  
  function createCanvas(num, width, height) {
    var canvasNode = document.createElement('canvas');
    canvasNode.setAttribute('width', width);
    canvasNode.setAttribute('height', height);
    canvasNode.setAttribute('style', 'position: absolute');
    canvasNode.setAttribute('id', nodeID + 'Canvas' + num);
    node.appendChild(canvasNode);
    return canvasNode.getContext("2d");
  }
  
  // Accessible functions
  this.setValue = function(value) {
    var val_dist = normalizeValue(value);
    setGauge(val_dist[0], val_dist[1], value);
  }
  this.setMaxValue = function(maxValue) {
    updateMaxAndPerimeterValues(maxValue); 
  }
  this.setUnit = function(unit) {
    updateUnit(unit);
  }
  
  // Main
  // Outer radiant lines
  for (var tickNum = 0; tickNum <= ticks; tickNum += 1) {
    // scale the guage values (0 - ticks) 
    // to fit into the range of a partial circle (0-270 degrees)
    var scaledValue = scaletoRange(0, ticks, 0, 270, tickNum);
    // rotate so guageValue === 0 starts at 135 degrees on the circle
    var degrees = scaledValue + 135;
    // draw the radiant line
    // draw longer line every 1/4
    if (tickNum % (ticks/4) === 0){
        radiantLine(cx, cy, innerTickRadius, outerTickRadius, degrees, 2, tickColor);
    } else {
        var shorterLine = (outerTickRadius - innerTickRadius) / 2;
        radiantLine(cx, cy, innerTickRadius, outerTickRadius - shorterLine, degrees, 2, tickColor);
    }
  }
  
  // draw (inner) arc of guage-markers (outer arc not drwn)
  drawArc(ctx, innerTickRadius, W * 0.0076, "rgb(255,255,255)", startRadians, endRadians);
  
  // outer shadows
  shadowMaker(ctx3, innerTickRadius, false, shadow1.color, W * outerSpace * .01, W * 0.1 * shadow1.size, 'outer', offset); // hacky, need better way to do outerSpace / innerSpace
  shadowMaker(ctx3, innerTickRadius, false, shadow2.color, W * outerSpace * .01, W * 0.1 * shadow2.size, 'inner', offset);
  
  // innder shadows
  shadowMaker(ctx3, innerRadius, false, shadow3.color,  W * innerSpace * .01, W * 0.1 * shadow3.size, 'outer', offset);
  shadowMaker(ctx3, innerRadius, false, shadow4.color,  W * innerSpace * .01, W * 0.1 * shadow4.size, 'inner', offset);
  
  // invoke
  if (value)
    this.setValue(value);
  if (maxValue)
    this.setMaxValue(maxValue);
  if (unit)
    this.setUnit(unit);

  function findGoodMax(x) {
    var y = Math.pow(10, x.toString().length - 1);
    x = (x/y);
    x = Math.ceil(x);
    x = x*y;
    return x;
  }

  function normalizeValue(val){
    var valForGauge = Math.round((val * 272) / maxValue);
    if (valForGauge > 272) { valForGauge = 272; }
    var distance = Math.abs(valForGauge - preValForGauge);
    return [valForGauge, distance];
  }

  function updateMaxAndPerimeterValues(maxValue) {
    var fontSize     = Math.round(W * .04);
    ctx.font         = fontSize + 'px ' + font;
    ctx.fillStyle    = fontColor;
    var textMax      = '' + maxValue;
    var text1_4      = '' + Math.round(maxValue / 4);
    var text2_4      = '' + Math.round(maxValue / 2);
    var text3_4      = '' + Math.round(maxValue * 3 / 4);
    var text1_4Width = ctx.measureText(text1_4).width;
    var text2_4Width = ctx.measureText(text2_4).width;
    if (maxNum) { ctx.fillText(textMax, W * .75, W * .76); }
    if (minNum) { ctx.fillText('0', W * .225, W * .76); }
    if (outerNums) {
      ctx.fillText(text1_4, W * .17 - text1_4Width, W * .37);
      ctx.fillText(text2_4, W * .5 - text2_4Width/2, W * .143);
      ctx.fillText(text3_4, W * .825, W * .37);
    }
  }

  function updateCenterText(val) {
    ctx4.clearRect(0, 0, W, H);
    ctx4.fillStyle     = fontColor;
    var fontSize       = Math.round(W * .08);
    ctx4.font          = fontSize + 'px ' + font;
    var text           = '' + val;
    var text_width     = ctx4.measureText(text).width;
    ctx4.shadowColor   = "rgb(90,90,90)";
    ctx4.shadowBlur    = 1;
    ctx4.shadowOffsetX = 1;
    ctx4.shadowOffsetY = 1;    
    ctx4.fillText(text, W/2 - text_width/2, H/2 + .03 * W);
  }

  function updateUnit(unit) {
    var text      = '' + unit;
    var space     = W * .22;
    var maxSize   = Math.round(W * .1);
    ctx.font      = getGoodFontSize(ctx, text, space, font, maxSize);
    ctx.fillStyle = fontColor;
    var textWidth = ctx.measureText(text).width;
    ctx.fillText(text, W * .5 - textWidth/2, W * .5 + W * .2); // to center text
  }

  function getGoodFontSize(ctx, text, space, font, maxSize) {
    var fontSize  = maxSize;
    ctx.font      = fontSize + 'px ' + font;
    var textWidth = ctx.measureText(text).width;
    while (textWidth > space) {
      ctx.font      = fontSize + 'px ' + font;
      var textWidth = ctx.measureText(text).width;
      fontSize--
    }
    return font;
  }

  function setGauge(valForGauge, distance, val) {
    var time = 500; 
    time = time / (Math.abs(valForGauge - preValForGauge));
    if (distance != 0) {
      preValSteps = distance === valForGauge ? val / distance : Math.abs((val - preVal) / distance);
    } else {
      preValSteps = 0;
    }
    if (valForGauge > preValForGauge) {
      var animate = setInterval(function(){
        if (preValForGauge == valForGauge)
          clearInterval(animate);
        else {
          if (preValForGauge + 1 == valForGauge) {
            preVal = val;
          } else {
            preVal += preValSteps;
          }
          preValForGauge++;
          drawValueArc(preValForGauge);
          updateCenterText(Math.round(preVal));              
        }
      }, time);
    } else if (valForGauge < preValForGauge) {
      var animate2 = setInterval(function(){
        if (preValForGauge == valForGauge)
          clearInterval(animate2);
        else {
          if (preValForGauge - 1 == valForGauge) {
              preVal = val;
          } else {
              preVal -= preValSteps;
          }
          preValForGauge--;
          drawValueArc(preValForGauge);
          updateCenterText(Math.round(preVal)); 
        }
      }, time);
    } else if (valForGauge == 0 || valForGauge == preValForGauge) {
      preVal = val;
      updateCenterText(Math.round(val));
    }
  }
  function shadowMaker(context, radius, direction, color, size, width, location, offset) {
    var daColor, 
        alpha;
    if (color[0] == '#') {
      daColor = hex2rgb(color);
    } else {
      daColor = color; 
    }
    daColor = daColor.substring(daColor.indexOf('(') + 1);
    var colors = daColor.split(',');
    var r = parseInt(colors[0]);
    var g = parseInt(colors[1]);
    var b = parseInt(colors[2]);
    if (location == 'both' || location == 'outer' || location === undefined) {
      for(var x = size; x < width; x++) { // outerShadow
        alpha = 1 - (x / width);
        color = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
        context.beginPath();
        context.arc(cx, cy, radius + x, (startRadians + offset) * deg2rad, (endRadians + offset) * deg2rad, direction);
        context.strokeStyle = color;
        context.lineWidth = 1;
        context.stroke();
      }
    }
    if (location == 'both' || location == 'inner' || location === undefined) {
      for(var y = size; y < width; y++) { // innerShadow
        alpha = 1 - (y / width);
        color = 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
        context.beginPath();
        context.arc(cx, cy, radius - y, (startRadians + offset) * deg2rad, (endRadians + offset) * deg2rad, direction);
        context.strokeStyle = color;
        context.lineWidth = 1;
        context.stroke();
      }
    }
  }

  function hex2rgb(colour) {
    var r,g,b;
    if (colour.charAt(0) == '#') {
      colour = colour.substr(1);
    }
    if (colour.length == 3) {
      colour = colour.substr(0,1) + colour.substr(0,1) + colour.substr(1,2) + colour.substr(1,2) + colour.substr(2,3) + colour.substr(2,3);
    }
    r = parseInt(colour.charAt(0) + '' + colour.charAt(1), 16);
    g = parseInt(colour.charAt(2) + '' + colour.charAt(3), 16);
    b = parseInt(colour.charAt(4) + '' + colour.charAt(5), 16);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }

  function drawArc(ctx, radius, width, color, start, end) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, (startRadians + offset) * deg2rad, (end + offset) * deg2rad, false);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }

  function drawValueArc(val) {
    //drawArc(ctx2, W * .2185, W * 0.122, fillColor, startRadians, endRadians);
    drawArc(ctx2, W * .2185, W * 0.14 * innerSpace * 2.2, fillColor, startRadians, endRadians); // hacky, need better way to do innerSpace
    if (shadow2.size > .05 && shadow3.size > .05) {                                             // set meter fill to reduced width if shadows are large         
      drawArc(ctx2, W * .2185, W * .116 * arcWidth, arcColor, startRadians, val);
    } else {
      drawArc(ctx2, W * .2185, W * 0.14 * arcWidth, arcColor, startRadians, val);
    }
  }

  function radiantLine(centerX, centerY, innerTickRadius, outerTickRadius, degrees, linewidth, color) {
    var radians = degrees * Math.PI / 180;
    var innerX = centerX + innerTickRadius * Math.cos(radians);
    var innerY = centerY + innerTickRadius * Math.sin(radians);
    var outerX = centerX + outerTickRadius * Math.cos(radians);
    var outerY = centerY + outerTickRadius * Math.sin(radians);
    
    ctx.beginPath();
    ctx.moveTo(innerX, innerY);
    ctx.lineTo(outerX, outerY);
    ctx.strokeStyle = color;
    ctx.lineWidth = linewidth;
    ctx.stroke(); 
  }

  function scaletoRange(minActual, maxActual, minRange, maxRange, value) {
    return (maxRange - minRange) * (value - minRange) / (maxActual - minActual) + minRange;
  }

};