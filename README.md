# export-date-of-retweet

Export original date of retweet

## About

Current twitter archive (as of 2020) includes 'created_at' property of retweet.
However, it does not show the date of original tweet but the date of retweeting it.

This app exports the date of the original tweet from your twitter archive.

The target archive file is '(archive directory)/data/tweet.js'. Please enter a valid path to the file.
This app use Twitter API. You must prepare your 'consumer key' 'consumer key secret' 'callback url' in advance.

## Usage

```
$ npm run build
$ node dist/main.js --cousumer-key=<consumer key> --consumer-key-secret=<consumer key secret> --callback-url=<callback url> <your path to tweet.js> 
```
After you run this app from the console, <callback url> is shown on your web browser.
Please get <oauth_token> and <oauth_verifier> from the url of the shown page,
then enter them to the console.

```
Enter oauth_token:
Enter oauth_verifier: 
```

The output file is 'retweets_with_original_date.csv' in the same directory of tweet.js.


## Note

This app uses tweet.js and Twitter API, however all processing could be completed with just Twitter API.
