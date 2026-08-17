import { Component } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['../demo-styling.css'],
})
export class AppComponent {
  title = 'angular-quickstart';
  iframeUrl: { default?: SafeResourceUrl; community?: SafeResourceUrl } = {};

  constructor(private sanitizer: DomSanitizer) {}
}
