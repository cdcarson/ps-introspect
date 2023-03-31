// Reexport your entry components here
import { main } from './_cli/index.js';
main()
  .then(() => {
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

export default {}
