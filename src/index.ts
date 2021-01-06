import Twitter from 'twitter-lite';
import fs from 'fs';
import open from 'open';

const usage = () => {
  console.log(`Usage: 
  node dist/main.js --cousumer-key=<key> --consumer-key-secret=<secret> --callback-url=<callback url> <your path to tweet.js>
  e.g.) $ node dist/main.js /home/your-name/twitter-archive/data/tweet.js`);
}

if (process.argv.length !== 6) {
  usage();
  process.exit(1);
}

let tweet_path;
let consumer_key = '';
let consumer_key_secret = '';
let callback_url = '';

let invalid_arg = true;

for (let i = 2; i < 5; i++) {
  const arg = process.argv[i];
  const arg_array = arg.split('=');
  if (arg_array.length == 2) {
    switch (arg_array[0]) {
      case '--consumer-key':
        consumer_key = arg_array[1];
        invalid_arg = false;
        break;
      case '--consumer-key-secret':
        consumer_key_secret = arg_array[1];
        invalid_arg = false;
        break;
      case '--callback-url':
        callback_url = arg_array[1];
        invalid_arg = false;
        break;
      default:
        break;
    }
  }
}

if (invalid_arg) {
  console.error('Error: Invalid args');
  usage();
  process.exit(1);
}
tweet_path = process.argv[5];

const output_path = tweet_path.replace('tweet.js', 'retweets_with_original_date.csv');


if (!fs.existsSync(tweet_path)) {
  console.error(`Error: File not exist: ${tweet_path}`);
  usage();
  process.exit(1);
}

let tweet_str;
try {
  tweet_str = fs.readFileSync(tweet_path, 'utf-8');
}
catch {
  console.error('Error: Cannot read file');
  usage();
  process.exit(1);
}

let tweet_json: any;
try {
  // Replace assignment expression to JSON format
  const tweet_str_json = tweet_str.replace('window.YTD.tweet.part0 = ', '');
  tweet_json = JSON.parse(tweet_str_json);
}
catch {
  console.error('Error: Invalid file format');
  usage();
  process.exit(1);
}

let success = 0;
let failure = 0;

let output_data = '';

const getOriginalTweetsByAPI = async () => {

  let accessToken: any;
  const auth = async () => {
    const client = new Twitter({
      // @ts-ignore
      consumer_key: consumer_key,
      // @ts-ignore  
      consumer_secret: consumer_key_secret
    });

    const reqToken: any = await client.getRequestToken(callback_url).catch(console.error);

    open(`https://api.twitter.com/oauth/authenticate?oauth_token=${reqToken.oauth_token}`);


    function readUserInput(question: string): Promise<string> {
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise<string>((resolve, reject) => {
        readline.question(question, (answer: string) => {
          resolve(answer);
          readline.close();
        });
      });
    }

    const oauth_token = await readUserInput('Enter oauth_token: ');
    const oauth_verifier = await readUserInput('Enter oauth_verifier: ');

    accessToken = await client.getAccessToken({
      oauth_token: oauth_token,
      oauth_verifier: oauth_verifier
    }).catch(console.error);
  }
  await auth();
  // console.log(accessToken);

  const app = new Twitter({
    consumer_key: consumer_key,
    consumer_secret: consumer_key_secret,
    access_token_key: accessToken.oauth_token,
    access_token_secret: accessToken.oauth_token_secret
  });

  const getTweets = async (ids: string) => {
    const tweets = await app.get('statuses/lookup', {
      id: ids,
    }).catch(err => console.dir(err, { depth: 10 }));

    if (tweets) {
      tweets.forEach((tweet: any) => {
        const id = tweet.id_str;
        try {
          if (tweet['retweeted_status']) {
            // console.dir(tweet['retweeted_status'], { depth: 10 });

            // Calc date from id_str. 
            // tweet['retweeted_status']['created_at'] is also available.

            // Use ECMAScript2020 for BigInt
            const original_tweet_id = BigInt(tweet['retweeted_status']['id_str']);
            // console.log(`${original_tweet_id}`);
            const original_tweet_id_int = parseInt((original_tweet_id >> 22n).toString(), 10);
            const original_tweet_date = new Date(original_tweet_id_int + 1288834974657);

            const original_tweet_user = tweet['retweeted_status']['user']['screen_name'];

            let output = id + ',' + original_tweet_date.toString() + ',' + original_tweet_user + ',https://twitter.com/' + original_tweet_user + '/status/' + tweet['retweeted_status']['id_str'];
            if (tweet['retweeted_status']['entities']['media'] && tweet['retweeted_status']['entities']['media'][0]['type']) {
              const original_tweet_media = tweet['retweeted_status']['entities']['media'][0]['type'];
              output += ',' + original_tweet_media;
            }
            else {
              output += ',nomedia';
            }

            // console.log(output);

            output += '\n';

            output_data += output;

            success++;
          }
          else {
            console.log(`# Retweet does not exist in ${id}.`);
            failure++;
          }
        }
        catch {
          console.log(`# Original id does not exist in ${id}.`);
          failure++;
        }

      });
    }
  };

  const sleep = (msec: number) => new Promise(resolve => setTimeout(resolve, msec));

  let ids = '';
  let count = 0;
  for (let i = 0; i < tweet_json.length; i++) {
    const elm = tweet_json[i];
    let id = elm.tweet.id;
    let full_text = elm.tweet.full_text;
    if (full_text && full_text.startsWith('RT @')) {
      ids += id;
      count++;
      if (count % 100 === 0 || i === tweet_json.length - 1) {
        await getTweets(ids);
        console.log(count + '...');
        ids = '';
        await sleep(10000);
      }
      else {
        ids += ',';
      }
    }
    else {
      console.log('# This is not RT.');
    }
  }

  fs.writeFileSync(output_path, output_data);

  console.log(`Done.
Output: ${output_path}
Success: ${success}
Failure: ${failure}`);

};

getOriginalTweetsByAPI();


