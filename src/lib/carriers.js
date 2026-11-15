export const CARRIERS = [
  { id: 'verizon', name: 'Verizon', domain: 'vtext.com', mmsDomain: 'vzwpix.com' },
  { id: 'att', name: 'AT&T', domain: 'txt.att.net', mmsDomain: 'mms.att.net' },
  { id: 'tmobile', name: 'T-Mobile', domain: 'tmomail.net', mmsDomain: 'tmomail.net' },
  { id: 'googlefi', name: 'Google Fi', domain: 'msg.fi.google.com', mmsDomain: 'msg.fi.google.com' },
  { id: 'mint', name: 'Mint Mobile', domain: 'tmomail.net', mmsDomain: 'tmomail.net' },
  { id: 'cricket', name: 'Cricket Wireless', domain: 'mms.cricketwireless.net', mmsDomain: 'mms.cricketwireless.net' },
  { id: 'boost', name: 'Boost Mobile', domain: 'myboostmobile.com', mmsDomain: 'myboostmobile.com' },
  { id: 'xfinity', name: 'Xfinity Mobile', domain: 'vtext.com', mmsDomain: 'mypixmessages.com' },
  { id: 'spectrum', name: 'Spectrum Mobile', domain: 'vtext.com', mmsDomain: 'vzwpix.com' },
  { id: 'uscellular', name: 'US Cellular', domain: 'email.uscc.net', mmsDomain: 'mms.uscc.net' },
  { id: 'straighttalk', name: 'Straight Talk', domain: 'vtext.com', mmsDomain: 'vzwpix.com' },
  { id: 'metro', name: 'Metro by T-Mobile', domain: 'mymetropcs.com', mmsDomain: 'mymetropcs.com' },
];

export function clean10DigitPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  return digits;
}

export function formatPhoneDisplay(phone) {
  if (!phone) return '';
  const digits = clean10DigitPhone(phone);
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

export function getCarrierInfo(carrierId) {
  if (!carrierId) return null;
  return CARRIERS.find(c => c.id.toLowerCase() === carrierId.toLowerCase()) || null;
}

export function getSmsEmailGateway(phone, carrierId, preferMms = true) {
  const digits = clean10DigitPhone(phone);
  if (!digits || digits.length !== 10) return null;
  const carrier = getCarrierInfo(carrierId);
  if (!carrier) return null;
  const domain = preferMms ? (carrier.mmsDomain || carrier.domain) : carrier.domain;
  return `${digits}@${domain}`;
}
