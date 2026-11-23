import { helper } from '@ember/component/helper';
import { htmlSafe } from '@ember/string';

export function containerStyle([theme]) {
  if (!theme) {
    return htmlSafe('');
  } 
  return htmlSafe(`width:${theme.get('width')}; height:${theme.get('height')}`);
}

export default helper(containerStyle);
