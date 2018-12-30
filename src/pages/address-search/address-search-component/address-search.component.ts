import { Component,
         ViewChild,
         ElementRef,
         NgZone  }                    from '@angular/core';
import { LoadingController }          from 'ionic-angular';
import { Config }                     from '../../../app/app.config';
import { Storage }                    from '@ionic/storage';
import { ToastController }            from 'ionic-angular';
import { MouseEvent,
         LatLngLiteral,
         LatLngBounds,
         LatLng,
         AgmCircle,
         MapsAPILoader  }             from '@agm/core';
import { MeetingListProvider }        from '../../../providers/meeting-list/meeting-list';
import { TranslateService }           from '@ngx-translate/core';
import { InAppBrowser }               from '@ionic-native/in-app-browser';

declare const google: any;

@Component({
  selector: 'page-address-search',
  templateUrl: 'address-search.html',
})
export class AddressSearchComponent {

  timeDisplay        : string  = "";
  meetingList        : any     = [];
  loader                       = null;
  zoom               : number  = 8;
  mapLatitude        : any     =  51.899 ;
  mapLongitude       : any     = -8.474 ;
  autoRadius         : any;
  map                : any     = null ;
  mapBounds          : LatLngBounds;
  myLatLng           : LatLng;
  circleRadiusMeters : number  = 0 ;
  formattedAddress   : string  = '';

	autocompleteService: any;
	placesService      : any;
	query              : string  = '';
	places             : any     = [];
	location           : any;



  @ViewChild('circle', {read: AgmCircle}) circle: AgmCircle;

  constructor(private MeetingListProvider : MeetingListProvider,
              public  loadingCtrl         : LoadingController,
              private toastCtrl           : ToastController,
              private storage             : Storage,
              private translate           : TranslateService,
              private MapsAPIloader       : MapsAPILoader,
              private zone                : NgZone,
              private iab                 : InAppBrowser  ) {

  }

	selectPlace(place){
		this.places = [];
		let location = {
			lat: null,
			lng: null,
			name: place.name
		};
		this.placesService.getDetails({placeId: place.place_id}, (details) => {
			this.zone.run(() => {

        this.mapLatitude = details.geometry.location.lat();
        this.mapLongitude = details.geometry.location.lng();
        this.query = details.formatted_address;
        this.getMeetings();

			});
		});
	}

	searchPlace(){
		if(this.query.length) {
			let config = {
				types: ['geocode'],
				input: this.query
			}
			this.autocompleteService.getPlacePredictions(config, (predictions, status) => {
				if(status == google.maps.places.PlacesServiceStatus.OK && predictions){
					this.places = [];
					predictions.forEach((prediction) => {
						this.places.push(prediction);
					});
				}
			});
		} else {
			this.places = [];
		}

	}

  mapReady(event: any) {
    this.map = event;

    this.autocompleteService = new google.maps.places.AutocompleteService();
    this.placesService = new google.maps.places.PlacesService(this.map);

    this.storage.get('timeDisplay').then(timeDisplay => {
      if(timeDisplay) {
        this.timeDisplay = timeDisplay;
      } else {
        this.timeDisplay = "24hr";
      }
      this.storage.get('searchRange').then(searchValue => {
        if(searchValue) {
          this.autoRadius = searchValue;
        } else {
          this.autoRadius = 25;
        }
        this.storage.get('savedLat').then(value => {
          if(value) {
            this.mapLatitude = value;
            this.storage.get('savedLng').then(value => {
              if(value) {
                this.mapLongitude = value;

                this.mapLatitude = parseFloat(this.mapLatitude);
                this.mapLongitude = parseFloat(this.mapLongitude);
                this.getMeetings();
              } else {

              }
            });
          } else {

          }
        });
      });
    });
  }


  getMeetings(){
    this.translate.get('LOADINGMAP').subscribe(value => {this.presentLoader(value);})

    this.MeetingListProvider.getAutoRadiusMeetings(this.mapLatitude, this.mapLongitude, this.autoRadius).subscribe((data)=>{

      if (JSON.stringify(data) == "{}") {  // empty result set!
        this.meetingList = JSON.parse("[]");
      } else {
        this.meetingList  = data;
        this.meetingList  = this.meetingList.filter(meeting => meeting.latitude = parseFloat(meeting.latitude));
        this.meetingList  = this.meetingList.filter(meeting => meeting.longitude = parseFloat(meeting.longitude));
        this.meetingList.filter(i => i.start_time = this.convertTo12Hr(i.start_time));

      }

      this.setLatLngOffsets();

      this.dismissLoader();
    });
  }

  setLatLngOffsets() {
    var i : any;
    var dist : number = 0;
    for (i = 0; i < this.meetingList.length - 1; i++) {
      if (parseFloat(this.meetingList[i].distance_in_km) > dist) {
        dist = parseFloat(this.meetingList[i].distance_in_km);
      }
      var longOffset : any = 0;
      var latOffset  : any = 0;
      var Offset     : any = 0.00002;
      // maybe use :- https://github.com/TopicFriends/TopicFriends/commit/d6c61ae976eb1473b314bd804cebacd5106dac37
      while ((this.meetingList[i].longitude == this.meetingList[i+1].longitude) &&
             (this.meetingList[i].latitude == this.meetingList[i+1].latitude) ){
        if ( (i % 2) === 1) {
          longOffset += Offset;
          this.meetingList[i].longitude = this.meetingList[i].longitude  + longOffset;
        } else {
          latOffset += Offset;
          this.meetingList[i].latitude = this.meetingList[i].latitude  + latOffset;
        }
        i++;
        if (i == (this.meetingList.length - 1)) {
          longOffset = 0;
          latOffset = 0;
          break;
        }
      } // while

    } // for

    this.circleRadiusMeters = dist * 1000;
  }

  presentLoader(loaderText) {
    if (!this.loader) {
      this.loader = this.loadingCtrl.create({
        content: loaderText
      });
      this.loader.present();
    }
  }

  dismissLoader() {
    if(this.loader){
      this.loader.dismiss();
      this.loader = null;
    }
  }

  public convertTo12Hr(timeString){
    if (this.timeDisplay == "12hr") {
      var H = +timeString.substr(0, 2);
      var h = H % 12 || 12;
      var ampm = (H < 12 || H === 24) ? " AM" : " PM";
      timeString = h + timeString.substr(2, 3) + ampm;
      return timeString;
    } else {
     return timeString.slice(0, -3);
    }
  }

  public radiusChange() {
    var tempMapBounds = new google.maps.LatLngBounds();

    this.circle.getBounds().then( value => {

      tempMapBounds.extend(value.getNorthEast());
      tempMapBounds.extend(value.getSouthWest());

      this.mapBounds = tempMapBounds;
    });

  }

  public openMapsLink(destLatitude, destLongitude) {
    const browser = this.iab.create('https://www.google.com/maps/search/?api=1&query=' + destLatitude + ',' + destLongitude, '_system');
  }

}
