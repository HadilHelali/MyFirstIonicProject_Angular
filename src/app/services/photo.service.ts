import { Injectable } from '@angular/core';
/******************************************************************** Taking Photos ***********************************/
/*** import Capacitor dependencies and get references to the Camera, Filesystem, and Storage plugins ******************/
import { Camera, CameraResultType, CameraSource , CameraPhoto} from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';
/******************************************************************** Adding Mobile ***********************************/
/*Import the Ionic Platform API into photo.service.ts, which is used to retrieve information about the current device */
// In this case, it’s useful for selecting which code to execute based on the platform the app is running on (web or mobile):
import { Platform } from '@ionic/angular';
import {Capacitor} from "@capacitor/core";
/*********************************************************************************************************************/

@Injectable({
  providedIn: 'root'
})
export class PhotoService {

  // Array of Photos :
  public photos: Photo[] = [];
  // Storage API :
  private PHOTO_STORAGE = 'photos';
  // adding the plateform :
  private platform: Platform;

  constructor(platform: Platform) {
    this.platform = platform;
  }

  /*************************** Taking Photos *****************************/
  public async addNewToGallery() {
    // Take a photo : there's no platform-specific code (web, iOS, or Android)! The Capacitor Camera
    // plugin abstracts that away for us, leaving just one method call [getPhoto] that will open up
    // the device's camera and allow us to take photos.
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri, // file-based data; provides best performance
      source: CameraSource.Camera, // automatically take a new photo with the camera
      quality: 100 // highest quality (0 to 100)
    });

    /********************* Saving the photos ****************************/
      // Save the picture and add it to photo collection
    const savedImageFile = await this.savePicture(capturedPhoto);
    this.photos.unshift(savedImageFile);
    /********************* Displaying Photos ****************************/
    // we're returning a photo according to the photo interface that we've created
   // this.photos.unshift({
    //  filepath: 'soon...',
    //  webviewPath: capturedPhoto.webPath
   // });
    /********************* Loading Photos from the Filesystem **********/
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });
  }

  /************************* Saving the photos *************************/
  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });
  /************************* Adding Mobile ****************************/

  /* First, we’ll update the photo saving functionality to support mobile. In the
  readAsBase64() function, check which platform the app is running on. If it’s “hybrid”
  (Capacitor or Cordova, two native runtimes), then read the photo file into base64 format
  using the Filesystem readFile() method. Otherwise, use the same logic as before when running
  the app on the web: */

  private async readAsBase64(cameraPhoto: CameraPhoto) {
    // "hybrid" will detect Cordova or Capacitor
    if (this.platform.is('hybrid')) {
      // Read the file into base64 format
      const file = await Filesystem.readFile({
        path: cameraPhoto.path
      });

      return file.data;
    } else {
      // Fetch the photo, read as a blob, then convert to base64 format
      const response = await fetch(cameraPhoto.webPath);
      const blob = await response.blob();

      return await this.convertBlobToBase64(blob) as string;
    }
  }

  // Adding Mobile : Next, update the savePicture() method. When running on mobile,
  // set filepath to the result of the writeFile() operation - savedFile.uri. When
  // setting the webviewPath, use the special Capacitor.convertFileSrc() method (details here).

  // Save picture to file on device
  private async savePicture(cameraPhoto: CameraPhoto) {
    // Convert photo to base64 format, required by Filesystem API to save
    const base64Data = await this.readAsBase64(cameraPhoto);

    // Write the file to the data directory
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    if (this.platform.is('hybrid')) {
      // Display the new image by rewriting the 'file://' path to HTTP
      // Details: https://ionicframework.com/docs/building/webview#file-protocol
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      // Use webPath to display the new image instead of base64 since it's
      // already loaded into memory
      return {
        filepath: fileName,
        webviewPath: cameraPhoto.webPath
      };
    }
  }

  /********************* Loading Photos from the Filesystem + Adding Mobile **********/
  // Adding Mobile : On mobile, we can directly set the source of an image tag - <img src="x" /> -
  // to each photo file on the Filesystem, displaying them automatically. Thus, only the web requires
  // reading each image from the Filesystem into base64 format. Update this function to add an if
  // statement around the Filesystem code:

  public async loadSaved() {
    // Retrieve cached photo array data
    const photoList = await Storage.get({key: this.PHOTO_STORAGE});
    this.photos = JSON.parse(photoList.value) || [];

    // Easiest way to detect when running on the web:
    // “when the platform is NOT hybrid, do this”
    if (!this.platform.is('hybrid')) {
      // Display the photo by reading into base64 format
      for (let photo of this.photos) {
        // Read each saved photo's data from the Filesystem
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data
        });

        // Web platform only: Load the photo as base64 data
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
  }
  /******************** Deleting Photos ********************************/
  public async deletePicture(photo: Photo, position: number) {
    // Remove this photo from the Photos reference data array
    this.photos.splice(position, 1);

    // Update photos array cache by overwriting the existing photo array
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos)
    });

    // delete photo file from filesystem
    const filename = photo.filepath
      .substr(photo.filepath.lastIndexOf('/') + 1);

    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data
    });
  }
}
/************************* Displaying Photos ***************************/
export interface Photo {
  filepath: string;
  webviewPath: string;
}

