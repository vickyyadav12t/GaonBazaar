import type { Language } from '@/types';

/** Mirrors Settings page `content.en` shape */
export type SettingsStrings = {
  title: string;
  subtitle: string;
  account: string;
  notifications: string;
  privacy: string;
  security: string;
  language: string;
  profileInfo: string;
  name: string;
  email: string;
  phone: string;
  save: string;
  emailNotif: string;
  pushNotif: string;
  orderUpdates: string;
  messageNotif: string;
  reviewNotif: string;
  promoEmails: string;
  profileVisibility: string;
  public: string;
  private: string;
  showPhone: string;
  showLocation: string;
  changePassword: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  deleteAccount: string;
  deleteWarning: string;
  deleteDescription: string;
  cancel: string;
  delete: string;
  english: string;
  hindi: string;
  logOut: string;
  logOutHint: string;
  profilePhoto: string;
  uploadPhoto: string;
  removePhoto: string;
  photoHint: string;
  promoHint: string;
  chooseLanguage: string;
  profileInfoDesc: string;
  notificationsTabDesc: string;
  privacyTabDesc: string;
  securityTabDesc: string;
  deleteZoneDesc: string;
  emailNotifHelp: string;
  pushNotifHelp: string;
  orderUpdatesHelp: string;
  messageNotifHelp: string;
  reviewNotifHelp: string;
  promoNotifHelp: string;
  visibilityHelp: string;
  showPhoneHelp: string;
  showLocationHelp: string;
  passwordLengthHint: string;
};

const EN: SettingsStrings = {
  title: 'Settings',
  subtitle: 'Manage your account settings and preferences',
  account: 'Account',
  notifications: 'Notifications',
  privacy: 'Privacy',
  security: 'Security',
  language: 'Language',
  profileInfo: 'Profile Information',
  name: 'Full Name',
  email: 'Email Address',
  phone: 'Phone Number',
  save: 'Save Changes',
  emailNotif: 'Email Notifications',
  pushNotif: 'Push Notifications',
  orderUpdates: 'Order Updates',
  messageNotif: 'Message Notifications',
  reviewNotif: 'Review Notifications',
  promoEmails: 'Promotional Emails',
  profileVisibility: 'Profile Visibility',
  public: 'Public',
  private: 'Private',
  showPhone: 'Show Phone Number',
  showLocation: 'Show Location',
  changePassword: 'Change Password',
  currentPassword: 'Current Password',
  newPassword: 'New Password',
  confirmPassword: 'Confirm Password',
  deleteAccount: 'Delete Account',
  deleteWarning: 'Are you sure you want to delete your account?',
  deleteDescription: 'This action cannot be undone. All your data will be permanently deleted.',
  cancel: 'Cancel',
  delete: 'Delete',
  english: 'English',
  hindi: 'Hindi',
  logOut: 'Log out',
  logOutHint: 'Sign out on this device. You can sign in again anytime.',
  profilePhoto: 'Profile photo',
  uploadPhoto: 'Upload photo',
  removePhoto: 'Remove photo',
  photoHint: 'JPG, PNG, WebP or GIF. Max 2 MB.',
  promoHint:
    'When off, you will not be included in admin announcement broadcasts in the app. Order and account messages are not affected.',
  chooseLanguage: 'Choose your preferred language',
  profileInfoDesc: 'Update your profile information',
  notificationsTabDesc: 'Manage your notification preferences',
  privacyTabDesc: 'Control your privacy settings',
  securityTabDesc: 'Update your password to keep your account secure',
  deleteZoneDesc: 'Permanently delete your account and all associated data',
  emailNotifHelp:
    'Order and account emails go to the address in Profile. The server must have SMTP configured (not only this toggle).',
  pushNotifHelp: 'Receive push notifications in browser',
  orderUpdatesHelp: 'Get notified about order status changes',
  messageNotifHelp: 'Notifications for new messages',
  reviewNotifHelp: 'Notifications for new reviews',
  promoNotifHelp: 'Receive promotional emails and offers',
  visibilityHelp: 'Control who can see your profile information',
  showPhoneHelp: 'Show your phone number on your profile',
  showLocationHelp: 'Show your location on your profile',
  passwordLengthHint: 'Password must be at least 8 characters',
};

