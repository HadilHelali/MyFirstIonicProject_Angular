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
    this.photos.unshift({
      filepath: 'soon...',
      webviewPath: capturedPhoto.webPath
    });
    /********************* Loading Photos from the Filesystem **********/
    await Storage.set({
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

  private async readAsBase64(cameraPhoto: CameraPhoto) {
    // Fetch the photo, read as a blob, then convert to base64 format
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const response = await fetch(cameraPhoto.webPath!);
    const blob = await response.blob();

    return await this.convertBlobToBase64(blob) as string;
  }

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
    // Use webPath to display the new image instead of base64 since it's
    // already loaded into memory
    return {
      filepath: fileName,
      webviewPath: cameraPhoto.webPath
    };
  }

  /********************* Loading Photos from the Filesystem **********/
  public async loadSaved() {
    // Retrieve cached photo array data
    const photoList = await Storage.get({key: this.PHOTO_STORAGE});
    this.photos = JSON.parse(photoList.value) || [];
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
/************************* Displaying Photos ***************************/
export interface Photo {
  filepath: string;
  webviewPath: string;
}

