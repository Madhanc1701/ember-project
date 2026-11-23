import Service from '@ember/service';
import { tracked } from '@glimmer/tracking';

export default class LoaderService extends Service{
    @tracked isLoading = false;
};
