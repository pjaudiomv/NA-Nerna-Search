import { Component }        from '@angular/core';
import { Config }           from '../../../app/app.config';
import { ServiceGroupsProvider } from '../../../providers/service-groups/service-groups';
import { InAppBrowser }     from '@ionic-native/in-app-browser';
import { LoadingController } from 'ionic-angular';

@Component({
  selector: 'page-contact',
  templateUrl: 'contact.html'
})
export class ContactComponent {

  loader = null;
  serviceGroupNames : any;
  sourceCodeLink    : string = "https://github.com/paulnagle/BMLTSearch";
  sourceBugs        : string = "https://github.com/paulnagle/BMLTSearch/issues";
  bmltLink          : string = "https://bmlt.magshare.net/";

    constructor ( private ServiceGroupsProvider : ServiceGroupsProvider,
                  public loadingCtrl            : LoadingController,
                  private iab          : InAppBrowser,
                  private config                : Config ) {
        // Contact page constructor
        this.getServiceGroupContactDetails();
    }

    getServiceGroupContactDetails(){
        this.ServiceGroupsProvider.getAllServiceGroups().subscribe((serviceGroupData)=>{
            this.serviceGroupNames = serviceGroupData;
        });
    }

  public openLink(url) {
    const browser = this.iab.create(url, '_system');

  }

}
