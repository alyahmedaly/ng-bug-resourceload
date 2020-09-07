var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import __NG_CLI_RESOURCE__0 from "!raw-loader!./external.component.html";
import { Component } from '@angular/core';
let ExampleComponent = class ExampleComponent {
};
ExampleComponent = __decorate([
    Component({
        selector: 'example-compoent',
        template: __NG_CLI_RESOURCE__0,
    })
], ExampleComponent);
export { ExampleComponent };
