
const progress = new (require('./index'));

progress.startWithCluster(run);

function run(){
  let timer = 0;
  const interval = setInterval(() => {
    if (timer >= 2) {
      clearInterval(interval);
      progress.finish();
    }
    console.log('testing testing testing');
    timer ++;
  }, 500);
}
