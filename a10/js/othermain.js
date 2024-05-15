//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

    //pseudo-global variables
    var attrArray = ["PTPER2018", "PTPER2019", "PTPER2020", "PTPER2021", "PTPER2022"]; //list of attributes
    var expressed = attrArray[0]; //initial attribute
    
    //begin script when window loads
    window.onload = setMap();

//Example 1.3 line 4...set up choropleth map
function setMap(){

    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //Example 2.1 line 15...create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([5, 42.5])  // Center latitude for Chicago
        .parallels([35, 45])
        .scale(1800)
        .translate([width / 2, height / 2]);

    var path = d3.geoPath()
        .projection(projection);


        var path = d3.geoPath()
    .projection(projection);

        //use Promise.all to parallelize asynchronous data loading
        var promises = [];    
        promises.push(d3.csv("data/metro_lab2_csv.csv")); //load attributes from csv    
        promises.push(d3.json("data/statepolyg.topojson")); //load choropleth spatial data    
        promises.push(d3.json("data/metropolyg.topojson")); //load background spatial data    
        Promise.all(promises).then(callback);

        function callback(data){    
            csvData = data[0], states = data[1], metros = data[2];

            setGraticule(map, path);

            //translate europe TopoJSON
            var newstatepolys = topojson.feature(states, states.objects.statepolyg),
                newmetropolys = topojson.feature(metros, metros.objects.metropolyg).features;
            
            //add Europe countries to map
            var states = map.append("path")
                .datum(newstatepolys)
                .attr("class", "states")
                .attr("d", path);

            //join csv data to GeoJSON enumeration units
            newmetropolys = joinData(newmetropolys, csvData)

            //create the color scale
            var colorScale = makeColorScale(csvData);
            
            setEnumerationUnits(newmetropolys, map, path, colorScale);

            //add coordinated visualization to the map
            setChart(csvData, colorScale);


    };
}; //end of setMap()

function setGraticule(map, path){
    //Example 2.6 line 1...create graticule generator
        var graticule = d3.geoGraticule()
        .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

    //create graticule background
    var gratBackground = map.append("path")
        .datum(graticule.outline()) //bind graticule background
        .attr("class", "gratBackground") //assign class for styling
        .attr("d", path) //project graticule

    //Example 2.6 line 5...create graticule lines
    var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
        .data(graticule.lines()) //bind graticule lines to each element to be created
        .enter() //create an element for each datum
        .append("path") //append each element to the svg as a path element
        .attr("class", "gratLines") //assign class for styling
        .attr("d", path); //project graticule lines
};

function joinData(newmetropolys, csvData){
    //variables for data join
    var attrArray = ["PTPER2018", "PTPER2019", "PTPER2020", "PTPER2021", "PTPER2022"];

    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.GEOID; //the CSV primary key

        //loop through geojson regions to find correct region
        for (var a=0; a<newmetropolys.length; a++){

            var geojsonProps = newmetropolys[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.GEOID; //the geojson primary key

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

    return newmetropolys;

};

function setEnumerationUnits(newmetropolys, map, path, colorScale){
    //add France regions to map
    var metros = map.selectAll(".metros")
        .data(newmetropolys)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "metros " + d.properties.GEOID;
        })
        .attr("d", path)
        .style("fill", function(d){            
            var value = d.properties[expressed];            
            if(value) {                
                return colorScale(d.properties[expressed]);            
            } else {                
                return "#ccc";            
            }    
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

    //create color scale generator - QUANTILE
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

// //function to create coordinated bar chart
// function setChart(csvData, colorScale){
//     //chart frame dimensions
//     var chartWidth = window.innerWidth * 0.425,
//         chartHeight = 460;
        
//         var chart = d3.select("body")
//         .append("svg")
//         .attr("width", chartWidth)
//         .attr("height", chartHeight)
//         .attr("class", "chart");

//     //create a scale to size bars proportionally to frame
//     var yScale = d3.scaleLinear()
//         .range([0, chartHeight])
//         .domain([0, 105]);

//     //Example 2.4 line 8...set bars for each province
//     var bars = chart.selectAll(".bars")
//         .data(csvData)
//         .enter()
//         .append("rect")
//         .sort(function(a, b){
//             return a[expressed]-b[expressed]
//         })
//         .attr("class", function(d){
//             return "bars " + d.GEOID;
//         })
//         .attr("width", chartWidth / csvData.length - 1)
//         .attr("x", function(d, i){
//             return i * (chartWidth / csvData.length);
//         })
//         .attr("height", function(d){
//             return yScale(parseFloat(d[expressed]));
//         })
//         .attr("y", function(d){
//             return chartHeight - yScale(parseFloat(d[expressed]));
//         })
//         .style("fill", function(d){
//             return colorScale(d[expressed]);
//         });

//             //annotate bars with attribute value text
//         var numbers = chart.selectAll(".numbers")
//         .data(csvData)
//         .enter()
//         .append("text")
//         .sort(function(a, b){
//             return a[expressed]-b[expressed]
//         })
//         .attr("class", function(d){
//             return "numbers " + d.GEOID;
//         })
//         .attr("text-anchor", "middle")
//         .attr("x", function(d, i){
//             var fraction = chartWidth / csvData.length;
//             return i * fraction + (fraction - 1) / 2;
//         })
//         .attr("y", function(d){
//             return chartHeight - yScale(parseFloat(d[expressed])) + 15;
//         })
//         .text(function(d){
//             return d[expressed];
//         });

//     //below Example 2.8...create a text element for the chart title
//     var chartTitle = chart.append("text")
//         .attr("x", 20)
//         .attr("y", 40)
//         .attr("class", "chartTitle")
//         .text("Percent of population using public transit (" + expressed + ") in each metro area");
// };

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

    //calculate the maximum value in the data
    var maxValue = d3.max(csvData, function(d) { return parseFloat(d[expressed]); });

    //create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([chartInnerHeight, 0])
        .domain([0, maxValue + (maxValue * 0.2)]); // add a bit of padding to the max value

    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .attr("class", function(d){
            return "bar " + d.GEOID;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        .attr("height", function(d, i){
            return chartInnerHeight - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        .style("fill", function(d){
            return colorScale(d[expressed]);
        });

    //create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Percent of commuters using public transit in each metro area");

    //create vertical axis generator
    var yAxis = d3.axisLeft()
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
};


//     //create color scale generator - NATURAL BREAKS
//     var colorScale = d3.scaleThreshold()
//         .range(colorClasses);

//     //build array of all values of the expressed attribute
//     var domainArray = [];
//     for (var i=0; i<data.length; i++){
//         var val = parseFloat(data[i][expressed]);
//         domainArray.push(val);
//     };

//     //cluster data using ckmeans clustering algorithm to create natural breaks
//     var clusters = ss.ckmeans(domainArray, 5);
//     //reset domain array to cluster minimums
//     domainArray = clusters.map(function(d){
//         return d3.min(d);
//     });
//     //remove first value from domain array to create class breakpoints
//     domainArray.shift();

//     //assign array of last 4 cluster minimums as domain
//     colorScale.domain(domainArray);

//     return colorScale;
// };

})(); //last line of main.js