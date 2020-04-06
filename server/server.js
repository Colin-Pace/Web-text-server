const app = require('./app.js');
const { PORT } = require('./config');


app.listen(PORT, () => {

  console.log(`Server listening at http://localhost:${PORT}`)

})
