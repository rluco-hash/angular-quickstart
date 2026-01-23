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

  constructor(private sanitizer: DomSanitizer) {
    this.iframeUrl.default = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://widget.segurosdigital.cl/?key=6ced0b9db5d63a319d903a2ea83649ed3158bddd4909a6ea',
    );

    this.iframeUrl.community = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://widget.segurosdigital.cl/?key=6ced0b9db5d63a319d903a2ea83649ed3158bddd4909a6ea&template=community',
    );
  }
}
