// import Geohash from "https://cdn.jsdelivr.net/npm/latlon-geohash@2.0.0";
// const geohash2 = Geohash.encode(52.20, 0.12, 6);
// console.log(geohash2);
// Global Variables
// Morgan Gautho
var isLocal = false;


function ShowHideDiv(checkValue) {
    var locationDiv = document.getElementById("location");
    locationDiv.style.display = checkValue.checked ? "none" : "block";
    if(checkValue.checked) {
        locationDiv.setAttribute('disabled', true);
    }
    else {
        locationDiv.removeAttribute('disabled');
    }
}

	
function searchButton() {
    resetResults();
    if(!document.getElementById('form1').reportValidity()) {
        console.log("test");
        return "invalid";
    }
    var keyword = document.getElementById("keyword");
    var distance = document.getElementById("distance");
    var cat = document.getElementById("category");
    var location = document.getElementById("location");
    var autolocation = document.getElementById("autolocation");
    var geohash = "";
    if (distance.value.length == 0)
    { 
        distance = 10;
    }
    else {
        distance = distance.value;
    }
    if (autolocation.checked) {
        // Get IP address location info
        this.getIPinfo().then((obj) => {
            const latLong = obj.split(",");
            let lat = latLong[0];
            let long = latLong[1];
            geohash = getGeohash(lat, long);
            callEventSearch(keyword.value, distance, geohash, cat.value);
        })
        .catch(error=> {
            console.log(error)
            })
    }
    else {
        this.getGoogleLocation(location.value).then(
            (obj) => {
                console.log(obj);
                if(obj == "invalid") {
                    document.getElementById('noRecords').style.display = "block";
                    document.getElementById('results').style.display = "flex";
                    return;
                }
                geohash = obj;
                callEventSearch(keyword.value, distance, geohash, cat.value);
            }
        )
    }



    return "test";
}


function getIPinfo() {
    let obj = "";
    const TOKEN = "REDACTED";
    return fetch('https://ipinfo.io/?token=' + TOKEN)
  .then((response) => response.json())
  .then(data => {
    obj = data.loc;
    return obj;
    })
    .catch(error=> {
        console.log(error)
        });
}

function getGeohash(lat, long) {
    const GEO_PRECISION = 7;
    console.log(lat +" "+ long + " geohash: " + encode(lat, long, GEO_PRECISION));
    return encode(lat, long, GEO_PRECISION);
}

function getGoogleLocation(location) {
    const TOKEN = "REDACTED";
    const BASE_URL = "https://maps.googleapis.com/maps/api/geocode/json?address=";
    let url = BASE_URL+concatTerms(location) + "&key=" + TOKEN;
    console.log(url);
    return fetch(url)
  .then((response) => response.json())
  .then((data) => {
        if(data["status"] == "ZERO_RESULTS") {
            return "invalid";
        }
        let lat = data["results"][0]["geometry"]["location"]["lat"];
        let long = data["results"][0]["geometry"]["location"]["lng"];
        return getGeohash(lat, long);
    })
    .catch(error=> {
        console.log(error)
        })
}

function concatTerms(input) {
    const terms = input.split(" ");
    return terms.join("+");
}

function callEventSearch(keyword, distance, geohash, cat) {
    var serverUrl;
    if(isLocal) {
        serverUrl = "http://127.0.0.1:8080/searchEvents?"; //URL for python server eventSearch function
    }
    else {
        serverUrl = "https://mg-hw6.wn.r.appspot.com/searchEvents?"; //URL for python server eventSearch function
    }
    
    let params = ["keyword=" + keyword, "distance=" + distance, "geohash=" + geohash, "cat=" + cat, "eventId="];

    
    serverUrl += params.join("&");
    console.log(serverUrl);

    fetch(serverUrl)
    .then((response) => response.json())
    .then((data) => {
        renderGrid(data);
    })
    .catch(error=> {
        console.log(error)
        })

}
	
function clearButton() {
    document.getElementById("form1").reset();  
    resetResults();

    ShowHideDiv(document.getElementById("autolocation").value);
}

