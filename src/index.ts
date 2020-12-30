import fs from 'fs';

const usage = () => {
  console.log(`Usage: 
  node dist/main.js <your path to tweet.js>
  e.g.) $ node dist/main.js /home/yourname/twitter-archive/data/tweet.js`);
}

if (process.argv.length < 2) {
  usage();
  process.exit(1);
}

const tweet_path = process.argv[2];
if (!fs.existsSync(tweet_path)) {
  console.error('Error: File not exist');
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

let tweet_json;
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

tweet_json.forEach((elm: any) => {
  let id = elm.tweet.id;
  let range = elm.tweet.display_text_range;
  let full_text = elm.tweet.full_text;
  if (full_text && full_text.startsWith('RT @')) {
    try {
      // Use ECMAScript2020 for BigInt
      const original_tweet_id = BigInt(elm['tweet']['entities']['media'][0]['id']);
      // console.log(`${original_tweet_id}`);
      const original_tweet_id_int = parseInt((original_tweet_id >> 22n).toString(), 10);
      const original_tweet_date = new Date(original_tweet_id_int + 1288834974657);
      console.log(original_tweet_date.toString());
      success++;
    }
    catch {
      console.log(`# Original id does not exist in ${id}.`);
      failure++;
    }
  }
  else {
    console.log('# This is not RT.');
  }
});

console.log(`Done.
Success: ${success}
Failure: ${failure}`);
