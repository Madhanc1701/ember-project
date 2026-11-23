
export default function(server) {
  server.create('config', {
    id: 'android',
    os: '/images/android.png',
    dial: '/images/android_phone.png',
    message: '/images/android_message.png',
    mail: '/images/android_email.png',
    social: '/images/instagram.png',
    iconName: 'Instagram',
    width: '320px',
    height: '705px'
  });
  server.create('config', {
    id: 'ios',
    os: '/images/ios.png',
    dial: '/images/ios_phone.png',
    message: '/images/ios_message.png',
    mail: '/images/ios_email.png',
    social: '/images/twitter.png',
    iconName: 'Twitter',
    width: '340px',
    height: '630px'
  });
  server.create('config', {
    id: 'windows',
    os: '/images/windows.png',
    dial: '/images/windows_phone.png',
    message: '/images/windows_message.png',
    mail: '/images/windows_mail.png',
    social: '/images/skype.png',
    iconName: 'Skype',
    width: '985px',
    height: '565px'
  });
  server.create('configBasic', {
    id: 'single',
    sim: '/images/single.png',
  });
  server.create('configBasic', {
    id: 'dual',
    sim: '/images/dual.png',
  });
  server.create('common', {
    camera: '/images/camera.png',
    back: '/images/back.png',
    calling: '/images/android_phone.png',
    dial: '/images/android_phone.png',
    message: '/images/android_message.png',
  });

}