function renderGrid(data) {
    document.getElementById('results').style.display = "flex";
    //check length of data
    if(data.page.totalElements == 0) {
        //if none, display no results found
        document.getElementById('noRecords').style.display = "block";
        return;
    }
    // if results, create grid
    document.getElementById('searchResults').style.display = "table";
    let events = data._embedded.events;
    let table = document.getElementById('searchResults').getElementsByTagName('tbody')[0];


    events.forEach((element) => {
        var row = table.insertRow(-1);
        var item = element;
        var time = item["dates"]["start"]["localTime"];
        if(time == "" || typeof time === 'undefined') {
            time = "";
        }

        row.innerHTML  = '<td class="dateCol">' +  item["dates"]["start"]["localDate"]  + '<br>' + time + '</td> <td class="iconCol"> <img src="' +item["images"]["0"]["url"] + '" alt="image"> </td> <td class="eventCol"> <a href="#" onclick="return false;">' + item["name"] + '</a> </td> <td class="genreCol">' + item["classifications"]["0"]["segment"]["name"] + '</td> <td class="venueCol">' + item["_embedded"]["venues"][0]["name"] + '</td>';

        var eventCol = row.getElementsByClassName("eventCol")[0];

        eventCol.onclick = showEventDetails.bind(this, [item["id"]]);


    })
}


function showEventDetails(args) {
    resetDetails();
    var eventId = args[0];
    console.log(eventId);    
    // call event search API
    var serverUrl;
    if(isLocal) {
        serverUrl = "http://127.0.0.1:8080/searchEvents?"; //URL for python server eventSearch function
    }
    else {
        serverUrl = "https://mg-hw6.wn.r.appspot.com/searchEvents?"; //URL for python server eventSearch function
    }
    let params = ["keyword=", "distance=", "geohash=", "cat=", "eventId=" + eventId];

    
    serverUrl += params.join("&");
    console.log(serverUrl);

    fetch(serverUrl)
    .then((response) => response.json())
    .then((data) => {
        document.getElementById('eventDetails').style.display = "block";
        document.getElementById('showVenueDetails').style.display = "block";
        // set title
        document.getElementById('eventTitle').innerText = data["name"];
        // set date
        var date = data["dates"]["start"]["localDate"];
        if(date == "" || typeof date === 'undefined') {
            document.getElementById('eventDate').style.display = "none";
        }
        else {
            document.getElementById('eventDate').style.display = "block";
            var dateText = data["dates"]["start"]["localDate"];
            if(data["dates"]["start"]["localTime"] == "" || typeof data["dates"]["start"]["localTime"] === 'undefined') {
                document.getElementById('eventDate').getElementsByClassName("eventToFill")[0].innerText = dateText;
            }
            else {
                document.getElementById('eventDate').getElementsByClassName("eventToFill")[0].innerText = dateText + " " + data["dates"]["start"]["localTime"];
            }
        }
        // set artist
        checkObjectPresence(data["_embedded"]["attractions"], 'eventArtist');
        // set venue
        checkObjectPresence(data["_embedded"]["venues"][0]["name"], 'eventVenue');
         // set genres
         var genres = [
            data["classifications"][0]["subGenre"]?.["name"],
            data["classifications"][0]["genre"]?.["name"],
            data["classifications"][0]["segment"]?.["name"],
            data["classifications"][0]["subType"]?.["name"],
            data["classifications"][0]["type"]?.["name"]
         ];
         genres = genres.filter(n => n);
         genres = genres.filter(n => n != 'Undefined');
         checkObjectPresence(genres, 'eventGenres');
         // set prices
         var minPrice = data["priceRanges"]?.[0]?.["min"];
         var maxPrice = data["priceRanges"]?.[0]?.["max"];
         var currency = data["priceRanges"]?.[0]?.["currency"];
         var price;
         if(!(minPrice == ""  || typeof minPrice === 'undefined')) {
            price = minPrice;
         }
         if(!(maxPrice == ""  || typeof maxPrice === 'undefined')) {
            price += " - " + maxPrice;
        }
        if(!(currency == ""  || typeof currency === 'undefined')) {
            price += " " + currency;
        }
         checkObjectPresence(price, 'eventPrice');

         // set status
         var status = data["dates"]["status"]["code"];
         checkObjectPresence(status, "eventTicket");

         // set ticket buy
         var buy = data["url"];
         checkObjectPresence(buy, 'eventBuy');

         // set seatmap
         var map = data["seatmap"]?.["staticUrl"];
         checkObjectPresence(map, 'eventMap');


         // display venue
         var venueClick = document.getElementById('showVenueDetails');
         venueClick.style.display = "block";
        //  venueClick.addEventListener("click", showVenueDetails);
         venueClick.onclick = showVenueDetails.bind(this, [data["_embedded"]["venues"][0]["id"]]);

        document.getElementById("eventDetails").scrollIntoView({behavior: 'smooth'});
    })
    .catch(error=> {
        console.log(error)
        })


}

