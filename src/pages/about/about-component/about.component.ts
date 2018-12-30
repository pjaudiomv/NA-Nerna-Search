import { Component }        from '@angular/core';
import { Config }           from '../../../app/app.config';
import { InAppBrowser }     from '@ionic-native/in-app-browser';

@Component({
    selector: 'page-about',
    templateUrl: 'about.html'
})
export class AboutComponent {

    sourceCodeLink    : string = "https://github.com/paulnagle/BMLTSearch";
    sourceBugs        : string = "https://github.com/paulnagle/BMLTSearch/issues";
    bmltLink          : string = "https://bmlt.magshare.net/";

    constructor( private config       : Config,
                 private iab          : InAppBrowser) {

    }

    public openLink(url) {
        const browser = this.iab.create(url, '_system');

    }

}
