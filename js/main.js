/* Script by Abigail Gleason, 2020 */
(function(){

//pseudo-global variables
var attrArray = ["var1", "var2", "var3", "var4", "var5"]; //list of attributes
var expressed = attrArray[0]; //initial attribute
    
//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 473,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([463, 0])
    .domain([0, 110]);
    
//begin script when window loads
window.onload = setMap();
    
//set up choropleth map
function setMap(){
    
    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 473;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoConicConformalSpain()
//        .center([-11, 36])
//        .rotate([-2, 0, 0])
//        .parallels([43, 62])
        .scale(2000)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);
    
    //use queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/Lab2_data.csv") //load attributes from csv
        .defer(d3.json, "data/europe.topojson") //load background spatial data
        .defer(d3.json, "data/spain.topojson") //load spatial data
        .await(callback);
    
    function callback(error, csvData, europe, spain){    
    
        //translate spain TopoJSON
        var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries),
            spainProvinces = topojson.feature(spain, spain.objects.Spain_correct).features;
        
         //join csv data to GeoJSON enumeration units
        spainProvinces = joinData(spainProvinces, csvData);

        //add Europe countries to map
        var countries = map.append("path")
            .datum(europeCountries)
            .attr("class", "countries")
            .attr("d", path);
        
        var mapBackground = map.append("path")
            .attr("class", "mapBackground"); //assign class for styling
        
        //create the color scale
        var colorScale = makeColorScale(csvData);

        //add enumeration units to the map
        setEnumerationUnits(spainProvinces, map, path, colorScale);
        
        //add coordinated visualization to the map
        setChart(csvData, colorScale);
        
        createDropdown(csvData);
        
    };

};
    
function joinData(spainProvinces, csvData){
        //variables for data join
        var attrArray = ["var1", "var2", "var3", "var4", "var5"];

        //loop through csv to assign each set of csv attribute values to geojson region
        for (var i=0; i<csvData.length; i++){
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.adm1_code; //the CSV primary key
            
            //loop through geojson regions to find correct region
            for (var a=0; a<spainProvinces.length; a++){

                var geojsonProps = spainProvinces[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.adm1_code; //the geojson primary key
                
                //where primary keys match, transfer csv data to geojson properties object
                if (geojsonKey == csvKey){
                   
                    //assign all attributes and values
                    attrArray.forEach(function(attr){
                        var val = parseFloat(csvRegion[attr]); //get csv attribute value
                        geojsonProps[attr] = val; //assign attribute and value to geojson properties
                    });
                };
            };
        };
    return spainProvinces;
};

function setEnumerationUnits(spainProvinces, map, path, colorScale){
    //add Spain provinces to map
        var regions = map.selectAll(".regions")
            .data(spainProvinces)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "regions " + d.properties.adm1_code;
            })
            .attr("d", path)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale);

            })
            .on("mouseover", function(d){
            highlight(d.properties);
            })
            .on("mouseout", function(d){
                dehighlight(d.properties);
            })
            .on("mousemove", moveLabel);
  
        var desc = regions.append("desc")
            .text('{"stroke": "#000", "stroke-width": "0.5px"}');


};
    
//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#edf8fb",
        "#b2e2e2",
        "#66c2a4",
        "#2ca25f",
        "#006d2c"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var csvRegion = data[i];
        var val = parseFloat(csvRegion[expressed]);
        domainArray.push(val);
    };

    //assign array of expressed values as scale domain
    colorScale.domain(domainArray);

    return colorScale;
};
    
//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};
    
//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("body")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");

    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 100]);

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed]-a[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.adm1_code;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
         .on("mousemove", moveLabel);
    
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Number of Variable " + expressed[3] + " in each region");

    //create vertical axis generator
    var yAxis = d3.axisLeft(yScale)
        .scale(yScale);

    //place axis
    var axis = chart.append("g")
        .attr("class", "axis")
        .attr("transform", translate)
        .call(yAxis);

    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    
    //set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale);
};
    
//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("body")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Attribute");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d });
};
    
//dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var regions = d3.selectAll(".regions")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });
    
    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);

    updateChart(bars, csvData.length, colorScale);
};
    
//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale){
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
        
    var chartTitle = d3.select(".chartTitle")
        .text("Number of Variable " + expressed[3] + " in each region");
};
    
//function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.adm1_code)
        .style("stroke", "blue")
        .style("stroke-width", "2");
    
    setLabel(props)
};
    
//function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.adm1_code)
        .style("stroke", function(){
            return getStyle(this, "stroke")
        })
        .style("stroke-width", function(){
            return getStyle(this, "stroke-width")
        });

    function getStyle(element, styleName){
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    };
    
    d3.select(".infolabel")
        .remove();
};
    
//function to create dynamic label
function setLabel(props){
    //label content
    var labelAttribute = "<h1>" + props[expressed] +
        "</h1><b>" + expressed + "</b>";

    //create info label div
    var infolabel = d3.select("body")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.adm1_code + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.name);
};
    
//function to move info label with mouse
function moveLabel(){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};
    
