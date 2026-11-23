import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/template';
import { get } from '@ember/object';

interface Theme{
  width:string;
  height:string;
}
export function containerStyle([theme]:[Theme|null|undefined]) {
  if (!theme) {
    return htmlSafe('');
  } 
  return htmlSafe(`width:${get(theme,'width')}; height:${get(theme,'height')}`);
}

export default helper(containerStyle);
