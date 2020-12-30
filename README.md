# add-original-date-of-retweet

Add original tweet date of retweet to twitter log

## About

Current twitter archive (as of 2020) includes 'created_at' property of retweet.
However, it does not show the date of original tweet but the date of retweeting it.

This app add 'originally_created_at' property that shows the date of original tweet.

The target archive file is '(archive directory)/data/tweet.js'. Please enter a valid path to the file.

## Usage

```
$ npm run build
$ node dist/main.js <your path to tweet.js>
```
