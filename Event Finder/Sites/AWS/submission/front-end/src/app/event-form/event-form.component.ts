import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, NgForm } from '@angular/forms';
import { EventSearch } from '../eventSearch';
import { HttpClient } from '@angular/common/http';

import { debounceTime, tap, switchMap, finalize, distinctUntilChanged, filter } from 'rxjs/operators';
import { MdbModalRef, MdbModalService } from 'mdb-angular-ui-kit/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


var isLocal = false;
var backendUrl = "";

//to delete

@Component({
  selector: 'app-event-form',
  templateUrl: './event-form.component.html',
  styleUrls: ['./event-form.component.css']
})
export class EventFormComponent implements OnInit {
  //show/hide overflow
  isReadMore = [true, true, true];

  showText(num:number) {

    
    this.isReadMore[num] = !this.isReadMore[num];
    console.log(this.isReadMore);
 }


  

  



  categories = ['Default', 'Music', 'Sports',
            'Arts & Theatre', 'Film', 'Miscellaneous'];


  submitted = false;
  dropClicked = false;
  event = new EventSearch("",this.categories[0],"", false, 10);

  eventsTable:any = "";
  numEvents = 0;
  selectedEvent:any = "";
  eventDetails:any = "";
  genres:any = "";
  venueDetails:any = "";
  selectedVenue:any="";
  address:any="";
  venueLatLng:any = "";
  artistDetails:any = [];
  favoriteIds:any = [];

  onSubmit(validity: any) { 
    
    if(validity == "INVALID") {
      return;
    }
    // Submit
    this.backButton();
    this.callEventSearch();
    
  }

  onClear() { 
    this.event = new EventSearch("",this.categories[0],"", false, 10);
    this.submitted = false;
    this.filteredKeywords = [];
    this.numEvents = 0;
    this.backButton();
   }

   backButton() {
    this.selectedEvent = "";
    this.eventDetails = "";
    this.venueDetails = "";
    this.genres = "";
    this.selectedVenue = "";
    this.address = "";
    this.venueLatLng = "";
    this.artistDetails = [];
   }

// Auto Complete 
   searchKeywordsCtrl = new FormControl();
   filteredKeywords: any;
   isLoading = false;
   errorMsg!: string;
   minLengthTerm = 1;
 
   constructor(
     private http: HttpClient,
     private modalService: NgbModal
   ) { }
 
   ngOnInit() {
    if(isLocal) { 
      backendUrl = "http://127.0.0.1:3000/";
    } else {
      // to fill in 
      backendUrl = "http://hw8-env.eba-hwjhcppp.us-east-1.elasticbeanstalk.com/";
    }
    this.favoriteIds = localStorage.getItem("favorite_ids");
    console.log(this.favoriteIds);
     this.searchKeywordsCtrl.valueChanges
       .pipe(
         filter(res => {
           return res !== null && res.length >= this.minLengthTerm
         }),
         distinctUntilChanged(),
         debounceTime(1000),
         tap(() => {
           this.errorMsg = "";
           this.filteredKeywords = [];
           this.isLoading = true;
         }),
         switchMap(value => this.http.get(backendUrl + "suggest" + "?keyword=" + value)
           .pipe(
             finalize(() => {
               this.isLoading = false;
             }),
           )
         )
       )
       .subscribe((data: any) => {
         if (data['_embedded'] == undefined) {
           this.errorMsg = data['Error'];
           this.filteredKeywords = [];
         } else {
           this.errorMsg = "";
           var list = data['_embedded']['attractions'];
           list.forEach((value: any) => {
            this.filteredKeywords.push(value['name'])
           });
         }
       });
   }

   callEventSearch() {
    let params = ["keyword=" + this.event.keyword, "distance=" + this.event.distance, "category=" + this.event.category,"location=" + this.event.location, "autoLocation=" + this.event.autoLocation, "eventId="];
    if(this.event.autoLocation == true) {
       this.getIPinfo().then((obj) => {
        if(obj == null) {
          obj = "";
        }
        console.log(obj);
      const latLong = obj.split(",");
      let lat = latLong[0];
      let long = latLong[1];
      params.push("lat=" + lat, "long="+long);
      this.callEventSearchServer(params);
    })
    .catch(error=> {
         console.log(error)
         })

    }
    else {
      params.push("lat=", "long=");

      this.callEventSearchServer(params);

    }
    


   }

   callEventSearchServer(params: any[]) {
    console.log(params);
    let searchUrl = backendUrl + "searchEvents?" + params.join("&");
    console.log(searchUrl);

    fetch(searchUrl)
    .then((response) => response.json())
    .then((data) => {
        this.numEvents = data['page']?.['totalElements'];
        if(this.numEvents== undefined) {
          this.numEvents = 0;
        }
        else {
          this.eventsTable = data['_embedded']?.['events'];
        }
    })
    .catch(error=> {
        console.log(error)
        })
    .finally(() => {
      this.submitted = true; 
    }
      
    )

   }
   

