import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

console.log('Starting application bootstrap...');

bootstrapApplication(App, appConfig)
  .then(() => {
    console.log('Application bootstrapped successfully!');
  })
  .catch((err) => {
    console.error('Bootstrap error:', err);
  });