function checkObjectPresence(field, id) {
    var docElement = document.getElementById(id);
    docElement.style.display = "block";
    if(Array.isArray(field)) {
        if(field.length == 0) {
            docElement.style.display = "none";
            return;
        }
    }
    else if( field == ""  || typeof field === 'undefined') {
        docElement.style.display = "none";
        return;
    }

    if(id == "eventTicket") {
        var target = document.getElementById("ticketStatus");
        target.style.display="block";
        var statuses = ["onsale","offsale","cancelled", "postponed","rescheduled"];
        switch(field) {
            case statuses[0]:
                target.style.backgroundColor="green";
                target.innerText="on sale";
                break;
            case statuses[1]:
                target.style.backgroundColor="red";
                target.innerText="off sale";
                break;
            case statuses[2]:
                target.style.backgroundColor="black";
                target.innerText=field;
                break;
            case statuses[3]:
                target.style.backgroundColor="orange";
                target.innerText=field;
                break;
            case statuses[4]:
                target.style.backgroundColor="orange";
                target.innerText=field;
                break;
        }
    }
    else if(id == "eventBuy") {
        var target = docElement.getElementsByTagName("a")[0];
        target.href = field;
    }
    else if(id == "eventMap") {
        docElement.innerHTML =  '<img src="' + field + '" alt="seatmap">';
    }
    else {
        var toFill = docElement.getElementsByClassName("eventToFill")[0];
        if(id == "eventArtist") {
            const artists = [];
            field.forEach(element => {
                var link = '<a target="_blank" href= ' + element["url"] + '>' + element["name"] + '</a>';
                artists.push(link);
            });
            toFill.innerHTML = artists.join(" | ");
        }
        else if(Array.isArray(field)) {
            toFill.innerHTML = field.join(" | ");
        }
        else {
            toFill.innerHTML = field;
        }
    }
}

function showVenueDetails(args) {
    var venueId = args[0];
    document.getElementById('venueDetails').style.display = "block";
    document.getElementById('showVenueDetails').style.display = "none";
    var serverUrl;
    if(isLocal) {
        serverUrl = "http://127.0.0.1:8080/searchVenue?"; //URL for python server eventSearch function
    }
    else {
        serverUrl = "https://mg-hw6.wn.r.appspot.com/searchVenue?"; //URL for python server eventSearch function
    }
    let params = ["venueId=" + venueId];

    
    serverUrl += params.join("&");
    console.log(serverUrl);

    fetch(serverUrl)
    .then((response) => response.json())
    .then((data) => {
        // fill in venue Details
        var name = data["name"];
        var line1 = data.address.line1;
        var city = data["city"]["name"];
        var state = data["state"]["stateCode"];
        var zip = data["postalCode"];
        var image = data["images"]?.["0"]?.["url"];


        document.getElementById('venueName').innerText = replaceNa(name);

        document.getElementById('venueAddress').innerHTML = replaceNa(line1) + '<br>' + replaceNa(city) + ', ' + replaceNa(state)  + '<br>' + replaceNa(zip);
        var target = document.getElementById('moreEvents').getElementsByTagName("a")[0];
        target.href = data["url"];
        const address = [name, line1 , city , state , zip];
        var googleUrl = "https://www.google.com/maps/search/?api=1&query=" + address.join("%2C");
        googleUrl=googleUrl.split(' ').join('+');

        target = document.getElementById('googleLink').href = googleUrl;

        if(!image){
            document.getElementById('venueImg').style.display = "none";
        }
        else {
            document.getElementById('venueImg').style.display = "block";
            document.getElementById('venueImg').src = image;
        }

        document.getElementById("venueDetails").scrollIntoView({behavior: 'smooth'});
        
    })
    .catch(error=> {
        console.log(error)
        })




}

