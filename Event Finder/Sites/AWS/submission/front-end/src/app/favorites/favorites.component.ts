import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.css']
})
export class FavoritesComponent implements OnInit {

  favorites:any = "";

  ngOnInit() {
    // get favorites data
    var favoriteLocal = localStorage.getItem("favorites");
    console.log(favoriteLocal);

    if(favoriteLocal == null || favoriteLocal == "") {
      this.favorites = [];
    }
    else {
      this.favorites = JSON.parse(favoriteLocal);
    }
  }

  deleteFavorite(eventId: any) {
    if (typeof(Storage) !== "undefined") {
      // Code for localStorage/sessionStorage.
      var favoriteIds = localStorage.getItem("favorite_ids");
      var jsonFavoriteIds:any;

      if(favoriteIds == null || favoriteIds == "") {
        jsonFavoriteIds = [];
      }
      //IDS
      else {
        jsonFavoriteIds = JSON.parse(favoriteIds);
      }
      if(jsonFavoriteIds.includes(eventId)) {
        jsonFavoriteIds = jsonFavoriteIds.filter((obj: any) =>  obj !== eventId);
        localStorage.setItem("favorite_ids", JSON.stringify(jsonFavoriteIds));
        
        // favorites data
        var favorites = localStorage.getItem("favorites");
        console.log(favorites);
        if(favorites == null || favorites == "") {
          this.favorites = [];
        }
        else {
          this.favorites = JSON.parse(favorites);
        }
        this.favorites = this.favorites.filter((obj: any) =>  obj.id !== eventId);
        localStorage.setItem("favorites", JSON.stringify(this.favorites));
        window.alert("Removed from Favorites!");

      }


    } else {
      // Sorry! No Web Storage support..

    }

   }
}