   selectEvent(eventId: any) {
    this.selectedEvent = eventId;

    // get event Details
    let params = ["keyword=", "distance=", "location=", "autoLocation=", "category=","lat=","long=", "eventId=" + this.selectedEvent];
    let searchUrl = backendUrl + "searchEvents?" + params.join("&");
    console.log(searchUrl);

    fetch(searchUrl)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
        this.eventDetails = data;
        var classif = data["classifications"][0];
        this.genres = [classif["segment"]?.["name"], classif["genre"]?.["name"], classif["subGenre"]?.["name"], classif["type"]?.["name"], classif["subType"]?.["name"] ];
        this.genres = this.genres.filter((obj: any) =>  obj !== "Undefined" && obj !== null && obj !== "" && obj !== undefined);
        console.log(this.genres);
        this.getVenue(data["_embedded"]["venues"][0]["id"]);
        this.getArtists();
        const element = document.querySelector('#event-details');
        if(element != null) {element.scrollIntoView();}
    })
    .catch(error=> {
        console.log(error)
        })

   }

   getVenue(venueId: any) {
    this.selectedVenue = venueId;

    // get venue Details
    let params = ["venue=" + this.selectedVenue];
    let searchUrl = backendUrl + "searchVenue?" + params.join("&");
    console.log(searchUrl);

    fetch(searchUrl)
    .then((response) => response.json())
    .then((data) => {
      console.log(data);
        this.venueDetails = data;
        this.address = [data["address"]["line1"], data["city"]["name"], data["state"]["name"] ];
        this.venueLatLng = [Number(data["location"]["latitude"]), Number(data["location"]["longitude"])];
        console.log(this.venueLatLng);

    })
    .catch(error=> {
        console.log(error)
        })

   }



   getArtists() {
    var attractions = this.eventDetails?._embedded?.attractions;
    var artists = [];
    console.log(attractions);
    if(attractions == "" || attractions == undefined) {
      return;
    }
    attractions.forEach( (value: any) => {
      // console.log(value);
      if(value.classifications[0].segment.name == "Music") {
        artists.push(value.name);

        let searchUrl = backendUrl + "searchArtist?artist=" + value.name;
    console.log(searchUrl);

    fetch(searchUrl)
    .then((response) => response.json())
    .then((data) => {
      
      this.artistDetails.push(data);
      console.log(this.artistDetails);
      

    })
    .catch(error=> {
        console.log(error)
        })

      }
    }); 



   }


   addFavorite() {
    if (typeof(Storage) !== "undefined") {
      // Code for localStorage/sessionStorage.
      //id, date, event, category, venue


      var eventToAdd = {
        'id': this.eventDetails.id,
        'date': this.eventDetails.dates.start.localDate,
        'event': this.eventDetails.name,
        'category': this.genres.join(" | "),
        'venue': this.eventDetails._embedded.venues[0].name
      }

      this.favoriteIds = localStorage.getItem("favorite_ids");
      console.log(this.favoriteIds);
      var jsonFavoriteIds:any;

      if(this.favoriteIds == null || this.favoriteIds == "") {
        jsonFavoriteIds = [];
      }
      //IDS
      else {
        jsonFavoriteIds = JSON.parse(this.favoriteIds);
      }
      if(!jsonFavoriteIds.includes(this.eventDetails.id)) {
        jsonFavoriteIds.push(this.eventDetails.id);
        localStorage.setItem("favorite_ids", JSON.stringify(jsonFavoriteIds));
        this.favoriteIds = localStorage.getItem("favorite_ids");
        
        // favorites data
        var favorites = localStorage.getItem("favorites");
        console.log(favorites);
        var jsonFavorites:any;
        if(favorites == null || favorites == "") {
          jsonFavorites = [];
        }
        else {
          jsonFavorites = JSON.parse(favorites);
        }
        jsonFavorites.push(eventToAdd);
        localStorage.setItem("favorites", JSON.stringify(jsonFavorites));
        window.alert("Event Added to Favorites!");

      }


    } else {
      // Sorry! No Web Storage support..

    }
   }

   removeFavorite() {
    if (typeof(Storage) !== "undefined") {
      // Code for localStorage/sessionStorage.


      var eventToAdd = {
        'id': this.eventDetails.id,
        'date': this.eventDetails.dates.start.localDate,
        'event': this.eventDetails.name,
        'category': this.genres.join(" | "),
        'venue': this.eventDetails._embedded.venues[0].name
      }

      this.favoriteIds = localStorage.getItem("favorite_ids");
      console.log(this.favoriteIds);
      var jsonFavoriteIds:any;

      if(this.favoriteIds == null || this.favoriteIds == "") {
        jsonFavoriteIds = [];
      }
      //IDS
      else {
        jsonFavoriteIds = JSON.parse(this.favoriteIds);
      }
      if(jsonFavoriteIds.includes(this.eventDetails.id)) {
        jsonFavoriteIds = jsonFavoriteIds.filter((obj: any) =>  obj !== this.selectedEvent);
        localStorage.setItem("favorite_ids", JSON.stringify(jsonFavoriteIds));
        this.favoriteIds = localStorage.getItem("favorite_ids");
        
        // favorites data
        var favorites = localStorage.getItem("favorites");
        console.log(favorites);
        var jsonFavorites:any;
        if(favorites == null || favorites == "") {
          jsonFavorites = [];
        }
        else {
          jsonFavorites = JSON.parse(favorites);
        }
        jsonFavorites = jsonFavorites.filter((obj: any) =>  obj.id !== this.selectedEvent);
        localStorage.setItem("favorites", JSON.stringify(jsonFavorites));
        window.alert("Removed from Favorites!");

      }


    } else {
      // Sorry! No Web Storage support..

    }

   }

getIPinfo() {
    let obj = "";
    const TOKEN = "2ffb14ed222be7";
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








}