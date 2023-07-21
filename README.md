# Web3Auth Sample

NOTE: THIS SAMPLE BOOTSTRAPPED VIA TAKING THE CODE FROM [THIS EXAMPLE](https://github.com/Web3Auth/web3auth-core-kit-examples/tree/main/mpc-core-kit/mpc-core-kit-react-redirect-example)



This example demonstrates how to use Web3Auth's tKey MPC Beta in a React environment.



Install & Run:

```bash
npm install
# Run the server to store TOTP secrets and backup shares
node server/server.js

# Run the react app
npm run start
```

curl samples 

```bash
curl  -X PUT localhost:4001/shares/share/doug.smith.mail@gmail.com -d '{"share":"one two three"}' -H "Content-Type:application/json"
curl localhost:4001/shares/share/doug.smith.mail@gmail.com
curl -X DELETE localhost:4001/shares/share/doug.smith.mail@gmail.com
curl localhost:4001/shares/share/doug.smith.mail@gmail.com
 ```

Note the server is for demo purposes only - don't even think about using it in production, and don't emulate
this scheme for storing share backup (hint - think about how a key the server can never see can encrypt the share).

