import { authenticator } from '@otplib/preset-default';

const secret = 'MQMA6XZDEQ7T4ELV';

const token = authenticator.generate(secret);
console.log(token);