function replaceNa(field) {
    if(!field) {
        return "N/A";
    }
    else {
        return field;
    }
}


function resetResults() {
    document.getElementById('results').style.display = "none";
    document.getElementById('noRecords').style.display = "none";
    document.getElementById('searchResults').style.display = "none";
    document.getElementById('searchResults').getElementsByTagName('tbody')[0].innerHTML="";
    resetDetails();
    
}

function resetDetails() {
    document.getElementById('eventDetails').style.display = "none";
    document.getElementById('venueDetails').style.display = "none";
    document.getElementById('showVenueDetails').style.display = "none";
    
    document.getElementById('ticketStatus').innerHTML = "";
    document.getElementById('eventMap').innerHTML = "";
    document.getElementById('eventBuy').getElementsByTagName('a')[0].href="";
    document.querySelectorAll(".eventToFill").forEach(a=>a.innerText="");
    document.getElementById('venueAddress').innerHTML = "";
    document.getElementById('venueName').innerText = "";
    document.getElementById('moreEvents').getElementsByTagName("a")[0].removeAttribute("href");
    document.getElementById('googleLink').removeAttribute("href");
    document.getElementById('venueImg').removeAttribute("src");
    document.getElementById('venueImg').removeAttribute("alt");


}

// function code taken and adapted from: 
// https://www.w3schools.com/howto/howto_js_sort_table.asp
function sortTable(n) {
    var table, rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
    table = document.getElementById("searchResults");
    switching = true;
    // Set the sorting direction to ascending:
    dir = "asc";
    /* Make a loop that will continue until
    no switching has been done: */
    while (switching) {
      // Start by saying: no switching is done:
      switching = false;
      rows = table.rows;
      /* Loop through all table rows (except the
      first, which contains table headers): */
      for (i = 1; i < (rows.length - 1); i++) {
        // Start by saying there should be no switching:
        shouldSwitch = false;
        /* Get the two elements you want to compare,
        one from current row and one from the next: */
        x = rows[i].getElementsByTagName("TD")[n];
        y = rows[i + 1].getElementsByTagName("TD")[n];
        /* Check if the two rows should switch place,
        based on the direction, asc or desc: */
        if (dir == "asc") {
          if (x.innerHTML.toLowerCase() > y.innerHTML.toLowerCase()) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true;
            break;
          }
        } else if (dir == "desc") {
          if (x.innerHTML.toLowerCase() < y.innerHTML.toLowerCase()) {
            // If so, mark as a switch and break the loop:
            shouldSwitch = true;
            break;
          }
        }
      }
      if (shouldSwitch) {
        /* If a switch has been marked, make the switch
        and mark that a switch has been done: */
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
        switching = true;
        // Each time a switch is done, increase this count by 1:
        switchcount ++;
      } else {
        /* If no switching has been done AND the direction is "asc",
        set the direction to "desc" and run the while loop again. */
        if (switchcount == 0 && dir == "asc") {
          dir = "desc";
          switching = true;
        }
      }
    }
  }

// REFERENCES:
// https://www.scaler.com/topics/string-concatenation-javascript/
// https://www.aspsnippets.com/Articles/Show-Hide-DIV-with-TextBox-when-CheckBox-is-checked-unchecked-using-JavaScript-and-jQuery.aspx
// https://www.npmjs.com/package/latlon-geohash
// https://www.w3schools.com/howto/howto_js_sort_table.asp




