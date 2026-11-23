export default function() {
  this.get('/configs');
  this.get('/configs/:id');
  this.get('/config-basics');
  this.get('/config-basics/:id');
  this.get('/commons', function(schema, request) {
    return schema.commons.where(request.queryParams).models[0];
  });

  this.get('/phones');
  this.get('/phones/:id');
  this.post('/phones');
  this.delete('/phones/:id');
}