const HI: SettingsStrings = {
  title: 'सेटिंग्स',
  subtitle: 'अपनी खाता सेटिंग्स और प्राथमिकताएं प्रबंधित करें',
  account: 'खाता',
  notifications: 'सूचनाएं',
  privacy: 'गोपनीयता',
  security: 'सुरक्षा',
  language: 'भाषा',
  profileInfo: 'प्रोफ़ाइल जानकारी',
  name: 'पूरा नाम',
  email: 'ईमेल पता',
  phone: 'फोन नंबर',
  save: 'परिवर्तन सहेजें',
  emailNotif: 'ईमेल सूचनाएं',
  pushNotif: 'पुश सूचनाएं',
  orderUpdates: 'ऑर्डर अपडेट',
  messageNotif: 'संदेश सूचनाएं',
  reviewNotif: 'समीक्षा सूचनाएं',
  promoEmails: 'प्रचार ईमेल',
  profileVisibility: 'प्रोफ़ाइल दृश्यता',
  public: 'सार्वजनिक',
  private: 'निजी',
  showPhone: 'फोन नंबर दिखाएं',
  showLocation: 'स्थान दिखाएं',
  changePassword: 'पासवर्ड बदलें',
  currentPassword: 'वर्तमान पासवर्ड',
  newPassword: 'नया पासवर्ड',
  confirmPassword: 'पासवर्ड की पुष्टि करें',
  deleteAccount: 'खाता हटाएं',
  deleteWarning: 'क्या आप वाकई अपना खाता हटाना चाहते हैं?',
  deleteDescription: 'यह क्रिया पूर्ववत नहीं की जा सकती। आपका सभी डेटा स्थायी रूप से हटा दिया जाएगा।',
  cancel: 'रद्द करें',
  delete: 'हटाएं',
  english: 'अंग्रेजी',
  hindi: 'हिंदी',
  logOut: 'लॉग आउट',
  logOutHint: 'इस डिवाइस से साइन आउट करें। आप कभी भी फिर से लॉग इन कर सकते हैं।',
  profilePhoto: 'प्रोफ़ाइल फोटो',
  uploadPhoto: 'फोटो अपलोड करें',
  removePhoto: 'फोटो हटाएं',
  photoHint: 'JPG, PNG, WebP या GIF। अधिकतम 2 MB।',
  promoHint:
    'बंद होने पर ऐप में व्यवस्थापक की घोषणा प्रसारण सूचनाओं में आप शामिल नहीं होंगे। ऑर्डर और खाता संबंधी संदेश पर असर नहीं पड़ता।',
  chooseLanguage: 'अपनी पसंदीदा भाषा चुनें',
  profileInfoDesc: 'अपनी प्रोफ़ाइल जानकारी अपडेट करें',
  notificationsTabDesc: 'अपनी सूचना प्राथमिकताएं प्रबंधित करें',
  privacyTabDesc: 'अपनी गोपनीयता सेटिंग्स नियंत्रित करें',
  securityTabDesc: 'अपना खाता सुरक्षित रखने के लिए अपना पासवर्ड अपडेट करें',
  deleteZoneDesc: 'अपना खाता और सभी संबद्ध डेटा स्थायी रूप से हटाएं',
  emailNotifHelp:
    'ऑर्डर और खाता ईमेल प्रोफ़ाइल में दिए ईमेल पर जाते हैं। सर्वर पर SMTP सेट होना चाहिए (केवल यह स्विच पर्याप्त नहीं)।',
  pushNotifHelp: 'ब्राउज़र में पुश सूचनाएं प्राप्त करें',
  orderUpdatesHelp: 'ऑर्डर स्थिति परिवर्तन के बारे में सूचना प्राप्त करें',
  messageNotifHelp: 'नए संदेशों के लिए सूचनाएं',
  reviewNotifHelp: 'नई समीक्षाओं के लिए सूचनाएं',
  promoNotifHelp: 'प्रचार ईमेल और ऑफ़र प्राप्त करें',
  visibilityHelp: 'नियंत्रित करें कि आपकी प्रोफ़ाइल जानकारी कौन देख सकता है',
  showPhoneHelp: 'अपने प्रोफ़ाइल पर अपना फोन नंबर दिखाएं',
  showLocationHelp: 'अपने प्रोफ़ाइल पर अपना स्थान दिखाएं',
  passwordLengthHint: 'पासवर्ड कम से कम 8 वर्ण होना चाहिए',
};

export function getSettingsStrings(lang: Language): SettingsStrings {
  return lang === 'hi' ? HI : EN;
}
