import EmberRouter from '@ember/routing/router';
import config from './config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;
  rootURL = config.rootURL;
}

Router.map(function() {
  this.route('smart');
  this.route(   'basic-phone',   { path: '/basic' });
  this.route(    'smart-home',   { path: '/smart/home' });
  this.route(    'basic-home',   { path: '/basic/home' });
  this.route(    'smart-dial',   { path: '/smart/dial' });  
  this.route(    'smart-mail',   { path: '/smart/mail' });  
  this.route( 'smart-message',   { path: '/smart/message' });  
  this.route(  'smart-social',   { path: '/smart/social' });
  this.route(    'basic-dial',   { path: '/basic/dial' });
  this.route( 'basic-message',   { path: '/basic/message' });
});
