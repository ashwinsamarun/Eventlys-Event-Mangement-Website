module.exports = function mapEvent(doc) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    organizer: doc.organizer,
    description: doc.description,
    date: doc.date,
    time: doc.time,
    category: doc.category,
    location: doc.location,
    price: doc.price,
    img: doc.img || doc.image,
    image: doc.image || doc.img,
    capacity: doc.capacity,
    booked: doc.booked,
    status: doc.status,
  };
};