import { useEffect, useState } from "react";
import swal from "sweetalert";
import { Web3AuthMPCCoreKit, WEB3AUTH_NETWORK, UserInfo } from "@web3auth/mpc-core-kit"
import Web3 from "web3";
import "./App.css";
import { QRCode, ErrorCorrectLevel} from 'qrcode-generator-ts/js';
import { authenticator } from '@otplib/preset-default';
import axios from 'axios'
import { userInfo } from "os";
import { get } from "http";


// For demo - you'd want a secret per user
//const secret = authenticator.generateSecret();
const secret = 'MQMA6XZDEQ7T4ELV';

const uiConsole = (...args: any[]): void => {
  const el = document.querySelector("#console>p");
  if (el) {
    el.innerHTML = JSON.stringify(args || {}, null, 2);
  }
  console.log(...args);
};


function App() {
  const [coreKitInstance, setCoreKitInstance] = useState<Web3AuthMPCCoreKit | null>(null);
  const [provider, setProvider] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      // Initialization of Service Provider
      try {
        const coreKitInstance = new Web3AuthMPCCoreKit(
          {
            web3AuthClientId: 'BILuyqFCuDXAqVmAuMbD3c4oWEFd7PUENVPyVC-zmsF9euHAvUjqbTCpKw6gO05DBif1YImIVtyaxmEbcLLlb6w',
            web3AuthNetwork: WEB3AUTH_NETWORK.DEVNET,
            uxMode: 'redirect'
          })
        await coreKitInstance.init();
        setCoreKitInstance(coreKitInstance);
        if (coreKitInstance.provider) setProvider(coreKitInstance.provider);
      } catch (error) {
        console.error(error);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const submitRedirectResult = async () => {
      try {
        const provider = await coreKitInstance?.handleRedirectResult();
        if (provider) setProvider(provider);
      } catch (error) {
        if ((error as Error).message === "required more shares") {
          uiConsole("first triggered", coreKitInstance);
          recoverAccount();
        }
      }
    }
    if (coreKitInstance && window.location.hash.includes("#state")) {
      submitRedirectResult();
    }
  }, [coreKitInstance]);

  const login = async () => {
    if (!coreKitInstance) {
      uiConsole("coreKitInstance not initialized yet");
      return;
    }
    try {
      // Triggering Login using Service Provider ==> opens the popup
      const provider = await coreKitInstance.connect(
        {
          subVerifierDetails: {
            typeOfLogin: 'google',
            verifier: 'google-tkey-w3a',
            clientId:
              '774338308167-q463s7kpvja16l4l0kko3nb925ikds2p.apps.googleusercontent.com',
          }
        }
      );

      if (provider) setProvider(provider);
    } catch (error) {
      if ((error as Error).message === "required more shares") {
        uiConsole("second triggered", coreKitInstance);
        recoverAccount();
      }
      uiConsole(error);
    }
  };

  const recoverAccount = async () => {
    if (!coreKitInstance) {
      uiConsole("coreKitInstance not initialized yet", coreKitInstance);
      return;
    }
    try {

      swal({
        title: "Please enter your recovery share",
        text: "You can choose between your backup share or your security question share",
        icon: "warning",
        buttons: {
          
          totpShare: {
            text: "Enter TOTP Token",
            value: "totpShare"
          },
          resetAccount : {
            text: "CRITICAL Reset Account",
            value: "resetAccount"
          },
          cancel: true,
        },
        dangerMode: true,
      })
        .then((value) => {
          switch (value) {
            

              case "totpShare":

                swal('Enter email address', {
                  content: 'input' as any,
                }).then(async email => {


                  swal('Enter TOTP Token', {
                    content: 'input' as any,
                  }).then(async value => {
                    console.log(`TOTP Token: ${value}`);


                    let secret = await getSecret(email);
                    let isValid = authenticator.check(value, secret);
                    console.log(`Valid TOTP Token: ${isValid}`);
                    if (isValid) {
                      submitBackupShare(localStorage.getItem('totp_share') || '');
                    }
                    else {                  
                      swal('Error', 'Invalid token', 'error');
                    }
                  })
                });
                break;


              case "resetAccount":
                resetAccount();
                break;

            default:
              swal("Cannot Recover Account");
          }
        });
    } catch (error) {
      uiConsole(error);
    }
  }

 

  const submitBackupShare = async (seedPhrase: string): Promise<void> => {
    if (!coreKitInstance) {
      throw new Error("coreKitInstance is not set");
    }
    await coreKitInstance.inputBackupShare(seedPhrase);
    uiConsole('submitted');
    if (coreKitInstance.provider) setProvider(coreKitInstance.provider);
  }

  const resetAccount = async (): Promise<void> => {
    if (!coreKitInstance) {
      throw new Error("coreKitInstance is not set");
    }

    try {
      const user = coreKitInstance?.getUserInfo();
      if(user && user.email) {  
        console.log('delete user secret');
        await deleteSecret(user.email);  
      }
    } catch (error) {
      console.log('No login context to delete secret');
    }
    
    await coreKitInstance.CRITICAL_resetAccount();
    uiConsole('reset account successful');
  }

  const deleteLocalShare = async (): Promise<void> => {
    if (!coreKitInstance) {
      throw new Error("coreKitInstance is not set");
    }
    localStorage.removeItem('corekit_store');
    uiConsole('deleted');
  }
    

 

  const createTOTPShare = async (): Promise<void> => {
    if (!provider) {
      throw new Error('provider is not set.');
    }
    const share = await coreKitInstance?.exportBackupShare();
    if (!share) {
      throw new Error('share is not set.');
    } 
    localStorage.setItem('totp_share', share);
    uiConsole('totp share saved');
  }

  const checkTOTP = async (): Promise<void> => {

    const user = coreKitInstance?.getUserInfo();
    if(!user || !user.email) {  
      throw new Error('user is not set.');  
    }

    let emailRegistered = await hasSecret(user.email);
    if(!emailRegistered) {
      await swal('Error', 'Email not registered. Scan QR code or create TOTP share', 'error');
      return;
    }

    swal('Enter TOTP Token', {
      content: 'input' as any,
    }).then(async value => {

     
     
      console.log(`TOTP Token: ${value}`);

      

      let secret = await getSecret(user.email);
      let isValid = authenticator.check(value, secret);
      console.log(`Valid TOTP Token: ${isValid}`);
      uiConsole(`Valid TOTP Token: ${isValid}`);

      const token = authenticator.generate(secret);
      let localValid = authenticator.check(token, secret);
      console.log(`Valid sample TOTP Token ${token}: ${localValid}`);
    });
  }


  function createCanvas(qr : QRCode, cellSize = 2, margin = cellSize * 4) {

    var canvas = document.createElement('canvas');
    var size = qr.getModuleCount() * cellSize + margin * 2;
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    //check ctx is not null
    if (!ctx) {
      throw new Error('ctx is null');
    }

    // fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // draw cells
    ctx.fillStyle = '#000000';
    for (var row = 0; row < qr.getModuleCount(); row += 1) {
      for (var col = 0; col < qr.getModuleCount(); col += 1) {
        if (qr.isDark(row, col) ) {
          ctx.fillRect(
            col * cellSize + margin,
            row * cellSize + margin,
            cellSize, cellSize);
        }
      }
    }
    return canvas;
  }

  const getSecret = async (email: string) : Promise<string>=> {
   
    let s = await axios.get('http://localhost:4001/users/secret/' + email);
    if(s.data.length == 0|| !s.data[0].secret) {
      throw new Error('secret is not set.');
    } else {
      return s.data[0].secret;
    }
  }
  
  const hasSecret = async (email: string):Promise<boolean>  => {
    return getSecret(email)
    .then((secret) => {
      console.log('secret found')
      return true;
    })
    .catch((err) => {
      console.log('secret not found')
      return false;
    });
  }

  const storeSecret = async (email: string, secret: string) => {
    axios.put('http://localhost:4001/users/secret/' + email, {
      email: email,
      secret: secret
    })
    .then((res) => {
      console.log(`statusCode: ${res.status}`)
      console.log(res)
    })  
  };

  const deleteSecret = async (email: string) => {
    axios.delete('http://localhost:4001/users/secret/' + email)
    .then((res) => {
      console.log(`statusCode: ${res.status}`)
      console.log(res)
    });
  };

  const getOrCreateSecret = async (email:string) : Promise<string> => {
    return getSecret(email)
    .then((secret) => {
      console.log('secret found')
      return secret;
    })
    .catch( async (err) => {
      console.log('secret not found');
      let secret = authenticator.generateSecret();
      await storeSecret(email, secret);
      return secret;
    });
  };





  


  const showTOTPQRCode = async (): Promise<void> => {
    const user = coreKitInstance?.getUserInfo();
    if(!user || !user.email) {  
      throw new Error('user is not set.');  
    }

    let secret = await getOrCreateSecret(user.email);
    console.log(secret);

    let otpauth = authenticator.keyuri(
      user.email, 'w3a-sample', secret); 
    console.log('addTOTPShare');
    console.log(otpauth);

    //Display a QR code using the otpauth string
    var qr = new QRCode();
    qr.setTypeNumber(10);
    qr.setErrorCorrectLevel(ErrorCorrectLevel.L);
    qr.addData(otpauth);

    console.log("make qr code");
    qr.make();

    swal({
      title: "TOTP QR Code",  
      text: "Scan this QR code with your authenticator app",
      icon: qr.toDataURL(),   
    });
  }

  


  


 

 

  const logout = async () => {
    if (!coreKitInstance) {
      uiConsole("coreKitInstance not initialized yet");
      return;
    }
    uiConsole("Log out");
    await coreKitInstance.logout();
    setProvider(null);
  };

  const getUserInfo = () => {
    const user = coreKitInstance?.getUserInfo();
    uiConsole(user);
  };

  const getKeyDetails = () => {
    const keyDetails = coreKitInstance?.getKeyDetails();
    uiConsole(keyDetails);
  };

  const getChainID = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider);
    const chainId = await web3.eth.getChainId();
    uiConsole(chainId);
    return chainId;
  };

  const getAccounts = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider);
    const address = (await web3.eth.getAccounts())[0];
    uiConsole(address);
    return address;
  };

  const getBalance = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider);
    const address = (await web3.eth.getAccounts())[0];
    const balance = web3.utils.fromWei(
      await web3.eth.getBalance(address) // Balance is in wei
    );
    uiConsole(balance);
    return balance;
  };

  const signMessage = async (): Promise<any> => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider);
    const fromAddress = (await web3.eth.getAccounts())[0];
    const originalMessage = [
      {
        type: "string",
        name: "fullName",
        value: "Satoshi Nakamoto",
      },
      {
        type: "uint32",
        name: "userId",
        value: "1212",
      },
    ];
    const params = [originalMessage, fromAddress];
    const method = "eth_signTypedData";
    const signedMessage = await (web3.currentProvider as any)?.sendAsync({
      id: 1,
      method,
      params,
      fromAddress,
    });
    uiConsole(signedMessage);
  };

  const sendTransaction = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const web3 = new Web3(provider);
    const fromAddress = (await web3.eth.getAccounts())[0];

    const destination = "0xA30Df2957194F42D5d684FC85D5885E38AFcE685";
    const amount = web3.utils.toWei("0.0001"); // Convert 1 ether to wei

    // Submit transaction to the blockchain and wait for it to be mined
    uiConsole("Sending transaction...");
    const receipt = await web3.eth.sendTransaction({
      from: fromAddress,
      to: destination,
      value: amount,
    });
    uiConsole(receipt);
  };

  const loggedInView = (
    <>
      <h2 className="subtitle">Account Details</h2>
      <div className="flex-container">

        <button onClick={getUserInfo} className="card">
          Get User Info
        </button>
        
        <button onClick={getKeyDetails} className="card">
          Get Key Details
        </button>

        <button onClick={logout} className="card">
          Log Out
        </button>

      </div>
      <h2 className="subtitle">Recovery/ Key Manipulation</h2>
      <div className="flex-container">

        
        <button onClick={createTOTPShare} className="card">
          Create TOTP Share
        </button>
        <button onClick={showTOTPQRCode} className="card">
          Show TOTP QR Code
        </button>
        <button onClick={checkTOTP} className="card">
          Check TOTP
        </button>
       
        <button onClick={deleteLocalShare} className="card">
          Delete Local Share
        </button>
        <button onClick={resetAccount} className="card">
          CRITICAL Reset Account
        </button>

      </div>
      <h2 className="subtitle">Blockchain Calls</h2>
      <div className="flex-container">

        <button onClick={getChainID} className="card">
          Get Chain ID
        </button>

        <button onClick={getAccounts} className="card">
          Get Accounts
        </button>

        <button onClick={getBalance} className="card">
          Get Balance
        </button>

        <button onClick={signMessage} className="card">
          Sign Message
        </button>

        <button onClick={sendTransaction} className="card">
          Send Transaction
        </button>

      </div>

      <div id="console" style={{ whiteSpace: "pre-line" }}>
        <p style={{ whiteSpace: "pre-line" }}></p>
      </div>
    </>
  );

  const unloggedInView = (
    <button onClick={() => login()} className="card">
      Login
    </button>
  );

  return (
    <div className="container">
      <h1 className="title">
        <a target="_blank" href="https://web3auth.io/docs/guides/mpc" rel="noreferrer">
        Web3Auth Core Kit MPC Beta Redirect
        </a> {" "}
        & ReactJS Ethereum Example
      </h1>

      <div className="grid">{provider ? loggedInView : unloggedInView}</div>

      <footer className="footer">
        <a href="https://github.com/Web3Auth/web3auth-core-kit-examples/tree/main/tkey/tkey-mpc-beta-react-popup-example" target="_blank" rel="noopener noreferrer">
          Source code
        </a>
      </footer>
    </div>
  );
}

export default App;
