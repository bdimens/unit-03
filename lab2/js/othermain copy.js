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
    var width = 960,
        height = 460;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //Example 2.1 line 15...create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([0, 41.8781])  // Center latitude for Chicago
        .parallels([35, 45])
        .scale(1000)
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
            newmetropolys = joinData(newmetropolys, csvData);


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

function setEnumerationUnits(newmetropolys, map, path){
    //add France regions to map
    var metros = map.selectAll(".metros")
        .data(newmetropolys)
        .enter()
        .append("path")
        .attr("class", function(d){
            return "metros" + d.properties.GEOID;
        })
        .attr("d", path);

        console.log(metros)
};

//         //Example 2.6 line 1...create graticule generator
//         var graticule = d3.geoGraticule()
//             .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude

//         //create graticule background
//         var gratBackground = map.append("path")
//             .datum(graticule.outline()) //bind graticule background
//             .attr("class", "gratBackground") //assign class for styling
//             .attr("d", path) //project graticule

//         //Example 2.6 line 5...create graticule lines
//         var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
//             .data(graticule.lines()) //bind graticule lines to each element to be created
//             .enter() //create an element for each datum
//             .append("path") //append each element to the svg as a path element
//             .attr("class", "gratLines") //assign class for styling
//             .attr("d", path); //project graticule lines

//              //translate europe TopoJSON
//             var newstatepolys = topojson.feature(states, states.objects.statepolyg),
//             newmetropolys = topojson.feature(metros, metros.objects.metropolyg).features;

//               //variables for data join
//             var attrArray = ["PTPER2018", "PTPER2019", "PTPER2020", "PTPER2021", "PTPER2022"];

//             //loop through csv to assign each set of csv attribute values to geojson region
//             for (var i=0; i<csvData.length; i++){
//                 var csvRegion = csvData[i]; //the current region
//                 var csvKey = csvRegion.GEOID; //the CSV primary key

//                 //loop through geojson regions to find correct region
//                 for (var a=0; a<newmetropolys.length; a++){

//                     var geojsonProps = newmetropolys[a].properties; //the current region geojson properties
//                     var geojsonKey = geojsonProps.GEOID; //the geojson primary key

//                     //where primary keys match, transfer csv data to geojson properties object
//                     if (geojsonKey == csvKey){

//                         //assign all attributes and values
//                         attrArray.forEach(function(attr){
//                             var val = parseFloat(csvRegion[attr]); //get csv attribute value
//                             geojsonProps[attr] = val; //assign attribute and value to geojson properties
//                         });
//                     };
//                 };
//             };
            
//             console.log(newmetropolys)

//             //add Europe countries to map
//             var states = map.append("path")
//                 .datum(newstatepolys)
//                 .attr("class", "states")
//                 .attr("d", path);

//             //add France regions to map
//             var metros = map.selectAll(".metros")
//                 .data(newmetropolys)
//                 .enter()
//                 .append("path")
//                 .attr("class", function(d){
//                     return "metros " + d.properties.GEOID;
//                 })
//                 .attr("d", path);

//                 console.log(metros)


// };

// };

})(); //last line of main.js