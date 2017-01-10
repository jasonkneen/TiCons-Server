# TiCons Server

This Express app running at [http://ticons.fokkezb.nl](http://ticons.fokkezb.nl) wraps the [TiCons CLI](https://www.npmjs.com/package/ticons).

## Running it local

1. Install [ImageMagick](http://imagemagick.org/): `brew install imagemagick`.
2. Install [Node.js and NPM](https://nodejs.org/).
3. Install dependencies: `npm install`.
4. Configure the S3 bucket to use via [conf/app.js](conf/app.js) and the following environment variables (you can use a [dotenv](https://www.npmjs.com/package/dotenv)):

	```
	AWS_ACCESS_KEY_ID=ABC
	AWS_SECRET_ACCESS_KEY=ABC/DEF
	```

5. Start the server: `npm start`.

## Issues

Please report issues and features requests in the repo's [issue tracker](https://github.com/fokkezb/ticons-server/issues).

## License

Distributed under [MIT License](LICENSE).