function createLegend(props){
    // define legend
    var legend = svg.select("body")
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });

    // adding colored squares to legend
    legend.append('rect') // append rectangle squares to legend                                   
      .attr('width', legendRectSize) // width of rect size is defined above                        
      .attr('height', legendRectSize) // height of rect size is defined above                      
      .style('fill', color) // each fill is passed a color
      .style('stroke', color) // each stroke is passed a color
    }
    
})();

//collapsible content
var accordion = document.getElementsByClassName("accordion");
var i;

for (i = 0; i < accordion.length; i++) {
  accordion[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var panel = this.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + "px";
    }
  });
}

////execute script when window is loaded
//window.onload = function(){
//
//   //SVG dimension variables
//    var w = 900, h = 500;
//
//     //Example 1.2 line 1...container block
//    var container = d3.select("body") //get the <body> element from the DOM
//        .append("svg") //put a new svg in the body
//        .attr("width", w) //assign the width
//        .attr("height", h) //assign the height
//        .attr("class", "container") //always assign a class (as the block name) for styling and future selection
//        .style("background-color", "rgba(0,0,0,0.2)"); //only put a semicolon at the end of the block!
//    
//    //innerRect block
//    var innerRect = container.append("rect")
//        .datum(400) //a single value is a DATUM
//        .attr("width", function(d){ //rectangle width
//            return d * 2; //400 * 2 = 800
//        })
//        .attr("height", function(d){ //rectangle height
//            return d; //400
//        })
//        .attr("class", "innerRect") //class name
//        .attr("x", 50) //position from left on the x (horizontal) axis
//        .attr("y", 50) //position from top on the y (vertical) axis
//        .style("fill", "#FFFFFF"); //fill color
//    
//    var dataArray = [10, 20, 30, 40, 50];
//
//     var cityPop = [
//        { 
//            city: 'Madison',
//            population: 233209
//        },
//        {
//            city: 'Milwaukee',
//            population: 594833
//        },
//        {
//            city: 'Green Bay',
//            population: 104057
//        },
//        {
//            city: 'Superior',
//            population: 27244
//        }
//    ];
//    var x = d3.scaleLinear()  //create the scale
//        .range([90, 810]) //output min and max
//        .domain([0, 3]); //input min and max
//    
//    var minPop = d3.min(cityPop, function(d){
//        return d.population;
//    });
//
//    //find the maximum value of the array
//    var maxPop = d3.max(cityPop, function(d){
//        return d.population;
//    });
//
//    //scale for circles center y coordinate
//    var y = d3.scaleLinear()
//        .range([450, 50])
//        .domain([0, 700000]);
//    
//     //color scale generator 
//    var color = d3.scaleLinear()
//        .range([
//            "#FDBE85",
//            "#D94701"
//        ])
//        .domain([
//            minPop, 
//            maxPop
//        ]);
//
//    //Example 2.6 line 3
//    var circles = container.selectAll(".circles") //create an empty selection
//        .data(cityPop) //here we feed in an array
//        .enter() //one of the great mysteries of the universe
//        .append("circle") //inspect the HTML--holy crap, there's some circles there
//        .attr("class", "circles")
//        .attr("id", function(d){
//            return d.city;
//        })
//        .attr("r", function(d){
//            //calculate the radius based on population value as circle area
//            var area = d.population * 0.01;
//            return Math.sqrt(area/Math.PI);
//        })
//        .attr("cx", function(d, i){
//            //use the scale generator with the index to place each circle horizontally
//            return x(i);
//        })
//       .attr("cy", function(d){
//            return y(d.population);
//        })
//        .style("fill", function(d, i){ //add a fill based on the color scale generator
//            return color(d.population);
//        })
//        .style("stroke", "#000"); //black circle stroke
//    
//        var yAxis = d3.axisLeft(y)
//            .scale(y);
//    
//         //create axis g element and add axis
//        var axis = container.append("g")
//            .attr("class", "axis")
//            .attr("transform", "translate(50, 0)")
//            .call(yAxis);   
//    
//        var title = container.append("text")
//        .attr("class", "title")
//        .attr("text-anchor", "middle")
//        .attr("x", 450)
//        .attr("y", 30)
//        .text("City Populations");
//    
//         var labels = container.selectAll(".labels")
//        .data(cityPop)
//        .enter()
//        .append("text")
//        .attr("class", "labels")
//        .attr("text-anchor", "left")
//        .attr("y", function(d){
//            //vertical position centered on each circle
//            return y(d.population) - 1;
//        });
//
//        //first line of label
//        var nameLine = labels.append("tspan")
//            .attr("class", "nameLine")
//            .attr("x", function(d,i){
//                //horizontal position to the right of each circle
//                return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 2;
//            })
//            .text(function(d){
//                return d.city;
//            });
//
//        //create format generator
//        var format = d3.format(",");
//
//        //second line of label
//        var popLine = labels.append("tspan")
//            .attr("class", "popLine")
//            .attr("x", function(d,i){
//                return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 2;
//            })
//            .attr("dy", "15") //vertical offset
//            .text(function(d){
//                return "Pop. " + format(d.population); //use format generator to format numbers
//            });
//};