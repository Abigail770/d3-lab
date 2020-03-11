/* Script by Abigail Gleason, 2020 */
(function(){

//pseudo-global variables
var attrArray = ["varA", "varB", "varC", "varD", "varE"]; //list of attributes
var expressed = attrArray[0]; //initial attribute
    
//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    
    //map frame dimensions
    var width = 960,
        height = 650;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([-11, 38])
        .rotate([-2, 0, 0])
        .parallels([43, 62])
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
        
        //place graticule on the map
        setGraticule(map, path);    
    
        //translate spain TopoJSON
        var europeCountries = topojson.feature(europe, europe.objects.EuropeCountries),
            spainProvinces = topojson.feature(spain, spain.objects.Spain).features;
        
         //join csv data to GeoJSON enumeration units
        spainProvinces = joinData(spainProvinces, csvData);

        //add Europe countries to map
        var countries = map.append("path")
            .datum(europeCountries)
            .attr("class", "countries")
            .attr("d", path);
        
        //create the color scale
        var colorScale = makeColorScale(csvData);

        //add enumeration units to the map
        setEnumerationUnits(spainProvinces, map, path, colorScale);

    };

};
    
function setGraticule(map, path){
    
    //create graticule generator
    var graticule = d3.geoGraticule()
        .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

     //create graticule background
    var gratBackground = map.append("path")
        .datum(graticule.outline()) //bind graticule background
        .attr("class", "gratBackground") //assign class for styling
        .attr("d", path) //project graticule

    //create graticule lines
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
        .data(graticule.lines()) //bind graticule lines to each element to be created
        .enter() //create an element for each datum
        .append("path") //append each element to the svg as a path element
        .attr("class", "gratLines") //assign class for styling
        .attr("d", path); //project graticule lines
        
};

function joinData(spainProvinces, csvData){
   
    //variables for data join
        var attrArray = ["varA", "varB", "varC", "varD", "varE"];

        //loop through csv to assign each set of csv attribute values to geojson region
        for (var i=0; i<csvData.length; i++){
            var csvRegion = csvData[i]; //the current region
            var csvKey = csvRegion.adm1_code; //the CSV primary key
            console.log(csvRegion)
            //loop through geojson regions to find correct region
            for (var a=0; a<spainProvinces.length; a++){

                var geojsonProps = spainProvinces[a].properties; //the current region geojson properties
                var geojsonKey = geojsonProps.adm1_code; //the geojson primary key
                console.log(geojsonKey)
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
            });
};
    
//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
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
    
})();

//execute script when window is loaded
window.onload = function(){

   //SVG dimension variables
    var w = 900, h = 500;

     //Example 1.2 line 1...container block
    var container = d3.select("body") //get the <body> element from the DOM
        .append("svg") //put a new svg in the body
        .attr("width", w) //assign the width
        .attr("height", h) //assign the height
        .attr("class", "container") //always assign a class (as the block name) for styling and future selection
        .style("background-color", "rgba(0,0,0,0.2)"); //only put a semicolon at the end of the block!
    
    //innerRect block
    var innerRect = container.append("rect")
        .datum(400) //a single value is a DATUM
        .attr("width", function(d){ //rectangle width
            return d * 2; //400 * 2 = 800
        })
        .attr("height", function(d){ //rectangle height
            return d; //400
        })
        .attr("class", "innerRect") //class name
        .attr("x", 50) //position from left on the x (horizontal) axis
        .attr("y", 50) //position from top on the y (vertical) axis
        .style("fill", "#FFFFFF"); //fill color
    
    var dataArray = [10, 20, 30, 40, 50];

     var cityPop = [
        { 
            city: 'Madison',
            population: 233209
        },
        {
            city: 'Milwaukee',
            population: 594833
        },
        {
            city: 'Green Bay',
            population: 104057
        },
        {
            city: 'Superior',
            population: 27244
        }
    ];
    var x = d3.scaleLinear()  //create the scale
        .range([90, 810]) //output min and max
        .domain([0, 3]); //input min and max
    
    var minPop = d3.min(cityPop, function(d){
        return d.population;
    });

    //find the maximum value of the array
    var maxPop = d3.max(cityPop, function(d){
        return d.population;
    });

    //scale for circles center y coordinate
    var y = d3.scaleLinear()
        .range([450, 50])
        .domain([0, 700000]);
    
     //color scale generator 
    var color = d3.scaleLinear()
        .range([
            "#FDBE85",
            "#D94701"
        ])
        .domain([
            minPop, 
            maxPop
        ]);

    //Example 2.6 line 3
    var circles = container.selectAll(".circles") //create an empty selection
        .data(cityPop) //here we feed in an array
        .enter() //one of the great mysteries of the universe
        .append("circle") //inspect the HTML--holy crap, there's some circles there
        .attr("class", "circles")
        .attr("id", function(d){
            return d.city;
        })
        .attr("r", function(d){
            //calculate the radius based on population value as circle area
            var area = d.population * 0.01;
            return Math.sqrt(area/Math.PI);
        })
        .attr("cx", function(d, i){
            //use the scale generator with the index to place each circle horizontally
            return x(i);
        })
       .attr("cy", function(d){
            return y(d.population);
        })
        .style("fill", function(d, i){ //add a fill based on the color scale generator
            return color(d.population);
        })
        .style("stroke", "#000"); //black circle stroke
    
        var yAxis = d3.axisLeft(y)
            .scale(y);
    
         //create axis g element and add axis
        var axis = container.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(50, 0)")
            .call(yAxis);   
    
        var title = container.append("text")
        .attr("class", "title")
        .attr("text-anchor", "middle")
        .attr("x", 450)
        .attr("y", 30)
        .text("City Populations");
    
         var labels = container.selectAll(".labels")
        .data(cityPop)
        .enter()
        .append("text")
        .attr("class", "labels")
        .attr("text-anchor", "left")
        .attr("y", function(d){
            //vertical position centered on each circle
            return y(d.population) - 1;
        });

        //first line of label
        var nameLine = labels.append("tspan")
            .attr("class", "nameLine")
            .attr("x", function(d,i){
                //horizontal position to the right of each circle
                return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 2;
            })
            .text(function(d){
                return d.city;
            });

        //create format generator
        var format = d3.format(",");

        //second line of label
        var popLine = labels.append("tspan")
            .attr("class", "popLine")
            .attr("x", function(d,i){
                return x(i) + Math.sqrt(d.population * 0.01 / Math.PI) + 2;
            })
            .attr("dy", "15") //vertical offset
            .text(function(d){
                return "Pop. " + format(d.population); //use format generator to format numbers
            });
};