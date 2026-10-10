// Copy this file to config.js and fill in your Beehiiv Publication ID.
// Get it from: app.beehiiv.com → Settings → API → Publication ID
//
// Also set your GoatCounter site code (sign up free at https://goatcounter.com).
// It is the subdomain of your stats URL, e.g. "timps" for https://timps.goatcounter.com/
// Leave empty to disable analytics.
//
// Generate automatically from .env by running:
//   source .env && echo "window.BEEHIIV_PUB_ID = 'pub_${BEEHIVE_ID}'; window.GOATCOUNTER_CODE = '${GOATCOUNTER_CODE}';" > config.js
window.BEEHIIV_PUB_ID = 'pub_YOUR_ID_HERE';
window.GOATCOUNTER_CODE = '';

// Web push (optional). PUSH_API is the base URL of the notify backend
// (your Vercel deployment); VAPID_PUBLIC_KEY is the public half of your
// VAPID keypair. Both are public and safe to ship. Leave PUSH_API empty
// to turn notifications off.
window.PUSH_API = '';
window.VAPID_PUBLIC_KEY = '';
