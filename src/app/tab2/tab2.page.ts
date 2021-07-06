import { Component } from '@angular/core';
/******************** Taking Photos *********************/
import { PhotoService } from '../services/photo.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
  /******************** Taking Photos ********************************/
  constructor(public photoService: PhotoService) {}
  /********************* Loading Photos from the Filesystem **********/
  async ngOnInit() {
    await this.photoService.loadSaved();
  }
  /******************** Taking Photos ********************************/
  addPhotoToGallery() {
    // call the photoService method !
    this.photoService.addNewToGallery();
  }
}
