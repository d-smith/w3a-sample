import {
    recoverTypedSignatureLegacy
} from 'eth-sig-util';

const doRecover = async (s) => {

    const originalMessage = [
        {
          type: 'string',
          name: 'Message',
          value: 'Hi, Alice!',
        },
        {
          type: 'uint32',
          name: 'A number',
          value: '1337',
        },
      ];

    const recoveredAddr = await recoverTypedSignatureLegacy({
        data: originalMessage,
        sig: s,
      });

      console.log(recoveredAddr);
    
}



await doRecover("0xcff43a27afe8f2f4f7a593ce8a6500830d2ddf1f52795a596d1341f7f6f61ebc6bb796f308390d7e59d2fcd76e4bd37e7b14bbaaf01b3d1f990b86ec255a8a731b")
await doRecover("0x28ae09bd40c68fb1f403bce570e4aa3e565807e5292b8af42767f3d3ed2c32f578b1bba5e9a33b638fc45805e54e202cd29091933d77893d65470ca9ef15c7e31")

