// First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

    //pseudo-global variables
    var attrArray = ["PTPER2018", "PTPER2019", "PTPER2020", "PTPER2021", "PTPER2022"]; //list of attributes
    var expressed = attrArray[0]; //initial attribute

    // begin script when window loads
    window.onload = setMap();

    // chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 473,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    // create a scale to size bars proportionally to frame and for axis
    var yScale = d3.scaleLinear()
        .range([463, 0])
        .domain([0, 14.5]);

    // Example 1.3 line 4...set up choropleth map
    function setMap() {
        // map frame dimensions
        var width = window.innerWidth * 0.5,
            height = 460;

        // create new svg container for the map
        var map = d3.select("body")
            .append("svg")
            .attr("class", "map")
            .attr("width", width)
            .attr("height", height);

        // Example 2.1 line 15...create Albers equal area conic projection centered on France
        var projection = d3.geoAlbers()
            .center([5, 42.5]) // Center latitude for Chicago
            .parallels([35, 45])
            .scale(1800)
            .translate([width / 2, height / 2]);

        var path = d3.geoPath()
            .projection(projection);

        // use Promise.all to parallelize asynchronous data loading
        var promises = [];
        promises.push(d3.csv("data/metro_lab2_csv.csv")); // load attributes from csv
        promises.push(d3.json("data/statepolyg.topojson")); // load choropleth spatial data
        promises.push(d3.json("data/metropolyg.topojson")); // load background spatial data
        Promise.all(promises).then(callback);

        function callback(data) {
            csvData = data[0], states = data[1], metros = data[2];

            setGraticule(map, path);

            // translate europe TopoJSON
            var newstatepolys = topojson.feature(states, states.objects.statepolyg),
                newmetropolys = topojson.feature(metros, metros.objects.metropolyg).features;

            // add Europe countries to map
            var states = map.append("path")
                .datum(newstatepolys)
                .attr("class", "states")
                .attr("d", path);

            // join csv data to GeoJSON enumeration units
            newmetropolys = joinData(newmetropolys, csvData)

            // create the color scale
            var colorScale = makeColorScale(csvData);

            setEnumerationUnits(newmetropolys, map, path, colorScale);

            // add coordinated visualization to the map
            setChart(csvData, colorScale);

            createDropdown(csvData);

            setLabel();
        };
    }; // end of setMap()

    function setGraticule(map, path) {
        // Example 2.6 line 1...create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); // place graticule lines every 5 degrees of longitude and latitude

        // create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) // bind graticule background
            .attr("class", "gratBackground") // assign class for styling
            .attr("d", path); // project graticule

        // Example 2.6 line 5...create graticule lines
        var gratLines = map.selectAll(".gratLines") // select graticule elements that will be created
            .data(graticule.lines()) // bind graticule lines to each element to be created
            .enter() // create an element for each datum
            .append("path") // append each element to the svg as a path element
            .attr("class", "gratLines") // assign class for styling
            .attr("d", path); // project graticule lines
    };

    function joinData(newmetropolys, csvData) {
        // variables for data join
        var attrArray = ["PTPER2018", "PTPER2019", "PTPER2020", "PTPER2021", "PTPER2022"];

        // loop through csv to assign each set of csv attribute values to geojson region
       
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
                return colorScale(value);            
            } else {                
                return "#ccc";            
            }       
         })
         .on("mouseover", function(event, d) {
            highlight(d.properties);
            setLabel(d.properties); // Pass the properties object to setLabel
        })
        
        .on("mouseout", function(event, d){
            dehighlight(d.properties);
        })
        .on("mousemove", moveLabel);

    var desc = metros.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
};

//function to reset the element style on mouseout
function dehighlight(props) {
    var selected = d3.selectAll(".metros")
        .filter(function(d) {
            return d.properties.GEOID;
        })
        .style("stroke", function() {
            return getStyle(this, "stroke");
        })
        .style("stroke-width", function() {
            return getStyle(this, "stroke-width");
        });

    function getStyle(element, styleName) {
        var styleText = d3.select(element)
            .select("desc")
            .text();

        var styleObject = JSON.parse(styleText);

        return styleObject[styleName];
    }

    d3.select(".infolabel")
    .remove();
};


function updateChart(bars, n, colorScale) {
    bars
        .attr("width", chartInnerWidth / n - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
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
};

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

//Example 1.4 line 14...dropdown change event handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var metros = d3.selectAll(".metros")
    .transition()
    .duration(1000)
    .style("fill", function(d){            
        var value = d.properties[expressed];            
        if(value) {                
            return colorScale(value);           
        } else {                
            return "#ccc";            
        }    
});

//Sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
    //Sort bars
    .sort(function(a, b){
        return b[expressed] - a[expressed];
    })
    .transition() //add animation
    .delay(function(d, i){
        return i * 20
    })
    .duration(500);

updateChart(bars, csvData.length, colorScale);
}; //end of changeAttribute()

//function to create coordinated bar chart
function setChart(csvData, colorScale) {
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

// Set bars for each province
var bars = chart.selectAll(".bar")
    .data(csvData)
    .enter()
    .append("rect")
    .sort(function(a, b) {
        return b[expressed] - a[expressed];
    })
    .attr("class", function(d) {
        return "bar " + d.GEOID;
    })
    .attr("width", chartInnerWidth / csvData.length - 1)
    .on("mouseover", function(event, d) {
        highlight(d);
        setLabel(d); // Pass the data object to setLabel
    })
    .on("mouseout", function(event, d) {
        dehighlight(d);
    })
    .on("mousemove", moveLabel);

    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');

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

    //set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale);
}; //end of setChart()


//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
       "#f1eef6",
        "#d4b9da",
        "#c994c7",
        "#df65b0",
        "#dd1c77",
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

function highlight(props){
    // Change stroke
    var selected = d3.selectAll(".metros")
        .filter(function(d) {
            return d.properties.GEOID === props.GEOID;
        })
        .style("stroke", "blue")
        .style("stroke-width", "2");
};

//function to create dynamic label
function setLabel(props) {
    if (props) { // Check if props is defined
        // label content
        var labelAttribute = "<h1>" + props[expressed] +
            "</h1><b>" + expressed + "</b>" +
            "<br><span>" + props.NAME + "</span>"; // Append city name

        // create info label div
        var infolabel = d3.select("body")
            .append("div")
            .attr("class", "infolabel")
            .attr("id", props.GEOID + "_label")
            .html(labelAttribute);
    }
};

function moveLabel(event){
    //get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = event.clientX + 10,
        y1 = event.clientY - 75,
        x2 = event.clientX - labelWidth - 10,
        y2 = event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};


})(); //last line of main.js