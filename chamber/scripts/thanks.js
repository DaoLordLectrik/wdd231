//Thank You Page
const myInfo = new URLSearchParams(window.location.search);
console.log(myInfo)
document.querySelector('#results').innerHTML = `
<p>Thank you for joining Black Star Chamber of Commerce!<br>We will get back to you within 3 working days.</p>
<p>Here are the details you provided, submitted on: ${myInfo.get('timestamp')}</p>
<p>Application for ${myInfo.get('firstName')} ${myInfo.get('lastName')}, ${myInfo.get('organizationalTitle')}</p>
<p>Email address: ${myInfo.get('email')}</p>
<p>Phone number: ${myInfo.get('phone')}</p>
<p>Business Name: ${myInfo.get('businessName')}</p>`