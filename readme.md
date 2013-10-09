#cGauge

Introducing yet another canvas gauge plugin! 

## Usage

###Conventional Implimentation

    var options1 = {
        node: document.getElementById('gauge1'),
        unit: 'zBwas',
        value: 71,
        outerNums: false
    }

    var gauge1 = new cGauge(options1);

###jQuery Implimentation

var options2 = {
    unit: 'Bananas',
    value: 17,
    maxValue: 50
}

var gauge2 = $('#gauge2').cGauge(options2);

## Options

There are many options to mess with in cGauge, here is a list of all of them along with the default values.

    var defaultOptions = {
      unit      : '',
      value     : 0,
      maxValue  : 100,                          // actually defaults to function findGoodMax(value);
      arcColor  : '#27AE60',
      arcWidth  : 1,
      font      : 'sans-serif',
      fillColor : 'rgb(230, 230, 230)',
      fontColor : 'rgb(80, 80, 80)',
      tickColor : 'rgb(80,80,80)',
      outerSpace: 0.4,
      innerSpace: 0.4,
      ticks     : 40,                           // If not evenly divisible by 4, long ticks will be omitted.
      outerNums : true,
      minNum    : true,
      maxNum    : true,
      shadow1: {                                // Shadows are ordered 1-4 from outermost to innermost,
        size : .15,
        color: 'rgb(155, 155, 155)'             // Must be rgb or hex code, css color-names will not work.             
      },
      shadow2: {
        size : .15,
        color: 'rgb(155, 155, 155)'
      },
      shadow3: {
        size : .15,
        color: 'rgb(155, 155, 155)'
      },
      shadow4: {
        size : .15,
        color: 'rgb(155, 155, 155)'                 
      }
    }

