import { Component } from '@angular/core';
/******************** Taking Photos *********************/
import { Photo,PhotoService } from '../services/photo.service';
/******************** Deleting Photos *********************/
import {ActionSheetController} from "@ionic/angular";

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page {
  /******************** Taking Photos ********************************/
  constructor(public photoService: PhotoService ,
              /******************** Deleting Photos ********************************/
              public actionSheetController: ActionSheetController) {}
  /********************* Loading Photos from the Filesystem **********/
  async ngOnInit() {
    await this.photoService.loadSaved();
  }
  /******************** Taking Photos ********************************/
  addPhotoToGallery() {
    // call the photoService method !
    this.photoService.addNewToGallery();
  }
  /******************** Deleting Photos ********************************/
  public async showActionSheet(photo: Photo, position: number) {
    const actionSheet = await this.actionSheetController.create({
      header: 'Photos',
      buttons: [{
        text: 'Delete',
        role: 'destructive',
        icon: 'trash',
        handler: () => {
          this.photoService.deletePicture(photo, position);
        }
      }, {
        text: 'Cancel',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          // Nothing to do, action sheet is automatically closed
        }
      }]
    });
    await actionSheet.present();
  }
}
