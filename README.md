# ancestry

## Run development/locally

```
npm install
npm run dev #compiles the code
```
In another terminal window/tab:
```
npm run start:dev #server for serving the compiled code
```

Go to the page `http://localhost:8080/dist/iframe-index.html`

## Generate production build

```
npm run build
```
Copy the dist folder to the static folder of your webserver or to your CDN.
