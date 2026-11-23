import Model,{attr} from '@ember-data/model';

export default Model.extend({
  camera: attr('string'),  
  back: attr('string'),  
  calling: attr('string'),
  dial: attr('string'),
  message: attr('string'),
});
