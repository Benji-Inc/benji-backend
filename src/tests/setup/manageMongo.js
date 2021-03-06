import mongoose, { Schema } from 'mongoose';

const {
  DATABASE_URI,
  NODE_ENV,
} = process.env;


const manageMongo = () => mongoose
  .connect(DATABASE_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoIndex: NODE_ENV === 'test',
    useCreateIndex: true,
  })
  .then(async Mongoose => {
    console.log('------------------------');
    console.log('Updating mongodb indexes');
    console.log('------------------------');

    console.log(`manageMongo: Mongoose connected to ${ DATABASE_URI }`);

    // Manage User indexes
    // requires 'phoneNumber' to be unique
    const UserSchema = new Schema({
      phoneNumber: { type: [String], index: true, unique: true },
    });
    const User = Mongoose.model('User', UserSchema);

    // Manage Reservation indexes
    // requires 'code' unique
    const ReservationSchema = new Schema({
      code: { type: [String], index: true, unique: true },
      position: { type: [Number], index: true, unique: true },
    });
    const Reservation = Mongoose.model('Reservation', ReservationSchema);


    const promises = [
      User.init(),
      Reservation.init(),
    ];

    return Promise.all(promises)
      .then(results => results
        .forEach(model => console.log(
          `manageMongo: Built ${ model.modelName } indexes`
        )))
      .then(() => Mongoose.disconnect())
      .then(() => console.log('manageMongo: done.'));
  })
  .catch(error => console.error(
    `mongoose connection error: ${ error.message }`
  ));



export default manageMongo;
