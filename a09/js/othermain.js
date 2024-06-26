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
        promises.push(d3.json("data/statepolys.topojson")); //load choropleth spatial data    
        promises.push(d3.json("data/metropolys.topojson")); //load background spatial data    
        Promise.all(promises).then(callback);

        function callback(data){    
            csvData = data[0];    
            metros = data[2];    
            states = data[1];
            console.log(csvData);
            console.log(metros);
            console.log(states);    

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

             //translate europe TopoJSON
            var newstatepolys = topojson.feature(states, states.objects.statepolys),
            newmetropolys = topojson.feature(metros, metros.objects.metropolys).features;

            //add Europe countries to map
            var states = map.append("path")
                .datum(newstatepolys)
                .attr("class", "states")
                .attr("d", path);

            //add France regions to map
            var metros = map.selectAll(".metros")
                .data(newmetropolys)
                .enter()
                .append("path")
                .attr("class", function(d){
                    return "metros " + d.properties.GEOID;
                })
                .attr("d", path);

                console.log(metros)


};

};